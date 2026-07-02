/**
 * Employees module — core directory data.
 *
 * Employee records are strictly company-scoped (FR 6.9.1): the same physical
 * person employed by two companies appears as two independent records
 * (see Rakesh Iyer below, employed by both Aurora Retail and Meridian Foods).
 */

export const GROUP_COMPANIES = ['Aurora Group', 'Meridian Group'] as const
export type GroupCompany = (typeof GROUP_COMPANIES)[number]

export interface Company {
  id: string
  name: string
  group: GroupCompany
}

export const COMPANIES: Company[] = [
  { id: 'c-aur-ret', name: 'Aurora Retail Pvt Ltd', group: 'Aurora Group' },
  { id: 'c-aur-tech', name: 'Aurora Tech Services', group: 'Aurora Group' },
  { id: 'c-mer-food', name: 'Meridian Foods Ltd', group: 'Meridian Group' },
  { id: 'c-mer-log', name: 'Meridian Logistics', group: 'Meridian Group' },
]

export const JURISDICTIONS = [
  'India — Karnataka',
  'India — Maharashtra',
  'India — Telangana',
] as const
export type Jurisdiction = (typeof JURISDICTIONS)[number]

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Sales',
  'Quality Assurance',
  'Supply Chain',
] as const

export const POSITIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'HR Executive',
  'HR Manager',
  'Finance Analyst',
  'Operations Lead',
  'Sales Executive',
  'QA Engineer',
  'Warehouse Supervisor',
  'Engineering Manager',
] as const

export const EMPLOYEE_GROUPS = [
  'Night Shift',
  'Field Staff',
  'Hybrid',
  'Leadership Circle',
] as const

export const LOCATIONS = [
  'Bengaluru HQ',
  'Mumbai Office',
  'Hyderabad Hub',
  'Pune Plant',
  'Nagpur Depot',
] as const

export const EMPLOYEE_CLASSES = [
  'Permanent',
  'Probationer',
  'Contract',
  'Trainee',
] as const

export const LIFECYCLE_STAGES = [
  'Onboarding',
  'Probation',
  'Active',
  'Transferred',
  'Notice Period',
  'Exited',
] as const
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export type Eligibility = 'Eligible' | 'Not eligible' | 'Pending evaluation'

export interface LeaveBalance {
  type: string
  balance: number
  statutoryEntitlement: number
}

export interface Dependant {
  id: string
  name: string
  relationship: string
  dateOfBirth: string
}

export interface LifeEvent {
  id: string
  type: string
  date: string
  details: string
}

export interface LifecycleEvent {
  id: string
  type: LifecycleStage
  date: string
  note: string
}

export interface Employee {
  id: string
  code: string
  name: string
  email: string
  companyId: string
  jurisdiction: Jurisdiction
  departments: string[]
  position: string
  groups: string[]
  locations: string[]
  employeeClass: (typeof EMPLOYEE_CLASSES)[number]
  primaryManager: string
  dottedLineManagers: string[]
  managerEffectiveDate: string
  hasUserAccount: boolean
  lifecycleStage: LifecycleStage
  joinDate: string
  aadhar: string
  pan: string
  passport: string
  uan: string
  esicNumber: string
  esiPfEligibility: Eligibility
  ptRegistered: boolean
  lwfApplicable: boolean
  maternityEligibility: Eligibility
  gratuityEligibility: Eligibility
  /** Rule-pack version used by the last eligibility evaluation (audit). */
  evaluatedRulePack: string
  leaveBalances: LeaveBalance[]
  dependants: Dependant[]
  lifeEvents: LifeEvent[]
  lifecycleEvents: LifecycleEvent[]
}

/** The employee record behind the "Employee (User)" self-service views. */
export const SELF_EMPLOYEE_ID = 'e-1003'

export const seedEmployees: Employee[] = [
  {
    id: 'e-1001',
    code: 'AUR-0101',
    name: 'Ananya Krishnan',
    email: 'ananya.krishnan@aurora.in',
    companyId: 'c-aur-ret',
    jurisdiction: 'India — Karnataka',
    departments: ['Human Resources'],
    position: 'HR Manager',
    groups: ['Leadership Circle'],
    locations: ['Bengaluru HQ'],
    employeeClass: 'Permanent',
    primaryManager: 'Vikram Shetty',
    dottedLineManagers: [],
    managerEffectiveDate: '2023-04-01',
    hasUserAccount: true,
    lifecycleStage: 'Active',
    joinDate: '2019-06-10',
    aadhar: '4521-8834-1102',
    pan: 'AKPKR2211F',
    passport: 'N8123456',
    uan: '100845221101',
    esicNumber: '',
    esiPfEligibility: 'Not eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-KA v3 (2026-04-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 14, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 5, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 8, statutoryEntitlement: 12 },
    ],
    dependants: [
      {
        id: 'dep-1',
        name: 'Meera Krishnan',
        relationship: 'Daughter',
        dateOfBirth: '2018-02-14',
      },
    ],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-1', type: 'Onboarding', date: '2019-06-10', note: 'Joined as HR Executive' },
      { id: 'lc-2', type: 'Active', date: '2019-12-10', note: 'Probation cleared' },
    ],
  },
  {
    id: 'e-1002',
    code: 'AUR-0144',
    name: 'Vikram Shetty',
    email: 'vikram.shetty@aurora.in',
    companyId: 'c-aur-ret',
    jurisdiction: 'India — Karnataka',
    departments: ['Operations'],
    position: 'Operations Lead',
    groups: ['Leadership Circle'],
    locations: ['Bengaluru HQ', 'Hyderabad Hub'],
    employeeClass: 'Permanent',
    primaryManager: 'Board — Managing Director',
    dottedLineManagers: [],
    managerEffectiveDate: '2022-01-01',
    hasUserAccount: true,
    lifecycleStage: 'Active',
    joinDate: '2017-03-01',
    aadhar: '7810-2245-9931',
    pan: 'VSHPS8842K',
    passport: '',
    uan: '100712449902',
    esicNumber: '',
    esiPfEligibility: 'Not eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-KA v3 (2026-04-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 21, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 9, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 12, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-3', type: 'Onboarding', date: '2017-03-01', note: 'Lateral hire' },
      { id: 'lc-4', type: 'Active', date: '2017-09-01', note: 'Probation cleared' },
    ],
  },
  {
    id: 'e-1003',
    code: 'AUR-0210',
    name: 'Rohit Menon',
    email: 'rohit.menon@aurora.in',
    companyId: 'c-aur-ret',
    jurisdiction: 'India — Karnataka',
    departments: ['Engineering', 'Quality Assurance'],
    position: 'Senior Software Engineer',
    groups: ['Hybrid'],
    locations: ['Bengaluru HQ'],
    employeeClass: 'Permanent',
    primaryManager: 'Ananya Krishnan',
    dottedLineManagers: ['Vikram Shetty'],
    managerEffectiveDate: '2024-07-01',
    hasUserAccount: true,
    lifecycleStage: 'Active',
    joinDate: '2021-08-16',
    aadhar: '9034-1276-5581',
    pan: 'RMEPM5521Q',
    passport: 'Z4455112',
    uan: '100933127765',
    esicNumber: '',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-KA v3 (2026-04-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 11, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 7, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 10, statutoryEntitlement: 12 },
    ],
    dependants: [
      {
        id: 'dep-2',
        name: 'Lakshmi Menon',
        relationship: 'Spouse',
        dateOfBirth: '1993-09-30',
      },
    ],
    lifeEvents: [
      { id: 'le-1', type: 'Marriage', date: '2023-11-20', details: 'Updated nominee details' },
    ],
    lifecycleEvents: [
      { id: 'lc-5', type: 'Onboarding', date: '2021-08-16', note: 'Campus conversion' },
      { id: 'lc-6', type: 'Probation', date: '2021-08-16', note: '6-month probation' },
      { id: 'lc-7', type: 'Active', date: '2022-02-16', note: 'Probation cleared' },
    ],
  },
  {
    id: 'e-1004',
    code: 'AUR-0287',
    name: 'Sneha Patil',
    email: 'sneha.patil@aurora.in',
    companyId: 'c-aur-tech',
    jurisdiction: 'India — Maharashtra',
    departments: ['Engineering'],
    position: 'Software Engineer',
    groups: [],
    locations: ['Mumbai Office'],
    employeeClass: 'Probationer',
    primaryManager: 'Rohit Menon',
    dottedLineManagers: [],
    managerEffectiveDate: '2026-03-02',
    hasUserAccount: true,
    lifecycleStage: 'Probation',
    joinDate: '2026-03-02',
    aadhar: '2218-9954-3307',
    pan: 'SPAPT7733M',
    passport: '',
    uan: '101222995433',
    esicNumber: '3100224466',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Pending evaluation',
    gratuityEligibility: 'Not eligible',
    evaluatedRulePack: 'IN-MH v2 (2026-01-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 3, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 2, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 3, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-8', type: 'Onboarding', date: '2026-03-02', note: 'New hire' },
      { id: 'lc-9', type: 'Probation', date: '2026-03-02', note: '6-month probation per policy' },
    ],
  },
  {
    id: 'e-1005',
    code: 'AUR-0092',
    name: 'Imran Qureshi',
    email: '',
    companyId: 'c-aur-tech',
    jurisdiction: 'India — Maharashtra',
    departments: ['Operations'],
    position: 'Warehouse Supervisor',
    groups: ['Night Shift', 'Field Staff'],
    locations: ['Pune Plant', 'Nagpur Depot'],
    employeeClass: 'Contract',
    primaryManager: 'Vikram Shetty',
    dottedLineManagers: [],
    managerEffectiveDate: '2024-01-15',
    hasUserAccount: false,
    lifecycleStage: 'Active',
    joinDate: '2020-11-02',
    aadhar: '6650-3312-8874',
    pan: 'IQUPQ9911B',
    passport: '',
    uan: '100665331288',
    esicNumber: '3100992211',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-MH v2 (2026-01-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 16, statutoryEntitlement: 21 },
      { type: 'Casual Leave', balance: 4, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 6, statutoryEntitlement: 12 },
    ],
    dependants: [
      { id: 'dep-3', name: 'Farida Qureshi', relationship: 'Spouse', dateOfBirth: '1988-05-12' },
      { id: 'dep-4', name: 'Ayaan Qureshi', relationship: 'Son', dateOfBirth: '2012-08-01' },
    ],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-10', type: 'Onboarding', date: '2020-11-02', note: 'Contract staff — no system access' },
      { id: 'lc-11', type: 'Active', date: '2021-05-02', note: 'Probation cleared' },
    ],
  },
  {
    id: 'e-1006',
    code: 'MER-0331',
    name: 'Rakesh Iyer',
    email: 'rakesh.iyer@meridianfoods.in',
    companyId: 'c-mer-food',
    jurisdiction: 'India — Telangana',
    departments: ['Finance'],
    position: 'Finance Analyst',
    groups: [],
    locations: ['Hyderabad Hub'],
    employeeClass: 'Permanent',
    primaryManager: 'Deepa Raghavan',
    dottedLineManagers: [],
    managerEffectiveDate: '2023-10-01',
    hasUserAccount: true,
    lifecycleStage: 'Active',
    joinDate: '2022-04-18',
    aadhar: '5511-7823-6642',
    pan: 'RIYPI4488D',
    passport: 'M2211887',
    uan: '100551178236',
    esicNumber: '',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: false,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Not eligible',
    evaluatedRulePack: 'IN-TS v1 (2025-07-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 9, statutoryEntitlement: 15 },
      { type: 'Casual Leave', balance: 6, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 7, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-12', type: 'Onboarding', date: '2022-04-18', note: 'New hire' },
      { id: 'lc-13', type: 'Active', date: '2022-10-18', note: 'Probation cleared' },
    ],
  },
  {
    // Same physical person as e-1006 — an independent record in a second
    // company (FR 6.9.1 / dedup "valid separate-company record").
    id: 'e-1007',
    code: 'MLG-0068',
    name: 'Rakesh Iyer',
    email: 'rakesh.iyer@meridianlogistics.in',
    companyId: 'c-mer-log',
    jurisdiction: 'India — Maharashtra',
    departments: ['Finance', 'Supply Chain'],
    position: 'Finance Analyst',
    groups: ['Hybrid'],
    locations: ['Pune Plant'],
    employeeClass: 'Contract',
    primaryManager: 'Nilesh Kadam',
    dottedLineManagers: ['Deepa Raghavan'],
    managerEffectiveDate: '2025-01-06',
    hasUserAccount: false,
    lifecycleStage: 'Active',
    joinDate: '2025-01-06',
    aadhar: '5511-7823-6642',
    pan: 'RIYPI4488D',
    passport: 'M2211887',
    uan: '100551178236',
    esicNumber: '',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Not eligible',
    evaluatedRulePack: 'IN-MH v2 (2026-01-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 6, statutoryEntitlement: 21 },
      { type: 'Casual Leave', balance: 3, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 5, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-14', type: 'Onboarding', date: '2025-01-06', note: 'Part-time engagement (second company)' },
    ],
  },
  {
    id: 'e-1008',
    code: 'MER-0402',
    name: 'Deepa Raghavan',
    email: 'deepa.raghavan@meridianfoods.in',
    companyId: 'c-mer-food',
    jurisdiction: 'India — Telangana',
    departments: ['Finance'],
    position: 'Engineering Manager',
    groups: ['Leadership Circle'],
    locations: ['Hyderabad Hub'],
    employeeClass: 'Permanent',
    primaryManager: 'Board — CFO',
    dottedLineManagers: [],
    managerEffectiveDate: '2021-04-01',
    hasUserAccount: true,
    lifecycleStage: 'Active',
    joinDate: '2016-02-08',
    aadhar: '8890-4412-7753',
    pan: 'DRAPR6622H',
    passport: 'K9911223',
    uan: '100889044127',
    esicNumber: '',
    esiPfEligibility: 'Not eligible',
    ptRegistered: true,
    lwfApplicable: false,
    maternityEligibility: 'Eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-TS v1 (2025-07-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 24, statutoryEntitlement: 15 },
      { type: 'Casual Leave', balance: 10, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 12, statutoryEntitlement: 12 },
    ],
    dependants: [
      { id: 'dep-5', name: 'S. Raghavan', relationship: 'Father', dateOfBirth: '1958-01-22' },
    ],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-15', type: 'Onboarding', date: '2016-02-08', note: 'Founding team' },
      { id: 'lc-16', type: 'Active', date: '2016-08-08', note: 'Probation cleared' },
    ],
  },
  {
    id: 'e-1009',
    code: 'MLG-0112',
    name: 'Nilesh Kadam',
    email: 'nilesh.kadam@meridianlogistics.in',
    companyId: 'c-mer-log',
    jurisdiction: 'India — Maharashtra',
    departments: ['Supply Chain'],
    position: 'Operations Lead',
    groups: ['Field Staff'],
    locations: ['Pune Plant', 'Nagpur Depot', 'Mumbai Office'],
    employeeClass: 'Permanent',
    primaryManager: 'Deepa Raghavan',
    dottedLineManagers: [],
    managerEffectiveDate: '2024-06-01',
    hasUserAccount: true,
    lifecycleStage: 'Notice Period',
    joinDate: '2018-09-24',
    aadhar: '3345-6698-2210',
    pan: 'NKAPK3355J',
    passport: '',
    uan: '100334566982',
    esicNumber: '',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-MH v2 (2026-01-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 18, statutoryEntitlement: 21 },
      { type: 'Casual Leave', balance: 2, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 9, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-17', type: 'Onboarding', date: '2018-09-24', note: 'New hire' },
      { id: 'lc-18', type: 'Active', date: '2019-03-24', note: 'Probation cleared' },
      { id: 'lc-19', type: 'Notice Period', date: '2026-06-05', note: 'Resignation initiated' },
    ],
  },
  {
    id: 'e-1010',
    code: 'MER-0455',
    name: 'Kavya Reddy',
    email: 'kavya.reddy@meridianfoods.in',
    companyId: 'c-mer-food',
    jurisdiction: 'India — Telangana',
    departments: ['Quality Assurance'],
    position: 'QA Engineer',
    groups: ['Hybrid'],
    locations: ['Hyderabad Hub'],
    employeeClass: 'Probationer',
    primaryManager: 'Deepa Raghavan',
    dottedLineManagers: ['Nilesh Kadam'],
    managerEffectiveDate: '2026-05-11',
    hasUserAccount: true,
    lifecycleStage: 'Onboarding',
    joinDate: '2026-06-15',
    aadhar: '9912-2034-4456',
    pan: 'KREPR8890C',
    passport: '',
    uan: '',
    esicNumber: '3100778899',
    esiPfEligibility: 'Pending evaluation',
    ptRegistered: false,
    lwfApplicable: false,
    maternityEligibility: 'Pending evaluation',
    gratuityEligibility: 'Not eligible',
    evaluatedRulePack: '—',
    leaveBalances: [
      { type: 'Earned Leave', balance: 0, statutoryEntitlement: 15 },
      { type: 'Casual Leave', balance: 1, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 1, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-20', type: 'Onboarding', date: '2026-06-15', note: 'Joining formalities in progress' },
    ],
  },
  {
    id: 'e-1011',
    code: 'AUR-0301',
    name: 'Tarun Bhalla',
    email: 'tarun.bhalla@aurora.in',
    companyId: 'c-aur-ret',
    jurisdiction: 'India — Karnataka',
    departments: ['Sales'],
    position: 'Sales Executive',
    groups: ['Field Staff'],
    locations: ['Bengaluru HQ', 'Hyderabad Hub'],
    employeeClass: 'Permanent',
    primaryManager: 'Vikram Shetty',
    dottedLineManagers: [],
    managerEffectiveDate: '2025-04-01',
    hasUserAccount: true,
    lifecycleStage: 'Exited',
    joinDate: '2020-01-13',
    aadhar: '1177-8845-9932',
    pan: 'TBHPB1122E',
    passport: '',
    uan: '100117788459',
    esicNumber: '3100334455',
    esiPfEligibility: 'Eligible',
    ptRegistered: true,
    lwfApplicable: true,
    maternityEligibility: 'Not eligible',
    gratuityEligibility: 'Eligible',
    evaluatedRulePack: 'IN-KA v3 (2026-04-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 0, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 0, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 0, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-21', type: 'Onboarding', date: '2020-01-13', note: 'New hire' },
      { id: 'lc-22', type: 'Active', date: '2020-07-13', note: 'Probation cleared' },
      { id: 'lc-23', type: 'Exited', date: '2026-04-30', note: 'Exit processed — history retained' },
    ],
  },
  {
    id: 'e-1012',
    code: 'AUR-0318',
    name: 'Grace D’Souza',
    email: '',
    companyId: 'c-aur-ret',
    jurisdiction: 'India — Karnataka',
    departments: ['Operations', 'Human Resources'],
    position: 'HR Executive',
    groups: [],
    locations: ['Bengaluru HQ'],
    employeeClass: 'Trainee',
    primaryManager: 'Ananya Krishnan',
    dottedLineManagers: [],
    managerEffectiveDate: '2026-02-02',
    hasUserAccount: false,
    lifecycleStage: 'Probation',
    joinDate: '2026-02-02',
    aadhar: '7734-9908-1123',
    pan: 'GDSPD9944A',
    passport: 'T5566771',
    uan: '',
    esicNumber: '3100112233',
    esiPfEligibility: 'Eligible',
    ptRegistered: false,
    lwfApplicable: true,
    maternityEligibility: 'Pending evaluation',
    gratuityEligibility: 'Not eligible',
    evaluatedRulePack: 'IN-KA v3 (2026-04-01)',
    leaveBalances: [
      { type: 'Earned Leave', balance: 2, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 2, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 2, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      { id: 'lc-24', type: 'Onboarding', date: '2026-02-02', note: 'Trainee — record maintained without user account' },
      { id: 'lc-25', type: 'Probation', date: '2026-02-02', note: 'Probation per configured duration' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Manager assignment audit trail + acting-manager delegations         */
/* ------------------------------------------------------------------ */

export type ManagerChangeType = 'Primary' | 'Dotted-line' | 'Acting'

export interface ManagerChange {
  id: string
  employeeName: string
  changeType: ManagerChangeType
  from: string
  to: string
  effectiveDate: string
  endDate: string | null
  changedBy: string
  changedOn: string
}

export const seedManagerChanges: ManagerChange[] = [
  {
    id: 'mc-1',
    employeeName: 'Rohit Menon',
    changeType: 'Primary',
    from: 'Vikram Shetty',
    to: 'Ananya Krishnan',
    effectiveDate: '2024-07-01',
    endDate: null,
    changedBy: 'Ananya Krishnan (Company Admin)',
    changedOn: '2024-06-20',
  },
  {
    id: 'mc-2',
    employeeName: 'Rohit Menon',
    changeType: 'Dotted-line',
    from: '—',
    to: 'Vikram Shetty',
    effectiveDate: '2024-07-01',
    endDate: null,
    changedBy: 'Ananya Krishnan (Company Admin)',
    changedOn: '2024-06-20',
  },
  {
    id: 'mc-3',
    employeeName: 'Kavya Reddy',
    changeType: 'Primary',
    from: '—',
    to: 'Deepa Raghavan',
    effectiveDate: '2026-05-11',
    endDate: null,
    changedBy: 'System (onboarding)',
    changedOn: '2026-05-11',
  },
  {
    id: 'mc-4',
    employeeName: 'Sneha Patil',
    changeType: 'Acting',
    from: 'Rohit Menon',
    to: 'Vikram Shetty',
    effectiveDate: '2026-05-04',
    endDate: '2026-05-15',
    changedBy: 'Rohit Menon (Manager)',
    changedOn: '2026-04-28',
  },
]

export type DelegationStatus = 'Active' | 'Scheduled' | 'Ended'

export interface Delegation {
  id: string
  manager: string
  actingManager: string
  team: string
  startDate: string
  endDate: string
  status: DelegationStatus
  reroutedApprovals: number
}

export const seedDelegations: Delegation[] = [
  {
    id: 'del-1',
    manager: 'Nilesh Kadam',
    actingManager: 'Deepa Raghavan',
    team: 'Supply Chain — Pune',
    startDate: '2026-06-20',
    endDate: '2026-07-10',
    status: 'Active',
    reroutedApprovals: 7,
  },
  {
    id: 'del-2',
    manager: 'Ananya Krishnan',
    actingManager: 'Vikram Shetty',
    team: 'HR — Bengaluru',
    startDate: '2026-07-20',
    endDate: '2026-07-31',
    status: 'Scheduled',
    reroutedApprovals: 0,
  },
  {
    id: 'del-3',
    manager: 'Rohit Menon',
    actingManager: 'Vikram Shetty',
    team: 'Engineering — Bengaluru',
    startDate: '2026-05-04',
    endDate: '2026-05-15',
    status: 'Ended',
    reroutedApprovals: 12,
  },
]

export function companyName(companyId: string): string {
  return COMPANIES.find((c) => c.id === companyId)?.name ?? companyId
}

export function companyGroup(companyId: string): GroupCompany | '—' {
  return COMPANIES.find((c) => c.id === companyId)?.group ?? '—'
}
