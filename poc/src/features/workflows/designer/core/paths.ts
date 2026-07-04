import { typeOfValue } from './expr'
import type { ValueType } from './expr'

export type PathEntry = { path: string; type: ValueType; preview: string }

const MAX_DEPTH = 5
const MAX_ENTRIES = 200
const MAX_KEYS_PER_LEVEL = 30

function previewOf(value: unknown): string {
  try {
    const s = JSON.stringify(value)
    if (s === undefined) return 'undefined'
    return s.length > 42 ? s.slice(0, 42) + '…' : s
  } catch {
    return String(value)
  }
}

export function collectPaths(value: unknown, prefix: string, out: PathEntry[] = [], depth = 0): PathEntry[] {
  if (out.length > MAX_ENTRIES) return out
  const type = typeOfValue(value)
  out.push({ path: prefix, type, preview: previewOf(value) })
  if (depth >= MAX_DEPTH) return out
  if (type === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>).slice(0, MAX_KEYS_PER_LEVEL)) {
      const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${prefix}.${key}` : `${prefix}["${key}"]`
      collectPaths((value as Record<string, unknown>)[key], safeKey, out, depth + 1)
    }
  } else if (type === 'array' && (value as unknown[]).length > 0) {
    collectPaths((value as unknown[])[0], `${prefix}[0]`, out, depth + 1)
  }
  return out
}
