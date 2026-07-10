/**
 * SatelliteHR POC — Platform Admin (platform owner) dashboard seed data.
 *
 * Everything here is frontend-only, in-memory seed data. Tenant names reuse
 * the same universe as the Group Companies / Portfolios features (Northline &
 * Westbridge portfolios, Meridian Group, Bluegrain Alliance, Harbor–Northwind
 * JV) so the platform-owner view stays consistent with the rest of the POC.
 *
 * Fixed "today" for the POC: 2026-07-09.
 */

export const PLATFORM_TODAY = '2026-07-09'

/** Chart palette shared by every platform dashboard chart. */
export const platformChartColors = {
  blue: '#1f5adb',
  blueLight: '#4d97ff',
  teal: '#40a1a5',
  green: '#3ea383',
  amber: '#f2af29',
  red: '#e12c2c',
  purple: '#8c55b3',
  navy: '#071431',
  grid: '#edeef0',
  axis: '#70767f',
} as const

export const platformChartFont = 'Inter, sans-serif'

// ---------------------------------------------------------------------------
// Plans & billing rates
// ---------------------------------------------------------------------------

export const PLAN_NAMES = ['Enterprise', 'Growth', 'Starter'] as const
export type PlanName = (typeof PLAN_NAMES)[number]

/** USD per seat per month, aligned with the subscription packages seed. */
export const PLAN_SEAT_PRICE_USD: Record<PlanName, number> = {
  Enterprise: 9,
  Growth: 5,
  Starter: 2,
}

export const PLAN_COLORS: Record<PlanName, string> = {
  Enterprise: platformChartColors.blue,
  Growth: platformChartColors.teal,
  Starter: platformChartColors.amber,
}

// ---------------------------------------------------------------------------
// Tenant hierarchy: portfolio → group companies → companies
// ---------------------------------------------------------------------------

export const TENANT_NODE_STATUSES = [
  'Active',
  'Suspended',
  'Onboarding',
] as const
export type TenantNodeStatus = (typeof TENANT_NODE_STATUSES)[number]

export interface PlatformCompany {
  id: string
  name: string
  status: TenantNodeStatus
  plan: PlanName
  /** Licensed seats — drives the seat count and MRR rollups. */
  seats: number
  /** Month the tenant was onboarded (YYYY-MM). */
  onboarded: string
}

export interface PlatformGroupCompany {
  id: string
  name: string
  status: TenantNodeStatus
  companies: PlatformCompany[]
}

export interface PlatformPortfolio {
  id: string
  name: string
  manager: string
  status: TenantNodeStatus
  groups: PlatformGroupCompany[]
  /** Companies attached directly to the portfolio (no group company). */
  directCompanies: PlatformCompany[]
}

export const platformPortfolios: PlatformPortfolio[] = [
  {
    id: 'pf-north',
    name: 'Northline Portfolio',
    manager: 'Omar Haddad',
    status: 'Active',
    groups: [
      {
        id: 'g-01',
        name: 'Meridian Group',
        status: 'Active',
        companies: [
          { id: 'co-01', name: 'Meridian Technologies', status: 'Active', plan: 'Enterprise', seats: 1240, onboarded: '2024-02' },
          { id: 'co-02', name: 'Meridian Digital Services', status: 'Active', plan: 'Growth', seats: 460, onboarded: '2024-03' },
          { id: 'co-03', name: 'Meridian Analytics', status: 'Active', plan: 'Growth', seats: 215, onboarded: '2024-06' },
        ],
      },
      {
        id: 'g-02',
        name: 'Bluegrain Alliance',
        status: 'Active',
        companies: [
          { id: 'co-04', name: 'Bluegrain Foods', status: 'Active', plan: 'Enterprise', seats: 830, onboarded: '2025-01' },
          { id: 'co-05', name: 'Bluegrain Retail', status: 'Active', plan: 'Growth', seats: 390, onboarded: '2025-02' },
        ],
      },
    ],
    directCompanies: [
      { id: 'co-11', name: 'Cascade Health Labs', status: 'Active', plan: 'Starter', seats: 175, onboarded: '2025-08' },
      { id: 'co-12', name: 'Argent Financial', status: 'Onboarding', plan: 'Starter', seats: 0, onboarded: '2026-06' },
    ],
  },
  {
    id: 'pf-west',
    name: 'Westbridge Portfolio',
    manager: 'Sofia Mendes',
    status: 'Active',
    groups: [
      {
        id: 'g-03',
        name: 'Harbor–Northwind JV',
        status: 'Active',
        companies: [
          { id: 'co-06', name: 'Harbor Logistics', status: 'Active', plan: 'Growth', seats: 540, onboarded: '2025-04' },
          { id: 'co-07', name: 'Harbor Freight Lines', status: 'Suspended', plan: 'Starter', seats: 120, onboarded: '2025-04' },
          { id: 'co-08', name: 'Northwind Textiles', status: 'Active', plan: 'Growth', seats: 610, onboarded: '2025-05' },
        ],
      },
    ],
    directCompanies: [
      { id: 'co-09', name: 'Solstice Energy', status: 'Active', plan: 'Enterprise', seats: 720, onboarded: '2025-09' },
      { id: 'co-10', name: 'Solstice Grid Services', status: 'Active', plan: 'Growth', seats: 260, onboarded: '2025-10' },
    ],
  },
]

/** Flat list of every company across all portfolios/groups. */
export function allPlatformCompanies(): PlatformCompany[] {
  return platformPortfolios.flatMap((pf) => [
    ...pf.groups.flatMap((g) => g.companies),
    ...pf.directCompanies,
  ])
}

/** Monthly recurring revenue for one company (suspended/onboarding = $0). */
export function companyMrrUsd(c: PlatformCompany): number {
  if (c.status !== 'Active') return 0
  return c.seats * PLAN_SEAT_PRICE_USD[c.plan]
}

// ---------------------------------------------------------------------------
// Billing — MRR trend (last 12 months, up to 2026-07)
// ---------------------------------------------------------------------------

export interface MrrPoint {
  /** Short label, e.g. "Aug '25". */
  label: string
  mrrUsd: number
}

/**
 * Aug 2025 → Jul 2026. The story matches the tenant timeline: Cascade Health
 * Labs onboards Aug '25, Solstice Energy Sep '25 (+ Grid Services Oct '25),
 * Solstice upgrades Growth → Enterprise in May '26, Harbor Freight Lines is
 * suspended (billing hold) mid-June '26.
 */
export const mrrTrend: MrrPoint[] = [
  { label: "Aug '25", mrrUsd: 27775 },
  { label: "Sep '25", mrrUsd: 29050 },
  { label: "Oct '25", mrrUsd: 30350 },
  { label: "Nov '25", mrrUsd: 30950 },
  { label: "Dec '25", mrrUsd: 31400 },
  { label: "Jan '26", mrrUsd: 32600 },
  { label: "Feb '26", mrrUsd: 33150 },
  { label: "Mar '26", mrrUsd: 34000 },
  { label: "Apr '26", mrrUsd: 34955 },
  { label: "May '26", mrrUsd: 38435 },
  { label: "Jun '26", mrrUsd: 37835 },
  { label: "Jul '26", mrrUsd: 37835 },
]

// ---------------------------------------------------------------------------
// Billing — invoices
// ---------------------------------------------------------------------------

export const INVOICE_STATUSES = ['Paid', 'Due', 'Overdue'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export interface PlatformInvoice {
  id: string
  companyId: string
  companyName: string
  amountUsd: number
  issuedOn: string
  dueOn: string
  status: InvoiceStatus
  paidOn: string | null
}

/** June + July 2026 billing cycles (per-company billing accounts). */
export const platformInvoices: PlatformInvoice[] = [
  // June 2026 cycle — settled except the two Harbor accounts.
  { id: 'INV-2026-0601', companyId: 'co-09', companyName: 'Solstice Energy', amountUsd: 6480, issuedOn: '2026-06-01', dueOn: '2026-06-15', status: 'Paid', paidOn: '2026-06-09' },
  { id: 'INV-2026-0602', companyId: 'co-08', companyName: 'Northwind Textiles', amountUsd: 3050, issuedOn: '2026-06-01', dueOn: '2026-06-15', status: 'Paid', paidOn: '2026-06-12' },
  { id: 'INV-2026-0603', companyId: 'co-06', companyName: 'Harbor Logistics', amountUsd: 2700, issuedOn: '2026-06-01', dueOn: '2026-06-15', status: 'Overdue', paidOn: null },
  { id: 'INV-2026-0604', companyId: 'co-07', companyName: 'Harbor Freight Lines', amountUsd: 600, issuedOn: '2026-06-01', dueOn: '2026-06-15', status: 'Overdue', paidOn: null },
  // July 2026 cycle — issued 1 Jul, due 15 Jul (today = 9 Jul).
  { id: 'INV-2026-0701', companyId: 'co-01', companyName: 'Meridian Technologies', amountUsd: 11160, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Paid', paidOn: '2026-07-04' },
  { id: 'INV-2026-0702', companyId: 'co-04', companyName: 'Bluegrain Foods', amountUsd: 7470, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Paid', paidOn: '2026-07-06' },
  { id: 'INV-2026-0703', companyId: 'co-02', companyName: 'Meridian Digital Services', amountUsd: 2300, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0704', companyId: 'co-03', companyName: 'Meridian Analytics', amountUsd: 1075, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0705', companyId: 'co-05', companyName: 'Bluegrain Retail', amountUsd: 1950, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0706', companyId: 'co-09', companyName: 'Solstice Energy', amountUsd: 6480, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0707', companyId: 'co-10', companyName: 'Solstice Grid Services', amountUsd: 1300, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0708', companyId: 'co-08', companyName: 'Northwind Textiles', amountUsd: 3050, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
  { id: 'INV-2026-0709', companyId: 'co-11', companyName: 'Cascade Health Labs', amountUsd: 350, issuedOn: '2026-07-01', dueOn: '2026-07-15', status: 'Due', paidOn: null },
]

// ---------------------------------------------------------------------------
// Tenant growth — companies onboarded, cumulative per quarter
// ---------------------------------------------------------------------------

export interface QuarterPoint {
  label: string
  /** Companies onboarded during the quarter. */
  onboarded: number
  /** Cumulative companies live at quarter end. */
  cumulative: number
}

/** Derived from the `onboarded` months above (2024-Q1 → 2026-Q3 to date). */
export const tenantGrowthByQuarter: QuarterPoint[] = [
  { label: "Q1 '24", onboarded: 2, cumulative: 2 },
  { label: "Q2 '24", onboarded: 1, cumulative: 3 },
  { label: "Q3 '24", onboarded: 0, cumulative: 3 },
  { label: "Q4 '24", onboarded: 0, cumulative: 3 },
  { label: "Q1 '25", onboarded: 2, cumulative: 5 },
  { label: "Q2 '25", onboarded: 3, cumulative: 8 },
  { label: "Q3 '25", onboarded: 2, cumulative: 10 },
  { label: "Q4 '25", onboarded: 1, cumulative: 11 },
  { label: "Q1 '26", onboarded: 0, cumulative: 11 },
  { label: "Q2 '26", onboarded: 1, cumulative: 12 },
  { label: "Q3 '26", onboarded: 0, cumulative: 12 },
]

// ---------------------------------------------------------------------------
// Module adoption across companies
// ---------------------------------------------------------------------------

export interface ModuleAdoption {
  module: string
  /** Companies (of the 12 tenants) with the module enabled. */
  companies: number
}

export const MODULE_ADOPTION_TOTAL_COMPANIES = 12

export const moduleAdoption: ModuleAdoption[] = [
  { module: 'Core HR', companies: 12 },
  { module: 'Leave', companies: 11 },
  { module: 'Attendance', companies: 10 },
  { module: 'Documents', companies: 9 },
  { module: 'Recruitment', companies: 7 },
  { module: 'Exit & Lifecycle', companies: 6 },
  { module: 'Performance', companies: 5 },
  { module: 'Compliance', companies: 4 },
]

// ---------------------------------------------------------------------------
// Recent platform activity
// ---------------------------------------------------------------------------

export type PlatformActivityKind =
  | 'invoice-paid'
  | 'invoice-issued'
  | 'tenant-onboarding'
  | 'tenant-suspended'
  | 'plan-upgraded'
  | 'module-enabled'
  | 'seats-added'

export interface PlatformActivity {
  id: string
  kind: PlatformActivityKind
  at: string
  title: string
  detail: string
}

export const platformActivity: PlatformActivity[] = [
  {
    id: 'act-01',
    kind: 'invoice-paid',
    at: '2026-07-06',
    title: 'Invoice paid — Bluegrain Foods',
    detail: 'INV-2026-0702 settled for $7,470 (July cycle).',
  },
  {
    id: 'act-02',
    kind: 'invoice-paid',
    at: '2026-07-04',
    title: 'Invoice paid — Meridian Technologies',
    detail: 'INV-2026-0701 settled for $11,160 (July cycle).',
  },
  {
    id: 'act-03',
    kind: 'invoice-issued',
    at: '2026-07-01',
    title: 'July invoices issued',
    detail: '9 billing accounts invoiced, $35,135 total, due 15 Jul 2026.',
  },
  {
    id: 'act-04',
    kind: 'module-enabled',
    at: '2026-06-28',
    title: 'Module enabled — Bluegrain Retail',
    detail: 'Recruitment switched on for 390 seats (Growth plan).',
  },
  {
    id: 'act-05',
    kind: 'tenant-onboarding',
    at: '2026-06-15',
    title: 'Tenant onboarding — Argent Financial',
    detail: 'Provisioning started under Northline Portfolio (Starter plan).',
  },
  {
    id: 'act-06',
    kind: 'tenant-suspended',
    at: '2026-06-10',
    title: 'Tenant suspended — Harbor Freight Lines',
    detail: 'Billing hold after two missed cycles ($600/mo, 120 seats).',
  },
  {
    id: 'act-07',
    kind: 'plan-upgraded',
    at: '2026-05-20',
    title: 'Plan upgraded — Solstice Energy',
    detail: 'Growth → Enterprise for 720 seats (+$2,880 MRR).',
  },
  {
    id: 'act-08',
    kind: 'seats-added',
    at: '2026-05-02',
    title: 'Seats added — Meridian Technologies',
    detail: '+40 seats on the Enterprise plan (now 1,240).',
  },
]
