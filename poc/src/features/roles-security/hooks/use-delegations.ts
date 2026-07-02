import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import {
  seedApprovals,
  seedDelegations,
  type ApprovalItem,
  type DelegatableActivity,
  type Delegation,
} from '../data/delegations'
import { personById, personName } from '../data/directory'
import type { AuditAppendInput, NotifyInput } from './use-security-audit'

export interface DelegationDraft {
  ownerId: string
  delegateId: string
  activities: DelegatableActivity[]
  startDate: string
  endDate: string | null
}

interface UseDelegationsOptions {
  append: (input: AuditAppendInput) => void
  notify: (input: NotifyInput) => void
  actor: string
  actorRole: Role
}

/**
 * Delegation store + approval routing (RSEC-04, RSEC-05, RSEC-21).
 * Delegations are rejected unless owner and delegate share a company; while
 * a delegation is active the workflow engine routes the owner's matching
 * approvals to the delegate, and decisions capture both parties.
 */
export function useDelegations({
  append,
  notify,
  actor,
  actorRole,
}: UseDelegationsOptions) {
  const [delegations, setDelegations] =
    useState<Delegation[]>(seedDelegations)
  const [approvals, setApprovals] = useState<ApprovalItem[]>(seedApprovals)

  /** Active delegation covering an owner + activity, if any (RSEC-21). */
  const activeDelegationFor = useCallback(
    (ownerId: string, activity: DelegatableActivity): Delegation | null =>
      delegations.find(
        (d) =>
          d.status === 'Active' &&
          d.ownerId === ownerId &&
          d.activities.includes(activity)
      ) ?? null,
    [delegations]
  )

  /** Where the workflow engine routes a pending approval right now. */
  const routedApproverId = useCallback(
    (item: ApprovalItem): string => {
      const delegation = activeDelegationFor(item.ownerId, item.activity)
      return delegation ? delegation.delegateId : item.ownerId
    },
    [activeDelegationFor]
  )

  const createDelegation = useCallback(
    (draft: DelegationDraft): boolean => {
      const owner = personById(draft.ownerId)
      const delegate = personById(draft.delegateId)
      if (!owner || !delegate) return false
      // RSEC-04: delegation is restricted to users of the same company.
      if (owner.companyId !== delegate.companyId) {
        toast.error(
          `Delegation rejected — ${delegate.name} belongs to a different company. You can only delegate within your own company.`
        )
        return false
      }
      if (!delegate.isUser) {
        toast.error(
          `Delegation rejected — ${delegate.name} has no system login and cannot act as a delegate.`
        )
        return false
      }
      const delegation: Delegation = {
        ...draft,
        id: `dlg-${crypto.randomUUID().slice(0, 8)}`,
        companyId: owner.companyId,
        status: 'Active',
      }
      setDelegations((prev) => [delegation, ...prev])
      append({
        category: 'Delegation',
        actor,
        actorRole,
        target: delegate.name,
        detail: `Delegated ${draft.activities.join(', ')}${draft.endDate ? ` until ${draft.endDate}` : ' (open-ended)'}`,
        sourceCompanyId: owner.companyId,
        targetCompanyId: owner.companyId,
      })
      toast.success(
        `Delegation to ${delegate.name} is active — matching approvals now route to them`
      )
      return true
    },
    [append, actor, actorRole]
  )

  /** RSEC-04: after revocation the delegate can no longer act. */
  const revokeDelegation = useCallback(
    (id: string) => {
      const delegation = delegations.find((d) => d.id === id)
      setDelegations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'Revoked' } : d))
      )
      if (delegation) {
        append({
          category: 'Delegation',
          actor,
          actorRole,
          target: personName(delegation.delegateId),
          detail: 'Delegation revoked — approvals route back to the owner',
          sourceCompanyId: delegation.companyId,
          targetCompanyId: delegation.companyId,
        })
      }
      toast.success('Delegation revoked — new approvals route back to you')
    },
    [append, actor, actorRole, delegations]
  )

  /** Decide an approval; captures owner + acting delegate (RSEC-05, RSEC-21). */
  const decideApproval = useCallback(
    (id: string, decision: 'Approved' | 'Rejected', actingPersonId: string) => {
      const item = approvals.find((a) => a.id === id)
      if (!item) return
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: decision,
                decidedById: actingPersonId,
                decidedOn: new Date().toISOString().slice(0, 10),
              }
            : a
        )
      )
      const viaDelegation = actingPersonId !== item.ownerId
      if (viaDelegation) {
        notify({
          event: 'Delegated approval decided',
          template: 'security/delegated-approval',
          recipients: ['Sunita Patil (Company Admin)'],
          companyId: item.companyId,
        })
      }
      toast.success(
        viaDelegation
          ? `${decision} on behalf of ${personName(item.ownerId)} — the delegate relationship is recorded`
          : `${item.title} ${decision.toLowerCase()}`
      )
    },
    [approvals, notify]
  )

  return {
    delegations,
    approvals,
    activeDelegationFor,
    routedApproverId,
    createDelegation,
    revokeDelegation,
    decideApproval,
  }
}

export type DelegationsStore = ReturnType<typeof useDelegations>
