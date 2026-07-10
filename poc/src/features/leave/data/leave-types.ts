/**
 * Leave type catalog (LVE-02, LVE-35, LVE-36) plus the platform-level master
 * catalog (LVE-20). Types carry the full Kensium "Paid Time Off" (31-field)
 * and "Unpaid Time Off" (22-field) configuration attributes: paid/unpaid,
 * tracking unit, instances per day, carry-forward & payout rules, exemptions,
 * credit/accrual rules with service periods, eligibility (policy doc, gender,
 * max avails), applicability (locations/departments/positions/groups),
 * dependencies (clubbable / zero-balance-of), applicable-from and document
 * requirements.
 */

export type LeaveCategory = 'paid' | 'unpaid'
export type TrackingUnit = 'days' | 'hours'
export type CreditTiming = 'beginning' | 'end' | 'service-date'
export type CreditFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'annually'
export type ApplicableFrom =
  | 'doj'
  | 'confirmation'
  | 'confirmation-plus-months'
  | 'after-months'
export type LeaveGender = 'All' | 'Female' | 'Male'

/** Accrual rate applicable while employee tenure falls inside the band. */
export interface ServicePeriod {
  fromYears: number
  toYears: number
  /** Time-offs accrued per credit-frequency period within this band. */
  accrual: number
}

export interface MaxTimesAvailable {
  count: number
  per: 'year' | 'service'
}

export interface LeaveType {
  id: string
  name: string
  category: LeaveCategory
  unit: TrackingUnit
  /** Number of time-offs allotted per year (days or hours per `unit`). */
  allotted: number
  fmla: boolean
  applicability: string
  excludedLevels: string[]
  active: boolean
  /** Display position in the employee-facing dropdown (LVE-36). */
  order: number
  /** Extra form fields the dynamic-fields engine renders for this type (LVE-28). */
  dynamicFields: string[]

  // --- Basics (PTO #2/#4, UPTO #2/#4) ---
  /** Brief description shown to admins and employees. */
  description: string
  /** Leave instances per working day (8h day ÷ 4h min block = 2). */
  instancesPerDay: number

  // --- Carry forward & payout (PTO #5–#8; always false/0 for unpaid) ---
  canCarryForward: boolean
  /** Max hours/days that can be carried forward. */
  maxCarryForward: number
  canBePaidOut: boolean
  /** Minimum days/hours that gain payout eligibility. */
  minPayoutEligibility: number

  // --- Exemptions & availability (PTO #9–#12, UPTO #5–#8) ---
  exemptHolidays: boolean
  exemptWeeklyOffs: boolean
  availDuringNotice: boolean
  availDuringPip: boolean

  // --- Credits & accrual (PTO #14–#18, UPTO #10) ---
  /**
   * true  → balance-gated: apply only against credited balance; excess = LOP.
   * false → capped by `allotted` per year; excess beyond the cap = LOP.
   */
  appliedBasedOnCredit: boolean
  creditTiming: CreditTiming
  /** Only meaningful when creditTiming is 'beginning' | 'end'. */
  creditFrequency: CreditFrequency
  proRataAccrual: boolean
  /** Accrual rate per service (tenure) band. */
  servicePeriods: ServicePeriod[]

  // --- Eligibility (PTO #19–#21, UPTO #11–#13) ---
  /** Name of the linked policy document, or null. */
  policyDocument: string | null
  gender: LeaveGender
  /** Max number of times the leave can be availed, per year or per service. */
  maxTimesAvailable: MaxTimesAvailable | null

  // --- Applicability (PTO #22–#25, UPTO #14–#17); ['All'] = everyone ---
  applicableLocations: string[]
  applicableDepartments: string[]
  applicablePositions: string[]
  applicableGroups: string[]

  // --- Dependencies (PTO #26–#27, UPTO #18) ---
  /** Names of other leave types that can be availed together each year. */
  clubbableWith: string[]
  /** Types whose balance must be zero before this one can be availed. */
  zeroBalanceOf: string[]

  // --- Applicable from (PTO #28, UPTO #19) ---
  applicableFrom: ApplicableFrom
  /** "x" months for confirmation-plus-months / after-months. */
  applicableFromMonths: number

  // --- Documents (PTO #29–#31, UPTO #20–#22) ---
  documentsRequired: boolean
  /** Remind employees X days before the document due date. */
  documentReminderDays: number
  /** Days allowed to submit documents from the time-off avail date. */
  documentResponseDays: number
}

/** Baseline used by seeds and drafts for the enriched Kensium fields. */
export const LEAVE_TYPE_FIELD_DEFAULTS = {
  description: '',
  instancesPerDay: 2,
  canCarryForward: false,
  maxCarryForward: 0,
  canBePaidOut: false,
  minPayoutEligibility: 0,
  exemptHolidays: true,
  exemptWeeklyOffs: true,
  availDuringNotice: false,
  availDuringPip: false,
  appliedBasedOnCredit: false,
  creditTiming: 'beginning' as CreditTiming,
  creditFrequency: 'annually' as CreditFrequency,
  proRataAccrual: false,
  servicePeriods: [] as ServicePeriod[],
  policyDocument: null as string | null,
  gender: 'All' as LeaveGender,
  maxTimesAvailable: null as MaxTimesAvailable | null,
  applicableLocations: ['All'],
  applicableDepartments: ['All'],
  applicablePositions: ['All'],
  applicableGroups: ['All'],
  clubbableWith: [] as string[],
  zeroBalanceOf: [] as string[],
  applicableFrom: 'doj' as ApplicableFrom,
  applicableFromMonths: 0,
  documentsRequired: false,
  documentReminderDays: 0,
  documentResponseDays: 0,
}

export const seedLeaveTypes: LeaveType[] = [
  {
    id: 'lt-privileged',
    name: 'Privileged / Annual Leave',
    category: 'paid',
    unit: 'days',
    allotted: 18,
    fmla: false,
    applicability: 'All employees',
    excludedLevels: [],
    active: true,
    order: 1,
    dynamicFields: ['Half-day option'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Earned annual leave credited monthly; accrual accelerates with tenure.',
    canCarryForward: true,
    maxCarryForward: 10,
    canBePaidOut: true,
    minPayoutEligibility: 5,
    availDuringNotice: true,
    appliedBasedOnCredit: true,
    creditTiming: 'beginning',
    creditFrequency: 'monthly',
    proRataAccrual: true,
    servicePeriods: [
      { fromYears: 0, toYears: 2, accrual: 1.0 },
      { fromYears: 2, toYears: 5, accrual: 1.5 },
      { fromYears: 5, toYears: 99, accrual: 2.0 },
    ],
    policyDocument: 'India Standard Leave Policy',
    clubbableWith: ['Casual Leave'],
    applicableFrom: 'confirmation',
  },
  {
    id: 'lt-casual',
    name: 'Casual Leave',
    category: 'paid',
    unit: 'days',
    allotted: 8,
    fmla: false,
    applicability: 'All employees',
    excludedLevels: [],
    active: true,
    order: 2,
    dynamicFields: ['Half-day option'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Short-notice personal leave; capped by the yearly allotment rather than credited balance.',
    appliedBasedOnCredit: false,
    policyDocument: 'India Standard Leave Policy',
    clubbableWith: ['Privileged / Annual Leave'],
  },
  {
    id: 'lt-sick',
    name: 'Sick / Medical Leave',
    category: 'paid',
    unit: 'hours',
    allotted: 96,
    fmla: false,
    applicability: 'All employees',
    excludedLevels: [],
    active: true,
    order: 3,
    dynamicFields: ['Medical certificate attachment', 'Half-day option'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Hourly-tracked medical leave; medical certificate required after availing.',
    availDuringNotice: true,
    availDuringPip: true,
    appliedBasedOnCredit: true,
    creditTiming: 'beginning',
    creditFrequency: 'quarterly',
    servicePeriods: [{ fromYears: 0, toYears: 99, accrual: 24 }],
    policyDocument: 'India Standard Leave Policy',
    documentsRequired: true,
    documentReminderDays: 3,
    documentResponseDays: 7,
  },
  {
    id: 'lt-maternity',
    name: 'Maternity Leave',
    category: 'paid',
    unit: 'days',
    allotted: 182,
    fmla: false,
    applicability: 'Female employees, tenure > 80 days',
    excludedLevels: [],
    active: true,
    order: 4,
    dynamicFields: ['Expected date', 'Medical certificate attachment'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Statutory maternity benefit; availed at most twice across the service period.',
    instancesPerDay: 1,
    exemptHolidays: false,
    exemptWeeklyOffs: false,
    creditTiming: 'service-date',
    policyDocument: 'India Standard Leave Policy',
    gender: 'Female',
    maxTimesAvailable: { count: 2, per: 'service' },
    applicableFrom: 'after-months',
    applicableFromMonths: 3,
    documentsRequired: true,
    documentReminderDays: 7,
    documentResponseDays: 15,
  },
  {
    id: 'lt-paternity',
    name: 'Paternity Leave',
    category: 'paid',
    unit: 'days',
    allotted: 15,
    fmla: false,
    applicability: 'Male employees',
    excludedLevels: [],
    active: true,
    order: 5,
    dynamicFields: ['Expected date'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description: 'Paternity leave around childbirth or adoption.',
    instancesPerDay: 1,
    policyDocument: 'India Standard Leave Policy',
    gender: 'Male',
    maxTimesAvailable: { count: 2, per: 'service' },
    applicableFrom: 'confirmation',
  },
  {
    id: 'lt-bereavement',
    name: 'Bereavement Leave',
    category: 'paid',
    unit: 'days',
    allotted: 5,
    fmla: false,
    applicability: 'All employees',
    excludedLevels: [],
    active: true,
    order: 6,
    dynamicFields: ['Relationship to deceased'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description: 'Compassionate leave on the loss of an immediate family member.',
    instancesPerDay: 1,
    availDuringNotice: true,
    availDuringPip: true,
    maxTimesAvailable: { count: 2, per: 'year' },
  },
  {
    id: 'lt-compoff',
    name: 'Compensatory-off (Comp-off)',
    category: 'paid',
    unit: 'days',
    allotted: 0,
    fmla: false,
    applicability: 'Earned via approved extra work / overtime',
    excludedLevels: ['L4 - Director', 'L5 - VP'],
    active: true,
    order: 7,
    dynamicFields: ['Comp-off source reference'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Credited only against approved extra work; must be used against earned credits.',
    appliedBasedOnCredit: true,
    applicablePositions: ['L1 - Associate', 'L2 - Senior', 'L3 - Manager'],
  },
  {
    id: 'lt-fmla',
    name: 'FMLA Leave',
    category: 'unpaid',
    unit: 'hours',
    allotted: 480,
    fmla: true,
    applicability: 'US employees, 12+ months tenure',
    excludedLevels: [],
    active: true,
    order: 8,
    dynamicFields: ['FMLA qualifying reason', 'Medical certificate attachment'],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'US Family and Medical Leave Act entitlement — unpaid, cannot carry forward or pay out.',
    availDuringNotice: true,
    availDuringPip: true,
    appliedBasedOnCredit: true,
    policyDocument: 'US FMLA-Aligned Policy',
    applicableLocations: ['Austin'],
    applicableFrom: 'after-months',
    applicableFromMonths: 12,
    documentsRequired: true,
    documentReminderDays: 5,
    documentResponseDays: 15,
  },
  {
    id: 'lt-lop',
    name: 'Loss of Pay (LOP)',
    category: 'unpaid',
    unit: 'days',
    allotted: 0,
    fmla: false,
    applicability: 'All employees — unpaid absence',
    excludedLevels: [],
    active: true,
    order: 9,
    dynamicFields: [],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description:
      'Unpaid absence taken when paid balances are exhausted; no carry forward or payout.',
    availDuringNotice: true,
    availDuringPip: true,
    zeroBalanceOf: ['Privileged / Annual Leave', 'Casual Leave'],
  },
  {
    id: 'lt-sabbatical',
    name: 'Sabbatical (Retired)',
    category: 'unpaid',
    unit: 'days',
    allotted: 90,
    fmla: false,
    applicability: 'Deactivated — historical records only',
    excludedLevels: [],
    active: false,
    order: 10,
    dynamicFields: [],
    ...LEAVE_TYPE_FIELD_DEFAULTS,
    description: 'Retired long-service sabbatical program; kept for history.',
    instancesPerDay: 1,
    maxTimesAvailable: { count: 1, per: 'service' },
    applicableFrom: 'after-months',
    applicableFromMonths: 60,
  },
]

/** Platform Admin master catalog entry (LVE-20). */
export interface CatalogEntry {
  id: string
  name: string
  enabledForTenants: boolean
  statutory: boolean
}

export const seedCatalog: CatalogEntry[] = [
  { id: 'cat-1', name: 'Privileged / Annual Leave', enabledForTenants: true, statutory: false },
  { id: 'cat-2', name: 'Casual Leave', enabledForTenants: true, statutory: false },
  { id: 'cat-3', name: 'Sick / Medical Leave', enabledForTenants: true, statutory: true },
  { id: 'cat-4', name: 'Maternity Leave', enabledForTenants: true, statutory: true },
  { id: 'cat-5', name: 'Paternity Leave', enabledForTenants: true, statutory: false },
  { id: 'cat-6', name: 'Bereavement Leave', enabledForTenants: true, statutory: false },
  { id: 'cat-7', name: 'Compensatory-off (Comp-off)', enabledForTenants: true, statutory: false },
  { id: 'cat-8', name: 'FMLA Leave', enabledForTenants: true, statutory: true },
  { id: 'cat-9', name: 'Sabbatical', enabledForTenants: false, statutory: false },
]
