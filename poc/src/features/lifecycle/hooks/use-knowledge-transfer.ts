import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  KT_ASSIGNERS,
  KT_TODAY,
  seedKtTasks,
  type KtActionEntry,
  type KtNotificationFrequency,
  type KtStatus,
  type KtTask,
  type WeekPlan,
} from '../data/knowledge-transfer'
import { shortId } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
}

/** Sections exposing an explicit refresh affordance. */
export type KtSection = 'tasks' | 'provided' | 'received'

const COMPANY = 'Aurora Software India'
const MODULE = 'Knowledge Transfer'

const DEFAULT_WEEK: WeekPlan = [0, 1, 1, 1, 1, 1, 0]

/** Payload for "Add New KT Task" (non-exit and exit variants). */
export interface NewKtTaskInput {
  task: string
  description: string
  project: string
  provider: string
  receiver: string
  department: string
  startDate: string
  dueDate: string
  documentName: string | null
  notificationRequired: boolean
  notifyBeforeDays: number
  peopleToNotify: string[]
  notificationFrequency: KtNotificationFrequency
  comments: string
  /** Name of the admin / manager assigning the task. */
  assignedBy: string
  /** Exit KT variant — read-only exit details carried onto the record. */
  exit?: {
    exitType: string
    dateOfJoining: string
    exitInitiatedDate: string
    tentativeLwd: string
  } | null
}

/**
 * Knowledge Transfer store — module setup wizard state plus the KT task grid
 * shared by the manager (KT Tasks) and employee (provided / received) views.
 * All state is in-memory.
 */
export function useKnowledgeTransfer({ log }: Deps) {
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [defaultHandoverDays, setDefaultHandoverDays] = useState(14)
  const [preCloseApprovalRequired, setPreCloseApprovalRequired] = useState(true)
  // Kensium KT configuration (Configuration > Employee Management > KT Management)
  const [supportNonExitKt, setSupportNonExitKt] = useState(true)
  const [supportExitKt, setSupportExitKt] = useState(true)
  const [applicableExitTypes, setApplicableExitTypes] = useState<string[]>([
    'Resignation',
    'Retirement',
  ])
  const [assignedBy, setAssignedBy] = useState<string[]>([...KT_ASSIGNERS])
  const [tasks, setTasks] = useState<KtTask[]>(seedKtTasks)
  const [refreshedAt, setRefreshedAt] = useState<
    Partial<Record<KtSection, string>>
  >({})

  /** Simulated re-fetch: stamps the section and confirms via toast. */
  const refresh = useCallback((section: KtSection, label: string) => {
    setRefreshedAt((prev) => ({
      ...prev,
      [section]: new Date().toLocaleTimeString(),
    }))
    toast.success(`${label} refreshed — showing the latest data`)
  }, [])

  /** Step 1 of the setup wizard (Save / Save & Next). */
  const saveSetup = useCallback(
    (enabled: boolean) => {
      setModuleEnabled(enabled)
      log({
        company: COMPANY,
        module: MODULE,
        action: `Knowledge Transfer module ${enabled ? 'enabled' : 'disabled'}`,
        target: 'KT setup',
        outcome: enabled
          ? 'KT tasks can be raised during exits and transfers'
          : 'KT task creation is switched off for this company',
        onBehalfOf: null,
      })
      toast.success(
        `Setup saved — Knowledge Transfer module ${enabled ? 'enabled' : 'disabled'}`
      )
    },
    [log]
  )

  /** Step 2 of the setup wizard (Save / Save & Next). */
  const saveHandoverPolicy = useCallback(
    (days: number, approvalRequired: boolean) => {
      setDefaultHandoverDays(days)
      setPreCloseApprovalRequired(approvalRequired)
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Handover policy saved',
        target: 'KT setup',
        outcome: `Default window ${days} day(s) · pre-close approval ${
          approvalRequired ? 'required' : 'optional'
        }`,
        onBehalfOf: null,
      })
      toast.success('Handover policy saved')
    },
    [log]
  )

  const setTaskStatus = useCallback(
    (task: KtTask, status: KtStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status } : t))
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: `KT task ${status.toLowerCase()}`,
        target: `${task.id} · ${task.task}`,
        outcome: `${task.provider} → ${task.receiver} now "${status}"`,
        onBehalfOf: null,
      })
      toast.success(`"${task.task}" marked ${status}`)
    },
    [log]
  )

  /** Saves the Kensium KT Management configuration screen in one action. */
  const saveKtConfig = useCallback(
    (input: {
      moduleEnabled: boolean
      supportNonExitKt: boolean
      supportExitKt: boolean
      applicableExitTypes: string[]
      assignedBy: string[]
    }) => {
      setModuleEnabled(input.moduleEnabled)
      setSupportNonExitKt(input.supportNonExitKt)
      setSupportExitKt(input.supportExitKt)
      setApplicableExitTypes(input.applicableExitTypes)
      setAssignedBy(input.assignedBy)
      log({
        company: COMPANY,
        module: MODULE,
        action: 'KT Management configuration saved',
        target: 'KT configuration',
        outcome: `Module ${input.moduleEnabled ? 'on' : 'off'} · non-exit KT ${
          input.supportNonExitKt ? 'on' : 'off'
        } · exit KT ${input.supportExitKt ? 'on' : 'off'} · exit types [${input.applicableExitTypes.join(
          ', '
        )}] · assigned by [${input.assignedBy.join(', ')}]`,
        onBehalfOf: null,
      })
      toast.success('KT Management configuration saved')
    },
    [log]
  )

  /** Simulated email + in-store notification entry for a KT stage. */
  const sendKtEmail = useCallback(
    (recipient: string, subject: string, body: string) => {
      log({
        company: COMPANY,
        module: MODULE,
        action: 'Email notification sent (simulated)',
        target: `${recipient} · ${subject}`,
        outcome: body,
        onBehalfOf: null,
      })
      toast.info(`Email to ${recipient} — ${subject}`)
    },
    [log]
  )

  const appendHistory = (task: KtTask, entry: KtActionEntry): KtTask => ({
    ...task,
    history: [...(task.history ?? []), entry],
  })

  /** Add New KT Task (non-exit or exit variant) — notifies both parties. */
  const addTask = useCallback(
    (input: NewKtTaskInput) => {
      const task: KtTask = {
        id: shortId('kt'),
        task: input.task,
        provider: input.provider,
        providerActive: true,
        receiver: input.receiver,
        receiverActive: true,
        department: input.department,
        startDate: input.startDate,
        endDate: input.dueDate,
        status: 'Assigned',
        week: DEFAULT_WEEK,
        description: input.description,
        project: input.project,
        documentName: input.documentName,
        notificationRequired: input.notificationRequired,
        notifyBeforeDays: input.notificationRequired
          ? input.notifyBeforeDays
          : undefined,
        peopleToNotify: input.notificationRequired
          ? input.peopleToNotify
          : undefined,
        notificationFrequency: input.notificationRequired
          ? input.notificationFrequency
          : undefined,
        comments: input.comments,
        ktMaterial: null,
        isExit: Boolean(input.exit),
        exitType: input.exit?.exitType,
        dateOfJoining: input.exit?.dateOfJoining,
        exitInitiatedDate: input.exit?.exitInitiatedDate,
        tentativeLwd: input.exit?.tentativeLwd,
        history: [
          {
            actor: input.assignedBy,
            action: 'Assigned',
            date: KT_TODAY,
            comment: input.comments || null,
          },
        ],
      }
      setTasks((prev) => [task, ...prev])
      log({
        company: COMPANY,
        module: MODULE,
        action: `${task.isExit ? 'Exit' : 'Non-exit'} KT task assigned`,
        target: `${task.id} · ${task.task}`,
        outcome: `${task.provider} → ${task.receiver}, due ${input.dueDate}`,
        onBehalfOf: null,
      })
      toast.success(`KT task "${task.task}" assigned`)
      sendKtEmail(
        task.provider,
        'KT task assigned to you as provider',
        `Hand over "${task.task}" to ${task.receiver} by ${input.dueDate}.`
      )
      sendKtEmail(
        task.receiver,
        'KT task assigned to you as receiver',
        `Receive "${task.task}" from ${task.provider} by ${input.dueDate}.`
      )
      return task
    },
    [log, sendKtEmail]
  )

  /**
   * Provider action "Initiate" — moves the task to Initiated, or straight to
   * Pending for Receive once the KT material is uploaded. HR can act on
   * behalf of the provider (Kensium key feature 5).
   */
  const initiateTask = useCallback(
    (
      task: KtTask,
      opts: { actor: string; comment: string; materialName: string | null; onBehalfOf?: boolean }
    ) => {
      const status: KtStatus = opts.materialName ? 'Pending for Receive' : 'Initiated'
      const actorLabel = opts.onBehalfOf
        ? `${opts.actor} (on behalf of ${task.provider})`
        : opts.actor
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? appendHistory(
                {
                  ...t,
                  status,
                  ktMaterial: opts.materialName ?? t.ktMaterial ?? null,
                },
                {
                  actor: actorLabel,
                  action: opts.materialName
                    ? 'Initiated · KT material uploaded'
                    : 'Initiated',
                  date: KT_TODAY,
                  comment: opts.comment || null,
                }
              )
            : t
        )
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: 'KT task initiated',
        target: `${task.id} · ${task.task}`,
        outcome: `Status "${status}"${opts.materialName ? ` · material ${opts.materialName}` : ''}`,
        onBehalfOf: opts.onBehalfOf ? task.provider : null,
      })
      toast.success(`KT task "${task.task}" initiated — status "${status}"`)
      sendKtEmail(
        task.receiver,
        'KT initiated',
        opts.materialName
          ? `"${task.task}" is pending for receive — KT material "${opts.materialName}" is available.`
          : `${task.provider} has initiated the KT for "${task.task}".`
      )
    },
    [log, sendKtEmail]
  )

  /**
   * Receiver action "Received" — acknowledges the handover and notifies the
   * provider and manager. HR can act on behalf of the receiver.
   */
  const receiveTask = useCallback(
    (task: KtTask, opts: { actor: string; comment: string; onBehalfOf?: boolean }) => {
      const actorLabel = opts.onBehalfOf
        ? `${opts.actor} (on behalf of ${task.receiver})`
        : opts.actor
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? appendHistory({ ...t, status: 'Received' }, {
                actor: actorLabel,
                action: 'Received',
                date: KT_TODAY,
                comment: opts.comment || null,
              })
            : t
        )
      )
      log({
        company: COMPANY,
        module: MODULE,
        action: 'KT task received',
        target: `${task.id} · ${task.task}`,
        outcome: `${task.receiver} acknowledged the handover from ${task.provider}`,
        onBehalfOf: opts.onBehalfOf ? task.receiver : null,
      })
      toast.success(`KT task "${task.task}" updated to "Received"`)
      sendKtEmail(
        task.provider,
        'KT task completed',
        `"${task.task}" has been marked Received by ${task.receiver}.`
      )
      sendKtEmail(
        'Vikram Shah (Manager)',
        'KT task completed',
        `"${task.task}" (${task.provider} → ${task.receiver}) is complete.`
      )
    },
    [log, sendKtEmail]
  )

  return {
    moduleEnabled,
    defaultHandoverDays,
    preCloseApprovalRequired,
    saveSetup,
    saveHandoverPolicy,
    // Kensium KT configuration
    supportNonExitKt,
    supportExitKt,
    applicableExitTypes,
    assignedBy,
    saveKtConfig,
    tasks,
    setTaskStatus,
    addTask,
    initiateTask,
    receiveTask,
    refresh,
    refreshedAt,
  }
}

export type KnowledgeTransferStore = ReturnType<typeof useKnowledgeTransfer>
