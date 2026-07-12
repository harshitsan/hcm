/**
 * Jurisdictions catalog — governed, reusable set of operational regions
 * (FR 6.4.1–6.4.3). Entries are flat catalog records (no mandatory geographic
 * hierarchy) with optional tax/fee applicability and effective-dated history.
 */

export const JURISDICTION_TYPES = [
  'Country',
  'State',
  'City',
  'Other Operational Region',
] as const
export type JurisdictionType = (typeof JURISDICTION_TYPES)[number]

export const JURISDICTION_STATUSES = ['active', 'inactive'] as const
export type JurisdictionStatus = (typeof JURISDICTION_STATUSES)[number]

export const TAX_FEE_KINDS = ['Tax', 'Fee'] as const
export type TaxFeeKind = (typeof TAX_FEE_KINDS)[number]

export const TAX_FEE_SCOPES = [
  'Payroll',
  'Invoicing',
  'Benefits',
  'Statutory filings',
] as const

/** One tax or fee applicability line configured on a jurisdiction (FR 6.4.2). */
export interface TaxFeeItem {
  id: string
  name: string
  kind: TaxFeeKind
  rate: string
  appliesTo: string
}

export const STATUTORY_APPLICABILITY_OPTIONS = [
  'Applicable',
  'Not applicable',
  'Configured',
] as const
export type StatutoryApplicability =
  (typeof STATUTORY_APPLICABILITY_OPTIONS)[number]

/**
 * One statutory item on a jurisdiction's statutory profile (O1). The
 * applicability state is display/reference only — payroll computation is
 * out of scope for this POC.
 */
export interface StatutoryItem {
  id: string
  name: string
  applicability: StatutoryApplicability
  /** Rate, threshold or context shown next to the item — free text. */
  note: string
}

/**
 * Statutory profile carried by each jurisdiction (O1). Referenced by payroll
 * computation defaults (D6); the profile is displayed and referenced only —
 * no computation happens in this POC.
 */
export interface StatutoryProfile {
  /** e.g. "PAYE", "India Income Tax (new regime default)". */
  taxRegime: string
  /** Filing calendar note, e.g. "Form 941 quarterly; W-2 annually". */
  filingCalendar: string
  items: StatutoryItem[]
}

export interface Jurisdiction {
  id: string
  code: string
  name: string
  type: JurisdictionType
  status: JurisdictionStatus
  /** Informational region/country label — carries no hierarchy meaning. */
  region?: string
  /** What this operational region is for, in plain words. */
  description?: string
  /** Effective-dated validity of the current record version (JUR-12). */
  effectiveFrom: string
  effectiveTo: string | null
  /**
   * Tax and fee applicability, only where configured (JUR-04). An empty list
   * means the jurisdiction is treated as "not configured".
   */
  taxFees: TaxFeeItem[]
  /**
   * Statutory profile referenced by payroll-computation defaults (D6).
   * Absent = not configured yet; it can be set up mid-life without
   * disrupting existing records.
   */
  statutoryProfile?: StatutoryProfile
  /**
   * Marks an entry added to the catalog mid-life — shown with a "New" chip
   * and a zero-disruption note (existing records are never changed by an
   * addition).
   */
  recentlyAdded?: boolean
}

/** A closed or current effective-dated version of a catalog entry (JUR-12). */
export interface JurisdictionHistoryEntry {
  id: string
  jurisdictionId: string
  version: number
  effectiveFrom: string
  /** null = the currently effective version. */
  effectiveTo: string | null
  summary: string
  changedBy: string
  changedAt: string
}

const tf = (
  id: string,
  name: string,
  kind: TaxFeeKind,
  rate: string,
  appliesTo: string
): TaxFeeItem => ({ id, name, kind, rate, appliesTo })

const si = (
  id: string,
  name: string,
  applicability: StatutoryApplicability,
  note: string
): StatutoryItem => ({ id, name, applicability, note })

export const seedJurisdictions: Jurisdiction[] = [
  {
    id: 'jur-01',
    code: 'IN',
    name: 'India',
    type: 'Country',
    status: 'active',
    region: 'Asia-Pacific',
    description:
      'Country-wide operational region for all India-based companies and employees.',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0101', 'GST', 'Tax', '18%', 'Invoicing'),
      tf('tf-0102', 'Professional Tax', 'Tax', 'Slab ₹200/month', 'Payroll'),
      tf('tf-0103', 'Labour Welfare Fund', 'Fee', '₹40/half-year', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'India Income Tax (new regime default)',
      filingCalendar: 'Monthly TDS deposits; quarterly returns; annual Form 24Q',
      items: [
        si('st-0101', 'Provident Fund (EPF)', 'Applicable', '12% employer + 12% employee'),
        si('st-0102', 'Employee State Insurance (ESI)', 'Configured', 'Applies below ₹21,000/month gross'),
        si('st-0103', 'Professional Tax', 'Configured', 'State-level slabs apply'),
        si('st-0104', 'Gratuity', 'Applicable', 'Payable after 5 years of continuous service'),
        si('st-0105', 'Statutory Bonus', 'Configured', '8.33%–20% for eligible wage bands'),
      ],
    },
  },
  {
    id: 'jur-02',
    code: 'US',
    name: 'United States',
    type: 'Country',
    status: 'active',
    region: 'North America',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0201', 'Federal Payroll Tax (FICA)', 'Tax', '7.65%', 'Payroll'),
      tf('tf-0202', 'FUTA', 'Tax', '0.6% up to $7,000', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'US federal payroll withholding',
      filingCalendar: 'Form 941 quarterly; W-2 annually',
      items: [
        si('st-0201', 'Social Security', 'Applicable', '6.2% up to the annual wage base'),
        si('st-0202', 'Medicare', 'Applicable', '1.45% of all wages'),
        si('st-0203', 'Federal Unemployment (FUTA)', 'Applicable', '0.6% up to $7,000'),
        si('st-0204', 'State Unemployment Insurance', 'Configured', 'Varies by state entry'),
      ],
    },
  },
  {
    id: 'jur-03',
    code: 'GB',
    name: 'United Kingdom',
    type: 'Country',
    status: 'active',
    region: 'Europe',
    effectiveFrom: '2024-04-06',
    effectiveTo: null,
    taxFees: [
      tf('tf-0301', 'National Insurance', 'Tax', '13.8% employer', 'Payroll'),
      tf('tf-0302', 'Apprenticeship Levy', 'Fee', '0.5% of pay bill', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'PAYE',
      filingCalendar: 'Real Time Information (RTI) each pay run; P60 annually',
      items: [
        si('st-0301', 'National Insurance', 'Applicable', '13.8% employer above threshold'),
        si('st-0302', 'Workplace Pension (auto-enrolment)', 'Applicable', 'Minimum 3% employer contribution'),
        si('st-0303', 'Apprenticeship Levy', 'Configured', '0.5% where pay bill exceeds £3m'),
        si('st-0304', 'Statutory Sick Pay', 'Applicable', 'Statutory weekly rate'),
      ],
    },
  },
  {
    id: 'jur-04',
    code: 'SG',
    name: 'Singapore',
    type: 'Country',
    status: 'active',
    region: 'Asia-Pacific',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0401', 'CPF Employer Contribution', 'Tax', '17%', 'Payroll'),
      tf('tf-0402', 'Skills Development Levy', 'Fee', '0.25%', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'IRAS annual assessment',
      filingCalendar: 'CPF contributions monthly; IR8A annually',
      items: [
        si('st-0401', 'Central Provident Fund (CPF)', 'Applicable', '17% employer for citizens/PRs'),
        si('st-0402', 'Skills Development Levy', 'Applicable', '0.25% of monthly wages'),
        si('st-0403', 'Foreign Worker Levy', 'Configured', 'Work-permit holders only'),
      ],
    },
  },
  {
    id: 'jur-05',
    code: 'DE',
    name: 'Germany',
    type: 'Country',
    status: 'active',
    region: 'Europe',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0501', 'Social Insurance', 'Tax', '~20% employer', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'Wage tax (Lohnsteuer)',
      filingCalendar: 'Monthly wage tax return; annual reconciliation',
      items: [
        si('st-0501', 'Social Insurance', 'Applicable', 'Approx. 20% employer share'),
        si('st-0502', 'Solidarity Surcharge', 'Configured', 'Income-dependent'),
        si('st-0503', 'Church Tax', 'Configured', 'Only where the employee is registered'),
      ],
    },
  },
  {
    id: 'jur-06',
    code: 'AE',
    name: 'United Arab Emirates',
    type: 'Country',
    status: 'active',
    region: 'Middle East',
    effectiveFrom: '2025-01-01',
    effectiveTo: null,
    // No tax/fee configuration — treated as "not configured" (JUR-04).
    taxFees: [],
    statutoryProfile: {
      taxRegime: 'No personal income tax',
      filingCalendar: 'WPS salary file monthly',
      items: [
        si('st-0601', 'End-of-Service Gratuity', 'Applicable', 'Based on final basic salary and tenure'),
        si('st-0602', 'GPSSA Pension', 'Configured', 'UAE/GCC nationals only'),
        si('st-0603', 'Income Tax Withholding', 'Not applicable', 'No personal income tax levied'),
      ],
    },
  },
  {
    id: 'jur-07',
    code: 'AU',
    name: 'Australia',
    type: 'Country',
    status: 'active',
    region: 'Asia-Pacific',
    effectiveFrom: '2024-07-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0701', 'Superannuation Guarantee', 'Tax', '11.5%', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'PAYG withholding',
      filingCalendar: 'Single Touch Payroll each pay run',
      items: [
        si('st-0701', 'Superannuation Guarantee', 'Applicable', '11.5% of ordinary time earnings'),
        si('st-0702', 'Payroll Tax', 'Configured', 'State thresholds apply'),
        si('st-0703', 'Fringe Benefits Tax', 'Configured', 'Where benefits are provided'),
      ],
    },
  },
  {
    id: 'jur-08',
    code: 'IN-KA',
    name: 'Karnataka',
    type: 'State',
    status: 'active',
    region: 'India',
    description:
      'State-level operational region layered over India for statutory items that vary by state.',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0801', 'Karnataka Professional Tax', 'Tax', '₹200/month above ₹25,000', 'Payroll'),
      tf('tf-0802', 'Shops & Establishments Fee', 'Fee', '₹1,500/year', 'Statutory filings'),
    ],
    statutoryProfile: {
      taxRegime: 'Karnataka state statutory overlay',
      filingCalendar: 'Professional tax monthly (Form 5A); labour welfare fund half-yearly',
      items: [
        si('st-0801', 'Professional Tax', 'Applicable', '₹200/month above ₹25,000'),
        si('st-0802', 'Labour Welfare Fund', 'Applicable', '₹40 per half-year'),
        si('st-0803', 'Shops & Establishments Registration', 'Applicable', 'Renewed annually'),
      ],
    },
  },
  {
    id: 'jur-09',
    code: 'IN-MH',
    name: 'Maharashtra',
    type: 'State',
    status: 'active',
    region: 'India',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0901', 'Maharashtra Professional Tax', 'Tax', '₹200/month (₹300 in Feb)', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'Maharashtra state statutory overlay',
      filingCalendar: 'Professional tax monthly; labour welfare fund half-yearly',
      items: [
        si('st-0901', 'Professional Tax', 'Applicable', '₹200/month (₹300 in February)'),
        si('st-0902', 'Maharashtra Labour Welfare Fund', 'Applicable', 'Employee + employer contribution'),
        si('st-0903', 'Statutory Bonus', 'Configured', 'For eligible wage bands'),
      ],
    },
  },
  {
    id: 'jur-10',
    code: 'US-CA',
    name: 'California',
    type: 'State',
    status: 'active',
    region: 'United States',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-1001', 'CA SUI', 'Tax', '3.4% new employer', 'Payroll'),
      tf('tf-1002', 'CA Employment Training Tax', 'Fee', '0.1%', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'California state withholding overlay',
      filingCalendar: 'DE 9 / DE 9C quarterly',
      items: [
        si('st-1001', 'State Disability Insurance (SDI)', 'Applicable', '1.1% employee-paid'),
        si('st-1002', 'State Unemployment Insurance (SUI)', 'Applicable', '3.4% for new employers'),
        si('st-1003', 'Employment Training Tax', 'Applicable', '0.1%'),
      ],
    },
  },
  {
    id: 'jur-11',
    code: 'IN-BLR',
    name: 'Bengaluru',
    type: 'City',
    status: 'active',
    region: 'India · Karnataka',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [],
    statutoryProfile: {
      taxRegime: 'Follows the Karnataka state profile',
      filingCalendar: 'As per Karnataka filings',
      items: [
        si('st-1101', 'Municipal Trade Licence', 'Configured', 'Required for physical establishments'),
      ],
    },
  },
  {
    id: 'jur-12',
    code: 'AE-DXB',
    name: 'Dubai',
    type: 'City',
    status: 'active',
    region: 'United Arab Emirates',
    effectiveFrom: '2025-01-01',
    effectiveTo: null,
    taxFees: [tf('tf-1201', 'DIFC Employment Levy', 'Fee', 'AED 1,000/permit', 'Statutory filings')],
    statutoryProfile: {
      taxRegime: 'Follows the UAE profile',
      filingCalendar: 'WPS salary file monthly',
      items: [
        si('st-1201', 'DIFC Employee Workplace Savings', 'Configured', 'DIFC-registered entities only'),
      ],
    },
  },
  {
    id: 'jur-13',
    code: 'IN-GIFT',
    name: 'GIFT City SEZ',
    type: 'Other Operational Region',
    status: 'active',
    region: 'India · Gujarat',
    description:
      'Special economic zone with concessional statutory treatment — an operational region, not a geographic unit.',
    effectiveFrom: '2025-06-01',
    effectiveTo: null,
    taxFees: [tf('tf-1301', 'SEZ Concessional Rate', 'Tax', '0% GST on exports', 'Invoicing')],
    statutoryProfile: {
      taxRegime: 'SEZ concessional regime',
      filingCalendar: 'SEZ unit returns quarterly',
      items: [
        si('st-1301', 'SEZ Income Tax Holiday', 'Configured', 'For eligible units and periods'),
        si('st-1302', 'GST on Exports', 'Not applicable', 'Zero-rated for export supplies'),
      ],
    },
  },
  {
    id: 'jur-14',
    code: 'EU-RMT',
    name: 'EU Remote-Work Region',
    type: 'Other Operational Region',
    status: 'active',
    region: 'Europe',
    description:
      'Cross-border remote-work arrangement — shows that a jurisdiction need not be a country, state or city.',
    effectiveFrom: '2025-09-01',
    effectiveTo: null,
    taxFees: [],
    statutoryProfile: {
      taxRegime: 'Depends on the employer-of-record arrangement',
      filingCalendar: 'Per host-country arrangement',
      items: [
        si('st-1401', 'Social Contributions', 'Configured', 'Per host-country arrangement'),
      ],
    },
  },
  {
    id: 'jur-15',
    code: 'RU',
    name: 'Russia',
    type: 'Country',
    status: 'inactive',
    region: 'Europe / Central Asia',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2024-03-31',
    taxFees: [],
  },
  {
    // Added mid-life (O1 edge case): the catalog entry arrived after
    // Telangana-based employees and companies already existed — none of
    // those records were changed by the addition.
    id: 'jur-16',
    code: 'IN-TG',
    name: 'Telangana',
    type: 'State',
    status: 'active',
    region: 'India',
    description:
      'Added to the catalog mid-life — new policy and statutory options became available without changing any existing employee, company or policy records.',
    effectiveFrom: '2026-06-01',
    effectiveTo: null,
    recentlyAdded: true,
    taxFees: [
      tf('tf-1601', 'Telangana Professional Tax', 'Tax', '₹200/month above ₹20,000', 'Payroll'),
    ],
    statutoryProfile: {
      taxRegime: 'Telangana state statutory overlay',
      filingCalendar: 'Professional tax monthly; labour welfare fund half-yearly',
      items: [
        si('st-1601', 'Professional Tax', 'Applicable', '₹200/month above ₹20,000'),
        si('st-1602', 'Labour Welfare Fund', 'Applicable', '₹2/month employee, ₹5/month employer'),
        si('st-1603', 'Shops & Establishments Registration', 'Configured', 'Renewal cycle under review'),
      ],
    },
  },
]

export const seedHistory: JurisdictionHistoryEntry[] = [
  {
    id: 'jh-01',
    jurisdictionId: 'jur-01',
    version: 1,
    effectiveFrom: '2023-04-01',
    effectiveTo: '2024-03-31',
    summary: 'Catalog entry created; GST configured at 12%.',
    changedBy: 'Asha Verma (Platform Admin)',
    changedAt: '2023-03-18',
  },
  {
    id: 'jh-02',
    jurisdictionId: 'jur-01',
    version: 2,
    effectiveFrom: '2024-04-01',
    effectiveTo: '2025-03-31',
    summary: 'GST rate revised 12% → 18% per Finance Act.',
    changedBy: 'Asha Verma (Platform Admin)',
    changedAt: '2024-03-22',
  },
  {
    id: 'jh-03',
    jurisdictionId: 'jur-01',
    version: 3,
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    summary: 'Added Labour Welfare Fund fee applicability.',
    changedBy: 'Rahul Menon (Platform Admin)',
    changedAt: '2025-03-28',
  },
  {
    id: 'jh-04',
    jurisdictionId: 'jur-08',
    version: 1,
    effectiveFrom: '2024-04-01',
    effectiveTo: '2025-03-31',
    summary: 'Catalog entry created with PT slab ₹150/month.',
    changedBy: 'Asha Verma (Platform Admin)',
    changedAt: '2024-03-25',
  },
  {
    id: 'jh-05',
    jurisdictionId: 'jur-08',
    version: 2,
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    summary: 'PT slab revised to ₹200/month above ₹25,000; S&E fee added.',
    changedBy: 'Rahul Menon (Platform Admin)',
    changedAt: '2025-03-30',
  },
  {
    id: 'jh-06',
    jurisdictionId: 'jur-06',
    version: 1,
    effectiveFrom: '2025-01-01',
    effectiveTo: null,
    summary: 'Catalog entry created; tax/fee applicability left unconfigured.',
    changedBy: 'Rahul Menon (Platform Admin)',
    changedAt: '2024-12-12',
  },
  {
    id: 'jh-08',
    jurisdictionId: 'jur-16',
    version: 1,
    effectiveFrom: '2026-06-01',
    effectiveTo: null,
    summary:
      'Catalog entry added mid-life — Telangana employees and companies already existed; their records were left untouched while new policy and statutory options became available.',
    changedBy: 'Rahul Menon (Platform Admin)',
    changedAt: '2026-05-28',
  },
  {
    id: 'jh-07',
    jurisdictionId: 'jur-15',
    version: 2,
    effectiveFrom: '2024-04-01',
    effectiveTo: null,
    summary: 'Deactivated — region no longer supported for operations.',
    changedBy: 'Asha Verma (Platform Admin)',
    changedAt: '2024-03-31',
  },
]

export const typeAbbrev: Record<JurisdictionType, string> = {
  Country: 'Country',
  State: 'State',
  City: 'City',
  'Other Operational Region': 'Other Region',
}
