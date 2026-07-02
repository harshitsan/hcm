/**
 * SatelliteHR POC — Companies module domain model + seed data.
 * Frontend-only: all records live in memory and reset on reload.
 */

export const COMPANY_STATUSES = [
  'draft',
  'active',
  'suspended',
  'inactive',
  'archived',
  'cancelled',
] as const
export type CompanyStatus = (typeof COMPANY_STATUSES)[number]

/** COMP-FR-010 lifecycle state machine — the only legal transitions. */
export const STATUS_TRANSITIONS: Record<CompanyStatus, CompanyStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['suspended', 'inactive'],
  suspended: ['active', 'inactive'],
  inactive: ['archived'],
  archived: [],
  cancelled: [],
}

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
  archived: 'Archived',
  cancelled: 'Cancelled',
}

export function statusLabel(status: CompanyStatus): string {
  return STATUS_LABELS[status]
}

export const OPERATING_MODELS = [
  'Standalone',
  'Group Company',
  'Shared Services',
] as const
export type OperatingModel = (typeof OPERATING_MODELS)[number]

export const REGISTRATION_TYPES = [
  'GST Number (India)',
  'EIN (USA)',
  'Company Registration Number (UK)',
  'Custom',
] as const
export type RegistrationType = (typeof REGISTRATION_TYPES)[number]

export const SUBSCRIPTION_TIERS = ['Basic', 'Standard', 'Enterprise'] as const
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

export const SUPPORTED_JURISDICTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Singapore',
  'Germany',
  'United Arab Emirates',
  'Australia',
  'Canada',
] as const

/** Selectable in forms but rejected with COMP_002 — demoes jurisdiction validation. */
export const UNSUPPORTED_JURISDICTIONS = [
  'North Korea (unsupported)',
  'Antarctica (unsupported)',
] as const

export const BASE_CURRENCIES = [
  'INR',
  'USD',
  'GBP',
  'SGD',
  'EUR',
  'AED',
  'AUD',
  'CAD',
] as const

export const TIME_ZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'Europe/London',
  'Asia/Singapore',
  'Europe/Berlin',
  'Asia/Dubai',
  'Australia/Sydney',
] as const

export const LANGUAGES = ['en', 'hi', 'de', 'fr', 'ar'] as const

export const MODULES = [
  'Core HR',
  'Payroll',
  'Time & Attendance',
  'Leave',
  'Recruitment',
  'Performance',
  'Benefits',
  'Compliance',
] as const
export type ModuleName = (typeof MODULES)[number]

export interface CompanyJurisdiction {
  id: string
  jurisdiction: string
  isPrimary: boolean
  effectiveDate: string
  expiryDate: string | null
  /** Employees assigned in this jurisdiction — blocks removal when > 0 (COMP-FR-008). */
  employeeCount: number
}

/** Per-tenant governed configuration; null = inherit the platform default. */
export interface CompanyConfig {
  version: number
  authMethods: {
    saml: boolean
    ad: boolean
    o365: boolean
    google: boolean
    local: boolean
  } | null
  mfaRequired: boolean | null
  passwordPolicy: string | null
  sessionTimeoutMins: number | null
  dateFormat: string | null
  numberFormat: string | null
  currencyDisplay: string | null
  emailTemplate: string | null
  senderEmail: string | null
  approvalHierarchy: string | null
  slaHours: number | null
  /** Versioned, effective-dated module toggles (COMP §3.1.4 / FR 6.2.5 L2). */
  modules: Record<ModuleName, boolean>
  modulesVersion: number
  modulesEffectiveDate: string
}

export const PLATFORM_DEFAULTS = {
  authMethods: { saml: false, ad: false, o365: true, google: true, local: true },
  mfaRequired: false,
  passwordPolicy: 'Min 8 chars, 1 uppercase, 1 number',
  sessionTimeoutMins: 30,
  dateFormat: 'DD MMM YYYY',
  numberFormat: '1,234,567.89',
  currencyDisplay: 'Symbol (₹, $, £)',
  emailTemplate: 'SatelliteHR Standard',
  senderEmail: 'no-reply@satellitehr.com',
  approvalHierarchy: 'Manager → HR → Admin',
  slaHours: 48,
} as const

export interface Company {
  id: string
  /** System-generated COMP-{YYYY}-{NNNN}; non-editable (COMP-FR-007). */
  code: string
  legalName: string
  tradeName: string
  website: string
  registrationType: RegistrationType
  registrationNumber: string
  incorporationDate: string | null
  primaryEmail: string
  primaryPhone: string
  primaryAddress: string
  billingAddress: string
  jurisdictions: CompanyJurisdiction[]
  baseCurrency: string
  /** Locked once the first transaction has occurred (COMP-FR-008). */
  baseCurrencyLocked: boolean
  timeZone: string
  language: string
  logoUrl: string | null
  primaryColor: string | null
  operatingModel: OperatingModel
  groupId: string | null
  /** Shared-services provider assignment (portfolio); null = unassigned. */
  portfolioId: string | null
  status: CompanyStatus
  employeeCount: number
  employeeLimit: number
  subscriptionTier: SubscriptionTier
  packageId: string
  adminEmail: string | null
  createdAt: string
  /** Set on inactivation: 7-year retention window end. */
  retentionEndsOn: string | null
  /** Monthly archival fee billed while retained (FR 6.2.6). */
  archivalFeeMonthly: number | null
  config: CompanyConfig
}

/** Persona anchors used by role-scoped views. */
export const MY_COMPANY_ID = 'c-03'
export const MY_GROUP_ID = 'grp-01'
export const MY_PORTFOLIO_ID = 'pf-01'

const defaultModules = (
  on: ModuleName[]
): Record<ModuleName, boolean> =>
  MODULES.reduce(
    (acc, m) => {
      acc[m] = on.includes(m)
      return acc
    },
    {} as Record<ModuleName, boolean>
  )

/** Fresh tenant configuration — everything inherits platform defaults. */
export const defaultCompanyConfig = (on: ModuleName[]): CompanyConfig =>
  baseConfig(on)

const baseConfig = (on: ModuleName[]): CompanyConfig => ({
  version: 1,
  authMethods: null,
  mfaRequired: null,
  passwordPolicy: null,
  sessionTimeoutMins: null,
  dateFormat: null,
  numberFormat: null,
  currencyDisplay: null,
  emailTemplate: null,
  senderEmail: null,
  approvalHierarchy: null,
  slaHours: null,
  modules: defaultModules(on),
  modulesVersion: 1,
  modulesEffectiveDate: '2025-01-01',
})

const jur = (
  id: string,
  jurisdiction: string,
  isPrimary: boolean,
  effectiveDate: string,
  employeeCount: number,
  expiryDate: string | null = null
): CompanyJurisdiction => ({
  id,
  jurisdiction,
  isPrimary,
  effectiveDate,
  expiryDate,
  employeeCount,
})

export const seedCompanies: Company[] = [
  {
    id: 'c-01',
    code: 'COMP-2023-0001',
    legalName: 'Meridian Technologies Private Limited',
    tradeName: 'Meridian Tech',
    website: 'https://meridiantech.in',
    registrationType: 'GST Number (India)',
    registrationNumber: '29AABCM9012D1Z4',
    incorporationDate: '2011-04-12',
    primaryEmail: 'ops@meridiantech.in',
    primaryPhone: '+91 80 4123 5500',
    primaryAddress: '4th Floor, Prestige Towers, MG Road, Bengaluru 560001',
    billingAddress: 'PO Box 2201, Bengaluru 560001',
    jurisdictions: [
      jur('j-0101', 'India', true, '2023-01-15', 812),
      jur('j-0102', 'Singapore', false, '2024-03-01', 46),
    ],
    baseCurrency: 'INR',
    baseCurrencyLocked: true,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: '#1D4ED8',
    operatingModel: 'Group Company',
    groupId: 'grp-01',
    portfolioId: null,
    status: 'active',
    employeeCount: 858,
    employeeLimit: 1000,
    subscriptionTier: 'Enterprise',
    packageId: 'pkg-ent',
    adminEmail: 'admin@meridiantech.in',
    createdAt: '2023-01-15',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: {
      ...baseConfig([
        'Core HR',
        'Payroll',
        'Time & Attendance',
        'Leave',
        'Recruitment',
        'Performance',
        'Benefits',
        'Compliance',
      ]),
      mfaRequired: true,
      sessionTimeoutMins: 15,
      version: 4,
    },
  },
  {
    id: 'c-02',
    code: 'COMP-2023-0002',
    legalName: 'Meridian Digital Services Limited',
    tradeName: 'Meridian Digital',
    website: 'https://meridiandigital.co.uk',
    registrationType: 'Company Registration Number (UK)',
    registrationNumber: '09876543',
    incorporationDate: '2015-09-30',
    primaryEmail: 'hr@meridiandigital.co.uk',
    primaryPhone: '+44 20 7946 0301',
    primaryAddress: '18 Finsbury Square, London EC2A 1AH',
    billingAddress: '18 Finsbury Square, London EC2A 1AH',
    jurisdictions: [jur('j-0201', 'United Kingdom', true, '2023-02-01', 194)],
    baseCurrency: 'GBP',
    baseCurrencyLocked: true,
    timeZone: 'Europe/London',
    language: 'en',
    logoUrl: null,
    primaryColor: '#0F766E',
    operatingModel: 'Group Company',
    groupId: 'grp-01',
    portfolioId: null,
    status: 'active',
    employeeCount: 194,
    employeeLimit: 250,
    subscriptionTier: 'Standard',
    packageId: 'pkg-std',
    adminEmail: 'admin@meridiandigital.co.uk',
    createdAt: '2023-02-01',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Payroll', 'Leave', 'Performance']),
  },
  {
    id: 'c-03',
    code: 'COMP-2024-0001',
    legalName: 'Bluegrain Foods Private Limited',
    tradeName: 'Bluegrain',
    website: 'https://bluegrainfoods.in',
    registrationType: 'GST Number (India)',
    registrationNumber: '27AAFCB2345G1Z9',
    incorporationDate: '2008-06-20',
    primaryEmail: 'people@bluegrainfoods.in',
    primaryPhone: '+91 22 6742 8800',
    primaryAddress: 'Bluegrain House, Lower Parel, Mumbai 400013',
    billingAddress: 'Accounts Dept, Bluegrain House, Mumbai 400013',
    jurisdictions: [
      jur('j-0301', 'India', true, '2024-01-10', 431),
      jur('j-0302', 'United Arab Emirates', false, '2025-04-01', 0),
    ],
    baseCurrency: 'INR',
    baseCurrencyLocked: true,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: '#B45309',
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'active',
    employeeCount: 431,
    employeeLimit: 500,
    subscriptionTier: 'Standard',
    packageId: 'pkg-std',
    adminEmail: 'admin@bluegrainfoods.in',
    createdAt: '2024-01-10',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: {
      ...baseConfig(['Core HR', 'Payroll', 'Leave', 'Time & Attendance']),
      dateFormat: 'DD/MM/YYYY',
      version: 2,
    },
  },
  {
    id: 'c-04',
    code: 'COMP-2024-0002',
    legalName: 'Northwind Logistics Inc.',
    tradeName: 'Northwind',
    website: 'https://northwindlogistics.com',
    registrationType: 'EIN (USA)',
    registrationNumber: '84-1234567',
    incorporationDate: '2012-03-05',
    primaryEmail: 'hrops@northwindlogistics.com',
    primaryPhone: '+1 312 555 0148',
    primaryAddress: '2200 W Fulton St, Chicago, IL 60612',
    billingAddress: 'PO Box 8801, Chicago, IL 60680',
    jurisdictions: [
      jur('j-0401', 'United States', true, '2024-02-20', 356),
      jur('j-0402', 'Canada', false, '2025-01-15', 38),
    ],
    baseCurrency: 'USD',
    baseCurrencyLocked: true,
    timeZone: 'America/Chicago',
    language: 'en',
    logoUrl: null,
    primaryColor: '#334155',
    operatingModel: 'Shared Services',
    groupId: null,
    portfolioId: 'pf-01',
    status: 'active',
    employeeCount: 394,
    employeeLimit: 400,
    subscriptionTier: 'Standard',
    packageId: 'pkg-std',
    adminEmail: 'admin@northwindlogistics.com',
    createdAt: '2024-02-20',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Payroll', 'Time & Attendance', 'Benefits']),
  },
  {
    id: 'c-05',
    code: 'COMP-2024-0003',
    legalName: 'Aurelia Wellness LLP',
    tradeName: 'Aurelia',
    website: 'https://aurelia.health',
    registrationType: 'GST Number (India)',
    registrationNumber: '07AAGFA8765K1Z2',
    incorporationDate: '2018-11-11',
    primaryEmail: 'contact@aurelia.health',
    primaryPhone: '+91 11 4890 3322',
    primaryAddress: 'A-14 Connaught Place, New Delhi 110001',
    billingAddress: 'A-14 Connaught Place, New Delhi 110001',
    jurisdictions: [jur('j-0501', 'India', true, '2024-05-02', 74)],
    baseCurrency: 'INR',
    baseCurrencyLocked: false,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Shared Services',
    groupId: null,
    portfolioId: 'pf-01',
    status: 'suspended',
    employeeCount: 74,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: 'admin@aurelia.health',
    createdAt: '2024-05-02',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Leave']),
  },
  {
    id: 'c-06',
    code: 'COMP-2024-0004',
    legalName: 'Halcyon Textiles GmbH',
    tradeName: 'Halcyon',
    website: 'https://halcyon-textiles.de',
    registrationType: 'Custom',
    registrationNumber: 'HRB 112 233 B',
    incorporationDate: '2005-02-14',
    primaryEmail: 'personal@halcyon-textiles.de',
    primaryPhone: '+49 30 2887 6600',
    primaryAddress: 'Torstraße 140, 10119 Berlin',
    billingAddress: 'Torstraße 140, 10119 Berlin',
    jurisdictions: [jur('j-0601', 'Germany', true, '2024-07-18', 128)],
    baseCurrency: 'EUR',
    baseCurrencyLocked: true,
    timeZone: 'Europe/Berlin',
    language: 'de',
    logoUrl: null,
    primaryColor: '#7C3AED',
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'active',
    employeeCount: 128,
    employeeLimit: 250,
    subscriptionTier: 'Standard',
    packageId: 'pkg-std',
    adminEmail: 'admin@halcyon-textiles.de',
    createdAt: '2024-07-18',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Payroll', 'Leave', 'Compliance']),
  },
  {
    id: 'c-07',
    code: 'COMP-2025-0001',
    legalName: 'Meridian Robotics Private Limited',
    tradeName: 'Meridian Robotics',
    website: 'https://meridianrobotics.in',
    registrationType: 'GST Number (India)',
    registrationNumber: '29AABCM4455E1Z1',
    incorporationDate: '2021-08-09',
    primaryEmail: 'hello@meridianrobotics.in',
    primaryPhone: '+91 80 4990 1200',
    primaryAddress: 'Plot 12, Electronic City Phase 1, Bengaluru 560100',
    billingAddress: 'Plot 12, Electronic City Phase 1, Bengaluru 560100',
    jurisdictions: [jur('j-0701', 'India', true, '2025-01-05', 92)],
    baseCurrency: 'INR',
    baseCurrencyLocked: false,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: '#DC2626',
    operatingModel: 'Group Company',
    groupId: 'grp-01',
    portfolioId: null,
    status: 'active',
    employeeCount: 92,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: 'admin@meridianrobotics.in',
    createdAt: '2025-01-05',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Leave', 'Recruitment']),
  },
  {
    id: 'c-08',
    code: 'COMP-2025-0002',
    legalName: 'Cobalt Marine Services Pte. Ltd.',
    tradeName: 'Cobalt Marine',
    website: 'https://cobaltmarine.sg',
    registrationType: 'Custom',
    registrationNumber: '202512345K',
    incorporationDate: '2019-05-27',
    primaryEmail: 'crew@cobaltmarine.sg',
    primaryPhone: '+65 6011 8890',
    primaryAddress: '9 Temasek Boulevard, Suntec Tower 2, Singapore 038989',
    billingAddress: '9 Temasek Boulevard, Suntec Tower 2, Singapore 038989',
    jurisdictions: [jur('j-0801', 'Singapore', true, '2025-03-12', 61)],
    baseCurrency: 'SGD',
    baseCurrencyLocked: false,
    timeZone: 'Asia/Singapore',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Shared Services',
    groupId: null,
    portfolioId: 'pf-02',
    status: 'active',
    employeeCount: 61,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: 'admin@cobaltmarine.sg',
    createdAt: '2025-03-12',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR', 'Payroll']),
  },
  {
    id: 'c-09',
    code: 'COMP-2022-0006',
    legalName: 'Sable & Frost Consulting Ltd.',
    tradeName: 'Sable & Frost',
    website: 'https://sablefrost.co.uk',
    registrationType: 'Company Registration Number (UK)',
    registrationNumber: '07654321',
    incorporationDate: '2009-10-02',
    primaryEmail: 'records@sablefrost.co.uk',
    primaryPhone: '+44 161 496 0022',
    primaryAddress: '2 St Peter’s Square, Manchester M2 3AA',
    billingAddress: '2 St Peter’s Square, Manchester M2 3AA',
    jurisdictions: [jur('j-0901', 'United Kingdom', true, '2022-06-01', 0)],
    baseCurrency: 'GBP',
    baseCurrencyLocked: true,
    timeZone: 'Europe/London',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'inactive',
    employeeCount: 0,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: 'admin@sablefrost.co.uk',
    createdAt: '2022-06-01',
    retentionEndsOn: '2032-11-30',
    archivalFeeMonthly: 120,
    config: baseConfig(['Core HR']),
  },
  {
    id: 'c-10',
    code: 'COMP-2021-0004',
    legalName: 'Verdant Agro Exports Private Limited',
    tradeName: 'Verdant Agro',
    website: 'https://verdantagro.in',
    registrationType: 'GST Number (India)',
    registrationNumber: '36AAHCV6789L1Z7',
    incorporationDate: '2001-01-25',
    primaryEmail: 'legacy@verdantagro.in',
    primaryPhone: '+91 40 2789 4411',
    primaryAddress: 'Survey 88, Genome Valley, Hyderabad 500078',
    billingAddress: 'Survey 88, Genome Valley, Hyderabad 500078',
    jurisdictions: [jur('j-1001', 'India', true, '2021-04-15', 0)],
    baseCurrency: 'INR',
    baseCurrencyLocked: true,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'inactive',
    employeeCount: 0,
    employeeLimit: 250,
    subscriptionTier: 'Standard',
    packageId: 'pkg-std',
    adminEmail: 'admin@verdantagro.in',
    createdAt: '2021-04-15',
    retentionEndsOn: '2033-02-28',
    archivalFeeMonthly: 180,
    config: baseConfig(['Core HR', 'Payroll']),
  },
  {
    id: 'c-11',
    code: 'COMP-2019-0002',
    legalName: 'Ostara Media Works LLC',
    tradeName: 'Ostara',
    website: 'https://ostaramedia.com',
    registrationType: 'EIN (USA)',
    registrationNumber: '61-7654321',
    incorporationDate: '2010-07-19',
    primaryEmail: 'archive@ostaramedia.com',
    primaryPhone: '+1 646 555 0117',
    primaryAddress: '285 Madison Ave, New York, NY 10017',
    billingAddress: '285 Madison Ave, New York, NY 10017',
    jurisdictions: [jur('j-1101', 'United States', true, '2019-02-11', 0)],
    baseCurrency: 'USD',
    baseCurrencyLocked: true,
    timeZone: 'America/New_York',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'archived',
    employeeCount: 0,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: null,
    createdAt: '2019-02-11',
    retentionEndsOn: '2026-03-31',
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR']),
  },
  {
    id: 'c-12',
    code: 'COMP-2026-0001',
    legalName: 'Kestrel Renewables Private Limited',
    tradeName: 'Kestrel',
    website: 'https://kestrelrenewables.in',
    registrationType: 'GST Number (India)',
    registrationNumber: '24AACKR0011M1Z5',
    incorporationDate: '2024-12-02',
    primaryEmail: 'setup@kestrelrenewables.in',
    primaryPhone: '+91 79 4900 7700',
    primaryAddress: 'GIFT City, Gandhinagar 382355',
    billingAddress: '',
    jurisdictions: [jur('j-1201', 'India', true, '2026-05-20', 0)],
    baseCurrency: 'INR',
    baseCurrencyLocked: false,
    timeZone: 'Asia/Kolkata',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    operatingModel: 'Standalone',
    groupId: null,
    portfolioId: null,
    status: 'draft',
    employeeCount: 0,
    employeeLimit: 100,
    subscriptionTier: 'Basic',
    packageId: 'pkg-basic',
    adminEmail: null,
    createdAt: '2026-05-20',
    retentionEndsOn: null,
    archivalFeeMonthly: null,
    config: baseConfig(['Core HR']),
  },
]

/** Primary jurisdiction of a company ('—' when none set yet). */
export function primaryJurisdiction(company: Company): string {
  return (
    company.jurisdictions.find((j) => j.isPrimary)?.jurisdiction ??
    company.jurisdictions[0]?.jurisdiction ??
    '—'
  )
}

/** COMP-FR-007 — next COMP-{YYYY}-{NNNN} code for the current year. */
export function nextCompanyCode(companies: Company[], year: number): string {
  const seq =
    companies.filter((c) => c.code.startsWith(`COMP-${year}-`)).length + 1
  return `COMP-${year}-${String(seq).padStart(4, '0')}`
}

/** COMP_001 — exact legal-name uniqueness. */
export function findExactNameDuplicate(
  companies: Company[],
  legalName: string,
  excludeId?: string
): Company | undefined {
  const target = legalName.trim().toLowerCase()
  return companies.find(
    (c) => c.id !== excludeId && c.legalName.trim().toLowerCase() === target
  )
}

/** COMP_006 — registration-number uniqueness within a jurisdiction. */
export function findRegistrationDuplicate(
  companies: Company[],
  registrationNumber: string,
  jurisdiction: string,
  excludeId?: string
): Company | undefined {
  const target = registrationNumber.trim().toLowerCase()
  if (!target) return undefined
  return companies.find(
    (c) =>
      c.id !== excludeId &&
      c.registrationNumber.trim().toLowerCase() === target &&
      c.jurisdictions.some((j) => j.jurisdiction === jurisdiction)
  )
}

/** COMP-FR-005 — non-exact potential duplicates shown in the warning modal. */
export function findFuzzyMatches(
  companies: Company[],
  legalName: string
): Company[] {
  const words = legalName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  if (words.length === 0) return []
  return companies.filter((c) => {
    const name = c.legalName.toLowerCase()
    return (
      name !== legalName.trim().toLowerCase() &&
      words.some((w) => name.includes(w))
    )
  })
}
