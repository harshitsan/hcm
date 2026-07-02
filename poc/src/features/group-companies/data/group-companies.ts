import { type Role } from '@/context/role-context'

/**
 * Group Companies module — FR 6.3 / GROUP-FR-001…006 (GRP-01…GRP-26).
 * Types + seed data for group-company constructs, effective-dated
 * memberships, and versioned shared-scenario configuration.
 */

export const GROUP_TYPES = ['Holding', 'Sister', 'JointVenture'] as const
export type GroupType = (typeof GROUP_TYPES)[number]

export type RelationshipType =
  | 'Parent'
  | 'Subsidiary'
  | 'Sister Concern'
  | 'JV Partner'
  | 'Affiliated Entity'

export type CompanyStatus = 'Active' | 'Draft' | 'Suspended' | 'Inactive'

export interface MemberCompany {
  id: string
  name: string
  status: CompanyStatus
  portfolioId: string
  /** Ownership edges — used for circular-reference detection (GROUP_002). */
  ownsCompanyIds: string[]
  headcount: number
  onLeaveToday: number
  attendancePct: number
}

export interface Portfolio {
  id: string
  name: string
}

/** Effective-dated, tenant-scoped membership record with history (GRP-12). */
export interface GroupMembership {
  id: string
  companyId: string
  relationshipType: RelationshipType
  effectiveFrom: string
  /** Null while the membership is active; set on removal (history preserved). */
  effectiveTo: string | null
  addedBy: string
}

export const SHARED_SETTINGS = [
  'sharedAdministration',
  'sharedLocations',
  'crossCompanyAccess',
] as const
export type SharedSetting = (typeof SHARED_SETTINGS)[number]

export const SETTING_LABELS: Record<SharedSetting, string> = {
  sharedAdministration: 'Shared administration',
  sharedLocations: 'Shared locations',
  crossCompanyAccess: 'Cross-company access',
}

/** Versioned, effective-dated configuration change (GRP-13). */
export interface ConfigVersion {
  id: string
  version: number
  setting: SharedSetting
  priorValue: boolean
  newValue: boolean
  effectiveDate: string
  changedBy: string
  changedAt: string
}

export interface GroupCompany {
  id: string
  /** Auto-generated GROUP-YYYY-NNN (GRP-16). */
  code: string
  name: string
  type: GroupType
  /** Required for Holding structures (GRP-18). */
  parentCompanyId: string | null
  administratorName: string
  administratorEmail: string
  /** All group records are tenant-scoped (GRP-12). */
  tenantId: string
  createdOn: string
  createdBy: string
  memberships: GroupMembership[]
  sharedAdministration: boolean
  sharedLocations: boolean
  crossCompanyAccess: boolean
  configVersions: ConfigVersion[]
}

/** Active (not-ended) memberships of a construct. */
export function activeMemberships(group: GroupCompany): GroupMembership[] {
  return group.memberships.filter((m) => !m.effectiveTo)
}

/** Memberships effective on a given ISO date (as-of query, GRP-12). */
export function membershipsAsOf(
  group: GroupCompany,
  date: string
): GroupMembership[] {
  return group.memberships.filter(
    (m) => m.effectiveFrom <= date && (!m.effectiveTo || m.effectiveTo > date)
  )
}

export interface Persona {
  name: string
  email: string
  companyId: string | null
  portfolioId: string | null
}

/** Acting identity per mock role — recorded as the actor in audit entries. */
export const PERSONAS: Record<Role, Persona> = {
  'Platform Admin': {
    name: 'Priya Sharma',
    email: 'priya.platform@satellitehr.com',
    companyId: null,
    portfolioId: null,
  },
  'Portfolio Admin': {
    name: 'Omar Haddad',
    email: 'omar.portfolio@northline.com',
    companyId: null,
    portfolioId: 'pf-north',
  },
  'Group Company Admin': {
    name: 'Grace Kim',
    email: 'grace.group@meridiantech.in',
    companyId: 'co-01',
    portfolioId: null,
  },
  'Company Admin': {
    name: 'Ravi Batra',
    email: 'admin@bluegrainfoods.in',
    companyId: 'co-04',
    portfolioId: null,
  },
  'Employee (User)': {
    name: 'Asha Rao',
    email: 'asha.rao@meridiantech.in',
    companyId: 'co-01',
    portfolioId: null,
  },
  'Employee (Non-User)': {
    name: 'Kiosk Terminal',
    email: 'kiosk@bluegrainfoods.in',
    companyId: 'co-04',
    portfolioId: null,
  },
}

/** Users holding the Group Company Administrator role (GRP-16 AC1). */
export const ADMIN_CANDIDATES = [
  { name: 'Grace Kim', email: 'grace.group@meridiantech.in' },
  { name: 'Daniel Osei', email: 'daniel.group@bluegrain.in' },
  { name: 'Mira Castellanos', email: 'mira.jv@harborlog.com' },
  { name: 'Lena Fischer', email: 'lena.admin@solstice.energy' },
] as const

export const seedPortfolios: Portfolio[] = [
  { id: 'pf-north', name: 'Northline Portfolio' },
  { id: 'pf-west', name: 'Westbridge Portfolio' },
]

export const seedCompanies: MemberCompany[] = [
  { id: 'co-01', name: 'Meridian Technologies', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: ['co-02', 'co-03'], headcount: 1240, onLeaveToday: 38, attendancePct: 96 },
  { id: 'co-02', name: 'Meridian Digital Services', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 460, onLeaveToday: 12, attendancePct: 94 },
  { id: 'co-03', name: 'Meridian Analytics', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 215, onLeaveToday: 6, attendancePct: 97 },
  { id: 'co-04', name: 'Bluegrain Foods', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 830, onLeaveToday: 27, attendancePct: 92 },
  { id: 'co-05', name: 'Bluegrain Retail', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 390, onLeaveToday: 15, attendancePct: 91 },
  { id: 'co-06', name: 'Harbor Logistics', status: 'Active', portfolioId: 'pf-west', ownsCompanyIds: [], headcount: 540, onLeaveToday: 19, attendancePct: 89 },
  { id: 'co-07', name: 'Harbor Freight Lines', status: 'Suspended', portfolioId: 'pf-west', ownsCompanyIds: [], headcount: 120, onLeaveToday: 0, attendancePct: 0 },
  { id: 'co-08', name: 'Northwind Textiles', status: 'Active', portfolioId: 'pf-west', ownsCompanyIds: [], headcount: 610, onLeaveToday: 22, attendancePct: 93 },
  { id: 'co-09', name: 'Solstice Energy', status: 'Active', portfolioId: 'pf-west', ownsCompanyIds: ['co-10'], headcount: 720, onLeaveToday: 18, attendancePct: 95 },
  { id: 'co-10', name: 'Solstice Grid Services', status: 'Active', portfolioId: 'pf-west', ownsCompanyIds: [], headcount: 260, onLeaveToday: 9, attendancePct: 96 },
  { id: 'co-11', name: 'Cascade Health Labs', status: 'Active', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 175, onLeaveToday: 4, attendancePct: 98 },
  { id: 'co-12', name: 'Argent Financial', status: 'Draft', portfolioId: 'pf-north', ownsCompanyIds: [], headcount: 0, onLeaveToday: 0, attendancePct: 0 },
]

export const seedGroups: GroupCompany[] = [
  {
    id: 'g-01',
    code: 'GROUP-2024-001',
    name: 'Meridian Group',
    type: 'Holding',
    parentCompanyId: 'co-01',
    administratorName: 'Grace Kim',
    administratorEmail: 'grace.group@meridiantech.in',
    tenantId: 'ten-001',
    createdOn: '2024-02-12',
    createdBy: 'priya.platform@satellitehr.com',
    memberships: [
      { id: 'gm-101', companyId: 'co-01', relationshipType: 'Parent', effectiveFrom: '2024-02-12', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
      { id: 'gm-102', companyId: 'co-02', relationshipType: 'Subsidiary', effectiveFrom: '2024-02-12', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
      { id: 'gm-103', companyId: 'co-03', relationshipType: 'Subsidiary', effectiveFrom: '2024-06-01', effectiveTo: null, addedBy: 'grace.group@meridiantech.in' },
      { id: 'gm-104', companyId: 'co-08', relationshipType: 'Affiliated Entity', effectiveFrom: '2024-03-15', effectiveTo: '2025-06-30', addedBy: 'priya.platform@satellitehr.com' },
    ],
    sharedAdministration: true,
    sharedLocations: true,
    crossCompanyAccess: true,
    configVersions: [
      { id: 'cv-101', version: 1, setting: 'sharedLocations', priorValue: false, newValue: true, effectiveDate: '2024-04-01', changedBy: 'omar.portfolio@northline.com', changedAt: '2024-03-20 10:14' },
      { id: 'cv-102', version: 2, setting: 'crossCompanyAccess', priorValue: false, newValue: true, effectiveDate: '2024-07-01', changedBy: 'priya.platform@satellitehr.com', changedAt: '2024-06-18 15:02' },
      { id: 'cv-103', version: 3, setting: 'sharedAdministration', priorValue: false, newValue: true, effectiveDate: '2025-01-01', changedBy: 'omar.portfolio@northline.com', changedAt: '2024-12-10 09:41' },
    ],
  },
  {
    id: 'g-02',
    code: 'GROUP-2025-002',
    name: 'Bluegrain Alliance',
    type: 'Sister',
    parentCompanyId: null,
    administratorName: 'Daniel Osei',
    administratorEmail: 'daniel.group@bluegrain.in',
    tenantId: 'ten-001',
    createdOn: '2025-01-20',
    createdBy: 'priya.platform@satellitehr.com',
    memberships: [
      { id: 'gm-201', companyId: 'co-04', relationshipType: 'Sister Concern', effectiveFrom: '2025-01-20', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
      { id: 'gm-202', companyId: 'co-05', relationshipType: 'Sister Concern', effectiveFrom: '2025-01-20', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
    ],
    sharedAdministration: false,
    sharedLocations: true,
    crossCompanyAccess: false,
    configVersions: [
      { id: 'cv-201', version: 1, setting: 'sharedLocations', priorValue: false, newValue: true, effectiveDate: '2025-03-01', changedBy: 'daniel.group@bluegrain.in', changedAt: '2025-02-14 11:30' },
    ],
  },
  {
    id: 'g-03',
    code: 'GROUP-2025-003',
    name: 'Harbor–Northwind JV',
    type: 'JointVenture',
    parentCompanyId: null,
    administratorName: 'Mira Castellanos',
    administratorEmail: 'mira.jv@harborlog.com',
    tenantId: 'ten-001',
    createdOn: '2025-04-08',
    createdBy: 'priya.platform@satellitehr.com',
    memberships: [
      { id: 'gm-301', companyId: 'co-06', relationshipType: 'JV Partner', effectiveFrom: '2025-04-08', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
      { id: 'gm-302', companyId: 'co-07', relationshipType: 'JV Partner', effectiveFrom: '2025-04-08', effectiveTo: null, addedBy: 'priya.platform@satellitehr.com' },
      { id: 'gm-303', companyId: 'co-08', relationshipType: 'JV Partner', effectiveFrom: '2025-05-01', effectiveTo: null, addedBy: 'mira.jv@harborlog.com' },
    ],
    sharedAdministration: false,
    sharedLocations: false,
    crossCompanyAccess: false,
    configVersions: [],
  },
]
