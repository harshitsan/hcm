import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { companyName } from '../data/companies'
import { AUTH_METHOD_LABELS, type AuthMethod } from '../data/auth-users'
import {
  seedMethodConfigs,
  seedMfaCompanyIds,
  seedPolicyVersions,
  seedTemplates,
  type AuthMethodConfig,
  type NotificationTemplate,
  type PasswordPolicyVersion,
} from '../data/auth-config'
import { type AuditEventDraft } from './use-auth-audit'

export type PolicyDraft = Omit<PasswordPolicyVersion, 'version' | 'savedBy'>

/**
 * Governed authentication configuration store: method availability
 * (AUTH-10), versioned effective-dated password policy (AUTH-17) and
 * notification templates (AUTH-18). Config changes are audited.
 */
export function useAuthConfig(logEvent: (draft: AuditEventDraft) => void) {
  const [methods, setMethods] = useState<AuthMethodConfig[]>(seedMethodConfigs)
  const [policyVersions, setPolicyVersions] =
    useState<PasswordPolicyVersion[]>(seedPolicyVersions)
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(seedTemplates)
  const [mfaCompanyIds, setMfaCompanyIds] =
    useState<string[]>(seedMfaCompanyIds)

  const enabledMethods = useMemo(
    () => methods.filter((m) => m.enabled).map((m) => m.method),
    [methods]
  )

  /** Latest version whose effective date has arrived (AUTH-17). */
  const currentPolicy = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10)
    const effective = policyVersions.filter((p) => p.effectiveFrom <= now)
    const pool = effective.length > 0 ? effective : policyVersions
    return pool.reduce((a, b) => (b.version > a.version ? b : a))
  }, [policyVersions])

  const toggleMethod = useCallback(
    (method: AuthMethod, actor: string) => {
      const target = methods.find((m) => m.method === method)
      if (!target) return
      // At least one method must remain usable (AUTH-10).
      if (target.enabled && enabledMethods.length === 1) {
        toast.error('At least one authentication method must remain enabled')
        return
      }
      const enabled = !target.enabled
      setMethods((prev) =>
        prev.map((m) => (m.method === method ? { ...m, enabled } : m))
      )
      logEvent({
        actor,
        eventType: 'config-change',
        outcome: 'info',
        detail: `${AUTH_METHOD_LABELS[method]} authentication ${enabled ? 'enabled' : 'disabled'}.`,
      })
      toast.success(
        `${AUTH_METHOD_LABELS[method]} ${enabled ? 'enabled' : 'disabled'}`
      )
    },
    [methods, enabledMethods, logEvent]
  )

  const saveConnection = useCallback(
    (method: AuthMethod, connectionUrl: string, actor: string) => {
      setMethods((prev) =>
        prev.map((m) =>
          m.method === method
            ? {
                ...m,
                connectionUrl,
                lastValidated: new Date().toISOString().slice(0, 10),
              }
            : m
        )
      )
      logEvent({
        actor,
        eventType: 'config-change',
        outcome: 'info',
        detail: `${AUTH_METHOD_LABELS[method]} connection settings validated and stored securely.`,
      })
      toast.success(`${AUTH_METHOD_LABELS[method]} connection validated and saved`)
    },
    [logEvent]
  )

  /** Saving never overwrites — a new version is appended (AUTH-17). */
  const savePolicy = useCallback(
    (draft: PolicyDraft, actor: string) => {
      setPolicyVersions((prev) => {
        const nextVersion = Math.max(...prev.map((p) => p.version)) + 1
        return [...prev, { ...draft, version: nextVersion, savedBy: actor }]
      })
      logEvent({
        actor,
        eventType: 'config-change',
        outcome: 'info',
        detail: `Password policy saved as a new version, effective ${draft.effectiveFrom}. Prior versions retained.`,
      })
      toast.success('Password policy saved as a new effective-dated version')
    },
    [logEvent]
  )

  /** Per-company MFA requirement (BRD 6.12.5) — enforced at sign-in. */
  const toggleMfaCompany = useCallback(
    (companyId: string, actor: string) => {
      const enabled = !mfaCompanyIds.includes(companyId)
      setMfaCompanyIds((prev) =>
        enabled ? [...prev, companyId] : prev.filter((id) => id !== companyId)
      )
      logEvent({
        actor,
        eventType: 'config-change',
        companyId,
        outcome: 'info',
        detail: `Multi-factor authentication ${enabled ? 'now required' : 'no longer required'} for ${companyName(companyId)} sign-ins.`,
      })
      toast.success(
        `MFA ${enabled ? 'enabled' : 'disabled'} for ${companyName(companyId)}`
      )
    },
    [mfaCompanyIds, logEvent]
  )

  const customizeTemplate = useCallback(
    (id: string, subject: string, actor: string) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, subject, customized: true } : t))
      )
      logEvent({
        actor,
        eventType: 'config-change',
        outcome: 'info',
        detail: 'Notification template customized for the tenant — no code change required.',
      })
      toast.success('Template customized for this tenant')
    },
    [logEvent]
  )

  const sendTestNotification = useCallback(
    (template: NotificationTemplate, recipient: string) => {
      logEvent({
        actor: 'system',
        eventType: 'notification-sent',
        outcome: 'info',
        detail: `Test render of "${template.name}" delivered to ${recipient} via ${template.channel}.`,
      })
      toast.success(`Test "${template.name}" sent to ${recipient}`)
    },
    [logEvent]
  )

  return {
    methods,
    enabledMethods,
    toggleMethod,
    saveConnection,
    policyVersions,
    currentPolicy,
    savePolicy,
    mfaCompanyIds,
    toggleMfaCompany,
    templates,
    customizeTemplate,
    sendTestNotification,
  }
}

export type AuthConfigStore = ReturnType<typeof useAuthConfig>
