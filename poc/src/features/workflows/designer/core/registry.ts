import {
  Zap, Repeat, Repeat2, GitBranch, Split, Boxes, ShieldAlert,
  Globe, FileText, Timer, Variable, type LucideIcon,
} from 'lucide-react'
import { makeId } from './model'
import type { Branch, Config, Step, StepKind } from './model'

export type FieldDef = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  options?: string[]
  required?: boolean
}
export type BranchDef = { key: string; label: string; conditional?: boolean }
export type BranchSpec = { fixed: BranchDef[]; addable?: { def: BranchDef; insertBeforeLast: boolean } }
export type NodeDef = {
  kind: StepKind | 'scheduler'
  label: string
  icon: LucideIcon
  category: 'trigger' | 'action' | 'controlFlow'
  accent: 'green' | 'purple' | 'neutral'
  defaultConfig: Config
  configFields: FieldDef[]
  branchSpec?: BranchSpec
  validateConfig?: (config: Config) => string[]
}

const defs: NodeDef[] = [
  {
    kind: 'scheduler', label: 'Scheduler', icon: Zap, category: 'trigger', accent: 'green',
    defaultConfig: {
      cron: '0 * * * *', timezone: 'UTC',
      samplePayload: '{\n  "user": { "name": "Ada", "age": 36 },\n  "items": [\n    { "sku": "A1", "qty": 2 },\n    { "sku": "B2", "qty": 0 }\n  ]\n}',
    },
    configFields: [
      { key: 'cron', label: 'Cron expression', type: 'text', required: true },
      { key: 'timezone', label: 'Timezone', type: 'text' },
      { key: 'samplePayload', label: 'Sample payload (JSON)', type: 'textarea' },
    ],
    validateConfig: config => {
      const raw = config.samplePayload
      if (typeof raw !== 'string' || raw.trim() === '') return []
      try { JSON.parse(raw); return [] } catch { return ['Sample payload is not valid JSON'] }
    },
  },
  {
    kind: 'transform', label: 'Transform', icon: Repeat, category: 'action', accent: 'purple',
    defaultConfig: { mode: 'expression', expression: '', template: '', code: 'return input', mappings: [] },
    configFields: [], // custom editor in the right panel (mode-dependent)
    validateConfig: config => {
      const mode = (config.mode as string) ?? 'expression'
      if (mode === 'expression' && !config.expression) return ['Expression is required']
      if (mode === 'template' && !config.template) return ['Template is required']
      if (mode === 'code' && !config.code) return ['Code is required']
      if (mode === 'map') {
        const rows = (config.mappings as Array<{ target?: string; source?: string }> | undefined) ?? []
        if (rows.length === 0) return ['At least one mapping row is required']
        if (rows.some(r => !r.target || !r.source)) return ['Every mapping row needs a target and a source']
      }
      return []
    },
  },
  {
    kind: 'http', label: 'HTTP Request', icon: Globe, category: 'action', accent: 'neutral',
    defaultConfig: { method: 'GET', url: '' },
    configFields: [
      { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], required: true },
      { key: 'url', label: 'URL', type: 'text', required: true },
    ],
  },
  {
    kind: 'log', label: 'Log', icon: FileText, category: 'action', accent: 'neutral',
    defaultConfig: { message: '', level: 'info' },
    configFields: [
      { key: 'message', label: 'Message', type: 'text', required: true },
      { key: 'level', label: 'Level', type: 'select', options: ['debug', 'info', 'warn', 'error'] },
    ],
  },
  {
    kind: 'delay', label: 'Delay', icon: Timer, category: 'action', accent: 'neutral',
    defaultConfig: { ms: 1000 },
    configFields: [{ key: 'ms', label: 'Milliseconds', type: 'number', required: true }],
  },
  {
    kind: 'setVariable', label: 'Set Variable', icon: Variable, category: 'action', accent: 'neutral',
    defaultConfig: { name: '', value: '' },
    configFields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text' },
    ],
  },
  {
    kind: 'tryCatch', label: 'Try Catch Finally', icon: ShieldAlert, category: 'controlFlow', accent: 'purple',
    defaultConfig: {}, configFields: [],
    branchSpec: { fixed: [{ key: 'try', label: 'Try' }, { key: 'catch', label: 'Catch' }, { key: 'finally', label: 'Finally' }] },
  },
  {
    kind: 'ifElse', label: 'If-Else', icon: GitBranch, category: 'controlFlow', accent: 'purple',
    defaultConfig: {}, configFields: [],
    branchSpec: {
      fixed: [{ key: 'if', label: 'If', conditional: true }, { key: 'else', label: 'Else' }],
      addable: { def: { key: 'elseIf', label: 'Else-If', conditional: true }, insertBeforeLast: true },
    },
  },
  {
    kind: 'choiceWhen', label: 'Choice When', icon: Split, category: 'controlFlow', accent: 'purple',
    defaultConfig: {}, configFields: [],
    branchSpec: {
      fixed: [{ key: 'when', label: 'When', conditional: true }, { key: 'otherwise', label: 'Otherwise' }],
      addable: { def: { key: 'when', label: 'When', conditional: true }, insertBeforeLast: true },
    },
  },
  {
    kind: 'for', label: 'For', icon: Repeat2, category: 'controlFlow', accent: 'purple',
    defaultConfig: { count: 3 },
    configFields: [{ key: 'count', label: 'Count', type: 'number', required: true }],
    branchSpec: { fixed: [{ key: 'body', label: 'Body' }] },
  },
  {
    kind: 'forEach', label: 'For Each', icon: Repeat, category: 'controlFlow', accent: 'purple',
    defaultConfig: { items: '' },
    configFields: [{ key: 'items', label: 'Items expression', type: 'text', required: true }],
    branchSpec: { fixed: [{ key: 'body', label: 'Body' }] },
  },
  {
    kind: 'group', label: 'Group', icon: Boxes, category: 'controlFlow', accent: 'purple',
    defaultConfig: {}, configFields: [],
    branchSpec: { fixed: [{ key: 'body', label: 'Body' }] },
  },
]

const byKind = new Map(defs.map(d => [d.kind, d]))

export function getDef(kind: string): NodeDef {
  const def = byKind.get(kind as StepKind)
  if (!def) throw new Error(`Unknown node kind: ${kind}`)
  return def
}

export function allDefs(): NodeDef[] {
  return defs
}

export function createBranch(def: BranchDef): Branch {
  return { id: makeId('b'), key: def.key, label: def.label, config: {}, steps: [] }
}

export function createStep(kind: StepKind): Step {
  const def = getDef(kind)
  const base = { id: makeId('n'), kind, label: def.label, config: structuredClone(def.defaultConfig) }
  if (!def.branchSpec) return base as Step
  return { ...base, collapsed: false, branches: def.branchSpec.fixed.map(createBranch) } as Step
}
