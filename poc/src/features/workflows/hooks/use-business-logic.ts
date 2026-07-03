import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ARTIFACT_TYPE_LABELS,
  SCOPE_LABELS,
  seedArtifacts,
  type Artifact,
  type ScopeLevel,
} from '../data/business-logic'

/** Author-editable slice; id, version, scopes and history are engine-managed. */
export type ArtifactDraft = Pick<
  Artifact,
  'name' | 'description' | 'type' | 'targetModule' | 'definition'
>

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/**
 * One business-logic engine behind every configuration screen (WFE-43 …
 * WFE-49): artifacts are authored once, attached to a target module, versioned
 * on every edit, and enabled/disabled per tenant scope level with a full
 * enable/disable history.
 */
export function useBusinessLogic({ actor }: { actor: string }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(seedArtifacts)

  /** New artifacts start at v1, enabled only at Company scope (WFE-44). */
  const createArtifact = useCallback(
    (draft: ArtifactDraft) => {
      const artifact: Artifact = {
        ...draft,
        id: `bl-${crypto.randomUUID().slice(0, 6)}`,
        version: 1,
        scopes: { platform: false, portfolio: false, group: false, company: true },
        updatedBy: actor,
        updatedAt: today(),
        history: [
          { at: now(), actor, event: 'Created v1 — enabled at Company' },
        ],
      }
      setArtifacts((prev) => [artifact, ...prev])
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
      setArtifacts((prev) =>
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
      setArtifacts((prev) =>
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

  /** Deletion is confirmed at the call site (AlertDialog in the detail view). */
  const deleteArtifact = useCallback(
    (id: string) => {
      const target = artifacts.find((a) => a.id === id)
      setArtifacts((prev) => prev.filter((a) => a.id !== id))
      if (target) {
        toast.success(
          `"${target.name}" removed — ${target.targetModule} no longer consumes it`
        )
      }
    },
    [artifacts]
  )

  return { artifacts, createArtifact, updateArtifact, toggleScope, deleteArtifact }
}

export type BusinessLogicStore = ReturnType<typeof useBusinessLogic>
