import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import {
  seedAdConfig,
  seedCompanySecurity,
  seedJobs,
  seedSupportTeams,
  type AdConfig,
  type CompanySecurity,
  type JobRecipient,
  type PasswordPolicy,
  type ScheduledJob,
  type SupportTeam,
} from '../data/security-config'
import { companyName } from '../data/directory'
import type { AuditAppendInput } from './use-security-audit'

interface UseSecurityConfigOptions {
  append: (input: AuditAppendInput) => void
  actor: string
  actorRole: Role
}

/**
 * Company-scoped authentication configuration — MFA (RSEC-08), password
 * policy (RSEC-24 … RSEC-29), Active Directory (RSEC-30 … RSEC-32) — plus
 * scheduled jobs (RSEC-37, RSEC-38) and support teams (RSEC-39).
 */
export function useSecurityConfig({
  append,
  actor,
  actorRole,
}: UseSecurityConfigOptions) {
  const [companySecurity, setCompanySecurity] = useState<CompanySecurity[]>(
    seedCompanySecurity
  )
  const [adConfig, setAdConfig] = useState<AdConfig>(seedAdConfig)
  const [jobs, setJobs] = useState<ScheduledJob[]>(seedJobs)
  const [supportTeams, setSupportTeams] =
    useState<SupportTeam[]>(seedSupportTeams)

  const securityFor = useCallback(
    (companyId: string): CompanySecurity | undefined =>
      companySecurity.find((c) => c.companyId === companyId),
    [companySecurity]
  )

  /** RSEC-08: MFA applies to one company only. */
  const setMfa = useCallback(
    (companyId: string, enabled: boolean) => {
      setCompanySecurity((prev) =>
        prev.map((c) =>
          c.companyId === companyId ? { ...c, mfaEnabled: enabled } : c
        )
      )
      append({
        category: 'Config',
        actor,
        actorRole,
        target: 'MFA policy',
        detail: `MFA ${enabled ? 'enabled' : 'disabled'} for ${companyName(companyId)} — other companies unaffected`,
        targetCompanyId: companyId,
      })
      toast.success(
        `MFA ${enabled ? 'enabled' : 'disabled'} for ${companyName(companyId)} only`
      )
    },
    [append, actor, actorRole]
  )

  /** RSEC-24 … RSEC-29: password policy applies going forward, per company. */
  const savePasswordPolicy = useCallback(
    (companyId: string, policy: PasswordPolicy) => {
      setCompanySecurity((prev) =>
        prev.map((c) =>
          c.companyId === companyId ? { ...c, passwordPolicy: policy } : c
        )
      )
      append({
        category: 'Config',
        actor,
        actorRole,
        target: 'Password policy',
        detail: `Password policy updated for ${companyName(companyId)}`,
        targetCompanyId: companyId,
      })
      toast.success(
        `Password policy saved — applies going forward to ${companyName(companyId)} users only`
      )
    },
    [append, actor, actorRole]
  )

  /** RSEC-30 … RSEC-32: Manage Active Directory (company-scoped). */
  const saveAdConfig = useCallback(
    (patch: Partial<Omit<AdConfig, 'companyId'>>) => {
      setAdConfig((prev) => ({ ...prev, ...patch }))
      append({
        category: 'Config',
        actor,
        actorRole,
        target: 'Active Directory',
        detail: 'Active Directory configuration saved',
        targetCompanyId: adConfig.companyId,
      })
      toast.success('Active Directory configuration saved')
    },
    [append, actor, actorRole, adConfig.companyId]
  )

  /** RSEC-37: enable/disable scheduled background jobs. */
  const toggleJob = useCallback(
    (jobId: string, enabled: boolean) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, enabled } : j))
      )
      const job = jobs.find((j) => j.id === jobId)
      append({
        category: 'Job',
        actor,
        actorRole,
        target: job?.name ?? jobId,
        detail: `Scheduled job ${enabled ? 'enabled' : 'disabled'}`,
      })
      toast.success(`${job?.name ?? 'Job'} ${enabled ? 'scheduled' : 'unscheduled'}`)
    },
    [append, actor, actorRole, jobs]
  )

  /** RSEC-38: notification recipients per job. */
  const addJobRecipient = useCallback(
    (jobId: string, recipient: JobRecipient) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId &&
          !j.recipients.some(
            (r) => r.kind === recipient.kind && r.name === recipient.name
          )
            ? { ...j, recipients: [...j.recipients, recipient] }
            : j
        )
      )
      toast.success(`${recipient.name} will be notified of job outcomes`)
    },
    []
  )

  const removeJobRecipient = useCallback(
    (jobId: string, recipient: JobRecipient) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                recipients: j.recipients.filter(
                  (r) =>
                    !(r.kind === recipient.kind && r.name === recipient.name)
                ),
              }
            : j
        )
      )
      toast.success(`${recipient.name} removed — they will no longer be notified`)
    },
    []
  )

  /** RSEC-37: recycle the application so schedule changes take effect. */
  const resetIis = useCallback(() => {
    append({
      category: 'Job',
      actor,
      actorRole,
      target: 'Application pool',
      detail: 'IIS reset requested — application recycled to apply job schedules',
    })
    toast.success('IIS reset triggered — the application recycled and job schedules are now in effect')
  }, [append, actor, actorRole])

  /** RSEC-39: support team directory. */
  const addSupportTeam = useCallback((team: Omit<SupportTeam, 'id'>) => {
    setSupportTeams((prev) => [
      { ...team, id: `st-${crypto.randomUUID().slice(0, 8)}` },
      ...prev,
    ])
    toast.success(`Support team "${team.name}" added`)
  }, [])

  return {
    companySecurity,
    securityFor,
    setMfa,
    savePasswordPolicy,
    adConfig,
    saveAdConfig,
    jobs,
    toggleJob,
    addJobRecipient,
    removeJobRecipient,
    resetIis,
    supportTeams,
    addSupportTeam,
  }
}

export type SecurityConfigStore = ReturnType<typeof useSecurityConfig>
