import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedConditions, type WorkflowCondition } from '../data/records'

export type ConditionDraft = Omit<WorkflowCondition, 'id' | 'enabled'>

export interface WorkflowConditionsStore {
  conditions: WorkflowCondition[]
  addCondition: (draft: ConditionDraft) => void
  toggleCondition: (id: string) => void
  removeCondition: (id: string) => void
}

/**
 * In-memory store for workflow/rules conditions that read custom fields as
 * first-class runtime inputs (L3 Rules/Workflow engines).
 */
export function useWorkflowConditions(): WorkflowConditionsStore {
  const [conditions, setConditions] =
    useState<WorkflowCondition[]>(seedConditions)

  const addCondition = useCallback((draft: ConditionDraft) => {
    setConditions((prev) => [
      { ...draft, id: `wc-${crypto.randomUUID().slice(0, 8)}`, enabled: true },
      ...prev,
    ])
    toast.success(`Workflow condition "${draft.name}" added`)
  }, [])

  const toggleCondition = useCallback((id: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
  }, [])

  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id))
    toast.success('Workflow condition removed')
  }, [])

  return { conditions, addCondition, toggleCondition, removeCondition }
}
