import { type UseFormReturn } from 'react-hook-form'
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
import {
  DELIMITERS,
  FILE_FORMATS,
  FILE_TYPES,
  HEADER_FORMATS,
  MAX_BATCH_RECORDS,
  MAX_FILE_SIZE_MB,
  TEXT_QUALIFIERS,
} from '../../data/catalog'
import { type WizardValues } from './schema'

interface StepFileProps {
  form: UseFormReturn<WizardValues>
}

/**
 * Step 2 — file type (Excel / Flat file / Xml), format, flat-file parsing
 * options, the data file itself and an optional supporting-documents zip
 * (DM-03 / DM-04 / DM-22 / DM-23 / DM-28).
 */
export function StepFile({ form }: StepFileProps) {
  const fileType = form.watch('fileType')

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='fileType'
          render={({ field }) => (
            <FormItem>
              <FormLabel>File type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='format'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={fileType === 'Xml'}
              >
                <FormControl>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FILE_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {fileType === 'Flat file' && (
        <div className='grid grid-cols-3 gap-3'>
          <FormField
            control={form.control}
            name='delimiter'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delimiter</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DELIMITERS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='textQualifier'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text qualifier</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TEXT_QUALIFIERS.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='headerFormat'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header format</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEADER_FORMATS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name='fileName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data file</FormLabel>
            <FormControl>
              <Input placeholder='e.g. employees_june.csv' {...field} />
            </FormControl>
            <p className='text-paragraph-sm text-neutral-1000'>
              Mismatched contents vs. the selected type are rejected with a
              type-mismatch message instead of being silently loaded.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='fileSizeMb'
          render={({ field }) => (
            <FormItem>
              <FormLabel>File size (MB)</FormLabel>
              <FormControl>
                <Input placeholder={`Max ${MAX_FILE_SIZE_MB}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='totalRecords'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Records in batch</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Max ${MAX_BATCH_RECORDS.toLocaleString()}`}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='documentsZip'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Supporting documents zip (optional)</FormLabel>
            <FormControl>
              <Input placeholder='e.g. certificates_bundle.zip' {...field} />
            </FormControl>
            <p className='text-paragraph-sm text-neutral-1000'>
              Attachments are matched to records by referenced file name;
              missing files flag the record, unreferenced files are reported.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='rounded-[6px] bg-neutral-200 px-3 py-2'>
        <p className='text-paragraph-sm text-neutral-1900'>
          Governed limits (config v2): {MAX_FILE_SIZE_MB} MB per file,{' '}
          {MAX_BATCH_RECORDS.toLocaleString()} records per batch. Larger
          datasets must be split into multiple batches.
        </p>
      </div>
    </div>
  )
}
