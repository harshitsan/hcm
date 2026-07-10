import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { RULE_OPS, VALUE_TYPES } from '../core/expr'
import type { Cond, MappingRow, RuleOp } from '../core/expr'
import type { Config, StepKind } from '../core/model'
import {
  collectVarNames, findBranch, findInputStep, findParentContainer, findStep,
  insertStep, isInsideLoopBody, updateBranchConfig, updateStepConfig,
} from '../core/ops'
import { collectPaths, type PathEntry } from '../core/paths'
import {
  allDefs, createStep, eventsForModule, getDef, MODULE_OPTIONS, sampleFor,
  type FieldDef,
} from '../core/registry'
import { useStore } from '../state/store-context'

function Field({ field, value, onChange }: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  const id = `field-${field.key}`
  const common = { id, value: String(value ?? '') }
  return (
    <label className="form-field" htmlFor={id}>
      <span>{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'textarea' && (
        <textarea {...common} rows={4} onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'select' && (
        <select {...common} onChange={e => onChange(e.target.value)}>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === 'number' && (
        <input {...common} type="number" onChange={e => onChange(Number(e.target.value))} />
      )}
      {field.type === 'text' && (
        <input {...common} type="text" onChange={e => onChange(e.target.value)} />
      )}
    </label>
  )
}

function Palette() {
  const [q, setQ] = useState('')
  const insertTarget = useStore(s => s.insertTarget)!
  const apply = useStore(s => s.apply)
  const select = useStore(s => s.select)
  const closeInsert = useStore(s => s.closeInsert)
  const groups: Array<['Actions' | 'Control Flow', 'action' | 'controlFlow']> =
    [['Actions', 'action'], ['Control Flow', 'controlFlow']]
  const pick = (kind: StepKind) => {
    const step = createStep(kind)
    apply(d => insertStep(d, insertTarget, step))
    closeInsert()
    select({ type: 'step', id: step.id })
  }
  return (
    <div className="panel-section">
      <h3>Add a step</h3>
      <div className="search-box">
        <Search size={13} />
        <input placeholder="Search steps" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {groups.map(([title, cat]) => {
        const defs = allDefs().filter(d =>
          d.category === cat && d.label.toLowerCase().includes(q.toLowerCase()))
        if (defs.length === 0) return null
        return (
          <div key={cat}>
            <h4>{title}</h4>
            <div className="palette-grid">
              {defs.map(d => {
                const Icon = d.icon
                return (
                  <button key={d.kind} className={`palette-item accent-${d.accent}`}
                    onClick={() => pick(d.kind as StepKind)}>
                    <Icon size={14} /> {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MockToggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="form-field checkbox">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

const CTX_HINT = 'Available: payload, input, vars, item, index'

/** Module-event trigger: the starting-point list depends on the selected
    source module. Switching module or event resets the event + sample
    payload so the flow always starts from a coherent state. */
function TriggerEditor({ config, patch }: { config: Config; patch: (p: Config) => void }) {
  const module = String(config.module ?? 'Leave Management')
  const current = String(config.event ?? '')
  // Keep a legacy/mismatched event visible (validation flags it on Activate).
  const events = eventsForModule(module)
  const eventOptions =
    current && !events.includes(current) ? [current, ...events] : events
  return (
    <>
      <Field
        field={{ key: 'module', label: 'Source module', type: 'select', options: MODULE_OPTIONS, required: true }}
        value={module}
        onChange={v => {
          const nextModule = String(v)
          const firstEvent = eventsForModule(nextModule)[0] ?? ''
          patch({ module: nextModule, event: firstEvent, samplePayload: sampleFor(firstEvent) })
        }}
      />
      <Field
        field={{ key: 'event', label: 'Event (starting point)', type: 'select', options: eventOptions, required: true }}
        value={config.event}
        onChange={v => patch({ event: v, samplePayload: sampleFor(String(v)) })}
      />
      <Field
        field={{ key: 'samplePayload', label: 'Sample event payload (JSON)', type: 'textarea' }}
        value={config.samplePayload}
        onChange={v => patch({ samplePayload: v })}
      />
      <div className="ctx-hint">
        Switching the module or event resets the starting point and its sample payload.
      </div>
    </>
  )
}

function TransformEditor({ config, patch }: { config: Config; patch: (p: Config) => void }) {
  const mode = (config.mode as string) ?? 'expression'
  const rows = (config.mappings as MappingRow[] | undefined) ?? []
  const setRow = (i: number, row: MappingRow) =>
    patch({ mappings: rows.map((r, j) => (j === i ? row : r)) })
  return (
    <>
      <Field
        field={{ key: 'mode', label: 'Mode', type: 'select', options: ['map', 'expression', 'template', 'code'] }}
        value={mode} onChange={v => patch({ mode: v })}
      />
      {mode === 'map' && (
        <div className="form-field">
          <span>Field mappings (target ← source)</span>
          {rows.map((row, i) => (
            <div className="map-row" key={i}>
              <input placeholder="userName" value={row.target}
                onChange={e => setRow(i, { ...row, target: e.target.value })} />
              <span className="map-arrow">←</span>
              <input placeholder="input.user.name" value={row.source}
                onChange={e => setRow(i, { ...row, source: e.target.value })} />
              <button className="icon-btn" aria-label="Remove mapping"
                onClick={() => patch({ mappings: rows.filter((_, j) => j !== i) })}><X size={12} /></button>
            </div>
          ))}
          <button className="btn add-row"
            onClick={() => patch({ mappings: [...rows, { target: '', source: '' }] })}>
            <Plus size={12} /> Add mapping
          </button>
        </div>
      )}
      {mode === 'expression' && (
        <Field field={{ key: 'expression', label: 'Expression', type: 'textarea', required: true }}
          value={config.expression} onChange={v => patch({ expression: v })} />
      )}
      {mode === 'template' && (
        <Field field={{ key: 'template', label: 'Template ({{ expr }} interpolates)', type: 'textarea', required: true }}
          value={config.template} onChange={v => patch({ template: v })} />
      )}
      {mode === 'code' && (
        <Field field={{ key: 'code', label: 'Code (function body, return a value)', type: 'textarea', required: true }}
          value={config.code} onChange={v => patch({ code: v })} />
      )}
      <div className="ctx-hint">{CTX_HINT}</div>
    </>
  )
}

function ConditionEditor({ config, patch }: { config: Config; patch: (p: Config) => void }) {
  const raw = config.cond as Cond | undefined
  const legacy = typeof config.condition === 'string' ? config.condition : ''
  const cond: Cond = raw ?? (legacy ? { kind: 'expr', expr: legacy } : { kind: 'rule', field: '', op: 'equals' })
  const set = (next: Cond) => patch({ cond: next, condition: undefined })
  const opDef = RULE_OPS.find(o => o.op === (cond.kind === 'rule' ? cond.op : undefined))
  return (
    <>
      <Field
        field={{ key: 'condKind', label: 'Condition type', type: 'select', options: ['rule', 'expr'] }}
        value={cond.kind}
        onChange={v => set(v === 'expr' ? { kind: 'expr', expr: '' } : { kind: 'rule', field: '', op: 'equals' })}
      />
      {cond.kind === 'expr' ? (
        <Field field={{ key: 'condition', label: 'Condition expression', type: 'text', required: true }}
          value={cond.expr} onChange={v => set({ kind: 'expr', expr: String(v) })} />
      ) : (
        <>
          <Field field={{ key: 'ruleField', label: 'Field (path into the data)', type: 'text', required: true }}
            value={cond.field} onChange={v => set({ ...cond, field: String(v) })} />
          <label className="form-field" htmlFor="field-ruleOp">
            <span>Operator</span>
            <select id="field-ruleOp" value={cond.op}
              onChange={e => set({ ...cond, op: e.target.value as RuleOp, value: undefined })}>
              {RULE_OPS.map(o => <option key={o.op} value={o.op}>{o.label}</option>)}
            </select>
          </label>
          {opDef?.needsValue && opDef.valueKind === 'type' && (
            <label className="form-field" htmlFor="field-ruleType">
              <span>Type</span>
              <select id="field-ruleType" value={cond.value ?? 'string'}
                onChange={e => set({ ...cond, value: e.target.value })}>
                {VALUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}
          {opDef?.needsValue && opDef.valueKind !== 'type' && (
            <Field field={{ key: 'ruleValue', label: 'Value', type: 'text' }}
              value={cond.value} onChange={v => set({ ...cond, value: String(v) })} />
          )}
        </>
      )}
      <div className="ctx-hint">{CTX_HINT}</div>
    </>
  )
}

function PathList({ entries, copied, onCopy }: {
  entries: Array<{ path: string; type: string; preview: string }>
  copied: string | null
  onCopy: (p: string) => void
}) {
  return (
    <div className="path-list">
      {entries.map(e => (
        <button key={e.path} className="path-row" title="Click to copy" onClick={() => onCopy(e.path)}>
          <code className="path-name">{copied === e.path ? '✓ added' : e.path}</code>
          <span className={`type-badge type-${e.type}`}>{e.type}</span>
          <span className="path-preview">{e.preview}</span>
        </button>
      ))}
    </div>
  )
}

/** Last text field the user focused inside the panel — insert target for path clicks. */
const lastFocusedField: { el: HTMLInputElement | HTMLTextAreaElement | null } = { el: null }

// eslint-disable-next-line react-refresh/only-export-components
export function trackPanelFocus(e: React.FocusEvent) {
  const t = e.target
  if ((t instanceof HTMLInputElement && t.type === 'text') || t instanceof HTMLTextAreaElement) {
    lastFocusedField.el = t
  }
}

/** Insert into the focused field via the native setter so React's onChange fires. */
function insertIntoField(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? start
  const next = el.value.slice(0, start) + text + el.value.slice(end)
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, next)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.focus()
  el.setSelectionRange(start + text.length, start + text.length)
}

/** Shows the data available to expressions/conditions at the selected node:
    sample payload paths, live input paths, vars, and item/index in loops. */
function DataBrowser({ nodeId }: { nodeId: string }) {
  const doc = useStore(s => s.doc)
  const outputs = useStore(s => s.run?.outputs)
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (p: string) => {
    const el = lastFocusedField.el
    if (el && document.contains(el)) {
      insertIntoField(el, p)
    } else {
      void navigator.clipboard?.writeText(p).catch(() => {})
    }
    setCopied(p)
    setTimeout(() => setCopied(null), 1100)
  }

  let payload: unknown = null
  try { payload = JSON.parse(String(doc.trigger.config.samplePayload ?? '')) } catch { /* unparsable */ }
  const payloadPaths = payload === null ? [] : collectPaths(payload, 'payload')

  // What actually feeds this node: previous sibling, or — at the start of a
  // branch/flow — the nearest ancestor's previous step / trigger payload.
  const inputSource = findInputStep(doc, nodeId)
  let inputPaths: PathEntry[] | null = null
  let inputSub: string
  if (inputSource === 'trigger') {
    inputPaths = payload === null ? [] : collectPaths(payload, 'input')
    inputSub = 'flow start — equals the trigger payload'
  } else if (inputSource) {
    if (outputs && inputSource.id in outputs) {
      inputPaths = collectPaths(outputs[inputSource.id], 'input')
      inputSub = `output of "${inputSource.label}" — from the last test run`
    } else {
      inputSub = `output of "${inputSource.label}" — run a Test to browse its shape`
    }
  } else {
    inputSub = 'output of the previous step'
  }
  const inLoop = isInsideLoopBody(doc, nodeId)
  const vars = collectVarNames(doc)

  return (
    <details className="data-browser" open>
      <summary>Available data</summary>
      {inLoop && (
        <div className="data-note"><code>item</code> and <code>index</code> — current loop element</div>
      )}
      <h5>input <span className="data-sub">({inputSub})</span></h5>
      {inputPaths && inputPaths.length > 0 ? (
        <PathList entries={inputPaths} copied={copied} onCopy={copy} />
      ) : (
        <div className="data-note">
          {inputSource === 'trigger'
            ? 'Trigger sample payload is empty or not valid JSON.'
            : 'Not captured yet — the paths will appear here after a test run.'}
        </div>
      )}
      <h5>payload <span className="data-sub">(trigger sample)</span></h5>
      {payloadPaths.length > 0
        ? <PathList entries={payloadPaths} copied={copied} onCopy={copy} />
        : <div className="data-note">Sample payload is empty or not valid JSON — edit it on the module-event trigger.</div>}
      {vars.length > 0 && (
        <>
          <h5>vars</h5>
          <PathList
            entries={vars.map(v => ({ path: `vars.${v}`, type: 'var', preview: 'set at run time' }))}
            copied={copied} onCopy={copy}
          />
        </>
      )}
      <div className="data-note">
        Click a path to insert it into the field you were editing (or copy it when no field is focused).
      </div>
    </details>
  )
}

function OutputView({ nodeId }: { nodeId: string }) {
  const output = useStore(s => s.run?.outputs[nodeId])
  const hasRun = useStore(s => s.run !== null && nodeId in (s.run.outputs ?? {}))
  if (!hasRun) return null
  return (
    <div className="form-field">
      <span>Last run output</span>
      <pre className="output-view">{JSON.stringify(output, null, 2) ?? 'undefined'}</pre>
    </div>
  )
}

function ConfigForm() {
  const selection = useStore(s => s.selection)!
  const doc = useStore(s => s.doc)
  const apply = useStore(s => s.apply)

  if (selection.type === 'branch') {
    const branch = findBranch(doc, selection.id)
    const container = findParentContainer(doc, selection.id)
    if (!branch || !container) return null
    const spec = getDef(container.kind).branchSpec
    const def = spec?.fixed.find(d => d.key === branch.key) ?? spec?.addable?.def
    const patch = (p: Config) => apply(d => updateBranchConfig(d, branch.id, p))
    return (
      <div className="panel-section">
        <h3>{branch.label} branch</h3>
        {def?.conditional && <ConditionEditor config={branch.config} patch={patch} />}
        <MockToggle label="Take this branch in Test runs (overrides condition)"
          checked={branch.config.mockTaken === true}
          onChange={v => patch({ mockTaken: v })} />
        <DataBrowser nodeId={branch.id} />
      </div>
    )
  }

  const node = selection.type === 'trigger' ? doc.trigger : findStep(doc, selection.id)
  if (!node) return null
  const def = getDef(node.kind)
  const patch = (p: Config) => apply(d => updateStepConfig(d, node.id, p))
  return (
    <div className="panel-section">
      <h3>{def.label}</h3>
      {node.kind === 'transform'
        ? <TransformEditor config={node.config} patch={patch} />
        : node.kind === 'moduleEvent'
          ? <TriggerEditor config={node.config} patch={patch} />
          : def.configFields.map(f => (
            <Field key={f.key} field={f} value={node.config[f.key]} onChange={v => patch({ [f.key]: v })} />
          ))}
      {selection.type === 'step' && !('branches' in node) && (
        <MockToggle label="Fail in Test runs"
          checked={node.config.mockFail === true}
          onChange={v => patch({ mockFail: v })} />
      )}
      {selection.type === 'step' && <DataBrowser nodeId={node.id} />}
      <OutputView nodeId={node.id} />
    </div>
  )
}

export function RightPanel() {
  const insertTarget = useStore(s => s.insertTarget)
  const selection = useStore(s => s.selection)
  return (
    <aside className="right-panel" onFocusCapture={trackPanelFocus}>
      {insertTarget ? <Palette /> : selection ? <ConfigForm /> : (
        <div className="panel-section empty">Select a node or click + to add a step.</div>
      )}
    </aside>
  )
}
