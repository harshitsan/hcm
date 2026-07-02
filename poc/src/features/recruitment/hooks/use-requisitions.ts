import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { EngineLogEntry } from '../data/config'
import {
  seedRequisitions,
  type ApprovalStep,
  type Requisition,
  type RequisitionStatus,
} from '../data/requisitions'

export type RequisitionDraft = Omit<
  Requisition,
  'id' | 'status' | 'createdAt' | 'approvals' | 'history' | 'recruiter' | 'hiringManager'
>

interface UseRequisitionsArgs {
  actor: string
  nonBudgetedApprover: string
  logEngine: (
    engine: EngineLogEntry['engine'],
    event: string,
    detail: string
  ) => void
  notify: (event: string, recipient: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * In-memory requisition store — creation, multi-level approval, status
 * tracking, assignment and effective-dated history (TA-01…TA-04, TA-22,
 * TA-24, TA-27, TA-52).
 */
export function useRequisitions({
  actor,
  nonBudgetedApprover,
  logEngine,
  notify,
}: UseRequisitionsArgs) {
  const [requisitions, setRequisitions] =
    useState<Requisition[]>(seedRequisitions)

  /** Preserve the prior version with valid-from/valid-to dates (TA-22). */
  const withHistory = useCallback(
    (r: Requisition, change: string): Requisition => ({
      ...r,
      history: [
        ...r.history.map((h) =>
          h.validTo === null ? { ...h, validTo: today() } : h
        ),
        {
          id: `h-${crypto.randomUUID().slice(0, 6)}`,
          actor,
          change,
          validFrom: today(),
          validTo: null,
        },
      ],
    }),
    [actor]
  )

  const patch = useCallback(
    (id: string, change: string, fn: (r: Requisition) => Requisition) => {
      setRequisitions((prev) =>
        prev.map((r) => (r.id === id ? withHistory(fn(r), change) : r))
      )
    },
    [withHistory]
  )

  const addRequisition = useCallback(
    (draft: RequisitionDraft) => {
      const requisition: Requisition = {
        ...draft,
        id: `RRF-${1000 + Math.floor(Math.random() * 9000)}`,
        status: 'draft',
        recruiter: null,
        hiringManager: null,
        createdAt: today(),
        approvals: [],
        history: [
          {
            id: `h-${crypto.randomUUID().slice(0, 6)}`,
            actor,
            change: 'Created as draft',
            validFrom: today(),
            validTo: null,
          },
        ],
      }
      setRequisitions((prev) => [requisition, ...prev])
      toast.success(`Requisition ${requisition.id} saved as draft`)
      return requisition
    },
    [actor]
  )

  const updateRequisition = useCallback(
    (id: string, draft: RequisitionDraft) => {
      patch(id, 'Details updated', (r) => ({ ...r, ...draft }))
      toast.success('Requisition updated — prior version preserved in history')
    },
    [patch]
  )

  /** Submit a draft into the configured approval workflow (TA-01, TA-27, TA-52). */
  const submitRequisition = useCallback(
    (id: string) => {
      const req = requisitions.find((r) => r.id === id)
      if (!req || req.status !== 'draft') return
      const approvals: ApprovalStep[] = [
        { level: 1, approver: 'Sunita Patil', approverRole: 'HR Head', decision: 'pending' },
        { level: 2, approver: 'Rohit Bansal', approverRole: 'Finance Controller', decision: 'pending' },
        ...(req.nonBudgeted
          ? [
              {
                level: 3,
                approver: nonBudgetedApprover,
                approverRole: 'Non-Budgeted Position Approver',
                decision: 'pending' as const,
              },
            ]
          : []),
      ]
      patch(id, 'Submitted for approval', (r) => ({
        ...r,
        status: 'pending-approval',
        approvals,
      }))
      logEngine(
        'workflow',
        `Requisition ${id} submitted`,
        `Instantiated ${approvals.length}-level approval per approver graph v2${req.nonBudgeted ? ' (non-budgeted route added)' : ''}; routed to ${approvals[0].approver}`
      )
      notify('Requisition submitted for approval', approvals[0].approver)
      toast.success(`${id} submitted — routed to ${approvals[0].approver}`)
    },
    [requisitions, patch, logEngine, notify, nonBudgetedApprover]
  )

  /** Record an approval decision at the current pending level (TA-02). */
  const decideApproval = useCallback(
    (id: string, decision: 'approved' | 'rejected', comment: string) => {
      const req = requisitions.find((r) => r.id === id)
      if (!req) return
      const pending = req.approvals.find((a) => a.decision === 'pending')
      if (!pending) return
      const approvals = req.approvals.map((a) =>
        a.level === pending.level
          ? { ...a, decision, comment, decidedAt: new Date().toISOString() }
          : a
      )
      const remaining = approvals.some((a) => a.decision === 'pending')
      const nextStatus: RequisitionStatus =
        decision === 'rejected'
          ? 'rejected'
          : remaining
            ? 'pending-approval'
            : 'approved'
      patch(
        id,
        decision === 'rejected'
          ? `Rejected at level ${pending.level} by ${pending.approver}`
          : remaining
            ? `Approved at level ${pending.level}; routed to next approver`
            : 'Fully approved — eligible for sourcing',
        (r) => ({ ...r, status: nextStatus, approvals })
      )
      logEngine(
        'workflow',
        `Requisition ${id} ${decision} (L${pending.level})`,
        `Actor ${actor}; comment: "${comment || '—'}"; ${
          decision === 'rejected'
            ? 'returned to originator'
            : remaining
              ? `advanced to L${pending.level + 1}`
              : 'workflow complete'
        }`
      )
      if (decision === 'rejected') notify('Requisition returned', 'originator')
      toast.success(
        decision === 'rejected'
          ? `${id} rejected — originator notified`
          : remaining
            ? `Level ${pending.level} approved — routed onward`
            : `${id} fully approved`
      )
    },
    [requisitions, patch, logEngine, notify, actor]
  )

  /** Assign/reassign recruiter + hiring manager ownership (TA-04). */
  const assignOwners = useCallback(
    (id: string, recruiter: string, hiringManager: string) => {
      const req = requisitions.find((r) => r.id === id)
      const reassignment = Boolean(req?.recruiter || req?.hiringManager)
      patch(
        id,
        `Assigned to ${recruiter} (recruiter) / ${hiringManager} (hiring manager)`,
        (r) => ({
          ...r,
          recruiter,
          hiringManager,
          status: r.status === 'approved' ? 'sourcing' : r.status,
        })
      )
      notify(
        reassignment ? 'Requisition reassigned' : 'Requisition assigned',
        `${recruiter}, ${hiringManager}`
      )
      toast.success(
        reassignment
          ? 'Ownership reassigned — both parties notified'
          : `Assigned — appears in ${recruiter}'s queue`
      )
    },
    [requisitions, patch, notify]
  )

  const setStatus = useCallback(
    (id: string, status: RequisitionStatus, note?: string) => {
      patch(id, note ?? `Status changed to ${status}`, (r) => ({ ...r, status }))
      toast.success(`Requisition moved to ${status}`)
    },
    [patch]
  )

  /** Referential-integrity guard: block deletion under active applications (TA-24). */
  const deleteRequisition = useCallback(
    (id: string, hasActiveApplications: boolean) => {
      if (hasActiveApplications) {
        toast.error(
          `${id} has active applications — close or cancel it instead of deleting (referential integrity)`
        )
        return false
      }
      setRequisitions((prev) => prev.filter((r) => r.id !== id))
      toast.success(`${id} deleted`)
      return true
    },
    []
  )

  return {
    requisitions,
    addRequisition,
    updateRequisition,
    submitRequisition,
    decideApproval,
    assignOwners,
    setStatus,
    deleteRequisition,
  }
}

export type RequisitionsStore = ReturnType<typeof useRequisitions>
