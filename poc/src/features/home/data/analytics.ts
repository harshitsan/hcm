/**
 * Mock analytics data for the MLS Apartments portfolio dashboard.
 *
 * The portfolio modeled here is ~1,840 units across six communities. All
 * figures are illustrative placeholders until the analytics API is wired up.
 */

/** Shared chart palette, derived from the app theme tokens (theme.css). */
export const chartColors = {
  navy: '#071431',
  blue: '#1f5adb',
  blueBright: '#1277e2',
  blueLight: '#4d97ff',
  teal: '#40a1a5',
  green: '#3ea383',
  greenDark: '#269264',
  yellow: '#fec42e',
  amber: '#f2af29',
  red: '#e12c2c',
  coral: '#ff6038',
  purple: '#8c55b3',
  neutral: '#8a9098',
  grid: '#edeef0',
  axis: '#70767f',
} as const

/** Base font used across every chart so they match the product type. */
export const chartFont = 'Inter, sans-serif'

export const MONTHS = [
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
]

export type Trend = 'up' | 'down'

export interface Kpi {
  id: string
  label: string
  /** Pre-formatted display value, e.g. "94.2%" or "$2.41M". */
  value: string
  /** Period-over-period change, e.g. "+1.8 pts" or "-3.1%". */
  delta: string
  trend: Trend
  /** Whether an upward trend is good (occupancy) or bad (work orders). */
  goodWhenUp: boolean
  caption: string
  spark: number[]
}

export const kpis: Kpi[] = [
  {
    id: 'occupancy',
    label: 'Occupancy rate',
    value: '94.2%',
    delta: '+1.8 pts',
    trend: 'up',
    goodWhenUp: true,
    caption: '1,733 of 1,840 units leased',
    spark: [90.1, 90.8, 91.2, 92, 91.6, 92.4, 93, 93.1, 92.8, 93.6, 94, 94.2],
  },
  {
    id: 'revenue',
    label: 'Monthly revenue',
    value: '$2.41M',
    delta: '+4.3%',
    trend: 'up',
    goodWhenUp: true,
    caption: 'Billed rent + fees, this period',
    spark: [
      2.05, 2.1, 2.13, 2.18, 2.2, 2.24, 2.27, 2.3, 2.29, 2.34, 2.38, 2.41,
    ],
  },
  {
    id: 'leases',
    label: 'Leases signed',
    value: '128',
    delta: '+12',
    trend: 'up',
    goodWhenUp: true,
    caption: 'New + renewals this period',
    spark: [88, 96, 102, 110, 99, 118, 124, 121, 130, 116, 122, 128],
  },
  {
    id: 'avgrent',
    label: 'Avg. effective rent',
    value: '$1,914',
    delta: '+2.1%',
    trend: 'up',
    goodWhenUp: true,
    caption: 'Blended across unit types',
    spark: [
      1820, 1835, 1842, 1858, 1864, 1871, 1880, 1888, 1890, 1899, 1907, 1914,
    ],
  },
  {
    id: 'workorders',
    label: 'Open work orders',
    value: '74',
    delta: '-9.6%',
    trend: 'down',
    goodWhenUp: false,
    caption: 'Avg. 1.8 days to close',
    spark: [102, 98, 110, 95, 90, 88, 92, 85, 83, 80, 78, 74],
  },
  {
    id: 'delinquency',
    label: 'Delinquency',
    value: '2.7%',
    delta: '-0.4 pts',
    trend: 'down',
    goodWhenUp: false,
    caption: 'Balance over 30 days past due',
    spark: [3.6, 3.5, 3.4, 3.3, 3.1, 3.2, 3.0, 2.9, 3.0, 2.8, 2.8, 2.7],
  },
]

/**
 * Snapshot of how the 1,840 units break down right now: occupied (moved in),
 * pre-leased (signed, awaiting move-in) and vacant. Drives the summary card.
 */
export const occupancySummary = {
  total: 1840,
  occupied: 1733,
  preLeased: 39,
  vacant: 68,
}

/** Occupancy vs. leased (signed but not yet moved-in) over 12 months. */
export const occupancyTrend = {
  occupied: [90.1, 90.8, 91.2, 92, 91.6, 92.4, 93, 93.1, 92.8, 93.6, 94, 94.2],
  leased: [92.4, 92.9, 93.4, 94, 93.6, 94.2, 95, 95.1, 94.6, 95.4, 96, 96.3],
}

export interface PropertyRow {
  name: string
  units: number
  occupancy: number
  revenue: number // monthly, in dollars
}

export const properties: PropertyRow[] = [
  { name: 'Maple Court', units: 412, occupancy: 96.1, revenue: 612000 },
  { name: 'Riverside Lofts', units: 318, occupancy: 93.4, revenue: 498000 },
  { name: 'The Hawthorne', units: 286, occupancy: 95.5, revenue: 441000 },
  { name: 'Cedar Park', units: 254, occupancy: 91.7, revenue: 372000 },
  { name: 'Lakeview Terrace', units: 320, occupancy: 94.0, revenue: 318000 },
  { name: 'Brookstone Flats', units: 250, occupancy: 92.8, revenue: 169000 },
]

/** Unit mix donut — occupied units by bedroom type. */
export const unitMix = {
  labels: ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom'],
  values: [212, 706, 614, 201],
}

/** Lease expirations over the next 12 months. */
export const leaseExpirations = [
  64, 88, 112, 96, 134, 158, 142, 120, 106, 92, 78, 70,
]

/** Open work orders by category (horizontal bar). */
export const workOrders = {
  labels: ['Plumbing', 'HVAC', 'Electrical', 'Appliance', 'General', 'Pest'],
  values: [21, 18, 12, 9, 8, 6],
}

/** The leasing funnel — the signature element of this dashboard. */
export interface FunnelStage {
  label: string
  value: number
  hint: string
}

export const leasingFunnel: FunnelStage[] = [
  { label: 'Inquiries', value: 2840, hint: 'Web, phone & walk-in' },
  { label: 'Tours scheduled', value: 1192, hint: 'In-person & self-guided' },
  { label: 'Applications', value: 486, hint: 'Started & submitted' },
  { label: 'Approved', value: 214, hint: 'Screening passed' },
  { label: 'Leases signed', value: 128, hint: 'Move-in scheduled' },
]
