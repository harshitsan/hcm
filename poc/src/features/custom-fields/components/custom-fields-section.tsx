import { useMemo } from 'react'
import { useRole } from '@/context/role-context'
import {
  type FieldTarget,
} from '../data/custom-fields'
import {
  resolveFieldAccess,
  validateFieldValue,
} from '../data/field-engine'
import { type FieldValue, type EntityRecord } from '../data/records'
import { getFieldsSnapshot, subscribeFields } from '../hooks/use-custom-fields'
import { DynamicFieldControl } from './dynamic-field-control'
import { useSyncExternalStore } from 'react'

interface CustomFieldsSectionProps {
  entity: FieldTarget
  values: Record<string, FieldValue>           // keyed by FieldDefinition.id
  onChange: (fieldId: string, value: FieldValue) => void
  errors?: Record<string, string>
  audience?: 'hr' | 'manager' | 'employee'     // default 'hr'
  title?: string                               // default 'Additional fields'
}

/**
 * Generic section that renders all custom fields targeting `entity`, sorted
 * by `order`, filtered by audience visibility resolved from `resolveFieldAccess`.
 * Returns null when no fields match (so the caller can omit the section entirely).
 *
 * Usage: drop inside any form just above the footer.
 */
export function CustomFieldsSection({
  entity,
  values,
  onChange,
  errors = {},
  audience = 'hr',
  title = 'Additional fields',
}: CustomFieldsSectionProps) {
  const { role } = useRole()
  const allFields = useSyncExternalStore(subscribeFields, getFieldsSnapshot)

  // Build a synthetic EntityRecord for resolveFieldAccess.
  // For form-level targets the record is always treated as 'self' so
  // employees can edit their own submission fields.
  const syntheticRecord = useMemo<EntityRecord>(
    () => ({
      id: 'form-context',
      // entity cast — form targets are not SupportedEntity but resolveFieldAccess
      // only reads the `relationship` and `isUser` fields from EntityRecord.
      entity: 'Employees',
      name: '',
      subtitle: '',
      relationship: audience === 'employee' ? 'self' : 'org',
      isUser: true,
      tenant: '',
      values: {},
    }),
    [audience]
  )

  const visibleFields = useMemo(
    () =>
      allFields
        .filter((f) => f.entity === entity)
        .sort((a, b) => a.order - b.order)
        .filter((f) => {
          const access = resolveFieldAccess(f, role, syntheticRecord)
          return access !== 'hidden'
        }),
    [allFields, entity, role, syntheticRecord]
  )

  if (visibleFields.length === 0) return null

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-md text-neutral-1400 font-semibold'>{title}</p>
      {visibleFields.map((def) => {
        const access = resolveFieldAccess(def, role, syntheticRecord)
        const readOnly = access === 'read'
        return (
          <DynamicFieldControl
            key={def.id}
            def={def}
            value={values[def.id] ?? null}
            onChange={(value) => onChange(def.id, value)}
            readOnly={readOnly}
            error={errors[def.id]}
            lookupOptions={[]}
          />
        )
      })}
    </div>
  )
}

/**
 * Validate all custom fields for `entity` against `values`.
 * Returns an errors map keyed by field id; empty = valid.
 */
export function validateCustomFields(
  entity: FieldTarget,
  values: Record<string, FieldValue>,
  audience?: 'hr' | 'manager' | 'employee'
): Record<string, string> {
  const fields = getFieldsSnapshot().filter((f) => f.entity === entity)
  const errors: Record<string, string> = {}

  // We need the role for resolveFieldAccess. Since this is called outside React,
  // we validate all fields that are not HR-only (a conservative safe approach).
  // Fields where hrEdit is false and all permissions false should be skipped.
  for (const def of fields) {
    const value = values[def.id] ?? null
    // Skip fields that are not visible to any audience
    const p = def.permissions
    const anyVisible = p.hrView || p.managerView || p.employeeView
    if (!anyVisible) continue

    // For audience-gated validation, skip fields the audience cannot see
    if (audience === 'employee' && !p.employeeView && !p.employeeEdit) continue
    if (audience === 'manager' && !p.managerView && !p.managerEdit) continue

    const err = validateFieldValue(def, value)
    if (err) errors[def.id] = err
  }

  return errors
}
