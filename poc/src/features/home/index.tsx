import { Card } from '@/components/ui/card'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { KpiStat } from './components/kpi-stat'
import { LeasingFunnel } from './components/leasing-funnel'
import { OverviewFilters } from './components/overview-filters'
import {
  LeaseExpirationsChart,
  OccupancyTrendChart,
  RevenueByPropertyChart,
  UnitMixChart,
  WorkOrdersChart,
} from './components/portfolio-charts'
import { chartColors, kpis, properties } from './data/analytics'

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Portfolio table summarizing each community. */
function PortfolioTable() {
  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div className='border-gray-200 border-b px-5 py-4'>
        <h3 className='text-paragraph-md text-neutral-1600 font-semibold'>
          Portfolio by community
        </h3>
        <p className='text-paragraph-sm text-neutral-1100 mt-0.5'>
          {properties.length} communities · 1,840 units
        </p>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-paragraph-sm text-neutral-1100 border-gray-200 border-b text-left'>
              <th className='px-5 py-2.5 font-medium'>Community</th>
              <th className='px-5 py-2.5 text-right font-medium'>Units</th>
              <th className='px-5 py-2.5 font-medium'>Occupancy</th>
              <th className='px-5 py-2.5 text-right font-medium'>
                Monthly revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr
                key={p.name}
                className='border-gray-200 hover:bg-neutral-150 border-b last:border-0'
              >
                <td className='text-neutral-1600 px-5 py-3 font-medium'>
                  {p.name}
                </td>
                <td className='text-neutral-1300 px-5 py-3 text-right'>
                  {p.units}
                </td>
                <td className='px-5 py-3'>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-28 overflow-hidden rounded-full bg-neutral-400'>
                      <div
                        className='h-full rounded-full'
                        style={{
                          width: `${p.occupancy}%`,
                          backgroundColor:
                            p.occupancy >= 95
                              ? chartColors.greenDark
                              : p.occupancy >= 92
                                ? chartColors.blue
                                : chartColors.amber,
                        }}
                      />
                    </div>
                    <span className='text-neutral-1300 tabular-nums'>
                      {p.occupancy}%
                    </span>
                  </div>
                </td>
                <td className='text-neutral-1300 px-5 py-3 text-right tabular-nums'>
                  {currencyFmt.format(p.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function Home() {
  return (
    <>
      <CommonHeader title='Portfolio analytics' className='bg-blue-150' />
      <Main fluid className='flex flex-col gap-4 bg-neutral-200'>
        {/* Overview filter bar */}
        <OverviewFilters />

        {/* KPI row */}
        <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
          {kpis.map((kpi) => (
            <KpiStat key={kpi.id} kpi={kpi} />
          ))}
        </section>

        {/* Signature funnel + occupancy trend */}
        <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <LeasingFunnel />
          <OccupancyTrendChart />
        </section>

        {/* Revenue + unit mix */}
        <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <RevenueByPropertyChart />
          </div>
          <UnitMixChart />
        </section>

        {/* Expirations + work orders */}
        <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <LeaseExpirationsChart />
          <WorkOrdersChart />
        </section>

        <PortfolioTable />
      </Main>
    </>
  )
}
