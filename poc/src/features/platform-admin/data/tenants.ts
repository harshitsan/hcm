/**
 * Platform Administration — tenant provisioning domain (SYS-01, 03, 04, 05,
 * 08, 09, 15, 16, 40, 48, 49). Companies (tenants), the platform
 * jurisdictions catalog, portfolios, group-company structures and
 * cross-company sharing requests.
 */

export const TENANT_STATUSES = ['active', 'suspended', 'onboarding'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

/** Commercial subscription tiers (US-PA-42..44). */
export const SUBSCRIPTION_TIERS = ['starter', 'professional', 'enterprise'] as const
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

/** Modules a tenant can be entitled to. Core HR is always included. */
export const PLATFORM_MODULES = [
  'Core HR',
  'Leave',
  'Attendance',
  'Recruitment',
  'Assets',
  'Documents',
  'Workflows',
  'Reports',
] as const
export type PlatformModule = (typeof PLATFORM_MODULES)[number]

export interface TenantSubscription {
  tier: SubscriptionTier
  /** Hard cap — hires beyond this are blocked until an upgrade (US-PA-43). */
  employeeLimit: number
  /** Entitled modules; unsubscribed modules are denied (US-PA-44). */
  modules: PlatformModule[]
}

/** Defaults applied when a tier is selected during provisioning/changes. */
export const TIER_DEFAULTS: Record<SubscriptionTier, TenantSubscription> = {
  starter: {
    tier: 'starter',
    employeeLimit: 100,
    modules: ['Core HR', 'Leave', 'Attendance'],
  },
  professional: {
    tier: 'professional',
    employeeLimit: 750,
    modules: ['Core HR', 'Leave', 'Attendance', 'Recruitment', 'Documents', 'Reports'],
  },
  enterprise: {
    tier: 'enterprise',
    employeeLimit: 5000,
    modules: [...PLATFORM_MODULES],
  },
}

/** Approvers authorized to countersign a tenant suspension (US-PA-07). */
export const SUSPENSION_APPROVERS = [
  'Meera Iyer — Platform Operations',
  'Daniel Kim — Compliance Office',
  'Priya Nair — Customer Success Lead',
] as const

/** Mandatory reason + second-admin approval recorded on suspension. */
export interface TenantSuspension {
  reason: string
  approvedBy: string
  at: string
}

export interface Jurisdiction {
  id: string
  code: string
  name: string
  /** Versioned jurisdiction rule-pack applied to employees (SYS-35, 47). */
  rulePack: string
  status: 'available' | 'draft'
}

export interface Portfolio {
  id: string
  name: string
  manager: string
  /** Reusable setup pattern applied across managed companies (SYS-03). */
  setupPattern: string
}

export interface CompanyGroup {
  id: string
  name: string
  /** Shared locations across the group, subject to approval (SYS-05, 49). */
  sharedLocations: boolean
  consolidatedVisibility: boolean
}

export interface Tenant {
  id: string
  name: string
  code: string
  jurisdictionIds: string[]
  /** At most one portfolio OR one group at a time — never both (SYS-09). */
  portfolioId: string | null
  groupId: string | null
  status: TenantStatus
  employees: number
  createdAt: string
  /** Whether the signed-in admin may switch into this company (SYS-04/40). */
  authorized: boolean
  /** Commercial subscription — tier, employee cap, module entitlements. */
  subscription: TenantSubscription
  /** Present only while suspended — mandatory reason + approver (US-PA-07). */
  suspension: TenantSuspension | null
}

export const SHARING_STATUSES = ['pending', 'approved', 'denied'] as const
export type SharingStatus = (typeof SHARING_STATUSES)[number]

export interface SharingRequest {
  id: string
  groupId: string
  fromTenantId: string
  toTenantId: string
  resource: string
  status: SharingStatus
  requestedAt: string
}

export interface PlatformLogEntry {
  id: string
  tenantId: string | null
  kind: 'provisioned' | 'status' | 'config' | 'health' | 'denial'
  message: string
  at: string
}

export const seedJurisdictions: Jurisdiction[] = [
  { id: 'jur-in-ka', code: 'IN-KA', name: 'India — Karnataka', rulePack: 'IN-KA v3.2', status: 'available' },
  { id: 'jur-in-mh', code: 'IN-MH', name: 'India — Maharashtra', rulePack: 'IN-MH v3.1', status: 'available' },
  { id: 'jur-in-tn', code: 'IN-TN', name: 'India — Tamil Nadu', rulePack: 'IN-TN v2.9', status: 'available' },
  { id: 'jur-in-ts', code: 'IN-TS', name: 'India — Telangana', rulePack: 'IN-TS v2.4', status: 'available' },
  { id: 'jur-us-ca', code: 'US-CA', name: 'United States — California', rulePack: 'US-CA v1.8', status: 'available' },
  { id: 'jur-uk', code: 'UK', name: 'United Kingdom', rulePack: 'UK v1.5', status: 'available' },
  { id: 'jur-sg', code: 'SG', name: 'Singapore', rulePack: 'SG v1.2', status: 'draft' },
]

export const seedPortfolios: Portfolio[] = [
  {
    id: 'pf-01',
    name: 'Helios Shared Services',
    manager: 'Anita Deshmukh',
    setupPattern: 'Standard IN payroll + leave policy pack',
  },
  {
    id: 'pf-02',
    name: 'Northwind Holdings',
    manager: 'Rahul Chandra',
    setupPattern: 'Global contractor-first onboarding pack',
  },
]

export const seedGroups: CompanyGroup[] = [
  {
    id: 'grp-01',
    name: 'Aster Group',
    sharedLocations: true,
    consolidatedVisibility: true,
  },
  {
    id: 'grp-02',
    name: 'Kensium Alliance',
    sharedLocations: false,
    consolidatedVisibility: true,
  },
]

export const seedTenants: Tenant[] = [
  { id: 'co-01', name: 'Aster Software Pvt Ltd', code: 'ASTER-IN', jurisdictionIds: ['jur-in-ka', 'jur-in-mh'], portfolioId: null, groupId: 'grp-01', status: 'active', employees: 640, createdAt: '2025-02-11', authorized: true, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Recruitment', 'Documents', 'Reports'] }, suspension: null },
  { id: 'co-02', name: 'Aster Analytics LLC', code: 'ASTER-US', jurisdictionIds: ['jur-us-ca'], portfolioId: null, groupId: 'grp-01', status: 'active', employees: 98, createdAt: '2025-03-02', authorized: true, subscription: { tier: 'starter', employeeLimit: 100, modules: ['Core HR', 'Leave', 'Attendance'] }, suspension: null },
  { id: 'co-03', name: 'Meridian Textiles Ltd', code: 'MERIDIAN', jurisdictionIds: ['jur-in-tn'], portfolioId: 'pf-01', groupId: null, status: 'active', employees: 910, createdAt: '2025-01-20', authorized: true, subscription: { tier: 'enterprise', employeeLimit: 5000, modules: [...PLATFORM_MODULES] }, suspension: null },
  { id: 'co-04', name: 'BlueFern Logistics', code: 'BLUEFERN', jurisdictionIds: ['jur-in-mh'], portfolioId: 'pf-01', groupId: null, status: 'active', employees: 415, createdAt: '2025-04-08', authorized: true, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Recruitment', 'Documents', 'Reports'] }, suspension: null },
  { id: 'co-05', name: 'Cobalt Micro Devices', code: 'COBALT', jurisdictionIds: ['jur-in-ka', 'jur-in-ts'], portfolioId: 'pf-01', groupId: null, status: 'suspended', employees: 132, createdAt: '2025-05-19', authorized: true, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Documents'] }, suspension: { reason: 'Invoice overdue 60+ days — billing hold pending payment plan', approvedBy: 'Daniel Kim — Compliance Office', at: '2026-06-10 09:12' } },
  { id: 'co-06', name: 'Harbor & Vale Consulting', code: 'HARVALE', jurisdictionIds: ['jur-uk'], portfolioId: 'pf-02', groupId: null, status: 'active', employees: 58, createdAt: '2025-06-30', authorized: false, subscription: { tier: 'starter', employeeLimit: 100, modules: ['Core HR', 'Leave', 'Attendance'] }, suspension: null },
  { id: 'co-07', name: 'Suryodaya Foods', code: 'SURYA', jurisdictionIds: ['jur-in-ts'], portfolioId: null, groupId: null, status: 'active', employees: 267, createdAt: '2025-07-14', authorized: true, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Recruitment', 'Reports'] }, suspension: null },
  { id: 'co-08', name: 'Quill & Crest Media', code: 'QUILL', jurisdictionIds: ['jur-in-ka'], portfolioId: null, groupId: 'grp-02', status: 'active', employees: 74, createdAt: '2025-08-22', authorized: false, subscription: { tier: 'starter', employeeLimit: 100, modules: ['Core HR', 'Leave', 'Attendance'] }, suspension: null },
  { id: 'co-09', name: 'Verdant Energy Systems', code: 'VERDANT', jurisdictionIds: ['jur-in-mh', 'jur-in-ka'], portfolioId: null, groupId: 'grp-02', status: 'active', employees: 388, createdAt: '2025-09-05', authorized: true, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Recruitment', 'Documents', 'Reports', 'Workflows'] }, suspension: null },
  { id: 'co-10', name: 'Lattice Robotics', code: 'LATTICE', jurisdictionIds: ['jur-in-ka'], portfolioId: null, groupId: null, status: 'onboarding', employees: 12, createdAt: '2026-05-28', authorized: true, subscription: { tier: 'starter', employeeLimit: 100, modules: ['Core HR', 'Leave', 'Attendance'] }, suspension: null },
  { id: 'co-11', name: 'Palmgrove Hospitality', code: 'PALM', jurisdictionIds: ['jur-in-tn'], portfolioId: 'pf-02', groupId: null, status: 'active', employees: 540, createdAt: '2025-10-12', authorized: false, subscription: { tier: 'professional', employeeLimit: 750, modules: ['Core HR', 'Leave', 'Attendance', 'Documents'] }, suspension: null },
  { id: 'co-12', name: 'Nimbus Health Tech', code: 'NIMBUS', jurisdictionIds: ['jur-in-ts', 'jur-sg'], portfolioId: null, groupId: null, status: 'onboarding', employees: 30, createdAt: '2026-06-15', authorized: true, subscription: { tier: 'starter', employeeLimit: 100, modules: ['Core HR', 'Leave', 'Attendance'] }, suspension: null },
]

export const seedSharingRequests: SharingRequest[] = [
  { id: 'shr-01', groupId: 'grp-01', fromTenantId: 'co-01', toTenantId: 'co-02', resource: 'Location: Bengaluru — Whitefield Campus', status: 'pending', requestedAt: '2026-06-21' },
  { id: 'shr-02', groupId: 'grp-01', fromTenantId: 'co-02', toTenantId: 'co-01', resource: 'Location: San Jose — Field Office', status: 'approved', requestedAt: '2026-05-30' },
  { id: 'shr-03', groupId: 'grp-02', fromTenantId: 'co-09', toTenantId: 'co-08', resource: 'Location: Pune — Hinjawadi Hub', status: 'denied', requestedAt: '2026-06-02' },
]

export const seedPlatformLog: PlatformLogEntry[] = [
  { id: 'log-01', tenantId: 'co-12', kind: 'provisioned', message: 'Tenant NIMBUS provisioned with jurisdictions IN-TS, SG', at: '2026-06-15 10:04' },
  { id: 'log-02', tenantId: 'co-10', kind: 'config', message: 'Onboarding checklist 60% complete — awaiting SSO configuration', at: '2026-06-18 16:41' },
  { id: 'log-03', tenantId: 'co-05', kind: 'status', message: 'Tenant COBALT suspended — billing hold', at: '2026-06-10 09:12' },
  { id: 'log-04', tenantId: null, kind: 'health', message: 'All regions healthy — API p95 412 ms', at: '2026-06-27 08:00' },
  { id: 'log-05', tenantId: 'co-08', kind: 'denial', message: 'Cross-tenant read denied (QUILL → VERDANT employee record)', at: '2026-06-24 14:37' },
  { id: 'log-06', tenantId: 'co-12', kind: 'config', message: 'Approved data import assisted by platform operations (2,140 rows)', at: '2026-06-20 11:22' },
]
