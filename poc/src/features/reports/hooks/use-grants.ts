import { useSyncExternalStore } from 'react'
import { seedAccessGrants, type AccessGrant } from '../data/governance'

/**
 * Module-level RLS grant table (RPT-20) — the single source of truth for
 * company-access scoping. Every reports surface (catalog runs, dashboards,
 * current-status screen, governance panel) reads the same live table via
 * `useSyncExternalStore`, so revoking a grant immediately narrows what a
 * subsequent report run returns.
 */
let grants: AccessGrant[] = seedAccessGrants

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): AccessGrant[] {
  return grants
}

/** Revoke or restore an RLS company-access grant (RPT-20). */
export function updateGrantStatus(id: string, status: AccessGrant['status']) {
  grants = grants.map((g) => (g.id === id ? { ...g, status } : g))
  listeners.forEach((l) => l())
}

/** Subscribe to the live RLS grant table. */
export function useGrants(): AccessGrant[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
