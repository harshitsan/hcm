import {
  Zap, Repeat, Repeat2, GitBranch, Split, Boxes, ShieldAlert,
  BellRing, DatabaseZap, FileSignature, Timer, UserCheck, Variable,
  type LucideIcon,
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
  kind: StepKind | 'moduleEvent'
  label: string
  icon: LucideIcon
  category: 'trigger' | 'action' | 'controlFlow'
  accent: 'green' | 'purple' | 'neutral'
  defaultConfig: Config
  configFields: FieldDef[]
  branchSpec?: BranchSpec
  validateConfig?: (config: Config) => string[]
}

/* Option lists mirror the Business logic catalog (data/business-logic.ts);
   kept local so the designer core stays free of feature-data imports. */

const MODULE_OPTIONS = [
  'Leave Management', 'Time & Attendance', 'Recruitment', 'Employees',
  'Employee Lifecycle', 'Notifications', 'HR Letters & Certificates',
  'Asset Management', 'Custom Fields', 'Data Management',
  'Policy Management', 'Companies',
]

const MODULE_EVENTS = [
  'Leave request submitted', 'Overtime request submitted',
  'Comp-off request submitted', 'Attendance shortfall detected',
  'Exit initiated', 'Offer approved', 'New employee joined',
  'Probation ending in 15 days', 'Policy published',
]

const APPROVER_ROLES = [
  'Reporting Manager', 'Department Head', 'HR Director',
  'Finance Controller', 'Operations Head', 'Compliance Officer',
  'Recruitment Lead', 'Hiring Manager', 'Group HR Head', 'CEO',
]

const RECIPIENTS = [
  'Employee', 'Reporting Manager', 'HR Director', 'Department Head',
  'Finance Controller', 'All employees',
]

const DOCUMENT_TEMPLATES = [
  'Offer Letter', 'Confirmation Letter', 'Experience Letter',
  'Relieving Letter', 'Warning Letter', 'Policy Acknowledgement',
]

const defs: NodeDef[] = [
  {
    kind: 'moduleEvent', label: 'Module event', icon: Zap, category: 'trigger', accent: 'green',
    defaultConfig: {
      module: 'Leave Management', event: 'Leave request submitted',
      samplePayload: '{\n  "request": { "type": "Casual", "days": 3, "from": "2026-07-10" },\n  "employee": { "name": "Ananya Sharma", "department": "Engineering", "balance": 12 }\n}',
    },
    configFields: [
      { key: 'module', label: 'Source module', type: 'select', options: MODULE_OPTIONS, required: true },
      { key: 'event', label: 'Event', type: 'select', options: MODULE_EVENTS, required: true },
      { key: 'samplePayload', label: 'Sample event payload (JSON)', type: 'textarea' },
    ],
    validateConfig: config => {
      const raw = config.samplePayload
      if (typeof raw !== 'string' || raw.trim() === '') return []
      try { JSON.parse(raw); return [] } catch { return ['Sample payload is not valid JSON'] }
    },
  },
  {
    kind: 'approvalTask', label: 'Approval task', icon: UserCheck, category: 'action', accent: 'purple',
    defaultConfig: { approverRole: 'Reporting Manager', slaHours: 24, mockDecision: 'approved' },
    configFields: [
      { key: 'approverRole', label: 'Approver role', type: 'select', options: APPROVER_ROLES, required: true },
      { key: 'slaHours', label: 'SLA (business hours)', type: 'number', required: true },
      { key: 'mockDecision', label: 'Decision in test runs', type: 'select', options: ['approved', 'rejected'] },
    ],
  },
  {
    kind: 'notify', label: 'Notify', icon: BellRing, category: 'action', accent: 'neutral',
    defaultConfig: { recipient: 'Employee', channel: 'Email', message: '' },
    configFields: [
      { key: 'recipient', label: 'Recipient', type: 'select', options: RECIPIENTS, required: true },
      { key: 'channel', label: 'Channel', type: 'select', options: ['Email', 'In-app', 'SMS'] },
      { key: 'message', label: 'Message ({{ expr }} interpolates)', type: 'textarea', required: true },
    ],
  },
  {
    kind: 'updateRecord', label: 'Update record', icon: DatabaseZap, category: 'action', accent: 'neutral',
    defaultConfig: { module: 'Leave Management', field: '', value: '' },
    configFields: [
      { key: 'module', label: 'Module', type: 'select', options: MODULE_OPTIONS, required: true },
      { key: 'field', label: 'Field', type: 'text', required: true },
      { key: 'value', label: 'Value ({{ expr }} interpolates)', type: 'text' },
    ],
  },
  {
    kind: 'generateDocument', label: 'Generate document', icon: FileSignature, category: 'action', accent: 'neutral',
    defaultConfig: { template: 'Offer Letter' },
    configFields: [
      { key: 'template', label: 'Letter template', type: 'select', options: DOCUMENT_TEMPLATES, required: true },
    ],
  },
  {
    kind: 'transform', label: 'Data mapping', icon: Repeat, category: 'action', accent: 'purple',
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
    kind: 'delay', label: 'Wait / SLA timer', icon: Timer, category: 'action', accent: 'neutral',
    defaultConfig: { hours: 24 },
    configFields: [{ key: 'hours', label: 'Business hours to wait', type: 'number', required: true }],
  },
  {
    kind: 'setVariable', label: 'Set variable', icon: Variable, category: 'action', accent: 'neutral',
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

/** True when a persisted node kind exists in this registry (see store hydration). */
export function isKnownKind(kind: string): boolean {
  return byKind.has(kind as StepKind)
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
