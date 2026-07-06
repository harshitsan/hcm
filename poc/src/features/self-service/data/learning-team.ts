/** Manager / HR-admin Learning Management surface (EC/EEP/ELR/LP/TMA). */

export const TEAM_LOCATIONS = ['Chennai', 'Hyderabad', 'Bengaluru', 'Remote'] as const
export const TEAM_DEPARTMENTS = ['Engineering', 'Product', 'Finance', 'Human Resources'] as const
export const POSITION_LEVELS = ['L1 — Associate', 'L2 — Senior', 'L3 — Lead', 'L4 — Manager'] as const

export const CERTIFICATION_CATALOG = [
  'Information security awareness',
  'POSH compliance training',
  'AWS Solutions Architect — Associate',
  'Kubernetes CKAD',
  'First-aid responder',
] as const

export const EMPLOYEE_CERT_STATUSES = ['Pending', 'Completed'] as const
export type EmployeeCertStatus = (typeof EMPLOYEE_CERT_STATUSES)[number]

/** Team-wide certification assignment rows (EC-01). */
export interface EmployeeCertification {
  id: string
  employeeCode: string
  employeeName: string
  location: (typeof TEAM_LOCATIONS)[number]
  department: (typeof TEAM_DEPARTMENTS)[number]
  positionLevel: (typeof POSITION_LEVELS)[number]
  certification: string
  mandatory: boolean
  status: EmployeeCertStatus
  completedOn: string | null
  validTill: string | null
}

export const seedEmployeeCertifications: EmployeeCertification[] = [
  { id: 'ecert-01', employeeCode: 'EMP-1042', employeeName: 'Ananya Iyer', location: 'Chennai', department: 'Engineering', positionLevel: 'L2 — Senior', certification: 'Information security awareness', mandatory: true, status: 'Completed', completedOn: '2026-01-20', validTill: '2027-01-20' },
  { id: 'ecert-02', employeeCode: 'EMP-1187', employeeName: 'Rohan Mehta', location: 'Hyderabad', department: 'Engineering', positionLevel: 'L1 — Associate', certification: 'Information security awareness', mandatory: true, status: 'Pending', completedOn: null, validTill: null },
  { id: 'ecert-03', employeeCode: 'EMP-0916', employeeName: 'Priya Sharma', location: 'Bengaluru', department: 'Product', positionLevel: 'L3 — Lead', certification: 'POSH compliance training', mandatory: true, status: 'Completed', completedOn: '2025-11-08', validTill: '2026-11-08' },
  { id: 'ecert-04', employeeCode: 'EMP-1203', employeeName: 'Vikram Nair', location: 'Chennai', department: 'Finance', positionLevel: 'L2 — Senior', certification: 'POSH compliance training', mandatory: true, status: 'Pending', completedOn: null, validTill: null },
  { id: 'ecert-05', employeeCode: 'EMP-1042', employeeName: 'Ananya Iyer', location: 'Chennai', department: 'Engineering', positionLevel: 'L2 — Senior', certification: 'AWS Solutions Architect — Associate', mandatory: false, status: 'Completed', completedOn: '2024-09-12', validTill: '2027-09-12' },
  { id: 'ecert-06', employeeCode: 'EMP-0871', employeeName: 'Sara Thomas', location: 'Remote', department: 'Human Resources', positionLevel: 'L4 — Manager', certification: 'First-aid responder', mandatory: false, status: 'Pending', completedOn: null, validTill: null },
  { id: 'ecert-07', employeeCode: 'EMP-1187', employeeName: 'Rohan Mehta', location: 'Hyderabad', department: 'Engineering', positionLevel: 'L1 — Associate', certification: 'Kubernetes CKAD', mandatory: false, status: 'Completed', completedOn: '2026-03-30', validTill: '2028-03-30' },
]

export const TEAM_EMPLOYEES = [
  { code: 'EMP-1042', name: 'Ananya Iyer', location: 'Chennai', department: 'Engineering', positionLevel: 'L2 — Senior' },
  { code: 'EMP-1187', name: 'Rohan Mehta', location: 'Hyderabad', department: 'Engineering', positionLevel: 'L1 — Associate' },
  { code: 'EMP-0916', name: 'Priya Sharma', location: 'Bengaluru', department: 'Product', positionLevel: 'L3 — Lead' },
  { code: 'EMP-1203', name: 'Vikram Nair', location: 'Chennai', department: 'Finance', positionLevel: 'L2 — Senior' },
  { code: 'EMP-0871', name: 'Sara Thomas', location: 'Remote', department: 'Human Resources', positionLevel: 'L4 — Manager' },
] as const

export const ENROLLMENT_STATUSES = [
  'Pending with me',
  'Pending approval',
  'Pending confirmation',
  'Confirmed',
  'Rejected',
  'Published',
  'Completed',
] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

/** Employee Enrollment Program rows with a Su–Sa weekly breakdown (EEP-01/04). */
export interface Enrollment {
  id: string
  employee: string
  class: string
  department: (typeof TEAM_DEPARTMENTS)[number]
  positionLevel: (typeof POSITION_LEVELS)[number]
  title: string
  scheduleStart: string
  scheduleEnd: string
  /** Su, Mo, Tu, We, Th, Fr, Sa */
  days: readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean]
  status: EnrollmentStatus
}

export const seedEnrollments: Enrollment[] = [
  { id: 'enr-01', employee: 'Ananya Iyer', class: 'Prompt engineering for engineers', department: 'Engineering', positionLevel: 'L2 — Senior', title: 'Senior Software Engineer', scheduleStart: '2026-07-07', scheduleEnd: '2026-07-30', days: [false, false, true, false, true, false, false], status: 'Confirmed' },
  { id: 'enr-02', employee: 'Rohan Mehta', class: 'Secure coding essentials', department: 'Engineering', positionLevel: 'L1 — Associate', title: 'Software Engineer', scheduleStart: '2026-07-10', scheduleEnd: '2026-08-14', days: [false, false, false, false, false, true, false], status: 'Pending with me' },
  { id: 'enr-03', employee: 'Priya Sharma', class: 'Design thinking sprint', department: 'Product', positionLevel: 'L3 — Lead', title: 'Product Lead', scheduleStart: '2026-06-15', scheduleEnd: '2026-06-26', days: [false, true, false, true, false, false, false], status: 'Completed' },
  { id: 'enr-04', employee: 'Vikram Nair', class: 'Advanced Excel & financial modelling', department: 'Finance', positionLevel: 'L2 — Senior', title: 'Financial Analyst', scheduleStart: '2026-07-20', scheduleEnd: '2026-08-21', days: [false, true, false, false, true, false, false], status: 'Pending approval' },
  { id: 'enr-05', employee: 'Sara Thomas', class: 'POSH investigation workshop', department: 'Human Resources', positionLevel: 'L4 — Manager', title: 'HR Manager', scheduleStart: '2026-08-03', scheduleEnd: '2026-08-07', days: [false, true, true, true, true, true, false], status: 'Pending confirmation' },
  { id: 'enr-06', employee: 'Ananya Iyer', class: 'Kubernetes operations bootcamp', department: 'Engineering', positionLevel: 'L2 — Senior', title: 'Senior Software Engineer', scheduleStart: '2026-09-01', scheduleEnd: '2026-09-25', days: [true, false, false, false, false, false, true], status: 'Published' },
  { id: 'enr-07', employee: 'Rohan Mehta', class: 'Advanced React performance workshop', department: 'Engineering', positionLevel: 'L1 — Associate', title: 'Software Engineer', scheduleStart: '2026-05-04', scheduleEnd: '2026-05-29', days: [false, true, false, true, false, false, false], status: 'Rejected' },
]

export const TEAM_REQUEST_STATUSES = [
  'Pending with me',
  'Pending approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type TeamRequestStatus = (typeof TEAM_REQUEST_STATUSES)[number]

/** Certification sponsorship / reimbursement requests raised by employees (ELR-01/02). */
export interface TeamLearningRequest {
  id: string
  programTitle: string
  vendor: string
  totalAmount: number
  /** Max sponsorship amount (sponsorship) or maximum claimable amount (reimbursement). */
  capAmount: number
  requester: string
  status: TeamRequestStatus
}

export const seedSponsorshipRequests: TeamLearningRequest[] = [
  { id: 'spr-01', programTitle: 'AWS Solutions Architect — Professional', vendor: 'Amazon Web Services', totalAmount: 32000, capAmount: 25000, requester: 'Ananya Iyer', status: 'Pending with me' },
  { id: 'spr-02', programTitle: 'Certified Scrum Master', vendor: 'Scrum Alliance', totalAmount: 45000, capAmount: 30000, requester: 'Priya Sharma', status: 'Pending approval' },
  { id: 'spr-03', programTitle: 'Kubernetes CKA', vendor: 'Linux Foundation', totalAmount: 28000, capAmount: 28000, requester: 'Rohan Mehta', status: 'Approved' },
  { id: 'spr-04', programTitle: 'CFA Level I coaching', vendor: 'Kaplan Schweser', totalAmount: 95000, capAmount: 50000, requester: 'Vikram Nair', status: 'Rejected' },
]

export const seedReimbursementRequests: TeamLearningRequest[] = [
  { id: 'rmb-01', programTitle: 'Kubernetes CKAD', vendor: 'Linux Foundation', totalAmount: 26000, capAmount: 26000, requester: 'Rohan Mehta', status: 'Pending with me' },
  { id: 'rmb-02', programTitle: 'PMP certification exam', vendor: 'PMI', totalAmount: 42000, capAmount: 35000, requester: 'Sara Thomas', status: 'Approved' },
  { id: 'rmb-03', programTitle: 'Google UX Design certificate', vendor: 'Coursera', totalAmount: 12000, capAmount: 12000, requester: 'Priya Sharma', status: 'Pending approval' },
  { id: 'rmb-04', programTitle: 'Advanced SQL masterclass', vendor: 'Udemy Business', totalAmount: 4500, capAmount: 4500, requester: 'Vikram Nair', status: 'Cancelled' },
]

export const PROGRAM_TYPES = ['Classroom', 'Online', 'Blended', 'External vendor'] as const
export type ProgramType = (typeof PROGRAM_TYPES)[number]

export const CATALOG_STATUSES = [
  'Pending with me',
  'Pending approval',
  'Approved',
  'Scheduled',
  'Rejected',
  'Published',
  'Completed',
  'Active',
] as const
export type CatalogStatus = (typeof CATALOG_STATUSES)[number]

/** Admin-managed training catalog entries (LP-01). */
export interface CatalogProgram {
  id: string
  title: string
  programType: ProgramType
  description: string
  status: CatalogStatus
}

export const seedCatalogPrograms: CatalogProgram[] = [
  { id: 'cat-01', title: 'Secure coding essentials', programType: 'Online', description: 'OWASP top-10 with hands-on labs — mandatory for engineering', status: 'Active' },
  { id: 'cat-02', title: 'Prompt engineering for engineers', programType: 'Blended', description: 'Applied LLM patterns for product teams', status: 'Published' },
  { id: 'cat-03', title: 'Design thinking sprint', programType: 'Classroom', description: 'Five-day facilitated product discovery sprint', status: 'Completed' },
  { id: 'cat-04', title: 'Kubernetes operations bootcamp', programType: 'External vendor', description: 'Cluster operations, monitoring and incident drills', status: 'Scheduled' },
  { id: 'cat-05', title: 'Leadership essentials for new managers', programType: 'Classroom', description: 'First-time manager transition programme', status: 'Pending approval' },
  { id: 'cat-06', title: 'POSH investigation workshop', programType: 'Classroom', description: 'Internal committee investigation procedures', status: 'Pending with me' },
  { id: 'cat-07', title: 'Data privacy & DPDP act briefing', programType: 'Online', description: 'Compliance briefing for all staff', status: 'Approved' },
  { id: 'cat-08', title: 'Negotiation skills lab', programType: 'Blended', description: 'Role-play driven negotiation practice', status: 'Rejected' },
]

/** Pending enrollments awaiting manager approval (TMA-01). */
export interface MassApprovalRow {
  id: string
  employee: string
  class: string
  department: (typeof TEAM_DEPARTMENTS)[number]
  position: (typeof POSITION_LEVELS)[number]
  title: string
  schedule: string
  status: 'Pending approval'
}

export const seedMassApprovals: MassApprovalRow[] = [
  { id: 'tma-01', employee: 'Rohan Mehta', class: 'Secure coding essentials', department: 'Engineering', position: 'L1 — Associate', title: 'Software Engineer', schedule: '10 Jul – 14 Aug 2026', status: 'Pending approval' },
  { id: 'tma-02', employee: 'Ananya Iyer', class: 'Secure coding essentials', department: 'Engineering', position: 'L2 — Senior', title: 'Senior Software Engineer', schedule: '10 Jul – 14 Aug 2026', status: 'Pending approval' },
  { id: 'tma-03', employee: 'Vikram Nair', class: 'Advanced Excel & financial modelling', department: 'Finance', position: 'L2 — Senior', title: 'Financial Analyst', schedule: '20 Jul – 21 Aug 2026', status: 'Pending approval' },
  { id: 'tma-04', employee: 'Priya Sharma', class: 'Design thinking sprint', department: 'Product', position: 'L3 — Lead', title: 'Product Lead', schedule: '07 Sep – 11 Sep 2026', status: 'Pending approval' },
  { id: 'tma-05', employee: 'Sara Thomas', class: 'Leadership essentials for new managers', department: 'Human Resources', position: 'L4 — Manager', title: 'HR Manager', schedule: '05 Oct – 09 Oct 2026', status: 'Pending approval' },
]
