/**
 * Company ↔ jurisdiction assignments, jurisdiction-scoped policies and the
 * employee contexts used to resolve applicability (FR 6.4.2, FR 6.4.3).
 * All references are by catalog id so every module draws from the single
 * supported catalog (JUR-07).
 */
import { employeesInJurisdiction } from './cross-references'

export interface CompanyRecord {
  id: string
  name: string
  group: string
  portfolio: string
  /** Catalog ids the company operates in — at least one required (JUR-11). */
  jurisdictionIds: string[]
  primaryJurisdictionId: string
  /** Active headcount per jurisdiction; informs removal warnings. */
  employeesByJurisdiction: Record<string, number>
}

export const POLICY_MODULES = [
  'Leave',
  'Payroll',
  'Compliance',
  'Benefits',
  'Time & Attendance',
] as const
export type PolicyModule = (typeof POLICY_MODULES)[number]

export interface JurisdictionPolicy {
  id: string
  name: string
  module: PolicyModule
  /** Applicability criteria — one or more catalog jurisdictions (JUR-05). */
  jurisdictionIds: string[]
  status: 'active' | 'draft'
  owner: string
}

export interface EmployeeContext {
  id: string
  name: string
  companyId: string
  jurisdictionId: string
  /** false = non-login employee; applicability resolves on their behalf (JUR-16). */
  isUser: boolean
  designation: string
}

export const seedCompanies: CompanyRecord[] = [
  {
    id: 'c-01',
    name: 'Meridian Tech',
    group: 'Meridian Group',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-01', 'jur-08', 'jur-11', 'jur-04'],
    primaryJurisdictionId: 'jur-01',
    employeesByJurisdiction: { 'jur-01': 640, 'jur-08': 512, 'jur-11': 486, 'jur-04': 46 },
  },
  {
    id: 'c-02',
    name: 'Meridian Digital',
    group: 'Meridian Group',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-03'],
    primaryJurisdictionId: 'jur-03',
    employeesByJurisdiction: { 'jur-03': 194 },
  },
  {
    id: 'c-03',
    name: 'Meridian Robotics',
    group: 'Meridian Group',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-01', 'jur-09'],
    primaryJurisdictionId: 'jur-01',
    employeesByJurisdiction: { 'jur-01': 92, 'jur-09': 38 },
  },
  {
    id: 'c-04',
    name: 'Bluegrain Foods',
    group: 'Independent',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-01', 'jur-09'],
    primaryJurisdictionId: 'jur-09',
    employeesByJurisdiction: { 'jur-01': 210, 'jur-09': 176 },
  },
  {
    id: 'c-05',
    name: 'Northwind Logistics',
    group: 'Independent',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-02', 'jur-10'],
    primaryJurisdictionId: 'jur-02',
    employeesByJurisdiction: { 'jur-02': 305, 'jur-10': 122 },
  },
  {
    id: 'c-06',
    name: 'Halcyon Textiles',
    group: 'Halcyon Group',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-05'],
    primaryJurisdictionId: 'jur-05',
    employeesByJurisdiction: { 'jur-05': 128 },
  },
  {
    id: 'c-07',
    name: 'Cobalt Marine Services',
    group: 'Halcyon Group',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-04', 'jur-12'],
    primaryJurisdictionId: 'jur-04',
    employeesByJurisdiction: { 'jur-04': 61, 'jur-12': 17 },
  },
  {
    id: 'c-08',
    name: 'Kestrel Renewables',
    group: 'Independent',
    portfolio: 'Apex Holdings Portfolio',
    jurisdictionIds: ['jur-13'],
    primaryJurisdictionId: 'jur-13',
    employeesByJurisdiction: { 'jur-13': 24 },
  },
]

/** The signed-in Company Admin persona manages this company in the POC. */
export const MY_COMPANY_ID = 'c-01'
/** The Group Company Admin persona manages this group. */
export const MY_GROUP = 'Meridian Group'

export const seedPolicies: JurisdictionPolicy[] = [
  {
    id: 'pol-01',
    name: 'India Earned Leave Policy',
    module: 'Leave',
    jurisdictionIds: ['jur-01'],
    status: 'active',
    owner: 'Meridian Tech HR',
  },
  {
    id: 'pol-02',
    name: 'Karnataka Shops & Establishments Working Hours',
    module: 'Compliance',
    jurisdictionIds: ['jur-08', 'jur-11'],
    status: 'active',
    owner: 'Meridian Tech HR',
  },
  {
    id: 'pol-03',
    name: 'US Overtime (FLSA) Policy',
    module: 'Payroll',
    jurisdictionIds: ['jur-02', 'jur-10'],
    status: 'active',
    owner: 'Northwind HR',
  },
  {
    id: 'pol-04',
    name: 'UK Statutory Sick Pay Policy',
    module: 'Benefits',
    jurisdictionIds: ['jur-03'],
    status: 'active',
    owner: 'Meridian Digital HR',
  },
  {
    id: 'pol-05',
    name: 'Singapore CPF Contribution Policy',
    module: 'Payroll',
    jurisdictionIds: ['jur-04'],
    status: 'active',
    owner: 'Cobalt Marine HR',
  },
  {
    id: 'pol-06',
    name: 'Maharashtra Festival Holiday Calendar',
    module: 'Leave',
    jurisdictionIds: ['jur-09'],
    status: 'active',
    owner: 'Bluegrain HR',
  },
  {
    id: 'pol-07',
    name: 'Germany Working Time Directive Policy',
    module: 'Time & Attendance',
    jurisdictionIds: ['jur-05'],
    status: 'active',
    owner: 'Halcyon HR',
  },
  {
    id: 'pol-08',
    name: 'SEZ Export-Unit Attendance Policy',
    module: 'Time & Attendance',
    jurisdictionIds: ['jur-13'],
    status: 'draft',
    owner: 'Kestrel HR',
  },
]

export const seedEmployees: EmployeeContext[] = [
  {
    id: 'emp-01',
    name: 'Ananya Sharma',
    companyId: 'c-01',
    jurisdictionId: 'jur-08',
    isUser: true,
    designation: 'Senior Engineer, Bengaluru',
  },
  {
    id: 'emp-02',
    name: 'Ravi Kulkarni',
    companyId: 'c-03',
    jurisdictionId: 'jur-09',
    isUser: true,
    designation: 'Plant Supervisor, Pune',
  },
  {
    id: 'emp-03',
    name: 'Grace Whitmore',
    companyId: 'c-02',
    jurisdictionId: 'jur-03',
    isUser: true,
    designation: 'Account Manager, London',
  },
  {
    id: 'emp-04',
    name: 'Miguel Alvarez',
    companyId: 'c-05',
    jurisdictionId: 'jur-10',
    isUser: false,
    designation: 'Warehouse Operative, Fresno',
  },
  {
    id: 'emp-05',
    name: 'Lakshmi Nair',
    companyId: 'c-04',
    jurisdictionId: 'jur-01',
    isUser: false,
    designation: 'Line Worker, Nashik Unit',
  },
  {
    id: 'emp-06',
    name: 'Tan Wei Ling',
    companyId: 'c-07',
    jurisdictionId: 'jur-04',
    isUser: true,
    designation: 'Marine Coordinator, Singapore',
  },
  {
    id: 'emp-07',
    name: 'Farid Haddad',
    companyId: 'c-07',
    jurisdictionId: 'jur-12',
    isUser: false,
    designation: 'Dock Supervisor, Dubai',
  },
]

/** The Employee (User) persona resolves to this employee in the POC. */
export const MY_EMPLOYEE_ID = 'emp-01'

/**
 * How many companies / policies / employee records reference a jurisdiction
 * (JUR-01 guard). Employee counts come from the directory, where each
 * employee belongs to exactly one jurisdiction.
 */
export function countReferences(
  jurisdictionId: string,
  companies: CompanyRecord[],
  policies: JurisdictionPolicy[]
): { companies: number; policies: number; employees: number; total: number } {
  const c = companies.filter((co) =>
    co.jurisdictionIds.includes(jurisdictionId)
  ).length
  const p = policies.filter((po) =>
    po.jurisdictionIds.includes(jurisdictionId)
  ).length
  const e = employeesInJurisdiction(jurisdictionId).length
  return { companies: c, policies: p, employees: e, total: c + p + e }
}
