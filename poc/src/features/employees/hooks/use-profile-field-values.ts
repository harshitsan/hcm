import { useSyncExternalStore } from 'react'
import { type FieldValue } from '@/features/custom-fields/data/records'

/**
 * Module-level store for the employee's saved custom profile field values
 * (A6 — "Custom profile fields" on My Profile). Unlike component state, saved
 * values survive tab switches and route navigation within the session; like
 * every other POC store they reset on reload (no backend).
 */
let savedValues: Record<string, FieldValue> = {}
const listeners = new Set<() => void>()

export function getProfileFieldValues(): Record<string, FieldValue> {
  return savedValues
}

export function subscribeProfileFieldValues(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Persist the submitted custom profile field values (replaces the set). */
export function saveProfileFieldValues(next: Record<string, FieldValue>) {
  savedValues = { ...next }
  listeners.forEach((l) => l())
}

/** Reactive snapshot of the saved custom profile field values. */
export function useProfileFieldValues(): Record<string, FieldValue> {
  return useSyncExternalStore(
    subscribeProfileFieldValues,
    getProfileFieldValues
  )
}
