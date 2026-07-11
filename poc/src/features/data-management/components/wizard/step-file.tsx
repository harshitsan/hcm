import { type UseFormReturn } from 'react-hook-form'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  FILE_TYPES,
  HEADER_FORMATS,
  TEXT_QUALIFIERS,
} from '../../data/catalog'
import { type ConfigVersion } from '../../data/config'
import { type WizardValues } from './schema'

interface StepFileProps {
  form: UseFormReturn<WizardValues>
  /** Latest published config version — governs formats and limits (DM-17). */
  config: ConfigVersion
}

// Kensium reference sample offered for download when Xml is selected.
const SAMPLE_XML = `<rootelement>
  <Dept>
    <Name>CSV Dept</Name>
    <Description>Test Upload Description</Description>
    <Prefix>Test Upload prefix</Prefix>
    <ParentDepartment>HITS-Dotnet</ParentDepartment>
    <Location>Begumpet</Location>
  </Dept>
</rootelement>`

function downloadSampleXml() {
  const blob = new Blob([SAMPLE_XML], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-import.xml'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Sample XML downloaded — use it as the structure reference')
}

function HeaderFormatField({ form }: { form: UseFormReturn<WizardValues> }) {
  return (
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
  )
}

/**
 * Step 2 — file type (Excel / Flat file / Xml), format, flat-file parsing
 * options, the data file itself and an optional supporting-documents zip
 * (DM-03 / DM-04 / DM-22 / DM-23 / DM-28).
 */
export function StepFile({ form, config }: StepFileProps) {
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
                  {config.formats.map((f) => (
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
          <HeaderFormatField form={form} />
        </div>
      )}

      {fileType === 'Excel' && (
        <div className='grid grid-cols-2 gap-3'>
          <HeaderFormatField form={form} />
        </div>
      )}

      {fileType === 'Xml' && (
        <div className='rounded-[6px] border border-gray-200 bg-neutral-200/60 p-3'>
          <div className='mb-1.5 flex items-center justify-between'>
            <span className='text-neutral-1600 text-sm font-medium'>
              Sample data
            </span>
            <Button
              type='button'
              variant='outline'
              onClick={downloadSampleXml}
              className='h-7 gap-1 rounded-[6px] px-2'
            >
              <DownloadSimple size={12} weight='bold' />
              Download
            </Button>
          </div>
          <pre className='text-neutral-1900 overflow-x-auto font-mono text-xs leading-5 whitespace-pre'>
            {SAMPLE_XML}
          </pre>
          <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
            The uploaded XML must follow this element structure — download the
            sample for reference.
          </p>
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
                <Input placeholder={`Max ${config.maxFileSizeMb}`} {...field} />
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
                  placeholder={`Max ${config.maxBatchRecords.toLocaleString()}`}
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
          Governed limits (config v{config.version}, effective{' '}
          {config.effectiveFrom}): {config.maxFileSizeMb} MB per file,{' '}
          {config.maxBatchRecords.toLocaleString()} records per batch, formats{' '}
          {config.formats.join(' / ')}. Larger datasets must be split into
          multiple batches.
        </p>
      </div>
    </div>
  )
}
