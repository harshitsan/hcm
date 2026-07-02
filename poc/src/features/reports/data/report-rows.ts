import { type Company, type ReportCategory } from './report-catalog'

/** The signed-in person used for Employee (User) self-service scoping. */
export const SELF_EMPLOYEE = 'Ananya Rao'

/**
 * Generic preview row for a standard report run. `value` is the current
 * effective value; `priorValue` is the value that was in effect before the
 * 01 Apr 2026 effective-dated change — used for as-of (bitemporal) runs
 * (RPT-19).
 */
export interface ReportRow {
  id: string
  employee: string
  company: Company
  department: string
  detail: string
  value: string
  priorValue: string
  date: string
}

/** Cut-over date for the effective-dated sample values. */
export const EFFECTIVE_CUTOVER = '2026-04-01'

const row = (
  id: string,
  employee: string,
  company: Company,
  department: string,
  detail: string,
  value: string,
  priorValue: string,
  date: string
): ReportRow => ({
  id,
  employee,
  company,
  department,
  detail,
  value,
  priorValue,
  date,
})

/** Sample dataset per catalog category, spanning all four companies. */
export const categoryRows: Record<ReportCategory, ReportRow[]> = {
  'Employee Management': [
    row(
      'em-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Skills: React, TypeScript · Active login',
      'Grade L4',
      'Grade L3',
      '2026-06-20'
    ),
    row(
      'em-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'Skills: Negotiation · Active login',
      'Grade L3',
      'Grade L3',
      '2026-06-20'
    ),
    row(
      'em-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Skills: SAP MM · No login (non-user)',
      'Grade L2',
      'Grade L2',
      '2026-06-19'
    ),
    row(
      'em-4',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Skills: PLC, SCADA · Active login',
      'Grade L5',
      'Grade L4',
      '2026-06-18'
    ),
    row(
      'em-5',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'Skills: IFRS · Active login',
      'Grade L4',
      'Grade L4',
      '2026-06-18'
    ),
  ],
  'Organization Structure': [
    row(
      'os-1',
      'Ravi Menon',
      'Aurora Software',
      'Engineering',
      'Reports to: CTO · 4 direct reports',
      'VP Engineering',
      'Director Engineering',
      '2026-06-15'
    ),
    row(
      'os-2',
      'Sunita Deshpande',
      'Northwind Retail',
      'Operations',
      'Reports to: COO · 12 direct reports',
      'Regional Head',
      'Regional Head',
      '2026-06-15'
    ),
    row(
      'os-3',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Reports to: Plant Head · 6 direct reports',
      'Lead Engineer',
      'Senior Engineer',
      '2026-06-15'
    ),
    row(
      'os-4',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'Reports to: CFO · 3 direct reports',
      'Finance Controller',
      'Finance Manager',
      '2026-06-15'
    ),
  ],
  Recruitment: [
    row(
      'rc-1',
      'Req #TA-118',
      'Aurora Software',
      'Engineering',
      'Senior Frontend Engineer · 14 applicants',
      'Offer stage',
      'Screening',
      '2026-06-22'
    ),
    row(
      'rc-2',
      'Req #TA-121',
      'Northwind Retail',
      'Sales',
      'Store Manager · 22 applicants',
      'Interviewing',
      'Sourcing',
      '2026-06-21'
    ),
    row(
      'rc-3',
      'Req #TA-124',
      'Zenith Manufacturing',
      'Operations',
      'Shift Supervisor · 8 applicants',
      'Screening',
      'Draft',
      '2026-06-20'
    ),
    row(
      'rc-4',
      'Req #TA-126',
      'Helios Energy',
      'Engineering',
      'Grid Analyst · 11 applicants',
      'Offer accepted',
      'Interviewing',
      '2026-06-19'
    ),
  ],
  'Lifecycle & Exit': [
    row(
      'lx-1',
      'Rohit Verma',
      'Aurora Software',
      'Engineering',
      'Exit · Reason: Better opportunity',
      'Exit cleared 30 Jun',
      'Notice period',
      '2026-06-30'
    ),
    row(
      'lx-2',
      'Priyanka Das',
      'Northwind Retail',
      'Sales',
      'Onboarding workflow · 8/10 steps',
      'In progress',
      'Not started',
      '2026-06-24'
    ),
    row(
      'lx-3',
      'Arjun Nair',
      'Zenith Manufacturing',
      'Operations',
      'Transfer to Pune plant',
      'Approved',
      'Requested',
      '2026-06-18'
    ),
    row(
      'lx-4',
      'Q2 Attrition',
      'Aurora Software',
      'All departments',
      'Joiners 14 vs exits 6',
      '4.1% attrition',
      '5.2% attrition',
      '2026-06-30'
    ),
    row(
      'lx-5',
      'Neha Kulkarni',
      'Helios Energy',
      'Finance',
      'Exit questionnaire submitted',
      'Compensation cited',
      'Pending',
      '2026-06-12'
    ),
  ],
  'Attendance Management': [
    row(
      'at-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Jun attendance · 1 late punch, OT 4h',
      '21/22 days',
      '20/22 days',
      '2026-06-30'
    ),
    row(
      'at-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'Jun attendance · defaulter (3 missed punches)',
      '17/22 days',
      '19/22 days',
      '2026-06-30'
    ),
    row(
      'at-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Jun attendance · comp-off earned 1',
      '22/22 days',
      '22/22 days',
      '2026-06-30'
    ),
    row(
      'at-4',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Jun attendance · WFH 6 days, OT 9h',
      '20/22 days',
      '21/22 days',
      '2026-06-30'
    ),
    row(
      'at-5',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'Jun attendance · out-time avg 18:42',
      '22/22 days',
      '21/22 days',
      '2026-06-30'
    ),
  ],
  'Leave Management': [
    row(
      'lv-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Earned leave taken 2 · balance 11.5',
      '0 LOP days',
      '1 LOP day',
      '2026-06-30'
    ),
    row(
      'lv-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'Sick leave taken 1 · optional holiday used',
      '1 LOP day',
      '0 LOP days',
      '2026-06-30'
    ),
    row(
      'lv-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Leave credits Jul: EL 1.5, CL 1',
      'Balance 14',
      'Balance 12.5',
      '2026-07-01'
    ),
    row(
      'lv-4',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Earned leave taken 4 · balance 6',
      '0 LOP days',
      '0 LOP days',
      '2026-06-30'
    ),
  ],
  'Time Management': [
    row(
      'tm-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Project Atlas · task: checkout revamp',
      '164h logged / 152h billed',
      '148h logged / 140h billed',
      '2026-06-30'
    ),
    row(
      'tm-2',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Project Forge · task: line automation',
      '158h logged / 158h billed',
      '150h logged / 150h billed',
      '2026-06-30'
    ),
    row(
      'tm-3',
      'Priyanka Das',
      'Northwind Retail',
      'Sales',
      'Project Storefront · task: POS rollout',
      '140h logged / 96h billed',
      '132h logged / 90h billed',
      '2026-06-30'
    ),
    row(
      'tm-4',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'Project Ledger · task: close automation',
      '120h logged / 0h billed',
      '112h logged / 0h billed',
      '2026-06-30'
    ),
  ],
  'Resource Management': [
    row(
      'rm-1',
      'Karthik Reddy',
      'Aurora Software',
      'Engineering',
      'On bench 24 days · last project Atlas',
      'Non-billable',
      'Billable',
      '2026-06-27'
    ),
    row(
      'rm-2',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Allocated to Project Atlas',
      '92% utilization',
      '84% utilization',
      '2026-06-30'
    ),
    row(
      'rm-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Allocated to Storefront',
      '78% utilization',
      '81% utilization',
      '2026-06-30'
    ),
    row(
      'rm-4',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Allocated to Forge',
      '100% utilization · billable',
      '95% utilization',
      '2026-06-30'
    ),
  ],
  'Performance Management': [
    row(
      'pf-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'FY26 Q1 review · quadrant: Star',
      '4.6 / 5',
      '4.2 / 5',
      '2026-04-15'
    ),
    row(
      'pf-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'FY26 Q1 review · quadrant: Core',
      '3.8 / 5',
      '3.9 / 5',
      '2026-04-15'
    ),
    row(
      'pf-3',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'FY26 Q1 review · quadrant: Star',
      '4.4 / 5',
      '4.4 / 5',
      '2026-04-15'
    ),
    row(
      'pf-4',
      'Project Atlas',
      'Aurora Software',
      'Engineering',
      'Project-wise average performance',
      '4.1 / 5',
      '3.9 / 5',
      '2026-04-15'
    ),
  ],
  'Training & Learning': [
    row(
      'tl-1',
      'Advanced React Workshop',
      'Aurora Software',
      'Engineering',
      'Trainer: S. Bhat · 18 participants',
      '₹2.4L cost',
      '₹2.1L cost',
      '2026-05-20'
    ),
    row(
      'tl-2',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Certification: AWS SA Associate',
      'Valid till Mar 2028',
      'In progress',
      '2026-06-01'
    ),
    row(
      'tl-3',
      'Safety & Compliance Training',
      'Zenith Manufacturing',
      'Operations',
      'Trainer: R. Gupta · 42 participants',
      '₹1.1L cost',
      '₹1.1L cost',
      '2026-05-12'
    ),
    row(
      'tl-4',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Certification: Six Sigma Green Belt',
      'Valid till Jan 2027',
      'Valid till Jan 2027',
      '2026-06-01'
    ),
  ],
  Compensation: [
    row(
      'cp-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'CTC revision · increment cycle FY27',
      '₹28.5L (eff 01 Apr 26)',
      '₹24.0L',
      '2026-04-01'
    ),
    row(
      'cp-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'Bonus · FY26 performance payout',
      '₹1.8L bonus',
      '₹1.5L bonus',
      '2026-04-30'
    ),
    row(
      'cp-3',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Promotion: Senior Engineer → Lead Engineer',
      'Lead Engineer',
      'Senior Engineer',
      '2026-04-01'
    ),
    row(
      'cp-4',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'CTC revision · market correction',
      '₹32.0L (eff 01 Apr 26)',
      '₹29.5L',
      '2026-04-01'
    ),
  ],
  'Asset & Travel': [
    row(
      'as-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'MacBook Pro 14" · AST-0451 · custodian: IT',
      'Assigned',
      'In stock',
      '2026-02-11'
    ),
    row(
      'as-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'Travel: Mumbai client visit, 3 days',
      '₹42,300 claimed',
      'Pending approval',
      '2026-06-10'
    ),
    row(
      'as-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Zebra scanner · AST-0722',
      'Assigned',
      'Assigned',
      '2026-01-20'
    ),
    row(
      'as-4',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'Letter issued: Promotion letter',
      'Issued 05 Apr 26',
      'Draft',
      '2026-04-05'
    ),
  ],
  'Tax Planning': [
    row(
      'tx-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'TDS deducted · June 2026 payroll',
      '₹18,420',
      '₹14,900',
      '2026-06-30'
    ),
    row(
      'tx-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'TDS deducted · June 2026 payroll',
      '₹11,050',
      '₹10,800',
      '2026-06-30'
    ),
    row(
      'tx-3',
      'Daniel Chen',
      'Zenith Manufacturing',
      'Engineering',
      'TDS deducted · June 2026 payroll',
      '₹21,700',
      '₹19,300',
      '2026-06-30'
    ),
    row(
      'tx-4',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'TDS deducted · June 2026 payroll',
      '₹26,140',
      '₹24,600',
      '2026-06-30'
    ),
  ],
  'Policy Compliance': [
    row(
      'pc-1',
      'Ananya Rao',
      'Aurora Software',
      'Engineering',
      'Code of Conduct v3',
      'Acknowledged',
      'Pending',
      '2026-05-02'
    ),
    row(
      'pc-2',
      'Vikram Shetty',
      'Aurora Software',
      'Sales',
      'POSH Policy 2026',
      'Pending',
      'Pending',
      '2026-06-01'
    ),
    row(
      'pc-3',
      'Meera Iyer',
      'Northwind Retail',
      'Operations',
      'Code of Conduct v3',
      'Acknowledged (on paper — non-user)',
      'Pending',
      '2026-05-10'
    ),
    row(
      'pc-4',
      'Fatima Khan',
      'Helios Energy',
      'Finance',
      'Data Privacy Policy v2',
      'Acknowledged',
      'Acknowledged',
      '2026-04-22'
    ),
  ],
}
