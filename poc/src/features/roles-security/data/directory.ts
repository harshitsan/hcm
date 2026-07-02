/**
 * Org directory for the Roles & Security module — the four-level hierarchy
 * (platform → portfolio → group-company → company), departments, workforce
 * types and the people that role assignments, delegations and impersonation
 * sessions reference (RSEC-01, RSEC-02, RSEC-03, RSEC-13).
 */
export const HIERARCHY_LEVELS = [
  'Platform',
  'Portfolio',
  'Group Company',
  'Company',
] as const
export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number]

export interface Portfolio {
  id: string
  name: string
}

export interface GroupCompany {
  id: string
  name: string
  portfolioId: string
}

export interface Company {
  id: string
  name: string
  groupId: string
}

export const PORTFOLIO: Portfolio = { id: 'pf-1', name: 'Meridian Holdings' }

export const GROUP_COMPANIES: GroupCompany[] = [
  { id: 'grp-1', name: 'Meridian Tech Group', portfolioId: 'pf-1' },
  { id: 'grp-2', name: 'Meridian Retail Group', portfolioId: 'pf-1' },
]

export const COMPANIES: Company[] = [
  { id: 'co-1', name: 'Aurora Software', groupId: 'grp-1' },
  { id: 'co-2', name: 'Northwind Analytics', groupId: 'grp-1' },
  { id: 'co-3', name: 'Cedar Retail', groupId: 'grp-2' },
  { id: 'co-4', name: 'Harbor Logistics', groupId: 'grp-2' },
]

/** The group the demo Group Company Admin governs (RSEC-11, RSEC-19). */
export const MY_GROUP_ID = 'grp-1'
/** Home company of the demo Company Admin and Employee personas. */
export const HOME_COMPANY_ID = 'co-1'

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'HR',
  'Sales',
  'Operations',
] as const
export type Department = (typeof DEPARTMENTS)[number]

export const WORKFORCE_TYPES = [
  'Permanent',
  'Contract',
  'Consultant',
  'Intern',
] as const
export type WorkforceType = (typeof WORKFORCE_TYPES)[number]

export const LOCATIONS = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Pune',
  'Remote',
] as const

export const POSITIONS = [
  'Software Engineer',
  'QA Engineer',
  'HR Manager',
  'Finance Controller',
  'Payroll Specialist',
  'Sales Lead',
  'Support Analyst',
  'Store Manager',
] as const

export interface Person {
  id: string
  name: string
  email: string
  companyId: string
  department: Department
  workforceType: WorkforceType
  position: (typeof POSITIONS)[number]
  /** Non-user employees have HR records but no system login (RSEC-13). */
  isUser: boolean
}

export const PEOPLE: Person[] = [
  { id: 'emp-01', name: 'Ananya Sharma', email: 'ananya.sharma@aurora.dev', companyId: 'co-1', department: 'Engineering', workforceType: 'Permanent', position: 'Software Engineer', isUser: true },
  { id: 'emp-02', name: 'Rohan Verma', email: 'rohan.verma@aurora.dev', companyId: 'co-1', department: 'Engineering', workforceType: 'Permanent', position: 'QA Engineer', isUser: true },
  { id: 'emp-03', name: 'Meera Iyer', email: 'meera.iyer@aurora.dev', companyId: 'co-1', department: 'HR', workforceType: 'Permanent', position: 'HR Manager', isUser: true },
  { id: 'emp-04', name: 'Kabir Shah', email: 'kabir.shah@aurora.dev', companyId: 'co-1', department: 'Finance', workforceType: 'Contract', position: 'Finance Controller', isUser: true },
  { id: 'emp-05', name: 'Divya Pillai', email: 'divya.pillai@northwind.io', companyId: 'co-2', department: 'Operations', workforceType: 'Permanent', position: 'Support Analyst', isUser: true },
  { id: 'emp-06', name: 'Nikhil Rao', email: 'nikhil.rao@northwind.io', companyId: 'co-2', department: 'Engineering', workforceType: 'Consultant', position: 'Software Engineer', isUser: true },
  { id: 'emp-07', name: 'Sara Fernandes', email: 'sara.fernandes@northwind.io', companyId: 'co-2', department: 'HR', workforceType: 'Permanent', position: 'HR Manager', isUser: true },
  { id: 'emp-08', name: 'Aditya Kulkarni', email: 'aditya.k@cedarretail.in', companyId: 'co-3', department: 'Sales', workforceType: 'Permanent', position: 'Sales Lead', isUser: true },
  { id: 'emp-09', name: 'Pooja Menon', email: 'pooja.menon@cedarretail.in', companyId: 'co-3', department: 'Operations', workforceType: 'Contract', position: 'Store Manager', isUser: true },
  { id: 'emp-10', name: 'Vikram Joshi', email: 'vikram.joshi@harborlog.in', companyId: 'co-4', department: 'Operations', workforceType: 'Permanent', position: 'Store Manager', isUser: true },
  { id: 'emp-11', name: 'Ravi Naik', email: 'ravi.naik@aurora.dev', companyId: 'co-1', department: 'Operations', workforceType: 'Contract', position: 'Support Analyst', isUser: false },
  { id: 'emp-12', name: 'Lakshmi Devi', email: 'lakshmi.devi@cedarretail.in', companyId: 'co-3', department: 'Operations', workforceType: 'Permanent', position: 'Store Manager', isUser: false },
  { id: 'emp-13', name: 'Harish Gupta', email: 'harish.gupta@harborlog.in', companyId: 'co-4', department: 'Finance', workforceType: 'Intern', position: 'Payroll Specialist', isUser: false },
  { id: 'emp-14', name: 'Tanvi Desai', email: 'tanvi.desai@aurora.dev', companyId: 'co-1', department: 'HR', workforceType: 'Intern', position: 'Payroll Specialist', isUser: true },
]

/** Persona acting as "me" for the Employee (User) role. */
export const CURRENT_EMPLOYEE_ID = 'emp-01'
/** Persona whose record the Employee (Non-User) governance view shows. */
export const NON_USER_EMPLOYEE_ID = 'emp-11'

export function companyName(id: string | null | undefined): string {
  return COMPANIES.find((c) => c.id === id)?.name ?? '—'
}

export function groupName(id: string | null | undefined): string {
  return GROUP_COMPANIES.find((g) => g.id === id)?.name ?? '—'
}

export function personName(id: string | null | undefined): string {
  return PEOPLE.find((p) => p.id === id)?.name ?? '—'
}

export function personById(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id)
}

/** Screen catalog used for screen-level permissions (RSEC-33, RSEC-34). */
export const APP_MODULES = [
  'Recruitment',
  'Payroll Configuration',
  'Leave Management',
  'Time & Attendance',
  'Employee Self-Service',
  'Organization',
] as const
export type AppModule = (typeof APP_MODULES)[number]

export interface AppScreen {
  id: string
  name: string
  module: AppModule
}

export const APP_SCREENS: AppScreen[] = [
  { id: 'scr-01', name: 'Job Openings', module: 'Recruitment' },
  { id: 'scr-02', name: 'Candidates', module: 'Recruitment' },
  { id: 'scr-03', name: 'Interview Schedule', module: 'Recruitment' },
  { id: 'scr-04', name: 'Pay Components', module: 'Payroll Configuration' },
  { id: 'scr-05', name: 'Tax Setup', module: 'Payroll Configuration' },
  { id: 'scr-06', name: 'Payroll Calendar', module: 'Payroll Configuration' },
  { id: 'scr-07', name: 'Leave Requests', module: 'Leave Management' },
  { id: 'scr-08', name: 'Leave Types', module: 'Leave Management' },
  { id: 'scr-09', name: 'Holiday List', module: 'Leave Management' },
  { id: 'scr-10', name: 'Timesheets', module: 'Time & Attendance' },
  { id: 'scr-11', name: 'Shift Roster', module: 'Time & Attendance' },
  { id: 'scr-12', name: 'Attendance Regularization', module: 'Time & Attendance' },
  { id: 'scr-13', name: 'My Profile', module: 'Employee Self-Service' },
  { id: 'scr-14', name: 'My Documents', module: 'Employee Self-Service' },
  { id: 'scr-15', name: 'My Payslips', module: 'Employee Self-Service' },
  { id: 'scr-16', name: 'Departments', module: 'Organization' },
  { id: 'scr-17', name: 'Positions', module: 'Organization' },
  { id: 'scr-18', name: 'Assign Roles', module: 'Organization' },
]

export function screenName(id: string): string {
  return APP_SCREENS.find((s) => s.id === id)?.name ?? id
}
