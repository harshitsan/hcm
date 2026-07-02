import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDisciplinary,
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
  reason: string
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
}

/** Disciplinary actions routed to the configured location approver. */
export function useDisciplinary({ log, notify, approverGroups }: Deps) {
  const [cases, setCases] = useState<DisciplinaryCase[]>(seedDisciplinary)

  const patch = useCallback(
    (id: string, fn: (c: DisciplinaryCase) => DisciplinaryCase) => {
      setCases((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))
    },
    []
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
        outcome: 'Action authorized — letter can be issued',
        onBehalfOf: null,
      })
      toast.success('Disciplinary action approved')
    },
    [log, patch]
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

  return { cases, initiate, approve, reject, issueLetter }
}

export type DisciplinaryStore = ReturnType<typeof useDisciplinary>
