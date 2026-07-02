export const GROUP_SCOPES = ['global', 'group-company', 'company'] as const
export type GroupScope = (typeof GROUP_SCOPES)[number]

export const GROUP_STATUSES = ['active', 'inactive'] as const
export type GroupStatus = (typeof GROUP_STATUSES)[number]

export const GROUP_TYPES = ['static', 'dynamic'] as const
export type GroupType = (typeof GROUP_TYPES)[number]

export const GROUP_CATEGORIES = [
  'organizational',
  'benefit-cohort',
  'payroll-cohort',
  'security',
] as const
export type GroupCategory = (typeof GROUP_CATEGORIES)[number]

export const INHERITANCE_RULES = ['inherit-downward', 'no-inheritance'] as const
export type InheritanceRule = (typeof INHERITANCE_RULES)[number]

export const APPLICABILITY_OPTIONS = [
  'All locations',
  'Hyderabad HQ',
  'Chennai Plant',
  'Bengaluru Office',
  'Remote – India',
  'Field / Work Area',
] as const

export const CLASS_TYPES = ['Permanent', 'Contract', 'Trainee'] as const
export const PAYROLL_FREQUENCIES = ['Monthly', 'Weekly', 'Bi-weekly'] as const
export const WAGE_TYPES = ['Salaried', 'Hourly', 'Daily wage'] as const

export interface OrgGroup {
  id: string
  name: string
  /** Short code used in payroll files, reports and integrations. */
  acronym: string
  /** Free-text purpose / statutory eligibility note (e.g. PoG Act 1972). */
  description: string
  scope: GroupScope
  status: GroupStatus
  type: GroupType
  category: GroupCategory
  parentId: string | null
  applicability: string
  owner: string | null
  /** Membership changes are held pending until an approver acts. */
  requiresApproval: boolean
  /** null = inherit the nearest ancestor's rule (default inherit-downward). */
  inheritanceRule: InheritanceRule | null
  classType: string | null
  payrollFrequency: string | null
  wageType: string | null
  /** Rule expression for dynamic (rule-derived) cohorts. */
  eligibilityRule: string | null
  version: number
  effectiveFrom: string
  updatedBy: string
  updatedAt: string
}

export type MemberKind = 'employee-user' | 'employee-non-user' | 'user'

export interface Member {
  id: string
  name: string
  code: string
  kind: MemberKind
  department: string
  location: string
}

export type MembershipSource = 'manual' | 'rule'

export interface GroupMembership {
  id: string
  groupId: string
  memberId: string
  source: MembershipSource
  effectiveFrom: string
  /** null = still effective (current membership). */
  effectiveTo: string | null
  addedBy: string
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface MembershipRequest {
  id: string
  groupId: string
  memberId: string
  action: 'add' | 'remove'
  requestedBy: string
  requestedAt: string
  status: RequestStatus
  decidedBy: string | null
  decidedAt: string | null
  reason: string | null
}

export interface AuditEvent {
  id: string
  groupId: string
  at: string
  actor: string
  action: string
  detail: string
}

export interface GroupVersion {
  id: string
  groupId: string
  version: number
  effectiveFrom: string
  changedBy: string
  summary: string
  supersedes: number | null
}

export interface PolicyDef {
  id: string
  name: string
  module: string
  /** Groups selected as the policy's applicability criteria. */
  groupIds: string[]
}

export interface MemberNotification {
  id: string
  memberId: string
  at: string
  text: string
}

export const seedGroups: OrgGroup[] = [
  {
    id: 'g-01',
    name: 'All Employees',
    acronym: 'ALLEMP',
    description:
      'Platform-wide default group containing the entire workforce. Used as the baseline population for global policies.',
    scope: 'global',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: null,
    applicability: 'All locations',
    owner: 'Platform Governance',
    requiresApproval: false,
    inheritanceRule: 'inherit-downward',
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 3,
    effectiveFrom: '2025-01-01',
    updatedBy: 'Asha Verma (Platform Admin)',
    updatedAt: '2026-03-14',
  },
  {
    id: 'g-02',
    name: 'Security – HR Data Admins',
    acronym: 'HRSEC',
    description:
      'Security group granting elevated access to sensitive HR data. Membership contributes to the user security context.',
    scope: 'global',
    status: 'active',
    type: 'static',
    category: 'security',
    parentId: null,
    applicability: 'All locations',
    owner: 'Platform Governance',
    requiresApproval: true,
    inheritanceRule: 'no-inheritance',
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 2,
    effectiveFrom: '2025-06-01',
    updatedBy: 'Asha Verma (Platform Admin)',
    updatedAt: '2026-01-22',
  },
  {
    id: 'g-03',
    name: 'Contractors (Global)',
    acronym: 'CONTR',
    description:
      'Rule-derived cohort of contract workers across all tenants for global compliance policies.',
    scope: 'global',
    status: 'active',
    type: 'dynamic',
    category: 'organizational',
    parentId: 'g-01',
    applicability: 'All locations',
    owner: 'Platform Governance',
    requiresApproval: false,
    inheritanceRule: null,
    classType: 'Contract',
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: 'employment_type = Contract',
    version: 1,
    effectiveFrom: '2025-08-01',
    updatedBy: 'Asha Verma (Platform Admin)',
    updatedAt: '2025-08-01',
  },
  {
    id: 'g-04',
    name: 'Kensium Group – Leadership',
    acronym: 'KGLEAD',
    description:
      'Leadership cohort shared across the member companies of the Kensium group company.',
    scope: 'group-company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: null,
    applicability: 'All locations',
    owner: 'Meera Krishnan',
    requiresApproval: true,
    inheritanceRule: 'inherit-downward',
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 2,
    effectiveFrom: '2025-04-01',
    updatedBy: 'Rahul Menon (Group Company Admin)',
    updatedAt: '2026-02-10',
  },
  {
    id: 'g-05',
    name: 'Kensium Group – IT Access',
    acronym: 'KGIT',
    description:
      'Security group used for shared IT system access across the group company. Sensitive: changes need approval.',
    scope: 'group-company',
    status: 'active',
    type: 'static',
    category: 'security',
    parentId: null,
    applicability: 'All locations',
    owner: 'Rahul Menon',
    requiresApproval: true,
    inheritanceRule: 'no-inheritance',
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2025-09-15',
    updatedBy: 'Rahul Menon (Group Company Admin)',
    updatedAt: '2025-09-15',
  },
  {
    id: 'g-06',
    name: 'ESI Cohort',
    acronym: 'ESI',
    description:
      'Employees covered under the Employees’ State Insurance Act 1948 — gross monthly salary ≤ ₹21,000. Drives ESI contribution in payroll.',
    scope: 'company',
    status: 'active',
    type: 'dynamic',
    category: 'benefit-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Divya Rao',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: 'gross_monthly_salary <= 21000 (ESI Act 1948)',
    version: 4,
    effectiveFrom: '2026-04-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-04-01',
  },
  {
    id: 'g-07',
    name: 'Gratuity Cohort',
    acronym: 'GRAT',
    description:
      'Employees eligible for gratuity under the Payment of Gratuity Act 1972 — continuous service of 4 years 240 days or more.',
    scope: 'company',
    status: 'active',
    type: 'dynamic',
    category: 'benefit-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Divya Rao',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: 'continuous_service >= 4y 240d (Payment of Gratuity Act 1972)',
    version: 2,
    effectiveFrom: '2026-01-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-01-01',
  },
  {
    id: 'g-08',
    name: 'Group Health Insurance',
    acronym: 'GHI',
    description:
      'Employees enrolled in the corporate group health insurance scheme. Membership changes require approval during the policy year.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'benefit-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Divya Rao',
    requiresApproval: true,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2025-04-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2025-04-01',
  },
  {
    id: 'g-09',
    name: 'Physically Challenged',
    acronym: 'PHC',
    description:
      'Statutory cohort for differently-abled employees, used for accessibility support and statutory reporting.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'benefit-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Divya Rao',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2025-04-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2025-04-01',
  },
  {
    id: 'g-10',
    name: 'Monthly Payroll – Staff',
    acronym: 'MPS',
    description:
      'Payroll cohort for permanent salaried staff processed on the monthly cycle.',
    scope: 'company',
    status: 'active',
    type: 'dynamic',
    category: 'payroll-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Kiran Joshi',
    requiresApproval: false,
    inheritanceRule: null,
    classType: 'Permanent',
    payrollFrequency: 'Monthly',
    wageType: 'Salaried',
    eligibilityRule: 'class_type = Permanent AND wage_type = Salaried',
    version: 2,
    effectiveFrom: '2025-10-01',
    updatedBy: 'Kiran Joshi (Company Admin)',
    updatedAt: '2025-10-01',
  },
  {
    id: 'g-11',
    name: 'Weekly Wage Workers',
    acronym: 'WWW',
    description:
      'Payroll cohort for contract daily-wage workers processed on the weekly cycle.',
    scope: 'company',
    status: 'active',
    type: 'dynamic',
    category: 'payroll-cohort',
    parentId: null,
    applicability: 'Chennai Plant',
    owner: 'Kiran Joshi',
    requiresApproval: false,
    inheritanceRule: null,
    classType: 'Contract',
    payrollFrequency: 'Weekly',
    wageType: 'Daily wage',
    eligibilityRule: 'class_type = Contract AND wage_type = Daily wage',
    version: 1,
    effectiveFrom: '2025-10-01',
    updatedBy: 'Kiran Joshi (Company Admin)',
    updatedAt: '2025-10-01',
  },
  {
    id: 'g-12',
    name: 'Engineering',
    acronym: 'ENG',
    description: 'All engineering staff. Parent of the platform and QA sub-groups.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: null,
    applicability: 'All locations',
    owner: 'Sanjay Iyer',
    requiresApproval: false,
    inheritanceRule: 'inherit-downward',
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 3,
    effectiveFrom: '2026-02-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-02-01',
  },
  {
    id: 'g-13',
    name: 'Engineering – Platform',
    acronym: 'ENGP',
    description: 'Platform engineering pod under Engineering.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: 'g-12',
    applicability: 'Hyderabad HQ',
    owner: 'Sanjay Iyer',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2026-02-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-02-01',
  },
  {
    id: 'g-14',
    name: 'Engineering – QA',
    acronym: 'ENGQ',
    description: 'Quality assurance pod under Engineering.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: 'g-12',
    applicability: 'Bengaluru Office',
    owner: 'Sanjay Iyer',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2026-02-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-02-01',
  },
  {
    id: 'g-15',
    name: 'Engineering – QA – Automation',
    acronym: 'ENGQA',
    description: 'Automation squad nested at the third level under QA (n-level nesting).',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: 'g-14',
    applicability: 'Bengaluru Office',
    owner: 'Sanjay Iyer',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2026-03-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2026-03-01',
  },
  {
    id: 'g-16',
    name: 'Hyderabad Office',
    acronym: 'HYD',
    description: 'Location cohort limited to the Hyderabad HQ work area.',
    scope: 'company',
    status: 'active',
    type: 'static',
    category: 'organizational',
    parentId: null,
    applicability: 'Hyderabad HQ',
    owner: 'Divya Rao',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 1,
    effectiveFrom: '2025-04-01',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2025-04-01',
  },
  {
    id: 'g-17',
    name: 'Festival Advance 2024',
    acronym: 'FA24',
    description:
      'Retired cohort for the FY-2024 festival advance benefit. Kept inactive to preserve historical membership.',
    scope: 'company',
    status: 'inactive',
    type: 'static',
    category: 'benefit-cohort',
    parentId: null,
    applicability: 'All locations',
    owner: 'Divya Rao',
    requiresApproval: false,
    inheritanceRule: null,
    classType: null,
    payrollFrequency: null,
    wageType: null,
    eligibilityRule: null,
    version: 2,
    effectiveFrom: '2025-01-15',
    updatedBy: 'Divya Rao (Company Admin)',
    updatedAt: '2025-01-15',
  },
]

export const seedMembers: Member[] = [
  { id: 'm-01', name: 'Ananya Sharma', code: 'EMP-1001', kind: 'employee-user', department: 'Engineering', location: 'Hyderabad HQ' },
  { id: 'm-02', name: 'Vikram Patel', code: 'EMP-1002', kind: 'employee-user', department: 'Engineering', location: 'Bengaluru Office' },
  { id: 'm-03', name: 'Lakshmi Narayanan', code: 'EMP-1003', kind: 'employee-user', department: 'Finance', location: 'Chennai Plant' },
  { id: 'm-04', name: 'Rohit Kulkarni', code: 'EMP-1004', kind: 'employee-user', department: 'HR', location: 'Hyderabad HQ' },
  { id: 'm-05', name: 'Sunita Devi', code: 'EMP-1005', kind: 'employee-non-user', department: 'Operations', location: 'Chennai Plant' },
  { id: 'm-06', name: 'Mahesh Yadav', code: 'EMP-1006', kind: 'employee-non-user', department: 'Operations', location: 'Chennai Plant' },
  { id: 'm-07', name: 'Farah Khan', code: 'EMP-1007', kind: 'employee-user', department: 'Engineering', location: 'Bengaluru Office' },
  { id: 'm-08', name: 'Joseph Thomas', code: 'EMP-1008', kind: 'employee-user', department: 'Engineering', location: 'Hyderabad HQ' },
  { id: 'm-09', name: 'Priyanka Ghosh', code: 'EMP-1009', kind: 'employee-user', department: 'Sales', location: 'Remote – India' },
  { id: 'm-10', name: 'Arjun Reddy', code: 'EMP-1010', kind: 'employee-non-user', department: 'Facilities', location: 'Hyderabad HQ' },
  { id: 'm-11', name: 'Neha Gupta', code: 'USR-2001', kind: 'user', department: 'IT Services', location: 'Hyderabad HQ' },
  { id: 'm-12', name: 'Suresh Babu', code: 'USR-2002', kind: 'user', department: 'IT Services', location: 'Chennai Plant' },
  { id: 'm-13', name: 'Deepa Menon', code: 'EMP-1011', kind: 'employee-user', department: 'HR', location: 'Bengaluru Office' },
  { id: 'm-14', name: 'Imran Shaikh', code: 'EMP-1012', kind: 'employee-non-user', department: 'Operations', location: 'Chennai Plant' },
]

export const seedMemberships: GroupMembership[] = [
  // ESI cohort (dynamic, rule-derived + one manual exception)
  { id: 'ms-01', groupId: 'g-06', memberId: 'm-05', source: 'rule', effectiveFrom: '2026-04-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-02', groupId: 'g-06', memberId: 'm-06', source: 'rule', effectiveFrom: '2026-04-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-03', groupId: 'g-06', memberId: 'm-10', source: 'rule', effectiveFrom: '2026-04-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-04', groupId: 'g-06', memberId: 'm-14', source: 'manual', effectiveFrom: '2026-05-10', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  // Gratuity cohort
  { id: 'ms-05', groupId: 'g-07', memberId: 'm-01', source: 'rule', effectiveFrom: '2026-01-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-06', groupId: 'g-07', memberId: 'm-03', source: 'rule', effectiveFrom: '2026-01-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-07', groupId: 'g-07', memberId: 'm-04', source: 'rule', effectiveFrom: '2026-01-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  // GHI — includes a historical membership that ended
  { id: 'ms-08', groupId: 'g-08', memberId: 'm-01', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-09', groupId: 'g-08', memberId: 'm-02', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-10', groupId: 'g-08', memberId: 'm-09', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', addedBy: 'Divya Rao (Company Admin)' },
  // Physically challenged
  { id: 'ms-11', groupId: 'g-09', memberId: 'm-06', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  // Payroll cohorts
  { id: 'ms-12', groupId: 'g-10', memberId: 'm-01', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-13', groupId: 'g-10', memberId: 'm-02', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-14', groupId: 'g-10', memberId: 'm-03', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-15', groupId: 'g-10', memberId: 'm-04', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-16', groupId: 'g-11', memberId: 'm-05', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-17', groupId: 'g-11', memberId: 'm-14', source: 'rule', effectiveFrom: '2025-10-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  // Engineering hierarchy
  { id: 'ms-18', groupId: 'g-12', memberId: 'm-08', source: 'manual', effectiveFrom: '2026-02-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-19', groupId: 'g-13', memberId: 'm-01', source: 'manual', effectiveFrom: '2026-02-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-20', groupId: 'g-14', memberId: 'm-02', source: 'manual', effectiveFrom: '2026-02-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-21', groupId: 'g-15', memberId: 'm-07', source: 'manual', effectiveFrom: '2026-03-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  // Security groups (users associated with groups)
  { id: 'ms-22', groupId: 'g-02', memberId: 'm-11', source: 'manual', effectiveFrom: '2025-06-01', effectiveTo: null, addedBy: 'Asha Verma (Platform Admin)' },
  { id: 'ms-23', groupId: 'g-05', memberId: 'm-12', source: 'manual', effectiveFrom: '2025-09-15', effectiveTo: null, addedBy: 'Rahul Menon (Group Company Admin)' },
  // Leadership
  { id: 'ms-24', groupId: 'g-04', memberId: 'm-04', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Rahul Menon (Group Company Admin)' },
  // Hyderabad office
  { id: 'ms-25', groupId: 'g-16', memberId: 'm-01', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-26', groupId: 'g-16', memberId: 'm-04', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-27', groupId: 'g-16', memberId: 'm-10', source: 'manual', effectiveFrom: '2025-04-01', effectiveTo: null, addedBy: 'Divya Rao (Company Admin)' },
  // Retired festival advance cohort — history only
  { id: 'ms-28', groupId: 'g-17', memberId: 'm-05', source: 'manual', effectiveFrom: '2025-01-15', effectiveTo: '2025-12-31', addedBy: 'Divya Rao (Company Admin)' },
  { id: 'ms-29', groupId: 'g-17', memberId: 'm-06', source: 'manual', effectiveFrom: '2025-01-15', effectiveTo: '2025-12-31', addedBy: 'Divya Rao (Company Admin)' },
  // Global contractors (dynamic)
  { id: 'ms-30', groupId: 'g-03', memberId: 'm-05', source: 'rule', effectiveFrom: '2025-08-01', effectiveTo: null, addedBy: 'Eligibility engine' },
  { id: 'ms-31', groupId: 'g-03', memberId: 'm-14', source: 'rule', effectiveFrom: '2025-08-01', effectiveTo: null, addedBy: 'Eligibility engine' },
]

export const seedRequests: MembershipRequest[] = [
  {
    id: 'req-01',
    groupId: 'g-08',
    memberId: 'm-13',
    action: 'add',
    requestedBy: 'Divya Rao (Company Admin)',
    requestedAt: '2026-06-24',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    reason: null,
  },
  {
    id: 'req-02',
    groupId: 'g-05',
    memberId: 'm-11',
    action: 'add',
    requestedBy: 'Divya Rao (Company Admin)',
    requestedAt: '2026-06-25',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    reason: null,
  },
  {
    id: 'req-03',
    groupId: 'g-04',
    memberId: 'm-13',
    action: 'add',
    requestedBy: 'Divya Rao (Company Admin)',
    requestedAt: '2026-05-30',
    status: 'rejected',
    decidedBy: 'Rahul Menon (Group Company Admin)',
    decidedAt: '2026-06-02',
    reason: 'Leadership cohort limited to director grade and above.',
  },
]

export const seedAuditEvents: AuditEvent[] = [
  { id: 'ae-01', groupId: 'g-06', at: '2026-04-01 09:12', actor: 'Divya Rao (Company Admin)', action: 'Version published', detail: 'ESI wage ceiling updated to ₹21,000 (v4 supersedes v3), effective 01 Apr 2026' },
  { id: 'ae-02', groupId: 'g-06', at: '2026-04-01 09:14', actor: 'Eligibility engine', action: 'Membership derived', detail: '3 members auto-added by rule; 1 manual exception preserved' },
  { id: 'ae-03', groupId: 'g-12', at: '2026-02-01 11:40', actor: 'Divya Rao (Company Admin)', action: 'Hierarchy changed', detail: 'Engineering – Platform and Engineering – QA nested under Engineering' },
  { id: 'ae-04', groupId: 'g-15', at: '2026-03-01 10:05', actor: 'Divya Rao (Company Admin)', action: 'Group created', detail: 'Engineering – QA – Automation added at level 3 under Engineering – QA' },
  { id: 'ae-05', groupId: 'g-08', at: '2026-03-31 17:22', actor: 'Divya Rao (Company Admin)', action: 'Membership ended', detail: 'Priyanka Ghosh removed, effective-to 31 Mar 2026 (history retained)' },
  { id: 'ae-06', groupId: 'g-17', at: '2025-01-15 08:30', actor: 'Divya Rao (Company Admin)', action: 'Status changed', detail: 'Festival Advance 2024 set Inactive; historical membership preserved' },
  { id: 'ae-07', groupId: 'g-02', at: '2026-01-22 14:00', actor: 'Asha Verma (Platform Admin)', action: 'Approval required', detail: 'Security – HR Data Admins flagged as approval-controlled (v2)' },
  { id: 'ae-08', groupId: 'g-04', at: '2026-06-02 12:15', actor: 'Rahul Menon (Group Company Admin)', action: 'Request rejected', detail: 'Add Deepa Menon rejected — leadership cohort limited to director grade' },
]

export const seedVersions: GroupVersion[] = [
  { id: 'gv-01', groupId: 'g-06', version: 4, effectiveFrom: '2026-04-01', changedBy: 'Divya Rao (Company Admin)', summary: 'ESI wage ceiling updated to ₹21,000', supersedes: 3 },
  { id: 'gv-02', groupId: 'g-06', version: 3, effectiveFrom: '2025-10-01', changedBy: 'Divya Rao (Company Admin)', summary: 'Applicability widened to all locations', supersedes: 2 },
  { id: 'gv-03', groupId: 'g-07', version: 2, effectiveFrom: '2026-01-01', changedBy: 'Divya Rao (Company Admin)', summary: 'Eligibility clarified per PoG Act 1972 (4y 240d)', supersedes: 1 },
  { id: 'gv-04', groupId: 'g-12', version: 3, effectiveFrom: '2026-02-01', changedBy: 'Divya Rao (Company Admin)', summary: 'Sub-groups nested; inheritance set to inherit-downward', supersedes: 2 },
  { id: 'gv-05', groupId: 'g-01', version: 3, effectiveFrom: '2026-03-14', changedBy: 'Asha Verma (Platform Admin)', summary: 'Description refreshed for policy baseline use', supersedes: 2 },
  { id: 'gv-06', groupId: 'g-02', version: 2, effectiveFrom: '2026-01-22', changedBy: 'Asha Verma (Platform Admin)', summary: 'Approval-controlled membership enabled', supersedes: 1 },
]

export const seedPolicies: PolicyDef[] = [
  { id: 'p-01', name: 'Gratuity Policy (PoG Act 1972)', module: 'Benefits', groupIds: ['g-07'] },
  { id: 'p-02', name: 'ESI Remittance', module: 'Payroll', groupIds: ['g-06'] },
  { id: 'p-03', name: 'Health Insurance Enrollment', module: 'Benefits', groupIds: ['g-08'] },
  { id: 'p-04', name: 'Monthly Payroll Run', module: 'Payroll', groupIds: ['g-10'] },
  { id: 'p-05', name: 'Weekly Payroll Run', module: 'Payroll', groupIds: ['g-11'] },
  { id: 'p-06', name: 'HR Data Access Policy', module: 'Security', groupIds: ['g-02'] },
  { id: 'p-07', name: 'Leave Policy – Engineering', module: 'Leave', groupIds: ['g-12'] },
  { id: 'p-08', name: 'Accessibility Support Policy', module: 'Benefits', groupIds: ['g-09'] },
]

export const seedNotifications: MemberNotification[] = [
  { id: 'n-01', memberId: 'm-01', at: '2026-01-01', text: 'You were added to Gratuity Cohort (GRAT), effective 01 Jan 2026 — Payment of Gratuity Act 1972 eligibility.' },
  { id: 'n-02', memberId: 'm-01', at: '2025-04-01', text: 'You were added to Group Health Insurance (GHI), effective 01 Apr 2025.' },
  { id: 'n-03', memberId: 'm-01', at: '2026-02-01', text: 'You were added to Engineering – Platform (ENGP), effective 01 Feb 2026.' },
  { id: 'n-04', memberId: 'm-09', at: '2026-03-31', text: 'You were removed from Group Health Insurance (GHI), effective 31 Mar 2026.' },
]

/** Persona used for the self-service "My Groups" view per employee role. */
export const SELF_MEMBER_USER_ID = 'm-01'
export const SELF_MEMBER_NON_USER_ID = 'm-05'

/** Rows a simulated membership-import file resolves to. */
export const IMPORT_FILE_ROWS: { memberId: string | null; raw: string }[] = [
  { memberId: 'm-13', raw: 'EMP-1011 Deepa Menon' },
  { memberId: 'm-09', raw: 'EMP-1009 Priyanka Ghosh' },
  { memberId: null, raw: 'EMP-9999 Unknown Employee (no match)' },
  { memberId: null, raw: 'EMP-7001 Other-tenant employee (out of scope)' },
]
