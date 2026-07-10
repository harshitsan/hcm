import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { EngineLogEntry } from '../data/config'
import {
  EXPERIENCE_BY_LEVEL,
  seedRequisitions,
  type ApprovalStep,
  type HiringAs,
  type PositionLevel,
  type Requisition,
  type RequisitionPriority,
  type RequisitionStatus,
} from '../data/requisitions'

export type RequisitionDraft = Omit<
  Requisition,
  | 'id'
  | 'status'
  | 'createdAt'
  | 'approvals'
  | 'history'
  | 'recruiter'
  | 'hiringManager'
  | 'clarifications'
  | 'preClosure'
>

/** One row of the bulk requisition entry grid (Transactions → RRF bulk). */
export interface BulkRequisitionInput {
  title: string
  department: Requisition['department']
  positionLevel: PositionLevel
  headcount: number
  closingDate: string
  priority: RequisitionPriority
  location: Requisition['location']
  hiringAs: HiringAs
  functionalLocation: string
  reasonForHiring: string
}

interface UseRequisitionsArgs {
  actor: string
  nonBudgetedApprover: string
  logEngine: (
    engine: EngineLogEntry['engine'],
    event: string,
    detail: string
  ) => void
  notify: (event: string, recipient: string) => void
  /** Fired when the last pending level approves — used to auto-create a vacancy. */
  onFinalApproval?: (req: Requisition) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * In-memory requisition store — creation, multi-level approval, status
 * tracking, assignment and effective-dated history (TA-01…TA-04, TA-22,
 * TA-24, TA-27, TA-52), plus withdraw / pre-close / clarification /
 * resubmission / on-behalf-approval / bulk-entry flows from the RRF spec.
 */
export function useRequisitions({
  actor,
  nonBudgetedApprover,
  logEngine,
  notify,
  onFinalApproval,
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
        clarifications: [],
        preClosure: null,
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
      // Final approval auto-creates the vacancy (orchestrator hook).
      if (decision === 'approved' && !remaining)
        onFinalApproval?.({ ...req, status: 'approved', approvals })
    },
    [requisitions, patch, logEngine, notify, actor, onFinalApproval]
  )

  /** A higher approver records approval for an absent lower-level approver. */
  const approveOnBehalf = useCallback(
    (id: string, level: number, onBehalfBy: string, comment: string) => {
      const req = requisitions.find((r) => r.id === id)
      if (!req) return
      const step = req.approvals.find((a) => a.level === level)
      if (!step || step.decision !== 'pending') return
      const note = `Approved by ${onBehalfBy} on behalf${comment ? ` — ${comment}` : ''}`
      const approvals = req.approvals.map((a) =>
        a.level === level
          ? {
              ...a,
              decision: 'approved' as const,
              comment: note,
              decidedAt: new Date().toISOString(),
            }
          : a
      )
      const remaining = approvals.some((a) => a.decision === 'pending')
      patch(
        id,
        `Level ${level} approved by ${onBehalfBy} on behalf of ${step.approver}`,
        (r) => ({
          ...r,
          status: remaining ? 'pending-approval' : 'approved',
          approvals,
        })
      )
      logEngine(
        'workflow',
        `Requisition ${id} approved on behalf (L${level})`,
        `${onBehalfBy} acted for absent approver ${step.approver}; ${remaining ? 'workflow continues' : 'workflow complete'}`
      )
      notify('Approved on your behalf', step.approver)
      toast.success(
        remaining
          ? `Level ${level} approved on behalf of ${step.approver}`
          : `${id} fully approved (L${level} on behalf of ${step.approver})`
      )
      if (!remaining)
        onFinalApproval?.({ ...req, status: 'approved', approvals })
    },
    [requisitions, patch, logEngine, notify, onFinalApproval]
  )

  /** Withdraw the RRF — allowed from any status/stage by requester or approver. */
  const withdrawRequisition = useCallback(
    (id: string, by: string) => {
      patch(id, `Withdrawn by ${by}`, (r) => ({ ...r, status: 'withdrawn' }))
      logEngine(
        'workflow',
        `Requisition ${id} withdrawn`,
        `Withdrawn by ${by} — workflow halted at the current stage`
      )
      notify('Requisition withdrawn', 'approval chain')
      toast.success(`${id} withdrawn by ${by}`)
    },
    [patch, logEngine, notify]
  )

  /** Close the RRF early even if not all positions were hired. */
  const preCloseRequisition = useCallback(
    (id: string, newHeadcount: number, note: string) => {
      const req = requisitions.find((r) => r.id === id)
      if (!req) return
      patch(
        id,
        `Pre-closed early — positions reduced ${req.headcount} → ${newHeadcount}`,
        (r) => ({
          ...r,
          headcount: newHeadcount,
          status: 'closed',
          preClosure: {
            originalHeadcount: r.headcount,
            closedEarlyAt: today(),
            note,
          },
        })
      )
      logEngine(
        'workflow',
        `Requisition ${id} pre-closed`,
        `Headcount ${req.headcount} → ${newHeadcount}; note: "${note || '—'}"`
      )
      toast.success(`${id} pre-closed at ${newHeadcount} position(s)`)
    },
    [requisitions, patch, logEngine]
  )

  /** Approver asks the requester (or a previous-level approver) a question. */
  const askClarification = useCallback(
    (id: string, question: string, askedBy: string, askedOf: string) => {
      patch(id, `Clarification requested from ${askedOf}`, (r) => ({
        ...r,
        status: 'needs-clarification',
        clarifications: [
          ...r.clarifications,
          { question, askedBy, askedOf, askedAt: new Date().toISOString() },
        ],
      }))
      logEngine(
        'workflow',
        `Requisition ${id} needs clarification`,
        `${askedBy} asked ${askedOf}: "${question}"`
      )
      notify('Clarification requested on requisition', askedOf)
      toast.success(`Clarification sent to ${askedOf} — ${id} paused`)
    },
    [patch, logEngine, notify]
  )

  /** Fill the latest open question and resume the approval workflow. */
  const answerClarification = useCallback(
    (id: string, answer: string) => {
      const req = requisitions.find((r) => r.id === id)
      const open = req?.clarifications.filter((c) => !c.answer).at(-1)
      if (!req || !open) return
      patch(id, `Clarification answered for ${open.askedBy}`, (r) => {
        const idx = r.clarifications.reduce(
          (acc, c, i) => (!c.answer ? i : acc),
          -1
        )
        return {
          ...r,
          status: 'pending-approval',
          clarifications: r.clarifications.map((c, i) =>
            i === idx
              ? { ...c, answer, answeredAt: new Date().toISOString() }
              : c
          ),
        }
      })
      logEngine(
        'workflow',
        `Requisition ${id} clarification answered`,
        `Reply to ${open.askedBy}: "${answer}"; workflow resumed at pending level`
      )
      notify('Clarification answered', open.askedBy)
      toast.success(`Reply recorded — ${id} back in the approval queue`)
    },
    [requisitions, patch, logEngine, notify]
  )

  /** Restart the approval workflow for a rejected RRF. */
  const resubmitRequisition = useCallback(
    (id: string) => {
      const req = requisitions.find((r) => r.id === id)
      if (!req || req.status !== 'rejected') return
      patch(id, 'Resubmitted — workflow restarted', (r) => ({
        ...r,
        status: 'pending-approval',
        approvals: r.approvals.map((a) => ({
          ...a,
          decision: 'pending' as const,
          comment: undefined,
          decidedAt: undefined,
        })),
      }))
      logEngine(
        'workflow',
        `Requisition ${id} resubmitted`,
        `All ${req.approvals.length} approval levels reset to pending; routed to ${req.approvals[0]?.approver ?? 'L1'}`
      )
      notify('Requisition resubmitted for approval', req.approvals[0]?.approver ?? 'L1 approver')
      toast.success(`${id} resubmitted — workflow restarted at level 1`)
    },
    [requisitions, patch, logEngine, notify]
  )

  /** Bulk-create RRFs from the entry grid; optionally self-approved on submit. */
  const addRequisitions = useCallback(
    (
      inputs: BulkRequisitionInput[],
      autoApprove: boolean,
      approverName?: string
    ) => {
      const created: Requisition[] = inputs.map((input, i) => ({
        id: `RRF-${1000 + Math.floor(Math.random() * 900) * 10 + i}`,
        title: input.title,
        department: input.department,
        location: input.location,
        employeeClass: 'Full-time',
        hiringAs: input.hiringAs,
        replacementFor: null,
        headcount: input.headcount,
        description: `${input.title} — created via bulk requisition entry.`,
        requirements: '',
        nonBudgeted: false,
        confidential: false,
        priority: input.priority,
        positionLevel: input.positionLevel,
        experience: EXPERIENCE_BY_LEVEL[input.positionLevel],
        personalTraits: '',
        additionalSkills: '',
        reasonForHiring: input.reasonForHiring,
        functionalLocation: input.functionalLocation,
        comments: '',
        status: autoApprove ? 'approved' : 'draft',
        recruiter: null,
        hiringManager: null,
        custom: {},
        createdAt: today(),
        closingDate: input.closingDate,
        approvals: autoApprove
          ? [
              {
                level: 1,
                approver: approverName ?? actor,
                approverRole: 'Self-approver (bulk entry)',
                decision: 'approved' as const,
                comment: `Auto-approved on submission by ${approverName ?? actor}`,
                decidedAt: new Date().toISOString(),
              },
            ]
          : [],
        history: [
          {
            id: `h-${crypto.randomUUID().slice(0, 6)}`,
            actor,
            change: autoApprove
              ? `Bulk-created and auto-approved by ${approverName ?? actor}`
              : 'Bulk-created as draft',
            validFrom: today(),
            validTo: null,
          },
        ],
        clarifications: [],
        preClosure: null,
      }))
      setRequisitions((prev) => [...created, ...prev])
      logEngine(
        'workflow',
        `Bulk requisition entry (${created.length})`,
        autoApprove
          ? `All levels approved immediately — approver ${approverName ?? actor}`
          : 'Created as drafts pending submission'
      )
      toast.success(
        `${created.length} requisition${created.length === 1 ? '' : 's'} created${
          autoApprove ? ` and auto-approved by ${approverName ?? actor}` : ' as drafts'
        }`
      )
      return created
    },
    [actor, logEngine]
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
    addRequisitions,
    updateRequisition,
    submitRequisition,
    decideApproval,
    approveOnBehalf,
    withdrawRequisition,
    preCloseRequisition,
    askClarification,
    answerClarification,
    resubmitRequisition,
    assignOwners,
    setStatus,
    deleteRequisition,
  }
}

export type RequisitionsStore = ReturnType<typeof useRequisitions>
