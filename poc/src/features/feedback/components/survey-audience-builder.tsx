import { useMemo } from 'react'
import { Warning } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  SURVEY_AUDIENCE_FIELDS,
  resolveSurveyAudience,
  type Audience,
  type AudienceField,
} from '../data/survey-audience'

interface SurveyAudienceBuilderProps {
  value: Audience
  onChange: (audience: Audience) => void
}

/**
 * Survey audience targeting over the shared applicability dimensions (D1) —
 * the same AND/OR criteria model Policy Distribution uses (company,
 * location, department, role group, employment type, individuals), with a
 * live resolved-audience preview so authors see exactly who will be invited.
 */
export function SurveyAudienceBuilder({ value, onChange }: SurveyAudienceBuilderProps) {
  const selectedFor = (field: AudienceField) =>
    value.criteria.find((c) => c.field === field)?.values ?? []

  const setFieldValues = (field: AudienceField, values: string[]) => {
    const rest = value.criteria.filter((c) => c.field !== field)
    onChange({
      ...value,
      criteria: values.length > 0 ? [...rest, { field, values }] : rest,
    })
  }

  const invitees = useMemo(() => resolveSurveyAudience(value), [value])
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
            <RadioGroupItem value='AND' id='survey-logic-and' />
            <Label htmlFor='survey-logic-and' className='text-sm font-normal'>
              AND — must match every criterion
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='OR' id='survey-logic-or' />
            <Label htmlFor='survey-logic-or' className='text-sm font-normal'>
              OR — match any criterion
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {SURVEY_AUDIENCE_FIELDS.map(({ field, label, items }) => (
          <div key={field} className='space-y-1'>
            <Label className='text-neutral-1600 text-sm font-medium'>{label}</Label>
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

      {/* Resolved audience preview — de-duplicated before inviting. */}
      <div className='border-gray-200 rounded-[6px] border bg-white p-3'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-neutral-1600 text-sm font-medium'>
            Resolved audience (de-duplicated)
          </span>
          <Badge variant={invitees.length > 0 ? 'completed' : 'pending'}>
            {invitees.length} employee{invitees.length === 1 ? '' : 's'}
          </Badge>
        </div>
        {!hasCriteria ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            Select at least one criterion to resolve who receives this survey.
          </p>
        ) : invitees.length === 0 ? (
          <div className='text-vanilla-500 flex items-center gap-2 text-sm'>
            <Warning size={16} weight='fill' />
            No employees match this scope — adjust the criteria before
            publishing.
          </div>
        ) : (
          <div className='flex flex-wrap gap-1.5'>
            {invitees.map((e) => (
              <Badge key={e.id} variant='open'>
                {e.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
