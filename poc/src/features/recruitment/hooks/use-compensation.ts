import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCompensationSlabs,
  type CompensationSlab,
} from '../data/compensation'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 6)}`
}

/**
 * In-memory compensation-slab store (Kensium PDF — Configuration →
 * Compensation). Slabs carry their salary components; the offer flow matches
 * a slab via findSlab and derives the breakup via computeBreakup.
 */
export function useCompensation() {
  const [slabs, setSlabs] = useState<CompensationSlab[]>(seedCompensationSlabs)

  const addSlab = useCallback((draft: Omit<CompensationSlab, 'id'>) => {
    setSlabs((prev) => [{ ...draft, id: newId('slab') }, ...prev])
    toast.success(`Compensation slab "${draft.name}" saved`)
  }, [])

  const updateSlab = useCallback(
    (id: string, patch: Partial<Omit<CompensationSlab, 'id'>>) => {
      setSlabs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      )
      toast.success(
        'Compensation slab updated — subsequent offers use the new definition'
      )
    },
    []
  )

  const removeSlab = useCallback((id: string) => {
    setSlabs((prev) => prev.filter((s) => s.id !== id))
    toast.success(
      'Compensation slab removed — existing offers keep their captured breakup'
    )
  }, [])

  /** Duplicate a slab (range, applicability and components) under a new name. */
  const copySlab = useCallback((fromId: string, newName: string) => {
    setSlabs((prev) => {
      const src = prev.find((s) => s.id === fromId)
      if (!src) return prev
      return [
        {
          ...src,
          id: newId('slab'),
          name: newName,
          components: src.components.map((c) => ({
            ...c,
            id: newId('comp'),
          })),
        },
        ...prev,
      ]
    })
    toast.success(`Slab copied as "${newName}"`)
  }, [])

  return { slabs, addSlab, updateSlab, removeSlab, copySlab }
}

export type CompensationStore = ReturnType<typeof useCompensation>
