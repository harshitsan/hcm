import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  categoryOfDocType,
  todayIso,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { resolveMergeFields } from '../data/merge-engine'
import { LetterSheet } from './letter-sheet'

const generateSchema = z
  .object({
    source: z.enum(['template', 'copy']),
    templateId: z.string(),
    sourceDocId: z.string(),
    body: z.string(),
    employeeId: z.string().min(1, 'Select an employee'),
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
  employeeId: '',
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
 * Manual single-employee generation (HLC-03): pick a template (or copy from
 * an existing letter), pick one employee, and review the print-styled letter
 * preview with the company letterhead. The merge engine resolves every field
 * first — any missing information blocks generation with a plain-language
 * gap list until the data is fixed.
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
  const employeeId = form.watch('employeeId')

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
    () => EMPLOYEES.find((e) => e.id === employeeId),
    [employeeId]
  )

  const merge = useMemo(
    () =>
      template && previewEmployee
        ? resolveMergeFields(template.body, previewEmployee.id)
        : null,
    [template, previewEmployee]
  )

  const blocked = Boolean(merge && merge.gaps.length > 0)

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
    if (blocked) return
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
    onGenerate(effective, [values.employeeId])
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Generate letter (PDF)
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
                            <SelectValue placeholder='e.g. Offer of Employment' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {categoryOfDocType(t.docType)} · {t.docType} —{' '}
                              {t.name} (v{t.currentVersion})
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
                              <SelectValue placeholder='e.g. Appointment Letter — Arjun Mehta' />
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
                name='employeeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='e.g. Ananya Iyer' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYEES.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} — {emp.position}
                            {!emp.hasAppAccess ? ' · no app access' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {merge && blocked && previewEmployee && (
                <div className='border-red-1400/40 rounded-[6px] border bg-red-50 p-3'>
                  <p className='text-red-1400 text-paragraph-sm mb-1 font-medium'>
                    Missing information — generation is blocked
                  </p>
                  <ul className='text-red-1400 list-disc space-y-0.5 pl-4 text-sm'>
                    {merge.gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                  <p className='text-red-1400/80 mt-2 text-xs'>
                    Letters are never issued with blank spaces. Complete the
                    information above, then come back to generate.
                  </p>
                </div>
              )}

              {template && previewEmployee && merge && (
                <div className='space-y-2'>
                  <p className='text-paragraph-sm text-neutral-1000 font-medium'>
                    Letter preview — {previewEmployee.name}
                  </p>
                  <LetterSheet
                    refId='new letter'
                    docType={template.docType}
                    dateIso={todayIso()}
                    body={merge.rendered}
                    letterhead={template.letterhead}
                    signedBy={null}
                    signingAuthority={template.signingAuthority}
                  />
                  <p className='text-neutral-1000 text-xs'>
                    Output: PDF · {template.layout} layout
                    {template.letterhead ? ' · company letterhead' : ''} ·
                    Signing authority: {template.signingAuthority} · Saved as a
                    draft — send it for approval when ready.
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
              <Button type='submit' disabled={blocked}>
                {blocked ? 'Missing information' : 'Generate PDF'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
