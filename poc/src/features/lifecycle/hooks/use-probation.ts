import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type ProbationDecisionTable } from '../data/config'
import {
  seedPeerReviews,
  seedPeriodicReviews,
  seedProbation,
  type PeerReview,
  type PeriodicReview,
  type ProbationCase,
  type ProbationOutcome,
} from '../data/probation'
import { addDays, pendingStep, shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  /** Follow-through for the “Initiate Separation” outcome (opens an exit). */
  onSeparation: (probationCase: ProbationCase) => void
}

/** Suggested outcome derived deterministically from the decision table. */
export function deriveOutcome(
  c: ProbationCase,
  table: ProbationDecisionTable
): ProbationOutcome | null {
  const scores = c.criteria.map((cr) => cr.score)
  if (scores.some((s) => s === null)) return null
  const avg =
    scores.reduce<number>((sum, s) => sum + (s ?? 0), 0) / scores.length
  const row = table.rows.find((r) => avg >= r.minScore && avg <= r.maxScore)
  return row?.outcome ?? null
}

/** Probation confirmation store + peer / periodic reviews. */
export function useProbation({ log, notify, onSeparation }: Deps) {
  const [cases, setCases] = useState<ProbationCase[]>(seedProbation)
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>(seedPeerReviews)
  const [periodicReviews, setPeriodicReviews] =
    useState<PeriodicReview[]>(seedPeriodicReviews)

  const patch = useCallback(
    (id: string, fn: (c: ProbationCase) => ProbationCase) => {
      setCases((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))
    },
    []
  )

  const startReview = useCallback(
    (c: ProbationCase) => {
      patch(c.id, (prev) => ({ ...prev, status: 'in-review' }))
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: 'Confirmation review initiated',
        target: `${c.id} · ${c.employeeName}`,
        outcome: `Evaluation opened against decision table ${c.decisionTableVersion}`,
        onBehalfOf: null,
      })
      toast.success(`Evaluation started for ${c.employeeName}`)
    },
    [log, patch]
  )

  const setScore = useCallback(
    (id: string, criterionId: string, score: number) => {
      patch(id, (prev) => ({
        ...prev,
        criteria: prev.criteria.map((cr) =>
          cr.id === criterionId ? { ...cr, score } : cr
        ),
      }))
    },
    [patch]
  )

  const submitDecision = useCallback(
    (c: ProbationCase, outcome: ProbationOutcome) => {
      if (c.criteria.some((cr) => cr.score === null)) {
        toast.error('Score every evaluation criterion before submitting a decision')
        return
      }
      patch(c.id, (prev) => ({
        ...prev,
        decision: outcome,
        status: 'pending-approval',
        approvals: prev.approvals.map((s) => ({
          ...s,
          status: 'pending' as const,
          actedOn: null,
          note: null,
        })),
      }))
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Decision submitted (${outcome})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Routed to Manager → Department Head → HR (not yet applied)',
        onBehalfOf: null,
      })
      notify({
        recipient: c.manager,
        kind: 'approval',
        title: `Probation decision awaiting approval: ${c.employeeName}`,
        body: `Proposed outcome “${outcome}” requires your approval.`,
      })
      toast.success(`Decision “${outcome}” routed for approval`)
    },
    [log, notify, patch]
  )

  const applyOutcome = useCallback(
    (c: ProbationCase) => {
      const outcome = c.decision
      if (outcome === 'Confirm') {
        patch(c.id, (prev) => ({ ...prev, status: 'confirmed' }))
        toast.success(
          `${c.employeeName} confirmed — Employee Confirmation letter template queued`
        )
      } else if (outcome === 'Extend') {
        const extendedTo = addDays(c.dueDate, 90)
        patch(c.id, (prev) => ({
          ...prev,
          status: 'extended',
          extendedTo,
          criteria: prev.criteria.map((cr) => ({ ...cr, score: null })),
        }))
        toast.success(
          `Probation extended to ${extendedTo} — new evaluation cycle scheduled`
        )
      } else if (outcome === 'Initiate Separation') {
        patch(c.id, (prev) => ({ ...prev, status: 'separation-initiated' }))
        onSeparation(c)
        toast.success('Separation initiated — exit workflow opened')
      }
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Outcome applied (${outcome ?? 'n/a'})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome:
          outcome === 'Extend'
            ? `New probation end ${addDays(c.dueDate, 90)}`
            : outcome === 'Initiate Separation'
              ? 'Exit management workflow initiated'
              : 'Employee status set to confirmed',
        onBehalfOf: null,
      })
    },
    [log, onSeparation, patch]
  )

  const approveStep = useCallback(
    (c: ProbationCase) => {
      const step = pendingStep(c.approvals)
      if (!step) return
      const approvals = c.approvals.map((s) =>
        s === step ? { ...s, status: 'approved' as const, actedOn: todayISO() } : s
      )
      const done = approvals.every((s) => s.status === 'approved')
      patch(c.id, (prev) => ({ ...prev, approvals }))
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Approval granted (${step.role})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: done ? 'All approvals granted' : 'Awaiting next approver',
        onBehalfOf: null,
      })
      if (done) {
        applyOutcome({ ...c, approvals })
      } else {
        toast.success(`${step.role} approved — routed to next approver`)
      }
    },
    [applyOutcome, log, patch]
  )

  const rejectStep = useCallback(
    (c: ProbationCase, note: string) => {
      const step = pendingStep(c.approvals)
      if (!step) return
      patch(c.id, (prev) => ({
        ...prev,
        status: 'in-review',
        approvals: prev.approvals.map((s) =>
          s === step
            ? { ...s, status: 'rejected' as const, actedOn: todayISO(), note }
            : s
        ),
      }))
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Approval rejected (${step.role})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Outcome not applied — returned for re-evaluation',
        onBehalfOf: null,
      })
      toast.info('Decision rejected — outcome was not applied')
    },
    [log, patch]
  )

  const requestPeerReview = useCallback(
    (employeeName: string, reviewer: string, requestedBy: string) => {
      const review: PeerReview = {
        id: shortId('peer'),
        employeeName,
        employeeActive: true,
        reviewer,
        requestedBy,
        reviewDate: addDays(todayISO(), 7),
        status: 'Pending Approval',
        feedback: null,
      }
      setPeerReviews((prev) => [review, ...prev])
      notify({
        recipient: reviewer,
        kind: 'task',
        title: `Peer review requested for ${employeeName}`,
        body: `Please submit your peer feedback by ${review.reviewDate}.`,
      })
      toast.success(`Peer review requested from ${reviewer}`)
    },
    [notify]
  )

  const submitPeerReview = useCallback(
    (id: string, feedback: string) => {
      setPeerReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'Submitted', feedback } : r
        )
      )
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: 'Peer review submitted',
        target: id,
        outcome: 'Feedback recorded for the confirmation decision',
        onBehalfOf: null,
      })
      toast.success('Peer feedback submitted')
    },
    [log]
  )

  const submitPeriodicReview = useCallback(
    (id: string, notes: string) => {
      setPeriodicReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Submitted', notes } : r))
      )
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: 'Periodic review submitted',
        target: id,
        outcome: 'Interim feedback available to the confirmation review',
        onBehalfOf: null,
      })
      toast.success('Periodic review submitted')
    },
    [log]
  )

  return {
    cases,
    peerReviews,
    periodicReviews,
    startReview,
    setScore,
    submitDecision,
    approveStep,
    rejectStep,
    requestPeerReview,
    submitPeerReview,
    submitPeriodicReview,
  }
}

export type ProbationStore = ReturnType<typeof useProbation>
