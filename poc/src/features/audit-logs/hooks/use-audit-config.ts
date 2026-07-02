import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import {
  seedAccessConfig,
  seedRetentionVersions,
  seedScopeEntities,
  type AuditAccessConfig,
  type AuditScopeEntity,
  type RetentionPolicyVersion,
} from '../data/audit-config'
import { type AuditEntityType } from '../data/audit-entries'

export interface RetentionPolicyDraft {
  activeMonths: number
  totalYears: number
  effectiveFrom: string
}

export type AuditConfigStore = ReturnType<typeof useAuditConfig>

/**
 * In-memory governed configuration store for the audit module: retention
 * policy, mandatory entity/field scope, and role-based audit access. Every
 * change is versioned + effective-dated (no code deployment required) and
 * prior versions remain auditable.
 */
export function useAuditConfig() {
  /* ---------------- Retention policy (FR 6.29.3) ---------------- */
  const [policyVersions, setPolicyVersions] = useState<
    RetentionPolicyVersion[]
  >(seedRetentionVersions)

  const currentPolicy = useMemo(
    () =>
      policyVersions.find((v) => v.status === 'in-effect') ??
      policyVersions[0],
    [policyVersions]
  )

  const savePolicy = useCallback(
    (draft: RetentionPolicyDraft) => {
      const nextVersion =
        Math.max(...policyVersions.map((v) => v.version)) + 1
      const isFuture = new Date(draft.effectiveFrom) > new Date()
      const next: RetentionPolicyVersion = {
        id: `RP-${nextVersion}`,
        version: nextVersion,
        activeMonths: draft.activeMonths,
        totalYears: draft.totalYears,
        effectiveFrom: draft.effectiveFrom,
        changedBy: 'Priya Sharma (Platform Admin)',
        changedAt: new Date().toISOString(),
        status: isFuture ? 'scheduled' : 'in-effect',
      }
      setPolicyVersions((prev) => [
        next,
        ...(isFuture
          ? prev
          : prev.map((v) =>
              v.status === 'in-effect'
                ? { ...v, status: 'superseded' as const }
                : v
            )),
      ])
      toast.success(
        isFuture
          ? `Retention policy v${nextVersion} scheduled from ${draft.effectiveFrom} — prior versions remain auditable`
          : `Retention policy v${nextVersion} now in effect — the archival process reads it as its rule source`
      )
    },
    [policyVersions]
  )

  /* -------- Mandatory entity + field scope (FR 6.29.1/2) -------- */
  const [scopeEntities, setScopeEntities] =
    useState<AuditScopeEntity[]>(seedScopeEntities)

  const toggleEntityEnabled = useCallback(
    (entity: AuditEntityType) => {
      const cfg = scopeEntities.find((s) => s.entity === entity)
      if (cfg?.mandatory && cfg.enabled) {
        toast.error(
          `${entity} is a mandatory audit entity — it cannot be removed from audit scope`
        )
        return
      }
      setScopeEntities((prev) =>
        prev.map((s) =>
          s.entity === entity
            ? {
                ...s,
                enabled: !s.enabled,
                version: s.version + 1,
                effectiveFrom: new Date().toISOString().slice(0, 10),
              }
            : s
        )
      )
    },
    [scopeEntities]
  )

  const toggleScopeField = useCallback(
    (entity: AuditEntityType, fieldName: string) => {
      setScopeEntities((prev) =>
        prev.map((s) =>
          s.entity === entity
            ? {
                ...s,
                version: s.version + 1,
                effectiveFrom: new Date().toISOString().slice(0, 10),
                updatedBy: 'Priya Sharma (Platform Admin)',
                fields: s.fields.map((f) =>
                  f.name === fieldName ? { ...f, tracked: !f.tracked } : f
                ),
              }
            : s
        )
      )
      const cfg = scopeEntities.find((s) => s.entity === entity)
      const field = cfg?.fields.find((f) => f.name === fieldName)
      toast.success(
        `${entity} · ${fieldName} is now ${field?.tracked ? 'out of' : 'in'} audit scope (v${(cfg?.version ?? 0) + 1}, effective today, no code deployment)`
      )
    },
    [scopeEntities]
  )

  /* ---------- Role-based audit access (FR 6.29.5 — L2) ---------- */
  const [accessConfig, setAccessConfig] =
    useState<AuditAccessConfig>(seedAccessConfig)

  const toggleAccess = useCallback(
    (role: Role, key: 'canViewAuditTrail' | 'canViewRecordHistory') => {
      const rule = accessConfig.rules.find((r) => r.role === role)
      const nextVersion = accessConfig.version + 1
      setAccessConfig((prev) => ({
        version: prev.version + 1,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        updatedBy: 'Priya Sharma (Platform Admin)',
        rules: prev.rules.map((r) =>
          r.role === role ? { ...r, [key]: !r[key] } : r
        ),
      }))
      const label =
        key === 'canViewAuditTrail' ? 'audit trail' : 'record history'
      toast.success(
        `${role} ${rule?.[key] ? 'revoked from' : 'granted'} ${label} access — config v${nextVersion}, effective immediately`
      )
    },
    [accessConfig]
  )

  const canView = useCallback(
    (role: Role, key: 'canViewAuditTrail' | 'canViewRecordHistory') =>
      accessConfig.rules.find((r) => r.role === role)?.[key] ?? false,
    [accessConfig]
  )

  return {
    policyVersions,
    currentPolicy,
    savePolicy,
    scopeEntities,
    toggleEntityEnabled,
    toggleScopeField,
    accessConfig,
    toggleAccess,
    canView,
  }
}
