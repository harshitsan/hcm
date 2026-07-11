import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type FieldDefinition } from '../data/custom-fields'
import { formatFieldValue } from '../data/field-engine'
import {
  seedRecords,
  seedValueHistory,
  type EntityRecord,
  type FieldValue,
  type ValueHistoryEntry,
} from '../data/records'

export interface EntityRecordsStore {
  records: EntityRecord[]
  valueHistory: ValueHistoryEntry[]
  saveRecordValues: (
    recordId: string,
    updates: Record<string, FieldValue>,
    defs: FieldDefinition[],
    actor: string,
    effectiveDate: string
  ) => void
  /**
   * Commit rows that passed the import dry-run (staging → validate →
   * dry-run → commit). Returns how many value changes were versioned.
   */
  importRecordValues: (
    rows: { recordId: string; updates: Record<string, FieldValue> }[],
    defs: FieldDefinition[],
    actor: string
  ) => number
}

/**
 * In-memory store for host-entity records and the bitemporal history of
 * their custom field values. Corrections never destroy earlier versions —
 * every save appends new history rows (L1 persistence model).
 */
export function useEntityRecords(): EntityRecordsStore {
  const [records, setRecords] = useState<EntityRecord[]>(seedRecords)
  const [valueHistory, setValueHistory] =
    useState<ValueHistoryEntry[]>(seedValueHistory)

  const saveRecordValues = useCallback(
    (
      recordId: string,
      updates: Record<string, FieldValue>,
      defs: FieldDefinition[],
      actor: string,
      effectiveDate: string
    ) => {
      const rec = records.find((r) => r.id === recordId)
      if (!rec) return
      const todayIso = new Date().toISOString().slice(0, 10)
      const historyRows: ValueHistoryEntry[] = []
      for (const [fieldId, next] of Object.entries(updates)) {
        const def = defs.find((d) => d.id === fieldId)
        if (!def) continue
        const priorText = formatFieldValue(def, rec.values[fieldId] ?? null)
        const nextText = formatFieldValue(def, next)
        if (priorText === nextText) continue
        historyRows.push({
          id: `vh-${crypto.randomUUID().slice(0, 8)}`,
          recordId: rec.id,
          recordName: rec.name,
          fieldId,
          fieldName: def.name,
          priorValue: priorText,
          newValue: nextText,
          effectiveDate,
          changedAt: todayIso,
          changedBy: actor,
          // Back-dated saves are corrections; they never destroy history.
          kind: effectiveDate < todayIso ? 'correction' : 'change',
        })
      }

      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, values: { ...r.values, ...updates } } : r
        )
      )
      if (historyRows.length) {
        setValueHistory((h) => [...historyRows, ...h])
        toast.success(
          `${rec.name} saved — ${historyRows.length} custom value${
            historyRows.length === 1 ? '' : 's'
          } versioned (effective ${effectiveDate})`
        )
      } else {
        toast.info('No custom field changes to save')
      }
    },
    [records]
  )

  const importRecordValues = useCallback(
    (
      rows: { recordId: string; updates: Record<string, FieldValue> }[],
      defs: FieldDefinition[],
      actor: string
    ) => {
      const todayIso = new Date().toISOString().slice(0, 10)
      const historyRows: ValueHistoryEntry[] = []
      for (const { recordId, updates } of rows) {
        const rec = records.find((r) => r.id === recordId)
        if (!rec) continue
        for (const [fieldId, next] of Object.entries(updates)) {
          const def = defs.find((d) => d.id === fieldId)
          if (!def) continue
          const priorText = formatFieldValue(def, rec.values[fieldId] ?? null)
          const nextText = formatFieldValue(def, next)
          if (priorText === nextText) continue
          historyRows.push({
            id: `vh-${crypto.randomUUID().slice(0, 8)}`,
            recordId: rec.id,
            recordName: rec.name,
            fieldId,
            fieldName: def.name,
            priorValue: priorText,
            newValue: nextText,
            effectiveDate: todayIso,
            changedAt: todayIso,
            changedBy: actor,
            kind: 'change',
          })
        }
      }

      const byRecord = new Map(rows.map((r) => [r.recordId, r.updates]))
      setRecords((prev) =>
        prev.map((r) => {
          const updates = byRecord.get(r.id)
          return updates ? { ...r, values: { ...r.values, ...updates } } : r
        })
      )
      if (historyRows.length) setValueHistory((h) => [...historyRows, ...h])
      return historyRows.length
    },
    [records]
  )

  return { records, valueHistory, saveRecordValues, importRecordValues }
}
