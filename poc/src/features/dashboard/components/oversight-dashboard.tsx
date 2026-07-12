import { Link } from '@tanstack/react-router'
import { Briefcase, Building2, Inbox, TrendingDown, Users } from 'lucide-react'
import { useRole } from '@/context/role-context'
import { Card } from '@/components/ui/card'
// Read-only import of the employees module's seed roster.
import { seedEmployees } from '@/features/employees/data/employees'
import {
  companiesInScope,
  OVERSIGHT_COMPANY_SEEDS,
  OVERSIGHT_HEADCOUNT_DELTAS,
  trendTo,
} from '../data/role-dashboards'
import { CompDarkNote, KpiCard, type DrillKpi } from './kpi-card'
import { PendingActionsPanel } from './pending-actions'
import { Sparkline } from './sparkline'

/**
 * Portfolio Admin / Group Company Admin landing dashboard (R2) —
 * consolidated people KPIs across the companies inside the admin's scope.
 * Row-level security framing: the same seed roster is filtered to the
 * companies the role covers before anything is counted.
 */
export function OversightDashboard() {
  const { role } = useRole()
  const scope = companiesInScope(role)
  const scopeIds = new Set(scope.map((c) => c.id))

  const rows = scope.map((company) => {
    const people = seedEmployees.filter(
      (e) => e.companyId === company.id && e.lifecycleStage !== 'Exited'
    )
    const seed = OVERSIGHT_COMPANY_SEEDS[company.id]
    return {
      company,
      headcount: people.length,
      attritionPct: seed?.attritionPct ?? 0,
      attritionDeltaPts: seed?.attritionDeltaPts ?? 0,
      openPositions: seed?.openPositions ?? 0,
      pendingApprovals: seed?.pendingApprovals ?? 0,
    }
  })

  const headcount = rows.reduce((n, r) => n + r.headcount, 0)
  const openPositions = rows.reduce((n, r) => n + r.openPositions, 0)
  const pendingApprovals = rows.reduce((n, r) => n + r.pendingApprovals, 0)
  const attritionPct = rows.length
    ? Math.round(
        (rows.reduce((n, r) => n + r.attritionPct * r.headcount, 0) /
          Math.max(headcount, 1)) *
          10
      ) / 10
    : 0

  const headcountTrend = trendTo(headcount, OVERSIGHT_HEADCOUNT_DELTAS)
  const scopeLabel =
    role === 'Group Company Admin'
      ? 'your group companies'
      : 'your portfolio companies'

  const kpis: DrillKpi[] = [
    {
      label: 'Companies in scope',
      value: String(scope.length),
      hint: role === 'Group Company Admin' ? 'Aurora Group' : 'All portfolios',
      icon: Building2,
      to: '/companies',
    },
    {
      label: 'Consolidated headcount',
      value: String(headcount),
      hint: 'Active across all companies',
      icon: Users,
      delta: { text: '+5 this quarter', direction: 'up', tone: 'good' },
      spark: headcountTrend,
      to: '/employees',
    },
    {
      label: 'Attrition (rolling 12 mo)',
      value: `${attritionPct}%`,
      hint: 'Headcount-weighted average',
      icon: TrendingDown,
      iconClass: 'bg-yellow-200 text-yellow-1000',
      delta: { text: '-0.4 pts vs last quarter', direction: 'down', tone: 'good' },
      to: '/reports',
    },
    {
      label: 'Open positions',
      value: `e.g. ${openPositions}`,
      hint: 'Approved, being hired for',
      icon: Briefcase,
      delta: { text: '+3 since last month', direction: 'up', tone: 'neutral' },
      to: '/reports',
    },
    {
      label: 'Approvals open',
      value: String(pendingApprovals),
      hint: 'With company admins',
      icon: Inbox,
      iconClass: 'bg-red-1300 text-red-1400',
      delta: { text: '2 escalated to you', direction: 'up', tone: 'bad' },
      to: '/companies',
    },
  ]

  return (
    <section className='flex flex-col gap-3'>
      <div>
        <h3 className='text-paragraph-md text-neutral-1200 font-medium'>
          Consolidated view — {scopeLabel}
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
          You only see companies inside your scope — the same row-level
          filters apply here as in reports. Click any card to open the module.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'>
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-3'>
        <PendingActionsPanel />

        <Card className='gap-0 overflow-hidden py-0 xl:col-span-2'>
          <div className='border-gray-200 border-b px-5 py-4'>
            <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
              Companies at a glance
            </h4>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              {scope.length} companies · {headcount} active employees
            </p>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-paragraph-sm text-neutral-1100 border-gray-200 border-b text-left'>
                  <th className='px-5 py-2.5 font-medium'>Company</th>
                  <th className='px-5 py-2.5 text-right font-medium'>
                    Headcount
                  </th>
                  <th className='px-5 py-2.5 text-right font-medium'>
                    Attrition
                  </th>
                  <th className='px-5 py-2.5 text-right font-medium'>
                    Open positions
                  </th>
                  <th className='px-5 py-2.5 text-right font-medium'>
                    Approvals open
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.company.id}
                    className='border-gray-200 hover:bg-neutral-150 border-b last:border-0'
                  >
                    <td className='px-5 py-3'>
                      <Link
                        to='/companies'
                        className='text-neutral-1600 font-medium hover:underline'
                      >
                        {r.company.name}
                      </Link>
                      <span className='text-neutral-1000 block text-xs'>
                        {r.company.group}
                      </span>
                    </td>
                    <td className='text-neutral-1300 px-5 py-3 text-right tabular-nums'>
                      {r.headcount}
                    </td>
                    <td className='px-5 py-3 text-right tabular-nums'>
                      <span
                        className={
                          r.attritionDeltaPts > 0
                            ? 'text-red-1400'
                            : 'text-green-1300'
                        }
                      >
                        {r.attritionPct}%
                      </span>
                      <span className='text-neutral-1000 block text-xs'>
                        {r.attritionDeltaPts > 0 ? '+' : ''}
                        {r.attritionDeltaPts} pts
                      </span>
                    </td>
                    <td className='text-neutral-1300 px-5 py-3 text-right tabular-nums'>
                      {r.openPositions}
                    </td>
                    <td className='text-neutral-1300 px-5 py-3 text-right tabular-nums'>
                      {r.pendingApprovals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className='flex flex-col gap-3 p-4'>
        <div>
          <h4 className='text-paragraph-md text-neutral-1600 font-semibold'>
            Consolidated headcount trend
          </h4>
          <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
            Active employees across {scopeIds.size} companies, last 8 periods
          </p>
        </div>
        <Sparkline
          values={headcountTrend}
          height={72}
          className='text-blue-1200'
        />
      </Card>

      <CompDarkNote />
    </section>
  )
}
