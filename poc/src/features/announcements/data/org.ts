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
  'positions',
  'groups',
  'workforceTypes',
] as const

export type Dimension = (typeof DIMENSIONS)[number]

export const DIMENSION_LABELS: Record<Dimension, string> = {
  companies: 'Company',
  jurisdictions: 'Jurisdiction',
  locations: 'Location',
  departments: 'Department',
  positions: 'Position',
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
  positions: [
    { value: 'Software Engineer', deprecated: false },
    { value: 'Senior Software Engineer', deprecated: false },
    { value: 'HR Executive', deprecated: false },
    { value: 'Sales Associate', deprecated: false },
    { value: 'Finance Analyst', deprecated: false },
    { value: 'Operations Lead', deprecated: false },
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
  position: string
  groups: string[]
  workforceType: string
  /** In-system announcements are only reachable with system access (ANN-08/13). */
  hasSystemAccess: boolean
}

export const seedEmployees: Employee[] = [
  { id: 'e-01', name: 'Anita Rao', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Engineering', position: 'Software Engineer', groups: ['All Hands'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-02', name: 'Ravi Kumar', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Operations', position: 'Operations Lead', groups: ['All Hands', 'Safety Wardens'], workforceType: 'Full-time', hasSystemAccess: false },
  { id: 'e-03', name: 'Meera Iyer', company: 'Aster Digital', jurisdiction: 'India', location: 'Bengaluru', department: 'Human Resources', position: 'HR Executive', groups: ['All Hands', 'Wellness Committee'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-04', name: 'Josh Patel', company: 'Aster Digital', jurisdiction: 'United States', location: 'Austin', department: 'Sales', position: 'Sales Associate', groups: ['All Hands'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-05', name: 'Lena Fischer', company: 'Aster Manufacturing', jurisdiction: 'India', location: 'Chennai', department: 'Operations', position: 'Operations Lead', groups: ['Safety Wardens'], workforceType: 'Contractor', hasSystemAccess: true },
  { id: 'e-06', name: 'Tom Whelan', company: 'Aster Retail', jurisdiction: 'United Kingdom', location: 'London', department: 'Finance', position: 'Finance Analyst', groups: ['All Hands'], workforceType: 'Part-time', hasSystemAccess: true },
  { id: 'e-07', name: 'Sana Sheikh', company: 'Borealis Labs', jurisdiction: 'India', location: 'Bengaluru', department: 'Engineering', position: 'Senior Software Engineer', groups: ['Leadership'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-08', name: 'Diego Morales', company: 'Cyan Logistics', jurisdiction: 'United States', location: 'Austin', department: 'Operations', position: 'Operations Lead', groups: [], workforceType: 'Contractor', hasSystemAccess: true },
  { id: 'e-09', name: 'Grace Lin', company: 'Delta Foods', jurisdiction: 'Singapore', location: 'Chennai', department: 'Finance', position: 'Finance Analyst', groups: ['Wellness Committee'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-10', name: 'Arjun Nair', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Engineering', position: 'Software Engineer', groups: [], workforceType: 'Intern', hasSystemAccess: false },
  { id: 'e-11', name: 'Priya Sharma', company: 'Aster Digital', jurisdiction: 'India', location: 'Hyderabad', department: 'Human Resources', position: 'HR Executive', groups: ['All Hands', 'Leadership'], workforceType: 'Full-time', hasSystemAccess: true },
  { id: 'e-12', name: 'Nikhil Bose', company: 'Aster Digital', jurisdiction: 'India', location: 'Bengaluru', department: 'Engineering', position: 'Software Engineer', groups: ['All Hands'], workforceType: 'Contractor', hasSystemAccess: true },
]

/* ------------------------------------------------------------------ */
/* Announcement Coordinator role (PDF: Announcement Coordinator Role)  */
/* ------------------------------------------------------------------ */

export const COORDINATOR_ROLE_TYPES = [
  'Announcement Coordinator',
  'Announcement Reviewer',
] as const

export type CoordinatorRoleType = (typeof COORDINATOR_ROLE_TYPES)[number]

/**
 * Coordinator assignment per the Kensium Role screen: role name + type,
 * description, and the applicable location(s)/department(s)/position(s)
 * the coordinator is responsible for, assigned to a specific employee.
 */
export interface AnnouncementCoordinator {
  id: string
  roleName: string
  roleType: CoordinatorRoleType
  description: string
  locations: string[]
  departments: string[]
  positions: string[]
  employee: string
}

export const seedCoordinators: AnnouncementCoordinator[] = [
  {
    id: 'coord-01',
    roleName: 'India Announcement Coordinator',
    roleType: 'Announcement Coordinator',
    description: 'Creates, publishes and reviews announcements and maintains the announcement image repository for the India offices.',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    departments: ['Human Resources'],
    positions: ['HR Executive'],
    employee: 'Priya Sharma',
  },
  {
    id: 'coord-02',
    roleName: 'Announcement Reviewer — HR',
    roleType: 'Announcement Reviewer',
    description: 'Reviews and edits saved announcements before publishing.',
    locations: ['Bengaluru'],
    departments: ['Human Resources'],
    positions: ['HR Executive'],
    employee: 'Meera Iyer',
  },
]

/** The signed-in admin persona used for "Pending with me" and creator attribution. */
export const CURRENT_ADMIN = 'Priya Sharma'

/** Persona whose attributes drive the self-service feed for Employee (User). */
export const FEED_EMPLOYEE = seedEmployees[0]

/** Persona without system access, used for the Employee (Non-User) view (ANN-13). */
export const NON_USER_EMPLOYEE = seedEmployees[1]
