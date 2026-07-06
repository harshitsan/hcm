import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowsClockwise, Plus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  LEARNING_STATUSES,
  LEARNING_TYPES,
  SPONSORSHIP_MODES,
  TRAINING_PROGRAM_STATUSES,
  type Certification,
  type LearningRequest,
} from '../data/learning'
import { type LearningStore } from '../hooks/use-learning'
import { StatusBadge } from './status-badge'
import { FilterBar } from './shared'
import {
  applyFilter,
  EMPTY_FILTER,
  formatDate,
  type PeriodStatusFilter,
} from './utils'

const requestSchema = z.object({
  program: z.string().min(5, 'Name the program or certification'),
  learningType: z.enum(LEARNING_TYPES),
  sponsorship: z.enum(SPONSORSHIP_MODES),
})

type RequestValues = z.infer<typeof requestSchema>

interface LearningTabProps {
  store: LearningStore
}

/** Learning management: requests (ESS-29), programs & certifications (ESS-30). */
export function LearningTab({ store }: LearningTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [filter, setFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [typeFilter, setTypeFilter] = useState('All')
  const [programFilter, setProgramFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [certRefreshKey, setCertRefreshKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      program: '',
      learningType: 'Training',
      sponsorship: 'Company sponsored',
    },
  })

  useEffect(() => {
    if (overlayOpen) form.reset()
  }, [overlayOpen, form])

  const requestColumns = useMemo<ColumnDef<LearningRequest>[]>(
    () => [
      { accessorKey: 'program', header: 'Program' },
      { accessorKey: 'learningType', header: 'Learning type' },
      { accessorKey: 'sponsorship', header: 'Sponsorship' },
      {
        accessorKey: 'raisedOn',
        header: 'Raised on',
        cell: ({ row }) => formatDate(row.original.raisedOn),
      },
      { accessorKey: 'result', header: 'Result' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) => {
          const r = row.original
          if (!isEmployee) return <span className='text-neutral-1000'>—</span>
          if (r.task) {
            return (
              <Button
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.completeTask(r.id)}
              >
                {r.task}
              </Button>
            )
          }
          if (r.status === 'Requested' || r.status === 'Pending approval') {
            return (
              <Button
                variant='outline'
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.cancelRequest(r.id)}
              >
                Cancel
              </Button>
            )
          }
          return <span className='text-neutral-1000'>—</span>
        },
      },
    ],
    [store, isEmployee]
  )

  const certColumns = useMemo<ColumnDef<Certification>[]>(
    () => [
      { accessorKey: 'name', header: 'Certification' },
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
        header: 'Completed on',
        cell: ({ row }) => formatDate(row.original.completedOn),
      },
      {
        accessorKey: 'validTill',
        header: 'Valid till',
        cell: ({ row }) => {
          const validTill = row.original.validTill
          if (!validTill) return '—'
          const expiringSoon =
            new Date(validTill).getTime() - Date.now() < 90 * 864e5
          return (
            <span className='flex items-center gap-2'>
              {formatDate(validTill)}
              {expiringSoon && row.original.status !== 'Expired' && (
                <Badge variant='overdue'>Renew soon</Badge>
              )}
            </span>
          )
        },
      },
    ],
    []
  )

  const filteredRequests = useMemo(() => {
    const base = applyFilter(
      store.requests,
      filter,
      (r) => r.raisedOn,
      (r) => r.status
    )
    return typeFilter === 'All'
      ? base
      : base.filter((r) => r.learningType === typeFilter)
  }, [store.requests, filter, typeFilter])

  /** Programs whose schedule window overlaps the From/To range (TP-02/03). */
  const filteredPrograms = useMemo(
    () =>
      store.programs.filter((p) => {
        if (programFilter.from && p.scheduleEnd < programFilter.from)
          return false
        if (programFilter.to && p.scheduleStart > programFilter.to)
          return false
        if (
          programFilter.status !== 'All' &&
          p.status !== programFilter.status
        )
          return false
        return true
      }),
    [store.programs, programFilter]
  )

  return (
    <Tabs defaultValue='requests' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='primary' value='requests'>
          My Learning Requests
        </TabsTrigger>
        <TabsTrigger variant='primary' value='programs'>
          My Training Programs
        </TabsTrigger>
        <TabsTrigger variant='primary' value='certifications'>
          My Certifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value='requests'>
        <FilterBar
          statuses={LEARNING_STATUSES}
          value={filter}
          onChange={setFilter}
        >
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='h-8 w-[170px] bg-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All learning types</SelectItem>
              {LEARNING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEmployee && (
            <span className='ml-auto'>
              <Button
                variant='red'
                onClick={() => setOverlayOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                Raise Learning Request
              </Button>
            </span>
          )}
        </FilterBar>
        <DataTable
          columns={requestColumns}
          data={filteredRequests}
          variant='no-status'
        />
      </TabsContent>

      <TabsContent value='programs'>
        <FilterBar
          statuses={TRAINING_PROGRAM_STATUSES}
          value={programFilter}
          onChange={setProgramFilter}
        />
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className='rounded-[6px] border border-gray-200 bg-white px-4 py-3'
            >
              <div className='flex items-center justify-between gap-2'>
                <h3 className='text-sm font-medium'>{program.title}</h3>
                <StatusBadge status={program.status} />
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                {program.description}
              </p>
              <p className='text-paragraph-sm mt-2 font-medium'>
                Schedule: {program.schedule}
              </p>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                {formatDate(program.scheduleStart)} –{' '}
                {formatDate(program.scheduleEnd)}
              </p>
              {isEmployee && program.task && (
                <Button
                  className='mt-2 h-6 rounded-[6px] px-2 text-xs'
                  onClick={() => store.completeProgramTask(program.id)}
                >
                  {program.task}
                </Button>
              )}
            </div>
          ))}
          {filteredPrograms.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 col-span-full rounded-[6px] border border-gray-200 bg-white px-4 py-6 text-center'>
              No training programs match the selected filters.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value='certifications'>
        <div className='mb-3 flex items-center justify-between'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Your certification records with validity
          </span>
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={() => {
              setCertRefreshKey((k) => k + 1)
              store.refreshCertifications()
            }}
          >
            <ArrowsClockwise size={13} weight='bold' />
            Refresh
          </Button>
        </div>
        <DataTable
          key={certRefreshKey}
          columns={certColumns}
          data={store.certifications}
          variant='no-status'
        />
      </TabsContent>

      <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Raise learning request</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                store.raiseRequest(values)
                setOverlayOpen(false)
              })}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='program'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program / certification</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. AWS Solutions Architect'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='learningType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEARNING_TYPES.map((t) => (
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
                name='sponsorship'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsorship / reimbursement</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPONSORSHIP_MODES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOverlayOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Raise request</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
