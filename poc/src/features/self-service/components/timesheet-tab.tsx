import { useMemo, useState } from 'react'
import { Copy, PaperPlaneTilt, Plus, Trash } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TIMESHEET_STATUSES,
  timesheetTotal,
  WEEKDAY_LABELS,
} from '../data/timesheets'
import { type TimesheetStore } from '../hooks/use-timesheets'
import { StatusBadge } from './status-badge'
import { SummaryCards } from './shared'
import { formatDate } from './utils'
import { TimesheetEntryOverlay } from './timesheet-entry-overlay'

interface TimesheetTabProps {
  store: TimesheetStore
}

/**
 * My timesheet entry (ESS-24/25): pick a period, record entries against
 * client/project/task with per-weekday hours, classify productivity, copy
 * from an existing period and submit the sheet for approval.
 */
export function TimesheetTab({ store }: TimesheetTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [statusFilter, setStatusFilter] = useState('All')
  const [activeId, setActiveId] = useState(store.timesheets[0]?.id ?? '')
  const [overlayOpen, setOverlayOpen] = useState(false)

  const filtered = useMemo(
    () =>
      statusFilter === 'All'
        ? store.timesheets
        : store.timesheets.filter((ts) => ts.status === statusFilter),
    [store.timesheets, statusFilter]
  )

  const active = store.timesheets.find((ts) => ts.id === activeId) ?? null
  const editable = Boolean(
    active && active.status === 'Pending for submission' && isEmployee
  )

  const summary = useMemo(() => {
    const by = (status: string) =>
      store.timesheets.filter((ts) => ts.status === status).length
    return [
      { label: 'Timesheets', value: store.timesheets.length },
      { label: 'Pending for submission', value: by('Pending for submission') },
      { label: 'Submitted', value: by('Submitted') },
      { label: 'Approved', value: by('Approved') },
    ]
  }, [store.timesheets])

  return (
    <div className='w-full'>
      <SummaryCards title='Timesheets Summary' items={summary} />

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Select value={activeId} onValueChange={setActiveId}>
          <SelectTrigger className='h-8 w-[280px] bg-white'>
            <SelectValue placeholder='Select period' />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((ts) => (
              <SelectItem key={ts.id} value={ts.id}>
                {formatDate(ts.periodStart)} – {formatDate(ts.periodEnd)} ·{' '}
                {ts.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='h-8 w-[220px] bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All statuses</SelectItem>
            {TIMESHEET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {active && (
          <span className='text-paragraph-sm text-neutral-1000 ml-1'>
            Total recorded: {timesheetTotal(active)}h
          </span>
        )}

        <div className='ml-auto flex items-center gap-2'>
          {editable && active && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='h-7 gap-1 rounded-[6px] px-2'>
                    <Copy size={13} weight='bold' />
                    Copy from existing
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='min-w-[240px]'>
                  {store.timesheets
                    .filter((ts) => ts.id !== active.id)
                    .map((ts) => (
                      <DropdownMenuItem
                        key={ts.id}
                        onClick={() => store.copyFromExisting(active.id, ts.id)}
                      >
                        {formatDate(ts.periodStart)} – {formatDate(ts.periodEnd)}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant='outline'
                className='h-7 gap-1 rounded-[6px] px-2'
                onClick={() => store.submitTimesheet(active.id)}
              >
                <PaperPlaneTilt size={13} weight='bold' />
                Submit for approval
              </Button>
              <Button
                variant='red'
                onClick={() => setOverlayOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                Add Entry
              </Button>
            </>
          )}
        </div>
      </div>

      {active ? (
        <div className='overflow-x-auto rounded-md border bg-white'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Type of work</TableHead>
                <TableHead>Productivity</TableHead>
                {WEEKDAY_LABELS.map((d) => (
                  <TableHead key={d} className='text-center'>
                    {d}
                  </TableHead>
                ))}
                <TableHead>Total</TableHead>
                <TableHead>Comment</TableHead>
                {editable && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={editable ? 15 : 14}
                    className='text-neutral-1000 h-20 text-center'
                  >
                    No entries yet — add one or copy from an existing period.
                  </TableCell>
                </TableRow>
              ) : (
                active.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.client}</TableCell>
                    <TableCell>{entry.project}</TableCell>
                    <TableCell>{entry.task}</TableCell>
                    <TableCell>{entry.typeOfWork}</TableCell>
                    <TableCell>
                      {entry.productive ? (
                        <Badge variant='qualified'>Productive</Badge>
                      ) : (
                        <Badge variant='overdue'>
                          Non-productive · {entry.nonProductiveReason}
                        </Badge>
                      )}
                    </TableCell>
                    {entry.hours.map((h, idx) => (
                      <TableCell
                        key={`${entry.id}-${WEEKDAY_LABELS[idx]}`}
                        className='text-center'
                      >
                        {h || '—'}
                      </TableCell>
                    ))}
                    <TableCell className='font-medium'>
                      {entry.hours.reduce((a, b) => a + b, 0)}h
                    </TableCell>
                    <TableCell className='max-w-[180px] truncate'>
                      {entry.comment || '—'}
                    </TableCell>
                    {editable && (
                      <TableCell>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-6 w-6'
                          aria-label='Remove entry'
                          onClick={() => store.removeEntry(active.id, entry.id)}
                        >
                          <Trash size={13} weight='bold' />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className='text-paragraph-sm text-neutral-1000'>
          Select a timesheet period to view its entries.
        </p>
      )}

      {active && (
        <div className='mt-2 flex items-center gap-2'>
          <StatusBadge status={active.status} />
          <span className='text-paragraph-sm text-neutral-1000'>
            {active.status === 'Pending for submission'
              ? 'Complete your entries, then submit for approval.'
              : 'This period is locked — it has been routed to your manager.'}
          </span>
        </div>
      )}

      <TimesheetEntryOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        onSubmit={(draft) => {
          if (active) store.addEntry(active.id, draft)
        }}
      />
    </div>
  )
}
