/**
 * Leave type catalog (LVE-02, LVE-35, LVE-36) plus the platform-level master
 * catalog (LVE-20). Types carry the Kensium-style attributes: paid/unpaid,
 * tracking unit, allotted count, FMLA flag, applicability and excluded
 * position levels.
 */

export type LeaveCategory = 'paid' | 'unpaid'
export type TrackingUnit = 'days' | 'hours'

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
