import { type Role } from '@/context/role-context'
import {
  type FieldDefinition,
  type FieldPermissions,
} from './custom-fields'
import {
  type ConditionOperator,
  type EntityRecord,
  type FieldValue,
  type ValueHistoryEntry,
  type WorkflowCondition,
} from './records'

/**
 * The shared Forms/Dynamic-Fields "engine" (L3): every render, validation,
 * permission resolution, and rule evaluation below reads ONLY the field's
 * metadata definition — no per-field hand-written logic.
 */

export type FieldAccess = 'hidden' | 'read' | 'edit'

/** Resolve View/Edit access from the per-audience permission matrix. */
export function resolveFieldAccess(
  def: FieldDefinition,
  role: Role,
  record: EntityRecord
): FieldAccess {
  const p = def.permissions
  switch (role) {
    // Admin roles act as the HR audience.
    case 'Platform Admin':
    case 'Group Company Admin':
    case 'Company Admin':
      return p.hrEdit ? 'edit' : p.hrView ? 'read' : 'hidden'
    // Portfolio oversight is governance-only: read, never edit.
    case 'Portfolio Admin':
      return p.hrView ? 'read' : 'hidden'
    case 'Employee (User)':
      if (record.relationship === 'self')
        return p.employeeEdit ? 'edit' : p.employeeView ? 'read' : 'hidden'
      if (record.relationship === 'direct-report')
        return p.managerEdit ? 'edit' : p.managerView ? 'read' : 'hidden'
      return 'hidden'
    // Non-users never log in; the UI shows their record read-only.
    case 'Employee (Non-User)':
      return p.employeeView || p.hrView ? 'read' : 'hidden'
  }
}

const isEmpty = (value: FieldValue) =>
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

/** Validate a value purely from metadata: required, type, options, regex. */
export function validateFieldValue(
  def: FieldDefinition,
  value: FieldValue
): string | null {
  // A mandatory check box must actually be ticked (e.g. consents).
  if (def.type === 'checkbox' && def.required && value !== true) {
    return `${def.name} must be checked`
  }
  if (isEmpty(value)) {
    return def.required ? `${def.name} is required` : null
  }
  if (typeof value === 'boolean') return null
  if (Array.isArray(value)) {
    const bad = value.find((v) => !def.options.includes(v))
    return bad ? `"${bad}" is not a configured option for ${def.name}` : null
  }

  const s = String(value).trim()
  switch (def.type) {
    case 'number':
      if (!/^-?\d+$/.test(s)) return `${def.name} must be a whole number`
      break
    case 'decimal':
    case 'currency':
      if (!/^-?\d+(\.\d+)?$/.test(s)) return `${def.name} must be numeric`
      break
    case 'percentage': {
      if (!/^\d+(\.\d+)?$/.test(s)) return `${def.name} must be numeric`
      const n = Number.parseFloat(s)
      if (n < 0 || n > 100) return `${def.name} must be between 0 and 100`
      break
    }
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s))
        return `Enter a valid email for ${def.name}`
      break
    case 'phone':
      if (!/^\+?[\d()\-\s]{7,20}$/.test(s))
        return `Enter a valid phone number for ${def.name}`
      break
    case 'url':
      if (!/^https?:\/\/\S+\.\S+/.test(s))
        return `Enter a valid URL (https://…) for ${def.name}`
      break
    case 'date':
    case 'date-time':
      if (Number.isNaN(Date.parse(s)))
        return `Enter a valid date for ${def.name}`
      break
    case 'single-select':
    case 'radio':
    case 'lookup':
      // Lookups are constrained by the picker itself; the rest re-check here.
      if (def.type !== 'lookup' && !def.options.includes(s))
        return `"${s}" is not a configured option for ${def.name}`
      break
    default:
      break
  }

  if (def.regex) {
    try {
      if (!new RegExp(def.regex).test(s))
        return `${def.name} does not match the required format`
    } catch {
      // An invalid stored regex must not block saves.
    }
  }
  return null
}

/**
 * Shape raw input through the field mask ('#' = digit, other chars are
 * literals inserted automatically).
 */
export function applyMask(mask: string, raw: string): string {
  if (!mask || raw === '') return raw
  const input = raw.split('')
  let out = ''
  let idx = 0
  for (const m of mask) {
    if (m === '#') {
      while (idx < input.length && !/\d/.test(input[idx])) idx++
      if (idx >= input.length) return out
      out += input[idx++]
    } else {
      out += m
      if (idx < input.length && input[idx].toUpperCase() === m.toUpperCase())
        idx++
    }
  }
  return out
}

/** Display formatting per type (grids, exports, history, API payloads). */
export function formatFieldValue(
  def: FieldDefinition,
  value: FieldValue
): string {
  if (isEmpty(value)) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  const s = String(value)
  switch (def.type) {
    case 'currency':
      return `$${s}`
    case 'percentage':
      return `${s}%`
    default:
      return s
  }
}

/** Operators that make sense for a field's data type. */
export function operatorsForType(
  type: FieldDefinition['type']
): ConditionOperator[] {
  switch (type) {
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percentage':
      return ['equals', 'greater-than', 'less-than']
    case 'boolean':
    case 'checkbox':
      return ['is-true', 'is-false']
    case 'date':
    case 'date-time':
      return ['before', 'after', 'equals']
    case 'multi-select':
      return ['includes']
    case 'single-select':
    case 'radio':
    case 'lookup':
      return ['equals']
    default:
      return ['equals', 'contains']
  }
}

/**
 * Evaluate a workflow/rules condition against a record with correct typing.
 * Returns null when the referenced field no longer exists (safe handling).
 */
export function evaluateCondition(
  def: FieldDefinition | undefined,
  cond: WorkflowCondition,
  record: EntityRecord
): boolean | null {
  if (!def) return null
  const value = record.values[def.id] ?? null
  switch (cond.operator) {
    case 'is-true':
      return value === true
    case 'is-false':
      return value === false || value === null
    case 'greater-than':
      return Number.parseFloat(String(value)) > Number.parseFloat(cond.value)
    case 'less-than':
      return Number.parseFloat(String(value)) < Number.parseFloat(cond.value)
    case 'before':
      return value !== null && String(value) < cond.value
    case 'after':
      return value !== null && String(value) > cond.value
    case 'includes':
      return Array.isArray(value) && value.includes(cond.value)
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(cond.value.toLowerCase())
    case 'equals':
      return String(value ?? '') === cond.value
  }
}

/** Resolve a value as-of a past date from the bitemporal history. */
export function valueAsOf(
  history: ValueHistoryEntry[],
  recordId: string,
  fieldId: string,
  asOf: string
): string | null {
  const entries = history
    .filter(
      (h) =>
        h.recordId === recordId &&
        h.fieldId === fieldId &&
        h.effectiveDate <= asOf
    )
    .sort((a, b) =>
      a.effectiveDate === b.effectiveDate
        ? a.changedAt.localeCompare(b.changedAt)
        : a.effectiveDate.localeCompare(b.effectiveDate)
    )
  return entries.length ? entries[entries.length - 1].newValue : null
}

/** Human diff between two definition versions for the governance log. */
export function summarizeFieldChanges(
  prev: FieldDefinition,
  next: Pick<
    FieldDefinition,
    | 'name'
    | 'type'
    | 'options'
    | 'required'
    | 'isDefault'
    | 'mask'
    | 'regex'
    | 'effectiveDate'
    | 'permissions'
  >
): string {
  const changes: string[] = []
  if (prev.name !== next.name) changes.push(`renamed to "${next.name}"`)
  if (prev.type !== next.type) changes.push(`type: ${prev.type} → ${next.type}`)
  if (prev.options.join('|') !== next.options.join('|'))
    changes.push('options updated')
  if (prev.required !== next.required)
    changes.push(
      next.required ? 'required: optional → required' : 'required: required → optional'
    )
  if (prev.isDefault !== next.isDefault)
    changes.push(`Is Default: ${prev.isDefault ? 'Yes → No' : 'No → Yes'}`)
  if (prev.mask !== next.mask)
    changes.push(next.mask ? `mask set to ${next.mask}` : 'mask removed')
  if (prev.regex !== next.regex)
    changes.push(next.regex ? 'regex validation updated' : 'regex removed')
  if (permissionsDiffer(prev.permissions, next.permissions))
    changes.push('permission matrix updated')
  if (prev.effectiveDate !== next.effectiveDate)
    changes.push(`effective ${next.effectiveDate}`)
  return changes.length ? changes.join('; ') : 'No definition changes'
}

function permissionsDiffer(a: FieldPermissions, b: FieldPermissions) {
  return (Object.keys(a) as (keyof FieldPermissions)[]).some(
    (k) => a[k] !== b[k]
  )
}
