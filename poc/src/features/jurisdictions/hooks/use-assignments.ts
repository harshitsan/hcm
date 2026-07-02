import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCompanies,
  seedEmployees,
  seedPolicies,
  type CompanyRecord,
  type JurisdictionPolicy,
} from '../data/assignments'

/**
 * In-memory store for company ↔ jurisdiction assignments and jurisdiction-
 * scoped policies (FR 6.4.2, FR 6.4.3). Assignments only ever reference
 * supported catalog ids, and a company keeps at least one jurisdiction
 * (JUR-06, JUR-07, JUR-11).
 */
export function useAssignments() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(seedCompanies)
  const [policies, setPolicies] = useState<JurisdictionPolicy[]>(seedPolicies)
  const employees = seedEmployees

  /** Replace a company's jurisdiction set; enforces the minimum of one. */
  const setCompanyJurisdictions = useCallback(
    (companyId: string, jurisdictionIds: string[]) => {
      if (jurisdictionIds.length === 0) {
        toast.error(
          'A company must operate in at least one supported jurisdiction'
        )
        return false
      }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                jurisdictionIds,
                primaryJurisdictionId: jurisdictionIds.includes(
                  c.primaryJurisdictionId
                )
                  ? c.primaryJurisdictionId
                  : jurisdictionIds[0],
              }
            : c
        )
      )
      toast.success('Company jurisdictions updated')
      return true
    },
    []
  )

  const removeCompanyJurisdiction = useCallback(
    (companyId: string, jurisdictionId: string) => {
      const company = companies.find((c) => c.id === companyId)
      if (!company) return
      if (company.jurisdictionIds.length <= 1) {
        toast.error(
          'A company must operate in at least one supported jurisdiction'
        )
        return
      }
      const headcount = company.employeesByJurisdiction[jurisdictionId] ?? 0
      const remaining = company.jurisdictionIds.filter(
        (id) => id !== jurisdictionId
      )
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                jurisdictionIds: remaining,
                primaryJurisdictionId: remaining.includes(
                  c.primaryJurisdictionId
                )
                  ? c.primaryJurisdictionId
                  : remaining[0],
              }
            : c
        )
      )
      toast.success(
        headcount > 0
          ? `Association removed — ${headcount} employees there will need reassignment`
          : 'Jurisdiction association removed'
      )
    },
    [companies]
  )

  /** Update a policy's jurisdiction applicability criteria (JUR-05). */
  const setPolicyJurisdictions = useCallback(
    (policyId: string, jurisdictionIds: string[]) => {
      if (jurisdictionIds.length === 0) {
        toast.error('Select at least one jurisdiction as applicability criteria')
        return false
      }
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, jurisdictionIds } : p))
      )
      toast.success('Policy applicability criteria updated')
      return true
    },
    []
  )

  return {
    companies,
    policies,
    employees,
    setCompanyJurisdictions,
    removeCompanyJurisdiction,
    setPolicyJurisdictions,
  }
}

export type AssignmentsStore = ReturnType<typeof useAssignments>
