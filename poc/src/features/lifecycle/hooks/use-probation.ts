import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type ProbationDecisionTable } from '../data/config'
import {
  D6_NOTE,
  seedPeerReviews,
  seedPeriodicReviews,
  seedProbation,
  type PeerReview,
  type PeriodicReview,
  type ProbationCase,
  type ProbationHistoryEntry,
  type ProbationOutcome,
} from '../data/probation'
import { addDays, addMonths, pendingStep, shortId, todayISO } from '../data/shared'
import {
  openDisciplinaryCaseFor,
  type DisciplinaryCase,
} from '../data/disciplinary'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  /**
   * Live disciplinary cases — an employee with an open case cannot be
   * Confirmed until it is resolved (Extend remains available).
   */
  disciplinaryCases?: DisciplinaryCase[]
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

/** Timeline entry stamped with today's date (payroll = display-only D6 line). */
function historyEntry(text: string, payroll?: boolean): ProbationHistoryEntry {
  return {
    id: shortId('h'),
    date: todayISO(),
    text,
    ...(payroll ? { payroll: true } : {}),
  }
}

/** Probation confirmation store + peer / periodic reviews. */
export function useProbation({
  log,
  notify,
  disciplinaryCases,
  onSeparation,
}: Deps) {
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
      patch(c.id, (prev) => ({
        ...prev,
        status: 'in-review',
        history: [
          ...prev.history,
          historyEntry(
            `Confirmation review initiated — evaluation opened against decision table ${prev.decisionTableVersion}.`
          ),
        ],
      }))
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

  /**
   * The open disciplinary case gating this employee's confirmation, if any.
   * While one exists, the Confirm outcome is blocked — Extend stays available.
   */
  const confirmationGate = useCallback(
    (c: ProbationCase) =>
      openDisciplinaryCaseFor(c.employeeName, disciplinaryCases ?? []),
    [disciplinaryCases]
  )

  const submitDecision = useCallback(
    (
      c: ProbationCase,
      outcome: ProbationOutcome,
      details?: { extensionMonths?: number; reason?: string }
    ) => {
      if (c.criteria.some((cr) => cr.score === null)) {
        toast.error('Score every evaluation criterion before submitting a decision')
        return
      }
      if (outcome === 'Confirm') {
        const gate = confirmationGate(c)
        if (gate) {
          toast.error(
            `Confirmation gated — open disciplinary case (${gate.id}, ${gate.actionType}). Resolve the case to release the gate; Extend remains available.`
          )
          log({
            company: 'Aurora Software India',
            module: 'Probation',
            action: 'Confirmation blocked by disciplinary gate',
            target: `${c.id} · ${c.employeeName}`,
            outcome: `Open disciplinary case ${gate.id} (${gate.actionType}) must be resolved first`,
            onBehalfOf: null,
          })
          return
        }
      }
      const extensionMonths =
        outcome === 'Extend' ? (details?.extensionMonths ?? 3) : null
      const outcomeReason = details?.reason?.trim() || null
      patch(c.id, (prev) => ({
        ...prev,
        decision: outcome,
        status: 'pending-approval',
        extensionMonths,
        outcomeReason,
        approvals: prev.approvals.map((s) => ({
          ...s,
          status: 'pending' as const,
          actedOn: null,
          note: null,
        })),
        history: [
          ...prev.history,
          historyEntry(
            `Decision “${outcome}”${
              outcome === 'Extend' ? ` (${extensionMonths} month(s))` : ''
            } submitted and routed for approval.${
              outcomeReason ? ` Reason: ${outcomeReason}` : ''
            }`
          ),
        ],
      }))
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Decision submitted (${outcome})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: outcomeReason
          ? `Routed to Manager → Department Head → HR (not yet applied) — reason: ${outcomeReason}`
          : 'Routed to Manager → Department Head → HR (not yet applied)',
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
    [confirmationGate, log, notify, patch]
  )

  const applyOutcome = useCallback(
    (c: ProbationCase) => {
      const outcome = c.decision
      let logOutcome = 'Employee status set to confirmed'
      if (outcome === 'Confirm') {
        patch(c.id, (prev) => ({
          ...prev,
          status: 'confirmed',
          confirmedOn: todayISO(),
          history: [
            ...prev.history,
            historyEntry(
              'Employment status updated to Confirmed — Employee Confirmation letter queued.'
            ),
            historyEntry(`Payroll notified — ${D6_NOTE}.`, true),
          ],
        }))
        notify({
          recipient: 'Payroll computation (D6)',
          kind: 'task',
          title: `Confirmation pay implication: ${c.employeeName}`,
          body: `${c.employeeName} (${c.employeeCode}) confirmed effective ${todayISO()}. ${D6_NOTE}.`,
        })
        toast.success(
          `${c.employeeName} confirmed — payroll computation (D6) notified of any pay implication`
        )
      } else if (outcome === 'Extend') {
        const months = c.extensionMonths ?? 3
        const extendedTo = addMonths(c.extendedTo ?? c.dueDate, months)
        logOutcome = `New probation end ${extendedTo}`
        patch(c.id, (prev) => ({
          ...prev,
          status: 'extended',
          extendedTo,
          criteria: prev.criteria.map((cr) => ({ ...cr, score: null })),
          history: [
            ...prev.history,
            historyEntry(
              `Probation extended by ${months} month(s) — new probation end date ${extendedTo}. Status stays Probation; a fresh evaluation cycle is scheduled.`
            ),
            historyEntry(`Payroll notified — ${D6_NOTE}.`, true),
          ],
        }))
        toast.success(
          `Probation extended to ${extendedTo} — new evaluation cycle scheduled`
        )
      } else if (outcome === 'Initiate Separation') {
        logOutcome = 'Exit management workflow initiated'
        patch(c.id, (prev) => ({
          ...prev,
          status: 'separation-initiated',
          history: [
            ...prev.history,
            historyEntry(
              `Separation initiated — Probation Separation exit case opened and handed to the Exits workflow.${
                c.outcomeReason ? ` Reason: ${c.outcomeReason}` : ''
              }`
            ),
            historyEntry(`Payroll notified — ${D6_NOTE}.`, true),
          ],
        }))
        onSeparation(c)
        toast.success('Separation initiated — exit workflow opened')
      }
      log({
        company: 'Aurora Software India',
        module: 'Probation',
        action: `Outcome applied (${outcome ?? 'n/a'})`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: logOutcome,
        onBehalfOf: null,
      })
    },
    [log, notify, onSeparation, patch]
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
        history: [
          ...prev.history,
          historyEntry(
            `Approval rejected (${step.role}) — outcome not applied, returned for re-evaluation.`
          ),
        ],
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
    confirmationGate,
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
