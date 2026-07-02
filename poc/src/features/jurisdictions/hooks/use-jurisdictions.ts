import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedHistory,
  seedJurisdictions,
  type Jurisdiction,
  type JurisdictionHistoryEntry,
} from '../data/jurisdictions'

export type JurisdictionDraft = Omit<Jurisdiction, 'id' | 'effectiveTo'>

const today = () => new Date().toISOString().slice(0, 10)

/**
 * In-memory jurisdiction catalog store (FR 6.4.1). Every create/update is
 * captured as an effective-dated history version (JUR-12); duplicates by
 * name + type are rejected (JUR-01).
 */
export function useJurisdictions() {
  const [jurisdictions, setJurisdictions] =
    useState<Jurisdiction[]>(seedJurisdictions)
  const [history, setHistory] =
    useState<JurisdictionHistoryEntry[]>(seedHistory)

  const isDuplicate = useCallback(
    (name: string, type: Jurisdiction['type'], excludeId?: string) =>
      jurisdictions.some(
        (j) =>
          j.id !== excludeId &&
          j.type === type &&
          j.name.trim().toLowerCase() === name.trim().toLowerCase()
      ),
    [jurisdictions]
  )

  const appendHistory = useCallback(
    (jurisdictionId: string, summary: string, effectiveFrom: string) => {
      setHistory((prev) => {
        const versions = prev.filter((h) => h.jurisdictionId === jurisdictionId)
        const nextVersion =
          versions.reduce((max, h) => Math.max(max, h.version), 0) + 1
        // Close the currently effective version before opening the next one.
        const closed = prev.map((h) =>
          h.jurisdictionId === jurisdictionId && h.effectiveTo === null
            ? { ...h, effectiveTo: effectiveFrom }
            : h
        )
        return [
          ...closed,
          {
            id: `jh-${crypto.randomUUID().slice(0, 8)}`,
            jurisdictionId,
            version: nextVersion,
            effectiveFrom,
            effectiveTo: null,
            summary,
            changedBy: 'You (Platform Admin)',
            changedAt: today(),
          },
        ]
      })
    },
    []
  )

  const addJurisdiction = useCallback(
    (draft: JurisdictionDraft) => {
      const jurisdiction: Jurisdiction = {
        ...draft,
        id: `jur-${crypto.randomUUID().slice(0, 8)}`,
        effectiveTo: null,
      }
      setJurisdictions((prev) => [jurisdiction, ...prev])
      appendHistory(
        jurisdiction.id,
        'Catalog entry created.',
        draft.effectiveFrom
      )
      toast.success(`${draft.name} added to the supported catalog`)
      return jurisdiction
    },
    [appendHistory]
  )

  const updateJurisdiction = useCallback(
    (id: string, draft: JurisdictionDraft) => {
      setJurisdictions((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...draft } : j))
      )
      appendHistory(
        id,
        'Attributes / tax & fee applicability updated.',
        draft.effectiveFrom
      )
      toast.success(
        `${draft.name} updated — reflected wherever it is referenced`
      )
    },
    [appendHistory]
  )

  /** Deactivate keeps the record (and its references) but stops new use. */
  const deactivateJurisdiction = useCallback(
    (id: string) => {
      const eff = today()
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, status: 'inactive', effectiveTo: eff } : j
        )
      )
      appendHistory(id, 'Deactivated — no longer selectable for new use.', eff)
      toast.success('Jurisdiction deactivated; existing references preserved')
    },
    [appendHistory]
  )

  /** Hard delete — only allowed when nothing references the entry. */
  const deleteJurisdiction = useCallback((id: string) => {
    setJurisdictions((prev) => prev.filter((j) => j.id !== id))
    setHistory((prev) => prev.filter((h) => h.jurisdictionId !== id))
    toast.success('Jurisdiction removed from the catalog')
  }, [])

  return {
    jurisdictions,
    history,
    isDuplicate,
    addJurisdiction,
    updateJurisdiction,
    deactivateJurisdiction,
    deleteJurisdiction,
  }
}

export type JurisdictionsStore = ReturnType<typeof useJurisdictions>
