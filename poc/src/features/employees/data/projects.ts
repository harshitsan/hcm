/**
 * Resource Management seed data — Project Master, Task Library, bulk
 * resource assignments and day-wise allocations (Kensium "More / Resource
 * Management" parity: BRA / DWRA / EPA / MPA / PM / TL story groups).
 */

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
export type Weekday = (typeof WEEKDAYS)[number]

export const DEFAULT_WEEKDAYS: Weekday[] = ['Mo', 'Tu', 'We', 'Th', 'Fr']

export const PROJECT_TYPES = [
  'Fixed Bid',
  'Time & Material',
  'Internal',
  'Support & Maintenance',
] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export type ProjectStatus = 'Active' | 'Inactive'

export interface Project {
  id: string
  client: string
  code: string
  name: string
  billable: boolean
  primaryApprover: string
  startDate: string
  endDate: string
  resources: number
  wrike: boolean
  type: ProjectType
  status: ProjectStatus
}

export const PROJECT_CLIENTS = [
  'Aurora Retail',
  'Meridian Foods',
  'Northwind Traders',
  'Zenith Bank',
  'Helios Energy',
  'Cascade Health',
  'Vertex Insurance',
  'Orbit Media',
] as const

const PROJECT_THEMES = [
  'ERP Rollout',
  'Storefront Revamp',
  'Data Migration',
  'Mobile App',
  'Analytics Platform',
  'Payment Gateway',
  'Warehouse Automation',
  'CRM Integration',
  'Portal Modernisation',
  'Compliance Suite',
] as const

const APPROVERS = [
  'Ananya Krishnan',
  'Vikram Shetty',
  'Imran Qureshi',
  'Deepa Raghavan',
] as const

/**
 * Deterministic generator — 145 projects to mirror the Kensium Project
 * Master volume (PM-06: page through all 145 projects).
 */
export const seedProjects: Project[] = Array.from({ length: 145 }, (_, i) => {
  const n = i + 1
  const client = PROJECT_CLIENTS[i % PROJECT_CLIENTS.length]
  const theme = PROJECT_THEMES[i % PROJECT_THEMES.length]
  const startMonth = (i % 12) + 1
  const startYear = 2024 + (i % 3)
  const start = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
  const endYear = startYear + 1 + (i % 2)
  const end = `${endYear}-${String(startMonth).padStart(2, '0')}-28`
  return {
    id: `prj-${1000 + n}`,
    client,
    code: `PRJ-${String(n).padStart(3, '0')}`,
    name: `${client.split(' ')[0]} ${theme} ${startYear}`,
    billable: i % 3 !== 2,
    primaryApprover: APPROVERS[i % APPROVERS.length],
    startDate: start,
    endDate: end,
    resources: 2 + (i % 9),
    wrike: i % 4 === 0,
    type: PROJECT_TYPES[i % PROJECT_TYPES.length],
    status: i % 5 === 4 ? 'Inactive' : 'Active',
  }
})

export type TaskStatus = 'Active' | 'Closed'

export interface LibraryTask {
  id: string
  name: string
  description: string
  status: TaskStatus
}

const TASK_SEED: ReadonlyArray<readonly [string, string, TaskStatus]> = [
  ['Requirement Analysis', 'Elicit and document functional requirements with stakeholders', 'Active'],
  ['Solution Design', 'Prepare high-level and low-level design artifacts', 'Active'],
  ['UI Design', 'Design screens, style guides and interaction states', 'Active'],
  ['UI Development', 'Build front-end screens per approved designs', 'Active'],
  ['API Development', 'Implement and document service endpoints', 'Active'],
  ['Database Design', 'Model schemas, indexes and migration scripts', 'Active'],
  ['Code Review', 'Review pull requests for standards and correctness', 'Active'],
  ['Unit Testing', 'Author and maintain automated unit tests', 'Active'],
  ['Integration Testing', 'Verify end-to-end flows across services', 'Active'],
  ['QA Regression', 'Execute regression suites before each release', 'Active'],
  ['Performance Testing', 'Load/stress test critical transactions', 'Active'],
  ['Security Review', 'Assess code and infrastructure for vulnerabilities', 'Active'],
  ['DevOps Setup', 'Provision CI/CD pipelines and environments', 'Active'],
  ['Deployment', 'Release builds to staging and production', 'Active'],
  ['Data Migration', 'Extract, transform and load legacy data', 'Active'],
  ['Documentation', 'Produce user guides and release notes', 'Active'],
  ['Client Meeting', 'Scheduled client status and demo calls', 'Active'],
  ['Sprint Planning', 'Groom backlog and plan sprint scope', 'Active'],
  ['Daily Standup', 'Team sync on progress and blockers', 'Active'],
  ['Retrospective', 'Review sprint outcomes and improvements', 'Active'],
  ['UAT Support', 'Support user acceptance testing cycles', 'Active'],
  ['Production Support', 'Triage and resolve live incidents', 'Active'],
  ['Bug Fixing', 'Resolve defects raised by QA or client', 'Active'],
  ['Estimation', 'Size upcoming work items and change requests', 'Active'],
  ['Training', 'Internal enablement and client training sessions', 'Active'],
  ['Knowledge Transfer', 'Hand over module knowledge between resources', 'Active'],
  ['Proposal Support', 'Assist pre-sales with solutioning and demos', 'Closed'],
  ['Legacy Maintenance', 'Maintain the retired v1 platform', 'Closed'],
  ['Pilot Evaluation', 'Evaluate discontinued pilot tooling', 'Closed'],
  ['Audit Preparation', 'Compile artifacts for the FY24 audit', 'Closed'],
  ['Vendor Onboarding', 'Onboard the replaced staffing vendor', 'Closed'],
]

/** 31 tasks to mirror the Kensium Task Library volume (TL-04). */
export const seedTasks: LibraryTask[] = TASK_SEED.map(
  ([name, description, status], i) => ({
    id: `tsk-${100 + i}`,
    name,
    description,
    status,
  })
)

export interface ResourceAssignment {
  id: string
  project: string
  resource: string
  startDate: string
  endDate: string
  hoursPerDay: number
  percentPerDay: number
  weekdays: Weekday[]
  savedOn: string
}

export type AssignmentDraft = Omit<ResourceAssignment, 'id' | 'savedOn'>

export const ASSIGNABLE_RESOURCES = [
  'Ananya Krishnan',
  'Vikram Shetty',
  'Rohit Menon',
  'Sneha Patil',
  'Imran Qureshi',
  'Rakesh Iyer',
  'Deepa Raghavan',
] as const

export const seedAssignments: ResourceAssignment[] = [
  {
    id: 'ra-001',
    project: 'Aurora ERP Rollout 2024',
    resource: 'Rohit Menon',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    hoursPerDay: 6,
    percentPerDay: 75,
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    savedOn: '2026-05-28',
  },
  {
    id: 'ra-002',
    project: 'Meridian Storefront Revamp 2024',
    resource: 'Rohit Menon',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    hoursPerDay: 2,
    percentPerDay: 25,
    weekdays: ['Mo', 'We', 'Fr'],
    savedOn: '2026-05-28',
  },
  {
    id: 'ra-003',
    project: 'Zenith Mobile App 2025',
    resource: 'Sneha Patil',
    startDate: '2026-06-15',
    endDate: '2026-08-14',
    hoursPerDay: 8,
    percentPerDay: 100,
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    savedOn: '2026-06-10',
  },
]

export interface DayAllocation {
  id: string
  employee: string
  project: string
  date: string
  hours: number
  task: string
}

const ALLOCATION_EMPLOYEES = [
  'Rohit Menon',
  'Sneha Patil',
  'Ananya Krishnan',
  'Vikram Shetty',
] as const

const ALLOCATION_PROJECTS = [
  'Aurora ERP Rollout 2024',
  'Meridian Storefront Revamp 2024',
  'Zenith Mobile App 2025',
] as const

const ALLOCATION_TASKS = [
  'UI Development',
  'API Development',
  'Code Review',
  'Bug Fixing',
  'Client Meeting',
  'Unit Testing',
] as const

/**
 * Deterministic day-wise allocations for June–July 2026 weekdays: each
 * employee works on 1–2 projects a day with hours summing to a full day.
 */
export const seedAllocations: DayAllocation[] = (() => {
  const rows: DayAllocation[] = []
  let id = 0
  for (const month of [6, 7]) {
    const daysInMonth = month === 6 ? 30 : 31
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(2026, month - 1, day)
      const dow = date.getDay()
      if (dow === 0 || dow === 6) continue // weekdays only
      const iso = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      ALLOCATION_EMPLOYEES.forEach((employee, e) => {
        const p1 = ALLOCATION_PROJECTS[(day + e) % ALLOCATION_PROJECTS.length]
        const p2 =
          ALLOCATION_PROJECTS[(day + e + 1) % ALLOCATION_PROJECTS.length]
        const split = (day + e) % 3 === 0
        rows.push({
          id: `da-${++id}`,
          employee,
          project: p1,
          date: iso,
          hours: split ? 5 : 8,
          task: ALLOCATION_TASKS[(day + e) % ALLOCATION_TASKS.length],
        })
        if (split) {
          rows.push({
            id: `da-${++id}`,
            employee,
            project: p2,
            date: iso,
            hours: 3,
            task: ALLOCATION_TASKS[(day + e + 2) % ALLOCATION_TASKS.length],
          })
        }
      })
    }
  }
  return rows
})()

/** Distinct project names that appear in allocation data (query dropdowns). */
export const ALLOCATED_PROJECT_NAMES: readonly string[] = ALLOCATION_PROJECTS

/** Employees that appear in allocation data (query dropdowns). */
export const ALLOCATED_EMPLOYEE_NAMES: readonly string[] = ALLOCATION_EMPLOYEES
