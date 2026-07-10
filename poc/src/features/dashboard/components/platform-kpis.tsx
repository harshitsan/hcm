import {
  Building2,
  FileWarning,
  Layers,
  Network,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  formatUsd,
  usePlatformMetrics,
} from '../hooks/use-platform-metrics'

/** Top KPI stat row of the Platform Admin dashboard. */
export function PlatformKpis() {
  const m = usePlatformMetrics()

  const kpis = [
    {
      label: 'Portfolios',
      value: String(m.portfolioCount),
      hint: 'Shared-services scopes',
      icon: Layers,
      iconClass: 'bg-blue-100 text-blue-1200',
    },
    {
      label: 'Group companies',
      value: String(m.groupCompanyCount),
      hint: 'Holding / sister / JV structures',
      icon: Network,
      iconClass: 'bg-blue-100 text-blue-1200',
    },
    {
      label: 'Companies',
      value: String(m.companyCount),
      hint: `${m.activeCompanyCount} active tenants`,
      icon: Building2,
      iconClass: 'bg-blue-100 text-blue-1200',
    },
    {
      label: 'Employee seats',
      value: m.totalSeats.toLocaleString('en-US'),
      hint: 'Licensed across all tenants',
      icon: Users,
      iconClass: 'bg-green-1200 text-green-1300',
    },
    {
      label: 'MRR',
      value: formatUsd(m.mrrUsd),
      hint: 'Monthly recurring revenue',
      icon: TrendingUp,
      iconClass: 'bg-green-1200 text-green-1300',
    },
    {
      label: 'Open invoices',
      value: String(m.openInvoiceCount),
      hint: `${formatUsd(m.openInvoiceAmountUsd)} outstanding`,
      icon: FileWarning,
      iconClass: 'bg-yellow-200 text-yellow-1000',
    },
  ]

  return (
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
      {kpis.map((k) => {
        const Icon = k.icon
        return (
          <div
            key={k.label}
            className='flex flex-col gap-2 rounded-[8px] border border-gray-200 bg-white p-4'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='text-paragraph-sm text-neutral-1000 tracking-wide uppercase'>
                {k.label}
              </span>
              <span
                aria-hidden='true'
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${k.iconClass}`}
              >
                <Icon className='size-4' />
              </span>
            </div>
            <span className='font-display text-neutral-1600 text-2xl font-semibold tabular-nums'>
              {k.value}
            </span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {k.hint}
            </span>
          </div>
        )
      })}
    </div>
  )
}
