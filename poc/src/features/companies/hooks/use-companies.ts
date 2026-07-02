import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import {
  MY_COMPANY_ID,
  MY_GROUP_ID,
  MY_PORTFOLIO_ID,
  STATUS_TRANSITIONS,
  SUPPORTED_JURISDICTIONS,
  nextCompanyCode,
  seedCompanies,
  type Company,
  type CompanyConfig,
  type CompanyJurisdiction,
  type CompanyStatus,
  type ModuleName,
} from '../data/companies'
import {
  seedAuditEvents,
  seedHistory,
  type AuditEvent,
  type AuditEventType,
  type HistoryEntry,
} from '../data/records'

export type CompanyDraft = Omit<
  Company,
  'id' | 'code' | 'createdAt' | 'retentionEndsOn' | 'archivalFeeMonthly'
>

let uid = 0
const nextId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 6)}-${uid++}`

const today = () => new Date().toISOString().slice(0, 10)
const now = () => new Date().toISOString()

/**
 * In-memory companies store — companies + audit trail + bitemporal history.
 * Stands in for the tenancy API while the backend is disabled.
 */
export function useCompanies(actor: string) {
  const [companies, setCompanies] = useState<Company[]>(seedCompanies)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(seedAuditEvents)
  const [history, setHistory] = useState<HistoryEntry[]>(seedHistory)

  const logAudit = useCallback(
    (
      type: AuditEventType,
      company: Pick<Company, 'id' | 'legalName'>,
      details: string,
      outcome: 'success' | 'denied' = 'success'
    ) => {
      setAuditEvents((prev) => [
        {
          id: nextId('ae'),
          type,
          companyId: company.id,
          companyName: company.legalName,
          actor,
          timestamp: now(),
          details,
          outcome,
        },
        ...prev,
      ])
    },
    [actor]
  )

  const addHistory = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'changedBy' | 'changedAt'>) => {
      setHistory((prev) => [
        { ...entry, id: nextId('h'), changedBy: actor, changedAt: now() },
        ...prev,
      ])
    },
    [actor]
  )

  /** COMP-FR-001/004 — create + automatic tenant provisioning. */
  const createCompany = useCallback(
    (draft: CompanyDraft, asDraft: boolean): Company => {
      const company: Company = {
        ...draft,
        id: nextId('c'),
        code: nextCompanyCode(companies, new Date().getFullYear()),
        status: asDraft ? 'draft' : 'active',
        createdAt: today(),
        retentionEndsOn: null,
        archivalFeeMonthly: null,
      }
      setCompanies((prev) => [company, ...prev])
      logAudit(
        'COMPANY_CREATED',
        company,
        asDraft
          ? `Company saved as Draft (${company.code}).`
          : `Company created (${company.code}). Tenant schema created, default security policies initialized${
              company.adminEmail
                ? `, admin user ${company.adminEmail} created and welcome email sent`
                : ''
            }.`
      )
      return company
    },
    [companies, logAudit]
  )

  /**
   * COMP-FR-008 — profile edits, blocked on suspended (COMP_004) / inactive
   * (COMP_005). Writes a history entry per changed field (COMP-FR-009).
   */
  const updateCompany = useCallback(
    (
      id: string,
      patch: Partial<Company>,
      opts?: { effectiveDate?: string; reason?: string }
    ): { ok: boolean; error?: string } => {
      const company = companies.find((c) => c.id === id)
      if (!company) return { ok: false, error: 'COMP_003 — company not found' }
      if (company.status === 'suspended')
        return {
          ok: false,
          error: 'COMP_004 (403) — company is suspended; modification blocked',
        }
      if (company.status === 'inactive' || company.status === 'archived')
        return {
          ok: false,
          error: 'COMP_005 (409) — company is inactive; modification blocked',
        }

      const changed: string[] = []
      ;(Object.keys(patch) as (keyof Company)[]).forEach((key) => {
        const oldVal = company[key]
        const newVal = patch[key]
        if (
          typeof newVal !== 'object' &&
          typeof oldVal !== 'object' &&
          oldVal !== newVal
        ) {
          changed.push(String(key))
          addHistory({
            companyId: id,
            kind: 'profile',
            field: String(key),
            oldValue: String(oldVal ?? '—'),
            newValue: String(newVal ?? '—'),
            effectiveDate: opts?.effectiveDate ?? today(),
            reason: opts?.reason ?? null,
          })
        }
      })

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      )
      if (changed.length > 0)
        logAudit(
          'COMPANY_UPDATED',
          company,
          `Fields changed: ${changed.join(', ')}${opts?.reason ? `. Reason: ${opts.reason}` : ''}`
        )
      return { ok: true }
    },
    [companies, addHistory, logAudit]
  )

  /** COMP-FR-010 — state machine transition with audit + history. */
  const transitionStatus = useCallback(
    (
      id: string,
      next: CompanyStatus,
      reason: string
    ): { ok: boolean; error?: string } => {
      const company = companies.find((c) => c.id === id)
      if (!company) return { ok: false, error: 'COMP_003 — company not found' }
      if (!STATUS_TRANSITIONS[company.status].includes(next))
        return {
          ok: false,
          error: `Invalid transition ${company.status} → ${next} rejected by the lifecycle state machine`,
        }

      const patch: Partial<Company> = { status: next }
      if (next === 'inactive') {
        const retention = new Date()
        retention.setFullYear(retention.getFullYear() + 7)
        patch.retentionEndsOn = retention.toISOString().slice(0, 10)
        patch.archivalFeeMonthly = Math.max(
          100,
          Math.round(company.employeeLimit * 0.5)
        )
      }
      if (next === 'archived') patch.archivalFeeMonthly = null

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      )
      addHistory({
        companyId: id,
        kind: 'lifecycle',
        field: 'status',
        oldValue: company.status,
        newValue: next,
        effectiveDate: today(),
        reason,
      })
      logAudit(
        'COMPANY_STATUS_CHANGED',
        company,
        `${company.status} → ${next}. Reason: ${reason}`
      )
      return { ok: true }
    },
    [companies, addHistory, logAudit]
  )

  /** FR 6.2.3 — add jurisdiction; unsupported → COMP_002. */
  const addJurisdiction = useCallback(
    (
      id: string,
      jurisdiction: string,
      effectiveDate: string,
      expiryDate: string | null
    ): { ok: boolean; error?: string } => {
      const company = companies.find((c) => c.id === id)
      if (!company) return { ok: false, error: 'COMP_003 — company not found' }
      if (!(SUPPORTED_JURISDICTIONS as readonly string[]).includes(jurisdiction))
        return {
          ok: false,
          error: `COMP_002 (400) — "${jurisdiction}" is not a supported jurisdiction`,
        }
      if (company.jurisdictions.some((j) => j.jurisdiction === jurisdiction))
        return {
          ok: false,
          error: `${jurisdiction} is already configured for this company`,
        }
      const entry: CompanyJurisdiction = {
        id: nextId('j'),
        jurisdiction,
        isPrimary: company.jurisdictions.length === 0,
        effectiveDate,
        expiryDate,
        employeeCount: 0,
      }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, jurisdictions: [...c.jurisdictions, entry] } : c
        )
      )
      logAudit(
        'COMPANY_UPDATED',
        company,
        `Jurisdiction added: ${jurisdiction} (effective ${effectiveDate})`
      )
      return { ok: true }
    },
    [companies, logAudit]
  )

  /** Exactly one primary jurisdiction (IsPrimary). */
  const setPrimaryJurisdiction = useCallback(
    (id: string, jurisdictionId: string) => {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                jurisdictions: c.jurisdictions.map((j) => ({
                  ...j,
                  isPrimary: j.id === jurisdictionId,
                })),
              }
            : c
        )
      )
    },
    []
  )

  /** COMP-FR-008 — cannot remove a jurisdiction with employees assigned. */
  const removeJurisdiction = useCallback(
    (id: string, jurisdictionId: string): { ok: boolean; error?: string } => {
      const company = companies.find((c) => c.id === id)
      const j = company?.jurisdictions.find((x) => x.id === jurisdictionId)
      if (!company || !j)
        return { ok: false, error: 'COMP_003 — record not found' }
      if (j.employeeCount > 0)
        return {
          ok: false,
          error: `Cannot remove ${j.jurisdiction}: ${j.employeeCount} employees are assigned to it`,
        }
      if (j.isPrimary)
        return { ok: false, error: 'Cannot remove the primary jurisdiction' }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                jurisdictions: c.jurisdictions.filter(
                  (x) => x.id !== jurisdictionId
                ),
              }
            : c
        )
      )
      return { ok: true }
    },
    [companies]
  )

  /** COMP-FR-014/016 — governed config: version++, audit, history. */
  const updateConfig = useCallback(
    (id: string, patch: Partial<CompanyConfig>, summary: string) => {
      const company = companies.find((c) => c.id === id)
      if (!company) return
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                config: { ...c.config, ...patch, version: c.config.version + 1 },
              }
            : c
        )
      )
      addHistory({
        companyId: id,
        kind: 'config',
        field: 'configuration',
        oldValue: `v${company.config.version}`,
        newValue: `v${company.config.version + 1}`,
        effectiveDate: today(),
        reason: summary,
      })
      logAudit(
        'CONFIG_CHANGED',
        company,
        `${summary}. Config v${company.config.version} → v${company.config.version + 1}. Effective immediately; applies to new transactions only.`
      )
    },
    [companies, addHistory, logAudit]
  )

  /** CMP-18 — versioned, effective-dated module toggle. */
  const toggleModule = useCallback(
    (id: string, module: ModuleName) => {
      const company = companies.find((c) => c.id === id)
      if (!company) return
      const nextVal = !company.config.modules[module]
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                config: {
                  ...c.config,
                  modules: { ...c.config.modules, [module]: nextVal },
                  modulesVersion: c.config.modulesVersion + 1,
                  modulesEffectiveDate: today(),
                },
              }
            : c
        )
      )
      logAudit(
        'CONFIG_CHANGED',
        company,
        `Module "${module}" ${nextVal ? 'enabled' : 'disabled'} (modules config v${company.config.modulesVersion} → v${company.config.modulesVersion + 1}, effective ${today()}). No code deployment required.`
      )
      toast.success(
        `${module} ${nextVal ? 'enabled' : 'disabled'} — modules config v${company.config.modulesVersion + 1}`
      )
    },
    [companies, logAudit]
  )

  /** §8.1 — COMPANY_ACCESSED whenever a detail screen is opened. */
  const recordAccess = useCallback(
    (company: Company) => {
      logAudit(
        'COMPANY_ACCESSED',
        company,
        'Company detail viewed (profile, jurisdictions, configuration).'
      )
    },
    [logAudit]
  )

  /** FR 6.2.6 — full tenant-scoped export; returns a fake checksum. */
  const exportCompany = useCallback(
    (company: Company, context: string): string => {
      const checksum = `sha256:${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
      logAudit(
        'EXPORT_GENERATED',
        company,
        `${context}. Package: full dataset (JSON/CSV) + audit logs + documents, scoped to ${company.code} only. Checksum ${checksum}.`
      )
      return checksum
    },
    [logAudit]
  )

  /** §7.2 — simulated cross-tenant access attempt, always denied + logged. */
  const simulateCrossTenantAccess = useCallback(
    (company: Company) => {
      logAudit(
        'CROSS_COMPANY_ACCESS',
        company,
        `JWT company claim did not match requested company ${company.code}. Rejected with AUTH_001 (403).`,
        'denied'
      )
      toast.error(
        'AUTH_001 (403 Forbidden) — request company does not match your token’s company claim. Attempt logged.'
      )
    },
    [logAudit]
  )

  return {
    companies,
    auditEvents,
    history,
    createCompany,
    updateCompany,
    transitionStatus,
    addJurisdiction,
    setPrimaryJurisdiction,
    removeJurisdiction,
    updateConfig,
    toggleModule,
    recordAccess,
    exportCompany,
    simulateCrossTenantAccess,
  }
}

export type CompaniesStore = ReturnType<typeof useCompanies>

/**
 * §7.1/§7.2 — role-scoped visibility. Every "query" is filtered by the
 * active role's company context; companies outside scope simply don't exist.
 */
export function scopeCompanies(companies: Company[], role: Role): Company[] {
  switch (role) {
    case 'Platform Admin':
      return companies
    case 'Group Company Admin':
      return companies.filter((c) => c.groupId === MY_GROUP_ID)
    case 'Portfolio Admin':
      return companies.filter((c) => c.portfolioId === MY_PORTFOLIO_ID)
    case 'Company Admin':
      return companies.filter((c) => c.id === MY_COMPANY_ID)
    default:
      return []
  }
}

/** §7.1 — edit levels per role. */
export function editLevel(
  company: Company,
  role: Role
): 'full' | 'limited' | 'none' {
  if (role === 'Platform Admin') return 'full'
  if (role === 'Company Admin' && company.id === MY_COMPANY_ID) return 'full'
  if (role === 'Group Company Admin' && company.groupId === MY_GROUP_ID)
    return 'limited'
  if (role === 'Portfolio Admin' && company.portfolioId === MY_PORTFOLIO_ID)
    return 'limited'
  return 'none'
}
