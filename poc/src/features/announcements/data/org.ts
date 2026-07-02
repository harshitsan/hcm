import { type Role } from '@/context/role-context'

/**
 * Governed organization configuration for announcement targeting (ANN-17).
 * The six targeting dimensions resolve from these per-tenant values —
 * deprecated entries stay on old records but are no longer selectable.
 */
export const DIMENSIONS = [
  'companies',
  'jurisdictions',
  'locations',
  'departments',
  'groups',
  'workforceTypes',
] as const

export type Dimension = (typeof DIMENSIONS)[number]

export const DIMENSION_LABELS: Record<Dimension, string> = {
  companies: 'Company',
  jurisdictions: 'Jurisdiction',
  locations: 'Location',
  departments: 'Department',
  groups: 'Group',
  workforceTypes: 'Workforce type',
}

/** Audience selectors — empty array means the dimension is unconstrained. */
export type Targeting = Record<Dimension, string[]>

export interface OrgConfigValue {
  value: string
  deprecated: boolean
}

export type OrgConfig = Record<Dimension, OrgConfigValue[]>

export const seedOrgConfig: OrgConfig = {
  companies: [
    { value: 'Aster Digital', deprecated: false },
    { value: 'Aster Manufacturing', deprecated: false },
    { value: 'Aster Retail', deprecated: false },
    { value: 'Borealis Labs', deprecated: false },
    { value: 'Cyan Logistics', deprecated: false },
    { value: 'Delta Foods', deprecated: false },
  ],
  jurisdictions: [
    { value: 'India', deprecated: false },
    { value: 'United States', deprecated: false },
    { value: 'United Kingdom', deprecated: false },
    { value: 'Singapore', deprecated: false },
  ],
  locations: [
    { value: 'Hyderabad', deprecated: false },
    { value: 'Bengaluru', deprecated: false },
    { value: 'Chennai', deprecated: false },
    { value: 'Austin', deprecated: false },
    { value: 'London', deprecated: false },
    { value: 'Pune (Legacy)', deprecated: true },
  ],
  departments: [
    { value: 'Engineering', deprecated: false },
    { value: 'Human Resources', deprecated: false },
    { value: 'Finance', deprecated: false },
    { value: 'Sales', deprecated: false },
    { value: 'Operations', deprecated: false },
  ],
  groups: [
    { value: 'All Hands', deprecated: false },
    { value: 'Leadership', deprecated: false },
    { value: 'Wellness Committee', deprecated: false },
    { value: 'Safety Wardens', deprecated: false },
  ],
  workforceTypes: [
    { value: 'Full-time', deprecated: false },
    { value: 'Part-time', deprecated: false },
    { value: 'Contractor', deprecated: false },
    { value: 'Intern', deprecated: false },
  ],
}

/**
 * Authorization boundary per role (ANN-09/10/11): which companies a role may
 * target and whose records it may see. Entities outside this scope are never
 * offered in the audience picker.
 */
export function companiesForRole(role: Role): string[] {
  switch (role) {
    case 'Platform Admin':
      return seedOrgConfig.companies.map((c) => c.value)
    case 'Portfolio Admin':
      return ['Aster Digital', 'Aster Manufacturing', 'Aster Retail', 'Borealis Labs']
    case 'Group Company Admin':
      return ['Aster Digital', 'Aster Manufacturing', 'Aster Retail']
    default:
      return ['Aster Digital']
  }
}

export const SCOPE_DESCRIPTIONS: Record<Role, string> = {
  'Platform Admin': 'Platform-wide — every company on the platform',
  'Portfolio Admin': 'Northwind Portfolio companies only',
  'Group Company Admin': 'Aster Group companies only',
  'Company Admin': 'Aster Digital only',
  'Employee (User)': 'Aster Digital only',
  'Employee (Non-User)': 'No system access',
}

export interface Employee {
  id: string
  name: string
  company: string
  jurisdiction: string
  location: string
  department: string
  groups: string[]
  workforceType: string
  /** In-system announcements are only reachable with system access (ANN-08/13). */
  hasSystemAccess: boolean
}

export const seedEmployees: Employee[] = [
  { id: 'e-01', name: 'Anita Rao', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Engineering', groups: ['All Hands'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-02', name: 'Ravi Kumar', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Operations', groups: ['All Hands', 'Safety Wardens'], workforceType: 'Full-time', hasSystemAccess: false },
  { id: 'e-03', name: 'Meera Iyer', company: 'Aster Digital', jurisdiction: 'India', location: 'Bengaluru', department: 'Human Resources', groups: ['All Hands', 'Wellness Committee'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-04', name: 'Josh Patel', company: 'Aster Digital', jurisdiction: 'United States', location: 'Austin', department: 'Sales', groups: ['All Hands'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-05', name: 'Lena Fischer', company: 'Aster Manufacturing', jurisdiction: 'India', location: 'Chennai', department: 'Operations', groups: ['Safety Wardens'], workforceType: 'Contractor', hasSystemAccess: true },
  { id: 'e-06', name: 'Tom Whelan', company: 'Aster Retail', jurisdiction: 'United Kingdom', location: 'London', department: 'Finance', groups: ['All Hands'], workforceType: 'Part-time', hasSystemAccess: true },
  { id: 'e-07', name: 'Sana Sheikh', company: 'Borealis Labs', jurisdiction: 'India', location: 'Bengaluru', department: 'Engineering', groups: ['Leadership'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-08', name: 'Diego Morales', company: 'Cyan Logistics', jurisdiction: 'United States', location: 'Austin', department: 'Operations', groups: [], workforceType: 'Contractor', hasSystemAccess: true },
  { id: 'e-09', name: 'Grace Lin', company: 'Delta Foods', jurisdiction: 'Singapore', location: 'Chennai', department: 'Finance', groups: ['Wellness Committee'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-10', name: 'Arjun Nair', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Engineering', groups: [], workforceType: 'Intern', hasSystemAccess: false },
  { id: 'e-11', name: 'Priya Sharma', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Human Resources', groups: ['All Hands', 'Leadership'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-12', name: 'Nikhil Bose', company: 'Aster Digital', jurisdiction: 'India', location: 'Bengaluru', department: 'Engineering', groups: ['All Hands'], workforceType: 'Contractor', hasSystemAccess: true },
]

/** The signed-in admin persona used for "Pending with me" and creator attribution. */
export const CURRENT_ADMIN = 'Priya Sharma'

/** Persona whose attributes drive the self-service feed for Employee (User). */
export const FEED_EMPLOYEE = seedEmployees[0]

/** Persona without system access, used for the Employee (Non-User) view (ANN-13). */
export const NON_USER_EMPLOYEE = seedEmployees[1]
