export const FINANCIAL_YEARS = ['2026-27', '2025-26', '2024-25'] as const
export type FinancialYear = (typeof FINANCIAL_YEARS)[number]

export const DEDUCTION_CATEGORIES = [
  '80C — Investments',
  '80D — Medical insurance',
  '80E — Education loan',
  '24B — Home loan interest',
] as const
export type DeductionCategory = (typeof DEDUCTION_CATEGORIES)[number]

/** Declared tax deductions by financial year (ESS-33). */
export interface TaxDeduction {
  id: string
  financialYear: FinancialYear
  name: string
  category: DeductionCategory
  providerName: string
  referenceNumber: string
  amount: number
  paymentDate: string
  actualPaymentDate: string | null
}

export const seedDeductions: TaxDeduction[] = [
  { id: 'td-01', financialYear: '2026-27', name: 'LIC Jeevan Anand premium', category: '80C — Investments', providerName: 'LIC of India', referenceNumber: 'POL-778812345', amount: 48000, paymentDate: '2026-05-10', actualPaymentDate: '2026-05-09' },
  { id: 'td-02', financialYear: '2026-27', name: 'PPF contribution', category: '80C — Investments', providerName: 'SBI', referenceNumber: 'PPF-30412218', amount: 100000, paymentDate: '2026-06-01', actualPaymentDate: null },
  { id: 'td-03', financialYear: '2026-27', name: 'Family floater health policy', category: '80D — Medical insurance', providerName: 'Star Health', referenceNumber: 'SH-2026-99120', amount: 21500, paymentDate: '2026-04-18', actualPaymentDate: '2026-04-18' },
  { id: 'td-04', financialYear: '2026-27', name: 'Education loan interest', category: '80E — Education loan', providerName: 'HDFC Credila', referenceNumber: 'EDU-5521098', amount: 36400, paymentDate: '2026-04-05', actualPaymentDate: '2026-04-05' },
  { id: 'td-05', financialYear: '2025-26', name: 'ELSS mutual fund SIP', category: '80C — Investments', providerName: 'Axis MF', referenceNumber: 'FOLIO-8891123', amount: 60000, paymentDate: '2025-04-10', actualPaymentDate: '2025-04-10' },
  { id: 'td-06', financialYear: '2025-26', name: 'Home loan interest', category: '24B — Home loan interest', providerName: 'ICICI Bank', referenceNumber: 'HL-99120034', amount: 185000, paymentDate: '2025-04-01', actualPaymentDate: '2025-04-01' },
]

/** Tax exemptions applied to salary (ESS-34). */
export interface TaxExemption {
  id: string
  financialYear: FinancialYear
  type: string
  applicableFrom: string
  applicableTo: string
  monthlyAmount: number
}

export const seedExemptions: TaxExemption[] = [
  { id: 'tx-01', financialYear: '2026-27', type: 'House Rent Allowance', applicableFrom: '2026-04-01', applicableTo: '2027-03-31', monthlyAmount: 21500 },
  { id: 'tx-02', financialYear: '2026-27', type: 'Leave Travel Allowance', applicableFrom: '2026-04-01', applicableTo: '2027-03-31', monthlyAmount: 3000 },
  { id: 'tx-03', financialYear: '2025-26', type: 'House Rent Allowance', applicableFrom: '2025-04-01', applicableTo: '2026-03-31', monthlyAmount: 19800 },
  { id: 'tx-04', financialYear: '2025-26', type: 'Telephone reimbursement', applicableFrom: '2025-04-01', applicableTo: '2026-03-31', monthlyAmount: 1500 },
]

export const TRAVEL_MODES = ['Air', 'Rail', 'Road'] as const
export type TravelMode = (typeof TRAVEL_MODES)[number]

export const LTA_RELATIONSHIPS = [
  'Self',
  'Spouse',
  'Child',
  'Parent',
] as const
export type LtaRelationship = (typeof LTA_RELATIONSHIPS)[number]

/** Leave travel allowance reimbursement claims (ESS-35). */
export interface LtaClaim {
  id: string
  financialYear: FinancialYear
  relationship: LtaRelationship
  travellerName: string
  departureDate: string
  arrivalDate: string
  modeOfTravel: TravelMode
  totalAmount: number
  claimFrom: string
  claimTo: string
  claimsAvailed: number
}

export const seedLtaClaims: LtaClaim[] = [
  { id: 'lta-01', financialYear: '2025-26', relationship: 'Self', travellerName: 'Anika Sharma', departureDate: '2025-12-20', arrivalDate: '2025-12-28', modeOfTravel: 'Air', totalAmount: 34200, claimFrom: '2025-12-20', claimTo: '2025-12-28', claimsAvailed: 1 },
  { id: 'lta-02', financialYear: '2024-25', relationship: 'Spouse', travellerName: 'Rohit Sharma', departureDate: '2024-10-12', arrivalDate: '2024-10-19', modeOfTravel: 'Rail', totalAmount: 8600, claimFrom: '2024-10-12', claimTo: '2024-10-19', claimsAvailed: 1 },
]

// Month-by-month salary/TDS seed data (ESS-36) was removed for Phase 1:
// compensation amounts are comp-dark and must not ship in self-service.
// The "My Salary Details" tab renders a restricted-visibility note instead.
