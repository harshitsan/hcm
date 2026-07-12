import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDeductions,
  seedExemptions,
  seedLtaClaims,
  type LtaClaim,
  type TaxDeduction,
} from '../data/tax'

export type DeductionDraft = Omit<TaxDeduction, 'id'>
export type LtaClaimDraft = Omit<LtaClaim, 'id' | 'claimsAvailed'>

/**
 * In-memory tax-planning store (ESS-33..35). Salary/TDS rows are not exposed
 * here — compensation data stays comp-dark in Phase 1 self-service.
 */
export function useTax() {
  const [deductions, setDeductions] = useState<TaxDeduction[]>(seedDeductions)
  const [exemptions] = useState(seedExemptions)
  const [ltaClaims, setLtaClaims] = useState<LtaClaim[]>(seedLtaClaims)

  const addDeduction = useCallback((draft: DeductionDraft) => {
    setDeductions((prev) => [
      { ...draft, id: `td-${crypto.randomUUID().slice(0, 8)}` },
      ...prev,
    ])
    toast.success(
      `Deduction recorded against FY ${draft.financialYear} for tax computation`
    )
  }, [])

  const addLtaClaim = useCallback((draft: LtaClaimDraft) => {
    setLtaClaims((prev) => [
      { ...draft, id: `lta-${crypto.randomUUID().slice(0, 8)}`, claimsAvailed: 1 },
      ...prev,
    ])
    toast.success('LTA reimbursement claim saved')
  }, [])

  return { deductions, exemptions, ltaClaims, addDeduction, addLtaClaim }
}

export type TaxStore = ReturnType<typeof useTax>
