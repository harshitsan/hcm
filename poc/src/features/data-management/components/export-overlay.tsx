import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  COMPANIES,
  DATA_ENTITIES,
  FILE_FORMATS,
  IMPORT_FUNCTIONS,
} from '../data/catalog'
import { type ExportDraft } from '../hooks/use-data-jobs'
import { TierBadge } from './badges'
import { actorName, allowedCompanies, scopeLabel } from './scope'

const ALL_SCOPE = '__all__'

const exportSchema = z.object({
  entityId: z.string().min(1, 'Select a master or transactional entity'),
  format: z.enum(FILE_FORMATS),
  companyId: z.string().min(1, 'Select the company scope'),
})

type ExportValues = z.infer<typeof exportSchema>

interface ExportOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitExport: (draft: ExportDraft) => void
}

/**
 * Export any of the five master entities or the two transactional types
 * in CSV / XLS / XLSX / JSON, scoped to the caller's tenants
 * (DM-01 / DM-02 / DM-03 / DM-10 / DM-11 / DM-16).
 */
export function ExportOverlay({
  open,
  onOpenChange,
  onSubmitExport,
}: ExportOverlayProps) {
  const { role } = useRole()
  const companies = allowedCompanies(role)

  const form = useForm<ExportValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: { entityId: '', format: 'CSV', companyId: '' },
  })

  useEffect(() => {
    if (open) form.reset({ entityId: '', format: 'CSV', companyId: '' })
  }, [open, form])

  function handleSubmit(values: ExportValues) {
    const entity = DATA_ENTITIES.find((e) => e.id === values.entityId)
    if (!entity) return
    const fn = IMPORT_FUNCTIONS.find((f) => f.entityId === entity.id)
    const targets =
      values.companyId === ALL_SCOPE
        ? companies
        : COMPANIES.filter((c) => c.id === values.companyId)

    targets.forEach((company, i) => {
      onSubmitExport({
        entity: entity.name,
        tier: entity.tier,
        module: fn?.module ?? 'Organization',
        functionName: fn?.name ?? `${entity.name} Master`,
        companyId: company.id,
        companyName: company.name,
        format: values.format,
        totalRecords: 120 + ((company.id.charCodeAt(4) * 37 + i * 53) % 4200),
        submittedBy: actorName(role),
      })
    })
    toast.success(
      targets.length === 1
        ? `Export submitted — a ${values.format} file will be ready to download shortly`
        : `${targets.length} exports submitted (one per company in scope)`
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
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
                name='entityId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Master or transactional entity' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATA_ENTITIES.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} — {e.kind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <div className='pt-1'>
                        <TierBadge
                          tier={
                            DATA_ENTITIES.find((e) => e.id === field.value)
                              ?.tier ?? 'Foundation'
                          }
                        />
                      </div>
                    )}
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
                        {FILE_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      The output file is produced in exactly this format.
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
                        {companies.length > 1 && (
                          <SelectItem value={ALL_SCOPE}>
                            All companies in my scope ({companies.length})
                          </SelectItem>
                        )}
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
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Start export</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
