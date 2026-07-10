import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDeductionMasters,
  seedTaxCategories,
  type DeductionMaster,
  type TaxCategory,
} from '../data/tax-admin'

export type TaxCategoryDraft = Omit<TaxCategory, 'id'>
export type DeductionMasterDraft = Omit<DeductionMaster, 'id'>

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/**
 * In-memory tax-planning configuration store: deduction category masters
 * with per-FY ceilings (CAT-01..05) and the deduction masters employees
 * declare against (DED-01..03).
 */
export function useTaxAdmin() {
  const [categories, setCategories] = useState<TaxCategory[]>(seedTaxCategories)
  const [deductions, setDeductions] =
    useState<DeductionMaster[]>(seedDeductionMasters)

  const addCategory = useCallback((draft: TaxCategoryDraft) => {
    setCategories((prev) => [{ ...draft, id: newId('tc') }, ...prev])
    toast.success(`Category "${draft.name}" added for FY ${draft.financialYear}`)
  }, [])

  const updateCategory = useCallback((id: string, draft: TaxCategoryDraft) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
    )
    toast.success('Category updated')
  }, [])

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    toast.success('Category removed')
  }, [])

  /** Simulated re-fetch of the categories list (CAT-05). */
  const refreshCategories = useCallback(() => {
    setCategories((prev) => [...prev])
    toast.success('Categories refreshed — showing the latest saved data')
  }, [])

  const addDeduction = useCallback((draft: DeductionMasterDraft) => {
    setDeductions((prev) => [{ ...draft, id: newId('dm') }, ...prev])
    toast.success(`Deduction "${draft.name}" added`)
  }, [])

  const updateDeduction = useCallback(
    (id: string, draft: DeductionMasterDraft) => {
      setDeductions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...draft } : d))
      )
      toast.success('Deduction updated')
    },
    []
  )

  const removeDeduction = useCallback((id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id))
    toast.success('Deduction removed')
  }, [])

  return {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    refreshCategories,
    deductions,
    addDeduction,
    updateDeduction,
    removeDeduction,
  }
}

export type TaxAdminStore = ReturnType<typeof useTaxAdmin>
