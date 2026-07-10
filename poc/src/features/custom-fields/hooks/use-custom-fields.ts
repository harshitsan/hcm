import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { summarizeFieldChanges } from '../data/field-engine'
import {
  seedFieldDefinitions,
  seedFieldVersions,
  type FieldDefinition,
  type FieldVersionEntry,
} from '../data/custom-fields'

export type FieldDraft = Omit<
  FieldDefinition,
  'id' | 'order' | 'version' | 'updatedBy' | 'updatedAt'
>

export interface FieldDefinitionsStore {
  fields: FieldDefinition[]
  versions: FieldVersionEntry[]
  addField: (draft: FieldDraft, actor: string) => FieldDefinition
  updateField: (id: string, draft: FieldDraft, actor: string) => void
  deleteField: (id: string) => void
  toggleDefault: (id: string) => void
  reorderFields: (orderedIds: string[]) => void
  refresh: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * App-wide custom field definition store. State is shared across routes via a
 * tiny external store (same pattern as use-business-logic.ts lines 32–53) so
 * that a field created on the Custom Fields route immediately appears on any
 * other route's form without remounting.
 */
let fieldsState: FieldDefinition[] = [...seedFieldDefinitions]
let versionsState: FieldVersionEntry[] = [...seedFieldVersions]
const fieldListeners = new Set<() => void>()

function emitFields() {
  fieldListeners.forEach((l) => l())
}

function mutateFields(updater: (prev: FieldDefinition[]) => FieldDefinition[]) {
  fieldsState = updater(fieldsState)
  emitFields()
}

function mutateVersions(updater: (prev: FieldVersionEntry[]) => FieldVersionEntry[]) {
  versionsState = updater(versionsState)
  emitFields()
}

export function subscribeFields(listener: () => void) {
  fieldListeners.add(listener)
  return () => {
    fieldListeners.delete(listener)
  }
}

export function getFieldsSnapshot() {
  return fieldsState
}

export function getVersionsSnapshot() {
  return versionsState
}

/**
 * In-memory store for custom field definitions. Every definition change is
 * versioned and effective-dated into the governance log (L2 governed config).
 * State is module-level so any component tree can read the latest definitions
 * without prop-drilling or context providers.
 */
export function useFieldDefinitions(): FieldDefinitionsStore {
  const fields = useSyncExternalStore(subscribeFields, getFieldsSnapshot)
  const versions = useSyncExternalStore(subscribeFields, getVersionsSnapshot)

  const logVersion = useCallback(
    (field: FieldDefinition, change: string, actor: string) => {
      mutateVersions((prev) => [
        {
          id: `fv-${crypto.randomUUID().slice(0, 8)}`,
          fieldId: field.id,
          fieldName: field.name,
          version: field.version,
          change,
          changedBy: actor,
          changedAt: today(),
          effectiveDate: field.effectiveDate,
        },
        ...prev,
      ])
    },
    []
  )

  const addField = useCallback(
    (draft: FieldDraft, actor: string) => {
      const field: FieldDefinition = {
        ...draft,
        id: `cf-${crypto.randomUUID().slice(0, 8)}`,
        order: 99, // appended last until explicitly reordered
        version: 1,
        updatedBy: actor,
        updatedAt: today(),
      }
      mutateFields((prev) => [field, ...prev])
      logVersion(field, 'Field created', actor)
      toast.success(`Custom field "${field.name}" created on ${field.entity}`)
      return field
    },
    [logVersion]
  )

  const updateField = useCallback(
    (id: string, draft: FieldDraft, actor: string) => {
      const existing = fieldsState.find((f) => f.id === id)
      if (!existing) return
      const next: FieldDefinition = {
        ...existing,
        ...draft,
        version: existing.version + 1,
        updatedBy: actor,
        updatedAt: today(),
      }
      mutateFields((prev) => prev.map((f) => (f.id === id ? next : f)))
      logVersion(next, summarizeFieldChanges(existing, draft), actor)
      toast.success(
        `"${next.name}" updated — v${next.version} recorded, effective ${next.effectiveDate}`
      )
    },
    [logVersion]
  )

  const deleteField = useCallback((id: string) => {
    mutateFields((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const toggleDefault = useCallback(
    (id: string) => {
      const field = fieldsState.find((f) => f.id === id)
      if (!field) return
      mutateFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, isDefault: !f.isDefault, version: f.version + 1 }
            : f
        )
      )
      toast.success(
        field.isDefault
          ? `"${field.name}" removed from the standard form`
          : `"${field.name}" now shows on the standard form by default`
      )
    },
    []
  )

  const reorderFields = useCallback((orderedIds: string[]) => {
    mutateFields((prev) =>
      prev.map((f) => {
        const idx = orderedIds.indexOf(f.id)
        return idx === -1 ? f : { ...f, order: idx + 1 }
      })
    )
    toast.success('Field order saved — forms will render in the new sequence')
  }, [])

  const refresh = useCallback(() => {
    emitFields()
    toast.info('Field definitions reloaded')
  }, [])

  return {
    fields,
    versions,
    addField,
    updateField,
    deleteField,
    toggleDefault,
    reorderFields,
    refresh,
  }
}
