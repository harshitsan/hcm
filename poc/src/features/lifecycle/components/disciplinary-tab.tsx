import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'phosphor-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  COUNSELLING_OUTCOMES,
  DISCIPLINARY_ACTION_TYPES,
  DISCIPLINARY_POLICIES,
  type CounsellingOutcome,
  type CounsellingRecord,
  type DisciplinaryCase,
} from '../data/disciplinary'
import {
  DEPARTMENTS,
  LOCATIONS,
  PERSONAS,
  POSITION_LEVELS,
  fmtDate,
  todayISO,
} from '../data/shared'
import { type DisciplinaryStore } from '../hooks/use-disciplinary'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

const columns: ColumnDef<DisciplinaryCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode} · {row.original.department}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <SortHeader column={column} label='Location' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.location}</span>,
  },
  {
    accessorKey: 'actionType',
    header: ({ column }) => <SortHeader column={column} label='Action' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.actionType}</Badge>,
  },
  {
    accessorKey: 'policyDeviated',
    header: ({ column }) => <SortHeader column={column} label='Policy Deviated' />,
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.policyDeviated}</span>
    ),
  },
  {
    accessorKey: 'initiatedOn',
    header: ({ column }) => <SortHeader column={column} label='Initiated' />,
    cell: ({ row }) => (
      <span className='text-sm'>
        {fmtDate(row.original.initiatedOn)} · {row.original.initiatedBy}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

const schema = z.object({
  employeeName: z.string().min(2, 'Employee is required'),
  employeeCode: z.string().min(3, 'Employee code is required'),
  department: z.string().min(1),
  location: z.string().min(1),
  actionType: z.enum(DISCIPLINARY_ACTION_TYPES),
  policyDeviated: z.string().min(1, 'Select the policy deviated'),
  reason: z.string().min(10, 'Describe the incident (min 10 chars)'),
  reportedBy: z.string().min(2, 'Reported by is required'),
  reportedOn: z.string().min(1, 'Reported on is required'),
  actionToBeTakenOn: z.string().min(1, 'Action date is required'),
  attachmentName: z.string(),
})

type FormValues = z.infer<typeof schema>

const counsellingSchema = z.object({
  location: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  employees: z.string().min(2, 'Employee(s) required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  topic: z.string().min(3, 'Counselling topic is required'),
  notes: z.string(),
})

type CounsellingFormValues = z.infer<typeof counsellingSchema>

/** Amber inline notice shown once a case is handed to the Exit Coordinator. */
function ExitHandoffNotice({ c }: { c: DisciplinaryCase }) {
  if (!c.exitHandoff) return null
  return (
    <div className='rounded-[6px] border border-amber-300 bg-amber-50 p-3'>
      <p className='text-sm font-medium text-amber-900'>
        Task and notification triggered to Exit Coordinator to initiate the{' '}
        {c.exitHandoff.process} process
      </p>
      <p className='mt-0.5 text-xs text-amber-800'>
        Referred on {fmtDate(c.exitHandoff.triggeredOn)} — an exit case has been
        opened with a “Disciplinary referral” origin
        {c.exitHandoff.exitId
          ? ` (${c.exitHandoff.exitId} on the Exits tab, linked back to this case)`
          : ''}
        .
      </p>
    </div>
  )
}

/** Dated activity trail for a disciplinary case. */
function CaseHistory({ c }: { c: DisciplinaryCase }) {
  const entries = c.history ?? []
  if (entries.length === 0) return null
  return (
    <div className='space-y-1.5'>
      <p className='text-sm font-semibold'>Case history</p>
      {entries.map((h) => (
        <div
          key={h.id}
          className='rounded-[6px] border border-gray-200 px-3 py-2'
        >
          <div className='flex items-start justify-between gap-3'>
            <p className='text-sm'>{h.text}</p>
            <span className='text-neutral-1000 shrink-0 text-xs'>
              {fmtDate(h.date)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col'>
      <span className='text-neutral-1000 text-xs'>{label}</span>
      <span className='text-neutral-1600 text-sm font-medium'>{value}</span>
    </div>
  )
}

interface DisciplinaryTabProps {
  store: DisciplinaryStore
}

/** Disciplinary actions: initiate → location approver → letter / counselling / exit handoff. */
export function DisciplinaryTab({ store }: DisciplinaryTabProps) {
  const { role, hasRole } = useRole()
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [counsellingFor, setCounsellingFor] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completeOutcome, setCompleteOutcome] =
    useState<CounsellingOutcome>('No Action')
  const [completeComments, setCompleteComments] = useState('')

  const selected = store.cases.find((c) => c.id === selectedId) ?? null
  const counsellingCase =
    store.cases.find((c) => c.id === counsellingFor) ?? null
  const completing =
    store.counselling.find((r) => r.id === completingId) ?? null
  const isAdmin = hasRole('Company Admin')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeName: '',
      employeeCode: '',
      department: 'Engineering',
      location: 'Hyderabad',
      actionType: 'Warning Letter',
      policyDeviated: 'Code of Conduct',
      reason: '',
      reportedBy: '',
      reportedOn: todayISO(),
      actionToBeTakenOn: '',
      attachmentName: '',
    },
  })

  const counsellingForm = useForm<CounsellingFormValues>({
    resolver: zodResolver(counsellingSchema),
    defaultValues: {
      location: 'Hyderabad',
      department: 'Engineering',
      position: 'L1 - Associate',
      employees: '',
      startDate: '',
      endDate: '',
      topic: '',
      notes: '',
    },
  })

  const openCounsellingDialog = (c: DisciplinaryCase) => {
    counsellingForm.reset({
      location: c.location,
      department: c.department,
      position: 'L1 - Associate',
      employees: c.employeeName,
      startDate: '',
      endDate: '',
      topic: '',
      notes: '',
    })
    setCounsellingFor(c.id)
  }

  const openCompleteDialog = (r: CounsellingRecord) => {
    setCompleteOutcome('No Action')
    setCompleteComments('')
    setCompletingId(r.id)
  }

  const inProgressRecordFor = (caseId: string) =>
    store.counselling.find(
      (r) => r.caseId === caseId && r.status === 'in-progress'
    ) ?? null

  return (
    <div className='w-full'>
      <div className='mb-1 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Disciplinary Actions ({store.cases.length})
        </h2>
        <RoleGate roles={['Company Admin']}>
          <Button
            variant='red'
            onClick={() => {
              form.reset()
              setNewOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Initiate Action
          </Button>
        </RoleGate>
      </div>
      <p className='text-neutral-1000 mb-3 text-xs'>
        Visible to Company Admins only — employees never see disciplinary
        records other than communications addressed to them. Opening a record
        or acting on it is captured on the audit trail. While a case is open,
        the employee&apos;s probation confirmation stays gated.
      </p>

      <DataTable
        columns={columns}
        data={store.cases}
        variant='no-status'
        onRowClick={(row: DisciplinaryCase) => {
          setSelectedId(row.id)
          store.recordView(row)
        }}
      />

      {/* Counselling engagements */}
      <div className='mt-6'>
        <h3 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Counselling Engagements ({store.counselling.length})
        </h3>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Counselling sessions are conducted offline between the counselor and
          the employee — only scheduling details and outcomes are tracked here.
        </p>
        {store.counselling.length === 0 ? (
          <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
            <p className='text-neutral-1000 text-sm'>
              No counselling engagements yet. Approve a Counselling case and use
              “Initiate Counselling” from its detail view.
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {store.counselling.map((r) => {
              const parent = store.cases.find((c) => c.id === r.caseId)
              return (
                <div
                  key={r.id}
                  className='rounded-[6px] border border-gray-200 bg-white p-3'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-neutral-1600 text-sm font-medium'>
                        Counselling on “{r.topic}” · {r.employees}
                      </p>
                      <p className='text-neutral-1000 mt-0.5 text-xs'>
                        Case {r.caseId}
                        {parent ? ` (${parent.actionType})` : ''} · {r.location}{' '}
                        · {r.department} · {r.position}
                      </p>
                      <p className='text-neutral-1000 mt-0.5 text-xs'>
                        {fmtDate(r.startDate)} → {fmtDate(r.endDate)} · Initiated
                        by {r.initiatedBy} on {fmtDate(r.initiatedOn)}
                      </p>
                      {r.notes && (
                        <p className='text-neutral-1000 mt-1 text-xs'>
                          Notes: {r.notes}
                        </p>
                      )}
                      {r.status === 'completed' && (
                        <p className='text-neutral-1600 mt-1 text-xs'>
                          Outcome: <span className='font-medium'>{r.outcome}</span>
                          {r.outcomeComments ? ` — ${r.outcomeComments}` : ''} ·
                          Completed {fmtDate(r.completedOn)}
                        </p>
                      )}
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <StatusBadge
                        status={
                          r.status === 'in-progress'
                            ? 'counselling-in-progress'
                            : 'counselling-completed'
                        }
                      />
                      {r.status === 'in-progress' && isAdmin && (
                        <Button size='sm' onClick={() => openCompleteDialog(r)}>
                          Complete Counselling
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Initiate */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Initiate disciplinary action</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className='space-y-3'
              onSubmit={form.handleSubmit((values) => {
                store.initiate({
                  ...values,
                  attachmentName: values.attachmentName.trim() || null,
                  initiatedBy: PERSONAS[role],
                })
                setNewOpen(false)
              })}
            >
              <FormField
                control={form.control}
                name='employeeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Input placeholder='Employee name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='employeeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee code</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. EMP-0000' {...field} />
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
                          <SelectTrigger variant='secondary' className='w-full'>
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
                      <FormLabel>Location (drives routing)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
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
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='actionType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCIPLINARY_ACTION_TYPES.map((t) => (
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
                  name='policyDeviated'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy deviated</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCIPLINARY_POLICIES.map((p) => (
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
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='reportedBy'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reported by</FormLabel>
                      <FormControl>
                        <Input placeholder='Reporter name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='reportedOn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reported on</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='actionToBeTakenOn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action to be taken on</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='attachmentName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachment</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. evidence.pdf' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident / reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder='What happened?' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setNewOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Route to location approver</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {selected?.employeeName} · {selected?.actionType}
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-4'>
              <p className='text-neutral-1000 text-sm'>{selected.reason}</p>
              <div className='grid grid-cols-2 gap-3 rounded-[6px] border border-gray-200 bg-white p-3'>
                <DetailField
                  label='Policy deviated'
                  value={selected.policyDeviated}
                />
                <DetailField label='Reported by' value={selected.reportedBy} />
                <DetailField
                  label='Reported on'
                  value={fmtDate(selected.reportedOn)}
                />
                <DetailField
                  label='Action to be taken on'
                  value={fmtDate(selected.actionToBeTakenOn)}
                />
                <DetailField
                  label='Attachment'
                  value={selected.attachmentName ?? '—'}
                />
              </div>
              <ApprovalSteps
                steps={selected.approvals}
                disabled={selected.status !== 'pending-approval'}
                canAct={() => isAdmin}
                onApprove={() => store.approve(selected)}
                onReject={(note) => store.reject(selected, note)}
              />

              <ExitHandoffNotice c={selected} />

              <CaseHistory c={selected} />

              {selected.status === 'approved' &&
                selected.actionType !== 'Counselling' &&
                isAdmin && (
                  <Button size='sm' onClick={() => store.issueLetter(selected)}>
                    Issue letter from template
                  </Button>
                )}
              {selected.status === 'approved' &&
                selected.actionType === 'Counselling' &&
                isAdmin && (
                  <Button
                    size='sm'
                    onClick={() => openCounsellingDialog(selected)}
                  >
                    Initiate Counselling
                  </Button>
                )}
              {selected.status === 'counselling-in-progress' && (
                <div className='flex flex-col gap-2'>
                  <p className='text-neutral-1000 text-xs'>
                    Counselling is in progress. The session happens offline
                    between the counselor and the employee — record the outcome
                    once it concludes.
                  </p>
                  {isAdmin &&
                    (() => {
                      const rec = inProgressRecordFor(selected.id)
                      return rec ? (
                        <Button
                          size='sm'
                          className='self-start'
                          onClick={() => openCompleteDialog(rec)}
                        >
                          Complete Counselling
                        </Button>
                      ) : null
                    })()}
                </div>
              )}
              {selected.status === 'closed' && (
                <Badge variant='badge_inactive'>
                  Case closed — counselling concluded with no further action
                </Badge>
              )}
              {selected.status === 'letter-issued' && (
                <Badge variant='completed'>
                  Letter issued from the configured disciplinary template
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Initiate Counselling */}
      <Dialog
        open={counsellingCase !== null}
        onOpenChange={(open) => {
          if (!open) setCounsellingFor(null)
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Initiate counselling</DialogTitle>
          </DialogHeader>
          <p className='text-neutral-1000 text-xs'>
            The counselling session itself is conducted offline between the
            counselor and the employee. This form only schedules and tracks the
            engagement.
          </p>
          <Form {...counsellingForm}>
            <form
              className='space-y-3'
              onSubmit={counsellingForm.handleSubmit((values) => {
                if (counsellingCase) {
                  store.initiateCounselling(counsellingCase, {
                    ...values,
                    initiatedBy: PERSONAS[role],
                  })
                }
                setCounsellingFor(null)
                setSelectedId(null)
              })}
            >
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={counsellingForm.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicable location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
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
                <FormField
                  control={counsellingForm.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
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
              </div>
              <FormField
                control={counsellingForm.control}
                name='position'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSITION_LEVELS.map((p) => (
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
                control={counsellingForm.control}
                name='employees'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee(s)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Comma-separated employee names'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={counsellingForm.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Counselling start date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={counsellingForm.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={counsellingForm.control}
                name='topic'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Counselling on</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Topic, e.g. Workplace collaboration'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={counsellingForm.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Context for the counselor (optional)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCounsellingFor(null)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Initiate Counselling</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Complete Counselling */}
      <Dialog
        open={completing !== null}
        onOpenChange={(open) => {
          if (!open) setCompletingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete counselling</DialogTitle>
          </DialogHeader>
          {completing && (
            <div className='space-y-4'>
              <p className='text-neutral-1000 text-sm'>
                Record the outcome of the offline counselling session on “
                {completing.topic}” with {completing.employees}.
              </p>
              <div>
                <Label className='mb-2 block'>Outcome</Label>
                <RadioGroup
                  value={completeOutcome}
                  onValueChange={(v) =>
                    setCompleteOutcome(v as CounsellingOutcome)
                  }
                >
                  {COUNSELLING_OUTCOMES.map((o) => (
                    <div key={o} className='flex items-center gap-2'>
                      <RadioGroupItem value={o} id={`outcome-${o}`} />
                      <Label htmlFor={`outcome-${o}`} className='font-normal'>
                        {o === 'No Action'
                          ? 'No Action — close the case'
                          : 'Termination — hand off to the Exit Coordinator'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className='mb-2 block'>Comments</Label>
                <Textarea
                  placeholder='Counselling summary / rationale for the outcome'
                  value={completeComments}
                  onChange={(e) => setCompleteComments(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCompletingId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    store.completeCounselling(
                      completing,
                      completeOutcome,
                      completeComments.trim()
                    )
                    setCompletingId(null)
                    setSelectedId(null)
                  }}
                >
                  Complete Counselling
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
