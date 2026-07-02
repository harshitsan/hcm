import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  EMPLOYEES,
  renderBody,
  type LetterTemplate,
} from '../data/hr-letters'

const generateSchema = z.object({
  templateId: z.string().min(1, 'Select a template'),
  employeeIds: z.array(z.string()).min(1, 'Select at least one employee'),
})

type GenerateValues = z.infer<typeof generateSchema>

interface GenerateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: LetterTemplate[]
  onGenerate: (template: LetterTemplate, employeeIds: string[]) => void
}

/**
 * Manual + batch PDF generation (HLC-03/05): pick a template version and one
 * or many employees. The render-engine preview (HLC-19) resolves merge fields
 * for the first selected employee, applying the configured missing-value
 * behavior instead of leaking raw tokens (HLC-02).
 */
export function GenerateOverlay({
  open,
  onOpenChange,
  templates,
  onGenerate,
}: GenerateOverlayProps) {
  const form = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: { templateId: '', employeeIds: [] },
  })

  useEffect(() => {
    if (open) form.reset({ templateId: '', employeeIds: [] })
  }, [open, form])

  const templateId = form.watch('templateId')
  const employeeIds = form.watch('employeeIds')

  const template = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  )
  const previewEmployee = useMemo(
    () => EMPLOYEES.find((e) => e.id === employeeIds[0]),
    [employeeIds]
  )

  function handleSubmit(values: GenerateValues) {
    const tpl = templates.find((t) => t.id === values.templateId)
    if (!tpl) return
    onGenerate(tpl, values.employeeIds)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Generate document (PDF)
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
                name='templateId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select a document template' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.docType} — {t.name} (v{t.currentVersion})
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
                name='employeeIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employees (select several for batch generation)
                    </FormLabel>
                    <div className='max-h-56 space-y-1 overflow-y-auto rounded-[6px] border border-gray-200 p-2'>
                      {EMPLOYEES.map((emp) => (
                        <label
                          key={emp.id}
                          className='flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-neutral-100'
                        >
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(emp.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, emp.id]
                                  : field.value.filter((id) => id !== emp.id)
                              )
                            }
                          />
                          <span className='text-sm'>
                            {emp.name}
                            <span className='text-neutral-1000'>
                              {' '}
                              — {emp.position}
                              {emp.recordIncomplete
                                ? ' · incomplete record (will be reported)'
                                : ''}
                              {!emp.hasAppAccess ? ' · no app access' : ''}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {template && (
                <div className='rounded-[6px] border border-gray-200 bg-white p-3'>
                  <p className='text-paragraph-sm text-neutral-1000 mb-1 font-medium'>
                    Render-engine preview
                    {previewEmployee
                      ? ` — ${previewEmployee.name} (missing values: ${template.missingValueBehavior})`
                      : ' — select an employee to resolve merge fields'}
                  </p>
                  <pre className='text-neutral-1900 font-sans text-sm whitespace-pre-wrap'>
                    {previewEmployee
                      ? renderBody(
                          template.body,
                          previewEmployee,
                          template.missingValueBehavior
                        )
                      : template.body}
                  </pre>
                  <p className='text-neutral-1000 mt-2 text-xs'>
                    Output: PDF · {template.layout} layout
                    {template.letterhead ? ' · company letterhead' : ''} ·
                    Signing authority: {template.signingAuthority} ·
                    {template.requiresApproval
                      ? ' enters the approval workflow before finalization'
                      : ' finalized directly (no approval configured)'}
                  </p>
                </div>
              )}
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {employeeIds.length > 1
                  ? `Batch generate ${employeeIds.length} PDFs`
                  : 'Generate PDF'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
