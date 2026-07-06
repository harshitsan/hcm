import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedKtTasks, type KtStatus, type KtTask } from '../data/knowledge-transfer'
import { type LogInput } from './use-lifecycle-log'

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
}

/** Sections exposing an explicit refresh affordance. */
export type KtSection = 'tasks' | 'provided' | 'received'

const COMPANY = 'Aurora Software India'
const MODULE = 'Knowledge Transfer'

/**
 * Knowledge Transfer store — module setup wizard state plus the KT task grid
 * shared by the manager (KT Tasks) and employee (provided / received) views.
 * All state is in-memory.
 */
export function useKnowledgeTransfer({ log }: Deps) {
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [defaultHandoverDays, setDefaultHandoverDays] = useState(14)
  const [preCloseApprovalRequired, setPreCloseApprovalRequired] = useState(true)
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

  return {
    moduleEnabled,
    defaultHandoverDays,
    preCloseApprovalRequired,
    saveSetup,
    saveHandoverPolicy,
    tasks,
    setTaskStatus,
    refresh,
    refreshedAt,
  }
}

export type KnowledgeTransferStore = ReturnType<typeof useKnowledgeTransfer>
