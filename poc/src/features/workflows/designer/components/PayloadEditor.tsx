/**
 * PayloadEditor — inline inspector for `artifactPayload` nodes.
 *
 * Rendered by ConfigForm() when node.kind === 'artifactPayload'.
 * Signature mirrors TransformEditor: ({ config, patch }).
 *
 * Reads config.definition as ArtifactDefinition, switches on definition.kind,
 * renders plain controlled editors, calls patch({ definition: nextDefinition })
 * with immutable copies.
 *
 * Field shapes mirror toValues / toDefinition in artifact-builder-sheet.tsx.
 * This file lives in designer/components/ and MAY import types from
 * ../../data/business-logic (only core/ is import-restricted).
 */

import { Plus, X } from 'lucide-react'
import type { Config } from '../core/model'
import type {
  ArtifactDefinition,
  CalendarEntry,
  CalendarType,
  CategoryItem,
  ChecklistItem,
  FormFieldDef,
  FormFieldType,
  RuleOutcome,
} from '../../data/business-logic'
import {
  ALERT_CHANNELS,
  APPROVER_STEP_ROLES,
  CALENDAR_DAYS,
  CALENDAR_TYPES,
  FORM_FIELD_TYPES,
  RULE_OUTCOMES,
} from '../../data/business-logic'

// ─── Shared primitive components ──────────────────────────────────────────────

function PLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'block', fontSize: 11, marginBottom: 2, color: 'var(--color-muted, #666)' }}>{children}</span>
}

function PInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box' }}
      className="config-input"
    />
  )
}

function PSelect({
  value, options, onChange,
}: {
  value: string
  options: readonly string[] | string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box' }}
      className="config-select"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function PTextarea({
  value, onChange, placeholder, rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
      className="config-input"
    />
  )
}

function PCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="form-field checkbox" style={{ gap: 6 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span style={{ fontSize: 12 }}>{label}</span>
    </label>
  )
}

function RowCard({ children, onRemove, title }: { children: React.ReactNode; onRemove: () => void; title: string }) {
  return (
    <div className="map-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '6px 8px', borderRadius: 4, background: 'var(--color-surface-raised, #f9f9f9)', border: '1px solid var(--color-border, #e5e7eb)', marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted, #666)' }}>{title}</span>
        <button className="icon-btn" aria-label={`Remove ${title}`} onClick={onRemove} type="button"><X size={12} /></button>
      </div>
      {children}
    </div>
  )
}

// ─── Kind-specific sub-editors ─────────────────────────────────────────────────

function SettingEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'setting' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  return (
    <div className="form-field">
      <label className="form-field" htmlFor="pe-setting-key">
        <PLabel>Key</PLabel>
        <PInput value={def.key} onChange={v => onChange({ ...def, key: v })} placeholder="wfh.maxDaysPerMonth" />
      </label>
      <label className="form-field" htmlFor="pe-setting-value">
        <PLabel>Value</PLabel>
        <PInput value={def.value} onChange={v => onChange({ ...def, value: v })} placeholder="8" />
      </label>
    </div>
  )
}

function TemplateEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'template' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  const channelOptions = ['', 'Email', 'In-app', 'SMS'] as const
  const kindOptions = ['', 'letter', 'notification'] as const
  return (
    <>
      <div className="form-field">
        <PLabel>Body (&#123;&#123;merge.fields&#125;&#125; supported)</PLabel>
        <PTextarea
          rows={8}
          value={def.body}
          onChange={v => onChange({ ...def, body: v })}
          placeholder="Dear {{candidate.name}}, …"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label className="form-field">
          <PLabel>Channel</PLabel>
          <PSelect
            value={def.channel ?? ''}
            options={channelOptions}
            onChange={v => onChange({ ...def, channel: (v || undefined) as typeof def.channel })}
          />
        </label>
        <label className="form-field">
          <PLabel>Template kind</PLabel>
          <PSelect
            value={def.templateKind ?? ''}
            options={kindOptions}
            onChange={v => onChange({ ...def, templateKind: (v || undefined) as typeof def.templateKind })}
          />
        </label>
      </div>
      <label className="form-field">
        <PLabel>Trigger event</PLabel>
        <PInput
          value={def.event ?? ''}
          onChange={v => onChange({ ...def, event: v || undefined })}
          placeholder="probation.confirmed"
        />
      </label>
    </>
  )
}

function CustomFormEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'custom-form' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  const fields = def.fields
  const setFields = (next: FormFieldDef[]) => onChange({ ...def, fields: next })

  return (
    <div className="form-field">
      <PLabel>Form fields</PLabel>
      {fields.map((f, i) => (
        <RowCard key={i} title={`Field ${i + 1}`} onRemove={() => setFields(fields.filter((_, j) => j !== i))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <label className="form-field">
              <PLabel>Label</PLabel>
              <PInput
                value={f.label}
                onChange={v => setFields(fields.map((x, j) => j === i ? { ...x, label: v } : x))}
                placeholder="Reason for leaving"
              />
            </label>
            <label className="form-field">
              <PLabel>Field type</PLabel>
              <PSelect
                value={f.fieldType}
                options={FORM_FIELD_TYPES}
                onChange={v => setFields(fields.map((x, j) => j === i ? { ...x, fieldType: v as FormFieldType, options: undefined } : x))}
              />
            </label>
          </div>
          {f.fieldType === 'select' && (
            <label className="form-field" style={{ marginTop: 4 }}>
              <PLabel>Options (comma separated)</PLabel>
              <PInput
                value={(f.options ?? []).join(', ')}
                onChange={v => setFields(fields.map((x, j) => j === i ? { ...x, options: v.split(',').map(o => o.trim()).filter(Boolean) } : x))}
                placeholder="Option A, Option B"
              />
            </label>
          )}
          <div style={{ marginTop: 4 }}>
            <PCheckbox
              checked={f.required}
              onChange={v => setFields(fields.map((x, j) => j === i ? { ...x, required: v } : x))}
              label="Required"
            />
          </div>
        </RowCard>
      ))}
      <button className="btn add-row" type="button"
        onClick={() => setFields([...fields, { label: '', fieldType: 'text', required: false }])}>
        <Plus size={12} /> Add field
      </button>
    </div>
  )
}

function ChecklistEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'checklist' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  const items = def.items
  const setItems = (next: ChecklistItem[]) => onChange({ ...def, items: next })

  return (
    <div className="form-field">
      <PLabel>Checklist items</PLabel>
      {items.map((it, i) => (
        <RowCard key={i} title={`Item ${i + 1}`} onRemove={() => setItems(items.filter((_, j) => j !== i))}>
          <label className="form-field">
            <PLabel>Label</PLabel>
            <PInput
              value={it.label}
              onChange={v => setItems(items.map((x, j) => j === i ? { ...x, label: v } : x))}
              placeholder="Return laptop and access card"
            />
          </label>
          <PCheckbox
            checked={it.mandatory}
            onChange={v => setItems(items.map((x, j) => j === i ? { ...x, mandatory: v } : x))}
            label="Mandatory before completion"
          />
        </RowCard>
      ))}
      <button className="btn add-row" type="button"
        onClick={() => setItems([...items, { label: '', mandatory: true }])}>
        <Plus size={12} /> Add item
      </button>
    </div>
  )
}

function AlertEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'alert' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  return (
    <>
      <label className="form-field">
        <PLabel>Trigger event</PLabel>
        <PInput
          value={def.trigger}
          onChange={v => onChange({ ...def, trigger: v })}
          placeholder="Probation ends in 15 days"
        />
      </label>
      <div className="form-field">
        <PLabel>Delivery channels</PLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ALERT_CHANNELS.map(ch => {
            const checked = def.channels.includes(ch)
            return (
              <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...def.channels, ch]
                      : def.channels.filter(c => c !== ch)
                    onChange({ ...def, channels: next })
                  }}
                />
                {ch}
              </label>
            )
          })}
        </div>
      </div>
    </>
  )
}

function CategoryListEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'category-list' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  const items = def.items
  const setItems = (next: CategoryItem[]) => onChange({ ...def, items: next })

  return (
    <div className="form-field">
      <PLabel>Category items</PLabel>
      {items.map((it, i) => (
        <div key={it.id || i} className="map-row" style={{ alignItems: 'center', marginBottom: 4 }}>
          <input
            type="text"
            value={it.label}
            placeholder="e.g. Annual Leave"
            onChange={e => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
            style={{ flex: 1 }}
            className="config-input"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, flexShrink: 0, marginLeft: 6 }}>
            <input
              type="checkbox"
              checked={it.active}
              onChange={e => setItems(items.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))}
            />
            Active
          </label>
          <button className="icon-btn" aria-label="Remove item" type="button"
            onClick={() => setItems(items.filter((_, j) => j !== i))}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button className="btn add-row" type="button"
        onClick={() => setItems([...items, { id: `cat-${crypto.randomUUID().slice(0, 6)}`, label: '', active: true }])}>
        <Plus size={12} /> Add item
      </button>
    </div>
  )
}

function CalendarEditor({
  def, onChange,
}: {
  def: Extract<ArtifactDefinition, { kind: 'calendar' }>
  onChange: (next: ArtifactDefinition) => void
}) {
  const isHoliday = def.calendarType === 'holiday'
  const entries = def.entries

  const setEntries = (next: CalendarEntry[]) => onChange({ ...def, entries: next })
  const setCalType = (t: CalendarType) => onChange({ ...def, calendarType: t, entries: [] })

  return (
    <>
      <label className="form-field">
        <PLabel>Calendar type</PLabel>
        <PSelect value={def.calendarType} options={CALENDAR_TYPES} onChange={v => setCalType(v as CalendarType)} />
      </label>
      <div className="form-field">
        <PLabel>{isHoliday ? 'Holiday entries' : 'Time entries'}</PLabel>
        {entries.map((e, i) => (
          <RowCard key={i} title={`Entry ${i + 1}`} onRemove={() => setEntries(entries.filter((_, j) => j !== i))}>
            <div style={{ display: 'grid', gridTemplateColumns: isHoliday ? '1fr 1fr' : '1fr', gap: 6 }}>
              <label className="form-field">
                <PLabel>Label</PLabel>
                <PInput
                  value={e.label}
                  onChange={v => setEntries(entries.map((x, j) => j === i ? { ...x, label: v } : x))}
                  placeholder={isHoliday ? 'Republic Day' : 'Day shift'}
                />
              </label>
              {isHoliday && (
                <label className="form-field">
                  <PLabel>Date</PLabel>
                  <PInput
                    type="date"
                    value={e.date ?? ''}
                    onChange={v => setEntries(entries.map((x, j) => j === i ? { ...x, date: v } : x))}
                  />
                </label>
              )}
            </div>
            {!isHoliday && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                  <label className="form-field">
                    <PLabel>Start time</PLabel>
                    <PInput
                      type="time"
                      value={e.startTime ?? ''}
                      onChange={v => setEntries(entries.map((x, j) => j === i ? { ...x, startTime: v } : x))}
                    />
                  </label>
                  <label className="form-field">
                    <PLabel>End time</PLabel>
                    <PInput
                      type="time"
                      value={e.endTime ?? ''}
                      onChange={v => setEntries(entries.map((x, j) => j === i ? { ...x, endTime: v } : x))}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 4 }}>
                  <PLabel>Days</PLabel>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {CALENDAR_DAYS.map(day => {
                      const checked = (e.days ?? []).includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = e.days ?? []
                            const next = checked ? days.filter(d => d !== day) : [...days, day]
                            setEntries(entries.map((x, j) => j === i ? { ...x, days: next } : x))
                          }}
                          style={{
                            padding: '1px 6px',
                            fontSize: 11,
                            borderRadius: 3,
                            border: '1px solid',
                            cursor: 'pointer',
                            background: checked ? 'var(--accent-purple, #6366f1)' : 'transparent',
                            color: checked ? '#fff' : 'inherit',
                            borderColor: checked ? 'var(--accent-purple, #6366f1)' : 'var(--color-border, #e5e7eb)',
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </RowCard>
        ))}
        <button className="btn add-row" type="button"
          onClick={() => setEntries([...entries, isHoliday ? { label: '', date: '' } : { label: '', startTime: '', endTime: '', days: [] }])}>
          <Plus size={12} /> Add entry
        </button>
      </div>
    </>
  )
}

// ─── Top-level PayloadEditor ───────────────────────────────────────────────────

/** Displayed when node.kind === 'artifactPayload'. Reads config.definition
    as ArtifactDefinition, dispatches to the matching sub-editor, then calls
    patch({ definition: nextDefinition }) on every change. */
export function PayloadEditor({ config, patch }: { config: Config; patch: (p: Config) => void }) {
  const definition = config.definition as ArtifactDefinition | null | undefined

  if (!definition || typeof definition !== 'object' || typeof (definition as Record<string, unknown>).kind !== 'string') {
    return (
      <div className="form-field">
        <div className="ctx-hint" style={{ color: 'var(--color-error, #ef4444)' }}>
          No payload attached. This node is populated when a catalog workflow is
          linked — open the workflow inspector to load its definition here.
        </div>
      </div>
    )
  }

  const emit = (next: ArtifactDefinition) => patch({ definition: next })

  switch (definition.kind) {
    case 'setting':
      return <SettingEditor def={definition} onChange={emit} />

    case 'template':
      return <TemplateEditor def={definition} onChange={emit} />

    case 'custom-form':
      return <CustomFormEditor def={definition} onChange={emit} />

    case 'checklist':
      return <ChecklistEditor def={definition} onChange={emit} />

    case 'alert':
      return <AlertEditor def={definition} onChange={emit} />

    case 'category-list':
      return <CategoryListEditor def={definition} onChange={emit} />

    case 'calendar':
      return <CalendarEditor def={definition} onChange={emit} />

    case 'approver-chain': {
      // Defensive fallback: approver chains normally render as approvalTask
      // nodes on the canvas, but if one lands here the steps stay editable.
      return (
        <div className="form-field">
          <PLabel>Approver chain steps</PLabel>
          {definition.steps.map((s, i) => (
            <div key={i} className="map-row" style={{ fontSize: 12, marginBottom: 3 }}>
              <span style={{ width: 24, flexShrink: 0, color: 'var(--color-muted, #666)' }}>{s.order}.</span>
              <PSelect
                value={s.approverRole}
                options={APPROVER_STEP_ROLES}
                onChange={v => emit({
                  ...definition,
                  steps: definition.steps.map((x, j) => j === i ? { ...x, approverRole: v } : x),
                })}
              />
              <input
                type="number"
                value={s.slaHours}
                onChange={e => emit({
                  ...definition,
                  steps: definition.steps.map((x, j) => j === i ? { ...x, slaHours: Number(e.target.value) } : x),
                })}
                style={{ width: 56, flexShrink: 0 }}
                className="config-input"
                aria-label="SLA hours"
              />
              <span style={{ fontSize: 11, flexShrink: 0 }}>h</span>
              <button className="icon-btn" aria-label="Remove step" type="button"
                onClick={() => emit({ ...definition, steps: definition.steps.filter((_, j) => j !== i) })}>
                <X size={12} />
              </button>
            </div>
          ))}
          <button className="btn add-row" type="button"
            onClick={() => emit({ ...definition, steps: [...definition.steps, { order: definition.steps.length + 1, approverRole: 'Reporting Manager', slaHours: 24 }] })}>
            <Plus size={12} /> Add step
          </button>
        </div>
      )
    }

    case 'decision-rule': {
      return (
        <>
          <div className="form-field">
            <PLabel>Conditions (all must match)</PLabel>
            {definition.conditions.map((c, i) => (
              <RowCard key={i} title={`Condition ${i + 1}`} onRemove={() => emit({ ...definition, conditions: definition.conditions.filter((_, j) => j !== i) })}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <label className="form-field">
                    <PLabel>Attribute</PLabel>
                    <PInput value={c.attribute} onChange={v => emit({ ...definition, conditions: definition.conditions.map((x, j) => j === i ? { ...x, attribute: v } : x) })} placeholder="workedHours" />
                  </label>
                  <label className="form-field">
                    <PLabel>Operator</PLabel>
                    <PSelect value={c.operator} options={['=', '!=', '>', '>=', '<', '<=', 'contains']} onChange={v => emit({ ...definition, conditions: definition.conditions.map((x, j) => j === i ? { ...x, operator: v as typeof c.operator } : x) })} />
                  </label>
                  <label className="form-field">
                    <PLabel>Value</PLabel>
                    <PInput value={c.value} onChange={v => emit({ ...definition, conditions: definition.conditions.map((x, j) => j === i ? { ...x, value: v } : x) })} placeholder="8" />
                  </label>
                </div>
              </RowCard>
            ))}
            <button className="btn add-row" type="button"
              onClick={() => emit({ ...definition, conditions: [...definition.conditions, { attribute: '', operator: '=', value: '' }] })}>
              <Plus size={12} /> Add condition
            </button>
          </div>
          <label className="form-field">
            <PLabel>Outcome when the rule matches</PLabel>
            <PSelect
              value={definition.outcome}
              options={RULE_OUTCOMES}
              onChange={v => emit({ ...definition, outcome: v as RuleOutcome })}
            />
          </label>
        </>
      )
    }

    case 'flow':
      return (
        <div className="form-field">
          <div className="ctx-hint">
            Process flows are edited on the Designer canvas — open the linked
            canvas doc to modify this flow.
          </div>
        </div>
      )

    default:
      return (
        <div className="form-field">
          <div className="ctx-hint">Unknown payload kind.</div>
        </div>
      )
  }
}
