import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import {
  ARTIFACT_TYPE_LABELS,
  SCOPE_LABELS,
  normalizeArtifact,
  seedArtifacts,
  type Artifact,
  type ArtifactAttachment,
  type ScopeLevel,
} from '../data/business-logic'
import { KENSIUM_ARTIFACTS } from '../data/kensium-artifacts'
import { getUserFolders, moduleFolderId } from './use-workflow-folders'

/** Author-editable slice; id, version, scopes and history are engine-managed. */
export type ArtifactDraft = Pick<
  Artifact,
  'name' | 'description' | 'type' | 'targetModule' | 'definition'
> & { attachments?: ArtifactAttachment[] }

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/**
 * App-wide artifact store. Module admin panels consume the same catalog the
 * Workflow Engine governs (WFE-49), so state is shared across routes via a
 * tiny external store instead of per-page useState. Seeds = the 18-plus
 * hand-modeled artifacts + the full imported Kensium Configuration catalog.
 */
let artifactState: Artifact[] = [...seedArtifacts, ...KENSIUM_ARTIFACTS].map(normalizeArtifact)
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function mutate(updater: (prev: Artifact[]) => Artifact[]) {
  artifactState = updater(artifactState)
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot() {
  return artifactState
}

/** Plain accessor — returns the current artifact snapshot synchronously.
 *  Used by triggerFormFlows (A7) so it can be called outside React render. */
export function getArtifacts() {
  return artifactState
}

/**
 * One business-logic engine behind every configuration screen (WFE-43 …
 * WFE-49): artifacts are authored once, attached to a target module, versioned
 * on every edit, and enabled/disabled per tenant scope level with a full
 * enable/disable history.
 */
export function useBusinessLogic({ actor }: { actor: string }) {
  const artifacts = useSyncExternalStore(subscribe, getSnapshot)

  /** New artifacts start at v1, enabled only at Company scope (WFE-44). */
  const createArtifact = useCallback(
    (draft: ArtifactDraft) => {
      const artifact: Artifact = {
        ...draft,
        id: `bl-${crypto.randomUUID().slice(0, 6)}`,
        version: 1,
        scopes: { platform: false, portfolio: false, group: false, company: true },
        attachments: draft.attachments ?? [{ module: draft.targetModule }],
        updatedBy: actor,
        updatedAt: today(),
        history: [
          { at: now(), actor, event: 'Created v1 — enabled at Company' },
        ],
      }
      mutate((prev) => [artifact, ...prev])
      toast.success(
        `${ARTIFACT_TYPE_LABELS[draft.type]} "${draft.name}" created — v1 targeting ${draft.targetModule}`
      )
      return artifact
    },
    [actor]
  )

  /** Edits bump the version and append a history entry (WFE-48). */
  const updateArtifact = useCallback(
    (id: string, draft: ArtifactDraft) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target) return
      const nextVersion = target.version + 1
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...draft,
                version: nextVersion,
                updatedBy: actor,
                updatedAt: today(),
                history: [
                  ...a.history,
                  { at: now(), actor, event: `Edited — v${nextVersion}` },
                ],
              }
            : a
        )
      )
      toast.success(
        `"${draft.name}" saved as v${nextVersion} — prior versions stay in history`
      )
    },
    [actor, artifacts]
  )

  /** Independent per-level enable/disable with history entry (WFE-47/48). */
  const toggleScope = useCallback(
    (id: string, level: ScopeLevel) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target) return
      const enabled = !target.scopes[level]
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                scopes: { ...a.scopes, [level]: enabled },
                history: [
                  ...a.history,
                  {
                    at: now(),
                    actor,
                    event: `${enabled ? 'Enabled' : 'Disabled'} at ${SCOPE_LABELS[level]}`,
                  },
                ],
              }
            : a
        )
      )
      toast.success(
        `"${target.name}" ${enabled ? 'enabled' : 'disabled'} at ${SCOPE_LABELS[level]} scope`
      )
    },
    [actor, artifacts]
  )

  /** Attach an artifact to an additional module/submodule (dedupes). */
  const attach = useCallback(
    (id: string, attachment: ArtifactAttachment) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target) return
      const alreadyAttached = target.attachments.some(
        (x) => x.module === attachment.module && x.submodule === attachment.submodule
      )
      if (alreadyAttached) return
      const label = attachment.submodule
        ? `${attachment.module} / ${attachment.submodule}`
        : attachment.module
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                attachments: [...a.attachments, attachment],
                history: [
                  ...a.history,
                  { at: now(), actor, event: `Attached to ${label}` },
                ],
              }
            : a
        )
      )
      toast.success(`"${target.name}" attached to ${label}`)
    },
    [actor, artifacts]
  )

  /** Detach an artifact from a module/submodule attachment point. */
  const detach = useCallback(
    (id: string, attachment: ArtifactAttachment) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target) return
      if (target.attachments.length <= 1) {
        toast.error('Cannot detach the last attachment — a workflow must stay attached to at least one module')
        return
      }
      const label = attachment.submodule
        ? `${attachment.module} / ${attachment.submodule}`
        : attachment.module
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                attachments: a.attachments.filter(
                  (x) => !(x.module === attachment.module && x.submodule === attachment.submodule)
                ),
                history: [
                  ...a.history,
                  { at: now(), actor, event: `Detached from ${label}` },
                ],
              }
            : a
        )
      )
      toast.success(`"${target.name}" detached from ${label}`)
    },
    [actor, artifacts]
  )

  /** Deletion is confirmed at the call site (AlertDialog in the detail view). */
  const deleteArtifact = useCallback(
    (id: string) => {
      const target = artifacts.find((a) => a.id === id)
      mutate((prev) => prev.filter((a) => a.id !== id))
      if (target) {
        toast.success(
          `"${target.name}" removed — ${target.targetModule} no longer consumes it`
        )
      }
    },
    [artifacts]
  )

  /**
   * Bulk-import from a parsed bundle (A4).
   *
   * Collision handling: if an incoming artifact id already exists in the store,
   * it is imported as a NEW artifact — fresh id, name suffixed " (imported)",
   * version reset to 1, history entry noting the original id.
   *
   * Returns { imported, renamed } counts for the summary toast.
   */
  const importArtifacts = useCallback(
    (incoming: Artifact[]): { imported: number; renamed: number } => {
      const existingIds = new Set(artifactState.map((a) => a.id))
      let renamed = 0
      const toAdd: Artifact[] = incoming.map((a) => {
        if (existingIds.has(a.id)) {
          renamed += 1
          const originalId = a.id
          const freshId = `bl-${crypto.randomUUID().slice(0, 6)}`
          existingIds.add(freshId)
          return {
            ...a,
            id: freshId,
            name: `${a.name} (imported)`,
            version: 1,
            history: [
              ...a.history,
              {
                at: now(),
                actor,
                event: `Imported — copy of ${originalId}`,
              },
            ],
          }
        }
        existingIds.add(a.id)
        return a
      })
      mutate((prev) => [...toAdd, ...prev])
      return { imported: toAdd.length, renamed }
    },
    [actor]
  )

  /**
   * Move an artifact into a folder (or to the catalog root when folderId is null).
   *
   * folderId semantics:
   *   string — a user folder id or a module folder id (stored explicitly so the
   *             artifact stays in that folder even if its targetModule changes)
   *   null   — explicitly ungrouped / placed at catalog root
   *
   * History entry:
   *   Moving into a folder  → `Moved to folder "X"` (folder name looked up)
   *   Moving to root        → `Moved to catalog root`
   */
  const moveToFolder = useCallback(
    (id: string, folderId: string | null) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target) return

      let historyEvent: string
      let toastMsg: string
      if (folderId === null) {
        historyEvent = 'Moved to catalog root'
        toastMsg = `"${target.name}" moved to catalog root`
      } else {
        // Look up the folder name: user folders first, then derived module
        // folders (fld-mod-* ids map back to a live artifact's targetModule),
        // falling back to the raw id.
        const userFolder = getUserFolders().find((f) => f.id === folderId)
        let folderName = userFolder?.name
        if (!folderName && folderId.startsWith('fld-mod-')) {
          folderName = artifacts.find(
            (a) => moduleFolderId(a.targetModule) === folderId
          )?.targetModule
        }
        folderName = folderName ?? folderId
        historyEvent = `Moved to folder "${folderName}"`
        toastMsg = `"${target.name}" moved to folder "${folderName}"`
      }

      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                folderId,
                history: [
                  ...a.history,
                  { at: now(), actor, event: historyEvent },
                ],
              }
            : a
        )
      )
      toast.success(toastMsg)
    },
    [actor, artifacts]
  )

  return { artifacts, createArtifact, updateArtifact, toggleScope, attach, detach, deleteArtifact, importArtifacts, moveToFolder }
}

export type BusinessLogicStore = ReturnType<typeof useBusinessLogic>
