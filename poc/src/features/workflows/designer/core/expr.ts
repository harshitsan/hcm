import type { Config } from './model'

export type Ctx = {
  payload: unknown
  input: unknown
  vars: Record<string, unknown>
  item?: unknown
  index?: number
}

export type EvalResult = { ok: true; value: unknown } | { ok: false; error: string }

export function evalExpr(expr: string, ctx: Ctx): EvalResult {
  try {
    // POC evaluator: client-side only, evaluating the user's own expressions
    const fn = new Function('payload', 'input', 'vars', 'item', 'index',
      `"use strict"; return (${expr});`)
    return { ok: true, value: fn(ctx.payload, ctx.input, ctx.vars, ctx.item, ctx.index) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export function runCode(body: string, ctx: Ctx): EvalResult {
  try {
    const fn = new Function('payload', 'input', 'vars', 'item', 'index',
      `"use strict"; ${body}`)
    return { ok: true, value: fn(ctx.payload, ctx.input, ctx.vars, ctx.item, ctx.index) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export function interpolate(template: string, ctx: Ctx): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, expr: string) => {
    const r = evalExpr(expr.trim(), ctx)
    if (!r.ok) return `{{error: ${r.error}}}`
    return typeof r.value === 'string' ? r.value : JSON.stringify(r.value)
  })
}

export type MappingRow = { target: string; source: string }

export function applyMapping(rows: MappingRow[], ctx: Ctx): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const row of rows) {
    if (!row.target || !row.source) continue
    const r = evalExpr(row.source, ctx)
    const value = r.ok ? r.value : `{{error: ${r.error}}}`
    const parts = row.target.split('.')
    let cursor = out
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]
      if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {}
      cursor = cursor[key] as Record<string, unknown>
    }
    cursor[parts[parts.length - 1]] = value
  }
  return out
}

export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'undefined'

export function typeOfValue(v: unknown): ValueType {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined') return t
  return 'object'
}

export type RuleOp =
  | 'exists' | 'notExists' | 'isEmpty'
  | 'equals' | 'notEquals'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'isTrue' | 'isFalse'
  | 'typeIs'

export const RULE_OPS: Array<{ op: RuleOp; label: string; needsValue: boolean; valueKind?: 'type' }> = [
  { op: 'equals', label: 'equals', needsValue: true },
  { op: 'notEquals', label: 'not equals', needsValue: true },
  { op: 'contains', label: 'contains', needsValue: true },
  { op: 'startsWith', label: 'starts with', needsValue: true },
  { op: 'endsWith', label: 'ends with', needsValue: true },
  { op: 'gt', label: '> greater than', needsValue: true },
  { op: 'gte', label: '≥ at least', needsValue: true },
  { op: 'lt', label: '< less than', needsValue: true },
  { op: 'lte', label: '≤ at most', needsValue: true },
  { op: 'isTrue', label: 'is true', needsValue: false },
  { op: 'isFalse', label: 'is false', needsValue: false },
  { op: 'exists', label: 'exists', needsValue: false },
  { op: 'notExists', label: 'does not exist', needsValue: false },
  { op: 'isEmpty', label: 'is empty', needsValue: false },
  { op: 'typeIs', label: 'type is', needsValue: true, valueKind: 'type' },
]

export const VALUE_TYPES: ValueType[] = ['string', 'number', 'boolean', 'array', 'object', 'null']

function parseRuleValue(raw: string | undefined): unknown {
  if (raw === undefined) return undefined
  try { return JSON.parse(raw) } catch { return raw }
}

export type Cond =
  | { kind: 'expr'; expr: string }
  | { kind: 'rule'; field: string; op: RuleOp; value?: string }

export function branchCond(config: Config): Cond | null {
  const cond = config.cond as Cond | undefined
  if (cond && typeof cond === 'object' && 'kind' in cond) {
    if (cond.kind === 'expr') return cond.expr ? cond : null
    if (cond.kind === 'rule') return cond.field && cond.op ? cond : null
  }
  const legacy = config.condition
  if (typeof legacy === 'string' && legacy.trim() !== '') return { kind: 'expr', expr: legacy }
  return null
}

export function evalCond(cond: Cond, ctx: Ctx): boolean {
  if (cond.kind === 'expr') {
    const r = evalExpr(cond.expr, ctx)
    return r.ok ? Boolean(r.value) : false
  }
  const resolved = evalExpr(cond.field, ctx)
  const v = resolved.ok ? resolved.value : undefined
  const cmp = parseRuleValue(cond.value)
  switch (cond.op) {
    case 'exists': return v !== undefined && v !== null
    case 'notExists': return v === undefined || v === null
    case 'isEmpty': {
      if (v === undefined || v === null || v === '') return true
      if (Array.isArray(v)) return v.length === 0
      if (typeof v === 'object') return Object.keys(v).length === 0
      return false
    }
    case 'equals': return v === cmp || String(v) === String(cmp)
    case 'notEquals': return !(v === cmp || String(v) === String(cmp))
    case 'contains':
      if (typeof v === 'string') return v.includes(String(cmp))
      if (Array.isArray(v)) return v.some(x => x === cmp || String(x) === String(cmp))
      return false
    case 'startsWith': return typeof v === 'string' && v.startsWith(String(cmp))
    case 'endsWith': return typeof v === 'string' && v.endsWith(String(cmp))
    case 'gt': return Number(v) > Number(cmp)
    case 'gte': return Number(v) >= Number(cmp)
    case 'lt': return Number(v) < Number(cmp)
    case 'lte': return Number(v) <= Number(cmp)
    case 'isTrue': return v === true
    case 'isFalse': return v === false
    case 'typeIs': return typeOfValue(v) === cond.value
  }
}
