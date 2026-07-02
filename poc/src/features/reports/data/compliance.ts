import { type Company } from './report-catalog'

/**
 * Statutory employee master used by the compliance registers (RPT-10, RPT-11,
 * RPT-16). Non-user employees (no login) are included like any other record.
 */
export interface StatutoryEmployee {
  id: string
  name: string
  company: Company
  department: string
  isUser: boolean
  /** Monthly gross wage in INR — drives PF/ESIC decision-table evaluation. */
  monthlyWage: number
  uan: string | null
  pan: string | null
  esicNumber: string | null
  /** June 2026 register figures. */
  attendanceDays: number
  leaveDays: number
  lopDays: number
}

const e = (
  id: string,
  name: string,
  company: Company,
  department: string,
  isUser: boolean,
  monthlyWage: number,
  uan: string | null,
  pan: string | null,
  esicNumber: string | null,
  attendanceDays: number,
  leaveDays: number,
  lopDays: number
): StatutoryEmployee => ({
  id,
  name,
  company,
  department,
  isUser,
  monthlyWage,
  uan,
  pan,
  esicNumber,
  attendanceDays,
  leaveDays,
  lopDays,
})

export const seedStatutoryEmployees: StatutoryEmployee[] = [
  e(
    'st-01',
    'Ananya Rao',
    'Aurora Software',
    'Engineering',
    true,
    237500,
    'UAN100234',
    'AAAPR1234K',
    null,
    21,
    1,
    0
  ),
  e(
    'st-02',
    'Vikram Shetty',
    'Aurora Software',
    'Sales',
    true,
    98000,
    'UAN100871',
    'BBQPS5521M',
    null,
    17,
    2,
    1
  ),
  e(
    'st-03',
    'Karthik Reddy',
    'Aurora Software',
    'Engineering',
    true,
    145000,
    null,
    'CCKPR8812L',
    null,
    22,
    0,
    0
  ),
  e(
    'st-04',
    'Lakshmi Pillai',
    'Aurora Software',
    'Human Resources',
    false,
    14200,
    'UAN101440',
    null,
    'ESIC-44121',
    22,
    0,
    0
  ),
  e(
    'st-05',
    'Suresh Babu',
    'Aurora Software',
    'Operations',
    false,
    12800,
    null,
    null,
    null,
    20,
    2,
    0
  ),
  e(
    'st-06',
    'Meera Iyer',
    'Northwind Retail',
    'Operations',
    false,
    13500,
    'UAN102001',
    'DDMPI3341N',
    'ESIC-51002',
    22,
    0,
    0
  ),
  e(
    'st-07',
    'Priyanka Das',
    'Northwind Retail',
    'Sales',
    true,
    19800,
    'UAN102114',
    'EEPPD9022P',
    null,
    21,
    1,
    0
  ),
  e(
    'st-08',
    'Rakesh Kumar',
    'Northwind Retail',
    'Operations',
    false,
    11200,
    null,
    'FFRPK2210Q',
    'ESIC-51044',
    19,
    1,
    2
  ),
  e(
    'st-09',
    'Daniel Chen',
    'Zenith Manufacturing',
    'Engineering',
    true,
    180800,
    'UAN103300',
    'GGDPC7710R',
    null,
    20,
    2,
    0
  ),
  e(
    'st-10',
    'Sanjay Ghosh',
    'Zenith Manufacturing',
    'Operations',
    false,
    14900,
    'UAN103412',
    null,
    null,
    22,
    0,
    0
  ),
  e(
    'st-11',
    'Anita Borkar',
    'Zenith Manufacturing',
    'Operations',
    false,
    16400,
    'UAN103515',
    'HHABO5533S',
    'ESIC-62018',
    21,
    0,
    1
  ),
  e(
    'st-12',
    'Fatima Khan',
    'Helios Energy',
    'Finance',
    true,
    266600,
    'UAN104100',
    'IIFKH1144T',
    null,
    22,
    0,
    0
  ),
  e(
    'st-13',
    'Neha Kulkarni',
    'Helios Energy',
    'Finance',
    true,
    92000,
    'UAN104211',
    'JJNKU6655U',
    null,
    18,
    3,
    1
  ),
  e(
    'st-14',
    'Gopal Krishnan',
    'Helios Energy',
    'Operations',
    false,
    13900,
    null,
    null,
    'ESIC-70233',
    22,
    0,
    0
  ),
]

/** Rules-engine decision tables driving eligibility evaluation (RPT-25). */
export interface DecisionRule {
  id: string
  table: 'PF Eligibility' | 'ESIC Eligibility' | 'Statutory Completeness'
  condition: string
  outcome: string
  version: string
  effectiveFrom: string
}

export const decisionRules: DecisionRule[] = [
  {
    id: 'dr-01',
    table: 'PF Eligibility',
    condition: 'Monthly wage ≤ ₹15,000',
    outcome: 'PF mandatory',
    version: 'v4',
    effectiveFrom: '2026-04-01',
  },
  {
    id: 'dr-02',
    table: 'PF Eligibility',
    condition: 'Monthly wage > ₹15,000',
    outcome: 'PF voluntary',
    version: 'v4',
    effectiveFrom: '2026-04-01',
  },
  {
    id: 'dr-03',
    table: 'ESIC Eligibility',
    condition: 'Monthly wage ≤ ₹21,000',
    outcome: 'ESIC covered',
    version: 'v2',
    effectiveFrom: '2025-10-01',
  },
  {
    id: 'dr-04',
    table: 'ESIC Eligibility',
    condition: 'Monthly wage > ₹21,000',
    outcome: 'Not covered',
    version: 'v2',
    effectiveFrom: '2025-10-01',
  },
  {
    id: 'dr-05',
    table: 'Statutory Completeness',
    condition: 'UAN, PAN present; ESIC no. present when covered',
    outcome: 'Record complete',
    version: 'v3',
    effectiveFrom: '2026-04-01',
  },
]

/** PF mandatory wage ceiling per decision table v4. */
export const PF_WAGE_CEILING = 15000
/** ESIC coverage wage ceiling per decision table v2. */
export const ESIC_WAGE_CEILING = 21000

export const pfStatus = (wage: number) =>
  wage <= PF_WAGE_CEILING ? 'PF mandatory' : 'PF voluntary'
export const esicStatus = (wage: number) =>
  wage <= ESIC_WAGE_CEILING ? 'ESIC covered' : 'Not covered'

/** Fields the completeness rules require on every record (RPT-11). */
export function missingStatutoryFields(emp: StatutoryEmployee): string[] {
  const missing: string[] = []
  if (!emp.uan) missing.push('UAN')
  if (!emp.pan) missing.push('PAN')
  if (esicStatus(emp.monthlyWage) === 'ESIC covered' && !emp.esicNumber)
    missing.push('ESIC number')
  return missing
}

/** Governed, versioned, effective-dated statutory templates (RPT-21). */
export interface TemplateVersion {
  id: string
  register:
    | 'Wage Register'
    | 'Attendance Register'
    | 'Leave Register'
    | 'PF/ESIC Format'
  version: number
  effectiveFrom: string
  status: 'active' | 'superseded' | 'draft'
  note: string
}

export const seedTemplates: TemplateVersion[] = [
  {
    id: 'tpl-01',
    register: 'Wage Register',
    version: 3,
    effectiveFrom: '2026-04-01',
    status: 'active',
    note: 'FY27 minimum-wage columns per jurisdiction rule-pack update',
  },
  {
    id: 'tpl-02',
    register: 'Wage Register',
    version: 2,
    effectiveFrom: '2025-04-01',
    status: 'superseded',
    note: 'Form B layout with overtime column',
  },
  {
    id: 'tpl-03',
    register: 'Attendance Register',
    version: 2,
    effectiveFrom: '2026-01-01',
    status: 'active',
    note: 'Form D layout · added WFH marking',
  },
  {
    id: 'tpl-04',
    register: 'Attendance Register',
    version: 1,
    effectiveFrom: '2024-04-01',
    status: 'superseded',
    note: 'Initial Form D layout',
  },
  {
    id: 'tpl-05',
    register: 'Leave Register',
    version: 2,
    effectiveFrom: '2026-04-01',
    status: 'active',
    note: 'Form F layout · LOP split shown separately',
  },
  {
    id: 'tpl-06',
    register: 'PF/ESIC Format',
    version: 4,
    effectiveFrom: '2026-04-01',
    status: 'active',
    note: 'ECR 2.1 upload format per EPFO circular',
  },
]

/** Reporting periods selectable on the compliance registers. */
export const COMPLIANCE_PERIODS = [
  'June 2026',
  'March 2026',
  'December 2025',
] as const

export type CompliancePeriod = (typeof COMPLIANCE_PERIODS)[number]

const PERIOD_END: Record<CompliancePeriod, string> = {
  'June 2026': '2026-06-30',
  'March 2026': '2026-03-31',
  'December 2025': '2025-12-31',
}

/** Template version in effect for the selected period (RPT-21). */
export function templateForPeriod(
  templates: TemplateVersion[],
  register: TemplateVersion['register'],
  period: CompliancePeriod
): TemplateVersion | undefined {
  const end = PERIOD_END[period]
  return templates
    .filter(
      (t) =>
        t.register === register &&
        t.status !== 'draft' &&
        t.effectiveFrom <= end
    )
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
}
