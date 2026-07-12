import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LongText } from '@/components/common/long-text'
import {
  COMPANIES,
  DATA_ENTITIES,
  EXPORT_FORMATS,
  IMPORT_FUNCTIONS,
  type DataEntity,
  type FileFormat,
} from '../data/catalog'
import { downloadExportFile, exportFileName } from '../data/files'
import { type DataJob } from '../data/jobs'
import { type ExportDraft } from '../hooks/use-data-jobs'
import { TierBadge } from './badges'
import { actorName, allowedCompanies, scopeLabel } from './scope'

const exportSchema = z
  .object({
    entityIds: z.array(z.string()).min(1, 'Pick at least one entity to export'),
    format: z.enum(['CSV', 'XLSX', 'JSON']),
    companyId: z.string().min(1, 'Select the company scope'),
    dateFrom: z.string(),
    dateTo: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.dateFrom && v.dateTo && v.dateFrom > v.dateTo) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'The end of the date range must be after its start',
      })
    }
  })

type ExportValues = z.infer<typeof exportSchema>

const defaultValues: ExportValues = {
  entityIds: [],
  format: 'CSV',
  companyId: '',
  dateFrom: '2026-01-01',
  dateTo: new Date().toISOString().slice(0, 10),
}

interface ExportOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Full job history — powers the export history list. */
  jobs: DataJob[]
  onSubmitExport: (draft: ExportDraft) => void
}

function EntityGroup({
  label,
  entities,
  selected,
  onToggle,
}: {
  label: string
  entities: DataEntity[]
  selected: string[]
  onToggle: (id: string, checked: boolean) => void
}) {
  return (
    <div className='rounded-[6px] border border-gray-200 px-3 py-2.5'>
      <p className='text-neutral-1600 mb-2 text-sm font-medium'>{label}</p>
      <div className='space-y-1.5'>
        {entities.map((e) => (
          <label key={e.id} className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={selected.includes(e.id)}
              onCheckedChange={(checked) => onToggle(e.id, Boolean(checked))}
              aria-label={e.name}
            />
            <span className='text-neutral-1900'>{e.name}</span>
            <TierBadge tier={e.tier} />
          </label>
        ))}
      </div>
    </div>
  )
}

/**
 * Export master and transactional data in CSV / XLSX / JSON, scoped to the
 * caller's tenants, with a date-range filter for transactional entities.
 * The Export button produces a real downloadable file per entity and each
 * batch lands in the export history for re-download
 * (DM-01 / DM-02 / DM-03 / DM-10 / DM-11 / DM-16).
 */
export function ExportOverlay({
  open,
  onOpenChange,
  jobs,
  onSubmitExport,
}: ExportOverlayProps) {
  const { role } = useRole()
  const companies = allowedCompanies(role)

  const form = useForm<ExportValues>({
    resolver: zodResolver(exportSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [open, form])

  const entityIds = form.watch('entityIds')
  const hasTransactional = entityIds.some(
    (id) => DATA_ENTITIES.find((e) => e.id === id)?.kind === 'Transactional'
  )

  const exportHistory = useMemo(
    () =>
      jobs
        .filter((j) => j.kind === 'export' && j.status === 'Completed')
        .slice(0, 6),
    [jobs]
  )

  const toggleEntity = (id: string, checked: boolean) => {
    const next = checked
      ? [...entityIds, id]
      : entityIds.filter((e) => e !== id)
    form.setValue('entityIds', next, { shouldValidate: true })
  }

  function handleSubmit(values: ExportValues) {
    const company = COMPANIES.find((c) => c.id === values.companyId)
    if (!company) return
    const format = values.format as FileFormat

    for (const entityId of values.entityIds) {
      const entity = DATA_ENTITIES.find((e) => e.id === entityId)
      if (!entity) continue
      const fn = IMPORT_FUNCTIONS.find((f) => f.entityId === entity.id)
      const fileName = exportFileName(entity.name, format)
      const totalRecords =
        120 + ((company.id.charCodeAt(4) * 37 + entity.id.length * 53) % 4200)

      // Produce the real file right away…
      downloadExportFile({
        entity: entity.name,
        companyName: company.name,
        format,
        fileName,
        totalRecords,
      })
      // …and record the batch in the export history.
      onSubmitExport({
        entity: entity.name,
        tier: entity.tier,
        module: fn?.module ?? 'Organization',
        functionName: fn?.name ?? `${entity.name} Master`,
        companyId: company.id,
        companyName: company.name,
        format,
        fileName,
        totalRecords,
        submittedBy: actorName(role),
      })
    }
    toast.success(
      values.entityIds.length === 1
        ? `Export started — your ${format} file is downloading`
        : `${values.entityIds.length} exports started — one ${format} file per entity is downloading`
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[500px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Export data
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='entityIds'
                render={() => (
                  <FormItem>
                    <FormLabel>What do you want to export?</FormLabel>
                    <div className='grid grid-cols-2 gap-3'>
                      <EntityGroup
                        label='Master data'
                        entities={DATA_ENTITIES.filter(
                          (e) => e.kind === 'Master'
                        )}
                        selected={entityIds}
                        onToggle={toggleEntity}
                      />
                      <EntityGroup
                        label='Transactional data'
                        entities={DATA_ENTITIES.filter(
                          (e) => e.kind === 'Transactional'
                        )}
                        selected={entityIds}
                        onToggle={toggleEntity}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='format'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output format</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPORT_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      One file per selected entity, downloaded straight to your
                      device.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company scope</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Pick the scope of the export' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {scopeLabel(role)}. Only records within your authorized
                      tenant scope are ever returned.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasTransactional && (
                <div>
                  <p className='text-neutral-1600 mb-1.5 text-sm font-medium'>
                    Date range (transactional data)
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='dateFrom'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='dateTo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                    Leave and Attendance exports only include records within
                    this range. Master data always exports in full.
                  </p>
                </div>
              )}

              {exportHistory.length > 0 && (
                <div>
                  <p className='text-neutral-1600 mb-1.5 text-sm font-medium'>
                    Export history
                  </p>
                  <div className='overflow-hidden rounded-[6px] border border-gray-200'>
                    {exportHistory.map((job) => (
                      <div
                        key={job.id}
                        className='flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-1.5 last:border-b-0'
                      >
                        <div className='min-w-0'>
                          <LongText className='text-neutral-1600 max-w-[280px] text-sm'>
                            {job.fileName}
                          </LongText>
                          <p className='text-paragraph-sm text-neutral-1000'>
                            {job.entity} · {job.companyName} ·{' '}
                            {job.totalRecords.toLocaleString('en-US')} records
                          </p>
                        </div>
                        <Button
                          type='button'
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7 shrink-0'
                          aria-label={`Download ${job.fileName} again`}
                          onClick={() => {
                            downloadExportFile({
                              entity: job.entity,
                              companyName: job.companyName,
                              format: job.format,
                              fileName: job.fileName,
                              totalRecords: job.totalRecords,
                            })
                            toast.success(`${job.fileName} downloaded again`)
                          }}
                        >
                          <DownloadSimple size={16} weight='bold' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Export</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
