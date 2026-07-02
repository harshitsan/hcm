import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAdvanceExpenses,
  seedExpenses,
  seedTravelRequests,
  type AdvanceExpense,
  type TravelRequest,
  type TripExpense,
} from '../data/travel'

export type TravelDraft = Omit<TravelRequest, 'id' | 'status' | 'appliedOn'>
export type ExpenseDraft = Omit<TripExpense, 'id' | 'status' | 'addedOn' | 'task'>
export type AdvanceDraft = Pick<AdvanceExpense, 'title' | 'requestedAdvance'>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** In-memory travel store: requests, expenses and advances (ESS-26..28). */
export function useTravel() {
  const [travelRequests, setTravelRequests] =
    useState<TravelRequest[]>(seedTravelRequests)
  const [expenses, setExpenses] = useState<TripExpense[]>(seedExpenses)
  const [advances, setAdvances] =
    useState<AdvanceExpense[]>(seedAdvanceExpenses)

  const applyTravel = useCallback((draft: TravelDraft) => {
    setTravelRequests((prev) => [
      {
        ...draft,
        id: `tr-${crypto.randomUUID().slice(0, 8)}`,
        status: 'Initiated',
        appliedOn: today(),
      },
      ...prev,
    ])
    toast.success('Travel request applied — status Initiated')
  }, [])

  const cancelTravel = useCallback((id: string) => {
    setTravelRequests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Cancelled' } : t))
    )
    toast.success('Travel request cancelled')
  }, [])

  const submitExpense = useCallback((draft: ExpenseDraft) => {
    setExpenses((prev) => [
      {
        ...draft,
        id: `ex-${crypto.randomUUID().slice(0, 8)}`,
        addedOn: today(),
        status: 'Settlement Pending from Finance',
        task: null,
      },
      ...prev,
    ])
    toast.success('Expense submitted for settlement')
  }, [])

  /** Employee acknowledgement advances the settlement state (ESS-27). */
  const acknowledgeSettlement = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'Settlement Pending from Finance', task: null }
          : e
      )
    )
    toast.success('Settlement acknowledged — moved to finance for closure')
  }, [])

  const raiseAdvance = useCallback((draft: AdvanceDraft) => {
    setAdvances((prev) => [
      {
        ...draft,
        id: `adv-${crypto.randomUUID().slice(0, 8)}`,
        addedOn: today(),
        expenses: 0,
        status: 'Pending Approval',
      },
      ...prev,
    ])
    toast.success('Advance expense request raised')
  }, [])

  const cancelAdvance = useCallback((id: string) => {
    setAdvances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
    )
    toast.success('Advance request cancelled')
  }, [])

  return {
    travelRequests,
    expenses,
    advances,
    applyTravel,
    cancelTravel,
    submitExpense,
    acknowledgeSettlement,
    raiseAdvance,
    cancelAdvance,
  }
}

export type TravelStore = ReturnType<typeof useTravel>
