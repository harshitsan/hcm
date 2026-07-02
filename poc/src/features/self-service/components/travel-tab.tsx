import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  ADVANCE_STATUSES,
  EXPENSE_STATUSES,
  TRAVEL_STATUSES,
  type AdvanceExpense,
  type TravelRequest,
  type TripExpense,
} from '../data/travel'
import { type TravelStore } from '../hooks/use-travel'
import { StatusBadge } from './status-badge'
import { FilterBar, SummaryCards } from './shared'
import {
  applyFilter,
  EMPTY_FILTER,
  formatDate,
  formatInr,
  type PeriodStatusFilter,
} from './utils'
import {
  AdvanceOverlay,
  ExpenseOverlay,
  TravelRequestOverlay,
} from './travel-overlays'

interface TravelTabProps {
  store: TravelStore
}

/** Travel management: requests, actual expenses and advances (ESS-26..28). */
export function TravelTab({ store }: TravelTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [travelFilter, setTravelFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [expenseFilter, setExpenseFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [advanceFilter, setAdvanceFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)

  const [travelOpen, setTravelOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [advanceOpen, setAdvanceOpen] = useState(false)

  const travelColumns = useMemo<ColumnDef<TravelRequest>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'destination', header: 'Destination' },
      {
        accessorKey: 'fromDate',
        header: 'From',
        cell: ({ row }) => formatDate(row.original.fromDate),
      },
      {
        accessorKey: 'toDate',
        header: 'To',
        cell: ({ row }) => formatDate(row.original.toDate),
      },
      {
        accessorKey: 'requestedAdvance',
        header: 'Requested advance',
        cell: ({ row }) => formatInr(row.original.requestedAdvance),
      },
      {
        accessorKey: 'appliedOn',
        header: 'Applied on',
        cell: ({ row }) => formatDate(row.original.appliedOn),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) =>
          isEmployee && row.original.status === 'Initiated' ? (
            <Button
              variant='outline'
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.cancelTravel(row.original.id)}
            >
              Cancel request
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store, isEmployee]
  )

  const expenseColumns = useMemo<ColumnDef<TripExpense>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'addedOn',
        header: 'Added on',
        cell: ({ row }) => formatDate(row.original.addedOn),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatInr(row.original.amount),
      },
      { accessorKey: 'details', header: 'Details' },
      {
        accessorKey: 'status',
        header: 'Settlement status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) =>
          isEmployee && row.original.task ? (
            <Button
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.acknowledgeSettlement(row.original.id)}
            >
              {row.original.task}
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store, isEmployee]
  )

  const advanceColumns = useMemo<ColumnDef<AdvanceExpense>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'addedOn',
        header: 'Added on',
        cell: ({ row }) => formatDate(row.original.addedOn),
      },
      {
        accessorKey: 'requestedAdvance',
        header: 'Requested advance',
        cell: ({ row }) => formatInr(row.original.requestedAdvance),
      },
      {
        accessorKey: 'expenses',
        header: 'Expenses reconciled',
        cell: ({ row }) =>
          row.original.expenses > 0 ? (
            <span>
              {formatInr(row.original.expenses)}{' '}
              {row.original.expenses > row.original.requestedAdvance && (
                <Badge variant='overdue'>Over advance</Badge>
              )}
            </span>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'task',
        header: 'Task',
        cell: ({ row }) =>
          isEmployee && row.original.status === 'Pending Approval' ? (
            <Button
              variant='outline'
              className='h-6 rounded-[6px] px-2 text-xs'
              onClick={() => store.cancelAdvance(row.original.id)}
            >
              Cancel request
            </Button>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store, isEmployee]
  )

  const filteredTravel = useMemo(
    () =>
      applyFilter(
        store.travelRequests,
        travelFilter,
        (t) => t.fromDate,
        (t) => t.status
      ),
    [store.travelRequests, travelFilter]
  )
  const filteredExpenses = useMemo(
    () =>
      applyFilter(
        store.expenses,
        expenseFilter,
        (e) => e.addedOn,
        (e) => e.status
      ),
    [store.expenses, expenseFilter]
  )
  const filteredAdvances = useMemo(
    () =>
      applyFilter(
        store.advances,
        advanceFilter,
        (a) => a.addedOn,
        (a) => a.status
      ),
    [store.advances, advanceFilter]
  )

  const summary = useMemo(
    () => [
      { label: 'Travel requests', value: store.travelRequests.length },
      {
        label: 'Pending settlement',
        value: store.expenses.filter((e) => e.status !== 'Settled and Closed')
          .length,
      },
      {
        label: 'Advances approved',
        value: store.advances.filter((a) => a.status === 'Approved').length,
      },
      {
        label: 'Total expenses',
        value: formatInr(
          store.expenses.reduce((sum, e) => sum + e.amount, 0)
        ),
      },
    ],
    [store.travelRequests, store.expenses, store.advances]
  )

  const newButton = (label: string, onClick: () => void) =>
    isEmployee ? (
      <Button
        variant='red'
        onClick={onClick}
        className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
      >
        <Plus size={10} weight='bold' />
        {label}
      </Button>
    ) : null

  return (
    <div className='w-full'>
      <SummaryCards title='Travel & Expenses Summary' items={summary} />

      <Tabs defaultValue='requests' className='w-full'>
        <TabsList className='mb-3 bg-transparent p-0'>
          <TabsTrigger variant='primary' value='requests'>
            My Travel Requests
          </TabsTrigger>
          <TabsTrigger variant='primary' value='expenses'>
            My Expenses
          </TabsTrigger>
          <TabsTrigger variant='primary' value='advances'>
            My Advance Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value='requests'>
          <FilterBar
            statuses={TRAVEL_STATUSES}
            value={travelFilter}
            onChange={setTravelFilter}
          >
            <span className='ml-auto'>
              {newButton('Apply Travel Request', () => setTravelOpen(true))}
            </span>
          </FilterBar>
          <DataTable
            columns={travelColumns}
            data={filteredTravel}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='expenses'>
          <FilterBar
            statuses={EXPENSE_STATUSES}
            value={expenseFilter}
            onChange={setExpenseFilter}
          >
            <span className='ml-auto'>
              {newButton('Submit Expense', () => setExpenseOpen(true))}
            </span>
          </FilterBar>
          <DataTable
            columns={expenseColumns}
            data={filteredExpenses}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='advances'>
          <FilterBar
            statuses={ADVANCE_STATUSES}
            value={advanceFilter}
            onChange={setAdvanceFilter}
          >
            <span className='ml-auto'>
              {newButton('Raise Advance', () => setAdvanceOpen(true))}
            </span>
          </FilterBar>
          <DataTable
            columns={advanceColumns}
            data={filteredAdvances}
            variant='no-status'
          />
        </TabsContent>
      </Tabs>

      <TravelRequestOverlay
        open={travelOpen}
        onOpenChange={setTravelOpen}
        onSubmit={store.applyTravel}
      />
      <ExpenseOverlay
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSubmit={store.submitExpense}
      />
      <AdvanceOverlay
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        onSubmit={store.raiseAdvance}
      />
    </div>
  )
}
