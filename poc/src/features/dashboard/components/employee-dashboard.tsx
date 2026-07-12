import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Send,
  Umbrella,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
// Read-only imports of other modules' seed data — the same records the
// self-service pages of those modules render.
import {
  seedEmployees,
  SELF_EMPLOYEE_ID,
} from '@/features/employees/data/employees'
import { remaining, seedBalances } from '@/features/leave/data/balances'
import { seedHolidayCalendars } from '@/features/leave/data/holidays'
import { seedLeaveTypes } from '@/features/leave/data/leave-types'
import { seedRequests, type RequestStatus } from '@/features/leave/data/requests'
import { CURRENT_EMPLOYEE_ID as LEAVE_SELF_ID } from '@/features/leave/data/shared'
import { seedAssignments } from '@/features/policy-distribution/data/distributions'
import { CURRENT_EMPLOYEE_ID as POLICY_SELF_ID } from '@/features/policy-distribution/data/employees'
import { DASHBOARD_TODAY } from '../data/role-dashboards'
import { KpiCard, type DrillKpi } from './kpi-card'
import { PendingActionsPanel } from './pending-actions'

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

const REQUEST_BADGE: Partial<
  Record<RequestStatus, React.ComponentProps<typeof Badge>['variant']>
> = {
  pending: 'pending',
  approved: 'completed',
  rejected: 'dropped',
  'needs-clarification': 'overdue',
  withdrawn: 'badge_inactive',
  cancelled: 'badge_inactive',
  'cancellation-requested': 'pending',
}

const REQUEST_LABEL: Partial<Record<RequestStatus, string>> = {
  pending: 'In approval',
  approved: 'Approved',
  rejected: 'Rejected',
  'needs-clarification': 'Needs your reply',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
  'cancellation-requested': 'Cancellation requested',
}

/**
 * Employee (User) landing dashboard (R2) — a personal view: leave balances,
 * pending acknowledgments, upcoming holidays, request status and team info.
 * Deliberately contains no compensation data (comp-dark, per PRD).
 */
export function EmployeeDashboard() {
  const self = seedEmployees.find((e) => e.id === SELF_EMPLOYEE_ID)

  const typeNames = new Map(seedLeaveTypes.map((t) => [t.id, t.name]))
  const myBalances = seedBalances
    .filter((b) => b.employeeId === LEAVE_SELF_ID)
    .map((b) => ({
      ...b,
      typeName: typeNames.get(b.typeId) ?? b.typeId,
      left: remaining(b),
    }))
  const totalLeft = myBalances.reduce((n, b) => n + Math.max(0, b.left), 0)

  const myAcks = seedAssignments.filter(
    (a) =>
      a.employeeId === POLICY_SELF_ID &&
      (a.status === 'Pending' || a.status === 'Overdue')
  )

  const myRequests = [...seedRequests]
    .filter((r) => r.employeeId === LEAVE_SELF_ID)
    .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn))
    .slice(0, 4)
  const inApproval = myRequests.filter(
    (r) => r.status === 'pending' || r.status === 'needs-clarification'
  ).length

  const upcomingHolidays = seedHolidayCalendars
    .filter((c) => c.status === 'published')
    .flatMap((c) => c.holidays)
    .filter((h) => h.kind !== 'weekly-off' && h.date >= DASHBOARD_TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const team = self
    ? seedEmployees.filter(
        (e) =>
          e.id !== self.id &&
          e.lifecycleStage !== 'Exited' &&
          e.departments.some((d) => self.departments.includes(d))
      )
    : []

  const kpis: DrillKpi[] = [
    {
      label: 'Leave available',
      value: `${totalLeft}`,
      hint: 'Across all leave types',
      icon: Umbrella,
      to: '/leave',
    },
    {
      label: 'Acknowledgments due',
      value: String(myAcks.length),
      hint: 'Policies waiting on you',
      icon: ClipboardCheck,
      iconClass: myAcks.length
        ? 'bg-red-1300 text-red-1400'
        : 'bg-green-1200 text-green-1300',
      to: '/policy-distribution',
    },
    {
      label: 'Requests in approval',
      value: String(inApproval),
      hint: 'Waiting on your approvers',
      icon: Send,
      to: '/leave',
    },
    {
      label: 'Next holiday',
      value: upcomingHolidays[0] ? fmtDate(upcomingHolidays[0].date) : '—',
      hint: upcomingHolidays[0]?.name ?? 'No holidays coming up',
      icon: CalendarDays,
      iconClass: 'bg-green-1200 text-green-1300',
      to: '/leave',
    },
  ]

  return (
    <section className='flex flex-col gap-3'>
      <div>
        <h3 className='text-paragraph-md text-neutral-1200 font-medium'>
          Your day at a glance
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
          {self ? `${self.name} · ${self.position}` : 'Signed-in employee'} ·
          click any card to open the module
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-3'>
        {/* Pending-actions surface — acknowledgments, surveys, tasks. */}
        <PendingActionsPanel />

        <Card className='flex flex-col gap-3 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              My leave balance
            </h4>
            <Link
              to='/leave'
              className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
            >
              Apply <ArrowRight className='size-3.5' />
            </Link>
          </div>
          <ul className='flex flex-col gap-2.5'>
            {myBalances.slice(0, 5).map((b) => {
              const pct = b.credited
                ? Math.max(0, Math.min(100, (b.left / b.credited) * 100))
                : 0
              return (
                <li key={b.typeId} className='flex flex-col gap-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-paragraph-sm text-neutral-1300 truncate'>
                      {b.typeName}
                    </span>
                    <span className='text-paragraph-sm text-neutral-1600 shrink-0 font-medium tabular-nums'>
                      {b.left} of {b.credited}
                    </span>
                  </div>
                  <div className='h-1.5 w-full overflow-hidden rounded-full bg-neutral-400'>
                    <div
                      className={`h-full rounded-full ${pct > 40 ? 'bg-green-1300' : pct > 15 ? 'bg-yellow-1000' : 'bg-red-1400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className='flex flex-col gap-3 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Upcoming holidays
            </h4>
            <Link
              to='/leave'
              className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
            >
              Calendar <ArrowRight className='size-3.5' />
            </Link>
          </div>
          <ul className='flex flex-col gap-2'>
            {upcomingHolidays.map((h) => (
              <li
                key={h.id}
                className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <span className='min-w-0'>
                  <span className='text-paragraph-sm text-neutral-1600 block truncate font-medium'>
                    {h.name}
                  </span>
                  <span className='text-neutral-1000 block text-xs'>
                    {h.day}
                    {h.kind === 'optional' ? ' · Optional' : ''}
                  </span>
                </span>
                <span className='text-neutral-1300 shrink-0 text-xs font-medium tabular-nums'>
                  {fmtDate(h.date)}
                </span>
              </li>
            ))}
            {upcomingHolidays.length === 0 && (
              <li className='text-paragraph-sm text-neutral-1000'>
                No published holidays coming up.
              </li>
            )}
          </ul>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
        <Card className='flex flex-col gap-3 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              My recent requests
            </h4>
            <Link
              to='/leave'
              className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
            >
              All requests <ArrowRight className='size-3.5' />
            </Link>
          </div>
          <ul className='flex flex-col gap-2'>
            {myRequests.map((r) => (
              <li
                key={r.id}
                className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <span className='min-w-0'>
                  <span className='text-paragraph-sm text-neutral-1600 block truncate font-medium'>
                    {r.typeName}
                  </span>
                  <span className='text-neutral-1000 block text-xs'>
                    {fmtDate(r.from)} – {fmtDate(r.to)} · {r.amount}{' '}
                    {r.unit}
                  </span>
                </span>
                <Badge variant={REQUEST_BADGE[r.status] ?? 'badge_inactive'}>
                  {REQUEST_LABEL[r.status] ?? r.status}
                </Badge>
              </li>
            ))}
            {myRequests.length === 0 && (
              <li className='text-paragraph-sm text-neutral-1000'>
                You have not raised any requests yet.
              </li>
            )}
          </ul>
        </Card>

        <Card className='flex flex-col gap-3 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              My team
            </h4>
            <Link
              to='/directory'
              className='text-paragraph-sm text-blue-1200 flex items-center gap-1 font-medium hover:underline'
            >
              Directory <ArrowRight className='size-3.5' />
            </Link>
          </div>
          {self && (
            <p className='text-paragraph-sm text-neutral-1000'>
              {self.departments.join(' · ')} · reporting to{' '}
              <span className='text-neutral-1300 font-medium'>
                {self.primaryManager}
              </span>
            </p>
          )}
          <ul className='flex flex-col gap-2'>
            {team.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <span className='min-w-0'>
                  <span className='text-paragraph-sm text-neutral-1600 block truncate font-medium'>
                    {e.name}
                  </span>
                  <span className='text-neutral-1000 block text-xs'>
                    {e.position}
                  </span>
                </span>
                <Badge variant='badge_inactive'>{e.functionalLocation}</Badge>
              </li>
            ))}
            {team.length === 0 && (
              <li className='text-paragraph-sm text-neutral-1000'>
                No teammates found in your department.
              </li>
            )}
          </ul>
        </Card>
      </div>

      <p className='text-neutral-1000 text-xs'>
        Your dashboard never shows compensation information — that data stays
        outside dashboards for everyone.
      </p>
    </section>
  )
}
