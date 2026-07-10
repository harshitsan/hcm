import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCounselling,
  seedDisciplinary,
  type CounsellingOutcome,
  type CounsellingRecord,
  type DisciplinaryActionType,
  type DisciplinaryCase,
} from '../data/disciplinary'
import { type DisciplinaryApproverGroup } from '../data/config'
import { pendingStep, shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

export interface DisciplinaryDraft {
  employeeName: string
  employeeCode: string
  department: string
  location: string
  actionType: DisciplinaryActionType
  policyDeviated: string
  reason: string
  reportedBy: string
  reportedOn: string
  actionToBeTakenOn: string
  attachmentName: string | null
  initiatedBy: string
}

export interface CounsellingDraft {
  employees: string
  location: string
  department: string
  position: string
  startDate: string
  endDate: string
  topic: string
  notes: string
  initiatedBy: string
}

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
  notify: (input: {
    recipient: string
    kind: 'task' | 'approval' | 'reminder' | 'escalation'
    title: string
    body: string
  }) => void
  approverGroups: DisciplinaryApproverGroup[]
  /** Hands the case to the exit module so the Exit Coordinator can act on it. */
  onExitReferral: (
    c: DisciplinaryCase,
    process: 'Suspension' | 'Termination'
  ) => void
}

/** Disciplinary actions routed to the configured location approver. */
export function useDisciplinary({ log, notify, approverGroups, onExitReferral }: Deps) {
  const [cases, setCases] = useState<DisciplinaryCase[]>(seedDisciplinary)
  const [counselling, setCounselling] =
    useState<CounsellingRecord[]>(seedCounselling)

  const patch = useCallback(
    (id: string, fn: (c: DisciplinaryCase) => DisciplinaryCase) => {
      setCases((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))
    },
    []
  )

  /** Suspension/Termination handoff — task + notification to the Exit Coordinator. */
  const triggerExitHandoff = useCallback(
    (c: DisciplinaryCase, process: 'Suspension' | 'Termination') => {
      patch(c.id, (prev) => ({
        ...prev,
        exitHandoff: { process, triggeredOn: todayISO() },
      }))
      onExitReferral(c, process)
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: 'Exit Coordinator handoff triggered',
        target: `${c.id} · ${c.employeeName}`,
        outcome: `Task and notification triggered to Exit Coordinator to initiate the ${process} process`,
        onBehalfOf: null,
      })
      notify({
        recipient: 'Exit Coordinator',
        kind: 'task',
        title: `Initiate ${process}: ${c.employeeName}`,
        body: `Disciplinary case ${c.id} is fully approved. Please initiate the ${process} process for ${c.employeeName} (${c.employeeCode}).`,
      })
      toast.info(
        `Task and notification triggered to Exit Coordinator to initiate the ${process} process`
      )
    },
    [log, notify, onExitReferral, patch]
  )

  const initiate = useCallback(
    (draft: DisciplinaryDraft) => {
      const group = approverGroups.find((g) =>
        g.locations.includes(draft.location)
      )
      const approver = group?.approvers[0] ?? 'Anita Desai'
      const created: DisciplinaryCase = {
        ...draft,
        id: shortId('dsc'),
        initiatedOn: todayISO(),
        status: 'pending-approval',
        approvals: [
          {
            role: 'Location Approver',
            approver,
            status: 'pending',
            actedOn: null,
            note: null,
          },
        ],
        exitHandoff: null,
      }
      setCases((prev) => [created, ...prev])
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: `${draft.actionType} initiated`,
        target: `${created.id} · ${draft.employeeName}`,
        outcome: `Routed to ${draft.location} approver ${approver}`,
        onBehalfOf: null,
      })
      notify({
        recipient: approver,
        kind: 'approval',
        title: `Disciplinary action awaiting approval`,
        body: `${draft.actionType} for ${draft.employeeName} (${draft.location}) requires your review.`,
      })
      toast.success(`Disciplinary action routed to ${approver}`)
    },
    [approverGroups, log, notify]
  )

  const approve = useCallback(
    (c: DisciplinaryCase) => {
      const step = pendingStep(c.approvals)
      if (!step) return
      patch(c.id, (prev) => ({
        ...prev,
        status: 'approved',
        approvals: prev.approvals.map((s) =>
          s === step ? { ...s, status: 'approved' as const, actedOn: todayISO() } : s
        ),
      }))
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: 'Disciplinary action approved',
        target: `${c.id} · ${c.employeeName}`,
        outcome:
          c.actionType === 'Counselling'
            ? 'Action authorized — counselling can be initiated'
            : 'Action authorized — letter can be issued',
        onBehalfOf: null,
      })
      toast.success('Disciplinary action approved')
      // Fully approved Suspension/Termination cases route to the Exit Coordinator.
      if (c.actionType === 'Suspension' || c.actionType === 'Termination') {
        triggerExitHandoff(c, c.actionType)
      }
    },
    [log, patch, triggerExitHandoff]
  )

  const reject = useCallback(
    (c: DisciplinaryCase, note: string) => {
      const step = pendingStep(c.approvals)
      if (!step) return
      patch(c.id, (prev) => ({
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
        module: 'Disciplinary',
        action: 'Disciplinary action rejected',
        target: `${c.id} · ${c.employeeName}`,
        outcome: note || 'Not applied',
        onBehalfOf: null,
      })
      toast.info('Disciplinary action rejected — nothing applied')
    },
    [log, patch]
  )

  const issueLetter = useCallback(
    (c: DisciplinaryCase) => {
      if (c.status !== 'approved') {
        toast.error('The action must be approved before a letter is issued')
        return
      }
      patch(c.id, (prev) => ({ ...prev, status: 'letter-issued' }))
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: `${c.actionType} issued`,
        target: `${c.id} · ${c.employeeName}`,
        outcome: 'Letter generated from the configured disciplinary template',
        onBehalfOf: null,
      })
      notify({
        recipient: c.employeeName,
        kind: 'task',
        title: `${c.actionType} issued`,
        body: 'A disciplinary communication has been recorded against your profile.',
      })
      toast.success(`${c.actionType} issued from template`)
    },
    [log, notify, patch]
  )

  const initiateCounselling = useCallback(
    (c: DisciplinaryCase, draft: CounsellingDraft) => {
      if (c.actionType !== 'Counselling' || c.status !== 'approved') {
        toast.error('Counselling can only be initiated on an approved Counselling case')
        return
      }
      const record: CounsellingRecord = {
        ...draft,
        id: shortId('cns'),
        caseId: c.id,
        status: 'in-progress',
        outcome: null,
        outcomeComments: null,
        initiatedOn: todayISO(),
        completedOn: null,
      }
      setCounselling((prev) => [record, ...prev])
      patch(c.id, (prev) => ({ ...prev, status: 'counselling-in-progress' }))
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: 'Counselling initiated',
        target: `${c.id} · ${c.employeeName}`,
        outcome: `Counselling on "${draft.topic}" scheduled ${draft.startDate} → ${draft.endDate}`,
        onBehalfOf: null,
      })
      notify({
        recipient: c.employeeName,
        kind: 'task',
        title: 'Counselling scheduled',
        body: `A counselling engagement on "${draft.topic}" has been scheduled. The session is conducted offline with your counselor.`,
      })
      toast.success('Counselling initiated — session happens offline with the counselor')
    },
    [log, notify, patch]
  )

  const completeCounselling = useCallback(
    (record: CounsellingRecord, outcome: CounsellingOutcome, comments: string) => {
      if (record.status !== 'in-progress') return
      setCounselling((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: 'completed' as const,
                outcome,
                outcomeComments: comments || null,
                completedOn: todayISO(),
              }
            : r
        )
      )
      const c = cases.find((x) => x.id === record.caseId)
      if (!c) return
      patch(c.id, (prev) => ({
        ...prev,
        status: outcome === 'No Action' ? 'closed' : 'counselling-completed',
      }))
      log({
        company: 'Aurora Software India',
        module: 'Disciplinary',
        action: 'Counselling completed',
        target: `${c.id} · ${c.employeeName}`,
        outcome:
          outcome === 'No Action'
            ? 'Outcome: No Action — case closed'
            : 'Outcome: Termination — routing to Exit Coordinator',
        onBehalfOf: null,
      })
      if (outcome === 'No Action') {
        toast.success('Counselling completed — no further action, case closed')
      } else {
        triggerExitHandoff(c, 'Termination')
      }
    },
    [cases, log, patch, triggerExitHandoff]
  )

  return {
    cases,
    counselling,
    initiate,
    approve,
    reject,
    issueLetter,
    initiateCounselling,
    completeCounselling,
  }
}

export type DisciplinaryStore = ReturnType<typeof useDisciplinary>
