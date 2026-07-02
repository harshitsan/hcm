import { useMemo } from 'react'
import { Warning } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  COMPANIES,
  DEPARTMENTS,
  EMPLOYEE_GROUPS,
  EMPLOYMENT_TYPES,
  LOCATIONS,
  seedEmployees,
} from '../data/employees'
import {
  type Audience,
  type AudienceField,
} from '../data/distributions'
import { resolveAudience } from '../utils/audience'

interface AudienceBuilderProps {
  value: Audience
  onChange: (audience: Audience) => void
}

const toItems = (values: readonly string[]) =>
  values.map((v) => ({ id: v, label: v }))

const FIELDS: { field: AudienceField; label: string; items: { id: string; label: string }[] }[] = [
  { field: 'company', label: 'Company', items: toItems(COMPANIES) },
  { field: 'location', label: 'Location', items: toItems(LOCATIONS) },
  { field: 'department', label: 'Department', items: toItems(DEPARTMENTS) },
  { field: 'group', label: 'Group', items: toItems(EMPLOYEE_GROUPS) },
  {
    field: 'employmentType',
    label: 'Employment type',
    items: toItems(EMPLOYMENT_TYPES),
  },
  {
    field: 'employee',
    label: 'Individual employees',
    items: seedEmployees.map((e) => ({
      id: e.id,
      label: `${e.name} (${e.company})`,
    })),
  },
]

/**
 * AND/OR scope criteria builder with a live de-duplicated recipient
 * preview. Group-level roles can span several companies; a Company Admin
 * is scoped to their own company in the real product.
 */
export function AudienceBuilder({ value, onChange }: AudienceBuilderProps) {
  const { role } = useRole()

  const selectedFor = (field: AudienceField) =>
    value.criteria.find((c) => c.field === field)?.values ?? []

  const setFieldValues = (field: AudienceField, values: string[]) => {
    const rest = value.criteria.filter((c) => c.field !== field)
    onChange({
      ...value,
      criteria: values.length > 0 ? [...rest, { field, values }] : rest,
    })
  }

  const recipients = useMemo(() => resolveAudience(value), [value])
  const nonUsers = recipients.filter((e) => !e.isPortalUser)
  const hasCriteria = value.criteria.some((c) => c.values.length > 0)

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-neutral-1600 text-sm font-medium'>
          Combine criteria with
        </Label>
        <RadioGroup
          value={value.logic}
          onValueChange={(logic) =>
            onChange({ ...value, logic: logic as 'AND' | 'OR' })
          }
          className='flex gap-6'
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='AND' id='logic-and' />
            <Label htmlFor='logic-and' className='text-sm font-normal'>
              AND — must match every criterion
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='OR' id='logic-or' />
            <Label htmlFor='logic-or' className='text-sm font-normal'>
              OR — match any criterion
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {FIELDS.map(({ field, label, items }) => (
          <div key={field} className='space-y-1'>
            <Label className='text-neutral-1600 text-sm font-medium'>
              {label}
              {field === 'company' &&
                (role === 'Group Company Admin' || role === 'Portfolio Admin') && (
                  <span className='text-paragraph-sm text-neutral-1000 ml-1 font-normal'>
                    (multi-company scope)
                  </span>
                )}
            </Label>
            <MultiSelectDropdown
              items={items}
              selectedIds={selectedFor(field)}
              onSelectionChange={(ids) => setFieldValues(field, ids)}
              placeholder={`Any ${label.toLowerCase()}`}
              className='w-full'
            />
          </div>
        ))}
      </div>

      {/* Recipient preview — de-duplicated before sending */}
      <div className='border-grey-200 rounded-[6px] border bg-white p-3'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-neutral-1600 text-sm font-medium'>
            Recipient preview (de-duplicated)
          </span>
          <Badge variant={recipients.length > 0 ? 'completed' : 'pending'}>
            {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
          </Badge>
        </div>
        {!hasCriteria ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            Select at least one criterion to resolve the audience.
          </p>
        ) : recipients.length === 0 ? (
          <div className='text-vanilla-500 flex items-center gap-2 text-sm'>
            <Warning size={16} weight='fill' />
            No employees match this scope — adjust the criteria before
            distributing.
          </div>
        ) : (
          <>
            <div className='flex flex-wrap gap-1.5'>
              {recipients.map((e) => (
                <Badge key={e.id} variant={e.isPortalUser ? 'open' : 'overdue'}>
                  {e.name}
                  {!e.isPortalUser && ' · non-user'}
                </Badge>
              ))}
            </div>
            {nonUsers.length > 0 && (
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                {nonUsers.length} recipient(s) have no portal access and cannot
                self-acknowledge — a Company Admin can record proxy
                acknowledgments from the recipient grid.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
