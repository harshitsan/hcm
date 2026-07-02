import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  EXIT_CHAIN,
  seedExits,
  type ClearanceStatus,
  type ExitCase,
} from '../data/exits'
import {
  type ClearanceApproverChain,
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
    (draft: ExitDraft) => {
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

  const addExit = useCallback(
    (draft: ExitDraft) => {
      const notice = deriveNotice(draft)
      const exit: ExitCase = {
        ...draft,
        id: shortId('ext'),
        requestedOn: todayISO(),
        lastWorkingDay: addDays(todayISO(), notice.days),
        noticePeriodDays: notice.days,
        status: 'pending-approval',
        approvals: makeSteps(EXIT_CHAIN),
        clearances: clearanceChains.map((c) => ({
          functionName: c.functionName,
          owner: c.hierarchy[0] ?? 'Unassigned',
          status: 'pending' as const,
          note: null,
        })),
        tasks: exitTaskDefs
          .filter((t) => t.exitTypes.includes(draft.exitType))
          .map((t) => ({
            id: t.id,
            name: t.name,
            owner: t.responsible,
            due: t.timing,
            done: false,
          })),
        questionnaire: questionnaireEnabled
          ? exitQuestions
              .filter((q) => q.exitTypes.includes(draft.exitType))
              .map((q) => ({
                questionId: q.id,
                question: q.text,
                responder: q.responder,
                mandatory: q.mandatory,
                answer: null,
              }))
          : [],
        questionnaireSubmitted: false,
      }
      setExits((prev) => [exit, ...prev])
      log({
        company: 'Aurora Software India',
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
    [clearanceChains, deriveNotice, exitQuestions, exitTaskDefs, log, questionnaireEnabled]
  )

  const approveStep = useCallback(
    (e: ExitCase) => {
      const step = pendingStep(e.approvals)
      if (!step) return
      const approvals = e.approvals.map((s) =>
        s === step ? { ...s, status: 'approved' as const, actedOn: todayISO() } : s
      )
      const done = approvals.every((s) => s.status === 'approved')
      patch(e.id, (prev) => ({
        ...prev,
        approvals,
        status: done ? 'approved' : prev.status,
      }))
      log({
        company: 'Aurora Software India',
        module: 'Exit',
        action: `Approval granted (${step.role})`,
        target: `${e.id} · ${e.employeeName}`,
        outcome: done ? 'Exit approved — notice period tracking active' : 'Awaiting next approver',
        onBehalfOf: null,
      })
      if (done) {
        notify({
          recipient: e.employeeName,
          kind: 'approval',
          title: 'Exit request approved',
          body: `Your exit is approved. Last working day: ${e.lastWorkingDay}.`,
        })
      }
      toast.success(done ? 'Exit approved' : `${step.role} approved`)
    },
    [log, notify, patch]
  )

  const rejectStep = useCallback(
    (e: ExitCase, note: string) => {
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
        company: 'Aurora Software India',
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

  const initiateClearance = useCallback(
    (e: ExitCase) => {
      patch(e.id, (prev) => ({ ...prev, status: 'clearance-in-progress' }))
      log({
        company: 'Aurora Software India',
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
        company: 'Aurora Software India',
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
        company: 'Aurora Software India',
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
      patch(e.id, (prev) => ({ ...prev, status: 'finalized' }))
      log({
        company: 'Aurora Software India',
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
  }
}

export type ExitsStore = ReturnType<typeof useExits>
