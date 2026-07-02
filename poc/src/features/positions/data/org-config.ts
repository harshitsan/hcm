/**
 * Organization configuration reference data consumed by the Positions module:
 * project types/roles, employee classifications, pay grades, numbering series
 * and group standards (POS-20, 24-32, 35, 36, 38-42, 44, 45).
 */

export interface ProjectType {
  id: string
  companyId: string
  name: string
  /** Unique per company; prefixes generated project codes (POS-42). */
  acronym: string
  description: string
  /** Next sequence used when previewing generated project codes. */
  nextCodeSeq: number
}

export const seedProjectTypes: ProjectType[] = [
  { id: 'pt-acu', companyId: 'co-meridian', name: 'Acumatica Implementation', acronym: 'ACU', description: 'ERP implementation engagements on Acumatica', nextCodeSeq: 18 },
  { id: 'pt-web', companyId: 'co-meridian', name: 'Web Application', acronym: 'WEB', description: 'Custom web application delivery projects', nextCodeSeq: 42 },
  { id: 'pt-mnt', companyId: 'co-meridian', name: 'Maintenance & Support', acronym: 'MNT', description: 'Post-go-live support and maintenance retainers', nextCodeSeq: 9 },
  { id: 'pt-int', companyId: 'co-meridian', name: 'Internal Initiative', acronym: 'INT', description: 'Internal tooling and process improvement work', nextCodeSeq: 5 },
  { id: 'pt-bp-ml', companyId: 'co-bluepeak', name: 'ML Delivery', acronym: 'MLD', description: 'Machine learning delivery projects', nextCodeSeq: 3 },
]

export interface ProjectRole {
  id: string
  companyId: string
  name: string
  description: string
  /** Applicable project types; empty set = bench / non-billable (POS-40). */
  projectTypeIds: string[]
  /** Evaluation questions scored during appraisal (POS-27/41). */
  questions: string[]
}

export const seedProjectRoles: ProjectRole[] = [
  {
    id: 'pr-dev',
    companyId: 'co-meridian',
    name: 'Developer',
    description: 'Hands-on build and unit testing',
    projectTypeIds: ['pt-acu', 'pt-web', 'pt-int'],
    questions: [
      'Delivers assigned stories within sprint commitments',
      'Code quality meets review standards',
      'Communicates blockers early',
    ],
  },
  {
    id: 'pr-lead',
    companyId: 'co-meridian',
    name: 'Project Lead',
    description: 'Owns delivery plan and client communication',
    projectTypeIds: ['pt-acu', 'pt-web', 'pt-mnt', 'pt-int'],
    questions: [
      'Keeps delivery plan current and realistic',
      'Manages client expectations effectively',
    ],
  },
  {
    id: 'pr-qa',
    companyId: 'co-meridian',
    name: 'QA Engineer',
    description: 'Test planning and execution',
    projectTypeIds: ['pt-acu', 'pt-web'],
    questions: ['Test coverage of critical paths', 'Defect reporting quality'],
  },
  {
    id: 'pr-support',
    companyId: 'co-meridian',
    name: 'Support Analyst',
    description: 'Ticket triage and resolution on retainers',
    projectTypeIds: ['pt-mnt'],
    questions: ['SLA adherence', 'Customer satisfaction on closed tickets'],
  },
  {
    id: 'pr-bench',
    companyId: 'co-meridian',
    name: 'Bench Role',
    description: 'Unallocated / non-billable resource tracking',
    projectTypeIds: [],
    questions: [],
  },
]

export interface Project {
  id: string
  companyId: string
  name: string
  typeId: string
  code: string
}

export const seedProjects: Project[] = [
  { id: 'prj-1', companyId: 'co-meridian', name: 'Northwind ERP Rollout', typeId: 'pt-acu', code: 'ACU-0016' },
  { id: 'prj-2', companyId: 'co-meridian', name: 'Retail Portal Rebuild', typeId: 'pt-web', code: 'WEB-0041' },
  { id: 'prj-3', companyId: 'co-meridian', name: 'Contoso Support Retainer', typeId: 'pt-mnt', code: 'MNT-0008' },
  { id: 'prj-4', companyId: 'co-meridian', name: 'HR Automation', typeId: 'pt-int', code: 'INT-0004' },
]

export const CLASS_TYPES = ['Full time', 'Part time', 'Contract', 'Intern'] as const
export type ClassType = (typeof CLASS_TYPES)[number]

export const PAYROLL_FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly'] as const
export type PayrollFrequency = (typeof PAYROLL_FREQUENCIES)[number]

export const WAGE_TYPES = ['Hourly', 'Salaried'] as const
export type WageType = (typeof WAGE_TYPES)[number]

export interface EmployeeClass {
  id: string
  companyId: string
  name: string
  acronym: string
  classType: ClassType
  payrollFrequency: PayrollFrequency
  /** Hourly ⇒ overtime-eligible, Salaried ⇒ exempt (POS-38). */
  wageType: WageType
  status: 'active' | 'inactive'
}

export const seedEmployeeClasses: EmployeeClass[] = [
  { id: 'ec-perm-sal', companyId: 'co-meridian', name: 'Permanent_Salaried', acronym: 'PS', classType: 'Full time', payrollFrequency: 'Monthly', wageType: 'Salaried', status: 'active' },
  { id: 'ec-perm-hr', companyId: 'co-meridian', name: 'Permanent_Hourly', acronym: 'PH', classType: 'Full time', payrollFrequency: 'Weekly', wageType: 'Hourly', status: 'active' },
  { id: 'ec-contract', companyId: 'co-meridian', name: 'Contract_Hourly', acronym: 'CH', classType: 'Contract', payrollFrequency: 'Weekly', wageType: 'Hourly', status: 'active' },
  { id: 'ec-parttime', companyId: 'co-meridian', name: 'PartTime_Hourly', acronym: 'PTH', classType: 'Part time', payrollFrequency: 'Bi-weekly', wageType: 'Hourly', status: 'active' },
  { id: 'ec-intern', companyId: 'co-meridian', name: 'Intern_Stipend', acronym: 'IS', classType: 'Intern', payrollFrequency: 'Monthly', wageType: 'Salaried', status: 'inactive' },
]

export interface PayGrade {
  id: string
  companyId: string
  name: string
  /** Position level this band is mapped to (POS-36). */
  level: number
  minimum: number
  midpoint: number
  maximum: number
}

export const seedPayGrades: PayGrade[] = [
  { id: 'pg-l1', companyId: 'co-meridian', name: 'Grade A (Level 1)', level: 1, minimum: 45000, midpoint: 55000, maximum: 65000 },
  { id: 'pg-l2', companyId: 'co-meridian', name: 'Grade B (Level 2)', level: 2, minimum: 62000, midpoint: 76000, maximum: 90000 },
  { id: 'pg-l3', companyId: 'co-meridian', name: 'Grade C (Level 3)', level: 3, minimum: 88000, midpoint: 105000, maximum: 125000 },
]

export const SERIES_APPLIES_TO = ['Position ID', 'Employee Code'] as const
export type SeriesAppliesTo = (typeof SERIES_APPLIES_TO)[number]

/** Numbering series that auto-generate identifiers (POS-35). */
export interface NumberSeries {
  id: string
  companyId: string
  name: string
  appliesTo: SeriesAppliesTo
  /** Template; {####} is replaced with the zero-padded next number. */
  template: string
  nextNumber: number
}

export const seedSeries: NumberSeries[] = [
  { id: 'ser-pos', companyId: 'co-meridian', name: 'Position ID Series', appliesTo: 'Position ID', template: 'POS-MER-{####}', nextNumber: 13 },
  { id: 'ser-emp', companyId: 'co-meridian', name: 'Employee Code Series', appliesTo: 'Employee Code', template: 'EMP-MER-{####}', nextNumber: 21 },
]

export function renderSeries(template: string, n: number): string {
  return template.replace('{####}', String(n).padStart(4, '0'))
}

/** Group standards used to seed member companies (POS-33/45). */
export const GROUP_STANDARD_CLASSES: Omit<EmployeeClass, 'id' | 'companyId'>[] = [
  { name: 'Std_Permanent_Salaried', acronym: 'GPS', classType: 'Full time', payrollFrequency: 'Monthly', wageType: 'Salaried', status: 'active' },
  { name: 'Std_Contract_Hourly', acronym: 'GCH', classType: 'Contract', payrollFrequency: 'Weekly', wageType: 'Hourly', status: 'active' },
]

export const GROUP_STANDARD_PAY_GRADES: Omit<PayGrade, 'id' | 'companyId'>[] = [
  { name: 'Group Grade A (Level 1)', level: 1, minimum: 48000, midpoint: 58000, maximum: 68000 },
  { name: 'Group Grade B (Level 2)', level: 2, minimum: 65000, midpoint: 80000, maximum: 95000 },
]
