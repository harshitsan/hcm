/**
 * Serialization / deserialization for the artifact catalog (Task A4).
 *
 * Format: a JSON envelope (`ArtifactBundle`) wrapping one or more `Artifact`
 * objects.  The `format` magic string guards against importing the wrong file
 * type; `version` is reserved for future schema migrations.
 */
import {
  ARTIFACT_TYPES,
  SCOPE_LEVELS,
  TARGET_MODULES,
  normalizeArtifact,
  type Artifact,
} from './business-logic'
import { isValidDocShape } from '../designer/state/store'
import type { WorkflowFolder } from '../hooks/use-workflow-folders'

// ── Public types ─────────────────────────────────────────────────────────────

export interface ArtifactBundle {
  format: 'satellitehr.artifacts'
  version: 1
  exportedAt: string  // ISO-8601
  artifacts: Artifact[]
  /** User folders referenced by exported artifacts. Additive — old bundles omit this key. */
  folders?: WorkflowFolder[]
}

export type ParseResult =
  | { ok: true; artifacts: Artifact[]; folders?: WorkflowFolder[] }
  | { ok: false; error: string }

// ── serialize ─────────────────────────────────────────────────────────────────

export function serializeBundle(artifacts: Artifact[], folders?: WorkflowFolder[]): string {
  const bundle: ArtifactBundle = {
    format: 'satellitehr.artifacts',
    version: 1,
    exportedAt: new Date().toISOString(),
    artifacts,
    ...(folders && folders.length > 0 ? { folders } : {}),
  }
  return JSON.stringify(bundle, null, 2)
}

// ── validate ─────────────────────────────────────────────────────────────────

function isArtifactValid(a: unknown): a is Artifact {
  if (!a || typeof a !== 'object') return false
  const obj = a as Record<string, unknown>

  // Required string fields
  if (typeof obj.id !== 'string' || !obj.id) return false
  if (typeof obj.name !== 'string' || !obj.name) return false

  // type must be one of ARTIFACT_TYPES
  if (!ARTIFACT_TYPES.includes(obj.type as typeof ARTIFACT_TYPES[number])) return false

  // definition.kind must match type
  const def = obj.definition as Record<string, unknown> | null | undefined
  if (!def || typeof def !== 'object') return false
  if (def.kind !== obj.type) return false

  // For flow artifacts, validate the embedded doc shape
  if (def.kind === 'flow' && !isValidDocShape(def.doc)) return false

  // scopes must have all 4 SCOPE_LEVELS as booleans
  const scopes = obj.scopes as Record<string, unknown> | null | undefined
  if (!scopes || typeof scopes !== 'object') return false
  for (const level of SCOPE_LEVELS) {
    if (typeof scopes[level] !== 'boolean') return false
  }

  // description must be a string (consumers call .toLowerCase())
  if (typeof obj.description !== 'string') return false

  // targetModule must be a known module (consumers use it as a key)
  if (!TARGET_MODULES.includes(obj.targetModule as typeof TARGET_MODULES[number])) return false

  // history must be an array (consumers spread it)
  if (!Array.isArray(obj.history)) return false

  // attachments, if present, must be an array of objects with a string module
  if (
    obj.attachments !== undefined &&
    !(Array.isArray(obj.attachments) &&
      (obj.attachments as unknown[]).every(
        (x) => x != null && typeof (x as Record<string, unknown>).module === 'string'
      ))
  ) return false

  return true
}

// ── parse ─────────────────────────────────────────────────────────────────────

export function parseBundle(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, error: `JSON parse error: ${(e as Error).message}` }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'File is not a valid workflow bundle (expected a JSON object).' }
  }

  const obj = parsed as Record<string, unknown>

  if (obj.format !== 'satellitehr.artifacts') {
    return {
      ok: false,
      error: `Unrecognised bundle format "${String(obj.format ?? '')}" — expected a workflow bundle.`,
    }
  }

  if (obj.version !== 1) {
    return {
      ok: false,
      error: `Unsupported workflow bundle version ${String(obj.version ?? '')} — only version 1 is supported.`,
    }
  }

  if (!Array.isArray(obj.artifacts)) {
    // References the literal JSON key ("artifacts") so debugging a bad bundle
    // file isn't misdirected by the UI-level workflow rename.
    return { ok: false, error: 'Bundle "artifacts" field must be an array.' }
  }

  const artifacts: Artifact[] = []
  for (let i = 0; i < (obj.artifacts as unknown[]).length; i++) {
    const a = (obj.artifacts as unknown[])[i]
    if (!isArtifactValid(a)) {
      return {
        ok: false,
        error: `Workflow at index ${i} failed validation (id="${(a as Record<string,unknown>)?.id ?? '?'}").`,
      }
    }
    // Run through normalizeArtifact so pre-attachments bundles import cleanly.
    artifacts.push(normalizeArtifact(a as Artifact))
  }

  // Validate optional folders array when present.
  if (obj.folders !== undefined) {
    if (!Array.isArray(obj.folders)) {
      return { ok: false, error: 'Workflow bundle "folders" field must be an array.' }
    }
    for (let i = 0; i < (obj.folders as unknown[]).length; i++) {
      const f = (obj.folders as unknown[])[i]
      if (
        !f ||
        typeof f !== 'object' ||
        typeof (f as Record<string, unknown>).id !== 'string' ||
        typeof (f as Record<string, unknown>).name !== 'string'
      ) {
        return {
          ok: false,
          error: `Workflow bundle folder at index ${i} is invalid — each folder must have a string "id" and string "name".`,
        }
      }
    }
    return { ok: true, artifacts, folders: obj.folders as WorkflowFolder[] }
  }

  return { ok: true, artifacts }
}
