/**
 * W8 — bridge between lifecycle exit cases and the Assets module's exit
 * clearance. The assets register keys on its own org IDs (e-01 … e-14), while
 * exit cases carry employee names, so this file resolves a lifecycle employee
 * to an asset-register record by name (with room for explicit overrides) and
 * exposes a single read-only clearance verdict for the exit workspace.
 *
 * Asset recovery actions (return, write-off) live in the Assets module's
 * Exit clearance screen — the lifecycle side only reads and blocks.
 */
import {
  assetClearanceFor,
  returnedAssetsFor,
  subscribeAssetClearance,
  type AssetSummary,
  type ReturnedAssetRow,
} from '@/features/assets/data/exit-clearance'
import { EMPLOYEES as ASSET_REGISTER_EMPLOYEES } from '@/features/assets/data/org'

/**
 * Explicit lifecycle-name → asset-register-ID overrides for cases where the
 * two modules spell a person differently. Name matching below covers the
 * seeded exits (Karan Mehta → e-09, Josh Patel → e-04, Nikhil Bose → e-06).
 */
const NAME_OVERRIDES: Record<string, string> = {}

/** Asset-register ID for a lifecycle employee, or null when untracked. */
export function assetsOrgIdFor(employeeName: string): string | null {
  const override = NAME_OVERRIDES[employeeName]
  if (override) return override
  const wanted = employeeName.trim().toLowerCase()
  const match = ASSET_REGISTER_EMPLOYEES.find(
    (e) => e.name.trim().toLowerCase() === wanted
  )
  return match?.id ?? null
}

/** Combined asset-clearance verdict for one exiting employee. */
export interface ExitAssetClearance {
  /** False when the employee has no record in the asset register. */
  tracked: boolean
  /** True when no held asset remains with the employee. */
  cleared: boolean
  /** Assets still with the employee (Issued / Loan / Allocated / Lost). */
  unreturned: AssetSummary[]
  /** Assets the employee already handed back. */
  returned: ReturnedAssetRow[]
}

/**
 * Read-only clearance verdict, resolved by employee name. Untracked
 * employees are treated as having no asset hold on the exit.
 */
export function exitAssetClearance(employeeName: string): ExitAssetClearance {
  const id = assetsOrgIdFor(employeeName)
  if (!id) {
    return { tracked: false, cleared: true, unreturned: [], returned: [] }
  }
  const { cleared, unreturned } = assetClearanceFor(id)
  return { tracked: true, cleared, unreturned, returned: returnedAssetsFor(id) }
}

/**
 * Blocking message for finalization while assets are unreturned, or null
 * when the exit is free to finalize on the asset side.
 */
export function assetClearanceBlocker(employeeName: string): string | null {
  const clearance = exitAssetClearance(employeeName)
  if (!clearance.tracked || clearance.cleared) return null
  const n = clearance.unreturned.length
  return `Clearance blocked — ${n} asset(s) unreturned`
}

export { subscribeAssetClearance }
export type { AssetSummary, ReturnedAssetRow }
