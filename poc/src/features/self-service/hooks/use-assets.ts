import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAssetRequisitions,
  seedAssignedAssets,
  type AssetRequisition,
  type AssignedAsset,
} from '../data/assets'

export type RequisitionDraft = Pick<
  AssetRequisition,
  'asset' | 'quantity' | 'returnBefore'
>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** In-memory asset store: requisitions and assigned assets (ESS-31/32). */
export function useAssets() {
  const [requisitions, setRequisitions] = useState<AssetRequisition[]>(
    seedAssetRequisitions
  )
  const [assignedAssets, setAssignedAssets] =
    useState<AssignedAsset[]>(seedAssignedAssets)

  const addRequisition = useCallback((draft: RequisitionDraft) => {
    setRequisitions((prev) => [
      {
        ...draft,
        id: `rq-${crypto.randomUUID().slice(0, 8)}`,
        number: `REQ-2026-${120 + prev.length}`,
        date: today(),
        status: 'Pending Approval',
        task: null,
      },
      ...prev,
    ])
    toast.success('Asset requisition raised and sent for approval')
  }, [])

  const withdrawRequisition = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Withdrawn', task: null } : r))
    )
    toast.success('Requisition withdrawn')
  }, [])

  const returnRequisition = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Returned', task: null } : r))
    )
    toast.success('Asset marked as returned')
  }, [])

  /** ESS-32: acknowledge receipt of an assigned asset. */
  const acknowledgeReceipt = useCallback((id: string) => {
    setAssignedAssets((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'Acknowledged/Issued', task: null } : a
      )
    )
    toast.success('Receipt acknowledged — custody recorded')
  }, [])

  /** ESS-32: confirm return of an assigned asset. */
  const confirmReturn = useCallback((id: string) => {
    setAssignedAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'Returned', returnedOn: today(), task: null }
          : a
      )
    )
    toast.success('Return confirmed — return date recorded')
  }, [])

  return {
    requisitions,
    assignedAssets,
    addRequisition,
    withdrawRequisition,
    returnRequisition,
    acknowledgeReceipt,
    confirmReturn,
  }
}

export type AssetsStore = ReturnType<typeof useAssets>
