/**
 * Platform Administration — organization model domain (SYS-06, 22, 45, 46,
 * 47, 48, 49, 50, 51). Company details, n-level department hierarchy,
 * positions (one department each), locations and policy applicability.
 */

export interface CompanyDetails {
  legalName: string
  code: string
  /** Supported jurisdictions from the platform catalog (SYS-48). */
  jurisdictionIds: string[]
}

export interface Department {
  id: string
  name: string
  /** Null for a root node — hierarchy is n-level (SYS-50). */
  parentId: string | null
}

export interface Position {
  id: string
  title: string
  /** Exactly one department per position (SYS-46). */
  departmentId: string
  holders: number
}

export interface OrgLocation {
  id: string
  name: string
  city: string
  /** Shared with the group via approved sharing (SYS-49). */
  sharedWithGroup: boolean
}

export const POLICY_DIMENSIONS = [
  'Departments',
  'Locations',
  'Jurisdictions',
  'Workforce type',
  'Groups',
] as const
export type PolicyDimension = (typeof POLICY_DIMENSIONS)[number]

export interface OrgPolicy {
  id: string
  name: string
  /** Empty array means "all dimensions" (SYS-51). */
  dimensions: PolicyDimension[]
}

export const seedCompanyDetails: CompanyDetails = {
  legalName: 'Aster Software Pvt Ltd',
  code: 'ASTER-IN',
  jurisdictionIds: ['jur-in-ka', 'jur-in-mh'],
}

export const seedDepartments: Department[] = [
  { id: 'dep-01', name: 'Engineering', parentId: null },
  { id: 'dep-02', name: 'Platform Engineering', parentId: 'dep-01' },
  { id: 'dep-03', name: 'SRE & Infrastructure', parentId: 'dep-02' },
  { id: 'dep-04', name: 'Product Engineering', parentId: 'dep-01' },
  { id: 'dep-05', name: 'Mobile Squad', parentId: 'dep-04' },
  { id: 'dep-06', name: 'Human Resources', parentId: null },
  { id: 'dep-07', name: 'Talent Acquisition', parentId: 'dep-06' },
  { id: 'dep-08', name: 'Finance', parentId: null },
  { id: 'dep-09', name: 'Payroll', parentId: 'dep-08' },
]

export const seedPositions: Position[] = [
  { id: 'pos-01', title: 'Senior Engineer', departmentId: 'dep-04', holders: 24 },
  { id: 'pos-02', title: 'SRE Lead', departmentId: 'dep-03', holders: 3 },
  { id: 'pos-03', title: 'HR Manager', departmentId: 'dep-06', holders: 2 },
  { id: 'pos-04', title: 'Recruiter', departmentId: 'dep-07', holders: 5 },
  { id: 'pos-05', title: 'Payroll Analyst', departmentId: 'dep-09', holders: 4 },
  { id: 'pos-06', title: 'Mobile Engineer', departmentId: 'dep-05', holders: 9 },
]

export const seedOrgLocations: OrgLocation[] = [
  { id: 'loc-01', name: 'Whitefield Campus', city: 'Bengaluru', sharedWithGroup: true },
  { id: 'loc-02', name: 'Andheri East Office', city: 'Mumbai', sharedWithGroup: false },
  { id: 'loc-03', name: 'HSR Layout Studio', city: 'Bengaluru', sharedWithGroup: false },
]

export const seedOrgPolicies: OrgPolicy[] = [
  { id: 'pol-01', name: 'Hybrid work policy', dimensions: ['Departments', 'Locations'] },
  { id: 'pol-02', name: 'Statutory leave policy (IN)', dimensions: ['Jurisdictions'] },
  { id: 'pol-03', name: 'Code of conduct', dimensions: [] },
  { id: 'pol-04', name: 'Contractor timesheet policy', dimensions: ['Workforce type'] },
]

export const placementEmployees = [
  'Arjun Pillai',
  'Kavya Raman',
  'Sana Kulkarni',
  'Ravi Annamalai',
  'New hire — Diya Menon',
] as const
