/**
 * Employees module — onboarding & exit workflow data
 * (New Joinees, Joining Checklist, Exits, Clearances, HR Checklist, Layoffs).
 */

export type JoineeStatus = 'Pending initiation' | 'In Progress' | 'Completed'

export interface NewJoinee {
  id: string
  candidateName: string
  employeeCode: string
  dateOfJoining: string
  department: string
  positionLevel: string
  status: JoineeStatus
  tasksDone: number
  tasksTotal: number
}

export const seedJoinees: NewJoinee[] = [
  {
    id: 'nj-1',
    candidateName: 'Kavya Reddy',
    employeeCode: 'MER-0455',
    dateOfJoining: '2026-06-15',
    department: 'Quality Assurance',
    positionLevel: 'QA Engineer',
    status: 'In Progress',
    tasksDone: 3,
    tasksTotal: 5,
  },
  {
    id: 'nj-2',
    candidateName: 'Aditya Sharma',
    employeeCode: 'AUR-0322',
    dateOfJoining: '2026-07-06',
    department: 'Engineering',
    positionLevel: 'Software Engineer',
    status: 'Pending initiation',
    tasksDone: 0,
    tasksTotal: 5,
  },
  {
    id: 'nj-3',
    candidateName: 'Fatima Sheikh',
    employeeCode: 'MLG-0120',
    dateOfJoining: '2026-07-01',
    department: 'Supply Chain',
    positionLevel: 'Warehouse Supervisor',
    status: 'In Progress',
    tasksDone: 1,
    tasksTotal: 4,
  },
  {
    id: 'nj-4',
    candidateName: 'Sneha Patil',
    employeeCode: 'AUR-0287',
    dateOfJoining: '2026-03-02',
    department: 'Engineering',
    positionLevel: 'Software Engineer',
    status: 'Completed',
    tasksDone: 5,
    tasksTotal: 5,
  },
  {
    id: 'nj-5',
    candidateName: 'Grace D’Souza',
    employeeCode: 'AUR-0318',
    dateOfJoining: '2026-02-02',
    department: 'Human Resources',
    positionLevel: 'HR Executive',
    status: 'Completed',
    tasksDone: 5,
    tasksTotal: 5,
  },
]

export interface JoiningTask {
  id: string
  name: string
  responsibleDepartment: string
  responsiblePositionLevel: string
  applicability: string
}

export const seedJoiningTasks: JoiningTask[] = [
  {
    id: 'jt-1',
    name: 'Issue ID card & access badge',
    responsibleDepartment: 'Operations',
    responsiblePositionLevel: 'Operations Lead',
    applicability: 'All employees',
  },
  {
    id: 'jt-2',
    name: 'Collect signed appointment letter',
    responsibleDepartment: 'Human Resources',
    responsiblePositionLevel: 'HR Executive',
    applicability: 'All employees',
  },
  {
    id: 'jt-3',
    name: 'Provision laptop & system accounts',
    responsibleDepartment: 'Engineering',
    responsiblePositionLevel: 'Engineering Manager',
    applicability: 'Office staff only',
  },
  {
    id: 'jt-4',
    name: 'PF / ESI nomination forms',
    responsibleDepartment: 'Finance',
    responsiblePositionLevel: 'Finance Analyst',
    applicability: 'All employees',
  },
  {
    id: 'jt-5',
    name: 'Safety induction & PPE issue',
    responsibleDepartment: 'Operations',
    responsiblePositionLevel: 'Warehouse Supervisor',
    applicability: 'Plant & depot staff',
  },
]

export const EXIT_STATUSES = [
  'Resignation initiated',
  'Approved',
  'Exited',
  'Pending FFS',
  'Closed FFS',
  'Rejected',
  'Withdrawn',
] as const
export type ExitStatus = (typeof EXIT_STATUSES)[number]

export const EXIT_TYPES = [
  'Resignation',
  'Retirement',
  'Termination',
  'Absconding',
] as const

export interface ExitRecord {
  id: string
  employee: string
  employeeCode: string
  department: string
  reportingManager: string
  exitType: (typeof EXIT_TYPES)[number]
  initiationDate: string
  tentativeLastDay: string
  status: ExitStatus
}

export const seedExits: ExitRecord[] = [
  {
    id: 'ex-1',
    employee: 'Nilesh Kadam',
    employeeCode: 'MLG-0112',
    department: 'Supply Chain',
    reportingManager: 'Deepa Raghavan',
    exitType: 'Resignation',
    initiationDate: '2026-06-05',
    tentativeLastDay: '2026-09-04',
    status: 'Resignation initiated',
  },
  {
    id: 'ex-2',
    employee: 'Tarun Bhalla',
    employeeCode: 'AUR-0301',
    department: 'Sales',
    reportingManager: 'Vikram Shetty',
    exitType: 'Resignation',
    initiationDate: '2026-03-15',
    tentativeLastDay: '2026-04-30',
    status: 'Pending FFS',
  },
  {
    id: 'ex-3',
    employee: 'Mohan Das',
    employeeCode: 'MER-0218',
    department: 'Operations',
    reportingManager: 'Deepa Raghavan',
    exitType: 'Retirement',
    initiationDate: '2026-01-10',
    tentativeLastDay: '2026-03-31',
    status: 'Closed FFS',
  },
  {
    id: 'ex-4',
    employee: 'Pooja Hegde',
    employeeCode: 'AUR-0264',
    department: 'Engineering',
    reportingManager: 'Rohit Menon',
    exitType: 'Resignation',
    initiationDate: '2026-06-22',
    tentativeLastDay: '2026-08-21',
    status: 'Approved',
  },
]

export type ClearanceStatus = 'Pending submission' | 'Pending approval' | 'Approved'

export interface ExitClearance {
  id: string
  employee: string
  department: string
  exitType: (typeof EXIT_TYPES)[number]
  initiationDate: string
  status: ClearanceStatus
}

export const seedClearances: ExitClearance[] = [
  {
    id: 'cl-1',
    employee: 'Tarun Bhalla',
    department: 'Engineering',
    exitType: 'Resignation',
    initiationDate: '2026-04-20',
    status: 'Approved',
  },
  {
    id: 'cl-2',
    employee: 'Tarun Bhalla',
    department: 'Finance',
    exitType: 'Resignation',
    initiationDate: '2026-04-20',
    status: 'Pending approval',
  },
  {
    id: 'cl-3',
    employee: 'Nilesh Kadam',
    department: 'Operations',
    exitType: 'Resignation',
    initiationDate: '2026-06-10',
    status: 'Pending submission',
  },
  {
    id: 'cl-4',
    employee: 'Pooja Hegde',
    department: 'Engineering',
    exitType: 'Resignation',
    initiationDate: '2026-06-25',
    status: 'Pending submission',
  },
]

export type HrChecklistStatus = 'Pending for Submission' | 'Submitted' | 'Completed'

export interface ExitHrItem {
  id: string
  employee: string
  positionLevel: string
  email: string
  contactNumber: string
  employeeClass: string
  status: HrChecklistStatus
}

export const seedHrChecklist: ExitHrItem[] = [
  {
    id: 'hr-1',
    employee: 'Tarun Bhalla',
    positionLevel: 'Sales Executive',
    email: 'tarun.bhalla@aurora.in',
    contactNumber: '+91 98450 22110',
    employeeClass: 'Permanent',
    status: 'Pending for Submission',
  },
  {
    id: 'hr-2',
    employee: 'Mohan Das',
    positionLevel: 'Operations Lead',
    email: 'mohan.das@meridianfoods.in',
    contactNumber: '+91 90000 44556',
    employeeClass: 'Permanent',
    status: 'Completed',
  },
  {
    id: 'hr-3',
    employee: 'Pooja Hegde',
    positionLevel: 'Software Engineer',
    email: 'pooja.hegde@aurora.in',
    contactNumber: '+91 91234 77889',
    employeeClass: 'Permanent',
    status: 'Pending for Submission',
  },
]

export type LayoffStatus = 'Pending approval' | 'Approved' | 'Exited' | 'Rejected' | 'Withdrawn'

export interface Layoff {
  id: string
  name: string
  initiatedDate: string
  initiator: string
  employeesCount: number
  status: LayoffStatus
}

export const seedLayoffs: Layoff[] = [
  {
    id: 'lo-1',
    name: 'Nagpur depot consolidation',
    initiatedDate: '2026-05-18',
    initiator: 'Deepa Raghavan',
    employeesCount: 8,
    status: 'Pending approval',
  },
  {
    id: 'lo-2',
    name: 'Retail POS project ramp-down',
    initiatedDate: '2026-02-02',
    initiator: 'Vikram Shetty',
    employeesCount: 5,
    status: 'Exited',
  },
]
