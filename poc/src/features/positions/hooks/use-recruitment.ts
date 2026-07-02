import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedRequisitions, type Requisition } from '../data/recruitment'

export type RecruitmentStore = ReturnType<typeof useRecruitment>

/**
 * In-memory recruitment pipeline. Requisitions reference governed positions
 * (POS-04/18); offers resolve and validate against the level's pay-grade
 * band (POS-37); completing onboarding hands the hire back to the caller so
 * the employee store can create the record with the target position.
 */
export function useRecruitment() {
  const [requisitions, setRequisitions] =
    useState<Requisition[]>(seedRequisitions)

  const addRequisition = useCallback(
    (args: { companyId: string; positionId: string; candidateName: string }) => {
      const requisition: Requisition = {
        id: `REQ-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        companyId: args.companyId,
        positionId: args.positionId,
        candidateName: args.candidateName,
        status: 'open',
        offeredSalary: null,
        resolvedPayGradeId: null,
        createdOn: new Date().toISOString().slice(0, 10),
      }
      setRequisitions((prev) => [requisition, ...prev])
      toast.success(`Requisition ${requisition.id} created for the governed position`)
    },
    []
  )

  /** Records the offer with the pay grade resolved from the level (POS-37). */
  const extendOffer = useCallback(
    (id: string, salary: number, resolvedPayGradeId: string | null) => {
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'offer-extended' as const,
                offeredSalary: salary,
                resolvedPayGradeId,
              }
            : r
        )
      )
      toast.success('Offer extended within the approved band')
    },
    []
  )

  const startOnboarding = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'onboarding' as const } : r))
    )
    toast.success('Candidate moved to onboarding — target position carried as workflow context')
  }, [])

  /** Marks the requisition hired; the caller creates the employee record. */
  const completeOnboarding = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'hired' as const } : r))
    )
  }, [])

  return {
    requisitions,
    addRequisition,
    extendOffer,
    startOnboarding,
    completeOnboarding,
  }
}
