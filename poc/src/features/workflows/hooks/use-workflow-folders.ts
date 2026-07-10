/**
 * Workflow folders store (Task 6 — WF Unification).
 *
 * Folder model:
 *   - Derived module folders — computed from the live artifacts' targetModule set;
 *     never stored. id = `fld-mod-${slug}`, carried with `derived: true`.
 *   - User folders — created, renamed, deleted here; id = `fld-${uuid6}`.
 *
 * The hook subscribes to BOTH the artifacts store and the user-folders store so
 * that derived folders re-compute whenever the artifact list changes.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { TargetModule } from '../data/business-logic'
import { subscribe as subscribeArtifacts, getSnapshot as getArtifactsSnapshot } from './use-business-logic'

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowFolder {
  id: string
  name: string
  derived?: boolean
}

// ── Derived-folder helpers ───────────────────────────────────────────────────

/**
 * Returns the deterministic id for a module's derived folder.
 * slug = lowercase, non-alphanumeric chars → '-'
 */
export function moduleFolderId(m: TargetModule): string {
  const slug = m
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `fld-mod-${slug}`
}

/**
 * Resolves the effective folder for an artifact:
 *   undefined folderId → derived module folder
 *   null folderId      → null (catalog root / ungrouped)
 *   string folderId    → the stored id as-is
 */
export function effectiveFolderId(a: {
  folderId?: string | null
  targetModule: TargetModule
}): string | null {
  return a.folderId === undefined ? moduleFolderId(a.targetModule) : a.folderId
}

// ── User-folder external store ───────────────────────────────────────────────

let userFolderState: WorkflowFolder[] = []
const folderListeners = new Set<() => void>()

function emitFolders() {
  folderListeners.forEach((l) => l())
}

function mutateFolders(updater: (prev: WorkflowFolder[]) => WorkflowFolder[]) {
  userFolderState = updater(userFolderState)
  emitFolders()
}

export function subscribe(listener: () => void): () => void {
  folderListeners.add(listener)
  return () => {
    folderListeners.delete(listener)
  }
}

export function getSnapshot(): WorkflowFolder[] {
  return userFolderState
}

/** Plain sync accessor for the user-folder list (usable outside React render). */
export function getUserFolders(): WorkflowFolder[] {
  return userFolderState
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkflowFolders(): {
  folders: WorkflowFolder[]
  createFolder: (name: string) => WorkflowFolder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  importFolders: (incoming: WorkflowFolder[]) => void
} {
  // Subscribe to both stores so derived folders re-compute on artifact changes.
  const artifacts = useSyncExternalStore(subscribeArtifacts, getArtifactsSnapshot)
  const userFolders = useSyncExternalStore(subscribe, getSnapshot)

  /** Derived module folders — computed from the live set of targetModules. */
  const folders = useMemo<WorkflowFolder[]>(() => {
    const seen = new Set<string>()
    const derived: WorkflowFolder[] = []
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
  const createFolder = useCallback((name: string): WorkflowFolder => {
    const folder: WorkflowFolder = {
      id: `fld-${crypto.randomUUID().slice(0, 6)}`,
      name,
    }
    mutateFolders((prev) => [...prev, folder])
    return folder
  }, [])

  /** Rename a user folder (no-op for derived folder ids). */
  const renameFolder = useCallback((id: string, name: string): void => {
    if (id.startsWith('fld-mod-')) return // guard: derived folders are read-only
    mutateFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    )
  }, [])

  /** Delete a user folder (no-op for derived folder ids). */
  const deleteFolder = useCallback((id: string): void => {
    if (id.startsWith('fld-mod-')) return // guard: derived folders cannot be deleted
    mutateFolders((prev) => prev.filter((f) => f.id !== id))
  }, [])

  /**
   * Bulk-import folders.
   * Deduplication: skip any incoming folder whose id is already present,
   * then skip any remaining incoming folder whose name matches an existing one.
   */
  const importFolders = useCallback((incoming: WorkflowFolder[]): void => {
    mutateFolders((prev) => {
      const existingIds = new Set(prev.map((f) => f.id))
      const existingNames = new Set(prev.map((f) => f.name.toLowerCase()))
      const toAdd: WorkflowFolder[] = []
      for (const f of incoming) {
        if (f.derived) continue // never store derived folders
        if (existingIds.has(f.id)) continue
        if (existingNames.has(f.name.toLowerCase())) continue
        existingIds.add(f.id)
        existingNames.add(f.name.toLowerCase())
        toAdd.push(f)
      }
      return [...prev, ...toAdd]
    })
  }, [])

  return { folders, createFolder, renameFolder, deleteFolder, importFolders }
}
