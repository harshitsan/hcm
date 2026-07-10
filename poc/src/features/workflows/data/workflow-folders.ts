/**
 * workflow-folders.ts — dependency-free folder data store.
 *
 * Contains everything that does NOT depend on the artifact store:
 *   - WorkflowFolder interface
 *   - moduleFolderId / effectiveFolderId helpers
 *   - User-folder external store (state + listeners + mutateFolders + subscribe/snapshot)
 *   - getUserFolders plain accessor
 *   - Four mutation ops: createFolder, renameFolder, deleteFolder, importFolders
 *
 * The React hook (use-workflow-folders.ts) imports from here and also imports
 * the artifact snapshot from use-business-logic.ts — that import is ONE WAY so
 * no circular dependency exists.
 *
 * A type-only import of TargetModule is fine; business-logic.ts does not import
 * this file.
 */

import type { TargetModule } from './business-logic'

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

export function mutateFolders(updater: (prev: WorkflowFolder[]) => WorkflowFolder[]) {
  userFolderState = updater(userFolderState)
  emitFolders()
}

export function subscribeFolders(listener: () => void): () => void {
  folderListeners.add(listener)
  return () => {
    folderListeners.delete(listener)
  }
}

export function getFoldersSnapshot(): WorkflowFolder[] {
  return userFolderState
}

/** Plain sync accessor for the user-folder list (usable outside React render). */
export function getUserFolders(): WorkflowFolder[] {
  return userFolderState
}

// ── Folder operations ────────────────────────────────────────────────────────

/** Create a new user folder. Returns the created folder. */
export function createFolder(name: string): WorkflowFolder {
  const folder: WorkflowFolder = {
    id: `fld-${crypto.randomUUID().slice(0, 6)}`,
    name,
  }
  mutateFolders((prev) => [...prev, folder])
  return folder
}

/** Rename a user folder (no-op for derived folder ids). */
export function renameFolder(id: string, name: string): void {
  if (id.startsWith('fld-mod-')) return // guard: derived folders are read-only
  mutateFolders((prev) =>
    prev.map((f) => (f.id === id ? { ...f, name } : f))
  )
}

/** Delete a user folder (no-op for derived folder ids). */
export function deleteFolder(id: string): void {
  if (id.startsWith('fld-mod-')) return // guard: derived folders cannot be deleted
  mutateFolders((prev) => prev.filter((f) => f.id !== id))
}

/**
 * Bulk-import folders.
 * Deduplication: skip any incoming folder whose id is already present,
 * then skip any remaining incoming folder whose name matches an existing one
 * (case-insensitive). Never stores derived folders.
 */
export function importFolders(incoming: WorkflowFolder[]): void {
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
}
