import { useEffect } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ImportFunction } from '../../data/catalog'
import { type MappingTemplate } from '../../data/mappings'
import { missingRequiredFields, targetFieldsFor } from './mapping-utils'
import { type WizardValues } from './schema'

const SKIP = '__skip__'

interface StepMappingProps {
  form: UseFormReturn<WizardValues>
  importFn: ImportFunction
  columnMap: Record<string, string>
  onColumnMapChange: (map: Record<string, string>) => void
  savedTemplate?: MappingTemplate
}

/**
 * Step 4 — map source columns to target entity fields, including
 * dynamic/custom fields, and optionally save the mapping as a reusable
 * template. Unmapped required fields block the import (DM-20 / DM-31).
 */
export function StepMapping({
  form,
  importFn,
  columnMap,
  onColumnMapChange,
  savedTemplate,
}: StepMappingProps) {
  const saveMapping = form.watch('saveMapping')
  const targets = targetFieldsFor(importFn)
  const missing = missingRequiredFields(importFn, columnMap)

  // Re-apply the saved template whenever the user switches templates.
  useEffect(() => {
    if (savedTemplate) onColumnMapChange({ ...savedTemplate.columnMap })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedTemplate?.id])

  const setTarget = (source: string, target: string) => {
    onColumnMapChange({
      ...columnMap,
      [source]: target === SKIP ? '' : target,
    })
  }

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Source columns parsed from{' '}
        <span className='text-neutral-1600 font-medium'>
          {form.getValues('fileName') || 'the uploaded file'}
        </span>
        {savedTemplate ? (
          <> — mapping pre-filled from “{savedTemplate.name}”.</>
        ) : (
          ' — map each column to a target field or skip it.'
        )}
      </p>

      <div className='overflow-hidden rounded-[6px] border border-gray-200'>
        <div className='text-neutral-1900 grid grid-cols-2 gap-2 bg-neutral-200 px-3 py-2 text-xs font-medium'>
          <span>Source column</span>
          <span>Target field</span>
        </div>
        <div className='max-h-[260px] space-y-0 overflow-y-auto'>
          {Object.keys(columnMap).map((source) => (
            <div
              key={source}
              className='grid grid-cols-2 items-center gap-2 border-t border-gray-100 px-3 py-1.5'
            >
              <span className='font-mono text-xs'>{source}</span>
              <Select
                value={columnMap[source] || SKIP}
                onValueChange={(v) => setTarget(source, v)}
              >
                <SelectTrigger variant='secondary' className='h-8 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SKIP}>— Skip column —</SelectItem>
                  {targets.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                      {importFn.customFields.includes(t) ? ' (custom)' : ''}
                      {importFn.requiredFields.includes(t) ? ' *' : ''}
                      {importFn.numberSeriesField === t
                        ? ' (number series)'
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {missing.length > 0 ? (
        <div className='bg-red-1300/40 rounded-[6px] px-3 py-2'>
          <p className='text-red-1400 text-paragraph-sm font-medium'>
            Required fields not mapped — the import is blocked until they are:
          </p>
          <div className='mt-1 flex flex-wrap gap-1'>
            {missing.map((f) => (
              <Badge key={f} variant='dropped'>
                {f}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className='text-green-1300 text-paragraph-sm'>
          All required fields are mapped. Values violating a target field’s
          type, format or option list will surface as record-level failures in
          validation.
        </p>
      )}

      <div className='space-y-3 rounded-[6px] border border-gray-200 px-3 py-2.5'>
        <FormField
          control={form.control}
          name='saveMapping'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                  variant='blue'
                />
              </FormControl>
              <FormLabel className='mb-0'>
                Save mapping for further use
              </FormLabel>
            </FormItem>
          )}
        />
        {saveMapping && (
          <FormField
            control={form.control}
            name='mappingName'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder='e.g. ADP payroll extract → Employee Master'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  )
}
