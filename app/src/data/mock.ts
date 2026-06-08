/**
 * SatelliteHR — mock data (no backend).
 * Single source of truth for every screen. All relationships are internally
 * consistent (managerId, departmentId, companyId refer to real records here).
 */

export type Role =
  | 'provider_admin'
  | 'portfolio_manager'
  | 'company_hr_admin'
  | 'people_manager'
  | 'employee'

export const ROLE_LABELS: Record<Role, string> = {
  provider_admin: 'Platform / Provider Admin',
  portfolio_manager: 'Portfolio Manager',
  company_hr_admin: 'Company HR Admin',
  people_manager: 'People Manager',
  employee: 'Employee',
}

export type Persona = {
  id: string
  name: string
  role: Role
  title: string
  blurb: string
  /** companies this persona may access (ids); empty = all (provider) */
  companyIds: string[]
  /** if set, this user is ALSO an employee (workforce record) — User ≠ Employee link */
  employeeId?: string
}

export type Company = {
  id: string
  code: string
  name: string
  initials: string
  color: string // tailwind bg class for the chip
  jurisdiction: string
  employees: number
  status: 'Active' | 'Suspended' | 'Draft'
  tier: 'Basic' | 'Standard' | 'Enterprise'
  portfolioId: string | null
  groupId: string | null
  group?: string // display label (group name), kept for convenience
}

export type Portfolio = {
  id: string
  code: string
  name: string
  manager: string
  companyIds: string[]
}

export type Group = {
  id: string
  name: string
  type: 'Holding' | 'Sister' | 'Joint Venture'
  companyIds: string[]
  /** opt-in: cross-company sharing & consolidated reporting (explicitly enabled + audited) */
  sharingEnabled: boolean
}

export type Department = {
  id: string
  name: string
  head: string
  parentId: string | null
  headcount: number
}

export type Employee = {
  id: string
  name: string
  email: string
  title: string
  departmentId: string
  location: string
  managerId: string | null
  status: 'Active' | 'On Leave' | 'Probation' | 'Onboarding'
  type: 'Employee' | 'Contractor'
  joinDate: string
  phone: string
}

export type InboxItem = {
  id: string
  type: 'Leave' | 'Onboarding' | 'Policy Ack' | 'Transfer' | 'Offer' | 'Timesheet' | 'Asset'
  title: string
  requester: string
  date: string
  slaPct: number // 0-100, higher = closer to breach
  priority: 'Low' | 'Normal' | 'High'
}

export type LeaveRequest = {
  id: string
  employee: string
  type: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Comp-off'
  from: string
  to: string
  days: number
  status: 'Pending' | 'Approved' | 'Rejected'
  reason: string
}

export type Policy = {
  id: string
  name: string
  category: string
  version: string
  status: 'Active' | 'Draft' | 'Archived'
  appliesTo: string
  ackPct: number
  due: string
}

export type AuditEntry = {
  id: string
  time: string
  actor: string
  action: string
  entity: string
  detail: string
}

export type Candidate = {
  id: string
  name: string
  role: string
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired'
  rating: number
}

export type OnboardingTask = {
  id: string
  label: string
  owner: string
  status: 'Done' | 'In progress' | 'Pending'
  stage: string
}

export type RoleDef = {
  name: string
  level: 'Platform' | 'Portfolio' | 'Group' | 'Company' | 'Manager' | 'Employee'
  users: number
  description: string
}

export type CustomField = {
  id: string
  label: string
  entity: 'Employee' | 'Company' | 'Department' | 'Position'
  type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Boolean' | 'File'
  required: boolean
  scope: 'Platform' | 'Company'
}

/* ----------------------------------------------------------------- Companies */
export const companies: Company[] = [
  // OpsMaven portfolio · Kensium Group (Kensium Pvt Ltd is the detailed "home" tenant)
  { id: 'c1', code: 'COMP-2026-0042', name: 'Kensium Pvt Ltd', initials: 'KP', color: 'bg-indigo-500', jurisdiction: 'India · Telangana', employees: 312, status: 'Active', tier: 'Enterprise', portfolioId: 'pf1', groupId: 'g1', group: 'Kensium Group' },
  { id: 'c2', code: 'COMP-2026-0043', name: 'Kensium LLC', initials: 'KL', color: 'bg-sky-500', jurisdiction: 'United States · Delaware', employees: 184, status: 'Active', tier: 'Enterprise', portfolioId: 'pf1', groupId: 'g1', group: 'Kensium Group' },
  { id: 'c3', code: 'COMP-2026-0051', name: 'Readywire', initials: 'RW', color: 'bg-emerald-500', jurisdiction: 'India · Telangana', employees: 64, status: 'Active', tier: 'Standard', portfolioId: 'pf1', groupId: 'g1', group: 'Kensium Group' },
  { id: 'c4', code: 'COMP-2026-0058', name: 'Digiteon', initials: 'DG', color: 'bg-rose-500', jurisdiction: 'India · Maharashtra', employees: 48, status: 'Active', tier: 'Standard', portfolioId: 'pf1', groupId: 'g1', group: 'Kensium Group' },
  { id: 'c5', code: 'COMP-2026-0061', name: '99x', initials: '9X', color: 'bg-violet-500', jurisdiction: 'Sri Lanka · Colombo', employees: 120, status: 'Active', tier: 'Enterprise', portfolioId: 'pf1', groupId: 'g1', group: 'Kensium Group' },
  // Asia-Pacific Operations portfolio (kept for variety)
  { id: 'c6', code: 'COMP-2026-0064', name: 'Delta Logistics', initials: 'DL', color: 'bg-amber-500', jurisdiction: 'India · Tamil Nadu', employees: 54, status: 'Suspended', tier: 'Basic', portfolioId: 'pf2', groupId: null },
  { id: 'c7', code: 'COMP-2026-0070', name: 'Orbit Media', initials: 'OM', color: 'bg-teal-500', jurisdiction: 'India · Telangana', employees: 27, status: 'Draft', tier: 'Basic', portfolioId: 'pf2', groupId: 'g2', group: 'Orbit Group' },
  { id: 'c8', code: 'COMP-2026-0075', name: 'Nimbus Cloud', initials: 'NC', color: 'bg-fuchsia-500', jurisdiction: 'India · Karnataka', employees: 73, status: 'Active', tier: 'Standard', portfolioId: 'pf2', groupId: 'g2', group: 'Orbit Group' },
]

/* ----------------------------------------------------------------- Portfolios & Groups */
export const portfolios: Portfolio[] = [
  { id: 'pf1', code: 'PORT-2026-015', name: 'OpsMaven', manager: 'OpsMaven', companyIds: ['c1', 'c2', 'c3', 'c4', 'c5'] },
  { id: 'pf2', code: 'PORT-2026-021', name: 'Asia-Pacific Operations', manager: 'Lim Wei', companyIds: ['c6', 'c7', 'c8'] },
]
export const groups: Group[] = [
  { id: 'g1', name: 'Kensium Group', type: 'Holding', companyIds: ['c1', 'c2', 'c3', 'c4', 'c5'], sharingEnabled: true },
  { id: 'g2', name: 'Orbit Group', type: 'Sister', companyIds: ['c7', 'c8'], sharingEnabled: true },
]
export const getPortfolio = (id: string | null) => portfolios.find((p) => p.id === id) ?? null
export const getGroup = (id: string | null) => groups.find((g) => g.id === id) ?? null

/* ----------------------------------------------------------------- Personas (login-as) */
export const personas: Persona[] = [
  { id: 'p1', name: 'Anita Rao', role: 'provider_admin', title: 'Platform Operations · SatelliteHR', blurb: 'Runs the whole SatelliteHR platform; provisions new companies.', companyIds: [] },
  { id: 'p2', name: 'OpsMaven', role: 'portfolio_manager', title: 'Shared-services portfolio manager', blurb: 'OpsMaven manages HR for its portfolio — the Kensium Group of companies.', companyIds: ['c1', 'c2', 'c3', 'c4', 'c5'] },
  { id: 'p6', name: 'Lim Wei', role: 'portfolio_manager', title: 'Lead · Asia-Pacific Operations', blurb: 'Runs HR for the APAC portfolio (Delta, Orbit, Nimbus).', companyIds: ['c6', 'c7', 'c8'] },
  { id: 'p3', name: 'Priya Sharma', role: 'company_hr_admin', title: 'HR Manager · Kensium Pvt Ltd', blurb: 'Owns people, policies & reports for one company.', companyIds: ['c1'] },
  { id: 'p4', name: 'Rahul Verma', role: 'people_manager', title: 'Engineering Lead · Kensium Pvt Ltd', blurb: 'Leads a team; approves their requests.', companyIds: ['c1'] },
  { id: 'p5', name: 'Meera Iyer', role: 'employee', title: 'Senior Analyst · Kensium Pvt Ltd', blurb: 'Uses simple self-service every day.', companyIds: ['c1'] },
  { id: 'p7', name: 'Rohan Shetty', role: 'portfolio_manager', title: 'Group HR Lead · Kensium Pvt Ltd (internal)', blurb: 'Internal lead — an employee of Kensium Pvt Ltd who also runs HR across the Kensium Group. One login, two roles.', companyIds: ['c1', 'c2', 'c3', 'c4', 'c5'], employeeId: 'e15' },
]

/* ----------------------------------------------------------------- Departments */
export const departments: Department[] = [
  { id: 'd1', name: 'Executive', head: 'Vikram Nair', parentId: null, headcount: 6 },
  { id: 'd2', name: 'Engineering', head: 'Rahul Verma', parentId: 'd1', headcount: 84 },
  { id: 'd3', name: 'Sales', head: 'Sneha Kapoor', parentId: 'd1', headcount: 52 },
  { id: 'd4', name: 'Finance', head: 'Arjun Desai', parentId: 'd1', headcount: 23 },
  { id: 'd5', name: 'Human Resources', head: 'Priya Sharma', parentId: 'd1', headcount: 14 },
  { id: 'd6', name: 'Operations', head: 'Karan Mehta', parentId: 'd1', headcount: 61 },
  { id: 'd7', name: 'Platform', head: 'Rahul Verma', parentId: 'd2', headcount: 22 },
  { id: 'd8', name: 'Data', head: 'Rahul Verma', parentId: 'd2', headcount: 18 },
]

/* ----------------------------------------------------------------- Employees */
export const employees: Employee[] = [
  { id: 'e1', name: 'Vikram Nair', email: 'vikram@kensium.example', title: 'Chief Executive Officer', departmentId: 'd1', location: 'Mumbai HQ', managerId: null, status: 'Active', type: 'Employee', joinDate: '2018-03-12', phone: '+91 98200 11001' },
  { id: 'e2', name: 'Rahul Verma', email: 'rahul@kensium.example', title: 'Engineering Lead', departmentId: 'd2', location: 'Mumbai HQ', managerId: 'e1', status: 'Active', type: 'Employee', joinDate: '2019-07-01', phone: '+91 98200 11002' },
  { id: 'e3', name: 'Priya Sharma', email: 'priya@kensium.example', title: 'HR Manager', departmentId: 'd5', location: 'Mumbai HQ', managerId: 'e1', status: 'Active', type: 'Employee', joinDate: '2019-02-18', phone: '+91 98200 11003' },
  { id: 'e4', name: 'Meera Iyer', email: 'meera@kensium.example', title: 'Senior Analyst', departmentId: 'd8', location: 'Pune Office', managerId: 'e2', status: 'Active', type: 'Employee', joinDate: '2021-09-06', phone: '+91 98200 11004' },
  { id: 'e5', name: 'Karan Mehta', email: 'karan@kensium.example', title: 'Operations Head', departmentId: 'd6', location: 'Mumbai HQ', managerId: 'e1', status: 'Active', type: 'Employee', joinDate: '2020-01-20', phone: '+91 98200 11005' },
  { id: 'e6', name: 'Sneha Kapoor', email: 'sneha@kensium.example', title: 'Sales Director', departmentId: 'd3', location: 'Delhi Office', managerId: 'e1', status: 'On Leave', type: 'Employee', joinDate: '2020-11-11', phone: '+91 98200 11006' },
  { id: 'e7', name: 'Arjun Desai', email: 'arjun@kensium.example', title: 'Finance Controller', departmentId: 'd4', location: 'Mumbai HQ', managerId: 'e1', status: 'Active', type: 'Employee', joinDate: '2019-05-30', phone: '+91 98200 11007' },
  { id: 'e8', name: 'Divya Menon', email: 'divya@kensium.example', title: 'Backend Engineer', departmentId: 'd7', location: 'Pune Office', managerId: 'e2', status: 'Active', type: 'Employee', joinDate: '2022-04-04', phone: '+91 98200 11008' },
  { id: 'e9', name: 'Imran Khan', email: 'imran@kensium.example', title: 'Data Engineer', departmentId: 'd8', location: 'Remote', managerId: 'e2', status: 'Probation', type: 'Employee', joinDate: '2026-03-01', phone: '+91 98200 11009' },
  { id: 'e10', name: 'Fatima Sheikh', email: 'fatima@kensium.example', title: 'Account Executive', departmentId: 'd3', location: 'Delhi Office', managerId: 'e6', status: 'Active', type: 'Employee', joinDate: '2023-08-21', phone: '+91 98200 11010' },
  { id: 'e11', name: 'Joseph Thomas', email: 'joseph@kensium.example', title: 'Ops Associate', departmentId: 'd6', location: 'Chennai Hub', managerId: 'e5', status: 'Active', type: 'Contractor', joinDate: '2024-02-14', phone: '+91 98200 11011' },
  { id: 'e12', name: 'Ananya Bose', email: 'ananya@kensium.example', title: 'Recruiter', departmentId: 'd5', location: 'Mumbai HQ', managerId: 'e3', status: 'Active', type: 'Employee', joinDate: '2022-10-10', phone: '+91 98200 11012' },
  { id: 'e13', name: 'Sanjay Gupta', email: 'sanjay@kensium.example', title: 'QA Engineer', departmentId: 'd7', location: 'Pune Office', managerId: 'e2', status: 'Active', type: 'Employee', joinDate: '2021-06-15', phone: '+91 98200 11013' },
  { id: 'e14', name: 'Riya Singh', email: 'riya@kensium.example', title: 'New Hire — Analyst', departmentId: 'd8', location: 'Pune Office', managerId: 'e2', status: 'Onboarding', type: 'Employee', joinDate: '2026-06-15', phone: '+91 98200 11014' },
  // Internal shared-services lead: an EMPLOYEE here who is ALSO the group's portfolio manager (persona p7)
  { id: 'e15', name: 'Rohan Shetty', email: 'rohan@kensium.example', title: 'Group HR Lead', departmentId: 'd5', location: 'Mumbai HQ', managerId: 'e1', status: 'Active', type: 'Employee', joinDate: '2019-11-04', phone: '+91 98200 11015' },
]

export function getEmployee(id: string | null) {
  return employees.find((e) => e.id === id) ?? null
}
export function getDepartment(id: string) {
  return departments.find((d) => d.id === id) ?? null
}
export function reportsOf(managerId: string) {
  return employees.filter((e) => e.managerId === managerId)
}

/* ----------------------------------------------------------------- Unified inbox */
export const inbox: InboxItem[] = [
  { id: 'i1', type: 'Leave', title: 'Annual leave · 3 days', requester: 'Meera Iyer', date: 'Jun 10–12', slaPct: 82, priority: 'High' },
  { id: 'i2', type: 'Leave', title: 'Sick leave · 1 day', requester: 'Divya Menon', date: 'Jun 9', slaPct: 40, priority: 'Normal' },
  { id: 'i3', type: 'Onboarding', title: 'Verify documents', requester: 'Riya Singh', date: 'Due Jun 12', slaPct: 60, priority: 'Normal' },
  { id: 'i4', type: 'Policy Ack', title: 'Acknowledge: Code of Conduct v3', requester: 'You', date: 'Due Jun 14', slaPct: 25, priority: 'Low' },
  { id: 'i5', type: 'Transfer', title: 'Transfer to Platform team', requester: 'Sanjay Gupta', date: 'Eff. Jul 1', slaPct: 70, priority: 'High' },
  { id: 'i6', type: 'Timesheet', title: 'Approve timesheet · week 23', requester: 'Joseph Thomas', date: 'Jun 8', slaPct: 90, priority: 'High' },
  { id: 'i7', type: 'Offer', title: 'Approve offer · Backend Eng.', requester: 'Ananya Bose', date: 'Jun 7', slaPct: 55, priority: 'Normal' },
  { id: 'i8', type: 'Asset', title: 'Laptop return · exit', requester: 'Fatima Sheikh', date: 'Jun 11', slaPct: 35, priority: 'Low' },
]

/* ----------------------------------------------------------------- Leave */
export const leaveBalances = [
  { type: 'Annual', used: 8, total: 21, tone: 'primary' as const },
  { type: 'Sick', used: 3, total: 12, tone: 'info' as const },
  { type: 'Casual', used: 5, total: 7, tone: 'accent' as const },
  { type: 'Comp-off', used: 1, total: 4, tone: 'warning' as const },
]
export const leaveRequests: LeaveRequest[] = [
  { id: 'l1', employee: 'Meera Iyer', type: 'Annual', from: 'Jun 10', to: 'Jun 12', days: 3, status: 'Pending', reason: 'Family function' },
  { id: 'l2', employee: 'Divya Menon', type: 'Sick', from: 'Jun 9', to: 'Jun 9', days: 1, status: 'Pending', reason: 'Fever' },
  { id: 'l3', employee: 'Sanjay Gupta', type: 'Casual', from: 'Jun 3', to: 'Jun 3', days: 1, status: 'Approved', reason: 'Personal errand' },
  { id: 'l4', employee: 'Fatima Sheikh', type: 'Annual', from: 'May 26', to: 'May 30', days: 5, status: 'Approved', reason: 'Vacation' },
  { id: 'l5', employee: 'Imran Khan', type: 'Sick', from: 'Jun 2', to: 'Jun 2', days: 1, status: 'Rejected', reason: 'No balance' },
]

/* ----------------------------------------------------------------- Policies */
export const policies: Policy[] = [
  { id: 'po1', name: 'Code of Conduct', category: 'Compliance', version: 'v3.0', status: 'Active', appliesTo: 'All employees', ackPct: 78, due: 'Jun 14' },
  { id: 'po2', name: 'Leave Policy', category: 'HR', version: 'v2.1', status: 'Active', appliesTo: 'All · India', ackPct: 92, due: '—' },
  { id: 'po3', name: 'Remote Work Policy', category: 'HR', version: 'v1.4', status: 'Active', appliesTo: 'Engineering', ackPct: 64, due: 'Jun 20' },
  { id: 'po4', name: 'Information Security', category: 'Security', version: 'v2.0', status: 'Active', appliesTo: 'All employees', ackPct: 88, due: 'Jun 30' },
  { id: 'po5', name: 'Travel & Expense', category: 'Finance', version: 'v1.0', status: 'Draft', appliesTo: 'Sales, Ops', ackPct: 0, due: '—' },
]

/* ----------------------------------------------------------------- Documents */
export const documents = [
  { id: 'doc1', name: 'Employee Handbook 2026.pdf', type: 'PDF', owner: 'HR', expiry: '—', size: '1.8 MB' },
  { id: 'doc2', name: 'Offer Letter — Riya Singh.pdf', type: 'PDF', owner: 'Ananya Bose', expiry: '—', size: '240 KB' },
  { id: 'doc3', name: 'GST Certificate.pdf', type: 'PDF', owner: 'Finance', expiry: '2027-03-31', size: '512 KB' },
  { id: 'doc4', name: 'ISO 27001 Scope.docx', type: 'DOCX', owner: 'Security', expiry: '2026-12-01', size: '88 KB' },
  { id: 'doc5', name: 'Insurance Policy.pdf', type: 'PDF', owner: 'HR', expiry: '2026-08-15', size: '1.1 MB' },
]

/* ----------------------------------------------------------------- Reports / charts */
export const savedReports = [
  { id: 'r1', name: 'Headcount by Department', type: 'Bar', updated: '2h ago', pinned: true },
  { id: 'r2', name: 'Monthly Headcount Trend', type: 'Line', updated: 'Yesterday', pinned: true },
  { id: 'r3', name: 'Leave Balance Summary', type: 'Table', updated: '3d ago', pinned: false },
  { id: 'r4', name: 'Attendance Register — May', type: 'Table', updated: '1w ago', pinned: false },
  { id: 'r5', name: 'PF / ESIC Eligibility', type: 'Table', updated: '1w ago', pinned: false },
  { id: 'r6', name: 'Hiring Funnel', type: 'Funnel', updated: '2w ago', pinned: false },
]
export const headcountTrend = [
  { month: 'Jan', value: 268 }, { month: 'Feb', value: 274 }, { month: 'Mar', value: 285 },
  { month: 'Apr', value: 293 }, { month: 'May', value: 304 }, { month: 'Jun', value: 312 },
]
export const headcountByDept = [
  { dept: 'Eng', value: 84 }, { dept: 'Ops', value: 61 }, { dept: 'Sales', value: 52 },
  { dept: 'Finance', value: 23 }, { dept: 'HR', value: 14 }, { dept: 'Exec', value: 6 },
]
export const leaveByMonth = [
  { month: 'Jan', annual: 22, sick: 14 }, { month: 'Feb', annual: 18, sick: 10 },
  { month: 'Mar', annual: 31, sick: 9 }, { month: 'Apr', annual: 27, sick: 12 },
  { month: 'May', annual: 44, sick: 16 }, { month: 'Jun', annual: 19, sick: 7 },
]
export const attendanceMix = [
  { name: 'Present', value: 268, tone: '#16a34a' },
  { name: 'WFH', value: 31, tone: '#4f46e5' },
  { name: 'On leave', value: 9, tone: '#d97706' },
  { name: 'Absent', value: 4, tone: '#dc2626' },
]

/* ----------------------------------------------------------------- Audit log */
export const auditLog: AuditEntry[] = [
  { id: 'a1', time: '2026-06-08 14:32', actor: 'Priya Sharma', action: 'Updated', entity: 'Employee · Meera Iyer', detail: 'Location: Mumbai HQ → Pune Office' },
  { id: 'a2', time: '2026-06-08 13:10', actor: 'OpsMaven', action: 'Context switch', entity: 'Company', detail: 'Kensium LLC → Kensium Pvt Ltd' },
  { id: 'a3', time: '2026-06-08 11:48', actor: 'Anita Rao', action: 'Created', entity: 'Company · Orbit Media', detail: 'Status: Draft' },
  { id: 'a4', time: '2026-06-07 17:05', actor: 'Rahul Verma', action: 'Approved', entity: 'Leave · Sanjay Gupta', detail: 'Casual · 1 day' },
  { id: 'a5', time: '2026-06-07 09:22', actor: 'Priya Sharma', action: 'Published', entity: 'Policy · Code of Conduct v3', detail: 'Audience: All employees' },
  { id: 'a6', time: '2026-06-06 16:40', actor: 'System', action: 'Escalated', entity: 'Timesheet · Joseph Thomas', detail: 'SLA 100% — escalated to Ops Head' },
  { id: 'a7', time: '2026-06-05 10:15', actor: 'OpsMaven', action: 'Enabled', entity: 'Group · Kensium Group', detail: 'Cross-company sharing & consolidated reporting switched on (opt-in)' },
]

/* ----------------------------------------------------------------- Hiring */
export const candidates: Candidate[] = [
  { id: 'cd1', name: 'Aditya Rao', role: 'Backend Engineer', stage: 'Applied', rating: 0 },
  { id: 'cd2', name: 'Nisha Patel', role: 'Backend Engineer', stage: 'Screening', rating: 4 },
  { id: 'cd3', name: 'Tom Abraham', role: 'Data Analyst', stage: 'Interview', rating: 4 },
  { id: 'cd4', name: 'Leena George', role: 'Backend Engineer', stage: 'Interview', rating: 5 },
  { id: 'cd5', name: 'Mohan Das', role: 'Account Executive', stage: 'Offer', rating: 4 },
  { id: 'cd6', name: 'Sara Ali', role: 'Data Analyst', stage: 'Hired', rating: 5 },
]
export const requisitions = [
  { id: 'rq1', title: 'Backend Engineer', dept: 'Platform', openings: 2, applicants: 24, status: 'Open' },
  { id: 'rq2', title: 'Data Analyst', dept: 'Data', openings: 1, applicants: 17, status: 'Open' },
  { id: 'rq3', title: 'Account Executive', dept: 'Sales', openings: 3, applicants: 41, status: 'Open' },
  { id: 'rq4', title: 'HR Business Partner', dept: 'Human Resources', openings: 1, applicants: 12, status: 'On hold' },
]

/* ----------------------------------------------------------------- Onboarding */
export const onboardingTasks: OnboardingTask[] = [
  { id: 'ob1', label: 'Offer accepted', owner: 'Riya Singh', status: 'Done', stage: 'Offer' },
  { id: 'ob2', label: 'Submit ID & education documents', owner: 'Riya Singh', status: 'Done', stage: 'Documents' },
  { id: 'ob3', label: 'HR verifies documents', owner: 'Priya Sharma', status: 'In progress', stage: 'Documents' },
  { id: 'ob4', label: 'Assign laptop & access', owner: 'IT', status: 'Pending', stage: 'Assets' },
  { id: 'ob5', label: 'Manager intro & 30-60-90 plan', owner: 'Rahul Verma', status: 'Pending', stage: 'Induction' },
  { id: 'ob6', label: 'Induction & policy acknowledgements', owner: 'Riya Singh', status: 'Pending', stage: 'Induction' },
]

/* ----------------------------------------------------------------- Roles & permissions */
export const roleDefs: RoleDef[] = [
  { name: 'Platform Super Admin', level: 'Platform', users: 2, description: 'Full control of the platform; provisions companies.' },
  { name: 'Platform Operations', level: 'Platform', users: 4, description: 'Tenant onboarding & support; no transactional data edits.' },
  { name: 'Portfolio Manager', level: 'Portfolio', users: 6, description: 'Runs HR across authorized companies; context switching.' },
  { name: 'Group Reporting Viewer', level: 'Group', users: 3, description: 'Read-only consolidated reports across a group.' },
  { name: 'Company HR Admin', level: 'Company', users: 11, description: 'Owns people, policies & reports for one company.' },
  { name: 'Company IT / Security', level: 'Company', users: 5, description: 'User-role assignment, SSO, access audits.' },
  { name: 'People Manager', level: 'Manager', users: 38, description: 'Approves their team’s requests; lifecycle actions.' },
  { name: 'Employee — Standard', level: 'Employee', users: 268, description: 'Default self-service for employees.' },
]
export const permissionMatrix = {
  capabilities: ['Create company', 'View all companies', 'Edit company', 'Manage portfolio', 'Approve leave', 'View payroll', 'Edit policies', 'Run reports'],
  roles: ['Provider Admin', 'Portfolio Mgr', 'HR Admin', 'Manager', 'Employee'],
  // grid[capability][role] => 'full' | 'scoped' | 'none'
  grid: [
    ['full', 'none', 'none', 'none', 'none'],
    ['full', 'scoped', 'none', 'none', 'none'],
    ['full', 'scoped', 'full', 'none', 'none'],
    ['full', 'scoped', 'none', 'none', 'none'],
    ['scoped', 'scoped', 'full', 'scoped', 'none'],
    ['scoped', 'scoped', 'scoped', 'none', 'none'],
    ['scoped', 'scoped', 'full', 'none', 'none'],
    ['full', 'scoped', 'full', 'scoped', 'scoped'],
  ] as ('full' | 'scoped' | 'none')[][],
}

/* ----------------------------------------------------------------- Custom fields */
export const customFields: CustomField[] = [
  { id: 'cf1', label: 'Blood Group', entity: 'Employee', type: 'Dropdown', required: false, scope: 'Platform' },
  { id: 'cf2', label: 'T-Shirt Size', entity: 'Employee', type: 'Dropdown', required: false, scope: 'Company' },
  { id: 'cf3', label: 'Emergency Contact', entity: 'Employee', type: 'Text', required: true, scope: 'Platform' },
  { id: 'cf4', label: 'Cost Center', entity: 'Department', type: 'Text', required: true, scope: 'Company' },
  { id: 'cf5', label: 'Billable', entity: 'Position', type: 'Boolean', required: false, scope: 'Company' },
]

/* ----------------------------------------------------------------- Attendance */
export const attendanceWeek = [
  { day: 'Mon', status: 'Present', in: '09:12', out: '18:30' },
  { day: 'Tue', status: 'Present', in: '09:05', out: '18:10' },
  { day: 'Wed', status: 'WFH', in: '09:30', out: '18:45' },
  { day: 'Thu', status: 'Present', in: '09:20', out: '18:25' },
  { day: 'Fri', status: 'On leave', in: '—', out: '—' },
  { day: 'Sat', status: 'Weekend', in: '—', out: '—' },
  { day: 'Sun', status: 'Weekend', in: '—', out: '—' },
]

/* ----------------------------------------------------------------- Company setup wizard config */
export const setupSteps = ['Basics', 'Legal', 'Contact', 'Operations', 'Admin', 'Review']

/* ----------------------------------------------------------------- Workflow builder seed */
export const workflowTemplates = ['Standard Leave', 'Onboarding', 'Exit Clearance', 'Expense Approval', 'Blank']
export const approverRoles = ['Manager', 'Dept Head', 'HR Admin', 'Finance', 'CEO']
