import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { CustomFieldDef } from '../data/config'
import {
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  EXPERIENCE_BY_LEVEL,
  HIRING_AS,
  HIRING_MANAGERS,
  LOCATIONS,
  POSITION_LEVELS,
  RECRUITERS,
  REQUISITION_PRIORITIES,
  type Requisition,
} from '../data/requisitions'
import type {
  RequisitionDraft,
  RequisitionsStore,
} from '../hooks/use-requisitions'
import { StatusBadge } from './badges'

const requisitionSchema = z
  .object({
    title: z.string().min(3, 'Position title is required'),
    department: z.enum(DEPARTMENTS),
    location: z.enum(LOCATIONS),
    employeeClass: z.enum(EMPLOYEE_CLASSES),
    // RL-04: hiring type — New Join vs Replacement (reason for the vacancy).
    hiringAs: z.enum(HIRING_AS),
    replacementFor: z.string(),
    headcount: z.coerce.number<number>().int().min(1, 'At least 1 opening'),
    description: z.string().min(10, 'Job description is required'),
    requirements: z.string().min(5, 'Requirements are required'),
    nonBudgeted: z.boolean(),
    confidential: z.boolean(),
    priority: z.enum(REQUISITION_PRIORITIES),
    positionLevel: z.enum(POSITION_LEVELS),
    personalTraits: z.string(),
    additionalSkills: z.string(),
    reasonForHiring: z.string().min(3, 'Reason for hiring is required'),
    functionalLocation: z.string().min(2, 'Functional location is required'),
    comments: z.string(),
    closingDate: z.string().min(1, 'Closing date is required'),
    custom: z.record(z.string(), z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.hiringAs === 'Replacement' && !values.replacementFor.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['replacementFor'],
        message: 'Name the employee being replaced',
      })
    }
  })

type RequisitionFormValues = z.infer<typeof requisitionSchema>

const emptyValues: RequisitionFormValues = {
  title: '',
  department: 'Engineering',
  location: 'Bengaluru',
  employeeClass: 'Full-time',
  hiringAs: 'New Join',
  replacementFor: '',
  headcount: 1,
  description: '',
  requirements: '',
  nonBudgeted: false,
  confidential: false,
  priority: 'Low',
  positionLevel: 'Mid',
  personalTraits: '',
  additionalSkills: '',
  reasonForHiring: '',
  functionalLocation: '',
  comments: '',
  closingDate: '',
  custom: {},
}

/** Sources for prefilling a brand-new RRF. */
const COPY_MODES = [
  { value: 'new', label: 'Create new' },
  { value: 'requisition', label: 'Copy from existing requisition' },
  { value: 'employee', label: 'Copy from existing employee' },
] as const
type CopyMode = (typeof COPY_MODES)[number]['value']

const EMPLOYEE_NAMES = [...HIRING_MANAGERS, ...RECRUITERS]

/** Canned prefill when copying the profile of an existing employee. */
function employeePrefill(name: string) {
  return {
    description: `Profile modelled on ${name}'s current role — same scope, responsibilities and success measures.`,
    personalTraits:
      'Collaborative, self-directed, strong stakeholder communication',
    additionalSkills: 'Cross-functional coordination, documentation discipline',
  }
}

/** Approval actions available on an in-flight RRF. */
type ApprovalAction = 'approve' | 'reject' | 'clarify' | 'reply'

interface RequisitionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition?: Requisition | null
  /** Active tenant custom fields rendered dynamically (TA-26, TA-30). */
  customFields: CustomFieldDef[]
  onSubmit: (draft: RequisitionDraft) => void
  /** When provided, the edit view gains the approval-workflow action panel. */
  store?: RequisitionsStore
}

/**
 * Create/edit requisition sheet (TA-01) with forms-engine custom fields,
 * copy-from prefill, and the RRF approval action panel (approve / reject /
 * clarification thread / on-behalf / withdraw / pre-close / resubmit).
 */
export function RequisitionOverlay({
  open,
  onOpenChange,
  requisition,
  customFields,
  onSubmit,
  store,
}: RequisitionOverlayProps) {
  const isEdit = Boolean(requisition)
  const activeCustomFields = customFields.filter(
    (f) => f.entity === 'requisition' && f.active
  )

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: emptyValues,
  })

  // Copy-from prefill selector (creation only).
  const [copyMode, setCopyMode] = useState<CopyMode>('new')
  // Approval action panel state (edit only).
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>('approve')
  const [approvalComment, setApprovalComment] = useState('')
  const [clarifyPerson, setClarifyPerson] = useState('')
  // Pre-close dialog state.
  const [preCloseOpen, setPreCloseOpen] = useState(false)
  const [preCloseHeadcount, setPreCloseHeadcount] = useState(1)
  const [preCloseNote, setPreCloseNote] = useState('')

  useEffect(() => {
    if (!open) return
    setCopyMode('new')
    setApprovalAction(requisition?.status === 'needs-clarification' ? 'reply' : 'approve')
    setApprovalComment('')
    setClarifyPerson('')
    setPreCloseOpen(false)
    setPreCloseHeadcount(requisition?.headcount ?? 1)
    setPreCloseNote('')
    form.reset(
      requisition
        ? {
            title: requisition.title,
            department: requisition.department,
            location: requisition.location,
            employeeClass: requisition.employeeClass,
            hiringAs: requisition.hiringAs,
            replacementFor: requisition.replacementFor ?? '',
            headcount: requisition.headcount,
            description: requisition.description,
            requirements: requisition.requirements,
            nonBudgeted: requisition.nonBudgeted,
            confidential: requisition.confidential,
            priority: requisition.priority,
            positionLevel: requisition.positionLevel,
            personalTraits: requisition.personalTraits,
            additionalSkills: requisition.additionalSkills,
            reasonForHiring: requisition.reasonForHiring,
            functionalLocation: requisition.functionalLocation,
            comments: requisition.comments,
            closingDate: requisition.closingDate,
            custom: requisition.custom,
          }
        : emptyValues
    )
  }, [open, requisition, form])

  /** Prefill description/traits/skills from another requisition or employee. */
  function applyCopySource(source: string) {
    if (copyMode === 'requisition') {
      const src = store?.requisitions.find((r) => r.id === source)
      if (!src) return
      form.setValue('description', src.description)
      form.setValue('personalTraits', src.personalTraits)
      form.setValue('additionalSkills', src.additionalSkills)
    } else if (copyMode === 'employee') {
      const prefill = employeePrefill(source)
      form.setValue('description', prefill.description)
      form.setValue('personalTraits', prefill.personalTraits)
      form.setValue('additionalSkills', prefill.additionalSkills)
    }
  }

  function handleSubmit(values: RequisitionFormValues) {
    // Forms engine enforces mandatory custom fields from config (TA-30).
    for (const field of activeCustomFields) {
      if (field.mandatory && !values.custom[field.id]) {
        form.setError('custom', {
          message: `"${field.label}" is mandatory`,
        })
        return
      }
    }
    // RL-04: only Replacement requisitions carry the backfilled employee.
    onSubmit({
      ...values,
      // Experience band is read-only, derived from the position level.
      experience: EXPERIENCE_BY_LEVEL[values.positionLevel],
      replacementFor:
        values.hiringAs === 'Replacement'
          ? values.replacementFor.trim()
          : null,
    })
    onOpenChange(false)
  }

  // ---- Approval action panel helpers (edit view only) ----
  const req = requisition ?? null
  const pendingStep = req?.approvals.find((a) => a.decision === 'pending')
  const openQuestion = req?.clarifications.filter((c) => !c.answer).slice(-1)[0]
  const requesterName = req?.hiringManager ?? 'Requester'
  /** Requester + previous-level approvers a question can be routed to. */
  const clarifyTargets = req
    ? [
        requesterName,
        ...req.approvals
          .filter(
            (a) =>
              a.decision !== 'pending' &&
              (!pendingStep || a.level < pendingStep.level)
          )
          .map((a) => a.approver),
      ]
    : []

  function submitApprovalAction() {
    if (!req || !store) return
    if (approvalAction === 'approve') {
      store.decideApproval(req.id, 'approved', approvalComment)
    } else if (approvalAction === 'reject') {
      store.decideApproval(req.id, 'rejected', approvalComment)
    } else if (approvalAction === 'clarify') {
      if (!approvalComment.trim() || !clarifyPerson) return
      store.askClarification(
        req.id,
        approvalComment,
        pendingStep?.approver ?? 'Approver',
        clarifyPerson
      )
    } else if (approvalAction === 'reply') {
      if (!approvalComment.trim()) return
      store.answerClarification(req.id, approvalComment)
    }
    onOpenChange(false)
  }

  const canAct =
    req &&
    store &&
    ['pending-approval', 'needs-clarification'].includes(req.status)
  const canWithdraw =
    req && store && !['withdrawn', 'closed', 'cancelled'].includes(req.status)
  const canPreClose =
    req &&
    store &&
    !['withdrawn', 'closed', 'cancelled', 'filled'].includes(req.status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit ${requisition?.id}` : 'New job requisition'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {/* Copy-from prefill — create mode only */}
              {!isEdit && (
                <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white p-3'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Start from — prefills description, traits and skills
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <Select
                      value={copyMode}
                      onValueChange={(v) => setCopyMode(v as CopyMode)}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COPY_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {copyMode === 'requisition' && (
                      <Select onValueChange={applyCopySource}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pick a requisition…' />
                        </SelectTrigger>
                        <SelectContent>
                          {(store?.requisitions ?? []).map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.id} — {r.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {copyMode === 'employee' && (
                      <Select onValueChange={applyCopySource}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pick an employee…' />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_NAMES.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position title</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Senior Backend Engineer' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
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
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
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
                name='functionalLocation'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Functional location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Platform Engineering — Tech Park Block B'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='employeeClass'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee class</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMPLOYEE_CLASSES.map((c) => (
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
                  name='headcount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headcount</FormLabel>
                      <FormControl>
                        <Input type='number' min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REQUISITION_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
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
                  name='positionLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position level</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITION_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Experience band is derived read-only from the level */}
                      <p className='text-paragraph-sm text-neutral-1000'>
                        Experience: {EXPERIENCE_BY_LEVEL[field.value]}{' '}
                        (auto-derived)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* RL-04: hiring type — reason for the vacancy */}
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='hiringAs'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hiring as</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HIRING_AS.map((h) => (
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
                {form.watch('hiringAs') === 'Replacement' && (
                  <FormField
                    control={form.control}
                    name='replacementFor'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Replacing employee</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Nikhil Kulkarni (EMP-0231)'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name='reasonForHiring'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for hiring</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Platform pod scaling with the FY27 roadmap'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='closingDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position closing date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requirements'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='personalTraits'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal traits</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder='e.g. Ownership mindset, mentors juniors'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='additionalSkills'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional skills</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder='e.g. Kafka, gRPC, capacity planning'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='comments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='nonBudgeted'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mt-0!'>
                      Non-budgeted position (routes to the extra approver)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='confidential'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mt-0!'>
                      Confidential hiring (masked outside the approval chain)
                    </FormLabel>
                  </FormItem>
                )}
              />

              {activeCustomFields.length > 0 && (
                <div className='space-y-3 rounded-[8px] border border-gray-200 p-3'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Custom fields (rendered from config v
                    {Math.max(...activeCustomFields.map((f) => f.version))} — no
                    code change)
                  </p>
                  {activeCustomFields.map((cf) => (
                    <FormField
                      key={cf.id}
                      control={form.control}
                      name='custom'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {cf.label}
                            {cf.mandatory ? ' *' : ''}
                          </FormLabel>
                          {cf.fieldType === 'select' ? (
                            <Select
                              value={field.value[cf.id] ?? ''}
                              onValueChange={(v) =>
                                field.onChange({ ...field.value, [cf.id]: v })
                              }
                            >
                              <FormControl>
                                <SelectTrigger className='w-full'>
                                  <SelectValue placeholder='Select…' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(cf.options ?? []).map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                type={cf.fieldType === 'number' ? 'number' : 'text'}
                                value={field.value[cf.id] ?? ''}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    [cf.id]: e.target.value,
                                  })
                                }
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {/* ---- Approval workflow panel (edit view) ---- */}
              {isEdit && req && store && (
                <div className='space-y-3 rounded-[8px] border border-gray-200 bg-white p-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      Approval workflow
                    </p>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Chain with approve-on-behalf for pending lower levels */}
                  <div className='space-y-1.5'>
                    {req.approvals.length === 0 && (
                      <p className='text-neutral-1000 text-paragraph-sm'>
                        Not submitted yet — no approval chain instantiated.
                      </p>
                    )}
                    {req.approvals.map((a) => {
                      // The next higher-level approver acts for an absentee.
                      const higher = req.approvals.find(
                        (h) => h.level > a.level
                      )
                      return (
                        <div
                          key={a.level}
                          className='flex items-center justify-between gap-2 rounded border border-gray-200 px-2 py-1.5'
                        >
                          <span className='text-neutral-1900 min-w-0 truncate text-sm'>
                            L{a.level} · {a.approver} ({a.approverRole})
                            {a.comment && (
                              <span className='text-neutral-1000 text-paragraph-sm block truncate'>
                                “{a.comment}”
                              </span>
                            )}
                          </span>
                          <div className='flex shrink-0 items-center gap-1.5'>
                            {a.decision === 'pending' &&
                              higher &&
                              req.status === 'pending-approval' && (
                                <Button
                                  type='button'
                                  variant='outline'
                                  className='h-6 px-2 text-xs'
                                  onClick={() => {
                                    store.approveOnBehalf(
                                      req.id,
                                      a.level,
                                      higher.approver,
                                      approvalComment
                                    )
                                    onOpenChange(false)
                                  }}
                                >
                                  Approve on behalf
                                </Button>
                              )}
                            <StatusBadge
                              status={
                                a.decision === 'pending' ? 'pending' : a.decision
                              }
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Clarification thread — chronological */}
                  {req.clarifications.length > 0 && (
                    <div className='space-y-1.5'>
                      <p className='text-neutral-1600 text-sm font-medium'>
                        Clarifications
                      </p>
                      {req.clarifications.map((c, i) => (
                        <div
                          key={i}
                          className='rounded border border-gray-200 px-2 py-1.5 text-sm'
                        >
                          <p className='text-neutral-1900'>
                            Q: {c.question}
                          </p>
                          <p className='text-neutral-1000 text-paragraph-sm'>
                            {c.askedBy} → {c.askedOf} ·{' '}
                            {c.askedAt.slice(0, 10)}
                          </p>
                          {c.answer ? (
                            <>
                              <p className='text-neutral-1900 mt-1'>
                                A: {c.answer}
                              </p>
                              <p className='text-neutral-1000 text-paragraph-sm'>
                                answered {c.answeredAt?.slice(0, 10)}
                              </p>
                            </>
                          ) : (
                            <p className='text-neutral-1000 text-paragraph-sm mt-1 italic'>
                              Awaiting reply from {c.askedOf}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action select + comments + submit */}
                  {canAct && (
                    <div className='space-y-2'>
                      <div className='grid grid-cols-2 gap-3'>
                        <Select
                          value={approvalAction}
                          onValueChange={(v) =>
                            setApprovalAction(v as ApprovalAction)
                          }
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {req.status === 'pending-approval' && (
                              <>
                                <SelectItem value='approve'>Approve</SelectItem>
                                <SelectItem value='reject'>Reject</SelectItem>
                                <SelectItem value='clarify'>
                                  Need Clarification
                                </SelectItem>
                              </>
                            )}
                            {openQuestion && (
                              <SelectItem value='reply'>
                                Clarify reply (as {openQuestion.askedOf})
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {approvalAction === 'clarify' && (
                          <Select
                            value={clarifyPerson}
                            onValueChange={setClarifyPerson}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Ask whom?' />
                            </SelectTrigger>
                            <SelectContent>
                              {[...new Set(clarifyTargets)].map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Textarea
                        rows={2}
                        placeholder={
                          approvalAction === 'clarify'
                            ? 'Question for the selected person'
                            : approvalAction === 'reply'
                              ? 'Answer to the open question'
                              : 'Comments / justification (captured in the audit trail)'
                        }
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                      />
                      <Button
                        type='button'
                        className='h-7'
                        onClick={submitApprovalAction}
                      >
                        Submit
                      </Button>
                    </div>
                  )}

                  {/* Lifecycle actions: withdraw / pre-close / resubmit */}
                  <div className='flex flex-wrap items-center gap-2 border-t border-gray-200 pt-2'>
                    {canWithdraw && (
                      <Button
                        type='button'
                        variant='outline'
                        className='h-7'
                        onClick={() => {
                          store.withdrawRequisition(req.id, requesterName)
                          onOpenChange(false)
                        }}
                      >
                        Withdraw
                      </Button>
                    )}
                    {canPreClose && (
                      <Button
                        type='button'
                        variant='outline'
                        className='h-7'
                        onClick={() => setPreCloseOpen(true)}
                      >
                        Pre-close
                      </Button>
                    )}
                    {req.status === 'rejected' && (
                      <Button
                        type='button'
                        variant='outline'
                        className='h-7'
                        onClick={() => {
                          store.resubmitRequisition(req.id)
                          onOpenChange(false)
                        }}
                      >
                        Resubmit
                      </Button>
                    )}
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
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Save as draft'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>

      {/* Pre-close dialog — reduce positions and close early */}
      <Dialog open={preCloseOpen} onOpenChange={setPreCloseOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Pre-close {req?.id}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>
                Number of positions (was {req?.headcount})
              </p>
              <Input
                type='number'
                min={0}
                value={preCloseHeadcount}
                onChange={(e) => setPreCloseHeadcount(Number(e.target.value))}
              />
            </div>
            <Textarea
              rows={2}
              placeholder='Pre-closure note (why the RRF is closing early)'
              value={preCloseNote}
              onChange={(e) => setPreCloseNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (req && store) {
                  store.preCloseRequisition(req.id, preCloseHeadcount, preCloseNote)
                }
                setPreCloseOpen(false)
                onOpenChange(false)
              }}
            >
              Close early
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
