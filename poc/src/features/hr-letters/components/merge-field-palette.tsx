import { type Control } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { MERGE_FIELDS, type MergeFieldSource } from '../data/hr-letters'
import { type TemplateValues } from './template-schema'

const SOURCES: MergeFieldSource[] = ['Employee', 'Position', 'Company', 'Custom']

/**
 * Merge-field picker (HLC-02): tokens pull dynamic data from employee
 * records, position details, company information, and custom fields.
 */
export function MergeFieldPalette({
  onInsert,
}: {
  onInsert: (token: string) => void
}) {
  return (
    <div>
      <p className='text-paragraph-sm mb-1 font-medium'>
        Merge fields — click to insert
      </p>
      {SOURCES.map((source) => (
        <div key={source} className='mb-1 flex flex-wrap items-center gap-1'>
          <span className='text-neutral-1000 w-20 text-xs'>{source}</span>
          {MERGE_FIELDS.filter((f) => f.source === source).map((f) => (
            <button
              key={f.token}
              type='button'
              onClick={() => onInsert(f.token)}
              title={f.label}
            >
              <Badge variant='pending' className='cursor-pointer'>
                {f.token}
              </Badge>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Letterhead / approval-workflow / acknowledgment flags (HLC-01/06/28). */
export function TemplateFlagSwitches({
  control,
}: {
  control: Control<TemplateValues>
}) {
  return (
    <div className='grid grid-cols-3 gap-3'>
      <FormField
        control={control}
        name='letterhead'
        render={({ field }) => (
          <FormItem className='flex items-center gap-2'>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className='mt-0!'>Letterhead</FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='requiresApproval'
        render={({ field }) => (
          <FormItem className='flex items-center gap-2'>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className='mt-0!'>Approval required</FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='requiresAcknowledgment'
        render={({ field }) => (
          <FormItem className='flex items-center gap-2'>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className='mt-0!'>Needs acknowledgment</FormLabel>
          </FormItem>
        )}
      />
    </div>
  )
}
