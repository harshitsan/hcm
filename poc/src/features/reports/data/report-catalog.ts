export const COMPANIES = [
  'Aurora Software',
  'Northwind Retail',
  'Zenith Manufacturing',
  'Helios Energy',
] as const

export type Company = (typeof COMPANIES)[number]

export const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
] as const

export const LOCATIONS = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Remote',
] as const

/** Category-grouped catalog navigation (RPT-26). */
export const REPORT_CATEGORIES = [
  'Employee Management',
  'Organization Structure',
  'Recruitment',
  'Lifecycle & Exit',
  'Attendance Management',
  'Leave Management',
  'Time Management',
  'Resource Management',
  'Performance Management',
  'Training & Learning',
  'Compensation',
  'Asset & Travel',
  'Tax Planning',
  'Policy Compliance',
  'Consolidated (Portfolio / Group)',
] as const

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export interface ReportDef {
  id: string
  name: string
  category: ReportCategory
  description: string
  /** Report is also runnable by Employee (User), scoped to own records. */
  selfService: boolean
  /** Per-tenant catalog config: disabled reports are hidden (RPT-22). */
  enabled: boolean
  /**
   * Comp-dark: compensation/payroll figures are never rendered — value
   * columns show "Restricted" and employee roles cannot run the report.
   */
  comp?: boolean
  /**
   * Consolidated portfolio/group report — visible only to Portfolio Admin,
   * Group Company Admin and Platform Admin under row-level security.
   */
  consolidated?: boolean
}

const r = (
  id: string,
  name: string,
  category: ReportCategory,
  description: string,
  selfService = false
): ReportDef => ({
  id,
  name,
  category,
  description,
  selfService,
  enabled: true,
})

/** Standard report catalog — one entry per Kensium/FR-listed report. */
export const seedReportCatalog: ReportDef[] = [
  // Employee Management (RPT-02, RPT-37, RPT-42, RPT-43)
  r(
    'rep-01',
    'Workforce Headcount Report',
    'Employee Management',
    'Current employees and headcount for the applicable scope.'
  ),
  r(
    'rep-02',
    'Skills Report',
    'Employee Management',
    'Employees and their recorded skills.'
  ),
  r(
    'rep-03',
    'Qualification Report',
    'Employee Management',
    'Educational qualifications per employee.'
  ),
  r(
    'rep-04',
    'Work Experience Report',
    'Employee Management',
    'Prior and current experience per employee.'
  ),
  r(
    'rep-05',
    'Language Report',
    'Employee Management',
    'Language proficiency across the workforce.'
  ),
  r(
    'rep-06',
    'Aging Report',
    'Employee Management',
    'Age-band distribution of the workforce.'
  ),
  r(
    'rep-07',
    'Gender Report',
    'Employee Management',
    'Headcount by gender for the selected scope.'
  ),
  r(
    'rep-08',
    'Male Female Ratio Report',
    'Employee Management',
    'Ratio of male to female employees.'
  ),
  r(
    'rep-09',
    'Application Login Status Report',
    'Employee Management',
    'Login/activation status per employee, non-users shown distinctly.'
  ),
  // Organization Structure (RPT-02)
  r(
    'rep-10',
    'Organization Structure Report',
    'Organization Structure',
    'Reporting structure and hierarchy across the company.'
  ),
  // Recruitment (RPT-13)
  r(
    'rep-11',
    'Talent Acquisition Pipeline Report',
    'Recruitment',
    'Recruitment and hiring pipeline for the applicable scope.'
  ),
  // Lifecycle & Exit (RPT-13, RPT-27, RPT-28)
  r(
    'rep-12',
    'Lifecycle Workflows Report',
    'Lifecycle & Exit',
    'Status and progress of onboarding, transfer and exit workflows.'
  ),
  r(
    'rep-13',
    'Attrition Report',
    'Lifecycle & Exit',
    'Attrition rate and counts for the selected period and scope.'
  ),
  r(
    'rep-14',
    'Retention Report',
    'Lifecycle & Exit',
    'Retention metrics for the selected cohort/period.'
  ),
  r(
    'rep-15',
    'Joinee vs Exit Report',
    'Lifecycle & Exit',
    'Joiners compared against leavers over the selected period.'
  ),
  r(
    'rep-16',
    'Reason Wise Exit Report',
    'Lifecycle & Exit',
    'Exits grouped and counted by exit reason.'
  ),
  r(
    'rep-17',
    'Employee Exit Report',
    'Lifecycle & Exit',
    'Individual exiting employees and their exit details.'
  ),
  r(
    'rep-18',
    'Exit Summary Report',
    'Lifecycle & Exit',
    'Summarised view of exits for the period.'
  ),
  r(
    'rep-19',
    'Exit Questionnaire Report',
    'Lifecycle & Exit',
    'Captured exit-interview responses.'
  ),
  // Attendance Management (RPT-03, RPT-29, RPT-30, RPT-31, RPT-32)
  r(
    'rep-20',
    'Attendance Report',
    'Attendance Management',
    'Attendance records for the selected scope and period.',
    true
  ),
  r(
    'rep-21',
    'Defaulters Attendance Report',
    'Attendance Management',
    'Employees with attendance exceptions for the selected period.'
  ),
  r(
    'rep-22',
    'Attendance Status Report',
    'Attendance Management',
    'Each employee’s attendance status.'
  ),
  r(
    'rep-23',
    'Out Time Details Report',
    'Attendance Management',
    'Out-time punch details per employee.'
  ),
  r(
    'rep-24',
    'Comp Off Summary Report',
    'Attendance Management',
    'Aggregated comp-off balances and usage per employee.'
  ),
  r(
    'rep-25',
    'Comp Off Details Report',
    'Attendance Management',
    'Individual comp-off earn and redeem transactions.'
  ),
  r(
    'rep-26',
    'Over Time Summary Report',
    'Attendance Management',
    'Aggregated overtime hours per employee.'
  ),
  r(
    'rep-27',
    'Over Time Details Report',
    'Attendance Management',
    'Individual overtime entries with dates and hours.'
  ),
  r(
    'rep-28',
    'Work From Home Summary Report',
    'Attendance Management',
    'Aggregated WFH days per employee.'
  ),
  r(
    'rep-29',
    'Work From Home Details Report',
    'Attendance Management',
    'Individual WFH day records.'
  ),
  // Leave Management (RPT-03, RPT-33)
  r(
    'rep-30',
    'Leave Summary Report',
    'Leave Management',
    'Leave taken and balances for the selected period.',
    true
  ),
  r(
    'rep-31',
    'Leave Details Report',
    'Leave Management',
    'Individual leave transactions for the period.'
  ),
  r(
    'rep-32',
    'LOP Report',
    'Leave Management',
    'Loss-of-pay days per employee for the pay period.'
  ),
  r(
    'rep-33',
    'Leave Credits Report',
    'Leave Management',
    'Credited leave balances per employee.'
  ),
  r(
    'rep-34',
    'Optional Holiday Report',
    'Leave Management',
    'Optional-holiday elections and usage.'
  ),
  // Time Management (RPT-35)
  r(
    'rep-35',
    'Detailed Timesheet Report',
    'Time Management',
    'Time entries per employee, project and task.'
  ),
  r(
    'rep-36',
    'Task Wise Billing Report',
    'Time Management',
    'Billing broken down by task.'
  ),
  r(
    'rep-37',
    'Detailed Billing Report',
    'Time Management',
    'Billable amounts per project/resource.'
  ),
  r(
    'rep-38',
    'Utilization Summary Report',
    'Time Management',
    'Summarised utilization across resources for the period.'
  ),
  // Resource Management (RPT-34)
  r(
    'rep-39',
    'Bench Summary Report',
    'Resource Management',
    'Counts of benched resources summarised by unit.'
  ),
  r(
    'rep-40',
    'Detailed Bench Report',
    'Resource Management',
    'Each benched resource and their bench duration.'
  ),
  r(
    'rep-41',
    'Resource Billability Report',
    'Resource Management',
    'Billable versus non-billable status per resource.'
  ),
  r(
    'rep-42',
    'Resource Utilization Report',
    'Resource Management',
    'Utilization percentage per resource for the period.'
  ),
  // Performance Management (RPT-36)
  r(
    'rep-43',
    'Employee Performance Report',
    'Performance Management',
    'Individual performance ratings for the review period.'
  ),
  r(
    'rep-44',
    'Quadrant Rating Report',
    'Performance Management',
    'Employees distributed across the rating quadrants.'
  ),
  r(
    'rep-45',
    'Project Wise Average Performance Report',
    'Performance Management',
    'Average performance per project.'
  ),
  r(
    'rep-46',
    'Resource Quarter Wise Performance Report',
    'Performance Management',
    'Performance presented by quarter.'
  ),
  // Training & Learning (RPT-39, RPT-40)
  r(
    'rep-47',
    'Training Cost Report',
    'Training & Learning',
    'Training spend for the selected period and scope.'
  ),
  r(
    'rep-48',
    'Training Program Details Report',
    'Training & Learning',
    'Program details and participants.'
  ),
  r(
    'rep-49',
    'Trainer Details Report',
    'Training & Learning',
    'Trainers and their delivered sessions.'
  ),
  r(
    'rep-50',
    'Training Report',
    'Training & Learning',
    'Consolidated training overview.'
  ),
  r(
    'rep-51',
    'Employee Wise Certification Report',
    'Training & Learning',
    'Each employee’s certifications with current status.'
  ),
  r(
    'rep-52',
    'Certification Wise Employees Report',
    'Training & Learning',
    'Employees grouped under each certification.'
  ),
  // Compensation (RPT-38) — comp-dark: no pay figures are ever rendered.
  {
    ...r(
      'rep-53',
      'CTC Revision History Report',
      'Compensation',
      'CTC revisions with effective dates per employee.'
    ),
    comp: true,
  },
  {
    ...r(
      'rep-54',
      'Increment Report',
      'Compensation',
      'Increments granted in the selected period.'
    ),
    comp: true,
  },
  {
    ...r('rep-55', 'Bonus Report', 'Compensation', 'Bonus amounts per employee.'),
    comp: true,
  },
  {
    ...r(
      'rep-56',
      'Promotion Report',
      'Compensation',
      'Promotions with old and new designations.'
    ),
    comp: true,
  },
  // Asset & Travel (RPT-03, RPT-45, RPT-46)
  r(
    'rep-57',
    'Asset Report',
    'Asset & Travel',
    'Assets with their assignees and status.',
    true
  ),
  r(
    'rep-58',
    'Custodian Report',
    'Asset & Travel',
    'Custodians and the assets they hold.'
  ),
  r(
    'rep-59',
    'Letter Report',
    'Asset & Travel',
    'Letters issued to employees with type and date.'
  ),
  r(
    'rep-60',
    'Travel Details Report',
    'Asset & Travel',
    'Travel entries per employee with dates and purpose.',
    true
  ),
  // Tax Planning (RPT-41) — payroll-linked, so comp-dark as well.
  {
    ...r(
      'rep-61',
      'Employee Monthly TDS Report',
      'Tax Planning',
      'TDS deducted per employee for the selected month.',
      true
    ),
    comp: true,
  },
  // Policy Compliance (RPT-13)
  r(
    'rep-62',
    'Policy Compliance Report',
    'Policy Compliance',
    'Policy acknowledgement / compliance status per employee.'
  ),
  // Consolidated portfolio/group reporting (RPT-17, RPT-18) — authorised
  // roles only, always under row-level security, every run audited.
  {
    ...r(
      'rep-63',
      'Portfolio Consolidated Workforce Report',
      'Consolidated (Portfolio / Group)',
      'Headcount, movement and attrition rolled up across every company in your portfolio or group.'
    ),
    consolidated: true,
  },
  {
    ...r(
      'rep-64',
      'Group Compliance Rollup Report',
      'Consolidated (Portfolio / Group)',
      'Policy acknowledgement and statutory compliance posture per company, consolidated.'
    ),
    consolidated: true,
  },
]
