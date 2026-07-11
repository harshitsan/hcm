import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import { seedFieldCatalog, type AdhocFieldKey } from '../data/builder'
import { seedTemplates, type TemplateVersion } from '../data/compliance'
import { type DashboardLayout } from '../data/dashboards'
import { seedRoleDashboards, type AccessGrant } from '../data/governance'
import { seedReportCatalog } from '../data/report-catalog'
import { updateGrantStatus, useGrants } from './use-grants'

const TODAY = '2026-07-02'

/**
 * In-memory governed-config store: per-tenant report catalog, field metadata,
 * role→dashboard defaults, RLS grants and statutory template versions
 * (RPT-20 … RPT-23). Stands in for versioned platform config.
 */
export function useReportConfig() {
  const [reports, setReports] = useState(seedReportCatalog)
  const [fields, setFields] = useState(seedFieldCatalog)
  const [roleDashboards, setRoleDashboards] = useState(seedRoleDashboards)
  // Live module-level RLS grant table — actual report scoping reads this
  // same store, so revoke/restore here changes what runs return (RPT-20).
  const grants = useGrants()
  const [templates, setTemplates] = useState<TemplateVersion[]>(seedTemplates)

  /** Enable/disable a standard report in the tenant catalog (RPT-22). */
  const toggleReport = (id: string) => {
    const target = reports.find((r) => r.id === id)
    if (!target) return
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
    toast.success(
      target.enabled
        ? `${target.name} removed from the tenant catalog`
        : `${target.name} enabled for the tenant catalog`
    )
  }

  /** Show/hide a metadata field in the ad hoc builder (RPT-23). */
  const toggleField = (key: AdhocFieldKey) => {
    const target = fields.find((f) => f.key === key)
    if (!target) return
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, visible: !f.visible } : f))
    )
    toast.success(
      target.visible
        ? `${target.label} hidden from the report builder`
        : `${target.label} now selectable in the report builder`
    )
  }

  /** Remap a role's default dashboard — versioned + effective-dated (RPT-22). */
  const setRoleDashboard = useCallback(
    (role: Role, layout: DashboardLayout) => {
      setRoleDashboards((prev) =>
        prev.map((m) =>
          m.role === role
            ? { role, layout, version: m.version + 1, effectiveFrom: TODAY }
            : m
        )
      )
      toast.success(
        `${role} default dashboard set to “${layout}” (applies on next login)`
      )
    },
    []
  )

  /** Revoke or restore an RLS company-access grant (RPT-20). */
  const setGrantStatus = useCallback(
    (id: string, status: AccessGrant['status']) => {
      updateGrantStatus(id, status)
      toast.success(
        status === 'revoked'
          ? 'Grant revoked — subsequent report runs exclude these rows'
          : 'Grant restored — its companies are back in scope for report runs'
      )
    },
    []
  )

  /** Publish a new statutory template version via config (RPT-21). */
  const publishTemplate = useCallback(
    (register: TemplateVersion['register'], note: string) => {
      setTemplates((prev) => {
        const latest = prev
          .filter((t) => t.register === register)
          .reduce((max, t) => Math.max(max, t.version), 0)
        const next: TemplateVersion = {
          id: `tpl-${crypto.randomUUID().slice(0, 8)}`,
          register,
          version: latest + 1,
          effectiveFrom: TODAY,
          status: 'active',
          note,
        }
        return [
          next,
          ...prev.map((t) =>
            t.register === register && t.status === 'active'
              ? { ...t, status: 'superseded' as const }
              : t
          ),
        ]
      })
      toast.success(
        `${register} template published — applies to periods from ${TODAY} without a code change`
      )
    },
    []
  )

  return {
    reports,
    toggleReport,
    fields,
    toggleField,
    roleDashboards,
    setRoleDashboard,
    grants,
    setGrantStatus,
    templates,
    publishTemplate,
  }
}

export type ReportConfigStore = ReturnType<typeof useReportConfig>
