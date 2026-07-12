/**
 * Module-level external asset store. The asset master list lives here (not in
 * page-local state) so that:
 *  - the /assets page subscribes via useSyncExternalStore and keeps its
 *    existing AssetsStore API unchanged, and
 *  - other modules (e.g. lifecycle exit clearance) can read the same live
 *    data through the read-only bridge in `exit-clearance.ts` without
 *    mounting the assets page first.
 */
import { seedAssets, type Asset } from './assets'

let assets: Asset[] = seedAssets
const listeners = new Set<() => void>()

/** Current snapshot — treat as read-only; mutate only via `mutateAssets`. */
export function getAssetsSnapshot(): Asset[] {
  return assets
}

export function subscribeAssets(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Applies an immutable update and notifies every subscriber. */
export function mutateAssets(updater: (prev: Asset[]) => Asset[]): void {
  assets = updater(assets)
  listeners.forEach((l) => l())
}
