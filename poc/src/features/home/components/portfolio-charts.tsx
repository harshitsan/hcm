import { type ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import {
  chartColors,
  chartFont,
  leaseExpirations,
  MONTHS,
  occupancyTrend,
  properties,
  unitMix,
  workOrders,
} from '../data/analytics'
import { ChartCard, LegendDot } from './chart-card'

const baseGrid: ApexOptions['grid'] = {
  borderColor: chartColors.grid,
  strokeDashArray: 4,
  padding: { left: 8, right: 8 },
}

const axisStyle = {
  labels: { style: { colors: chartColors.axis, fontFamily: chartFont } },
}

/** Occupied vs. leased (pre-lease) percentage over the trailing 12 months. */
export function OccupancyTrendChart() {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: chartFont,
      zoom: { enabled: false },
    },
    colors: [chartColors.blue, chartColors.teal],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 2] },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.25, opacityTo: 0.02, shadeIntensity: 1 },
    },
    grid: baseGrid,
    legend: { show: false },
    xaxis: {
      categories: MONTHS,
      axisBorder: { show: false },
      axisTicks: { show: false },
      ...axisStyle,
    },
    yaxis: {
      min: 86,
      max: 100,
      tickAmount: 4,
      labels: {
        formatter: (v) => `${v.toFixed(0)}%`,
        style: { colors: chartColors.axis, fontFamily: chartFont },
      },
    },
    tooltip: { y: { formatter: (v) => `${v}%` } },
  }

  return (
    <ChartCard
      title='Occupancy trend'
      subtitle='Trailing 12 months'
      help='Occupied vs. signed-but-not-moved-in over the trailing 12 months.'
      action={
        <div className='flex items-center gap-3'>
          <LegendDot color={chartColors.blue} label='Occupied' />
          <LegendDot color={chartColors.teal} label='Leased' />
        </div>
      }
    >
      <ReactApexChart
        options={options}
        series={[
          { name: 'Occupied', data: occupancyTrend.occupied },
          { name: 'Leased', data: occupancyTrend.leased },
        ]}
        type='area'
        height={300}
      />
    </ChartCard>
  )
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Monthly billed revenue per community. */
export function RevenueByPropertyChart() {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: chartFont,
    },
    colors: [chartColors.blue],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '52%', distributed: false },
    },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: {
      categories: properties.map((p) => p.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: chartColors.axis, fontFamily: chartFont },
        rotate: -20,
        hideOverlappingLabels: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (v) => `$${Math.round(v / 1000)}k`,
        style: { colors: chartColors.axis, fontFamily: chartFont },
      },
    },
    tooltip: { y: { formatter: (v) => currencyFmt.format(v) } },
  }

  return (
    <ChartCard
      title='Revenue by community'
      subtitle='Billed rent + fees / month'
      help='Billed rent plus fees per month, by community.'
    >
      <ReactApexChart
        options={options}
        series={[{ name: 'Revenue', data: properties.map((p) => p.revenue) }]}
        type='bar'
        height={300}
      />
    </ChartCard>
  )
}

/** Occupied units by bedroom type. */
export function UnitMixChart() {
  const total = unitMix.values.reduce((a, b) => a + b, 0)
  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: chartFont },
    labels: unitMix.labels,
    colors: [
      chartColors.navy,
      chartColors.blue,
      chartColors.blueLight,
      chartColors.teal,
    ],
    stroke: { width: 2, colors: ['#fff'] },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontFamily: chartFont,
      labels: { colors: chartColors.axis },
      markers: { size: 5 },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Occupied units',
              color: chartColors.axis,
              fontSize: '12px',
              formatter: () => total.toLocaleString(),
            },
            value: {
              color: chartColors.navy,
              fontSize: '22px',
              fontWeight: 600,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v) => `${v} units` } },
  }

  return (
    <ChartCard
      title='Unit mix'
      subtitle='Occupied units by bedroom type'
      help='Occupied units broken down by bedroom type.'
    >
      <ReactApexChart
        options={options}
        series={unitMix.values}
        type='donut'
        height={300}
      />
    </ChartCard>
  )
}

/** Lease expirations by month — staffing/renewal planning. */
export function LeaseExpirationsChart() {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: chartFont,
    },
    colors: [chartColors.amber],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: {
      categories: MONTHS,
      axisBorder: { show: false },
      axisTicks: { show: false },
      ...axisStyle,
    },
    yaxis: axisStyle,
    tooltip: { y: { formatter: (v) => `${v} leases` } },
  }

  return (
    <ChartCard
      title='Lease expirations'
      subtitle='Scheduled over the next 12 months'
      help='Number of leases scheduled to expire each month.'
    >
      <ReactApexChart
        options={options}
        series={[{ name: 'Expiring leases', data: leaseExpirations }]}
        type='bar'
        height={260}
      />
    </ChartCard>
  )
}

/** Open work orders by category. */
export function WorkOrdersChart() {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: chartFont,
    },
    colors: [chartColors.teal],
    plotOptions: {
      bar: { borderRadius: 3, horizontal: true, barHeight: '60%' },
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#fff'], fontFamily: chartFont },
    },
    grid: baseGrid,
    xaxis: {
      categories: workOrders.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      ...axisStyle,
    },
    yaxis: axisStyle,
    tooltip: { y: { formatter: (v) => `${v} open` } },
  }

  return (
    <ChartCard
      title='Work orders'
      subtitle='Open requests by category'
      help='Open maintenance requests grouped by category.'
    >
      <ReactApexChart
        options={options}
        series={[{ name: 'Open', data: workOrders.values }]}
        type='bar'
        height={260}
      />
    </ChartCard>
  )
}
