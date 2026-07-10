import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedRequisitions,
  WITHDRAWABLE_STATUSES,
  type Requisition,
} from '../data/requisitions'
import { CURRENT_ADMIN, employeeById, todayIso } from '../data/org'
import type { FieldValue } from '@/features/custom-fields/data/records'

export interface RequisitionDraft {
  requesterId: string
  assetName: string
  category: string
  quantity: number
  returnBefore: string
  /** A6: custom field values captured from CustomFieldsSection on submit. */
  custom?: Record<string, FieldValue>
}

/**
 * In-memory requisition store covering the raise → approve → (partial)
 * issuance lifecycle (ASM-27..31) plus on-behalf requests (ASM-42).
 */
export function useRequisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(seedRequisitions)
  const [counter, setCounter] = useState(15)

  const raiseRequisition = useCallback(
    (draft: RequisitionDraft, onBehalfBy: string | null, approver: string) => {
      const requester = employeeById(draft.requesterId)
      if (!requester) return
      const number = `ARF-2026-${String(counter).padStart(3, '0')}`
      const requisition: Requisition = {
        id: `rq-${crypto.randomUUID().slice(0, 8)}`,
        number,
        requesterId: requester.id,
        requesterName: requester.name,
        onBehalfBy,
        department: requester.department,
        assetName: draft.assetName,
        category: draft.category,
        quantity: draft.quantity,
        issuedQuantity: 0,
        returnBefore: draft.returnBefore,
        requestedOn: todayIso(),
        status: 'Pending Approval',
        pendingWith: approver,
        rejectionReason: null,
        assignedAssetIds: [],
        history: [
          {
            at: todayIso(),
            event: onBehalfBy
              ? `Raised by ${onBehalfBy} on behalf of ${requester.name} (non-user) — routed to ${approver}`
              : `Raised by ${requester.name} — routed to ${approver}`,
          },
        ],
      }
      setCounter((c) => c + 1)
      setRequisitions((prev) => [requisition, ...prev])
      toast.success(`Requisition ${number} created — Pending Approval with ${approver}`)
    },
    [counter]
  )

  const withdrawRequisition = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        if (!WITHDRAWABLE_STATUSES.includes(r.status)) {
          toast.error(`${r.number} is ${r.status} — issued requisitions can no longer be withdrawn`)
          return r
        }
        toast.success(`${r.number} withdrawn — removed from the approver and issuance queues`)
        return {
          ...r,
          status: 'Withdrawn',
          pendingWith: null,
          history: [...r.history, { at: todayIso(), event: `Withdrawn by ${r.requesterName}` }],
        }
      })
    )
  }, [])

  const approveRequisition = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Pending for Issuance',
              pendingWith: CURRENT_ADMIN,
              history: [...r.history, { at: todayIso(), event: `Approved by ${CURRENT_ADMIN} — moved to issuance queue` }],
            }
          : r
      )
    )
    toast.success('Requisition approved — Pending for Issuance. Requester notified.')
  }, [])

  const rejectRequisition = useCallback((id: string, reason: string) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Rejected',
              pendingWith: null,
              rejectionReason: reason,
              history: [...r.history, { at: todayIso(), event: `Rejected by ${CURRENT_ADMIN} — ${reason}` }],
            }
          : r
      )
    )
    toast.success('Requisition rejected — no asset allocated. Requester notified with the reason.')
  }, [])

  /** Records (partial) issuance against the requested quantity (ASM-31). */
  const assignAssets = useCallback((id: string, assetIds: string[], assetTags: string[]) => {
    setRequisitions((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const issuedQuantity = r.issuedQuantity + assetIds.length
        const full = issuedQuantity >= r.quantity
        toast.success(
          full
            ? `${r.number} fully issued (${issuedQuantity}/${r.quantity}) — receipt acknowledgement raised`
            : `${r.number} partially issued (${issuedQuantity}/${r.quantity}) — balance ${r.quantity - issuedQuantity} stays open`
        )
        return {
          ...r,
          issuedQuantity,
          status: full ? 'Issued/Acknowledged' : 'Pending for Partial Issuance',
          pendingWith: full ? null : CURRENT_ADMIN,
          assignedAssetIds: [...r.assignedAssetIds, ...assetIds],
          history: [
            ...r.history,
            { at: todayIso(), event: `Issued ${assetTags.join(', ')} (${issuedQuantity} of ${r.quantity}) by ${CURRENT_ADMIN}` },
          ],
        }
      })
    )
  }, [])

  return {
    requisitions,
    raiseRequisition,
    withdrawRequisition,
    approveRequisition,
    rejectRequisition,
    assignAssets,
  }
}

export type RequisitionsStore = ReturnType<typeof useRequisitions>
