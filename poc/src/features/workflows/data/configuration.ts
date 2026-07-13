/**
 * Central Configuration hub (CFG-01, CFG-02, CFG-08).
 * Mirrors the Kensium HR Configuration screen: a registry of setup areas
 * grouped by domain, plus the org-level settings (Localization, Head Office)
 * and the integration/alert connections that previously existed only as
 * engine-catalog artifacts.
 */

export const CONFIG_GROUPS = [
  'Organization',
  'Employee Management',
  'Time & Attendance',
  'Leave',
  'Payroll & Finance',
  'Recruitment',
  'Integrations & Alerts',
  'Security & Access',
] as const

export type ConfigGroup = (typeof CONFIG_GROUPS)[number]

/** One entry in the hub registry — a setup area an admin can jump to. */
export interface ConfigArea {
  id: string
  group: ConfigGroup
  name: string
  description: string
  /** Team or role that owns this setup area. */
  owner: string
  enabled: boolean
  updatedBy: string
  updatedAt: string
}

export const seedConfigAreas: ConfigArea[] = [
  {
    id: 'ca-01',
    group: 'Organization',
    name: 'Localization',
    description: 'Languages, time zones, currencies and date formats per region.',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-02',
  },
  {
    id: 'ca-02',
    group: 'Organization',
    name: 'Head Office',
    description: 'Head-office organization: name, type, industry and location.',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-02',
  },
  {
    id: 'ca-03',
    group: 'Organization',
    name: 'Locations',
    description: 'Work locations and site records (managed in the Locations module).',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-18',
  },
  {
    id: 'ca-04',
    group: 'Organization',
    name: 'Departments',
    description: 'Department tree and cost-centre mapping (Departments module).',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-18',
  },
  {
    id: 'ca-05',
    group: 'Organization',
    name: 'Roles',
    description: 'Job roles and grades (Roles & Security module).',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-18',
  },
  {
    id: 'ca-06',
    group: 'Employee Management',
    name: 'Acknowledgement Terms',
    description: 'Policy acknowledgement texts employees sign on joining.',
    owner: 'HR Compliance',
    enabled: true,
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-03-11',
  },
  {
    id: 'ca-07',
    group: 'Time & Attendance',
    name: 'Attendance Rules',
    description: 'Late-mark, half-day and regularization rules (Classic admin → flows).',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'David Kim',
    updatedAt: '2026-06-02',
  },
  {
    id: 'ca-08',
    group: 'Leave',
    name: 'Leave Types & Policies',
    description: 'Leave types, accrual and carry-forward policies (Leave module).',
    owner: 'HR Operations',
    enabled: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-02-24',
  },
  {
    id: 'ca-09',
    group: 'Payroll & Finance',
    name: 'Pay Groups & Cutoffs',
    description: 'Payroll periods, cutoff days and pay-group assignment.',
    owner: 'Finance',
    enabled: true,
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-01-30',
  },
  {
    id: 'ca-10',
    group: 'Recruitment',
    name: 'Requisition Settings',
    description: 'Job requisition templates and approval defaults (Recruitment module).',
    owner: 'Talent Acquisition',
    enabled: true,
    updatedBy: 'Meera Iyer',
    updatedAt: '2026-05-19',
  },
  {
    id: 'ca-11',
    group: 'Integrations & Alerts',
    name: 'Acumatica Integration',
    description: 'ERP sync for employees, cost centres and GL export.',
    owner: 'IT / Platform',
    enabled: true,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
  {
    id: 'ca-12',
    group: 'Integrations & Alerts',
    name: 'Wrike Integration',
    description: 'Project and timesheet-task sync with Wrike.',
    owner: 'IT / Platform',
    enabled: false,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
  {
    id: 'ca-13',
    group: 'Integrations & Alerts',
    name: 'Configure Alerts',
    description: 'System alert rules — events, channels and recipients.',
    owner: 'IT / Platform',
    enabled: true,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
  {
    id: 'ca-14',
    group: 'Security & Access',
    name: 'Roles & Permissions',
    description: 'Access roles and permission matrices (Roles & Security module).',
    owner: 'IT / Platform',
    enabled: true,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-04-01',
  },
]

/* ------------------------- Organization settings ------------------------- */

/** Month the financial year begins on — drives payroll periods and tax slabs. */
export const FISCAL_YEAR_MONTHS = [
  'January',
  'April',
  'July',
  'October',
] as const

/** Regional localization pack (CFG-02). */
export interface LocalizationSetting {
  id: string
  name: string
  /** Full language label, e.g. "English (India) · en-IN". */
  language: string
  timezone: string
  currency: string
  dateFormat: string
  /** Digit grouping + decimal style, e.g. "12,34,567.89 (Indian)". */
  numberFormat: string
  /** Month the financial year starts — one of FISCAL_YEAR_MONTHS. */
  fiscalYearStart: (typeof FISCAL_YEAR_MONTHS)[number]
  isDefault: boolean
  updatedBy: string
  updatedAt: string
}

export const seedLocalizations: LocalizationSetting[] = [
  {
    id: 'loc-01',
    name: 'India — English',
    language: 'English (India) · en-IN',
    timezone: '(UTC+05:30) Asia/Kolkata — IST',
    currency: 'Indian Rupee (INR ₹)',
    dateFormat: 'DD-MM-YYYY (31-03-2026)',
    numberFormat: '12,34,567.89 (Indian lakh/crore)',
    fiscalYearStart: 'April',
    isDefault: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-02',
  },
  {
    id: 'loc-02',
    name: 'United States — English',
    language: 'English (United States) · en-US',
    timezone: '(UTC-05:00) America/New_York — ET',
    currency: 'US Dollar (USD $)',
    dateFormat: 'MM/DD/YYYY (03/31/2026)',
    numberFormat: '1,234,567.89 (Western thousands)',
    fiscalYearStart: 'January',
    isDefault: false,
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-03-27',
  },
  {
    id: 'loc-03',
    name: 'UAE — English',
    language: 'English (United Arab Emirates) · en-AE',
    timezone: '(UTC+04:00) Asia/Dubai — GST',
    currency: 'UAE Dirham (AED د.إ)',
    dateFormat: 'DD/MM/YYYY (31/03/2026)',
    numberFormat: '1,234,567.89 (Western thousands)',
    fiscalYearStart: 'January',
    isDefault: false,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-02-14',
  },
  {
    id: 'loc-04',
    name: 'United Kingdom — English',
    language: 'English (United Kingdom) · en-GB',
    timezone: '(UTC+00:00) Europe/London — GMT/BST',
    currency: 'Pound Sterling (GBP £)',
    dateFormat: 'DD/MM/YYYY (31/03/2026)',
    numberFormat: '1,234,567.89 (Western thousands)',
    fiscalYearStart: 'April',
    isDefault: false,
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-01-16',
  },
]

export const OFFICE_TYPES = [
  'Head Office',
  'Regional Office',
  'Registered Office',
] as const

/** Head-office organization record (CFG-02, Kensium Organization screen). */
export interface HeadOffice {
  id: string
  name: string
  type: (typeof OFFICE_TYPES)[number]
  industry: string
  location: string
  isPrimary: boolean
  updatedBy: string
  updatedAt: string
}

export const seedHeadOffices: HeadOffice[] = [
  {
    id: 'ho-01',
    name: 'Aurora Foods HQ',
    type: 'Head Office',
    industry: 'Food & Beverage Manufacturing',
    location: 'Hyderabad',
    isPrimary: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-02',
  },
  {
    id: 'ho-02',
    name: 'Aurora Foods — South Plants Office',
    type: 'Regional Office',
    industry: 'Food & Beverage Manufacturing',
    location: 'Chennai',
    isPrimary: false,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-09',
  },
  {
    id: 'ho-03',
    name: 'Aurora Foods — West Sales Office',
    type: 'Regional Office',
    industry: 'FMCG Distribution',
    location: 'Pune',
    isPrimary: false,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-09',
  },
]

/* ------------------------- Integrations & alerts ------------------------- */

export const INTEGRATION_SYSTEMS = ['Acumatica', 'Wrike', 'Custom'] as const

export const SYNC_FREQUENCIES = [
  'Every 15 min',
  'Hourly',
  'Daily',
  'Weekly',
  'Manual',
] as const

/** External-system connection (CFG-08). */
export interface IntegrationConnection {
  id: string
  name: string
  system: (typeof INTEGRATION_SYSTEMS)[number]
  endpoint: string
  syncEntities: string
  syncFrequency: (typeof SYNC_FREQUENCIES)[number]
  enabled: boolean
  lastSyncAt: string
  updatedBy: string
  updatedAt: string
}

export const seedIntegrations: IntegrationConnection[] = [
  {
    id: 'int-01',
    name: 'Acumatica ERP — Production',
    system: 'Acumatica',
    endpoint: 'https://erp.aurorafoods.example/entity',
    syncEntities: 'Employees, Cost centres, GL export',
    syncFrequency: 'Hourly',
    enabled: true,
    lastSyncAt: '2026-06-27 09:00',
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
  {
    id: 'int-02',
    name: 'Wrike — Project Workspace',
    system: 'Wrike',
    endpoint: 'https://www.wrike.com/api/v4',
    syncEntities: 'Projects, Timesheet tasks',
    syncFrequency: 'Daily',
    enabled: false,
    lastSyncAt: '2026-06-20 18:30',
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
]

export const ALERT_CHANNELS = ['Email', 'SMS', 'In-app'] as const

/** System alert rule (CFG-08 — Configure Alerts). */
export interface AlertRule {
  id: string
  name: string
  event: string
  channels: string[]
  recipients: string
  enabled: boolean
  updatedBy: string
  updatedAt: string
}

export const seedAlertRules: AlertRule[] = [
  {
    id: 'al-01',
    name: 'Approval pending reminder',
    event: 'Approval pending > 48 business hours',
    channels: ['Email', 'In-app'],
    recipients: 'Current approver',
    enabled: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-22',
  },
  {
    id: 'al-02',
    name: 'Integration sync failure',
    event: 'Any integration sync fails twice in a row',
    channels: ['Email'],
    recipients: 'System administrators',
    enabled: true,
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-10',
  },
  {
    id: 'al-03',
    name: 'Probation ending',
    event: 'Probation ends within 7 days',
    channels: ['Email', 'In-app'],
    recipients: 'HR team, Reporting manager',
    enabled: true,
    updatedBy: 'Priya Menon',
    updatedAt: '2026-04-15',
  },
]
