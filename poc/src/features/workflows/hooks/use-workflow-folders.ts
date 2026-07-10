/**
 * Workflow folders hook (Task 6 — WF Unification).
 *
 * Folder model:
 *   - Derived module folders — computed from the live artifacts' targetModule set;
 *     never stored. id = `fld-mod-${slug}`, carried with `derived: true`.
 *   - User folders — created, renamed, deleted here; id = `fld-${uuid6}`.
 *
 * The hook subscribes to BOTH the artifacts store and the user-folders store so
 * that derived folders re-compute whenever the artifact list changes.
 *
 * Import flow (one-directional, no cycle):
 *   data/workflow-folders  ← this hook  ← use-business-logic
 *   use-business-logic (artifact snapshot) ← this hook
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { subscribe as subscribeArtifacts, getSnapshot as getArtifactsSnapshot } from './use-business-logic'
import {
  subscribeFolders,
  getFoldersSnapshot,
  mutateFolders,
  moduleFolderId,
  createFolder as _createFolder,
  renameFolder as _renameFolder,
  deleteFolder as _deleteFolder,
  importFolders as _importFolders,
} from '../data/workflow-folders'

// ── Re-exports for existing consumers ────────────────────────────────────────
// hub-catalog.tsx, artifact-io.ts, etc. import these from this module —
// keeping them here means zero changes needed downstream.
export type { WorkflowFolder } from '../data/workflow-folders'
export { moduleFolderId, effectiveFolderId, getUserFolders } from '../data/workflow-folders'

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkflowFolders(): {
  folders: import('../data/workflow-folders').WorkflowFolder[]
  createFolder: (name: string) => import('../data/workflow-folders').WorkflowFolder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  importFolders: (incoming: import('../data/workflow-folders').WorkflowFolder[]) => void
} {
  // Subscribe to both stores so derived folders re-compute on artifact changes.
  const artifacts = useSyncExternalStore(subscribeArtifacts, getArtifactsSnapshot)
  const userFolders = useSyncExternalStore(subscribeFolders, getFoldersSnapshot)

  /** Derived module folders — computed from the live set of targetModules. */
  const folders = useMemo(() => {
    const seen = new Set<string>()
    const derived: import('../data/workflow-folders').WorkflowFolder[] = []
    for (const a of artifacts) {
      const id = moduleFolderId(a.targetModule)
      if (!seen.has(id)) {
        seen.add(id)
        derived.push({ id, name: a.targetModule, derived: true })
      }
    }
    // Sort derived folders alphabetically by name, then append user folders.
    derived.sort((a, b) => a.name.localeCompare(b.name))
    return [...derived, ...userFolders]
  }, [artifacts, userFolders])

  /** Create a new user folder. Returns the created folder. */
  const createFolder = useCallback((name: string) => _createFolder(name), [])

  /** Rename a user folder (no-op for derived folder ids). */
  const renameFolder = useCallback((id: string, name: string) => _renameFolder(id, name), [])

  /** Delete a user folder (no-op for derived folder ids). */
  const deleteFolder = useCallback((id: string) => _deleteFolder(id), [])

  /**
   * Bulk-import folders.
   * Deduplication: skip any incoming folder whose id is already present,
   * then skip any remaining incoming folder whose name matches an existing one.
   */
  const importFolders = useCallback(
    (incoming: import('../data/workflow-folders').WorkflowFolder[]) => _importFolders(incoming),
    []
  )

  return { folders, createFolder, renameFolder, deleteFolder, importFolders }
}

// mutateFolders is exported for callers that need direct store mutation
// (currently unused externally but kept for symmetry with the artifact store).
export { mutateFolders }
