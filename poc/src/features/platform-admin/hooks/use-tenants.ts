import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedGroups,
  seedJurisdictions,
  seedPlatformLog,
  seedPortfolios,
  seedSharingRequests,
  seedTenants,
  TIER_DEFAULTS,
  type CompanyGroup,
  type Jurisdiction,
  type PlatformLogEntry,
  type PlatformModule,
  type SharingRequest,
  type SubscriptionTier,
  type Tenant,
} from '../data/tenants'

/** Full provisioning payload — produced by the 6-step tenant wizard. */
export type TenantDraft = Omit<
  Tenant,
  'id' | 'createdAt' | 'employees' | 'authorized' | 'suspension'
>

/** Edit payload — subscription is managed separately (US-PA-42..44). */
export type TenantEditDraft = Omit<TenantDraft, 'subscription'>

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
        suspension: null,
      }
      setTenants((prev) => [tenant, ...prev])
      log(
        'provisioned',
        `Tenant ${draft.code} provisioned — ${draft.subscription.tier} tier, ${draft.jurisdictionIds.length} jurisdiction(s)`,
        tenant.id
      )
      toast.success(`${draft.name} provisioned as a new tenant`)
    },
    [log]
  )

  const updateTenant = useCallback((id: string, draft: TenantEditDraft) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
    )
    toast.success('Company updated')
  }, [])

  /** Suspension requires a mandatory reason + second-admin approval (US-PA-07). */
  const suspendTenant = useCallback(
    (id: string, reason: string, approvedBy: string) => {
      const tenant = tenants.find((t) => t.id === id)
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'suspended',
                suspension: {
                  reason,
                  approvedBy,
                  at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                },
              }
            : t
        )
      )
      log(
        'status',
        `Tenant ${tenant?.code ?? id} suspended — reason: ${reason} (approved by ${approvedBy})`,
        id
      )
      toast.success(
        `${tenant?.name ?? 'Tenant'} suspended — reason recorded and approval logged`
      )
    },
    [tenants, log]
  )

  const reactivateTenant = useCallback(
    (id: string) => {
      const tenant = tenants.find((t) => t.id === id)
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'active', suspension: null } : t
        )
      )
      log('status', `Tenant ${tenant?.code ?? id} reactivated`, id)
      toast.success(`${tenant?.name ?? 'Tenant'} reactivated`)
    },
    [tenants, log]
  )

  /** Tier change re-applies tier defaults; downgrades below headcount are denied (US-PA-42). */
  const changeTier = useCallback(
    (id: string, tier: SubscriptionTier) => {
      const tenant = tenants.find((t) => t.id === id)
      if (!tenant) return
      const defaults = TIER_DEFAULTS[tier]
      if (tenant.employees > defaults.employeeLimit) {
        log(
          'denial',
          `Tier downgrade denied for ${tenant.code} — ${tenant.employees} employees exceed the ${tier} limit of ${defaults.employeeLimit}`,
          id
        )
        toast.error(
          `Cannot move ${tenant.name} to the ${tier} tier — ${tenant.employees.toLocaleString('en-US')} employees exceed its limit of ${defaults.employeeLimit.toLocaleString('en-US')}`
        )
        return
      }
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, subscription: { ...defaults } } : t
        )
      )
      log('config', `Subscription tier changed to ${tier} for ${tenant.code}`, id)
      toast.success(
        `${tenant.name} moved to the ${tier} tier — limit ${defaults.employeeLimit.toLocaleString('en-US')} employees, ${defaults.modules.length} modules`
      )
    },
    [tenants, log]
  )

  /** Toggle a module entitlement; Core HR can never be removed (US-PA-44). */
  const toggleModuleEntitlement = useCallback(
    (id: string, module: PlatformModule) => {
      const tenant = tenants.find((t) => t.id === id)
      if (!tenant) return
      if (module === 'Core HR') {
        toast.error('Core HR is included in every tier and cannot be removed')
        return
      }
      const entitled = tenant.subscription.modules.includes(module)
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                subscription: {
                  ...t.subscription,
                  modules: entitled
                    ? t.subscription.modules.filter((m) => m !== module)
                    : [...t.subscription.modules, module],
                },
              }
            : t
        )
      )
      log(
        'config',
        `Module ${module} ${entitled ? 'removed from' : 'added to'} ${tenant.code}'s subscription`,
        id
      )
      toast.success(
        entitled
          ? `${module} unsubscribed — ${tenant.name}'s users are now denied access to it`
          : `${module} entitled for ${tenant.name}`
      )
    },
    [tenants, log]
  )

  /** Mock hire — blocked at the subscription's employee limit (US-PA-43). */
  const simulateHire = useCallback(
    (id: string) => {
      const tenant = tenants.find((t) => t.id === id)
      if (!tenant) return
      if (tenant.employees >= tenant.subscription.employeeLimit) {
        log(
          'denial',
          `Hire blocked for ${tenant.code} — employee limit of ${tenant.subscription.employeeLimit} reached on the ${tenant.subscription.tier} tier`,
          id
        )
        toast.error(
          `Hire blocked — ${tenant.name} has reached its ${tenant.subscription.tier}-tier limit of ${tenant.subscription.employeeLimit.toLocaleString('en-US')} employees. Upgrade the tier to add more.`
        )
        return
      }
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, employees: t.employees + 1 } : t))
      )
      toast.success(
        `Employee added — ${tenant.name} now at ${(tenant.employees + 1).toLocaleString('en-US')} of ${tenant.subscription.employeeLimit.toLocaleString('en-US')}`
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
    suspendTenant,
    reactivateTenant,
    changeTier,
    toggleModuleEntitlement,
    simulateHire,
    addJurisdiction,
    switchCompany,
    updateGroup,
    resolveSharing,
    log,
  }
}

export type TenantsStore = ReturnType<typeof useTenants>
