/**
 * Kensium-style approver chain configuration (WFE-27 … WFE-39, WFE-42).
 * One unified entity covers every category; category-specific fields
 * (caps, thresholds, payroll cutoff, exit type) are optional.
 */

export const APPROVER_CATEGORIES = [
  'overtime',
  'comp-off',
  'change-request',
  'work-from-home',
  'exit',
  'exit-clearance',
  'layoff',
  'confirmation',
  'disciplinary',
] as const

export type ApproverCategory = (typeof APPROVER_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<ApproverCategory, string> = {
  overtime: 'Overtime Approvers',
  'comp-off': 'Comp Off Approvers',
  'change-request': 'Change Request Approvers',
  'work-from-home': 'Work From Home Approvers',
  exit: 'Exit Approvers',
  'exit-clearance': 'Exit Clearance Approvers',
  layoff: 'Layoff Approvers',
  confirmation: 'Confirmation Approvers',
  disciplinary: 'Disciplinary Action Approvers',
}

export const EXIT_TYPES = [
  'Resignation',
  'Retirement',
  'Termination',
  'End of Contract',
] as const

export interface ApproverGroup {
  id: string
  category: ApproverCategory
  name: string
  locations: string[]
  departments: string[]
  /** Ordered approver hierarchy — first entry is the immediate approver. */
  approvers: string[]
  /** Max hours the immediate supervisor may clear alone (WFE-27, WFE-30). */
  supervisorCapHours: number | null
  /** Payroll-period day-of-month cutoff for change requests (WFE-29). */
  payrollCutoffDay: number | null
  /** Second approval level for requests after the payroll cutoff (WFE-29). */
  secondLevelAfterCutoff: boolean
  /** Exit type this group applies to (WFE-35). */
  exitType: string | null
  /** Minimum employees required to initiate a layoff (WFE-37). */
  minEmployeesThreshold: number | null
  /** Position-level applicability filter (WFE-38). */
  positionLevel: string | null
  updatedBy: string
  updatedAt: string
}

export const seedApproverGroups: ApproverGroup[] = [
  {
    id: 'ag-01',
    category: 'overtime',
    name: 'Chennai Plant OT Chain',
    locations: ['Chennai'],
    departments: ['Operations'],
    approvers: ['Rohit Verma', 'Meera Iyer'],
    supervisorCapHours: 10,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-14',
  },
  {
    id: 'ag-02',
    category: 'overtime',
    name: 'Hyderabad Corporate OT Chain',
    locations: ['Hyderabad'],
    departments: ['Engineering', 'Finance'],
    approvers: ['Vikram Rao', 'Meera Iyer'],
    supervisorCapHours: 8,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-14',
  },
  {
    id: 'ag-03',
    category: 'comp-off',
    name: 'Comp Off — South Plants',
    locations: ['Chennai', 'Hyderabad'],
    departments: ['Operations'],
    approvers: ['Rohit Verma', 'David Kim'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-04-30',
  },
  {
    id: 'ag-04',
    category: 'change-request',
    name: 'Attendance Change — Payroll Guard',
    locations: ['Hyderabad', 'Chennai', 'Pune'],
    departments: ['Operations', 'Engineering'],
    approvers: ['Rohit Verma', 'David Kim'],
    supervisorCapHours: null,
    payrollCutoffDay: 25,
    secondLevelAfterCutoff: true,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'David Kim',
    updatedAt: '2026-06-02',
  },
  {
    id: 'ag-05',
    category: 'work-from-home',
    name: 'WFH — Corporate Offices',
    locations: ['Hyderabad', 'Pune'],
    departments: ['Engineering', 'Sales'],
    approvers: ['Vikram Rao', 'Sunita Patil'],
    supervisorCapHours: 16,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-03-19',
  },
  {
    id: 'ag-06',
    category: 'exit',
    name: 'Resignations — Corporate',
    locations: ['Hyderabad'],
    departments: ['Engineering', 'Finance', 'Human Resources'],
    approvers: ['Vikram Rao', 'Priya Menon', 'Sunita Patil'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: 'Resignation',
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-02-11',
  },
  {
    id: 'ag-07',
    category: 'exit',
    name: 'Terminations — All Sites',
    locations: ['Hyderabad', 'Chennai', 'Pune'],
    departments: ['Operations', 'Sales'],
    approvers: ['Priya Menon', 'Elena Garcia', 'Sunita Patil'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: 'Termination',
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-01-28',
  },
  {
    id: 'ag-08',
    category: 'exit-clearance',
    name: 'Clearance Panel — Standard',
    locations: ['Hyderabad', 'Chennai'],
    departments: [],
    approvers: ['Priya Menon', 'Farhan Ali', 'Elena Garcia', 'Sunita Patil'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Sunita Patil',
    updatedAt: '2025-11-05',
  },
  {
    id: 'ag-09',
    category: 'layoff',
    name: 'Layoff Board — Plants',
    locations: ['Chennai'],
    departments: ['Operations'],
    approvers: ['Meera Iyer', 'Sunita Patil', 'Arjun Mehta'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: 10,
    positionLevel: null,
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-04-08',
  },
  {
    id: 'ag-10',
    category: 'confirmation',
    name: 'Confirmations — Engineering',
    locations: ['Hyderabad', 'Pune'],
    departments: ['Engineering'],
    approvers: ['Vikram Rao', 'Priya Menon'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: 'IC / Team Lead',
    updatedBy: 'Priya Menon',
    updatedAt: '2026-05-27',
  },
  {
    id: 'ag-11',
    category: 'confirmation',
    name: 'Confirmations — Sales & Ops',
    locations: ['Chennai', 'Pune'],
    departments: ['Sales', 'Operations'],
    approvers: ['Meera Iyer', 'Sunita Patil'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: 'All levels',
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-27',
  },
  {
    id: 'ag-12',
    category: 'disciplinary',
    name: 'Disciplinary — Corporate',
    locations: ['Hyderabad'],
    departments: [],
    approvers: ['Priya Menon', 'Elena Garcia', 'Sunita Patil'],
    supervisorCapHours: null,
    payrollCutoffDay: null,
    secondLevelAfterCutoff: false,
    exitType: null,
    minEmployeesThreshold: null,
    positionLevel: null,
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-03-03',
  },
]
