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
  normalizeArtifact,
  type Artifact,
} from './business-logic'
import { isValidDocShape } from '../designer/state/store'

// ── Public types ─────────────────────────────────────────────────────────────

export interface ArtifactBundle {
  format: 'satellitehr.artifacts'
  version: 1
  exportedAt: string  // ISO-8601
  artifacts: Artifact[]
}

export type ParseResult =
  | { ok: true; artifacts: Artifact[] }
  | { ok: false; error: string }

// ── serialize ─────────────────────────────────────────────────────────────────

export function serializeBundle(artifacts: Artifact[]): string {
  const bundle: ArtifactBundle = {
    format: 'satellitehr.artifacts',
    version: 1,
    exportedAt: new Date().toISOString(),
    artifacts,
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
    return { ok: false, error: 'File is not a valid artifact bundle (expected a JSON object).' }
  }

  const obj = parsed as Record<string, unknown>

  if (obj.format !== 'satellitehr.artifacts') {
    return {
      ok: false,
      error: `Unrecognised bundle format "${String(obj.format ?? '')}" — expected "satellitehr.artifacts".`,
    }
  }

  if (obj.version !== 1) {
    return {
      ok: false,
      error: `Unsupported bundle version ${String(obj.version ?? '')} — only version 1 is supported.`,
    }
  }

  if (!Array.isArray(obj.artifacts)) {
    return { ok: false, error: 'Bundle "artifacts" field must be an array.' }
  }

  const artifacts: Artifact[] = []
  for (let i = 0; i < (obj.artifacts as unknown[]).length; i++) {
    const a = (obj.artifacts as unknown[])[i]
    if (!isArtifactValid(a)) {
      return {
        ok: false,
        error: `Artifact at index ${i} failed validation (id="${(a as Record<string,unknown>)?.id ?? '?'}").`,
      }
    }
    // Run through normalizeArtifact so pre-attachments bundles import cleanly.
    artifacts.push(normalizeArtifact(a as Artifact))
  }

  return { ok: true, artifacts }
}
