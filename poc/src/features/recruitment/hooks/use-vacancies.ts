import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type {
  AssignmentMethod,
  EngineLogEntry,
  PostingApproverRule,
} from '../data/config'
import {
  seedPostings,
  seedVacancies,
  type Posting,
  type Vacancy,
  type VacancyStatus,
} from '../data/vacancies'

interface UseVacanciesArgs {
  assignmentMethod: AssignmentMethod
  postingApproverRules: PostingApproverRule[]
  logEngine: (
    engine: EngineLogEntry['engine'],
    event: string,
    detail: string
  ) => void
  notify: (event: string, recipient: string) => void
}

export type PostingDraft = Omit<
  Posting,
  'id' | 'createdDate' | 'status' | 'approver' | 'decidedAt'
>

/**
 * Vacancy lifecycle + job postings store (TA-34…TA-38). Vacancies track a
 * separate lifecycle from their parent requisition; postings route through
 * configured posting-source approvers before going live.
 */
export function useVacancies({
  assignmentMethod,
  postingApproverRules,
  logEngine,
  notify,
}: UseVacanciesArgs) {
  const [vacancies, setVacancies] = useState<Vacancy[]>(seedVacancies)
  const [postings, setPostings] = useState<Posting[]>(seedPostings)

  const setVacancyStatus = useCallback(
    (id: string, status: VacancyStatus) => {
      setVacancies((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      )
      toast.success(`Vacancy moved to ${status}`)
    },
    []
  )

  /** Spawn a vacancy from a fully-approved requisition (Kensium: final RRF
   * approval creates the vacancy for recruiter assignment). */
  const addVacancy = useCallback(
    (
      draft: Omit<
        Vacancy,
        'id' | 'code' | 'createdDate' | 'recruiters' | 'status'
      >
    ) => {
      const vacancy: Vacancy = {
        ...draft,
        id: `v-${crypto.randomUUID().slice(0, 6)}`,
        code: `VAC-${2200 + vacancies.length + 1}`,
        createdDate: new Date().toISOString().slice(0, 10),
        recruiters: [],
        status: 'new',
      }
      setVacancies((prev) => [vacancy, ...prev])
      logEngine(
        'workflow',
        `Vacancy ${vacancy.code} created`,
        `Spawned from approved requisition ${draft.rrfId} — awaiting recruiter assignment (${assignmentMethod} method)`
      )
      notify('Vacancy created from approved requisition', 'Recruitment team')
      toast.success(`Vacancy ${vacancy.code} created from ${draft.rrfId}`)
    },
    [vacancies.length, assignmentMethod, logEngine, notify]
  )

  /** Assign recruiters per the configured method (TA-35). */
  const assignRecruiter = useCallback(
    (id: string, recruiter: string) => {
      setVacancies((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                recruiters: [recruiter],
                status: v.status === 'new' ? 'assigned' : v.status,
              }
            : v
        )
      )
      logEngine(
        'rules',
        'Vacancy assigned',
        `Assignment method "${assignmentMethod}" applied — recruiter ${recruiter} selected`
      )
      toast.success(`Assigned to ${recruiter} (${assignmentMethod} method)`)
    },
    [assignmentMethod, logEngine]
  )

  /** Create a posting; approver rules decide whether it needs sign-off (TA-36, TA-38). */
  const addPosting = useCallback(
    (draft: PostingDraft) => {
      const rule = postingApproverRules.find(
        (r) => r.postingMode === draft.postingMode || r.postingMode === 'Both'
      )
      const posting: Posting = {
        ...draft,
        id: `p-${crypto.randomUUID().slice(0, 6)}`,
        createdDate: new Date().toISOString().slice(0, 10),
        status: rule ? 'pending-approval' : 'approved',
      }
      setPostings((prev) => [posting, ...prev])
      if (rule) {
        logEngine(
          'workflow',
          `Posting for ${draft.vacancyCode} routed`,
          `Matched posting-source rule (${rule.postingMode}) — routed to ${rule.approvers.join(', ')}; cannot go live until approved`
        )
        notify('Posting submitted for approval', rule.approvers.join(', '))
        toast.success(
          `Posting created — pending approval by ${rule.approvers.join(', ')}`
        )
      } else {
        toast.success('Posting created')
      }
    },
    [postingApproverRules, logEngine, notify]
  )

  const decidePosting = useCallback(
    (id: string, decision: 'approved' | 'rejected', approver: string) => {
      setPostings((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: decision === 'approved' ? 'live' : 'rejected',
                approver,
                decidedAt: new Date().toISOString().slice(0, 10),
              }
            : p
        )
      )
      logEngine(
        'workflow',
        `Posting ${decision}`,
        `Decision by ${approver} recorded with timestamp; posting ${decision === 'approved' ? 'is now live' : 'cannot be published'}`
      )
      toast.success(
        decision === 'approved' ? 'Posting approved — now live' : 'Posting rejected'
      )
    },
    [logEngine]
  )

  return {
    vacancies,
    postings,
    addVacancy,
    setVacancyStatus,
    assignRecruiter,
    addPosting,
    decidePosting,
  }
}

export type VacanciesStore = ReturnType<typeof useVacancies>
