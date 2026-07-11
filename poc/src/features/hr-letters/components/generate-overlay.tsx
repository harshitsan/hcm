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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  EMPLOYEES,
  renderBody,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'

const generateSchema = z
  .object({
    source: z.enum(['template', 'copy']),
    templateId: z.string(),
    sourceDocId: z.string(),
    body: z.string(),
    employeeIds: z.array(z.string()).min(1, 'Select at least one employee'),
  })
  .superRefine((values, ctx) => {
    if (values.source === 'template' && !values.templateId) {
      ctx.addIssue({
        code: 'custom',
        path: ['templateId'],
        message: 'Select a template',
      })
    }
    if (values.source === 'copy') {
      if (!values.sourceDocId) {
        ctx.addIssue({
          code: 'custom',
          path: ['sourceDocId'],
          message: 'Select an existing letter to copy from',
        })
      } else if (values.body.trim().length < 10) {
        ctx.addIssue({
          code: 'custom',
          path: ['body'],
          message: 'Letter body cannot be empty',
        })
      }
    }
  })

type GenerateValues = z.infer<typeof generateSchema>

const emptyValues: GenerateValues = {
  source: 'template',
  templateId: '',
  sourceDocId: '',
  body: '',
  employeeIds: [],
}

interface GenerateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: LetterTemplate[]
  /** Previously generated documents — sources for "copy from existing letter". */
  documents: HrDocument[]
  onGenerate: (template: LetterTemplate, employeeIds: string[]) => void
}

/**
 * Manual + batch PDF generation (HLC-03/05): either create new from a
 * template version, or copy from an existing generated letter — the source
 * letter's type and body are prefilled and stay editable before generating.
 * The render-engine preview (HLC-19) resolves merge fields for the first
 * selected employee, applying the configured missing-value behavior instead
 * of leaking raw tokens (HLC-02).
 */
export function GenerateOverlay({
  open,
  onOpenChange,
  templates,
  documents,
  onGenerate,
}: GenerateOverlayProps) {
  const form = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const source = form.watch('source')
  const templateId = form.watch('templateId')
  const sourceDocId = form.watch('sourceDocId')
  const body = form.watch('body')
  const employeeIds = form.watch('employeeIds')

  const sourceDoc = useMemo(
    () => documents.find((d) => d.id === sourceDocId),
    [documents, sourceDocId]
  )

  /** Effective template: picked directly, or derived from the copied letter. */
  const template = useMemo(() => {
    if (source === 'template') {
      return templates.find((t) => t.id === templateId)
    }
    if (!sourceDoc) return undefined
    const baseTemplate = templates.find((t) => t.id === sourceDoc.templateId)
    if (!baseTemplate) return undefined
    return { ...baseTemplate, body }
  }, [source, templates, templateId, sourceDoc, body])

  const previewEmployee = useMemo(
    () => EMPLOYEES.find((e) => e.id === employeeIds[0]),
    [employeeIds]
  )

  /** Prefill body/type from the picked source letter; stays editable. */
  function handlePickSourceDoc(docId: string) {
    form.setValue('sourceDocId', docId, { shouldValidate: true })
    const doc = documents.find((d) => d.id === docId)
    const baseTemplate = doc
      ? templates.find((t) => t.id === doc.templateId)
      : undefined
    form.setValue('body', baseTemplate?.body ?? '', { shouldValidate: true })
  }

  function handleSubmit(values: GenerateValues) {
    let effective: LetterTemplate | undefined
    if (values.source === 'template') {
      effective = templates.find((t) => t.id === values.templateId)
    } else {
      const doc = documents.find((d) => d.id === values.sourceDocId)
      const baseTemplate = doc
        ? templates.find((t) => t.id === doc.templateId)
        : undefined
      if (baseTemplate) effective = { ...baseTemplate, body: values.body }
    }
    if (!effective) return
    onGenerate(effective, values.employeeIds)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
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
                name='source'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className='flex flex-wrap gap-4'
                      >
                        <label className='flex cursor-pointer items-center gap-1.5 text-sm'>
                          <RadioGroupItem value='template' id='gen-src-template' />
                          Create new from template
                        </label>
                        <label className='flex cursor-pointer items-center gap-1.5 text-sm'>
                          <RadioGroupItem value='copy' id='gen-src-copy' />
                          Copy from existing letter
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {source === 'template' ? (
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
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name='sourceDocId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copy from existing letter</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={handlePickSourceDoc}
                        >
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue placeholder='Select a previously generated letter' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documents.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.docType} — {d.employeeName} ({d.generatedOn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {sourceDoc && (
                    <FormField
                      control={form.control}
                      name='body'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Letter body — prefilled from the {sourceDoc.docType}
                            {' '}for {sourceDoc.employeeName}; edit before
                            generating
                          </FormLabel>
                          <FormControl>
                            <Textarea rows={8} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

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
                    {source === 'copy'
                      ? ` · copied from ${sourceDoc?.id ?? 'existing letter'}`
                      : ''}
                  </p>
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
