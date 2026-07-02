import { useEffect, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
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
  AGREEMENT_TYPES,
  HR_DOC_TYPES,
  SIGNING_AUTHORITIES,
  TEMPLATE_LAYOUTS,
  todayIso,
  type LetterTemplate,
} from '../data/hr-letters'
import { type TemplateDraft } from '../hooks/use-letter-templates'
import { MergeFieldPalette, TemplateFlagSwitches } from './merge-field-palette'
import { templateSchema, type TemplateValues } from './template-schema'

interface TemplateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: LetterTemplate | null
  /** Restrict the type dropdown to agreement letters (Agreements tab, HLC-28). */
  agreementOnly?: boolean
  onSubmit: (draft: TemplateDraft) => void
}

/**
 * Template editor (HLC-01/02/18/28): layout + branding + body with a merge
 * field palette pulling employee/position/company/custom data. Saving is
 * always a new effective-dated version — configuration history is preserved
 * and already-generated documents are unaffected.
 */
export function TemplateOverlay({
  open,
  onOpenChange,
  template,
  agreementOnly = false,
  onSubmit,
}: TemplateOverlayProps) {
  const isEdit = Boolean(template)
  const typeOptions = agreementOnly
    ? [...AGREEMENT_TYPES]
    : [...HR_DOC_TYPES, ...AGREEMENT_TYPES]

  const emptyDraft: TemplateValues = useMemo(
    () => ({
      name: '',
      docType: agreementOnly ? AGREEMENT_TYPES[0] : HR_DOC_TYPES[0],
      layout: 'Classic',
      letterhead: true,
      body: '',
      requiresApproval: true,
      requiresAcknowledgment: agreementOnly,
      signingAuthority: SIGNING_AUTHORITIES[0],
      missingValueBehavior: 'flagged',
      effectiveFrom: todayIso(),
      changeSummary: '',
    }),
    [agreementOnly]
  )

  const form = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      template
        ? {
            name: template.name,
            docType: template.docType,
            layout: template.layout,
            letterhead: template.letterhead,
            body: template.body,
            requiresApproval: template.requiresApproval,
            requiresAcknowledgment: template.requiresAcknowledgment,
            signingAuthority: template.signingAuthority,
            missingValueBehavior: template.missingValueBehavior,
            effectiveFrom: todayIso(),
            changeSummary: '',
          }
        : emptyDraft
    )
  }, [open, template, form, emptyDraft])

  const insertToken = (token: string) => {
    const current = form.getValues('body')
    form.setValue(
      'body',
      `${current}${current.endsWith(' ') || current === '' ? '' : ' '}${token}`,
      { shouldValidate: true }
    )
  }

  function handleSubmit(values: TemplateValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[620px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit
              ? `Edit template — saves as v${(template?.currentVersion ?? 0) + 1}`
              : 'New template (v1)'}
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
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template name</FormLabel>
                    <FormControl>
                      <Input placeholder='Standard Appointment Letter' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='docType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeOptions.map((t) => (
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
                  name='layout'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATE_LAYOUTS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='body'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body text (branded content)</FormLabel>
                    <FormControl>
                      <Textarea rows={7} placeholder='Dear {{employee.name}}, …' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <MergeFieldPalette onInsert={insertToken} />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='signingAuthority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signing authority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SIGNING_AUTHORITIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                  name='missingValueBehavior'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Missing merge values</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='blank'>Leave blank</SelectItem>
                          <SelectItem value='flagged'>Flag as missing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TemplateFlagSwitches control={form.control} />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='changeSummary'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change summary</FormLabel>
                      <FormControl>
                        <Input placeholder='What changed and why' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save as new version' : 'Create template'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
