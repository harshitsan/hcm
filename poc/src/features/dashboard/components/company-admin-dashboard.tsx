import {
  Briefcase,
  CalendarClock,
  FileClock,
  Hourglass,
  Inbox,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
// Read-only imports of other modules' seed data (R2 drill-down KPIs).
import { seedEmployees } from '@/features/employees/data/employees'
import { seedRequests } from '@/features/leave/data/requests'
import { seedAssignments } from '@/features/policy-distribution/data/distributions'
import { seedVacancies } from '@/features/recruitment/data/vacancies'
import { seedTasks } from '@/features/workflows/data/instances'
import {
  ACK_COMPLIANCE_TREND_DELTAS,
  DASHBOARD_TODAY,
  EXPIRING_DOCUMENTS,
  HEADCOUNT_TREND_DELTAS,
  LEAVE_REQUESTS_WEEKLY,
  trendTo,
} from '../data/role-dashboards'
import { CompDarkNote, KpiCardGrid, type DrillKpi } from './kpi-card'
import { PendingActionsPanel } from './pending-actions'
import { MiniBars, Sparkline } from './sparkline'

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Company Admin landing dashboard (R2) — the HR-operations view. Every KPI
 * card drills into the module that owns the number; the figures come from
 * the same seed records those modules render.
 */
export function CompanyAdminDashboard() {
  const active = seedEmployees.filter((e) => e.lifecycleStage !== 'Exited')
  const headcount = active.length
  const onProbation = active.filter(
    (e) => e.lifecycleStage === 'Probation'
  ).length
  const onboarding = active.filter(
    (e) => e.lifecycleStage === 'Onboarding'
  ).length
  const onLeaveToday = seedRequests.filter(
    (r) =>
      r.status === 'approved' &&
      r.from <= DASHBOARD_TODAY &&
      r.to >= DASHBOARD_TODAY
  ).length
  const openVacancies = seedVacancies
    .filter((v) => ['new', 'assigned', 'in-process'].includes(v.status))
    .reduce((n, v) => n + v.vacancies, 0)
  const pendingApprovals =
    seedRequests.filter(
      (r) => r.status === 'pending' || r.status === 'needs-clarification'
    ).length + seedTasks.filter((t) => t.status === 'pending').length

  const ackRelevant = seedAssignments.filter((a) =>
    ['Acknowledged', 'Pending', 'Overdue'].includes(a.status)
  )
  const acked = ackRelevant.filter((a) => a.status === 'Acknowledged').length
  const ackCompliancePct = ackRelevant.length
    ? Math.round((acked / ackRelevant.length) * 100)
    : 100

  const headcountTrend = trendTo(headcount, HEADCOUNT_TREND_DELTAS)
  const complianceTrend = trendTo(ackCompliancePct, ACK_COMPLIANCE_TREND_DELTAS)

  const kpis: DrillKpi[] = [
    {
      label: 'Headcount',
      value: String(headcount),
      hint: 'Active employees',
      icon: Users,
      delta: { text: '+3 this quarter', direction: 'up', tone: 'good' },
      spark: headcountTrend,
      to: '/employees',
    },
    {
      label: 'On probation',
      value: String(onProbation),
      hint: 'Confirmations due soon',
      icon: Hourglass,
      iconClass: 'bg-yellow-200 text-yellow-1000',
      delta: { text: '1 confirmation this month', direction: 'flat', tone: 'neutral' },
      to: '/lifecycle',
    },
    {
      label: 'On leave today',
      value: String(onLeaveToday),
      hint: 'Approved and in progress',
      icon: CalendarClock,
      delta: { text: '2 fewer than last week', direction: 'down', tone: 'good' },
      to: '/leave',
    },
    {
      label: 'Open vacancies',
      value: String(openVacancies),
      hint: 'Positions being hired for',
      icon: Briefcase,
      delta: { text: '+2 since last month', direction: 'up', tone: 'neutral' },
      to: '/recruitment',
    },
    {
      label: 'Pending approvals',
      value: String(pendingApprovals),
      hint: 'Leave + workflow inbox',
      icon: Inbox,
      iconClass: 'bg-red-1300 text-red-1400',
      delta: { text: '+4 since yesterday', direction: 'up', tone: 'bad' },
      to: '/workflows',
    },
    {
      label: 'Policy-ack compliance',
      value: `${ackCompliancePct}%`,
      hint: `${acked} of ${ackRelevant.length} acknowledged`,
      icon: ShieldCheck,
      iconClass: 'bg-green-1200 text-green-1300',
      delta: { text: '+3 pts this month', direction: 'up', tone: 'good' },
      spark: complianceTrend,
      sparkClass: 'text-green-1300',
      to: '/policy-distribution',
    },
    {
      label: 'Expiring documents',
      value: String(EXPIRING_DOCUMENTS.length),
      hint: 'Agreements, next 30 days',
      icon: FileClock,
      iconClass: 'bg-vanilla-400 text-vanilla-500',
      delta: { text: '2 due within 15 days', direction: 'flat', tone: 'bad' },
      to: '/hr-letters',
    },
    {
      label: 'Joining now',
      value: String(onboarding),
      hint: 'In onboarding this month',
      icon: UserPlus,
      delta: { text: 'On track', direction: 'flat', tone: 'neutral' },
      to: '/lifecycle',
    },
  ]

  return (
    <section className='flex flex-col gap-3'>
      <div>
        <h3 className='text-paragraph-md text-neutral-1200 font-medium'>
          HR operations today
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
          Live view across your company · data as of {fmtDate(DASHBOARD_TODAY)}{' '}
          (mock) · click any card to open the module
        </p>
      </div>

      <KpiCardGrid kpis={kpis} />

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-3'>
        {/* Pending-actions surface — prominent, first in reading order. */}
        <PendingActionsPanel />

        <Card className='flex flex-col gap-3 p-4'>
          <div>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Leave requests received
            </h4>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              Per week, last 8 weeks
            </p>
          </div>
          <MiniBars
            values={LEAVE_REQUESTS_WEEKLY}
            height={96}
            className='text-blue-1200'
            labels={LEAVE_REQUESTS_WEEKLY.map((_, i) => `W${i + 1}`)}
          />
          <p className='text-paragraph-sm text-neutral-1000'>
            {LEAVE_REQUESTS_WEEKLY[LEAVE_REQUESTS_WEEKLY.length - 1]} requests
            this week — the seasonal peak before the holiday calendar closes.
          </p>
        </Card>

        <Card className='flex flex-col gap-3 p-4'>
          <div>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Expiring agreements & documents
            </h4>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              Next 30 days
            </p>
          </div>
          <ul className='flex flex-col gap-2'>
            {EXPIRING_DOCUMENTS.map((d) => (
              <li
                key={d.id}
                className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <span className='min-w-0'>
                  <span className='text-paragraph-sm text-neutral-1600 block truncate font-medium'>
                    {d.document}
                  </span>
                  <span className='text-neutral-1000 block text-xs'>
                    {d.employee} · {d.kind}
                  </span>
                </span>
                <span className='text-vanilla-500 shrink-0 text-xs font-medium'>
                  {fmtDate(d.expiresOn)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
        <Card className='flex flex-col gap-3 p-4'>
          <div>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Headcount trend
            </h4>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              Active employees, last 8 periods
            </p>
          </div>
          <Sparkline
            values={headcountTrend}
            height={72}
            className='text-blue-1200'
          />
        </Card>
        <Card className='flex flex-col gap-3 p-4'>
          <div>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Policy-acknowledgment compliance
            </h4>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              Share of assigned policies acknowledged, last 6 checks
            </p>
          </div>
          <Sparkline
            values={complianceTrend}
            height={72}
            className='text-green-1300'
          />
        </Card>
      </div>

      <CompDarkNote />
    </section>
  )
}
