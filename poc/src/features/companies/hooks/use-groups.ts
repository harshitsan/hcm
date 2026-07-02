import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAssignments,
  seedGroups,
  seedMemberships,
  seedPortfolios,
  type CompanyGroup,
  type GroupMembership,
  type Portfolio,
  type PortfolioAssignment,
} from '../data/groups'

/**
 * Group-company structures + shared-services portfolio assignments
 * (FR 6.2.4). Membership changes are effective-dated and preserved — removal
 * closes the record with an end date instead of deleting it (CMP-17).
 */
export function useGroups() {
  const [groups] = useState<CompanyGroup[]>(seedGroups)
  const [memberships, setMemberships] =
    useState<GroupMembership[]>(seedMemberships)
  const [portfolios] = useState<Portfolio[]>(seedPortfolios)
  const [assignments, setAssignments] =
    useState<PortfolioAssignment[]>(seedAssignments)

  const addMembership = useCallback(
    (groupId: string, companyId: string, effectiveDate: string) => {
      const active = memberships.some(
        (m) => m.groupId === groupId && m.companyId === companyId && !m.endDate
      )
      if (active) {
        toast.error('This company is already an active member of the group')
        return
      }
      setMemberships((prev) => [
        ...prev,
        {
          id: `gm-${crypto.randomUUID().slice(0, 6)}`,
          groupId,
          companyId,
          relationship: 'Subsidiary',
          effectiveDate,
          endDate: null,
        },
      ])
      toast.success('Company added to the group (effective-dated membership)')
    },
    [memberships]
  )

  /** Effective-dated removal — the relationship history is preserved. */
  const endMembership = useCallback((membershipId: string) => {
    const endDate = new Date().toISOString().slice(0, 10)
    setMemberships((prev) =>
      prev.map((m) => (m.id === membershipId ? { ...m, endDate } : m))
    )
    toast.success(`Membership ended effective ${endDate} — history preserved`)
  }, [])

  const assignToPortfolio = useCallback(
    (portfolioId: string, companyId: string) => {
      const exists = assignments.some(
        (a) => a.portfolioId === portfolioId && a.companyId === companyId && a.active
      )
      if (exists) {
        toast.error('Company is already assigned to this provider')
        return
      }
      setAssignments((prev) => [
        ...prev,
        {
          id: `pa-${crypto.randomUUID().slice(0, 6)}`,
          portfolioId,
          companyId,
          assignedOn: new Date().toISOString().slice(0, 10),
          active: true,
        },
      ])
      toast.success('Company assigned to shared-services provider')
    },
    [assignments]
  )

  const revokeAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, active: false } : a))
    )
    toast.success('Provider assignment revoked — access is now denied')
  }, [])

  return {
    groups,
    memberships,
    portfolios,
    assignments,
    addMembership,
    endMembership,
    assignToPortfolio,
    revokeAssignment,
  }
}

export type GroupsStore = ReturnType<typeof useGroups>
