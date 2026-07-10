import { useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  GENDERS,
  SOURCE_CHANNELS,
  TALENT_FOLDERS,
  type Candidate,
} from '../data/candidates'
import type { Requisition } from '../data/requisitions'
import { seedVacancies, type Vacancy } from '../data/vacancies'
import type { CandidateDraft, ShortlistForm } from '../hooks/use-candidates'

const NONE = '__none__'

/** Kensium 15-pointer resume-bank field set (numeric fields kept as strings for input ergonomics). */
const candidateSchema = z.object({
  name: z.string().min(2, 'Candidate name is required'),
  email: z.email('Enter a valid email'),
  phone: z.string().min(8, 'Phone number is required'),
  gender: z.string(),
  referredBy: z.string(),
  image: z.string(),
  address: z.string(),
  currentRole: z.string().min(2, 'Current role is required'),
  skills: z.string().min(2, 'Add at least one skill'),
  experienceYears: z.string(),
  currentCtc: z.string(),
  expectedCtc: z.string(),
  qualification: z.string(),
  noticePeriodDays: z.string(),
  source: z.enum(SOURCE_CHANNELS),
  channelSource: z.string(),
  folder: z.string(),
  resume: z.string().min(4, 'Resume file name is required'),
  linkedRequisitionId: z.string(),
  appliedForVacancy: z.boolean(),
  vacancyId: z.string(),
  positionTitle: z.string(),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

const emptyValues: CandidateFormValues = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  referredBy: '',
  image: '',
  address: '',
  currentRole: '',
  skills: '',
  experienceYears: '',
  currentCtc: '',
  expectedCtc: '',
  qualification: '',
  noticePeriodDays: '30',
  source: 'LinkedIn',
  channelSource: '',
  folder: NONE,
  resume: '',
  linkedRequisitionId: NONE,
  appliedForVacancy: false,
  vacancyId: NONE,
  positionTitle: '',
}

/** Prefill the form from an existing resume-bank profile (shortlist / edit). */
function fromCandidate(c: Candidate): CandidateFormValues {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    gender: c.gender,
    referredBy: c.referredBy,
    image: '',
    address: c.address,
    currentRole: c.currentRole,
    skills: c.skills.join(', '),
    experienceYears: String(c.experienceYears),
    currentCtc: String(c.currentCtc),
    expectedCtc: String(c.expectedCtc),
    qualification: c.qualification,
    noticePeriodDays: String(c.noticePeriodDays),
    source: c.source,
    channelSource: c.channelSource,
    folder: c.folders[0] ?? NONE,
    resume: c.resume,
    linkedRequisitionId: c.linkedRequisitionId ?? NONE,
    appliedForVacancy: c.appliedForVacancy,
    vacancyId: c.vacancyId ?? NONE,
    positionTitle: '',
  }
}

interface CandidateOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisitions: Requisition[]
  onSubmit: (draft: CandidateDraft) => void
  /** 'shortlist' prefills from `candidate` and submits via `onShortlist`. */
  mode?: 'add' | 'shortlist'
  candidate?: Candidate | null
  /** Live vacancies for the "Applied for Vacancy" pick; falls back to seeds. */
  vacancies?: Vacancy[]
  /** Returns false to keep the sheet open (e.g. already-in-process guard). */
  onShortlist?: (candidateId: string, form: ShortlistForm) => boolean
}

/**
 * Source a candidate into the talent pool (TA-05) with dedupe on save, or
 * shortlist an existing profile with the full Kensium 15-pointer field set —
 * incl. Applied-for-Vacancy with a vacancy/requisition pick.
 */
export function CandidateOverlay({
  open,
  onOpenChange,
  requisitions,
  onSubmit,
  mode = 'add',
  candidate = null,
  vacancies = seedVacancies,
  onShortlist,
}: CandidateOverlayProps) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(candidate ? fromCandidate(candidate) : emptyValues)
  }, [open, candidate, form])

  const sourcing = requisitions.filter((r) =>
    ['approved', 'sourcing'].includes(r.status)
  )
  const openVacancies = vacancies.filter((v) =>
    ['new', 'assigned', 'in-process'].includes(v.status)
  )
  const appliedForVacancy = form.watch('appliedForVacancy')

  function handleSubmit(values: CandidateFormValues) {
    const num = (v: string) => Number(v) || 0
    const channelSource = values.channelSource || values.source
    if (mode === 'shortlist' && candidate && onShortlist) {
      const vacancy = openVacancies.find((v) => v.id === values.vacancyId)
      const ok = onShortlist(candidate.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        gender: values.gender as Candidate['gender'],
        referredBy: values.referredBy,
        image: values.image,
        address: values.address,
        experienceYears: num(values.experienceYears),
        currentCtc: num(values.currentCtc),
        expectedCtc: num(values.expectedCtc),
        qualification: values.qualification,
        appliedForVacancy: values.appliedForVacancy,
        vacancyId: vacancy?.id ?? null,
        requisitionId: vacancy?.rrfId ?? null,
        requisitionTitle: vacancy?.position ?? '',
        positionTitle: values.positionTitle,
        noticePeriodDays: num(values.noticePeriodDays),
        resume: values.resume,
        channelSource,
      })
      if (ok) onOpenChange(false)
      return
    }
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
      gender: values.gender as Candidate['gender'],
      referredBy: values.referredBy,
      address: values.address,
      experienceYears: num(values.experienceYears),
      currentCtc: num(values.currentCtc),
      expectedCtc: num(values.expectedCtc),
      qualification: values.qualification,
      noticePeriodDays: num(values.noticePeriodDays),
      channelSource,
      appliedForVacancy: values.appliedForVacancy,
      vacancyId:
        values.appliedForVacancy && values.vacancyId !== NONE
          ? values.vacancyId
          : null,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {mode === 'shortlist'
              ? `Shortlist candidate — ${candidate?.name ?? ''}`
              : 'Add candidate to talent pool'}
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
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
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
                  name='referredBy'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred by</FormLabel>
                      <FormControl>
                        <Input placeholder='Employee name (optional)' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='image'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile image</FormLabel>
                      <FormControl>
                        <Input placeholder='asha-photo.jpg' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='qualification'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder='B.Tech, Computer Science' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder='HSR Layout, Bengaluru' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  name='experienceYears'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' placeholder='5' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='noticePeriodDays'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice period (days)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' placeholder='30' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='currentCtc'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current CTC (₹ LPA)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' placeholder='18' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='expectedCtc'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected CTC (₹ LPA)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' placeholder='24' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  name='channelSource'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel detail</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. LinkedIn Jobs' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {mode === 'add' && (
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
              )}
              <FormField
                control={form.control}
                name='resume'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume file</FormLabel>
                    <FormControl>
                      <Input placeholder='asha-pillai-resume.pdf' {...field} />
                    </FormControl>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Re-uploading overwrites the resume stored on the profile.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Applied for Vacancy — reveals the vacancy/requisition pick */}
              <FormField
                control={form.control}
                name='appliedForVacancy'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2 space-y-0'>
                    <FormControl>
                      <Checkbox
                        variant='blue'
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Applied for vacancy
                    </FormLabel>
                  </FormItem>
                )}
              />
              {appliedForVacancy ? (
                <FormField
                  control={form.control}
                  name='vacancyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vacancy / requisition</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Pick a vacancy' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>Not selected</SelectItem>
                          {openVacancies.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.code} — {v.position} ({v.rrfId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                mode === 'shortlist' && (
                  <FormField
                    control={form.control}
                    name='positionTitle'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag to position (kept in talent pool)</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Product Designer' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              )}
              {mode === 'add' && (
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
                {mode === 'shortlist' ? 'Shortlist candidate' : 'Add candidate'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
