import { type FinancialYear } from './tax'

/** Tax deduction category master with the per-FY ceiling (CAT-01..04). */
export interface TaxCategory {
  id: string
  financialYear: FinancialYear
  name: string
  maxLimit: number
}

export const seedTaxCategories: TaxCategory[] = [
  { id: 'tc-01', financialYear: '2026-27', name: '80C — Investments', maxLimit: 150000 },
  { id: 'tc-02', financialYear: '2026-27', name: '80D — Medical insurance', maxLimit: 75000 },
  { id: 'tc-03', financialYear: '2026-27', name: '80E — Education loan', maxLimit: 0 },
  { id: 'tc-04', financialYear: '2026-27', name: '24B — Home loan interest', maxLimit: 200000 },
  { id: 'tc-05', financialYear: '2026-27', name: '80CCD(1B) — NPS', maxLimit: 50000 },
  { id: 'tc-06', financialYear: '2025-26', name: '80C — Investments', maxLimit: 150000 },
  { id: 'tc-07', financialYear: '2025-26', name: '80D — Medical insurance', maxLimit: 50000 },
  { id: 'tc-08', financialYear: '2025-26', name: '24B — Home loan interest', maxLimit: 200000 },
  { id: 'tc-09', financialYear: '2024-25', name: '80C — Investments', maxLimit: 150000 },
  { id: 'tc-10', financialYear: '2024-25', name: '80D — Medical insurance', maxLimit: 50000 },
]

/** Deduction master employees pick from when declaring investments (DED-01..02). */
export interface DeductionMaster {
  id: string
  name: string
  category: string
  maxLimit: number
  remarks: string
}

export const seedDeductionMasters: DeductionMaster[] = [
  { id: 'dm-01', name: 'Life insurance premium', category: '80C — Investments', maxLimit: 150000, remarks: 'Combined with other 80C instruments' },
  { id: 'dm-02', name: 'Public Provident Fund (PPF)', category: '80C — Investments', maxLimit: 150000, remarks: 'Annual deposit limit ₹1.5L' },
  { id: 'dm-03', name: 'ELSS mutual funds', category: '80C — Investments', maxLimit: 150000, remarks: '3-year lock-in' },
  { id: 'dm-04', name: 'Health insurance premium — self & family', category: '80D — Medical insurance', maxLimit: 25000, remarks: '₹50k when senior citizen' },
  { id: 'dm-05', name: 'Health insurance premium — parents', category: '80D — Medical insurance', maxLimit: 50000, remarks: 'Senior-citizen parents' },
  { id: 'dm-06', name: 'Education loan interest', category: '80E — Education loan', maxLimit: 0, remarks: 'No ceiling; interest component only' },
  { id: 'dm-07', name: 'Home loan interest — self-occupied', category: '24B — Home loan interest', maxLimit: 200000, remarks: 'Possession within 5 years' },
]
