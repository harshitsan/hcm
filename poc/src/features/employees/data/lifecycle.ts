/**
 * Employees module — onboarding & exit workflow data
 * (New Joinees, Joining Checklist, Exits, Clearances, HR Checklist, Layoffs).
 */

/** Fixed "today" used across the POC for deterministic due/escalation states. */
export const LIFECYCLE_TODAY = '2026-07-09'

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() -
      new Date(`${fromIso}T00:00:00Z`).getTime()) /
      86_400_000
  )
}

export type JoineeStatus = 'Pending initiation' | 'In Progress' | 'Completed'

export interface NewJoinee {
  id: string
  candidateName: string
  employeeCode: string
  dateOfJoining: string
  department: string
  positionLevel: string
  location: string
  reportingManager: string
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
    location: 'Hyderabad Hub',
    reportingManager: 'Deepa Raghavan',
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
    location: 'Bengaluru HQ',
    reportingManager: 'Deepa Raghavan',
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
    location: 'Pune Plant',
    reportingManager: 'Vikram Shetty',
    status: 'In Progress',
    tasksDone: 1,
    tasksTotal: 5,
  },
  {
    id: 'nj-4',
    candidateName: 'Sneha Patil',
    employeeCode: 'AUR-0287',
    dateOfJoining: '2026-03-02',
    department: 'Engineering',
    positionLevel: 'Software Engineer',
    location: 'Bengaluru HQ',
    reportingManager: 'Deepa Raghavan',
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
    location: 'Bengaluru HQ',
    reportingManager: 'Ananya Krishnan',
    status: 'Completed',
    tasksDone: 5,
    tasksTotal: 5,
  },
]

/* ── Joining checklist configuration ─────────────────────────────────── */

export type PerformerKind = 'Role' | 'Position Level' | 'Reporting Manager'
export const PERFORMER_KINDS: PerformerKind[] = [
  'Role',
  'Position Level',
  'Reporting Manager',
]

export type TimingRelation = 'On' | 'Before' | 'After'
export const TIMING_RELATIONS: TimingRelation[] = ['On', 'Before', 'After']

export interface TaskTiming {
  relation: TimingRelation
  /** Days before/after Date of Joining (ignored when relation is 'On'). */
  days: number
}

/** Checklist task DEFINITION — instantiated per joinee on onboarding. */
export interface JoiningTask {
  id: string
  name: string
  description: string
  applicableLocations: string[]
  performedBy: { kind: PerformerKind; value?: string }
  timing: TaskTiming
  /** Days after the due date before the task escalates to the coordinator. */
  escalationDays: number
  visibleOnlyToAssignee: boolean
}

/** Named checklist roles → seeded person who holds them in the POC. */
export const CHECKLIST_ROLE_ASSIGNEES: Record<string, string> = {
  'Onboarding Coordinator': 'Anita Desai',
  'IT Administrator': 'Rohit Menon',
  'Facilities Officer': 'Vikram Shetty',
}
export const CHECKLIST_ROLES = Object.keys(CHECKLIST_ROLE_ASSIGNEES)

/** Position levels → seeded person who resolves as the default assignee. */
export const POSITION_ASSIGNEES: Record<string, string> = {
  'HR Manager': 'Ananya Krishnan',
  'HR Executive': 'Grace D’Souza',
  'Finance Analyst': 'Rakesh Iyer',
  'Operations Lead': 'Vikram Shetty',
  'Warehouse Supervisor': 'Imran Qureshi',
  'Engineering Manager': 'Deepa Raghavan',
}

/** People selectable in the assignee / reassignment pickers. */
export const ASSIGNEE_DIRECTORY = [
  'Anita Desai',
  'Ananya Krishnan',
  'Grace D’Souza',
  'Rohit Menon',
  'Deepa Raghavan',
  'Rakesh Iyer',
  'Imran Qureshi',
  'Vikram Shetty',
]

/** Persona shown as the acting user per role (mirrors lifecycle PERSONAS). */
export const LIFECYCLE_ACTORS: Record<string, string> = {
  'Platform Admin': 'Meera Krishnan',
  'Portfolio Admin': 'Daniel Osei',
  'Group Company Admin': 'Farah Qureshi',
  'Company Admin': 'Anita Desai',
  'Employee (User)': 'Rohan Verma',
  'Employee (Non-User)': 'Sunil Patil',
}

export const seedJoiningTasks: JoiningTask[] = [
  {
    id: 'jt-1',
    name: 'Issue ID card & access badge',
    description:
      'Print the photo ID card and program the building access badge for the new hire.',
    applicableLocations: [
      'Bengaluru HQ',
      'Mumbai Office',
      'Hyderabad Hub',
      'Pune Plant',
      'Nagpur Depot',
    ],
    performedBy: { kind: 'Role', value: 'Onboarding Coordinator' },
    timing: { relation: 'On', days: 0 },
    escalationDays: 2,
    visibleOnlyToAssignee: false,
  },
  {
    id: 'jt-2',
    name: 'Collect signed appointment letter',
    description:
      'Collect the countersigned appointment letter and file it in the personnel record.',
    applicableLocations: [
      'Bengaluru HQ',
      'Mumbai Office',
      'Hyderabad Hub',
      'Pune Plant',
      'Nagpur Depot',
    ],
    performedBy: { kind: 'Position Level', value: 'HR Executive' },
    timing: { relation: 'Before', days: 3 },
    escalationDays: 2,
    visibleOnlyToAssignee: false,
  },
  {
    id: 'jt-3',
    name: 'Provision laptop & system accounts',
    description:
      'Image the laptop, create the email/SSO accounts and grant department tool access.',
    applicableLocations: ['Bengaluru HQ', 'Mumbai Office', 'Hyderabad Hub'],
    performedBy: { kind: 'Role', value: 'IT Administrator' },
    timing: { relation: 'Before', days: 1 },
    escalationDays: 1,
    visibleOnlyToAssignee: false,
  },
  {
    id: 'jt-4',
    name: 'PF / ESI nomination forms',
    description:
      'Capture PF & ESI nominations and submit the statutory enrolment within the window.',
    applicableLocations: [
      'Bengaluru HQ',
      'Mumbai Office',
      'Hyderabad Hub',
      'Pune Plant',
      'Nagpur Depot',
    ],
    performedBy: { kind: 'Position Level', value: 'Finance Analyst' },
    timing: { relation: 'After', days: 7 },
    escalationDays: 3,
    visibleOnlyToAssignee: true,
  },
  {
    id: 'jt-5',
    name: 'Safety induction & PPE issue',
    description:
      'Run the shop-floor safety induction and issue personal protective equipment.',
    applicableLocations: ['Pune Plant', 'Nagpur Depot'],
    performedBy: { kind: 'Position Level', value: 'Warehouse Supervisor' },
    timing: { relation: 'After', days: 2 },
    escalationDays: 2,
    visibleOnlyToAssignee: false,
  },
  {
    id: 'jt-6',
    name: 'Manager welcome & 30-60-90 plan',
    description:
      'Reporting manager walks the joinee through the team charter and the 30-60-90 day plan.',
    applicableLocations: [
      'Bengaluru HQ',
      'Mumbai Office',
      'Hyderabad Hub',
      'Pune Plant',
      'Nagpur Depot',
    ],
    performedBy: { kind: 'Reporting Manager' },
    timing: { relation: 'After', days: 5 },
    escalationDays: 3,
    visibleOnlyToAssignee: false,
  },
]

/** Human-readable timing, e.g. "3 days before DOJ". */
export function formatTiming(timing: TaskTiming): string {
  if (timing.relation === 'On') return 'On DOJ'
  return `${timing.days} day${timing.days === 1 ? '' : 's'} ${timing.relation.toLowerCase()} DOJ`
}

/** Resolve a task's performedBy rule to a concrete seeded person. */
export function resolveAssignee(task: JoiningTask, joinee: NewJoinee): string {
  if (task.performedBy.kind === 'Reporting Manager')
    return joinee.reportingManager
  const value = task.performedBy.value ?? ''
  if (task.performedBy.kind === 'Role')
    return CHECKLIST_ROLE_ASSIGNEES[value] ?? 'Anita Desai'
  return POSITION_ASSIGNEES[value] ?? 'Ananya Krishnan'
}

/** Due date from DOJ + timing; start date opens a short window before due. */
export function deriveTaskDates(
  doj: string,
  timing: TaskTiming
): { startDate: string; dueDate: string } {
  const dueDate =
    timing.relation === 'On'
      ? doj
      : addDays(doj, timing.relation === 'Before' ? -timing.days : timing.days)
  const startDate = timing.relation === 'After' ? doj : addDays(dueDate, -3)
  return { startDate, dueDate }
}

/* ── Per-joinee checklist task instances ─────────────────────────────── */

export type JoineeTaskStatus = 'pending' | 'completed'

export interface TaskReassignment {
  id: string
  date: string
  from: string
  to: string
  by: string
  comment: string
}

export interface JoineeChecklistTask {
  id: string
  joineeId: string
  taskId: string
  name: string
  description: string
  /** e.g. "Role: Onboarding Coordinator" — the rule the assignee came from. */
  performedByLabel: string
  assignee: string
  startDate: string
  dueDate: string
  escalationDays: number
  visibleOnlyToAssignee: boolean
  status: JoineeTaskStatus
  completedOn?: string
  completedBy?: string
  completionComments?: string
  reassignments: TaskReassignment[]
}

/** Instantiate one checklist definition against a joinee. */
export function buildTaskInstance(
  joinee: NewJoinee,
  task: JoiningTask
): JoineeChecklistTask {
  const { startDate, dueDate } = deriveTaskDates(
    joinee.dateOfJoining,
    task.timing
  )
  return {
    id: `${joinee.id}-${task.id}`,
    joineeId: joinee.id,
    taskId: task.id,
    name: task.name,
    description: task.description,
    performedByLabel:
      task.performedBy.kind === 'Reporting Manager'
        ? 'Reporting Manager'
        : `${task.performedBy.kind}: ${task.performedBy.value}`,
    assignee: resolveAssignee(task, joinee),
    startDate,
    dueDate,
    escalationDays: task.escalationDays,
    visibleOnlyToAssignee: task.visibleOnlyToAssignee,
    status: 'pending',
    reassignments: [],
  }
}

/** All applicable instances for a joinee, ordered chronologically by due date. */
export function buildTasksForJoinee(
  joinee: NewJoinee,
  tasks: JoiningTask[]
): JoineeChecklistTask[] {
  return tasks
    .filter((t) => t.applicableLocations.includes(joinee.location))
    .map((t) => buildTaskInstance(joinee, t))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/** Seed instances — the earliest `tasksDone` per joinee are pre-completed. */
export const seedJoineeTasks: JoineeChecklistTask[] = seedJoinees.flatMap(
  (joinee) =>
    buildTasksForJoinee(joinee, seedJoiningTasks).map((task, index) =>
      index < joinee.tasksDone
        ? {
            ...task,
            status: 'completed' as const,
            completedOn:
              task.dueDate <= LIFECYCLE_TODAY ? task.dueDate : LIFECYCLE_TODAY,
            completedBy: task.assignee,
            completionComments: 'Completed as per the joining checklist.',
          }
        : task
    )
)

export type EscalationState = 'on-track' | 'overdue' | 'escalated'

/** Overdue/escalation state of a pending task vs the fixed POC "today". */
export function getEscalation(
  task: JoineeChecklistTask,
  today: string = LIFECYCLE_TODAY
): { state: EscalationState; daysOverdue: number } {
  if (task.status === 'completed') return { state: 'on-track', daysOverdue: 0 }
  const daysOverdue = daysBetween(task.dueDate, today)
  if (daysOverdue <= 0) return { state: 'on-track', daysOverdue: 0 }
  return {
    state: daysOverdue >= task.escalationDays ? 'escalated' : 'overdue',
    daysOverdue,
  }
}

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

export type LayoffStatus =
  | 'Pending approval'
  | 'Need clarification'
  | 'Approved'
  | 'Exited'
  | 'Rejected'
  | 'Withdrawn'

/* ── Layoff process (EMP-50) ─────────────────────────────────────────── */

export type LayoffEmployeeStatus =
  | 'Pending approval'
  | 'Approved'
  | 'Exited'
  | 'Revoked'

/** Simple exit task attached to a laid-off employee after approval. */
export interface LayoffExitTask {
  id: string
  name: string
  assignee: string
  addedOn: string
}

/** One affected employee inside a layoff record. */
export interface LayoffEmployee {
  id: string
  name: string
  department: string
  position: string
  location: string
  /** Per-employee last working day (starts at the layoff-wide suggested LWD). */
  lwd: string
  status: LayoffEmployeeStatus
  exitTasks: LayoffExitTask[]
  revokeComment?: string
}

export interface Layoff {
  id: string
  name: string
  initiatedDate: string
  initiator: string
  employeesCount: number
  status: LayoffStatus
  /** "Reasons for Layoff" free text — layoffs have NO questionnaire. */
  reason?: string
  /** One suggested last working day applied to all affected employees. */
  lwd?: string
  /** "How many days salary need to be provided" — a plain number, never an amount. */
  salaryDays?: number
  employees?: LayoffEmployee[]
  /** File-name entries only (no real uploads in the POC). */
  documents?: string[]
  comments?: string
  /** Mandatory reason captured when the layoff is withdrawn. */
  withdrawReason?: string
}

/** Directory entry for the Location → Department → Position → Employee picker. */
export interface LayoffPickerEmployee {
  id: string
  name: string
  location: string
  department: string
  position: string
}

/** Seeded employees selectable when initiating a layoff. */
export const LAYOFF_EMPLOYEE_DIRECTORY: LayoffPickerEmployee[] = [
  { id: 'lpe-1', name: 'Arjun Nair', location: 'Bengaluru HQ', department: 'Engineering', position: 'Software Engineer' },
  { id: 'lpe-2', name: 'Divya Pillai', location: 'Bengaluru HQ', department: 'Engineering', position: 'Software Engineer' },
  { id: 'lpe-3', name: 'Karthik Rao', location: 'Bengaluru HQ', department: 'Engineering', position: 'Software Engineer' },
  { id: 'lpe-4', name: 'Meghna Joshi', location: 'Bengaluru HQ', department: 'Engineering', position: 'Software Engineer' },
  { id: 'lpe-5', name: 'Sameer Kulkarni', location: 'Bengaluru HQ', department: 'Engineering', position: 'Software Engineer' },
  { id: 'lpe-6', name: 'Ritika Bansal', location: 'Bengaluru HQ', department: 'Engineering', position: 'Senior Software Engineer' },
  { id: 'lpe-7', name: 'Alok Mishra', location: 'Bengaluru HQ', department: 'Engineering', position: 'Senior Software Engineer' },
  { id: 'lpe-8', name: 'Priyanka Sen', location: 'Bengaluru HQ', department: 'Human Resources', position: 'HR Executive' },
  { id: 'lpe-9', name: 'Naveen Chandra', location: 'Bengaluru HQ', department: 'Human Resources', position: 'HR Executive' },
  { id: 'lpe-10', name: 'Rahul Khanna', location: 'Mumbai Office', department: 'Sales', position: 'Sales Executive' },
  { id: 'lpe-11', name: 'Sonal Mehta', location: 'Mumbai Office', department: 'Sales', position: 'Sales Executive' },
  { id: 'lpe-12', name: 'Farhan Ali', location: 'Mumbai Office', department: 'Sales', position: 'Sales Executive' },
  { id: 'lpe-13', name: 'Gayatri Kamat', location: 'Mumbai Office', department: 'Sales', position: 'Sales Executive' },
  { id: 'lpe-14', name: 'Vinod Yadav', location: 'Mumbai Office', department: 'Sales', position: 'Sales Executive' },
  { id: 'lpe-15', name: 'Suresh Babu', location: 'Pune Plant', department: 'Operations', position: 'Operations Lead' },
  { id: 'lpe-16', name: 'Lakshmi Menon', location: 'Pune Plant', department: 'Operations', position: 'Operations Lead' },
  { id: 'lpe-17', name: 'Manoj Tiwari', location: 'Pune Plant', department: 'Supply Chain', position: 'Warehouse Supervisor' },
  { id: 'lpe-18', name: 'Rekha Chauhan', location: 'Pune Plant', department: 'Supply Chain', position: 'Warehouse Supervisor' },
  { id: 'lpe-19', name: 'Dinesh Gowda', location: 'Pune Plant', department: 'Supply Chain', position: 'Warehouse Supervisor' },
  { id: 'lpe-20', name: 'Swati Deshmukh', location: 'Hyderabad Hub', department: 'Quality Assurance', position: 'QA Engineer' },
  { id: 'lpe-21', name: 'Irfan Shaikh', location: 'Hyderabad Hub', department: 'Quality Assurance', position: 'QA Engineer' },
  { id: 'lpe-22', name: 'Bhavana Reddy', location: 'Hyderabad Hub', department: 'Quality Assurance', position: 'QA Engineer' },
  { id: 'lpe-23', name: 'Tejas Patwardhan', location: 'Hyderabad Hub', department: 'Quality Assurance', position: 'QA Engineer' },
]

const nagpurEmployee = (
  n: number,
  name: string,
  department: string,
  position: string
): LayoffEmployee => ({
  id: `loe-1-${n}`,
  name,
  department,
  position,
  location: 'Nagpur Depot',
  lwd: '2026-08-31',
  status: 'Pending approval',
  exitTasks: [],
})

export const seedLayoffs: Layoff[] = [
  {
    id: 'lo-1',
    name: 'Nagpur depot consolidation',
    initiatedDate: '2026-05-18',
    initiator: 'Deepa Raghavan',
    employeesCount: 8,
    status: 'Pending approval',
    reason:
      'The Nagpur depot is being consolidated into the Pune Plant hub; duplicate warehouse and dispatch roles are no longer required.',
    lwd: '2026-08-31',
    salaryDays: 60,
    employees: [
      nagpurEmployee(1, 'Prakash Wagh', 'Supply Chain', 'Warehouse Supervisor'),
      nagpurEmployee(2, 'Santosh Bhosale', 'Supply Chain', 'Warehouse Supervisor'),
      nagpurEmployee(3, 'Ganesh Ingle', 'Supply Chain', 'Warehouse Supervisor'),
      nagpurEmployee(4, 'Kiran Dhote', 'Operations', 'Operations Lead'),
      nagpurEmployee(5, 'Vaishali Thakre', 'Operations', 'Operations Lead'),
      nagpurEmployee(6, 'Umesh Raut', 'Supply Chain', 'Warehouse Supervisor'),
      nagpurEmployee(7, 'Sarika Gaikwad', 'Operations', 'Operations Lead'),
      nagpurEmployee(8, 'Nitin Kale', 'Supply Chain', 'Warehouse Supervisor'),
    ],
    documents: ['depot-consolidation-plan.pdf', 'severance-guidelines.docx'],
    comments:
      'Consolidation approved by the operations council; severance per policy.',
  },
  {
    id: 'lo-3',
    name: 'Hyderabad support restructure',
    initiatedDate: '2026-06-20',
    initiator: 'Anita Desai',
    employeesCount: 5,
    status: 'Approved',
    reason:
      'Tier-1 support is moving to a managed-services partner; the in-house support pod is being wound down.',
    lwd: '2026-07-31',
    salaryDays: 45,
    employees: [
      { id: 'loe-3-1', name: 'Ravi Teja', department: 'Operations', position: 'Operations Lead', location: 'Hyderabad Hub', lwd: '2026-07-31', status: 'Approved', exitTasks: [ { id: 'lot-3-1', name: 'Hand over support runbooks', assignee: 'Vikram Shetty', addedOn: '2026-07-02' }, ] },
      { id: 'loe-3-2', name: 'Anjali Verma', department: 'Operations', position: 'Operations Lead', location: 'Hyderabad Hub', lwd: '2026-07-31', status: 'Approved', exitTasks: [] },
      { id: 'loe-3-3', name: 'Mahesh Goud', department: 'Quality Assurance', position: 'QA Engineer', location: 'Hyderabad Hub', lwd: '2026-08-15', status: 'Approved', exitTasks: [] },
      { id: 'loe-3-4', name: 'Shruti Iyengar', department: 'Quality Assurance', position: 'QA Engineer', location: 'Hyderabad Hub', lwd: '2026-07-31', status: 'Revoked', exitTasks: [], revokeComment: 'Redeployed to the Bengaluru QA automation pod.' },
      { id: 'loe-3-5', name: 'Harish Kumar', department: 'Operations', position: 'Operations Lead', location: 'Hyderabad Hub', lwd: '2026-07-31', status: 'Approved', exitTasks: [] },
    ],
    documents: ['support-transition-msa.pdf'],
    comments: 'Partner transition completes by end of July.',
  },
  {
    id: 'lo-2',
    name: 'Retail POS project ramp-down',
    initiatedDate: '2026-02-02',
    initiator: 'Vikram Shetty',
    employeesCount: 5,
    status: 'Exited',
    reason:
      'The retail POS build has shipped; the fixed-term project team is being ramped down.',
    lwd: '2026-03-31',
    salaryDays: 30,
    employees: [
      { id: 'loe-2-1', name: 'Ajay Saxena', department: 'Engineering', position: 'Software Engineer', location: 'Mumbai Office', lwd: '2026-03-31', status: 'Exited', exitTasks: [] },
      { id: 'loe-2-2', name: 'Neetu Grover', department: 'Engineering', position: 'Software Engineer', location: 'Mumbai Office', lwd: '2026-03-31', status: 'Exited', exitTasks: [] },
      { id: 'loe-2-3', name: 'Sandeep Jain', department: 'Engineering', position: 'Software Engineer', location: 'Mumbai Office', lwd: '2026-03-31', status: 'Exited', exitTasks: [] },
      { id: 'loe-2-4', name: 'Pallavi Kher', department: 'Quality Assurance', position: 'QA Engineer', location: 'Mumbai Office', lwd: '2026-03-31', status: 'Exited', exitTasks: [] },
      { id: 'loe-2-5', name: 'Rohit Bagchi', department: 'Sales', position: 'Sales Executive', location: 'Mumbai Office', lwd: '2026-03-31', status: 'Exited', exitTasks: [] },
    ],
    documents: ['pos-rampdown-note.pdf'],
    comments: 'Project closure sign-off attached.',
  },
]
