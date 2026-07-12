/**
 * Exit clearance (W8) — asset side of the exit workflow.
 *
 * Employees leaving the company must hand every held asset back before their
 * exit can be cleared. This file seeds the in-exit employees the assets
 * module surfaces and exports a clean, read-only bridge —
 * `assetClearanceFor(employeeId)` — that the lifecycle module can consume to
 * block or release its own exit-clearance step. Subscribe with
 * `subscribeAssetClearance` to re-render when asset holdings change.
 */
import { type Asset, type AssetState } from './assets'
import { getAssetsSnapshot, subscribeAssets } from './asset-store'
import { employeeName } from './org'

/** States that count as "still with the employee" for clearance purposes. */
const HELD_STATES: AssetState[] = ['Issued', 'Loan', 'Allocated', 'Lost']

/** An employee going through the exit workflow (W8), seeded for the POC. */
export interface ExitClearanceCase {
  employeeId: string
  employeeName: string
  department: string
  designation: string
  lastWorkingDay: string
  /** Where the exit case originated, e.g. "Exit workflow (W8)". */
  source: string
}

export const seedExitCases: ExitClearanceCase[] = [
  {
    employeeId: 'e-09',
    employeeName: 'Karan Mehta',
    department: 'Operations',
    designation: 'Logistics Manager',
    lastWorkingDay: '2026-06-30',
    source: 'Exit workflow (W8)',
  },
  {
    employeeId: 'e-04',
    employeeName: 'Josh Patel',
    department: 'Sales',
    designation: 'Account Executive',
    lastWorkingDay: '2026-07-31',
    source: 'Exit workflow (W8)',
  },
  {
    employeeId: 'e-06',
    employeeName: 'Nikhil Bose',
    department: 'Engineering',
    designation: 'Platform Engineer',
    lastWorkingDay: '2026-07-15',
    source: 'Exit workflow (W8)',
  },
]

/** Compact, read-only view of one asset for cross-module consumers. */
export interface AssetSummary {
  id: string
  assetTag: string
  name: string
  category: string
  state: AssetState
  issueDate: string | null
  value: number
}

function toSummary(a: Asset): AssetSummary {
  return {
    id: a.id,
    assetTag: a.assetTag,
    name: a.name,
    category: a.category,
    state: a.state,
    issueDate: a.issueDate,
    value: a.value,
  }
}

/**
 * Read-only clearance verdict for one employee: `cleared` is true only when
 * no asset is still with them (Issued / Loan / Allocated / Lost). The
 * lifecycle module can call this to hold its exit-clearance step and list
 * exactly which assets are outstanding.
 */
export function assetClearanceFor(employeeId: string): {
  cleared: boolean
  unreturned: AssetSummary[]
} {
  const unreturned = getAssetsSnapshot()
    .filter((a) => a.holderId === employeeId && HELD_STATES.includes(a.state))
    .map(toSummary)
  return { cleared: unreturned.length === 0, unreturned }
}

/**
 * Notifies when any asset changes, so consumers (e.g. the lifecycle exit
 * view) can pair this with `assetClearanceFor` in useSyncExternalStore.
 */
export function subscribeAssetClearance(listener: () => void): () => void {
  return subscribeAssets(listener)
}

/** A returned-asset row for the per-employee clearance checklist. */
export interface ReturnedAssetRow {
  asset: AssetSummary
  returnedOn: string
}

/**
 * Assets the employee already handed back (their name appears on a
 * Returned-state history entry and they no longer hold the asset).
 */
export function returnedAssetsFor(employeeId: string): ReturnedAssetRow[] {
  const name = employeeName(employeeId)
  const rows: ReturnedAssetRow[] = []
  for (const a of getAssetsSnapshot()) {
    if (a.holderId === employeeId) continue
    const entry = [...a.history]
      .reverse()
      .find((e) => e.newState === 'Returned' && e.employee === name)
    if (entry) rows.push({ asset: toSummary(a), returnedOn: entry.effectiveDate })
  }
  return rows
}
