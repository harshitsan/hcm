import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCustomFieldDefs,
  seedPositionHistory,
  seedPositions,
  type Position,
  type PositionCustomFieldDef,
  type PositionHistoryEntry,
} from '../data/positions'

export type PositionDraft = Omit<Position, 'id' | 'createdOn'>

export type PositionsStore = ReturnType<typeof usePositions>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function now(): string {
  return `${today()} ${new Date().toTimeString().slice(0, 5)}`
}

/**
 * In-memory positions catalogue store. Every mutation appends a bitemporal
 * history row (effective period + transaction time) instead of losing the
 * prior state (POS-12/15).
 */
export function usePositions() {
  const [positions, setPositions] = useState<Position[]>(seedPositions)
  const [history, setHistory] =
    useState<PositionHistoryEntry[]>(seedPositionHistory)
  const [customFieldDefs, setCustomFieldDefs] = useState<
    PositionCustomFieldDef[]
  >(seedCustomFieldDefs)

  const logHistory = useCallback(
    (companyId: string, positionId: string, change: string) => {
      setHistory((prev) => [
        {
          id: `ph-${crypto.randomUUID().slice(0, 8)}`,
          companyId,
          positionId,
          change,
          effectiveFrom: today(),
          effectiveTo: null,
          recordedAt: now(),
        },
        ...prev,
      ])
    },
    []
  )

  /** Creates a position with an ID produced by the numbering series. */
  const addPosition = useCallback(
    (draft: PositionDraft, generatedId: string) => {
      const position: Position = {
        ...draft,
        id: generatedId,
        createdOn: today(),
      }
      setPositions((prev) => [position, ...prev])
      logHistory(draft.companyId, generatedId, 'Position created')
      toast.success(`Position ${generatedId} created`)
      return position
    },
    [logHistory]
  )

  const updatePosition = useCallback(
    (id: string, draft: PositionDraft) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...draft } : p))
      )
      logHistory(draft.companyId, id, 'Definition updated (name/department/level/fields)')
      toast.success(`Position ${id} updated`)
    },
    [logHistory]
  )

  /** Deactivate/reactivate without deleting — history stays intact (POS-08/21). */
  const setPositionStatus = useCallback(
    (id: string, status: Position['status']) => {
      setPositions((prev) => {
        const target = prev.find((p) => p.id === id)
        if (target) {
          logHistory(
            target.companyId,
            id,
            status === 'inactive' ? 'Position deactivated' : 'Position reactivated'
          )
        }
        return prev.map((p) => (p.id === id ? { ...p, status } : p))
      })
      toast.success(
        status === 'inactive' ? `${id} deactivated` : `${id} reactivated`
      )
    },
    [logHistory]
  )

  /** Delete is only allowed when no employees hold the position (POS-08). */
  const deletePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id))
    toast.success(`Position ${id} deleted`)
  }, [])

  const addCustomFieldDef = useCallback(
    (def: Omit<PositionCustomFieldDef, 'id'>) => {
      setCustomFieldDefs((prev) => [
        ...prev,
        { ...def, id: `cf-${crypto.randomUUID().slice(0, 8)}` },
      ])
      toast.success(`Custom field "${def.label}" added — no code change needed`)
    },
    []
  )

  const removeCustomFieldDef = useCallback((id: string) => {
    setCustomFieldDefs((prev) => prev.filter((d) => d.id !== id))
    toast.success('Custom field removed')
  }, [])

  return {
    positions,
    history,
    customFieldDefs,
    addPosition,
    updatePosition,
    setPositionStatus,
    deletePosition,
    addCustomFieldDef,
    removeCustomFieldDef,
  }
}
