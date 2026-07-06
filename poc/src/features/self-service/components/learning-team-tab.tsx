import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import {
  CATALOG_STATUSES,
  CERTIFICATION_CATALOG,
  EMPLOYEE_CERT_STATUSES,
  ENROLLMENT_STATUSES,
  POSITION_LEVELS,
  PROGRAM_TYPES,
  TEAM_DEPARTMENTS,
  TEAM_EMPLOYEES,
  TEAM_LOCATIONS,
  TEAM_REQUEST_STATUSES,
  type CatalogProgram,
  type EmployeeCertification,
  type Enrollment,
  type MassApprovalRow,
  type TeamLearningRequest,
} from '../data/learning-team'
import { type LearningTeamStore } from '../hooks/use-learning-team'
import { SummaryCards } from './shared'
import { StatusBadge } from './status-badge'
import { formatDate, formatInr } from './utils'

interface LearningTeamTabProps {
  store: LearningTeamStore
}

const ALL = 'All'

/** Small labelled select used across the team learning filter rows. */
function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
  width = 'w-[170px]',
}: {
  value: string
  onChange: (next: string) => void
  allLabel: string
  options: readonly string[]
  width?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-8 ${width} bg-white`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Refresh action shared by every team learning list (EC-06/EEP-05/ELR-05/LP-05/TMA-04). */
function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Button
      variant='outline'
      className='h-8 gap-1 rounded-[6px] px-2'
      onClick={onRefresh}
    >
      <ArrowsClockwise size={13} weight='bold' />
      Refresh
    </Button>
  )
}

/* ------------------------------------------------------------------ */
/* Employee Certifications (EC-01..06)                                 */
/* ------------------------------------------------------------------ */

const assignSchema = z.object({
  certification: z.string().min(1, 'Select a certification'),
  employeeCodes: z.array(z.string()).min(1, 'Select at least one employee'),
  mandatory: z.boolean(),
})

type AssignValues = z.infer<typeof assignSchema>

interface CertFilter {
  location: string
  department: string
  positionLevel: string
  employee: string
  status: string
  certification: string
}

const EMPTY_CERT_FILTER: CertFilter = {
  location: ALL,
  department: ALL,
  positionLevel: ALL,
  employee: '',
  status: ALL,
  certification: ALL,
}

function EmployeeCertificationsSection({ store }: LearningTeamTabProps) {
  const [filter, setFilter] = useState<CertFilter>(EMPTY_CERT_FILTER)
  const [assignOpen, setAssignOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const form = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      certification: CERTIFICATION_CATALOG[0],
      employeeCodes: [],
      mandatory: false,
    },
  })

  useEffect(() => {
    if (assignOpen) form.reset()
  }, [assignOpen, form])

  const columns = useMemo<ColumnDef<EmployeeCertification>[]>(
    () => [
      { accessorKey: 'employeeCode', header: 'Employee code' },
      { accessorKey: 'employeeName', header: 'Employee' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'location', header: 'Location' },
      { accessorKey: 'positionLevel', header: 'Position level' },
      { accessorKey: 'certification', header: 'Certification' },
      {
        accessorKey: 'mandatory',
        header: 'Mandatory',
        cell: ({ row }) =>
          row.original.mandatory ? (
            <Badge variant='overdue'>Mandatory</Badge>
          ) : (
            <span className='text-neutral-1000'>Optional</span>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'completedOn',
        header: 'Completed date',
        cell: ({ row }) => formatDate(row.original.completedOn),
      },
      {
        accessorKey: 'validTill',
        header: 'Valid till',
        cell: ({ row }) => formatDate(row.original.validTill),
      },
    ],
    []
  )

  const filtered = useMemo(
    () =>
      store.employeeCertifications.filter((c) => {
        if (filter.location !== ALL && c.location !== filter.location)
          return false
        if (filter.department !== ALL && c.department !== filter.department)
          return false
        if (
          filter.positionLevel !== ALL &&
          c.positionLevel !== filter.positionLevel
        )
          return false
        if (
          filter.employee &&
          !c.employeeName.toLowerCase().includes(filter.employee.toLowerCase())
        )
          return false
        if (filter.status !== ALL && c.status !== filter.status) return false
        if (
          filter.certification !== ALL &&
          c.certification !== filter.certification
        )
          return false
        return true
      }),
    [store.employeeCertifications, filter]
  )

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <FilterSelect
          value={filter.location}
          onChange={(location) => setFilter({ ...filter, location })}
          allLabel='All locations'
          options={TEAM_LOCATIONS}
          width='w-[140px]'
        />
        <FilterSelect
          value={filter.department}
          onChange={(department) => setFilter({ ...filter, department })}
          allLabel='All departments'
          options={TEAM_DEPARTMENTS}
          width='w-[160px]'
        />
        <FilterSelect
          value={filter.positionLevel}
          onChange={(positionLevel) => setFilter({ ...filter, positionLevel })}
          allLabel='All position levels'
          options={POSITION_LEVELS}
        />
        <Input
          aria-label='Employee name'
          placeholder='Employee name'
          value={filter.employee}
          onChange={(e) => setFilter({ ...filter, employee: e.target.value })}
          className='h-8 w-[160px] bg-white'
        />
        <FilterSelect
          value={filter.status}
          onChange={(status) => setFilter({ ...filter, status })}
          allLabel='All statuses'
          options={EMPLOYEE_CERT_STATUSES}
          width='w-[130px]'
        />
        <FilterSelect
          value={filter.certification}
          onChange={(certification) => setFilter({ ...filter, certification })}
          allLabel='All certifications'
          options={CERTIFICATION_CATALOG}
          width='w-[220px]'
        />
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={() => setFilter(EMPTY_CERT_FILTER)}
        >
          Reset
        </Button>
        <span className='ml-auto flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => {
              setRefreshKey((k) => k + 1)
              store.refresh('Employee certifications')
            }}
          />
          <Button
            variant='red'
            onClick={() => setAssignOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Assign Certification
          </Button>
        </span>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        data={filtered}
        variant='no-status'
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>Assign certification to employees</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                store.assignCertification(values)
                setAssignOpen(false)
              })}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='certification'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CERTIFICATION_CATALOG.map((c) => (
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
                name='employeeCodes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employees</FormLabel>
                    <div className='max-h-44 space-y-2 overflow-y-auto rounded-[6px] border border-gray-200 p-2'>
                      {TEAM_EMPLOYEES.map((emp) => {
                        const checked = field.value.includes(emp.code)
                        return (
                          <label
                            key={emp.code}
                            className='flex cursor-pointer items-center gap-2 text-sm'
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                field.onChange(
                                  next === true
                                    ? [...field.value, emp.code]
                                    : field.value.filter(
                                        (c) => c !== emp.code
                                      )
                                )
                              }
                            />
                            <span>
                              {emp.name}
                              <span className='text-neutral-1000'>
                                {' '}
                                — {emp.code} · {emp.department}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='mandatory'
                render={({ field }) => (
                  <FormItem>
                    <label className='flex cursor-pointer items-center gap-2 text-sm'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(next) =>
                            field.onChange(next === true)
                          }
                        />
                      </FormControl>
                      <FormLabel className='cursor-pointer'>
                        Mark as mandatory
                      </FormLabel>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setAssignOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Assign</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Employee Enrollment Program (EEP-01..05)                            */
/* ------------------------------------------------------------------ */

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

/** Weekly Su–Sa day breakdown for an enrollment (EEP-04). */
function DayBreakdown({ days }: { days: Enrollment['days'] }) {
  return (
    <span className='flex gap-1'>
      {DAY_LABELS.map((label, i) => (
        <span
          key={label}
          className={
            days[i]
              ? 'bg-blue-1400 rounded-[4px] px-1 text-[10px] font-medium text-white'
              : 'text-neutral-1000 rounded-[4px] bg-gray-100 px-1 text-[10px]'
          }
        >
          {label}
        </span>
      ))}
    </span>
  )
}

function EnrollmentSection({ store }: LearningTeamTabProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState(ALL)
  const [refreshKey, setRefreshKey] = useState(0)

  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      { accessorKey: 'employee', header: 'Employee' },
      { accessorKey: 'class', header: 'Class' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'positionLevel', header: 'Position level' },
      { accessorKey: 'title', header: 'Title' },
      {
        id: 'schedule',
        header: 'Schedule',
        cell: ({ row }) =>
          `${formatDate(row.original.scheduleStart)} – ${formatDate(row.original.scheduleEnd)}`,
      },
      {
        id: 'days',
        header: 'Days (Su–Sa)',
        cell: ({ row }) => <DayBreakdown days={row.original.days} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  )

  const filtered = useMemo(
    () =>
      store.enrollments.filter((e) => {
        if (from && e.scheduleEnd < from) return false
        if (to && e.scheduleStart > to) return false
        if (status !== ALL && e.status !== status) return false
        return true
      }),
    [store.enrollments, from, to, status]
  )

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <span className='text-paragraph-sm text-neutral-1000'>Schedule</span>
        <Input
          type='date'
          aria-label='Schedule from'
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className='h-8 w-[150px] bg-white'
        />
        <span className='text-paragraph-sm text-neutral-1000'>to</span>
        <Input
          type='date'
          aria-label='Schedule to'
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className='h-8 w-[150px] bg-white'
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          allLabel='All statuses'
          options={ENROLLMENT_STATUSES}
          width='w-[200px]'
        />
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={() => {
            setFrom('')
            setTo('')
            setStatus(ALL)
          }}
        >
          Reset
        </Button>
        <span className='ml-auto'>
          <RefreshButton
            onRefresh={() => {
              setRefreshKey((k) => k + 1)
              store.refresh('Enrollment program')
            }}
          />
        </span>
      </div>
      <DataTable
        key={refreshKey}
        columns={columns}
        data={filtered}
        variant='no-status'
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Employee Learning Requests (ELR-01/02/03/05)                        */
/* ------------------------------------------------------------------ */

/** Shared column set for the sponsorship / reimbursement lists (ELR-01/02). */
function buildRequestColumns(
  kind: 'sponsorship' | 'reimbursement',
  decide: LearningTeamStore['decideRequest']
): ColumnDef<TeamLearningRequest>[] {
  return [
    { accessorKey: 'programTitle', header: 'Program title' },
    { accessorKey: 'vendor', header: 'Vendor' },
    {
      accessorKey: 'totalAmount',
      header: 'Total amount',
      cell: ({ row }) => formatInr(row.original.totalAmount),
    },
    {
      accessorKey: 'capAmount',
      header:
        kind === 'sponsorship'
          ? 'Max sponsorship amount'
          : 'Maximum claimable amount',
      cell: ({ row }) => formatInr(row.original.capAmount),
    },
    { accessorKey: 'requester', header: 'Requester' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) =>
        row.original.status === 'Pending with me' ? (
          <span className='flex gap-1'>
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => decide(kind, row.original.id, 'Approved')}
            >
              Approve
            </Button>
            <Button
              variant='outline'
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => decide(kind, row.original.id, 'Rejected')}
            >
              Reject
            </Button>
          </span>
        ) : (
          <span className='text-neutral-1000'>—</span>
        ),
    },
  ]
}

function LearningRequestsSection({ store }: LearningTeamTabProps) {
  const [status, setStatus] = useState(ALL)
  const [refreshKey, setRefreshKey] = useState(0)

  const sponsorshipColumns = useMemo(
    () => buildRequestColumns('sponsorship', store.decideRequest),
    [store.decideRequest]
  )
  const reimbursementColumns = useMemo(
    () => buildRequestColumns('reimbursement', store.decideRequest),
    [store.decideRequest]
  )

  const filteredSponsorships = useMemo(
    () =>
      status === ALL
        ? store.sponsorships
        : store.sponsorships.filter((r) => r.status === status),
    [store.sponsorships, status]
  )
  const filteredReimbursements = useMemo(
    () =>
      status === ALL
        ? store.reimbursements
        : store.reimbursements.filter((r) => r.status === status),
    [store.reimbursements, status]
  )

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <FilterSelect
          value={status}
          onChange={setStatus}
          allLabel='All statuses'
          options={TEAM_REQUEST_STATUSES}
          width='w-[200px]'
        />
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={() => setStatus(ALL)}
        >
          Reset
        </Button>
        <span className='ml-auto'>
          <RefreshButton
            onRefresh={() => {
              setRefreshKey((k) => k + 1)
              store.refresh('Learning requests')
            }}
          />
        </span>
      </div>

      <h3 className='text-paragraph-sm mb-2 font-medium'>
        Certification Sponsorship Requests
      </h3>
      <DataTable
        key={`spon-${refreshKey}`}
        columns={sponsorshipColumns}
        data={filteredSponsorships}
        variant='no-status'
      />

      <h3 className='text-paragraph-sm mt-4 mb-2 font-medium'>
        Certification Reimbursement Requests
      </h3>
      <DataTable
        key={`reim-${refreshKey}`}
        columns={reimbursementColumns}
        data={filteredReimbursements}
        variant='no-status'
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Learning Program catalog (LP-01..05)                                */
/* ------------------------------------------------------------------ */

const programSchema = z.object({
  title: z.string().min(5, 'Give the program a descriptive title'),
  programType: z.enum(PROGRAM_TYPES),
  description: z.string().min(10, 'Describe what the program covers'),
})

type ProgramValues = z.infer<typeof programSchema>

function CatalogSection({ store }: LearningTeamTabProps) {
  const [typeFilter, setTypeFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [addOpen, setAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const form = useForm<ProgramValues>({
    resolver: zodResolver(programSchema),
    defaultValues: { title: '', programType: 'Classroom', description: '' },
  })

  useEffect(() => {
    if (addOpen) form.reset()
  }, [addOpen, form])

  const columns = useMemo<ColumnDef<CatalogProgram>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'programType', header: 'Program type' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  )

  const filtered = useMemo(
    () =>
      store.catalog.filter((p) => {
        if (typeFilter !== ALL && p.programType !== typeFilter) return false
        if (statusFilter !== ALL && p.status !== statusFilter) return false
        return true
      }),
    [store.catalog, typeFilter, statusFilter]
  )

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          allLabel='All program types'
          options={PROGRAM_TYPES}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel='All statuses'
          options={CATALOG_STATUSES}
          width='w-[200px]'
        />
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={() => {
            setTypeFilter(ALL)
            setStatusFilter(ALL)
          }}
        >
          Reset
        </Button>
        <span className='ml-auto flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => {
              setRefreshKey((k) => k + 1)
              store.refresh('Learning programs')
            }}
          />
          <Button
            variant='red'
            onClick={() => setAddOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add Learning Program
          </Button>
        </span>
      </div>

      <DataTable
        key={refreshKey}
        columns={columns}
        data={filtered}
        variant='no-status'
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>Add learning program</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                store.addCatalogProgram(values)
                setAddOpen(false)
              })}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Effective code review practices'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='programType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROGRAM_TYPES.map((t) => (
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
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='What the program covers and who it is for'
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
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Add program</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Training Mass Approval (TMA-01..04)                                 */
/* ------------------------------------------------------------------ */

function MassApprovalSection({ store }: LearningTeamTabProps) {
  const [titleFilter, setTitleFilter] = useState(ALL)
  const [selected, setSelected] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const trainingTitles = useMemo(
    () => [...new Set(store.massApprovals.map((r) => r.class))],
    [store.massApprovals]
  )

  const filtered = useMemo(
    () =>
      titleFilter === ALL
        ? store.massApprovals
        : store.massApprovals.filter((r) => r.class === titleFilter),
    [store.massApprovals, titleFilter]
  )

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.includes(r.id))

  const columns = useMemo<ColumnDef<MassApprovalRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            aria-label='Select all'
            checked={allSelected}
            onCheckedChange={(next) =>
              setSelected(next === true ? filtered.map((r) => r.id) : [])
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.employee}`}
            checked={selected.includes(row.original.id)}
            onCheckedChange={(next) =>
              setSelected((prev) =>
                next === true
                  ? [...prev, row.original.id]
                  : prev.filter((id) => id !== row.original.id)
              )
            }
          />
        ),
      },
      { accessorKey: 'employee', header: 'Employee' },
      { accessorKey: 'class', header: 'Class' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'position', header: 'Position' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'schedule', header: 'Schedule' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [selected, allSelected, filtered]
  )

  return (
    <div>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <FilterSelect
          value={titleFilter}
          onChange={(next) => {
            setTitleFilter(next)
            setSelected([])
          }}
          allLabel='All trainings'
          options={trainingTitles}
          width='w-[260px]'
        />
        <Button
          variant='outline'
          className='h-8 rounded-[6px] px-3'
          onClick={() => {
            setTitleFilter(ALL)
            setSelected([])
          }}
        >
          Reset
        </Button>
        <span className='ml-auto flex items-center gap-2'>
          <RefreshButton
            onRefresh={() => {
              setRefreshKey((k) => k + 1)
              store.refresh('Pending training approvals')
            }}
          />
          <Button
            disabled={selected.length === 0}
            className='h-8 rounded-[6px] px-3'
            onClick={() => {
              store.approveEnrollments(selected)
              setSelected([])
            }}
          >
            Approve selected ({selected.length})
          </Button>
        </span>
      </div>
      <DataTable
        key={refreshKey}
        columns={columns}
        data={filtered}
        variant='no-status'
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Surface                                                             */
/* ------------------------------------------------------------------ */

/**
 * Manager / HR-admin Learning Management surface: employee certifications,
 * enrollment program, learning requests, program catalog and training
 * mass approval (EC-01..06, EEP-01..05, ELR-01..05, LP-01..05, TMA-01..04).
 */
export function LearningTeamTab({ store }: LearningTeamTabProps) {
  const summary = useMemo(
    () => [
      {
        label: 'Certifications pending',
        value: store.employeeCertifications.filter(
          (c) => c.status === 'Pending'
        ).length,
      },
      {
        label: 'Enrollments pending with me',
        value: store.enrollments.filter((e) => e.status === 'Pending with me')
          .length,
      },
      {
        label: 'Requests pending with me',
        value:
          store.sponsorships.filter((r) => r.status === 'Pending with me')
            .length +
          store.reimbursements.filter((r) => r.status === 'Pending with me')
            .length,
      },
      {
        label: 'Approvals awaiting action',
        value: store.massApprovals.length,
      },
    ],
    [
      store.employeeCertifications,
      store.enrollments,
      store.sponsorships,
      store.reimbursements,
      store.massApprovals,
    ]
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Team Learning Summary' items={summary} />

      <Tabs defaultValue='certifications' className='w-full'>
        <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
          <TabsTrigger variant='primary' value='certifications'>
            Employee Certifications
          </TabsTrigger>
          <TabsTrigger variant='primary' value='enrollment'>
            Enrollment Program
          </TabsTrigger>
          <TabsTrigger variant='primary' value='requests'>
            Learning Requests
          </TabsTrigger>
          <TabsTrigger variant='primary' value='catalog'>
            Learning Program
          </TabsTrigger>
          <TabsTrigger variant='primary' value='mass-approval'>
            Mass Approval
          </TabsTrigger>
        </TabsList>

        <TabsContent value='certifications'>
          <EmployeeCertificationsSection store={store} />
        </TabsContent>
        <TabsContent value='enrollment'>
          <EnrollmentSection store={store} />
        </TabsContent>
        <TabsContent value='requests'>
          <LearningRequestsSection store={store} />
        </TabsContent>
        <TabsContent value='catalog'>
          <CatalogSection store={store} />
        </TabsContent>
        <TabsContent value='mass-approval'>
          <MassApprovalSection store={store} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
