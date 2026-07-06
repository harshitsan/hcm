import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedTeamAdvances,
  seedTeamExpenses,
  seedTeamTravelRequests,
  seedTripDetails,
  type TeamAdvance,
  type TeamExpense,
  type TeamTravelRequest,
  type TripDetail,
} from '../data/travel-team'

/**
 * In-memory store for the manager/coordinator side of Travel Management:
 * employee travel requests, expenses, advances and trip details
 * (EAE-01..06, EE-01..07, ETR-01..07, TD-01..07).
 */
export function useTravelTeam() {
  const [teamTravelRequests, setTeamTravelRequests] = useState<
    TeamTravelRequest[]
  >(seedTeamTravelRequests)
  const [teamExpenses] = useState<TeamExpense[]>(seedTeamExpenses)
  const [teamAdvances, setTeamAdvances] =
    useState<TeamAdvance[]>(seedTeamAdvances)
  const [tripDetails, setTripDetails] = useState<TripDetail[]>(seedTripDetails)

  /** Route a travel request to a handler for processing (ETR-06). */
  const assignTravelRequest = useCallback((id: string, handler: string) => {
    setTeamTravelRequests((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              assignedTo: handler,
              status:
                t.status === 'Pending Approval' || t.status === 'Initiated'
                  ? 'Approved'
                  : t.status,
            }
          : t
      )
    )
    toast.success(`Travel request assigned to ${handler}`)
  }, [])

  /** Manager decision on an advance pending with them (EAE-05 flow). */
  const decideAdvance = useCallback(
    (id: string, decision: 'Approved' | 'Rejected') => {
      setTeamAdvances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a))
      )
      toast.success(
        decision === 'Approved'
          ? 'Advance request approved'
          : 'Advance request rejected'
      )
    },
    []
  )

  /** Coordinator marks a trip confirmed with the vendor (TD-05 flow). */
  const confirmTrip = useCallback((id: string) => {
    setTripDetails((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Confirmed' } : t))
    )
    toast.success('Trip confirmed with the vendor')
  }, [])

  return {
    teamTravelRequests,
    teamExpenses,
    teamAdvances,
    tripDetails,
    assignTravelRequest,
    decideAdvance,
    confirmTrip,
  }
}

export type TravelTeamStore = ReturnType<typeof useTravelTeam>
