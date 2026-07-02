/**
 * Sharing surface for group companies — explicit group-level role grants
 * (GRP-07), shared locations with the owner/referencing permission matrix
 * (GRP-03/GRP-24), shared policy templates (GRP-23) and the cross-company
 * directory (GRP-06/GRP-11).
 */

export const GROUP_LEVEL_ROLES = [
  'Group Company Administrator',
  'Group Reporting Viewer',
  'Group Directory Searcher',
] as const
export type GroupLevelRole = (typeof GROUP_LEVEL_ROLES)[number]

/** Explicit, auditable group-level role grant (GRP-07). */
export interface GroupRoleGrant {
  id: string
  groupId: string
  userName: string
  userEmail: string
  companyId: string | null
  role: GroupLevelRole
  grantedBy: string
  grantedOn: string
  revoked: boolean
  revokedOn: string | null
}

export type ReferenceStatus = 'Pending' | 'Approved' | 'Denied' | 'Removed'

/** A referencing company's approved/pending link to another company's location. */
export interface LocationReference {
  id: string
  companyId: string
  status: ReferenceStatus
  requestedOn: string
  decidedOn: string | null
  assignedEmployees: number
}

export interface SharedLocation {
  id: string
  name: string
  address: string
  contact: string
  ownerCompanyId: string
  groupId: string
  /** Owner has exposed the location to the group (explicit authorization). */
  shared: boolean
  references: LocationReference[]
}

export interface PolicyInstance {
  id: string
  companyId: string
  adoptedVersion: number
  adoptedOn: string
  locallyEdited: boolean
}

/** Read-only template shared to the group; instances never auto-update (GRP-23). */
export interface PolicyTemplate {
  id: string
  name: string
  category: 'Leave' | 'Attendance' | 'Expense' | 'Conduct' | 'Remote Work'
  sourceCompanyId: string
  groupId: string
  version: number
  updatedOn: string
  sharedBy: string
  instances: PolicyInstance[]
}

export interface DirectoryPerson {
  id: string
  name: string
  title: string
  department: string
  companyId: string
  email: string
  /** Row-level-security flag — withheld from non-platform viewers (GRP-08). */
  restricted: boolean
}

/** Cross-company administrative actions available under shared administration. */
export const ADMIN_ACTIONS = [
  'Publish holiday calendar',
  'Update leave accrual rules',
  'Reset password policy',
  'Lock payroll period',
] as const

export const seedRoleGrants: GroupRoleGrant[] = [
  { id: 'rg-01', groupId: 'g-01', userName: 'Grace Kim', userEmail: 'grace.group@meridiantech.in', companyId: 'co-01', role: 'Group Company Administrator', grantedBy: 'priya.platform@satellitehr.com', grantedOn: '2024-02-12', revoked: false, revokedOn: null },
  { id: 'rg-02', groupId: 'g-01', userName: 'Grace Kim', userEmail: 'grace.group@meridiantech.in', companyId: 'co-01', role: 'Group Reporting Viewer', grantedBy: 'priya.platform@satellitehr.com', grantedOn: '2024-07-02', revoked: false, revokedOn: null },
  { id: 'rg-03', groupId: 'g-01', userName: 'Asha Rao', userEmail: 'asha.rao@meridiantech.in', companyId: 'co-01', role: 'Group Directory Searcher', grantedBy: 'grace.group@meridiantech.in', grantedOn: '2024-09-10', revoked: false, revokedOn: null },
  { id: 'rg-04', groupId: 'g-01', userName: 'Priya Sharma', userEmail: 'priya.platform@satellitehr.com', companyId: null, role: 'Group Reporting Viewer', grantedBy: 'priya.platform@satellitehr.com', grantedOn: '2024-07-02', revoked: false, revokedOn: null },
  { id: 'rg-05', groupId: 'g-02', userName: 'Daniel Osei', userEmail: 'daniel.group@bluegrain.in', companyId: 'co-04', role: 'Group Company Administrator', grantedBy: 'priya.platform@satellitehr.com', grantedOn: '2025-01-20', revoked: false, revokedOn: null },
  { id: 'rg-06', groupId: 'g-01', userName: 'Tomás Rivera', userEmail: 'tomas.rivera@meridiandigital.in', companyId: 'co-02', role: 'Group Reporting Viewer', grantedBy: 'grace.group@meridiantech.in', grantedOn: '2024-11-05', revoked: true, revokedOn: '2025-08-19' },
]

export const seedLocations: SharedLocation[] = [
  {
    id: 'loc-01',
    name: 'Meridian Tower',
    address: '14 Cyber Park Rd, Bengaluru',
    contact: 'facilities@meridiantech.in',
    ownerCompanyId: 'co-01',
    groupId: 'g-01',
    shared: true,
    references: [
      { id: 'lr-01', companyId: 'co-02', status: 'Approved', requestedOn: '2024-05-02', decidedOn: '2024-05-06', assignedEmployees: 46 },
      { id: 'lr-02', companyId: 'co-03', status: 'Pending', requestedOn: '2026-06-21', decidedOn: null, assignedEmployees: 0 },
    ],
  },
  {
    id: 'loc-02',
    name: 'Meridian Labs Campus',
    address: 'Plot 9, HITEC City, Hyderabad',
    contact: 'labs-ops@meridiananalytics.in',
    ownerCompanyId: 'co-03',
    groupId: 'g-01',
    shared: true,
    references: [
      { id: 'lr-03', companyId: 'co-01', status: 'Approved', requestedOn: '2024-08-11', decidedOn: '2024-08-12', assignedEmployees: 18 },
    ],
  },
  {
    id: 'loc-03',
    name: 'Bluegrain Processing Plant',
    address: 'NH-48 Industrial Estate, Pune',
    contact: 'plant@bluegrainfoods.in',
    ownerCompanyId: 'co-04',
    groupId: 'g-02',
    shared: true,
    references: [
      { id: 'lr-04', companyId: 'co-05', status: 'Approved', requestedOn: '2025-03-05', decidedOn: '2025-03-09', assignedEmployees: 22 },
    ],
  },
  {
    id: 'loc-04',
    name: 'Bluegrain HQ',
    address: '2 Grain Exchange St, Mumbai',
    contact: 'hq@bluegrainfoods.in',
    ownerCompanyId: 'co-04',
    groupId: 'g-02',
    shared: false,
    references: [],
  },
  {
    id: 'loc-05',
    name: 'Harbor Dockyard',
    address: 'Berth 12, JNPT, Navi Mumbai',
    contact: 'dock@harborlog.com',
    ownerCompanyId: 'co-06',
    groupId: 'g-03',
    shared: false,
    references: [],
  },
  {
    id: 'loc-06',
    name: 'Northwind Mill',
    address: 'Sector 4, Coimbatore',
    contact: 'mill@northwindtextiles.in',
    ownerCompanyId: 'co-08',
    groupId: 'g-03',
    shared: false,
    references: [],
  },
]

export const seedTemplates: PolicyTemplate[] = [
  {
    id: 'pt-01',
    name: 'Leave Policy FY26',
    category: 'Leave',
    sourceCompanyId: 'co-01',
    groupId: 'g-01',
    version: 2,
    updatedOn: '2026-04-01',
    sharedBy: 'grace.group@meridiantech.in',
    instances: [
      { id: 'pi-01', companyId: 'co-02', adoptedVersion: 1, adoptedOn: '2025-04-18', locallyEdited: true },
      { id: 'pi-02', companyId: 'co-03', adoptedVersion: 2, adoptedOn: '2026-04-10', locallyEdited: false },
    ],
  },
  {
    id: 'pt-02',
    name: 'Remote Work Policy',
    category: 'Remote Work',
    sourceCompanyId: 'co-01',
    groupId: 'g-01',
    version: 1,
    updatedOn: '2025-09-15',
    sharedBy: 'grace.group@meridiantech.in',
    instances: [
      { id: 'pi-03', companyId: 'co-02', adoptedVersion: 1, adoptedOn: '2025-10-01', locallyEdited: false },
    ],
  },
  {
    id: 'pt-03',
    name: 'Code of Conduct',
    category: 'Conduct',
    sourceCompanyId: 'co-04',
    groupId: 'g-02',
    version: 1,
    updatedOn: '2025-02-20',
    sharedBy: 'daniel.group@bluegrain.in',
    instances: [
      { id: 'pi-04', companyId: 'co-05', adoptedVersion: 1, adoptedOn: '2025-03-02', locallyEdited: true },
    ],
  },
  {
    id: 'pt-04',
    name: 'Expense Reimbursement',
    category: 'Expense',
    sourceCompanyId: 'co-02',
    groupId: 'g-01',
    version: 1,
    updatedOn: '2026-01-12',
    sharedBy: 'grace.group@meridiantech.in',
    instances: [],
  },
  {
    id: 'pt-05',
    name: 'Attendance & Shifts',
    category: 'Attendance',
    sourceCompanyId: 'co-06',
    groupId: 'g-03',
    version: 1,
    updatedOn: '2025-06-30',
    sharedBy: 'mira.jv@harborlog.com',
    instances: [],
  },
]

export const seedDirectory: DirectoryPerson[] = [
  { id: 'dp-01', name: 'Asha Rao', title: 'Senior Engineer', department: 'Platform Engineering', companyId: 'co-01', email: 'asha.rao@meridiantech.in', restricted: false },
  { id: 'dp-02', name: 'Grace Kim', title: 'Group HR Director', department: 'Human Resources', companyId: 'co-01', email: 'grace.group@meridiantech.in', restricted: false },
  { id: 'dp-03', name: 'Vikram Shetty', title: 'CFO', department: 'Finance', companyId: 'co-01', email: 'vikram.shetty@meridiantech.in', restricted: true },
  { id: 'dp-04', name: 'Tomás Rivera', title: 'Delivery Manager', department: 'Client Services', companyId: 'co-02', email: 'tomas.rivera@meridiandigital.in', restricted: false },
  { id: 'dp-05', name: 'Neha Kulkarni', title: 'UX Lead', department: 'Design', companyId: 'co-02', email: 'neha.kulkarni@meridiandigital.in', restricted: false },
  { id: 'dp-06', name: 'Ibrahim Khan', title: 'Data Scientist', department: 'Analytics', companyId: 'co-03', email: 'ibrahim.khan@meridiananalytics.in', restricted: false },
  { id: 'dp-07', name: 'Sara Lindqvist', title: 'Head of Research', department: 'Analytics', companyId: 'co-03', email: 'sara.lindqvist@meridiananalytics.in', restricted: true },
  { id: 'dp-08', name: 'Ravi Batra', title: 'HR Manager', department: 'Human Resources', companyId: 'co-04', email: 'admin@bluegrainfoods.in', restricted: false },
  { id: 'dp-09', name: 'Meena Pillai', title: 'Plant Supervisor', department: 'Operations', companyId: 'co-04', email: 'meena.pillai@bluegrainfoods.in', restricted: false },
  { id: 'dp-10', name: 'Arjun Nair', title: 'Store Operations Lead', department: 'Retail Ops', companyId: 'co-05', email: 'arjun.nair@bluegrainretail.in', restricted: false },
  { id: 'dp-11', name: 'Fatima Zubair', title: 'Payroll Specialist', department: 'Finance', companyId: 'co-05', email: 'fatima.zubair@bluegrainretail.in', restricted: true },
  { id: 'dp-12', name: 'Mira Castellanos', title: 'JV Program Director', department: 'Executive', companyId: 'co-06', email: 'mira.jv@harborlog.com', restricted: false },
  { id: 'dp-13', name: 'Dev Anand', title: 'Fleet Coordinator', department: 'Logistics', companyId: 'co-06', email: 'dev.anand@harborlog.com', restricted: false },
  { id: 'dp-14', name: 'Kavya Menon', title: 'Loom Engineer', department: 'Production', companyId: 'co-08', email: 'kavya.menon@northwindtextiles.in', restricted: false },
  { id: 'dp-15', name: 'Lena Fischer', title: 'People Ops Lead', department: 'Human Resources', companyId: 'co-09', email: 'lena.admin@solstice.energy', restricted: false },
  { id: 'dp-16', name: 'Rohan Gupta', title: 'Grid Analyst', department: 'Operations', companyId: 'co-10', email: 'rohan.gupta@solsticegrid.in', restricted: false },
]
