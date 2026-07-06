import { useState } from 'react'
import { ArrowsClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fmtDate, fmtHours } from '../data/shared'
import {
  refreshedTimesheetExtras,
  seedTimesheet,
  type TimesheetEntry,
  type TimesheetStatus,
} from '../data/tracking'
import { SummaryCards } from './summary-cards'

const STATUS_BADGE: Record<
  TimesheetStatus,
  { label: string; variant: 'pending' | 'open' | 'badge_active' | 'dropped' }
> = {
  draft: { label: 'Draft', variant: 'pending' },
  submitted: { label: 'Submitted', variant: 'open' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
}

/**
 * My Timesheet Details (TMD-06): the employee's saved timesheet entries with a
 * Refresh action that pulls the latest "server" entries and status changes
 * into the otherwise static list.
 */
export function MyTimesheetTab() {
  const [entries, setEntries] = useState<TimesheetEntry[]>(seedTimesheet)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)
  const [synced, setSynced] = useState(false)

  const refresh = () => {
    const at = new Date().toLocaleTimeString('en-GB')
    setRefreshedAt(at)
    if (!synced) {
      setSynced(true)
      setEntries((prev) => [
        ...refreshedTimesheetExtras,
        // Approvals that happened since the list was loaded.
        ...prev.map((e) =>
          e.status === 'submitted' ? { ...e, status: 'approved' as const } : e
        ),
      ])
      toast.success(
        `Timesheet refreshed — ${refreshedTimesheetExtras.length} new entries and latest approval statuses loaded`
      )
    } else {
      toast.success('Timesheet refreshed — already up to date')
    }
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const billableHours = entries
    .filter((e) => e.billable)
    .reduce((s, e) => s + e.hours, 0)
  const pending = entries.filter((e) => e.status === 'submitted').length
  const drafts = entries.filter((e) => e.status === 'draft').length

  return (
    <div className='w-full'>
      <SummaryCards
        title='My Timesheet Details — current period'
        items={[
          { label: 'Hours logged', value: fmtHours(totalHours) },
          { label: 'Billable hours', value: fmtHours(billableHours) },
          { label: 'Awaiting approval', value: pending },
          { label: 'Drafts', value: drafts },
        ]}
      />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Saved Entries ({entries.length})
          </h2>
          {refreshedAt && (
            <span className='text-neutral-1000 text-xs'>Last refreshed {refreshedAt}</span>
          )}
        </div>
        <Button variant='outline' className='h-7 gap-1' onClick={refresh}>
          <ArrowsClockwise size={14} weight='bold' />
          Refresh
        </Button>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Date</th>
              <th className='px-2 font-medium'>Project</th>
              <th className='px-2 font-medium'>Task</th>
              <th className='px-2 text-right font-medium'>Hours</th>
              <th className='px-2 font-medium'>Billable</th>
              <th className='px-2 font-medium'>Last updated</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{fmtDate(e.date)}</td>
                <td className='px-2'>{e.project}</td>
                <td className='text-neutral-1000 px-2'>{e.task}</td>
                <td className='px-2 text-right'>{fmtHours(e.hours)}</td>
                <td className='px-2'>{e.billable ? 'Yes' : 'No'}</td>
                <td className='text-neutral-1000 px-2 text-xs'>{e.lastUpdated}</td>
                <td className='px-2'>
                  <Badge variant={STATUS_BADGE[e.status].variant}>
                    {STATUS_BADGE[e.status].label}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
