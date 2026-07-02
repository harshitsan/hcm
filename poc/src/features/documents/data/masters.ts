import { CURRENT_EMPLOYEE, HOME_COMPANY, type ModuleName } from './org'

/** Kensium: Organization > Document Types — per-tenant master. */
export interface DocumentType {
  id: string
  name: string
  description: string
  modules: ModuleName[]
}

export const seedDocumentTypes: DocumentType[] = [
  {
    id: 'dt-01',
    name: 'Employment Contract',
    description: 'Signed contract of employment between company and employee',
    modules: ['Employee Management'],
  },
  {
    id: 'dt-02',
    name: 'Company Registration',
    description: 'Statutory registration and incorporation certificates',
    modules: ['Organization'],
  },
  {
    id: 'dt-03',
    name: 'Tax Certificate',
    description: 'Tax registrations, filings, and clearance certificates',
    modules: ['Organization', 'Payroll'],
  },
  {
    id: 'dt-04',
    name: 'Resume',
    description: 'Candidate CV / resume collected during hiring',
    modules: ['Talent Acquisition'],
  },
  {
    id: 'dt-05',
    name: 'Offer Letter',
    description: 'Offer issued to a selected candidate',
    modules: ['Talent Acquisition', 'Employee Management'],
  },
  {
    id: 'dt-06',
    name: 'ID Proof',
    description: 'Government-issued identity document',
    modules: ['Employee Management', 'Talent Acquisition'],
  },
  {
    id: 'dt-07',
    name: 'Educational Certificate',
    description: 'Degree, diploma, or training certificates',
    modules: ['Employee Management', 'Talent Acquisition'],
  },
  {
    id: 'dt-08',
    name: 'Insurance Policy',
    description: 'Company or group insurance policy documents',
    modules: ['Organization', 'Compliance'],
  },
  {
    id: 'dt-09',
    name: 'Salary Revision Letter',
    description: 'Compensation revision communication',
    modules: ['Payroll', 'Employee Management'],
  },
  {
    id: 'dt-10',
    name: 'Compliance Audit Report',
    description: 'Internal or statutory audit outcome reports',
    modules: ['Compliance', 'Organization'],
  },
  {
    id: 'dt-11',
    name: 'Experience Letter',
    description: 'Prior-employment experience proof',
    modules: ['Employee Management'],
  },
  {
    id: 'dt-12',
    name: 'Vendor Agreement',
    description: 'Contracts with vendors and service providers',
    modules: ['Organization'],
  },
]

/** Kensium: Organization > Required Certificates — starts empty (DOC-27 empty state). */
export interface RequiredCertificate {
  id: string
  certificateName: string
  authorityName: string
}

export const seedCertificates: RequiredCertificate[] = []

/** Kensium: Employee Management > Document Custodian. 'All' = unrestricted scope. */
export interface CustodianMapping {
  id: string
  documentTypeName: string
  custodianPosition: string
  location: string
  department: string
  position: string
  employeeClass: string
  company: string
}

export const seedCustodians: CustodianMapping[] = [
  {
    id: 'cu-01',
    documentTypeName: 'Employment Contract',
    custodianPosition: 'HR Manager',
    location: 'All',
    department: 'All',
    position: 'All',
    employeeClass: 'Full-time',
    company: HOME_COMPANY,
  },
  {
    id: 'cu-02',
    documentTypeName: 'ID Proof',
    custodianPosition: 'HR Manager',
    location: 'Chennai',
    department: 'All',
    position: 'All',
    employeeClass: 'All',
    company: HOME_COMPANY,
  },
  {
    id: 'cu-03',
    documentTypeName: 'Tax Certificate',
    custodianPosition: 'Finance Controller',
    location: 'All',
    department: 'Finance',
    position: 'All',
    employeeClass: 'All',
    company: HOME_COMPANY,
  },
  {
    id: 'cu-04',
    documentTypeName: 'Salary Revision Letter',
    custodianPosition: 'Finance Controller',
    location: 'All',
    department: 'All',
    position: 'All',
    employeeClass: 'All',
    company: HOME_COMPANY,
  },
  {
    id: 'cu-05',
    documentTypeName: 'Resume',
    custodianPosition: 'Recruiter',
    location: 'All',
    department: 'Human Resources',
    position: 'All',
    employeeClass: 'All',
    company: HOME_COMPANY,
  },
  {
    id: 'cu-06',
    documentTypeName: 'Employment Contract',
    custodianPosition: 'Operations Head',
    location: 'Mumbai',
    department: 'Operations',
    position: 'All',
    employeeClass: 'Contract',
    company: 'Meridian Logistics',
  },
]

/** Kensium: Organization > Policy Document. */
export interface PolicyDocument {
  id: string
  name: string
  effectiveFrom: string
  /** null = open-ended. */
  effectiveTill: string | null
  /** 'All employees' or a department name. */
  applicability: string
  excludedPositionLevels: string[]
  content: string
}

export function policyIsActive(policy: PolicyDocument, today: string): boolean {
  if (policy.effectiveFrom > today) return false
  if (policy.effectiveTill && policy.effectiveTill < today) return false
  return true
}

/** Whether the policy applies to the signed-in employee (DOC-34). */
export function policyAppliesToCurrentEmployee(
  policy: PolicyDocument,
  today: string
): boolean {
  if (!policyIsActive(policy, today)) return false
  if (
    policy.applicability !== 'All employees' &&
    policy.applicability !== CURRENT_EMPLOYEE.department
  ) {
    return false
  }
  return !policy.excludedPositionLevels.includes(CURRENT_EMPLOYEE.positionLevel)
}

export const seedPolicies: PolicyDocument[] = [
  {
    id: 'pol-01',
    name: 'Code of Conduct',
    effectiveFrom: '2026-01-01',
    effectiveTill: '2026-12-31',
    applicability: 'All employees',
    excludedPositionLevels: [],
    content:
      'All employees must act with integrity, avoid conflicts of interest, and report violations to HR. Disciplinary action follows the graded response matrix.',
  },
  {
    id: 'pol-02',
    name: 'Remote Work Policy',
    effectiveFrom: '2026-03-01',
    effectiveTill: '2026-09-30',
    applicability: 'All employees',
    excludedPositionLevels: ['L1'],
    content:
      'Eligible employees may work remotely up to 3 days a week with manager approval. Entry-level (L1) staff complete on-site onboarding first.',
  },
  {
    id: 'pol-03',
    name: 'Travel & Expense Policy',
    effectiveFrom: '2025-04-01',
    effectiveTill: '2026-03-31',
    applicability: 'All employees',
    excludedPositionLevels: [],
    content:
      'Domestic travel requires prior approval; expenses are reimbursed against receipts within 30 days. Superseded by the FY27 revision.',
  },
  {
    id: 'pol-04',
    name: 'Leadership Compensation Policy',
    effectiveFrom: '2026-01-01',
    effectiveTill: null,
    applicability: 'All employees',
    excludedPositionLevels: ['L1', 'L2', 'L3'],
    content:
      'Defines variable pay, ESOP vesting, and clawback provisions for senior leadership (L4 and above).',
  },
  {
    id: 'pol-05',
    name: 'Data Privacy Policy',
    effectiveFrom: '2026-08-01',
    effectiveTill: null,
    applicability: 'All employees',
    excludedPositionLevels: [],
    content:
      'Personal data must be processed lawfully with tenant isolation and encryption at rest. Takes effect 1 Aug 2026.',
  },
  {
    id: 'pol-06',
    name: 'Engineering On-call Policy',
    effectiveFrom: '2026-02-01',
    effectiveTill: '2027-01-31',
    applicability: 'Engineering',
    excludedPositionLevels: ['L5'],
    content:
      'Engineering staff participate in the on-call rota with compensatory offs. Applies to the Engineering department only.',
  },
]
