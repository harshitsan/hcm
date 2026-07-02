/**
 * Workforce roster used to evaluate policy applicability. Includes
 * Employee (Non-User) workers who have no login — policies still resolve for
 * them and are administered on their behalf by an admin (POL-12).
 */
export const WORKER_KINDS = ['Employee', 'Contractor'] as const
export type WorkerKind = (typeof WORKER_KINDS)[number]

export interface Worker {
  id: string
  name: string
  company: string
  group: string
  jurisdiction: string
  location: string
  department: string
  employmentType: string
  positionLevel: string
  workerKind: WorkerKind
  /** false = Employee (Non-User): no self-service login. */
  hasLogin: boolean
}

/** The persona used for the Employee (User) self-service policy library. */
export const SELF_WORKER_ID = 'w-01'

export const seedWorkers: Worker[] = [
  {
    id: 'w-01',
    name: 'Aarav Sharma',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'India',
    location: 'Hyderabad',
    department: 'Engineering',
    employmentType: 'Full-time',
    positionLevel: 'L2 — Senior',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-02',
    name: 'Meera Iyer',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'India',
    location: 'Hyderabad',
    department: 'Human Resources',
    employmentType: 'Full-time',
    positionLevel: 'L3 — Manager',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-03',
    name: 'Daniel Ross',
    company: 'Acme Logistics',
    group: 'Acme Group',
    jurisdiction: 'United States',
    location: 'Austin',
    department: 'Operations',
    employmentType: 'Full-time',
    positionLevel: 'L2 — Senior',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-04',
    name: 'Chloe Bennett',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'United Kingdom',
    location: 'London',
    department: 'Sales',
    employmentType: 'Part-time',
    positionLevel: 'L1 — Associate',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-05',
    name: 'Ravi Verma',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'India',
    location: 'Hyderabad',
    department: 'Support',
    employmentType: 'Contractor',
    positionLevel: 'L1 — Associate',
    workerKind: 'Contractor',
    hasLogin: false,
  },
  {
    id: 'w-06',
    name: 'Grace Liu',
    company: 'Northwind Foods',
    group: 'Northwind Group',
    jurisdiction: 'United States',
    location: 'Austin',
    department: 'Operations',
    employmentType: 'Full-time',
    positionLevel: 'L3 — Manager',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-07',
    name: 'Omar Haddad',
    company: 'Acme Logistics',
    group: 'Acme Group',
    jurisdiction: 'UAE',
    location: 'Dubai',
    department: 'Finance',
    employmentType: 'Full-time',
    positionLevel: 'L4 — Director',
    workerKind: 'Employee',
    hasLogin: true,
  },
  {
    id: 'w-08',
    name: 'Sara Field',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'United States',
    location: 'Austin',
    department: 'Engineering',
    employmentType: 'Intern',
    positionLevel: 'L1 — Associate',
    workerKind: 'Employee',
    hasLogin: false,
  },
  {
    id: 'w-09',
    name: 'Nikhil Rao',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'India',
    location: 'Bengaluru',
    department: 'Engineering',
    employmentType: 'Contractor',
    positionLevel: 'L2 — Senior',
    workerKind: 'Contractor',
    hasLogin: true,
  },
  {
    id: 'w-10',
    name: 'Emily Carter',
    company: 'Acme Retail',
    group: 'Acme Group',
    jurisdiction: 'United States',
    location: 'Austin',
    department: 'Human Resources',
    employmentType: 'Full-time',
    positionLevel: 'L5 — Executive',
    workerKind: 'Employee',
    hasLogin: true,
  },
]
