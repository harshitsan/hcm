import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  INITIATION_STATUSES,
  RATING_STATUSES,
  type ReviewInitiation,
  type ReviewRating,
} from '../data/performance-review'
import { fmtDate } from '../data/shared'
import { type PerformanceReviewStore } from '../hooks/use-performance-review'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'
import { RefreshButton } from './orientation-widgets'

/* --------------------------- shared filter state -------------------------- */

interface PeriodFilters {
  from: string
  to: string
  status: string
}

const EMPTY_FILTERS: PeriodFilters = { from: '', to: '', status: 'all' }

function overlapsPeriod(
  fromKey: string,
  toKey: string,
  filters: PeriodFilters
): boolean {
  return (
    (filters.from === '' || toKey >= filters.from) &&
    (filters.to === '' || fromKey <= filters.to)
  )
}

/** Review-period From/To calendars + status filter + Search / Reset. */
function PeriodFilterBar({
  filters,
  onChange,
  statuses,
  matchCount,
  label,
  children,
}: {
  filters: PeriodFilters
  onChange: (next: PeriodFilters) => void
  statuses: readonly string[]
  matchCount: number
  label: string
  children?: React.ReactNode
}) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      <Input
        type='date'
        value={filters.from}
        onChange={(e) => onChange({ ...filters, from: e.target.value })}
        className='h-7 w-[150px]'
        aria-label='Review period from'
      />
      <Input
        type='date'
        value={filters.to}
        onChange={(e) => onChange({ ...filters, to: e.target.value })}
        className='h-7 w-[150px]'
        aria-label='Review period to'
      />
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v })}
      >
        <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size='sm'
        onClick={() => toast.info(`${matchCount} ${label} match the current filters`)}
      >
        Search
      </Button>
      <Button
        size='sm'
        variant='outline'
        onClick={() => {
          onChange(EMPTY_FILTERS)
          toast.info('Filters cleared')
        }}
      >
        Reset
      </Button>
      {children}
    </div>
  )
}

/* --------------------------------- columns -------------------------------- */

const initiationColumns: ColumnDef<ReviewInitiation>[] = [
  {
    accessorKey: 'reviewPeriodFrom',
    header: ({ column }) => (
      <SortHeader column={column} label='Review period from' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.reviewPeriodFrom)}</span>
    ),
  },
  {
    accessorKey: 'reviewPeriodTo',
    header: ({ column }) => <SortHeader column={column} label='Review period to' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.reviewPeriodTo)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'task',
    header: ({ column }) => <SortHeader column={column} label='Task' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.task}</span>,
  },
]

const ratingColumns: ColumnDef<ReviewRating>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <span className='text-neutral-1600 font-medium'>
        {row.original.employeeName}
      </span>
    ),
  },
  {
    accessorKey: 'reviewPeriodFrom',
    header: ({ column }) => (
      <SortHeader column={column} label='Review period from' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.reviewPeriodFrom)}</span>
    ),
  },
  {
    accessorKey: 'reviewPeriodTo',
    header: ({ column }) => <SortHeader column={column} label='Review period to' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.reviewPeriodTo)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'task',
    header: ({ column }) => <SortHeader column={column} label='Task' />,
    cell: ({ row }) => (
      <span className='text-sm'>
        {row.original.task}
        {row.original.rating !== null && ` · ${row.original.rating}/5`}
      </span>
    ),
  },
]

/* ---------------------------------- tab ----------------------------------- */

interface PerformanceReviewTabProps {
  store: PerformanceReviewStore
}

/**
 * Performance Review — manager grids for review-cycle initiation and employee
 * review ratings, each with review-period + status filters, search / reset
 * and refresh.
 */
export function PerformanceReviewTab({ store }: PerformanceReviewTabProps) {
  const [initFilters, setInitFilters] = useState(EMPTY_FILTERS)
  const [ratingFilters, setRatingFilters] = useState(EMPTY_FILTERS)
  const [ratingDialog, setRatingDialog] = useState<ReviewRating | null>(null)
  const [ratingValue, setRatingValue] = useState('4')

  const initiations = useMemo(
    () =>
      store.initiations.filter(
        (c) =>
          overlapsPeriod(c.reviewPeriodFrom, c.reviewPeriodTo, initFilters) &&
          (initFilters.status === 'all' || c.status === initFilters.status)
      ),
    [initFilters, store.initiations]
  )
  const ratings = useMemo(
    () =>
      store.ratings.filter(
        (r) =>
          overlapsPeriod(r.reviewPeriodFrom, r.reviewPeriodTo, ratingFilters) &&
          (ratingFilters.status === 'all' || r.status === ratingFilters.status)
      ),
    [ratingFilters, store.ratings]
  )

  if (!store.moduleEnabled) {
    return (
      <p className='text-neutral-1000 rounded-[6px] border border-gray-200 bg-white p-4 text-sm'>
        The Performance Review module is disabled. Enable it under Admin →
        Performance Review to initiate cycles and submit ratings.
      </p>
    )
  }

  return (
    <div className='w-full'>
      <Tabs defaultValue='initiation' className='w-full'>
        <TabsList className='mb-2'>
          <TabsTrigger variant='ghost' value='initiation'>
            Review Initiation
          </TabsTrigger>
          <TabsTrigger variant='ghost' value='ratings'>
            Review Ratings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='initiation'>
          <PeriodFilterBar
            filters={initFilters}
            onChange={setInitFilters}
            statuses={INITIATION_STATUSES}
            matchCount={initiations.length}
            label='initiation(s)'
          >
            <RefreshButton
              onRefresh={() => store.refresh('initiations', 'Review initiations')}
              refreshedAt={store.refreshedAt.initiations}
            />
          </PeriodFilterBar>
          <DataTable
            columns={initiationColumns}
            data={initiations}
            variant='no-status'
            onRowClick={(row: ReviewInitiation) => {
              if (row.status === 'Pending Initiation') {
                store.initiateCycle(row)
              } else {
                toast.info(`Cycle is ${row.status.toLowerCase()} — ${row.task}`)
              }
            }}
          />
          <p className='text-neutral-1000 mt-2 text-xs'>
            Click a “Pending Initiation” row to initiate that review cycle.
          </p>
        </TabsContent>

        <TabsContent value='ratings'>
          <PeriodFilterBar
            filters={ratingFilters}
            onChange={setRatingFilters}
            statuses={RATING_STATUSES}
            matchCount={ratings.length}
            label='rating record(s)'
          >
            <RefreshButton
              onRefresh={() => store.refresh('ratings', 'Review ratings')}
              refreshedAt={store.refreshedAt.ratings}
            />
          </PeriodFilterBar>
          <DataTable
            columns={ratingColumns}
            data={ratings}
            variant='no-status'
            onRowClick={(row: ReviewRating) => {
              if (row.status === 'Pending Submission') {
                setRatingValue('4')
                setRatingDialog(row)
              }
            }}
          />
          <p className='text-neutral-1000 mt-2 text-xs'>
            Click a “Pending Submission” row to submit the manager rating.
          </p>
        </TabsContent>
      </Tabs>

      {/* Submit manager rating */}
      <Dialog
        open={ratingDialog !== null}
        onOpenChange={(open) => {
          if (!open) setRatingDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Review rating · {ratingDialog?.employeeName}
            </DialogTitle>
          </DialogHeader>
          <div className='flex items-center gap-3 text-sm'>
            <span>Overall rating</span>
            <Select value={ratingValue} onValueChange={setRatingValue}>
              <SelectTrigger variant='secondary' className='h-7 w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / 5
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRatingDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (ratingDialog)
                  store.submitRating(ratingDialog, Number(ratingValue))
                setRatingDialog(null)
              }}
            >
              Submit rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
