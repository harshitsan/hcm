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

export interface Jurisdiction {
  id: string
  code: string
  name: string
  type: JurisdictionType
  status: JurisdictionStatus
  /** Effective-dated validity of the current record version (JUR-12). */
  effectiveFrom: string
  effectiveTo: string | null
  /**
   * Tax and fee applicability, only where configured (JUR-04). An empty list
   * means the jurisdiction is treated as "not configured".
   */
  taxFees: TaxFeeItem[]
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

export const seedJurisdictions: Jurisdiction[] = [
  {
    id: 'jur-01',
    code: 'IN',
    name: 'India',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0101', 'GST', 'Tax', '18%', 'Invoicing'),
      tf('tf-0102', 'Professional Tax', 'Tax', 'Slab ₹200/month', 'Payroll'),
      tf('tf-0103', 'Labour Welfare Fund', 'Fee', '₹40/half-year', 'Payroll'),
    ],
  },
  {
    id: 'jur-02',
    code: 'US',
    name: 'United States',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0201', 'Federal Payroll Tax (FICA)', 'Tax', '7.65%', 'Payroll'),
      tf('tf-0202', 'FUTA', 'Tax', '0.6% up to $7,000', 'Payroll'),
    ],
  },
  {
    id: 'jur-03',
    code: 'GB',
    name: 'United Kingdom',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2024-04-06',
    effectiveTo: null,
    taxFees: [
      tf('tf-0301', 'National Insurance', 'Tax', '13.8% employer', 'Payroll'),
      tf('tf-0302', 'Apprenticeship Levy', 'Fee', '0.5% of pay bill', 'Payroll'),
    ],
  },
  {
    id: 'jur-04',
    code: 'SG',
    name: 'Singapore',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0401', 'CPF Employer Contribution', 'Tax', '17%', 'Payroll'),
      tf('tf-0402', 'Skills Development Levy', 'Fee', '0.25%', 'Payroll'),
    ],
  },
  {
    id: 'jur-05',
    code: 'DE',
    name: 'Germany',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0501', 'Social Insurance', 'Tax', '~20% employer', 'Payroll'),
    ],
  },
  {
    id: 'jur-06',
    code: 'AE',
    name: 'United Arab Emirates',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2025-01-01',
    effectiveTo: null,
    // No tax/fee configuration — treated as "not configured" (JUR-04).
    taxFees: [],
  },
  {
    id: 'jur-07',
    code: 'AU',
    name: 'Australia',
    type: 'Country',
    status: 'active',
    effectiveFrom: '2024-07-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0701', 'Superannuation Guarantee', 'Tax', '11.5%', 'Payroll'),
    ],
  },
  {
    id: 'jur-08',
    code: 'IN-KA',
    name: 'Karnataka',
    type: 'State',
    status: 'active',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0801', 'Karnataka Professional Tax', 'Tax', '₹200/month above ₹25,000', 'Payroll'),
      tf('tf-0802', 'Shops & Establishments Fee', 'Fee', '₹1,500/year', 'Statutory filings'),
    ],
  },
  {
    id: 'jur-09',
    code: 'IN-MH',
    name: 'Maharashtra',
    type: 'State',
    status: 'active',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-0901', 'Maharashtra Professional Tax', 'Tax', '₹200/month (₹300 in Feb)', 'Payroll'),
    ],
  },
  {
    id: 'jur-10',
    code: 'US-CA',
    name: 'California',
    type: 'State',
    status: 'active',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    taxFees: [
      tf('tf-1001', 'CA SUI', 'Tax', '3.4% new employer', 'Payroll'),
      tf('tf-1002', 'CA Employment Training Tax', 'Fee', '0.1%', 'Payroll'),
    ],
  },
  {
    id: 'jur-11',
    code: 'IN-BLR',
    name: 'Bengaluru',
    type: 'City',
    status: 'active',
    effectiveFrom: '2025-04-01',
    effectiveTo: null,
    taxFees: [],
  },
  {
    id: 'jur-12',
    code: 'AE-DXB',
    name: 'Dubai',
    type: 'City',
    status: 'active',
    effectiveFrom: '2025-01-01',
    effectiveTo: null,
    taxFees: [tf('tf-1201', 'DIFC Employment Levy', 'Fee', 'AED 1,000/permit', 'Statutory filings')],
  },
  {
    id: 'jur-13',
    code: 'IN-GIFT',
    name: 'GIFT City SEZ',
    type: 'Other Operational Region',
    status: 'active',
    effectiveFrom: '2025-06-01',
    effectiveTo: null,
    taxFees: [tf('tf-1301', 'SEZ Concessional Rate', 'Tax', '0% GST on exports', 'Invoicing')],
  },
  {
    id: 'jur-14',
    code: 'EU-RMT',
    name: 'EU Remote-Work Region',
    type: 'Other Operational Region',
    status: 'active',
    effectiveFrom: '2025-09-01',
    effectiveTo: null,
    taxFees: [],
  },
  {
    id: 'jur-15',
    code: 'RU',
    name: 'Russia',
    type: 'Country',
    status: 'inactive',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2024-03-31',
    taxFees: [],
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
