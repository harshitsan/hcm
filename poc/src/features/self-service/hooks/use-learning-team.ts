import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCatalogPrograms,
  seedEmployeeCertifications,
  seedEnrollments,
  seedMassApprovals,
  seedReimbursementRequests,
  seedSponsorshipRequests,
  TEAM_EMPLOYEES,
  type CatalogProgram,
  type EmployeeCertification,
  type TeamLearningRequest,
} from '../data/learning-team'

export interface AssignCertificationDraft {
  certification: string
  employeeCodes: string[]
  mandatory: boolean
}

export type CatalogProgramDraft = Pick<
  CatalogProgram,
  'title' | 'programType' | 'description'
>

/**
 * Manager / HR-admin Learning Management store: team certifications,
 * enrollment program, sponsorship & reimbursement requests, catalog and
 * mass approval (EC/EEP/ELR/LP/TMA).
 */
export function useLearningTeam() {
  const [employeeCertifications, setEmployeeCertifications] = useState(
    seedEmployeeCertifications
  )
  const [enrollments] = useState(seedEnrollments)
  const [sponsorships, setSponsorships] = useState(seedSponsorshipRequests)
  const [reimbursements, setReimbursements] = useState(
    seedReimbursementRequests
  )
  const [catalog, setCatalog] = useState(seedCatalogPrograms)
  const [massApprovals, setMassApprovals] = useState(seedMassApprovals)

  /** Assign a certification to one or more employees (EC-05). */
  const assignCertification = useCallback(
    (draft: AssignCertificationDraft) => {
      const rows: EmployeeCertification[] = draft.employeeCodes.flatMap(
        (code) => {
          const emp = TEAM_EMPLOYEES.find((e) => e.code === code)
          if (!emp) return []
          return [
            {
              id: `ecert-${crypto.randomUUID().slice(0, 8)}`,
              employeeCode: emp.code,
              employeeName: emp.name,
              location: emp.location,
              department: emp.department,
              positionLevel: emp.positionLevel,
              certification: draft.certification,
              mandatory: draft.mandatory,
              status: 'Pending' as const,
              completedOn: null,
              validTill: null,
            },
          ]
        }
      )
      setEmployeeCertifications((prev) => [...rows, ...prev])
      toast.success(
        `"${draft.certification}" assigned to ${rows.length} employee${rows.length === 1 ? '' : 's'}`
      )
    },
    []
  )

  const decideRequest = useCallback(
    (
      kind: 'sponsorship' | 'reimbursement',
      id: string,
      decision: 'Approved' | 'Rejected'
    ) => {
      const update = (prev: TeamLearningRequest[]) =>
        prev.map((r) => (r.id === id ? { ...r, status: decision } : r))
      if (kind === 'sponsorship') setSponsorships(update)
      else setReimbursements(update)
      toast.success(`Request ${decision.toLowerCase()}`)
    },
    []
  )

  /** Add a new learning program to the catalog (LP-04). */
  const addCatalogProgram = useCallback((draft: CatalogProgramDraft) => {
    setCatalog((prev) => [
      {
        ...draft,
        id: `cat-${crypto.randomUUID().slice(0, 8)}`,
        status: 'Pending approval',
      },
      ...prev,
    ])
    toast.success(`Learning program "${draft.title}" submitted for approval`)
  }, [])

  /** Bulk-approve the selected pending enrollments (TMA-03). */
  const approveEnrollments = useCallback((ids: string[]) => {
    setMassApprovals((prev) => prev.filter((row) => !ids.includes(row.id)))
    toast.success(
      `${ids.length} enrollment${ids.length === 1 ? '' : 's'} approved`
    )
  }, [])

  /** Simulated re-fetch used by every Refresh button (EC-06/EEP-05/ELR-05/LP-05/TMA-04). */
  const refresh = useCallback((surface: string) => {
    toast.success(`${surface} refreshed — showing the latest records`)
  }, [])

  return {
    employeeCertifications,
    enrollments,
    sponsorships,
    reimbursements,
    catalog,
    massApprovals,
    assignCertification,
    decideRequest,
    addCatalogProgram,
    approveEnrollments,
    refresh,
  }
}

export type LearningTeamStore = ReturnType<typeof useLearningTeam>
