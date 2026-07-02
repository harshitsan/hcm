import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedArrivals,
  seedOutbound,
  type ArrivalRecord,
  type OutboundRecord,
} from '../data/movements'
import { CURRENT_ADMIN, todayIso } from '../data/org'

export interface ArrivalDraft {
  category: string
  name: string
  vendor: string
  procuredDate: string
  invoiceNumber: string
  approvedQuantity: number
  totalValue: number
}

export interface OutboundDraft {
  category: string
  name: string
  vendor: string
  passNumber: string
  passDate: string
  reason: string
}

/**
 * In-memory store for inbound arrivals (ASM-32/33) and outbound gate-pass
 * movements (ASM-34/35). Approval decisions log actor + timestamp.
 */
export function useMovements() {
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>(seedArrivals)
  const [outbound, setOutbound] = useState<OutboundRecord[]>(seedOutbound)

  const addArrival = useCallback((draft: ArrivalDraft) => {
    const record: ArrivalRecord = {
      ...draft,
      id: `ar-${crypto.randomUUID().slice(0, 8)}`,
      assetTagPrefix: 'AST',
      status: 'Pending Approval',
      recordedBy: CURRENT_ADMIN,
      recordedOn: todayIso(),
      decidedBy: null,
      decidedOn: null,
    }
    setArrivals((prev) => [record, ...prev])
    toast.success(`Arrival ${draft.invoiceNumber} recorded — Pending Approval`)
  }, [])

  /** Returns the approved record so the caller can admit units to inventory. */
  const decideArrival = useCallback(
    (id: string, approved: boolean): ArrivalRecord | null => {
      const record = arrivals.find((a) => a.id === id)
      if (!record || record.status !== 'Pending Approval') return null
      setArrivals((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: approved ? 'Approved' : 'Rejected', decidedBy: CURRENT_ADMIN, decidedOn: todayIso() }
            : a
        )
      )
      if (!approved) {
        toast.success(`Arrival ${record.invoiceNumber} rejected — no assets admitted. Decision logged.`)
      }
      return approved ? record : null
    },
    [arrivals]
  )

  const addOutbound = useCallback((draft: OutboundDraft) => {
    const record: OutboundRecord = {
      ...draft,
      id: `ob-${crypto.randomUUID().slice(0, 8)}`,
      status: 'Pending Approval',
      recordedBy: CURRENT_ADMIN,
      recordedOn: todayIso(),
      decidedBy: null,
      decidedOn: null,
    }
    setOutbound((prev) => [record, ...prev])
    toast.success(`Outbound record created with security pass ${draft.passNumber} — Pending Approval`)
  }, [])

  const decideOutbound = useCallback((id: string, approved: boolean) => {
    setOutbound((prev) =>
      prev.map((o) => {
        if (o.id !== id || o.status !== 'Pending Approval') return o
        toast.success(
          approved
            ? `Outbound approved — security pass ${o.passNumber} is now valid for removal`
            : `Outbound rejected — ${o.name} is not authorised to leave the premises`
        )
        return { ...o, status: approved ? 'Approved' : 'Rejected', decidedBy: CURRENT_ADMIN, decidedOn: todayIso() }
      })
    )
  }, [])

  return { arrivals, addArrival, decideArrival, outbound, addOutbound, decideOutbound }
}

export type MovementsStore = ReturnType<typeof useMovements>
