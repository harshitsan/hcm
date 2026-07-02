/**
 * Directory snapshot used by the Policy Distribution module to resolve
 * audiences. In the real product this comes from the employee master;
 * the POC keeps a static, realistic slice covering the tenant hierarchy
 * (portfolio → groups → companies) plus the org attributes the
 * distribution-scope stories target.
 */

export const PORTFOLIO_NAME = 'Meridian Holdings'

export const COMPANY_GROUPS = [
  {
    group: 'Aurora Group',
    companies: ['Northwind Retail', 'Contoso Manufacturing'],
  },
  {
    group: 'Helios Group',
    companies: ['Fabrikam Logistics', 'Trey Research'],
  },
] as const

export const COMPANIES = [
  'Northwind Retail',
  'Contoso Manufacturing',
  'Fabrikam Logistics',
  'Trey Research',
] as const

export const LOCATIONS = [
  'Mumbai HQ',
  'Pune Plant',
  'Bengaluru Hub',
  'Hyderabad Office',
] as const

export const DEPARTMENTS = [
  'Human Resources',
  'Engineering',
  'Operations',
  'Finance',
  'Sales',
] as const

export const EMPLOYEE_GROUPS = [
  'Leadership',
  'People Managers',
  'Field Staff',
  'Office Staff',
] as const

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
] as const

export type CompanyName = (typeof COMPANIES)[number]
export type LocationName = (typeof LOCATIONS)[number]
export type DepartmentName = (typeof DEPARTMENTS)[number]
export type EmployeeGroupName = (typeof EMPLOYEE_GROUPS)[number]
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export interface Employee {
  id: string
  name: string
  email: string
  company: CompanyName
  location: LocationName
  department: DepartmentName
  group: EmployeeGroupName
  employmentType: EmploymentType
  jobRole: string
  /** ISO hire date — drives hire-based due-date rules. */
  hireDate: string
  /** False for non-portal staff (Employee (Non-User)) who cannot self-acknowledge. */
  isPortalUser: boolean
}

/** The signed-in persona used for the self-service inbox tab. */
export const CURRENT_EMPLOYEE_ID = 'emp-101'

export const seedEmployees: Employee[] = [
  {
    id: 'emp-101',
    name: 'Riya Sharma',
    email: 'riya.sharma@northwind.com',
    company: 'Northwind Retail',
    location: 'Mumbai HQ',
    department: 'Engineering',
    group: 'Office Staff',
    employmentType: 'Full-time',
    jobRole: 'Senior Software Engineer',
    hireDate: '2024-03-11',
    isPortalUser: true,
  },
  {
    id: 'emp-102',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@northwind.com',
    company: 'Northwind Retail',
    location: 'Mumbai HQ',
    department: 'Human Resources',
    group: 'People Managers',
    employmentType: 'Full-time',
    jobRole: 'HR Business Partner',
    hireDate: '2021-08-02',
    isPortalUser: true,
  },
  {
    id: 'emp-103',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@northwind.com',
    company: 'Northwind Retail',
    location: 'Bengaluru Hub',
    department: 'Sales',
    group: 'Office Staff',
    employmentType: 'Full-time',
    jobRole: 'Account Executive',
    hireDate: '2023-01-16',
    isPortalUser: true,
  },
  {
    id: 'emp-104',
    name: 'Vikram Singh',
    email: 'vikram.singh@northwind.com',
    company: 'Northwind Retail',
    location: 'Mumbai HQ',
    department: 'Finance',
    group: 'Leadership',
    employmentType: 'Full-time',
    jobRole: 'Finance Controller',
    hireDate: '2019-11-04',
    isPortalUser: true,
  },
  {
    id: 'emp-105',
    name: 'Kavya Reddy',
    email: 'kavya.reddy@contoso.com',
    company: 'Contoso Manufacturing',
    location: 'Pune Plant',
    department: 'Operations',
    group: 'Field Staff',
    employmentType: 'Full-time',
    jobRole: 'Plant Supervisor',
    hireDate: '2022-05-23',
    isPortalUser: true,
  },
  {
    id: 'emp-106',
    name: 'Ramesh Yadav',
    email: 'ramesh.yadav@contoso.com',
    company: 'Contoso Manufacturing',
    location: 'Pune Plant',
    department: 'Operations',
    group: 'Field Staff',
    employmentType: 'Contract',
    jobRole: 'Machine Operator',
    hireDate: '2025-09-15',
    isPortalUser: false,
  },
  {
    id: 'emp-107',
    name: 'Meena Iyer',
    email: 'meena.iyer@contoso.com',
    company: 'Contoso Manufacturing',
    location: 'Pune Plant',
    department: 'Human Resources',
    group: 'People Managers',
    employmentType: 'Full-time',
    jobRole: 'HR Generalist',
    hireDate: '2020-02-10',
    isPortalUser: true,
  },
  {
    id: 'emp-108',
    name: 'Dev Patel',
    email: 'dev.patel@contoso.com',
    company: 'Contoso Manufacturing',
    location: 'Hyderabad Office',
    department: 'Engineering',
    group: 'Office Staff',
    employmentType: 'Contract',
    jobRole: 'Automation Engineer',
    hireDate: '2025-04-07',
    isPortalUser: true,
  },
  {
    id: 'emp-109',
    name: 'Farah Khan',
    email: 'farah.khan@fabrikam.com',
    company: 'Fabrikam Logistics',
    location: 'Bengaluru Hub',
    department: 'Operations',
    group: 'People Managers',
    employmentType: 'Full-time',
    jobRole: 'Fleet Manager',
    hireDate: '2021-12-13',
    isPortalUser: true,
  },
  {
    id: 'emp-110',
    name: 'Suresh Nair',
    email: 'suresh.nair@fabrikam.com',
    company: 'Fabrikam Logistics',
    location: 'Bengaluru Hub',
    department: 'Operations',
    group: 'Field Staff',
    employmentType: 'Part-time',
    jobRole: 'Warehouse Associate',
    hireDate: '2024-10-21',
    isPortalUser: false,
  },
  {
    id: 'emp-111',
    name: 'Ananya Bose',
    email: 'ananya.bose@fabrikam.com',
    company: 'Fabrikam Logistics',
    location: 'Hyderabad Office',
    department: 'Finance',
    group: 'Office Staff',
    employmentType: 'Full-time',
    jobRole: 'Payroll Analyst',
    hireDate: '2023-06-05',
    isPortalUser: true,
  },
  {
    id: 'emp-112',
    name: 'Karthik Rao',
    email: 'karthik.rao@treyresearch.com',
    company: 'Trey Research',
    location: 'Hyderabad Office',
    department: 'Engineering',
    group: 'Office Staff',
    employmentType: 'Full-time',
    jobRole: 'Research Engineer',
    hireDate: '2022-09-26',
    isPortalUser: true,
  },
  {
    id: 'emp-113',
    name: 'Pooja Desai',
    email: 'pooja.desai@treyresearch.com',
    company: 'Trey Research',
    location: 'Hyderabad Office',
    department: 'Human Resources',
    group: 'Leadership',
    employmentType: 'Full-time',
    jobRole: 'Head of People',
    hireDate: '2018-04-30',
    isPortalUser: true,
  },
  {
    id: 'emp-114',
    name: 'Ishaan Verma',
    email: 'ishaan.verma@treyresearch.com',
    company: 'Trey Research',
    location: 'Bengaluru Hub',
    department: 'Engineering',
    group: 'Office Staff',
    employmentType: 'Intern',
    jobRole: 'Engineering Intern',
    hireDate: '2026-06-01',
    isPortalUser: true,
  },
  {
    id: 'emp-115',
    name: 'Lakshmi Menon',
    email: 'lakshmi.menon@northwind.com',
    company: 'Northwind Retail',
    location: 'Bengaluru Hub',
    department: 'Sales',
    group: 'Field Staff',
    employmentType: 'Part-time',
    jobRole: 'Store Associate',
    hireDate: '2025-02-17',
    isPortalUser: false,
  },
  {
    id: 'emp-116',
    name: 'Tanvi Joshi',
    email: 'tanvi.joshi@contoso.com',
    company: 'Contoso Manufacturing',
    location: 'Pune Plant',
    department: 'Finance',
    group: 'Office Staff',
    employmentType: 'Full-time',
    jobRole: 'Cost Accountant',
    hireDate: '2024-07-08',
    isPortalUser: true,
  },
]

export function groupOfCompany(company: CompanyName): string {
  const entry = COMPANY_GROUPS.find((g) =>
    (g.companies as readonly string[]).includes(company)
  )
  return entry?.group ?? 'Unassigned'
}
