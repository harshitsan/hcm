import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAssetArrivals,
  seedTeamEmployeeAssets,
  seedTeamRequisitions,
  type AssetArrival,
  type TeamEmployeeAsset,
  type TeamRequisition,
} from '../data/assets-team'

/** Draft captured by the New Asset Arrival form. */
export interface ArrivalDraft {
  asset: string
  quantity: number
  vendor: string
  poNumber: string
}

/**
 * In-memory store for the manager/coordinator side of Asset Tracking (Team
 * Functions): employee assets, employee requisitions and new asset arrivals.
 */
export function useAssetsTeam() {
  const [employeeAssets, setEmployeeAssets] = useState<TeamEmployeeAsset[]>(
    seedTeamEmployeeAssets
  )
  const [requisitions, setRequisitions] = useState<TeamRequisition[]>(
    seedTeamRequisitions
  )
  const [arrivals, setArrivals] = useState<AssetArrival[]>(seedAssetArrivals)

  /** Manager decision on a pending requisition; approval routes to issuance. */
  const decideRequisition = useCallback(
    (id: string, decision: 'Approved' | 'Rejected') => {
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status:
                  decision === 'Approved' ? 'Pending for Issuance' : 'Rejected',
              }
            : r
        )
      )
      toast.success(
        decision === 'Approved'
          ? 'Requisition approved — routed for issuance'
          : 'Requisition rejected'
      )
    },
    []
  )

  /** Coordinator issues an approved requisition to the employee. */
  const issueRequisition = useCallback((id: string) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'Issued/Acknowledged' } : r
      )
    )
    toast.success('Asset issued — employee asked to acknowledge receipt')
  }, [])

  /** Confirm an employee's asset return. */
  const confirmReturn = useCallback((id: string) => {
    setEmployeeAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Returned' } : a))
    )
    toast.success('Asset return confirmed — added back to inventory')
  }, [])

  /** Record a new stock delivery (New Asset Arrival). */
  const addArrival = useCallback((draft: ArrivalDraft) => {
    const arrival: AssetArrival = {
      id: `arr-${Date.now()}`,
      asset: draft.asset,
      quantity: draft.quantity,
      vendor: draft.vendor,
      poNumber: draft.poNumber,
      receivedOn: new Date().toISOString().slice(0, 10),
      status: 'Awaiting inspection',
    }
    setArrivals((prev) => [arrival, ...prev])
    toast.success('Asset arrival recorded — awaiting inspection')
  }, [])

  /** Inspection passed: arrival stock joins the issuable inventory. */
  const addToInventory = useCallback((id: string) => {
    setArrivals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Added to inventory' } : a))
    )
    toast.success('Stock added to inventory')
  }, [])

  return {
    employeeAssets,
    requisitions,
    arrivals,
    decideRequisition,
    issueRequisition,
    confirmReturn,
    addArrival,
    addToInventory,
  }
}

export type AssetsTeamStore = ReturnType<typeof useAssetsTeam>
