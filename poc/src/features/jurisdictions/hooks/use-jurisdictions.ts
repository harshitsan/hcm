import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  seedHistory,
  seedJurisdictions,
  type Jurisdiction,
  type JurisdictionHistoryEntry,
  type StatutoryApplicability,
  type StatutoryItem,
} from '../data/jurisdictions'

export type JurisdictionDraft = Omit<Jurisdiction, 'id' | 'effectiveTo'>

const today = () => new Date().toISOString().slice(0, 10)

/** Mirror catalog changes into the central platform audit trail. */
function auditCatalogEvent(
  action: string,
  jurisdiction: Pick<Jurisdiction, 'id' | 'name'>,
  actionType: 'create' | 'update' | 'delete' | 'status-change',
  changes?: { field: string; previousValue: string | null; newValue: string }[]
) {
  publishAuditEvent({
    module: 'Jurisdictions',
    action,
    actor: 'You',
    actorRole: 'Platform Admin',
    entityType: 'Company',
    actionType,
    recordId: jurisdiction.id,
    recordName: `Jurisdiction — ${jurisdiction.name}`,
    changes,
  })
}

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
        // Mid-life addition (O1 edge case): flagged so the catalog shows a
        // "New" chip and the zero-disruption note.
        recentlyAdded: true,
      }
      setJurisdictions((prev) => [jurisdiction, ...prev])
      appendHistory(
        jurisdiction.id,
        'Catalog entry created.',
        draft.effectiveFrom
      )
      auditCatalogEvent('Jurisdiction added to catalog', jurisdiction, 'create')
      toast.success(`${draft.name} added to the catalog`, {
        description:
          'New policy and statutory options are now available where relevant — existing records were not changed.',
      })
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
      auditCatalogEvent(
        'Jurisdiction attributes / tax & fee applicability updated',
        { id, name: draft.name },
        'update'
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
      let name = ''
      setJurisdictions((prev) =>
        prev.map((j) => {
          if (j.id !== id) return j
          name = j.name
          return { ...j, status: 'inactive', effectiveTo: eff }
        })
      )
      appendHistory(id, 'Deactivated — no longer selectable for new use.', eff)
      auditCatalogEvent(
        'Jurisdiction deactivated',
        { id, name },
        'status-change'
      )
      toast.success('Jurisdiction deactivated; existing references preserved')
    },
    [appendHistory]
  )

  /** Hard delete — only allowed when nothing references the entry. */
  const deleteJurisdiction = useCallback(
    (id: string) => {
      const removed = jurisdictions.find((j) => j.id === id)
      setJurisdictions((prev) => prev.filter((j) => j.id !== id))
      setHistory((prev) => prev.filter((h) => h.jurisdictionId !== id))
      if (removed)
        auditCatalogEvent(
          'Jurisdiction removed from catalog',
          removed,
          'delete'
        )
      toast.success('Jurisdiction removed from the catalog')
    },
    [jurisdictions]
  )

  /**
   * Change one statutory item's applicability (O1) — Platform Admin action,
   * versioned in history and mirrored to the audit trail. Display/reference
   * only: no payroll computation happens here.
   */
  const setStatutoryApplicability = useCallback(
    (id: string, itemId: string, applicability: StatutoryApplicability) => {
      const jurisdiction = jurisdictions.find((j) => j.id === id)
      const item = jurisdiction?.statutoryProfile?.items.find(
        (it) => it.id === itemId
      )
      if (!jurisdiction || !item || item.applicability === applicability) return
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === id && j.statutoryProfile
            ? {
                ...j,
                statutoryProfile: {
                  ...j.statutoryProfile,
                  items: j.statutoryProfile.items.map((it) =>
                    it.id === itemId ? { ...it, applicability } : it
                  ),
                },
              }
            : j
        )
      )
      appendHistory(
        id,
        `Statutory item "${item.name}" set to ${applicability.toLowerCase()}.`,
        today()
      )
      auditCatalogEvent(
        'Statutory applicability changed',
        jurisdiction,
        'update',
        [
          {
            field: item.name,
            previousValue: item.applicability,
            newValue: applicability,
          },
        ]
      )
      toast.success(
        `${item.name} is now "${applicability}" for ${jurisdiction.name}`
      )
    },
    [jurisdictions, appendHistory]
  )

  /**
   * Add a statutory item mid-life (O1 edge case): the new option becomes
   * available without disrupting any existing record.
   */
  const addStatutoryItem = useCallback(
    (
      id: string,
      item: Omit<StatutoryItem, 'id'>
    ) => {
      const jurisdiction = jurisdictions.find((j) => j.id === id)
      if (!jurisdiction) return
      const newItem: StatutoryItem = {
        ...item,
        id: `st-${crypto.randomUUID().slice(0, 8)}`,
      }
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                statutoryProfile: {
                  taxRegime: j.statutoryProfile?.taxRegime ?? '',
                  filingCalendar: j.statutoryProfile?.filingCalendar ?? '',
                  items: [...(j.statutoryProfile?.items ?? []), newItem],
                },
              }
            : j
        )
      )
      appendHistory(
        id,
        `Statutory item "${item.name}" added (${item.applicability.toLowerCase()}).`,
        today()
      )
      auditCatalogEvent('Statutory item added', jurisdiction, 'update', [
        { field: item.name, previousValue: null, newValue: item.applicability },
      ])
      toast.success(`${item.name} added to ${jurisdiction.name}`, {
        description:
          'The new statutory option is available going forward — existing records were not changed.',
      })
    },
    [jurisdictions, appendHistory]
  )

  /** Set up or revise the statutory profile labels (regime + filing note). */
  const updateStatutoryDetails = useCallback(
    (id: string, taxRegime: string, filingCalendar: string) => {
      const jurisdiction = jurisdictions.find((j) => j.id === id)
      if (!jurisdiction) return
      setJurisdictions((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                statutoryProfile: {
                  taxRegime,
                  filingCalendar,
                  items: j.statutoryProfile?.items ?? [],
                },
              }
            : j
        )
      )
      appendHistory(id, 'Statutory profile details updated.', today())
      auditCatalogEvent(
        'Statutory profile details updated',
        jurisdiction,
        'update'
      )
      toast.success(`Statutory profile saved for ${jurisdiction.name}`)
    },
    [jurisdictions, appendHistory]
  )

  return {
    jurisdictions,
    history,
    isDuplicate,
    addJurisdiction,
    updateJurisdiction,
    deactivateJurisdiction,
    deleteJurisdiction,
    setStatutoryApplicability,
    addStatutoryItem,
    updateStatutoryDetails,
  }
}

export type JurisdictionsStore = ReturnType<typeof useJurisdictions>
