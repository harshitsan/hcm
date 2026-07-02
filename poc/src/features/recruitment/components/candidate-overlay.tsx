import { useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SOURCE_CHANNELS, TALENT_FOLDERS } from '../data/candidates'
import type { Requisition } from '../data/requisitions'
import type { CandidateDraft } from '../hooks/use-candidates'

const NONE = '__none__'

const candidateSchema = z.object({
  name: z.string().min(2, 'Candidate name is required'),
  email: z.email('Enter a valid email'),
  phone: z.string().min(8, 'Phone number is required'),
  currentRole: z.string().min(2, 'Current role is required'),
  skills: z.string().min(2, 'Add at least one skill'),
  source: z.enum(SOURCE_CHANNELS),
  folder: z.string(),
  resume: z.string().min(4, 'Resume file name is required'),
  linkedRequisitionId: z.string(),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

const emptyValues: CandidateFormValues = {
  name: '',
  email: '',
  phone: '',
  currentRole: '',
  skills: '',
  source: 'LinkedIn',
  folder: NONE,
  resume: '',
  linkedRequisitionId: NONE,
}

interface CandidateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisitions: Requisition[]
  onSubmit: (draft: CandidateDraft) => void
}

/** Source a candidate into the talent pool (TA-05) with dedupe on save. */
export function CandidateOverlay({
  open,
  onOpenChange,
  requisitions,
  onSubmit,
}: CandidateOverlayProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const sourcing = requisitions.filter((r) =>
    ['approved', 'sourcing'].includes(r.status)
  )

  function handleSubmit(values: CandidateFormValues) {
    onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone,
      currentRole: values.currentRole,
      skills: values.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      source: values.source,
      folders: values.folder === NONE ? [] : [values.folder],
      resume: values.resume,
      linkedRequisitionId:
        values.linkedRequisitionId === NONE ? null : values.linkedRequisitionId,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Add candidate to talent pool
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
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder='Asha Pillai' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='asha@mail.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='+91 98xxx xxxxx' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='currentRole'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current role</FormLabel>
                    <FormControl>
                      <Input placeholder='Backend Engineer @ Acme' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='skills'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder='Java, PostgreSQL, Kafka' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='source'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source channel</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_CHANNELS.map((s) => (
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
                  name='folder'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Folder</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No folder</SelectItem>
                          {TALENT_FOLDERS.map((f) => (
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
              <FormField
                control={form.control}
                name='resume'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume file</FormLabel>
                    <FormControl>
                      <Input placeholder='asha-pillai-resume.pdf' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='linkedRequisitionId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associate with open requisition</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Not linked</SelectItem>
                        {sourcing.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.id} — {r.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Add candidate</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
