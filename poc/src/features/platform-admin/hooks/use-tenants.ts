import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedGroups,
  seedJurisdictions,
  seedPlatformLog,
  seedPortfolios,
  seedSharingRequests,
  seedTenants,
  type CompanyGroup,
  type Jurisdiction,
  type PlatformLogEntry,
  type SharingRequest,
  type Tenant,
  type TenantStatus,
} from '../data/tenants'

export type TenantDraft = Omit<
  Tenant,
  'id' | 'createdAt' | 'employees' | 'authorized'
>

/**
 * In-memory tenant provisioning store (SYS-01, 03, 04, 05, 08, 09, 13, 40,
 * 48, 49). Companies, the jurisdictions catalog, portfolios, groups,
 * cross-company sharing requests and the platform activity log.
 */
export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants)
  const [jurisdictions, setJurisdictions] =
    useState<Jurisdiction[]>(seedJurisdictions)
  const [groups, setGroups] = useState<CompanyGroup[]>(seedGroups)
  const [sharingRequests, setSharingRequests] =
    useState<SharingRequest[]>(seedSharingRequests)
  const [platformLog, setPlatformLog] =
    useState<PlatformLogEntry[]>(seedPlatformLog)
  const [activeCompanyId, setActiveCompanyId] = useState('co-01')
  const portfolios = seedPortfolios

  const log = useCallback(
    (kind: PlatformLogEntry['kind'], message: string, tenantId?: string) => {
      setPlatformLog((prev) => [
        {
          id: `log-${crypto.randomUUID().slice(0, 8)}`,
          tenantId: tenantId ?? null,
          kind,
          message,
          at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
        ...prev,
      ])
    },
    []
  )

  const addTenant = useCallback(
    (draft: TenantDraft) => {
      const tenant: Tenant = {
        ...draft,
        id: `co-${crypto.randomUUID().slice(0, 6)}`,
        employees: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        authorized: true,
      }
      setTenants((prev) => [tenant, ...prev])
      log(
        'provisioned',
        `Tenant ${draft.code} provisioned with ${draft.jurisdictionIds.length} jurisdiction(s)`,
        tenant.id
      )
      toast.success(`${draft.name} provisioned as a new tenant`)
    },
    [log]
  )

  const updateTenant = useCallback((id: string, draft: TenantDraft) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
    )
    toast.success('Company updated')
  }, [])

  const setTenantStatus = useCallback(
    (id: string, status: TenantStatus) => {
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      )
      const tenant = tenants.find((t) => t.id === id)
      log('status', `Tenant status changed to ${status}`, id)
      toast.success(
        `${tenant?.name ?? 'Tenant'} ${status === 'suspended' ? 'suspended' : 'reactivated'}`
      )
    },
    [tenants, log]
  )

  const addJurisdiction = useCallback(
    (code: string, name: string) => {
      const jur: Jurisdiction = {
        id: `jur-${crypto.randomUUID().slice(0, 6)}`,
        code,
        name,
        rulePack: `${code} v1.0`,
        status: 'available',
      }
      setJurisdictions((prev) => [...prev, jur])
      log('config', `Jurisdiction ${code} added to the platform catalog`)
      toast.success(`${name} is now available for company setup`)
    },
    [log]
  )

  /** Single-login context switch — no re-authentication (SYS-04, 40). */
  const switchCompany = useCallback(
    (id: string) => {
      const tenant = tenants.find((t) => t.id === id)
      if (!tenant) return
      if (!tenant.authorized) {
        log('denial', `Context switch to ${tenant.code} denied — outside authorization`, id)
        toast.error(`Access denied — ${tenant.name} is outside your authorization`)
        return
      }
      setActiveCompanyId(id)
      toast.success(
        `Switched to ${tenant.name} — no re-authentication required`
      )
    },
    [tenants, log]
  )

  const updateGroup = useCallback(
    (id: string, patch: Partial<Omit<CompanyGroup, 'id' | 'name'>>) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
      )
      toast.success('Group governance updated')
    },
    []
  )

  const resolveSharing = useCallback(
    (id: string, status: 'approved' | 'denied') => {
      setSharingRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
      toast.success(
        status === 'approved'
          ? 'Cross-company sharing approved'
          : 'Cross-company sharing denied'
      )
    },
    []
  )

  return {
    tenants,
    jurisdictions,
    portfolios,
    groups,
    sharingRequests,
    platformLog,
    activeCompanyId,
    addTenant,
    updateTenant,
    setTenantStatus,
    addJurisdiction,
    switchCompany,
    updateGroup,
    resolveSharing,
    log,
  }
}

export type TenantsStore = ReturnType<typeof useTenants>
