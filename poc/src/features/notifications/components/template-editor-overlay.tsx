import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  BRAND_COLORS,
  PLACEHOLDERS,
  currentVersion,
  renderWithSamples,
  type NotificationTemplate,
} from '../data/templates'
import { type TemplateDraft } from '../hooks/use-templates'

const templateFormSchema = z.object({
  subject: z.string().min(3, 'Subject / title is required'),
  body: z
    .string()
    .min(10, 'Body must be at least 10 characters')
    .refine((v) => !/\{\{\s*\}\}/.test(v), 'Empty placeholder {{}} found'),
  brandColor: z.enum(BRAND_COLORS),
  includeLogo: z.boolean(),
  note: z.string(),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

interface TemplateEditorOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: NotificationTemplate | null
  onSubmit: (id: string, draft: TemplateDraft) => void
}

/**
 * Template editor with branding controls, placeholder picker and live preview
 * rendered from sample data (NTF-10, NTF-11, NTF-24). Closing with unsaved
 * edits prompts save-or-discard (NTF-27); every save creates a new
 * effective-dated version (NTF-20).
 */
export function TemplateEditorOverlay({
  open,
  onOpenChange,
  template,
  onSubmit,
}: TemplateEditorOverlayProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      subject: '',
      body: '',
      brandColor: 'Northwind Blue',
      includeLogo: true,
      note: '',
    },
  })

  useEffect(() => {
    if (!open || !template) return
    const v = currentVersion(template)
    form.reset({
      subject: v.subject,
      body: v.body,
      brandColor: v.brandColor,
      includeLogo: v.includeLogo,
      note: '',
    })
  }, [open, template, form])

  const watchedSubject = form.watch('subject')
  const watchedBody = form.watch('body')
  const watchedColor = form.watch('brandColor')
  const watchedLogo = form.watch('includeLogo')

  const requestClose = (next: boolean) => {
    if (!next && form.formState.isDirty) {
      setConfirmDiscard(true)
      return
    }
    onOpenChange(next)
  }

  function handleSubmit(values: TemplateFormValues) {
    if (!template) return
    onSubmit(template.id, values)
    onOpenChange(false)
  }

  const insertPlaceholder = (placeholder: string) => {
    form.setValue('body', `${form.getValues('body')} ${placeholder}`.trimStart(), {
      shouldDirty: true,
    })
  }

  if (!template) return null

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[620px]'>
          <SheetHeader className='border-gray-200 border-b px-5 py-4'>
            <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
              Edit template — {template.id} ({template.event},{' '}
              {template.channel === 'email' ? 'Email' : 'In-app'})
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
                  name='subject'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {template.channel === 'email' ? 'Subject' : 'Title'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Subject line' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='body'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body</FormLabel>
                      <FormControl>
                        <Textarea rows={7} placeholder='Message body' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <p className='mb-1 text-sm font-medium'>
                    Insert placeholder (supported dynamic fields)
                  </p>
                  <div className='flex flex-wrap gap-1.5'>
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p}
                        type='button'
                        onClick={() => insertPlaceholder(p)}
                        title={`Insert ${p} into the body`}
                      >
                        <Badge variant='open'>{p}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='brandColor'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand color</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BRAND_COLORS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
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
                    name='includeLogo'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company logo header</FormLabel>
                        <FormControl>
                          <div className='flex h-9 items-center'>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='note'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version note (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='What changed and why' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live preview with sample data; unresolved placeholders render as “—”. */}
                <div className='border-gray-200 rounded-[6px] border'>
                  <div className='border-gray-200 flex items-center justify-between border-b px-3 py-2'>
                    <p className='text-sm font-medium'>
                      Live preview (sample data)
                    </p>
                    <Badge variant='pending'>{watchedColor}</Badge>
                  </div>
                  <div className='space-y-2 px-3 py-3'>
                    {watchedLogo && (
                      <div className='bg-blue-150 text-blue-1400 rounded-[4px] px-2 py-1 text-xs font-semibold'>
                        [ Northwind Retail Co. logo ]
                      </div>
                    )}
                    <p className='text-neutral-1600 text-sm font-semibold'>
                      {renderWithSamples(watchedSubject) || '—'}
                    </p>
                    <p className='text-neutral-1000 text-sm whitespace-pre-wrap'>
                      {renderWithSamples(watchedBody) || '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className='mb-1 text-sm font-medium'>Version history</p>
                  <div className='space-y-1'>
                    {[...template.versions].reverse().map((v) => (
                      <div
                        key={v.version}
                        className='border-gray-200 flex items-center justify-between rounded-[6px] border px-2 py-1.5'
                      >
                        <span className='text-neutral-1600 text-sm'>
                          v{v.version} — {v.note}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          eff. {v.effectiveFrom} · {v.updatedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => requestClose(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Save new version</Button>
              </div>
            </form>
          </Form>
        </FloatingSheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved edits?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to {template.id}. Save the template or
              discard the edits before leaving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false)
                onOpenChange(false)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
