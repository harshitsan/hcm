import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  CATEGORY_LABELS,
  seedApproverGroups,
  type ApproverGroup,
} from '../data/approver-groups'
import { type AppendAudit } from './use-audit-trail'

export type ApproverGroupDraft = Omit<ApproverGroup, 'id' | 'updatedBy' | 'updatedAt'>

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Kensium-style approver chain configuration store (WFE-27 … WFE-39).
 * Edits affect only new requests — in-flight requests keep their original
 * routing (mirrors the definition version-binding rule).
 */
export function useApproverGroups({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [groups, setGroups] = useState<ApproverGroup[]>(seedApproverGroups)

  const addGroup = useCallback(
    (draft: ApproverGroupDraft) => {
      const group: ApproverGroup = {
        ...draft,
        id: `ag-${crypto.randomUUID().slice(0, 6)}`,
        updatedBy: actor,
        updatedAt: today(),
      }
      setGroups((prev) => [group, ...prev])
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary: `Added ${CATEGORY_LABELS[draft.category]} — ${draft.name}`,
        detail: `Locations: ${draft.locations.join(', ') || 'All'} · chain: ${draft.approvers.join(' → ')}.`,
        refId: group.id,
      })
      toast.success(`${CATEGORY_LABELS[draft.category]} configuration added`)
      return group
    },
    [append, actor, actorRole]
  )

  const updateGroup = useCallback(
    (id: string, draft: ApproverGroupDraft) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, ...draft, updatedBy: actor, updatedAt: today() } : g
        )
      )
      append({
        actor,
        actorRole,
        company: 'Aurora Foods',
        category: 'config',
        summary: `Updated ${CATEGORY_LABELS[draft.category]} — ${draft.name}`,
        detail:
          'Subsequent requests route per the updated configuration; in-flight requests are unaffected.',
        refId: id,
      })
      toast.success('Approver configuration updated — new requests follow the new routing')
    },
    [append, actor, actorRole]
  )

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    toast.success('Approver configuration removed')
  }, [])

  const refresh = useCallback(() => {
    toast.info('Approver list refreshed — showing the latest saved routing')
  }, [])

  return { groups, addGroup, updateGroup, deleteGroup, refresh }
}

export type ApproverGroupsStore = ReturnType<typeof useApproverGroups>
