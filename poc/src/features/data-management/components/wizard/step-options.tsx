import { type UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  DUPLICATE_HANDLING,
  PROCESS_TYPES,
  type ImportFunction,
} from '../../data/catalog'
import { type WizardValues } from './schema'

interface StepOptionsProps {
  form: UseFormReturn<WizardValues>
  importFn?: ImportFunction
}

/**
 * Step 3 — behavioral options: duplicate handling, all-valid vs
 * all-or-nothing processing, staging mode, bitemporal effective dating
 * and number-series assignment (DM-06 / DM-15 / DM-24 / DM-25 / DM-27).
 */
export function StepOptions({ form, importFn }: StepOptionsProps) {
  return (
    <div className='space-y-5'>
      <FormField
        control={form.control}
        name='duplicateHandling'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type of import</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className='space-y-1'
              >
                {DUPLICATE_HANDLING.map((opt) => (
                  <label key={opt} className='flex items-start gap-2 text-sm'>
                    <RadioGroupItem value={opt} className='mt-0.5' />
                    <span>
                      <span className='text-neutral-1600 font-medium'>
                        {opt}
                      </span>
                      <span className='text-neutral-1000 block text-xs'>
                        {opt === 'Ignore duplicates'
                          ? 'Rows matching an existing key are skipped (counted as Skipped, not Failed)'
                          : 'Rows matching an existing key update the record (upsert)'}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='processType'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Process type</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className='space-y-1'
              >
                {PROCESS_TYPES.map((opt) => (
                  <label key={opt} className='flex items-start gap-2 text-sm'>
                    <RadioGroupItem value={opt} className='mt-0.5' />
                    <span>
                      <span className='text-neutral-1600 font-medium'>
                        {opt}
                      </span>
                      <span className='text-neutral-1000 block text-xs'>
                        {opt === 'All valid records'
                          ? 'Best-effort: valid records commit; failures are reported (may end Partially completed)'
                          : 'Atomic: any failure rejects the whole batch and rolls back to the pre-import state'}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='staging'
        render={({ field }) => (
          <FormItem className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2.5'>
            <div>
              <FormLabel>Staging / sandbox validation first</FormLabel>
              <p className='text-paragraph-sm text-neutral-1000'>
                Validate without committing; review record-level results, then
                promote only validated records to production.
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label='Staging mode'
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='preserveEffectiveDates'
        render={({ field }) => (
          <FormItem className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2.5'>
            <div>
              <FormLabel>Preserve effective dates (keeps full change history)</FormLabel>
              <p className='text-paragraph-sm text-neutral-1000'>
                Historical rows keep their stated effective dates; later
                corrections version the record instead of overwriting the past.
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label='Preserve effective dates'
              />
            </FormControl>
          </FormItem>
        )}
      />

      {importFn?.numberSeriesField && (
        <FormField
          control={form.control}
          name='numberSeriesMode'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Number series — {importFn.numberSeriesField}
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className='space-y-1'
                >
                  <label className='flex items-start gap-2 text-sm'>
                    <RadioGroupItem value='auto' className='mt-0.5' />
                    <span>
                      <span className='text-neutral-1600 font-medium'>
                        System-generated
                      </span>
                      <span className='text-neutral-1000 block text-xs'>
                        Each record gets the next value in the configured series
                        — no gaps or collisions
                      </span>
                    </span>
                  </label>
                  <label className='flex items-start gap-2 text-sm'>
                    <RadioGroupItem value='mapped' className='mt-0.5' />
                    <span>
                      <span className='text-neutral-1600 font-medium'>
                        Map from file
                      </span>
                      <span className='text-neutral-1000 block text-xs'>
                        Provided values that collide with existing records or
                        the series range fail at record level
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
