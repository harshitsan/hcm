import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
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
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  TEAM_ADVANCE_STATUSES,
  TEAM_EXPENSE_STATUSES,
  TEAM_TRAVEL_STATUSES,
  TRAVEL_HANDLERS,
  TRIP_STATUSES,
  type TeamAdvance,
  type TeamExpense,
  type TeamTravelRequest,
  type TripDetail,
} from '../data/travel-team'
import { type TravelTeamStore } from '../hooks/use-travel-team'
import { SelectField } from './form-fields'
import { StatusBadge } from './status-badge'
import { SummaryCards } from './shared'
import {
  applyTeamFilter,
  EMPTY_TEAM_FILTER,
  TeamFilterBar,
  type TeamFilter,
} from './travel-team-filter'
import { formatDate, formatInr } from './utils'

interface TravelTeamTabProps {
  store: TravelTeamStore
}

/** Employee name with an inactive marker for filtered review (EAE/EE/ETR/TD-02). */
function EmployeeCell({ name, state }: { name: string; state: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      {name}
      {state === 'Inactive' && <Badge variant='badge_inactive'>Inactive</Badge>}
    </span>
  )
}

const assignSchema = z.object({
  handler: z.string().min(1, 'Select a handler'),
})

/** Route a travel request to the appropriate handler (ETR-06). */
function AssignTravelDialog({
  request,
  onOpenChange,
  onAssign,
}: {
  request: TeamTravelRequest | null
  onOpenChange: (open: boolean) => void
  onAssign: (id: string, handler: string) => void
}) {
  const form = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { handler: TRAVEL_HANDLERS[0] },
  })

  useEffect(() => {
    if (request)
      form.reset({ handler: request.assignedTo ?? TRAVEL_HANDLERS[0] })
  }, [request, form])

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Assign travel request</DialogTitle>
        </DialogHeader>
        {request && (
          <p className='text-paragraph-sm text-neutral-1000'>
            {request.title} — {request.employee} ({request.tripDetails})
          </p>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              if (request) onAssign(request.id, values.handler)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <SelectField
              control={form.control}
              name='handler'
              label='Route to handler'
              options={TRAVEL_HANDLERS}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Assign</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Manager / Travel Coordinator surface for Travel Management: employee
 * travel requests, actual expenses, advance expenses and trip details
 * (EAE-01..06, EE-01..07, ETR-01..07, TD-01..07).
 */
export function TravelTeamTab({ store }: TravelTeamTabProps) {
  const [travelFilter, setTravelFilter] =
    useState<TeamFilter>(EMPTY_TEAM_FILTER)
  const [expenseFilter, setExpenseFilter] =
    useState<TeamFilter>(EMPTY_TEAM_FILTER)
  const [advanceFilter, setAdvanceFilter] =
    useState<TeamFilter>(EMPTY_TEAM_FILTER)
  const [tripFilter, setTripFilter] = useState<TeamFilter>(EMPTY_TEAM_FILTER)

  const [assigning, setAssigning] = useState<TeamTravelRequest | null>(null)

  const travelColumns = useMemo<ColumnDef<TeamTravelRequest>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'tripDetails', header: 'Trip details' },
      {
        accessorKey: 'requestedAdvance',
        header: 'Requested advance',
        cell: ({ row }) => formatInr(row.original.requestedAdvance),
      },
      {
        accessorKey: 'assignedTo',
        header: 'Assigned to',
        cell: ({ row }) => row.original.assignedTo ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          ['Pending Approval', 'Initiated', 'Approved'].includes(
            row.original.status
          ) ? (
            <Button
              variant='outline'
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => setAssigning(row.original)}
            >
              {row.original.assignedTo ? 'Reassign' : 'Assign'}
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    []
  )

  const expenseColumns = useMemo<ColumnDef<TeamExpense>[]>(
    () => [
      {
        accessorKey: 'addedOn',
        header: 'Added date',
        cell: ({ row }) => formatDate(row.original.addedOn),
      },
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'expenses', header: 'Expenses' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatInr(row.original.amount),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  )

  const advanceColumns = useMemo<ColumnDef<TeamAdvance>[]>(
    () => [
      {
        accessorKey: 'addedOn',
        header: 'Added date',
        cell: ({ row }) => formatDate(row.original.addedOn),
      },
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      {
        accessorKey: 'additionalExpenses',
        header: 'Additional expenses',
        cell: ({ row }) =>
          row.original.additionalExpenses > 0
            ? formatInr(row.original.additionalExpenses)
            : '—',
      },
      {
        accessorKey: 'requestedAdvance',
        header: 'Requested advance',
        cell: ({ row }) => formatInr(row.original.requestedAdvance),
      },
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
                onClick={() => store.decideAdvance(row.original.id, 'Approved')}
              >
                Approve
              </Button>
              <Button
                variant='outline'
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.decideAdvance(row.original.id, 'Rejected')}
              >
                Reject
              </Button>
            </span>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const tripColumns = useMemo<ColumnDef<TripDetail>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.name}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'departureCity', header: 'Departure city' },
      { accessorKey: 'destinationCity', header: 'Destination city' },
      {
        accessorKey: 'departureDate',
        header: 'Departure date',
        cell: ({ row }) => formatDate(row.original.departureDate),
      },
      { accessorKey: 'mode', header: 'Mode' },
      { accessorKey: 'vendor', header: 'Vendor' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status === 'Pending for Vendor Confirmation' ||
          row.original.status === 'Travel Coordinator Process Initiated' ? (
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.confirmTrip(row.original.id)}
            >
              Confirm with vendor
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const filteredTravel = useMemo(
    () =>
      applyTeamFilter(store.teamTravelRequests, travelFilter, {
        date: (t) => t.fromDate,
        status: (t) => t.status,
        department: (t) => t.department,
        employeeState: (t) => t.employeeState,
        amount: (t) => t.requestedAdvance,
      }),
    [store.teamTravelRequests, travelFilter]
  )
  const filteredExpenses = useMemo(
    () =>
      applyTeamFilter(store.teamExpenses, expenseFilter, {
        date: (e) => e.addedOn,
        status: (e) => e.status,
        department: (e) => e.department,
        employeeState: (e) => e.employeeState,
        amount: (e) => e.amount,
      }),
    [store.teamExpenses, expenseFilter]
  )
  const filteredAdvances = useMemo(
    () =>
      applyTeamFilter(store.teamAdvances, advanceFilter, {
        date: (a) => a.addedOn,
        status: (a) => a.status,
        department: (a) => a.department,
        employeeState: (a) => a.employeeState,
        amount: (a) => a.requestedAdvance,
      }),
    [store.teamAdvances, advanceFilter]
  )
  const filteredTrips = useMemo(
    () =>
      applyTeamFilter(store.tripDetails, tripFilter, {
        date: (t) => t.departureDate,
        status: (t) => t.status,
        department: (t) => t.department,
        employeeState: (t) => t.employeeState,
      }),
    [store.tripDetails, tripFilter]
  )

  const summary = useMemo(
    () => [
      {
        label: 'Requests pending approval',
        value: store.teamTravelRequests.filter(
          (t) => t.status === 'Pending Approval'
        ).length,
      },
      {
        label: 'Advances pending with me',
        value: store.teamAdvances.filter((a) => a.status === 'Pending with me')
          .length,
      },
      {
        label: 'Trips awaiting vendor',
        value: store.tripDetails.filter(
          (t) => t.status === 'Pending for Vendor Confirmation'
        ).length,
      },
      {
        label: 'Team expenses',
        value: formatInr(
          store.teamExpenses.reduce((sum, e) => sum + e.amount, 0)
        ),
      },
    ],
    [store.teamTravelRequests, store.teamAdvances, store.tripDetails, store.teamExpenses]
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Team Travel Summary' items={summary} />

      <Tabs defaultValue='travel-requests' className='w-full'>
        <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
          <TabsTrigger variant='primary' value='travel-requests'>
            Employee Travel Requests
          </TabsTrigger>
          <TabsTrigger variant='primary' value='expenses'>
            Employee Expenses
          </TabsTrigger>
          <TabsTrigger variant='primary' value='advances'>
            Employee Advance Expenses
          </TabsTrigger>
          <TabsTrigger variant='primary' value='trips'>
            Trip Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value='travel-requests'>
          <TeamFilterBar
            statuses={TEAM_TRAVEL_STATUSES}
            value={travelFilter}
            onChange={setTravelFilter}
          />
          <DataTable
            columns={travelColumns}
            data={filteredTravel}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='expenses'>
          <TeamFilterBar
            statuses={TEAM_EXPENSE_STATUSES}
            value={expenseFilter}
            onChange={setExpenseFilter}
            showAmount
          />
          <DataTable
            columns={expenseColumns}
            data={filteredExpenses}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='advances'>
          <TeamFilterBar
            statuses={TEAM_ADVANCE_STATUSES}
            value={advanceFilter}
            onChange={setAdvanceFilter}
          />
          <DataTable
            columns={advanceColumns}
            data={filteredAdvances}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='trips'>
          <TeamFilterBar
            statuses={TRIP_STATUSES}
            value={tripFilter}
            onChange={setTripFilter}
          />
          <DataTable
            columns={tripColumns}
            data={filteredTrips}
            variant='no-status'
          />
        </TabsContent>
      </Tabs>

      <AssignTravelDialog
        request={assigning}
        onOpenChange={(open) => {
          if (!open) setAssigning(null)
        }}
        onAssign={store.assignTravelRequest}
      />
    </div>
  )
}
