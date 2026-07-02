/**
 * Companies + workforce records used by the Authentication module.
 * A `User` is a distinct identity entity (FR 6.1.2) — these records are the
 * tenant and workforce side of the linkage stories (AUTH-03/06/08/14/20).
 */

export interface Company {
  id: string
  name: string
  /** Group the company belongs to, or null for standalone tenants. */
  group: string | null
  tenantCode: string
}

export const COMPANIES: Company[] = [
  { id: 'co-01', name: 'Northwind Retail', group: 'Northwind Group', tenantCode: 'NWR' },
  { id: 'co-02', name: 'Northwind Logistics', group: 'Northwind Group', tenantCode: 'NWL' },
  { id: 'co-03', name: 'Northwind Foods', group: 'Northwind Group', tenantCode: 'NWF' },
  { id: 'co-04', name: 'Aurora Software Labs', group: 'Aurora Holdings', tenantCode: 'ASL' },
  { id: 'co-05', name: 'Aurora Consulting', group: 'Aurora Holdings', tenantCode: 'ACO' },
  { id: 'co-06', name: 'Meridian Health Services', group: null, tenantCode: 'MHS' },
] as const

export function companyName(id: string | null): string {
  if (!id) return '—'
  return COMPANIES.find((c) => c.id === id)?.name ?? id
}

/**
 * Demo administrative scope per canonical role: Platform/Portfolio Admins
 * span all tenants, the Group Company Admin governs the Northwind Group and
 * the Company Admin's home tenant is Northwind Retail (AUTH-12/13).
 */
export function manageableCompanyIds(role: string): string[] {
  switch (role) {
    case 'Platform Admin':
    case 'Portfolio Admin':
      return COMPANIES.map((c) => c.id)
    case 'Group Company Admin':
      return COMPANIES.filter((c) => c.group === 'Northwind Group').map(
        (c) => c.id
      )
    case 'Company Admin':
      return ['co-01']
    default:
      return []
  }
}

/**
 * Workforce record (Employee) — deliberately separate from the User entity.
 * `linkedUserId === null` models employees who exist with no login (AUTH-08,
 * AUTH-20); linkage is stored here and mirrored on the membership (AUTH-06).
 */
export interface EmployeeRecord {
  id: string
  name: string
  title: string
  companyId: string
  linkedUserId: string | null
}

export const seedEmployees: EmployeeRecord[] = [
  { id: 'emp-101', name: 'Grace Okonkwo', title: 'HR Generalist', companyId: 'co-01', linkedUserId: 'au-02' },
  { id: 'emp-102', name: 'Daniel Mercer', title: 'Warehouse Supervisor', companyId: 'co-02', linkedUserId: 'au-03' },
  { id: 'emp-103', name: 'Leila Haddad', title: 'Payroll Specialist', companyId: 'co-01', linkedUserId: 'au-05' },
  { id: 'emp-104', name: 'Tomás Rivera', title: 'Line Cook', companyId: 'co-03', linkedUserId: null },
  { id: 'emp-105', name: 'Ingrid Svensson', title: 'Delivery Driver', companyId: 'co-02', linkedUserId: null },
  { id: 'emp-106', name: 'Kofi Mensah', title: 'Software Engineer', companyId: 'co-04', linkedUserId: 'au-06' },
  { id: 'emp-107', name: 'Hannah Byrne', title: 'QA Analyst', companyId: 'co-04', linkedUserId: null },
  { id: 'emp-108', name: 'Ravi Subramanian', title: 'Consultant', companyId: 'co-05', linkedUserId: 'au-07' },
  { id: 'emp-109', name: 'Beatriz Nogueira', title: 'Registered Nurse', companyId: 'co-06', linkedUserId: null },
  { id: 'emp-110', name: 'Samuel Adeyemi', title: 'Facilities Technician', companyId: 'co-06', linkedUserId: null },
  { id: 'emp-111', name: 'Chloe Martin', title: 'Store Associate', companyId: 'co-01', linkedUserId: null },
  { id: 'emp-112', name: 'Viktor Petrov', title: 'Financial Analyst', companyId: 'co-05', linkedUserId: null },
]
