import { type Company } from './report-catalog'

/** Dashboard layouts a role can be mapped to (per-tenant config, RPT-22). */
export const DASHBOARD_LAYOUTS = [
  'Operations Overview',
  'Workforce Analytics',
  'Consolidated Portfolio',
  'Consolidated Group',
  'Self-Service (My Data)',
] as const

export type DashboardLayout = (typeof DASHBOARD_LAYOUTS)[number]

/**
 * One aggregate slice per company × department. Dashboards compute KPIs and
 * bar charts from these, restricted to the viewer's authorized companies.
 */
export interface HeadcountSlice {
  id: string
  company: Company
  department: string
  headcount: number
  onLeaveToday: number
  attritionPct: number
  openPositions: number
}

const s = (
  id: string,
  company: Company,
  department: string,
  headcount: number,
  onLeaveToday: number,
  attritionPct: number,
  openPositions: number
): HeadcountSlice => ({
  id,
  company,
  department,
  headcount,
  onLeaveToday,
  attritionPct,
  openPositions,
})

export const headcountSlices: HeadcountSlice[] = [
  s('hs-01', 'Aurora Software', 'Engineering', 148, 9, 4.1, 6),
  s('hs-02', 'Aurora Software', 'Sales', 52, 3, 6.8, 2),
  s('hs-03', 'Aurora Software', 'Human Resources', 14, 1, 2.2, 1),
  s('hs-04', 'Aurora Software', 'Finance', 18, 0, 1.9, 0),
  s('hs-05', 'Aurora Software', 'Operations', 26, 2, 3.4, 1),
  s('hs-06', 'Northwind Retail', 'Sales', 210, 14, 9.6, 8),
  s('hs-07', 'Northwind Retail', 'Operations', 164, 11, 7.1, 5),
  s('hs-08', 'Northwind Retail', 'Finance', 22, 1, 2.8, 0),
  s('hs-09', 'Zenith Manufacturing', 'Engineering', 96, 5, 3.2, 4),
  s('hs-10', 'Zenith Manufacturing', 'Operations', 240, 18, 5.5, 9),
  s('hs-11', 'Helios Energy', 'Engineering', 74, 4, 2.9, 3),
  s('hs-12', 'Helios Energy', 'Finance', 20, 1, 1.5, 0),
]

/** Self-service dashboard metrics for the signed-in employee (RPT-14). */
export interface SelfMetric {
  id: string
  label: string
  value: string
  hint: string
  /** Own-records-only drill-down rows. */
  drill: string[]
}

export const selfMetrics: SelfMetric[] = [
  {
    id: 'sm-1',
    label: 'Leave balance',
    value: '11.5 days',
    hint: 'Earned 9.5 · Casual 2.0',
    drill: [
      'Earned leave credited 1.5 on 01 Jun 2026',
      'Earned leave taken 2.0 on 18–19 May 2026 (approved)',
      'Casual leave taken 1.0 on 02 Apr 2026 (approved)',
    ],
  },
  {
    id: 'sm-2',
    label: 'Attendance (June)',
    value: '21 / 22 days',
    hint: '1 late punch on 12 Jun',
    drill: [
      '12 Jun 2026 — in 10:12 (late), out 19:05',
      '19 Jun 2026 — WFH (approved)',
      '26 Jun 2026 — in 09:02, out 18:34',
    ],
  },
  {
    id: 'sm-3',
    label: 'Pending requests',
    value: '2',
    hint: '1 leave · 1 comp-off',
    drill: [
      'Earned leave 03–04 Jul 2026 — awaiting manager approval',
      'Comp-off redeem for 14 Jun weekend release — awaiting approval',
    ],
  },
  {
    id: 'sm-4',
    label: 'Assets assigned',
    value: '2',
    hint: 'Laptop · access card',
    drill: [
      'MacBook Pro 14" — AST-0451, assigned 11 Feb 2026',
      'Access card — HYD-3341, assigned 03 Jan 2025',
    ],
  },
]
