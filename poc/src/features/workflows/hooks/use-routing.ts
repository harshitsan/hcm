import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedRoutingRules, type RoutingRule } from '../data/routing'
import { type AppendAudit } from './use-audit-trail'

export type RoutingRuleDraft = Omit<RoutingRule, 'id' | 'updatedBy' | 'updatedAt'>

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Governed routing decision table (WFE-02, WFE-23): rows keyed by
 * organizational + transaction attributes with deterministic priority and a
 * default fallback row. Changes are audited (WFE-22).
 */
export function useRouting({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [rules, setRules] = useState<RoutingRule[]>(seedRoutingRules)

  const addRule = useCallback(
    (draft: RoutingRuleDraft) => {
      const rule: RoutingRule = {
        ...draft,
        id: `rt-${crypto.randomUUID().slice(0, 6)}`,
        updatedBy: actor,
        updatedAt: today(),
      }
      setRules((prev) => [...prev, rule])
      append({
        actor,
        actorRole,
        company: draft.company,
        category: 'config',
        summary: `Added routing rule (priority ${draft.priority})`,
        detail: `${draft.transactionType} · ${draft.company} · ${draft.jurisdiction} · ${draft.location} · ${draft.department} → ${draft.routeTo}`,
        refId: rule.id,
      })
      toast.success('Routing rule added')
    },
    [append, actor, actorRole]
  )

  const updateRule = useCallback(
    (id: string, draft: RoutingRuleDraft) => {
      setRules((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...draft, updatedBy: actor, updatedAt: today() } : r
        )
      )
      append({
        actor,
        actorRole,
        company: draft.company,
        category: 'config',
        summary: `Updated routing rule ${id}`,
        detail: `Now routes ${draft.transactionType} → ${draft.routeTo} at priority ${draft.priority}.`,
        refId: id,
      })
      toast.success('Routing rule updated')
    },
    [append, actor, actorRole]
  )

  const deleteRule = useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id)
      if (rule?.isDefault) {
        toast.error('The default routing row cannot be removed')
        return
      }
      setRules((prev) => prev.filter((r) => r.id !== id))
      toast.success('Routing rule removed')
    },
    [rules]
  )

  return { rules, addRule, updateRule, deleteRule }
}

export type RoutingStore = ReturnType<typeof useRouting>
