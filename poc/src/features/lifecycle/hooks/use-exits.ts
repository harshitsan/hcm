import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  EXIT_CHAIN,
  EXIT_TODAY,
  MAX_BACKDATE_DAYS,
  experienceLetterBlocker,
  isFormalResignation,
  seedExits,
  type ClearanceStatus,
  type ExitCase,
  type ExitCommentVisibility,
  type ExitConditionStatus,
  type ExitTaskAssignMode,
  type ExitTaskTiming,
  type SuspensionReviewOutcome,
  type TerminationExitType,
} from '../data/exits'
import { assetClearanceBlocker } from '../data/asset-clearance'
import {
  type ClearanceApproverChain,
  type ExitDocumentToTrack,
  type ExitQuestionDef,
  type ExitTaskDef,
  type NoticeRule,
} from '../data/config'
import { addDays, makeSteps, pendingStep, shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

export interface ExitDraft {
  employeeName: string
  employeeCode: string
  department: string
  location: string
  positionLevel: string
  exitType: string
  reason: string
  raisedBy: 'Employee' | 'Admin (proxy)'
  /* Additive — richer employee resignation details (all optional). */
  requestedLwd?: string
  messageToHr?: string
  supportingDocuments?: string[]
  /** When the exit originates from a disciplinary referral, links the case (case ↔ exit). */
  linkedDisciplinaryCaseId?: string
}

/** Payload for the coordinator's "Enable Exit" transaction. */
export interface EnableExitInput {
  employeeName: string
  employeeCode: string
  department: string
  location: string
  positionLevel: string
  exitType: string
  /** Backdatable — capped at the per-type/max backdate window. */
  resignationDate: string
  requestedLwd: string
  reason: string
  supportingDocuments: string[]
  /** Seeded from the exit type's configured documents-to-track. */
  documentsToTrack?: ExitDocumentToTrack[]
}

/** Payload for the employee's formal resignation form. */
export interface ResignationFormInput {
  requestedLwd: string
  reason: string
  messageToHr: string
  documents: string[]
  /** questionId → answer for the position/exit-type questionnaire. */
  answers: Record<string, string>
  comment?: string
}

/** Payload for the admin-initiated Terminate flow. */
export interface TerminationDraft {
  employeeName: string
  employeeCode: string
  department: string
  location: string
  positionLevel: string
  exitType: TerminationExitType
  /** Not defaulted from notice rules; null for Suspension. */
  proposedLwd: string | null
  reason: string
  documents: string[]
  /** HR-answered inline questionnaire. */
  answers: { question: string; answer: string }[]
  comment: string
  policiesDeviated?: string[]
  abscondingDate?: string | null
  suspensionFrom?: string | null
  suspensionTill?: string | null
  withPay?: boolean
}

/** Payload for the exit task assignment dialog. */
export interface AssignTaskInput {
  name: string
  description: string
  assignee: string
  mode: ExitTaskAssignMode
  timing: ExitTaskTiming
  daysAfterApproval: number | null
}

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  noticeRules: NoticeRule[]
  clearanceChains: ClearanceApproverChain[]
  exitQuestions: ExitQuestionDef[]
  exitTaskDefs: ExitTaskDef[]
  questionnaireEnabled: boolean
}

const COMPANY = 'Aurora Software India'

/** Exit management store — approval, notice period, parallel clearance. */
export function useExits({
  log,
  notify,
  noticeRules,
  clearanceChains,
  exitQuestions,
  exitTaskDefs,
  questionnaireEnabled,
}: Deps) {
  const [exits, setExits] = useState<ExitCase[]>(seedExits)

  const patch = useCallback(
    (id: string, fn: (e: ExitCase) => ExitCase) => {
      setExits((prev) => prev.map((e) => (e.id === id ? fn(e) : e)))
    },
    []
  )

  /** Notice period derived from the rule matching location/dept/position. */
  const deriveNotice = useCallback(
    (draft: Pick<ExitDraft, 'location' | 'department' | 'positionLevel'>) => {
      const rule = noticeRules.find(
        (r) =>
          r.locations.includes(draft.location) &&
          r.departments.includes(draft.department) &&
          r.positionLevels.includes(draft.positionLevel)
      )
      return { days: rule?.durationDays ?? 30, ruleName: rule?.name ?? 'Default (30 days)' }
    },
    [noticeRules]
  )

  const defaultClearances = useCallback(
    () =>
      clearanceChains.map((c) => ({
        functionName: c.functionName,
        owner: c.hierarchy[0] ?? 'Unassigned',
        status: 'pending' as const,
        note: null,
      })),
    [clearanceChains]
  )

  const tasksForType = useCallback(
    (exitType: string) =>
      exitTaskDefs
        .filter((t) => t.exitTypes.includes(exitType))
        .map((t) => ({
          id: t.id,
          name: t.name,
          owner: t.responsible,
          due: t.timing,
          done: false,
        })),
    [exitTaskDefs]
  )

  const questionnaireForType = useCallback(
    (exitType: string) =>
      questionnaireEnabled
        ? exitQuestions
            .filter((q) => q.exitTypes.includes(exitType))
            .map((q) => ({
              questionId: q.id,
              question: q.text,
              responder: q.responder,
              mandatory: q.mandatory,
              answer: null,
            }))
        : [],
    [exitQuestions, questionnaireEnabled]
  )

  const addExit = useCallback(
    (draft: ExitDraft) => {
      const notice = deriveNotice(draft)
      const derivedLwd = addDays(todayISO(), notice.days)
      const exit: ExitCase = {
        ...draft,
        id: shortId('ext'),
        requestedOn: todayISO(),
        lastWorkingDay: derivedLwd,
        noticePeriodDays: notice.days,
        status: 'pending-approval',
        approvals: makeSteps(EXIT_CHAIN),
        clearances: defaultClearances(),
        tasks: tasksForType(draft.exitType),
        questionnaire: questionnaireForType(draft.exitType),
        questionnaireSubmitted: false,
        resignationDate: todayISO(),
        defaultLwd: derivedLwd,
        policyLwd: derivedLwd,
        requestedLwd: draft.requestedLwd ?? derivedLwd,
        approvedLwd: null,
        resignationSubmitted: true,
        messageToHr: draft.messageToHr ?? null,
        supportingDocuments: (draft.supportingDocuments ?? []).map((name) => ({
          id: shortId('sd'),
          name,
          uploadedBy: draft.employeeName,
          uploadedOn: todayISO(),
        })),
        comments: draft.linkedDisciplinaryCaseId
          ? [
              {
                id: shortId('cmt'),
                author: 'System',
                text: `Opened from disciplinary case ${draft.linkedDisciplinaryCaseId} — see the Disciplinary tab for the originating record and its history.`,
                visibility: 'hr-managers' as const,
                on: todayISO(),
              },
            ]
          : undefined,
      }
      setExits((prev) => [exit, ...prev])
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit request submitted',
        target: `${exit.id} · ${draft.employeeName}`,
        outcome: `Pending approval · ${notice.days} day notice derived from “${notice.ruleName}”`,
        onBehalfOf: draft.raisedBy === 'Admin (proxy)' ? draft.employeeName : null,
      })
      toast.success(
        `Exit request submitted — notice period ${notice.days} days (${notice.ruleName})`
      )
      return exit
    },
    [defaultClearances, deriveNotice, log, questionnaireForType, tasksForType]
  )

  /** Exit coordinator "Enable Exit" — case waits for the resignation form. */
  const enableExit = useCallback(
    (input: EnableExitInput) => {
      const earliest = addDays(EXIT_TODAY, -MAX_BACKDATE_DAYS)
      if (input.resignationDate < earliest) {
        toast.error(
          `Resignation date can be backdated at most ${MAX_BACKDATE_DAYS} days (on or after ${earliest})`
        )
        return null
      }
      const notice = deriveNotice(input)
      const policyLwd = addDays(input.resignationDate, notice.days)
      const exit: ExitCase = {
        id: shortId('ext'),
        employeeName: input.employeeName,
        employeeCode: input.employeeCode,
        department: input.department,
        location: input.location,
        positionLevel: input.positionLevel,
        exitType: input.exitType,
        reason: input.reason,
        requestedOn: todayISO(),
        lastWorkingDay: policyLwd,
        noticePeriodDays: notice.days,
        status: 'exit-enabled',
        approvals: makeSteps(EXIT_CHAIN),
        clearances: defaultClearances(),
        tasks: tasksForType(input.exitType),
        questionnaire: questionnaireForType(input.exitType),
        questionnaireSubmitted: false,
        raisedBy: 'Admin (proxy)',
        resignationDate: input.resignationDate,
        defaultLwd: policyLwd,
        policyLwd,
        requestedLwd: input.requestedLwd,
        approvedLwd: null,
        resignationSubmitted: false,
        supportingDocuments: input.supportingDocuments.map((name) => ({
          id: shortId('sd'),
          name,
          uploadedBy: 'Exit Coordinator',
          uploadedOn: todayISO(),
        })),
        trackedDocuments: (input.documentsToTrack ?? []).map((d) => ({
          id: shortId('xd'),
          name: d.name,
          collectWhen: d.collectWhen,
          status: 'pending' as const,
        })),
      }
      setExits((prev) => [exit, ...prev])
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit enabled',
        target: `${exit.id} · ${input.employeeName}`,
        outcome: `Awaiting the employee's resignation form · policy LWD ${policyLwd} (${notice.days} day notice)`,
        onBehalfOf: input.employeeName,
      })
      notify({
        recipient: input.employeeName,
        kind: 'task',
        title: 'Exit enabled — resignation form pending',
        body: 'Your exit coordinator has enabled an exit for you. Please submit the formal resignation form.',
      })
      toast.success(`Exit enabled for ${input.employeeName} — resignation form requested`)
      return exit
    },
    [defaultClearances, deriveNotice, log, notify, questionnaireForType, tasksForType]
  )

  /** Disable an enabled exit before the resignation form is submitted. */
  const disableExit = useCallback(
    (e: ExitCase, reason: string) => {
      if (!reason.trim()) {
        toast.error('A reason is mandatory to disable an exit')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        status: 'disabled',
        disabledReason: reason.trim(),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit disabled',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `Case cancelled by the exit coordinator — reason: ${reason.trim()}`,
        onBehalfOf: e.employeeName,
      })
      notify({
        recipient: e.employeeName,
        kind: 'reminder',
        title: 'Exit disabled',
        body: `Your enabled exit was disabled by the exit coordinator: ${reason.trim()}`,
      })
      toast.info('Exit disabled — reason recorded in the audit trail')
    },
    [log, notify, patch]
  )

  /** Employee submits the formal resignation form → pending approval. */
  const submitResignation = useCallback(
    (e: ExitCase, input: ResignationFormInput) => {
      const missing = e.questionnaire.filter(
        (q) =>
          q.responder === 'Employee' &&
          q.mandatory &&
          !(input.answers[q.questionId] ?? q.answer ?? '').trim()
      )
      if (missing.length > 0) {
        toast.error(
          `Answer all mandatory questionnaire questions first (${missing.length} remaining)`
        )
        return false
      }
      patch(e.id, (prev) => ({
        ...prev,
        status: 'pending-approval',
        requestedLwd: input.requestedLwd,
        reason: input.reason,
        messageToHr: input.messageToHr.trim() ? input.messageToHr.trim() : prev.messageToHr ?? null,
        resignationSubmitted: true,
        questionnaire: prev.questionnaire.map((q) =>
          input.answers[q.questionId] !== undefined
            ? { ...q, answer: input.answers[q.questionId] }
            : q
        ),
        supportingDocuments: [
          ...(prev.supportingDocuments ?? []),
          ...input.documents.map((name) => ({
            id: shortId('sd'),
            name,
            uploadedBy: prev.employeeName,
            uploadedOn: todayISO(),
          })),
        ],
        comments: input.comment?.trim()
          ? [
              ...(prev.comments ?? []),
              {
                id: shortId('xm'),
                author: prev.employeeName,
                text: input.comment.trim(),
                visibility: 'everyone' as const,
                on: todayISO(),
              },
            ]
          : prev.comments,
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Resignation form submitted',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `Requested LWD ${input.requestedLwd} · routed to the exit approval workflow`,
        onBehalfOf: null,
      })
      toast.success('Resignation submitted — case moved to pending approval')
      return true
    },
    [log, patch]
  )

  const approveStep = useCallback(
    (e: ExitCase, onBehalfBy?: string) => {
      const step = pendingStep(e.approvals)
      if (!step) return
      const note = onBehalfBy && onBehalfBy !== step.approver
        ? `Approved by ${onBehalfBy} on behalf of ${step.approver}`
        : step.note
      const approvals = e.approvals.map((s) =>
        s === step
          ? { ...s, status: 'approved' as const, actedOn: todayISO(), note: note ?? null }
          : s
      )
      const done = approvals.every((s) => s.status === 'approved')
      // Final approver's LWD wins within the same hierarchy.
      const recs = e.lwdRecommendations ?? []
      const finalLwd = done
        ? recs[recs.length - 1]?.lwd ?? e.requestedLwd ?? e.lastWorkingDay
        : null
      patch(e.id, (prev) => {
        if (!done) return { ...prev, approvals }
        if (prev.isWithdrawalRequest)
          return {
            ...prev,
            approvals,
            status: 'withdrawn',
            isWithdrawalRequest: false,
          }
        if (prev.revokeInProgress)
          return {
            ...prev,
            approvals,
            status: 'closed',
            revokeInProgress: false,
          }
        return {
          ...prev,
          approvals,
          status: 'approved',
          approvedLwd: finalLwd,
          lastWorkingDay: finalLwd ?? prev.lastWorkingDay,
        }
      })
      log({
        company: COMPANY,
        module: 'Exit',
        action: `Approval granted (${step.role})`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: done
          ? e.isWithdrawalRequest
            ? 'Withdrawal approved — resignation withdrawn'
            : e.revokeInProgress
              ? 'Revoke approved — exit case closed'
              : `Exit approved — LWD finalized as ${finalLwd}`
          : 'Awaiting next approver',
        onBehalfOf: onBehalfBy && onBehalfBy !== step.approver ? step.approver : null,
      })
      if (done) {
        if (e.isWithdrawalRequest) {
          notify({
            recipient: e.employeeName,
            kind: 'approval',
            title: 'Resignation withdrawn',
            body: 'Your withdrawal request was approved — the resignation is withdrawn.',
          })
          toast.success('Withdrawal approved — resignation withdrawn')
        } else if (e.revokeInProgress) {
          toast.success('Revoke approved through the full workflow — exit case closed')
        } else {
          notify({
            recipient: e.employeeName,
            kind: 'approval',
            title: 'Exit request approved',
            body: `Your exit is approved. Approved last working day: ${finalLwd}.`,
          })
          toast.success(`Exit approved — LWD ${finalLwd}`)
        }
      } else {
        toast.success(
          onBehalfBy && onBehalfBy !== step.approver
            ? `${step.role} step approved on behalf of ${step.approver}`
            : `${step.role} approved`
        )
      }
    },
    [log, notify, patch]
  )

  const rejectStep = useCallback(
    (e: ExitCase, note: string) => {
      if (isFormalResignation(e.exitType)) {
        toast.error(
          'A formal resignation cannot be rejected — discuss withdrawal with the employee instead'
        )
        return
      }
      const step = pendingStep(e.approvals)
      if (!step) return
      patch(e.id, (prev) => ({
        ...prev,
        status: 'rejected',
        approvals: prev.approvals.map((s) =>
          s === step
            ? { ...s, status: 'rejected' as const, actedOn: todayISO(), note }
            : s
        ),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: `Approval rejected (${step.role})`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: 'Exit request returned',
        onBehalfOf: null,
      })
      toast.info('Exit request rejected')
    },
    [log, patch]
  )

  /** Current-step approver records their recommended LWD. */
  const suggestLwd = useCallback(
    (e: ExitCase, lwd: string) => {
      const step = pendingStep(e.approvals)
      if (!step) {
        toast.error('No pending approval step to attach a suggested LWD to')
        return
      }
      patch(e.id, (prev) => {
        const rest = (prev.lwdRecommendations ?? []).filter(
          (r) => r.approver !== step.approver
        )
        return {
          ...prev,
          lwdRecommendations: [
            ...rest,
            { role: step.role, approver: step.approver, lwd, on: todayISO() },
          ],
        }
      })
      log({
        company: COMPANY,
        module: 'Exit',
        action: `LWD suggested (${step.role})`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${step.approver} recommended LWD ${lwd}`,
        onBehalfOf: null,
      })
      toast.success(`Suggested LWD ${lwd} recorded for the ${step.role} step`)
    },
    [log, patch]
  )

  /** Approver/RM adds an exit condition (requires a suggested LWD mid-flow). */
  const addCondition = useCallback(
    (e: ExitCase, description: string, dueDate: string, addedBy: string) => {
      if (!description.trim() || !dueDate) {
        toast.error('Condition description and due date are required')
        return
      }
      if (e.status === 'pending-approval') {
        const step = pendingStep(e.approvals)
        const hasSuggestion = (e.lwdRecommendations ?? []).some(
          (r) => r.approver === step?.approver
        )
        if (step && !hasSuggestion) {
          toast.error('Suggest an LWD for your step before adding exit conditions')
          return
        }
      }
      patch(e.id, (prev) => ({
        ...prev,
        conditions: [
          ...(prev.conditions ?? []),
          {
            id: shortId('xc'),
            description: description.trim(),
            dueDate,
            status: 'open' as const,
            addedBy,
            addedOn: todayISO(),
          },
        ],
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit condition added',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${addedBy}: “${description.trim()}” due ${dueDate}`,
        onBehalfOf: null,
      })
      toast.success('Exit condition added')
    },
    [log, patch]
  )

  const setConditionStatus = useCallback(
    (e: ExitCase, conditionId: string, status: ExitConditionStatus) => {
      patch(e.id, (prev) => ({
        ...prev,
        conditions: (prev.conditions ?? []).map((c) =>
          c.id === conditionId ? { ...c, status } : c
        ),
      }))
      toast.success(`Exit condition marked ${status.replace('-', ' ')}`)
    },
    [patch]
  )

  /** Any approver asks the employee/another participant for clarification. */
  const askClarification = useCallback(
    (e: ExitCase, askedBy: string, askedTo: string, question: string) => {
      if (!question.trim()) {
        toast.error('Enter the clarification question first')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        clarifications: [
          ...(prev.clarifications ?? []),
          {
            id: shortId('xr'),
            askedBy,
            askedTo,
            question: question.trim(),
            askedOn: todayISO(),
            reply: null,
            repliedOn: null,
          },
        ],
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Clarification requested',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${askedBy} asked ${askedTo}: “${question.trim()}”`,
        onBehalfOf: null,
      })
      notify({
        recipient: askedTo,
        kind: 'task',
        title: `Clarification needed on exit ${e.id}`,
        body: question.trim(),
      })
      toast.success(`Clarification requested from ${askedTo}`)
    },
    [log, notify, patch]
  )

  /** The asked party replies (Clarify action). */
  const replyClarification = useCallback(
    (e: ExitCase, clarificationId: string, reply: string) => {
      if (!reply.trim()) {
        toast.error('Enter a reply first')
        return
      }
      const entry = (e.clarifications ?? []).find((c) => c.id === clarificationId)
      patch(e.id, (prev) => ({
        ...prev,
        clarifications: (prev.clarifications ?? []).map((c) =>
          c.id === clarificationId
            ? { ...c, reply: reply.trim(), repliedOn: todayISO() }
            : c
        ),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Clarification provided',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${entry?.askedTo ?? 'Participant'} replied to ${entry?.askedBy ?? 'approver'}`,
        onBehalfOf: null,
      })
      if (entry) {
        notify({
          recipient: entry.askedBy,
          kind: 'reminder',
          title: `Clarification received on exit ${e.id}`,
          body: reply.trim(),
        })
      }
      toast.success('Clarification recorded and shared with the asking approver')
    },
    [log, notify, patch]
  )

  /** Withdraw BEFORE final approval — approvers up to the current step notified. */
  const withdrawExit = useCallback(
    (e: ExitCase) => {
      const currentIdx = e.approvals.findIndex((s) => s.status === 'pending')
      const informed = e.approvals.slice(
        0,
        currentIdx === -1 ? e.approvals.length : currentIdx + 1
      )
      patch(e.id, (prev) => ({ ...prev, status: 'withdrawn' }))
      informed.forEach((s) =>
        notify({
          recipient: s.approver,
          kind: 'reminder',
          title: `Exit request withdrawn — ${e.employeeName}`,
          body: `Exit ${e.id} was withdrawn before final approval. No further action needed.`,
        })
      )
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit request withdrawn',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `Withdrawn before final approval · ${informed.length} approver(s) up to the current step notified`,
        onBehalfOf: null,
      })
      toast.success('Exit request withdrawn — approvers up to the current step notified')
    },
    [log, notify, patch]
  )

  /** Withdraw an APPROVED resignation → fresh run of the same approval chain. */
  const requestWithdrawal = useCallback(
    (e: ExitCase) => {
      patch(e.id, (prev) => ({
        ...prev,
        status: 'pending-approval',
        isWithdrawalRequest: true,
        approvals: makeSteps(prev.approvals.map((s) => ({ role: s.role, approver: s.approver }))),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Resignation withdrawal requested',
        target: `${e.id} · ${e.employeeName}`,
        outcome: 'Approved resignation — withdrawal routed through a fresh approval workflow with the same approvers',
        onBehalfOf: null,
      })
      e.approvals.forEach((s) =>
        notify({
          recipient: s.approver,
          kind: 'approval',
          title: `Withdrawal request — ${e.employeeName}`,
          body: `${e.employeeName} requests to withdraw the approved resignation ${e.id}. Your approval is required again.`,
        })
      )
      toast.success('Withdrawal request submitted — same approvers, all steps reset to pending')
    },
    [log, notify, patch]
  )

  /** Revoke AFTER full approval (admin) — full re-approval; tasks auto-close. */
  const revokeExit = useCallback(
    (e: ExitCase) => {
      const assignees = [...new Set(e.tasks.filter((t) => !t.done).map((t) => t.owner))]
      patch(e.id, (prev) => ({
        ...prev,
        status: 'pending-approval',
        revokeInProgress: true,
        approvals: makeSteps(prev.approvals.map((s) => ({ role: s.role, approver: s.approver }))),
        tasks: prev.tasks.map((t) => ({ ...t, done: true })),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit revoke initiated',
        target: `${e.id} · ${e.employeeName}`,
        outcome: 'Post-approval revoke — entire approval workflow re-runs with the same approvers · all exit tasks auto-closed',
        onBehalfOf: e.employeeName,
      })
      e.approvals.forEach((s) =>
        notify({
          recipient: s.approver,
          kind: 'approval',
          title: `Exit revoke — ${e.employeeName}`,
          body: `Exit ${e.id} is being revoked (e.g. employee returned). Approve the revoke at your step.`,
        })
      )
      toast.success(
        assignees.length > 0
          ? `Revoke initiated — all exit tasks auto-closed and ${assignees.join(', ')} notified`
          : 'Revoke initiated — approval workflow reset to pending'
      )
    },
    [log, notify, patch]
  )

  /** Admin Terminate flow — exit-type-specific initiation. */
  const initiateTermination = useCallback(
    (draft: TerminationDraft) => {
      const isSuspension = draft.exitType === 'Suspension'
      const isDeath = draft.exitType === 'Employee Death'
      const lwd = isSuspension
        ? draft.suspensionTill ?? todayISO()
        : draft.proposedLwd ?? todayISO()
      const exit: ExitCase = {
        id: shortId('ext'),
        employeeName: draft.employeeName,
        employeeCode: draft.employeeCode,
        department: draft.department,
        location: draft.location,
        positionLevel: draft.positionLevel,
        exitType: draft.exitType,
        reason: draft.reason,
        requestedOn: todayISO(),
        lastWorkingDay: lwd,
        noticePeriodDays: 0,
        // Employee Death cases skip the approval workflow entirely.
        status: isDeath ? 'approved' : 'pending-approval',
        approvals: isDeath
          ? EXIT_CHAIN.map((s) => ({
              ...s,
              status: 'approved' as const,
              actedOn: todayISO(),
              note: 'Auto-approved — Employee Death (no approval workflow)',
            }))
          : makeSteps(EXIT_CHAIN),
        clearances: defaultClearances(),
        tasks: tasksForType(draft.exitType),
        questionnaire: draft.answers.map((a, i) => ({
          questionId: `tq${i + 1}`,
          question: a.question,
          responder: 'HR',
          mandatory: true,
          answer: a.answer,
        })),
        questionnaireSubmitted: true,
        raisedBy: 'Admin (proxy)',
        resignationSubmitted: true,
        approvedLwd: isDeath ? lwd : null,
        supportingDocuments: draft.documents.map((name) => ({
          id: shortId('sd'),
          name,
          uploadedBy: 'Exit Coordinator',
          uploadedOn: todayISO(),
        })),
        comments: draft.comment.trim()
          ? [
              {
                id: shortId('xm'),
                author: 'Exit Coordinator',
                text: draft.comment.trim(),
                visibility: 'hr-managers' as const,
                on: todayISO(),
              },
            ]
          : [],
        policiesDeviated: draft.policiesDeviated,
        abscondingDate: draft.abscondingDate ?? null,
        suspensionFrom: draft.suspensionFrom ?? null,
        suspensionTill: draft.suspensionTill ?? null,
        suspensionWithPay: draft.withPay,
        suspensionReview: isSuspension ? null : undefined,
      }
      setExits((prev) => [exit, ...prev])
      log({
        company: COMPANY,
        module: 'Exit',
        action: `Termination initiated (${draft.exitType})`,
        target: `${exit.id} · ${draft.employeeName}`,
        outcome: isDeath
          ? 'Auto-approved — nominee benefits per policy are handled via Employee Master'
          : isSuspension
            ? `Suspension ${draft.suspensionFrom} → ${draft.suspensionTill} routed for approval`
            : `Proposed LWD ${lwd} · routed for approval`,
        onBehalfOf: draft.employeeName,
      })
      if (isDeath) {
        toast.success(
          'Employee Death exit recorded and auto-approved — nominee benefits per policy are handled via Employee Master'
        )
      } else {
        toast.success(`${draft.exitType} exit initiated for ${draft.employeeName}`)
      }
      return exit
    },
    [defaultClearances, log, tasksForType]
  )

  /** Approvers can adjust the suspension window on the case. */
  const adjustSuspension = useCallback(
    (e: ExitCase, from: string, till: string) => {
      if (!from || !till || till < from) {
        toast.error('Provide a valid suspension range (Till must be on/after From)')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        suspensionFrom: from,
        suspensionTill: till,
        lastWorkingDay: till,
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Suspension range adjusted',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `Suspension window set to ${from} → ${till}`,
        onBehalfOf: null,
      })
      toast.success('Suspension range updated')
    },
    [log, patch]
  )

  /** Post-approval suspension review: revoke / continue / terminate. */
  const reviewSuspension = useCallback(
    (e: ExitCase, outcome: SuspensionReviewOutcome) => {
      if (outcome === 'revoked') {
        patch(e.id, (prev) => ({
          ...prev,
          status: 'closed',
          suspensionReview: 'revoked',
        }))
        notify({
          recipient: e.employeeName,
          kind: 'approval',
          title: 'Suspension revoked',
          body: 'Your suspension has been revoked — HRMS access is restored.',
        })
        toast.success('Suspension revoked — employee reinstated and HRMS access restored')
      } else if (outcome === 'continued') {
        patch(e.id, (prev) => ({ ...prev, suspensionReview: 'continued' }))
        toast.success('Suspension continued — window stays in force')
      } else {
        patch(e.id, (prev) => ({
          ...prev,
          suspensionReview: 'terminated',
          exitType: 'Termination',
          reason: `${prev.reason} · Escalated to termination from suspension review.`,
          status: 'pending-approval',
          approvals: makeSteps(prev.approvals.map((s) => ({ role: s.role, approver: s.approver }))),
        }))
        toast.success('Suspension escalated to Termination — approval workflow restarted')
      }
      log({
        company: COMPANY,
        module: 'Exit',
        action: `Suspension review: ${outcome}`,
        target: `${e.id} · ${e.employeeName}`,
        outcome:
          outcome === 'revoked'
            ? 'Employee reinstated; case closed'
            : outcome === 'continued'
              ? 'Suspension continues per the approved window'
              : 'Escalated to a Termination exit',
        onBehalfOf: e.employeeName,
      })
    },
    [log, notify, patch]
  )

  /** Assign an exit task by role / RM / position level. */
  const assignTask = useCallback(
    (e: ExitCase, input: AssignTaskInput) => {
      const due =
        input.timing === 'before-lwd'
          ? 'Before LWD'
          : `After Exit Approval + ${input.daysAfterApproval ?? 0} Day(s)`
      patch(e.id, (prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: shortId('t'),
            name: input.name,
            owner: input.assignee,
            due,
            done: false,
            description: input.description,
            timing: input.timing,
            daysAfterApproval: input.daysAfterApproval,
            assignedVia: input.mode,
          },
        ],
      }))
      notify({
        recipient: input.assignee,
        kind: 'task',
        title: `Exit task: ${input.name}`,
        body: `${input.description || 'Exit task'} · due ${due} · case ${e.id} (${e.employeeName})`,
      })
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit task assigned',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `“${input.name}” → ${input.assignee} (via ${input.mode.replace('-', ' ')}) · ${due}`,
        onBehalfOf: null,
      })
      toast.success(`Task assigned to ${input.assignee}`)
    },
    [log, notify, patch]
  )

  /** Track a document to be collected from the employee. */
  const addTrackedDocument = useCallback(
    (e: ExitCase, name: string, collectWhen: 'before-exit' | 'on-lwd') => {
      if (!name.trim()) {
        toast.error('Document name is required')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        trackedDocuments: [
          ...(prev.trackedDocuments ?? []),
          { id: shortId('xd'), name: name.trim(), collectWhen, status: 'pending' as const },
        ],
      }))
      toast.success('Document added to the collection tracker')
    },
    [patch]
  )

  const toggleTrackedDocument = useCallback(
    (e: ExitCase, docId: string) => {
      patch(e.id, (prev) => ({
        ...prev,
        trackedDocuments: (prev.trackedDocuments ?? []).map((d) =>
          d.id === docId
            ? { ...d, status: d.status === 'pending' ? ('submitted' as const) : ('pending' as const) }
            : d
        ),
      }))
    },
    [patch]
  )

  /** Attach a supporting document (file-name entry) to the case. */
  const addCaseDocument = useCallback(
    (e: ExitCase, name: string, uploadedBy: string) => {
      if (!name.trim()) {
        toast.error('Document name is required')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        supportingDocuments: [
          ...(prev.supportingDocuments ?? []),
          { id: shortId('sd'), name: name.trim(), uploadedBy, uploadedOn: todayISO() },
        ],
      }))
      toast.success('Supporting document attached')
    },
    [patch]
  )

  const addComment = useCallback(
    (e: ExitCase, author: string, text: string, visibility: ExitCommentVisibility) => {
      if (!text.trim()) {
        toast.error('Enter a comment first')
        return
      }
      patch(e.id, (prev) => ({
        ...prev,
        comments: [
          ...(prev.comments ?? []),
          { id: shortId('xm'), author, text: text.trim(), visibility, on: todayISO() },
        ],
      }))
      toast.success(
        visibility === 'hr-managers'
          ? 'Comment added (visible to HR & managers only)'
          : 'Comment added'
      )
    },
    [patch]
  )

  /** Generate a relieving/experience letter (Experience gated on conditions). */
  const issueLetter = useCallback(
    (e: ExitCase, letter: 'Relieving Letter' | 'Experience Letter') => {
      if (letter === 'Experience Letter') {
        const blocker = experienceLetterBlocker(e)
        if (blocker) {
          toast.error(blocker)
          return
        }
      }
      log({
        company: COMPANY,
        module: 'Exit',
        action: `${letter} generated`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${letter} generated from the configured template`,
        onBehalfOf: null,
      })
      toast.success(`${letter} generated from template for ${e.employeeName}`)
    },
    [log]
  )

  const initiateClearance = useCallback(
    (e: ExitCase) => {
      patch(e.id, (prev) => ({ ...prev, status: 'clearance-in-progress' }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Clearance initiated (parallel)',
        target: `${e.id} · ${e.employeeName}`,
        outcome: `${e.clearances.length} functional clearance tasks issued in parallel`,
        onBehalfOf: null,
      })
      e.clearances.forEach((c) =>
        notify({
          recipient: c.owner,
          kind: 'task',
          title: `${c.functionName} clearance: ${e.employeeName}`,
          body: `Complete your ${c.functionName} clearance sign-off before finalization.`,
        })
      )
      toast.success('Parallel clearance tasks issued to all functions')
    },
    [log, notify, patch]
  )

  const setClearance = useCallback(
    (e: ExitCase, functionName: string, status: ClearanceStatus, note: string | null) => {
      patch(e.id, (prev) => ({
        ...prev,
        clearances: prev.clearances.map((c) =>
          c.functionName === functionName ? { ...c, status, note } : c
        ),
      }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: `${functionName} clearance ${status}`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: note ?? 'Functional sign-off recorded independently',
        onBehalfOf: null,
      })
      toast.success(`${functionName} clearance marked ${status}`)
    },
    [log, patch]
  )

  const toggleTask = useCallback(
    (e: ExitCase, taskId: string) => {
      patch(e.id, (prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      }))
    },
    [patch]
  )

  const answerQuestion = useCallback(
    (id: string, questionId: string, answer: string) => {
      patch(id, (prev) => ({
        ...prev,
        questionnaire: prev.questionnaire.map((q) =>
          q.questionId === questionId ? { ...q, answer } : q
        ),
      }))
    },
    [patch]
  )

  const submitQuestionnaire = useCallback(
    (e: ExitCase) => {
      const unanswered = e.questionnaire.filter(
        (q) => q.mandatory && (!q.answer || q.answer.trim() === '')
      )
      if (unanswered.length > 0) {
        toast.error(
          `Answer all mandatory questions first (${unanswered.length} remaining)`
        )
        return
      }
      patch(e.id, (prev) => ({ ...prev, questionnaireSubmitted: true }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit questionnaire submitted',
        target: `${e.id} · ${e.employeeName}`,
        outcome: 'Responses recorded against the exit case for HR analysis',
        onBehalfOf: null,
      })
      toast.success('Questionnaire submitted — responses recorded')
    },
    [log, patch]
  )

  const finalizeExit = useCallback(
    (e: ExitCase) => {
      const outstanding = e.clearances.filter((c) => c.status !== 'cleared')
      if (outstanding.length > 0) {
        toast.error(
          `Cannot finalize — pending clearance: ${outstanding
            .map((c) => `${c.functionName} (${c.owner})`)
            .join(', ')}`
        )
        return
      }
      // W8 — assets still with the employee hold the exit open.
      const assetBlock = assetClearanceBlocker(e.employeeName)
      if (assetBlock) {
        toast.error(
          `Cannot finalize — ${assetBlock}. Record the returns (or write-offs) in the Assets module → Exit clearance screen first.`
        )
        return
      }
      patch(e.id, (prev) => ({ ...prev, status: 'finalized' }))
      log({
        company: COMPANY,
        module: 'Exit',
        action: 'Exit finalized',
        target: `${e.id} · ${e.employeeName}`,
        outcome:
          'Aggregated clearance recorded · Relieving Letter generated from template',
        onBehalfOf: null,
      })
      toast.success(
        `${e.employeeName}'s exit finalized — relieving letter generated from template`
      )
    },
    [log, patch]
  )

  return {
    exits,
    addExit,
    approveStep,
    rejectStep,
    initiateClearance,
    setClearance,
    toggleTask,
    answerQuestion,
    submitQuestionnaire,
    finalizeExit,
    /* Additive core-transaction API */
    deriveNotice,
    enableExit,
    disableExit,
    submitResignation,
    suggestLwd,
    addCondition,
    setConditionStatus,
    askClarification,
    replyClarification,
    withdrawExit,
    requestWithdrawal,
    revokeExit,
    initiateTermination,
    adjustSuspension,
    reviewSuspension,
    assignTask,
    addTrackedDocument,
    toggleTrackedDocument,
    addCaseDocument,
    addComment,
    issueLetter,
  }
}

export type ExitsStore = ReturnType<typeof useExits>
