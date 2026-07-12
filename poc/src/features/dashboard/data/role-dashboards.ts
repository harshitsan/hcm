/**
 * Seed data behind the role-default landing dashboards (R2).
 *
 * Wherever a module already ships seed records (employees, leave requests,
 * vacancies, policy acknowledgments, approval tasks) the dashboard computes
 * its numbers from those records read-only. This file only holds the extras
 * a landing page needs that no module owns yet: short trend series for the
 * sparklines, expiring agreements, and a few plausible pending-action counts.
 *
 * No compensation data appears anywhere in this file — dashboards are
 * comp-dark by design (R1/R2).
 */
import { type Role } from '@/context/role-context'
import { COMPANIES, type Company } from '@/features/employees/data/employees'

/** "Today" for the dashboards — matches the employees/platform seed clock. */
export const DASHBOARD_TODAY = '2026-07-09'

/**
 * Build a short trend series that ends exactly at the live value computed
 * from module seed data, walking backwards through the given step-by-step
 * changes. Keeps sparkline endpoints consistent with the KPI number.
 */
export function trendTo(current: number, backwardDeltas: number[]): number[] {
  const points = [current]
  let v = current
  for (const d of backwardDeltas) {
    v -= d
    points.unshift(v)
  }
  return points
}

// ---------------------------------------------------------------------------
// Company Admin — HR operations extras
// ---------------------------------------------------------------------------

export interface ExpiringDocument {
  id: string
  employee: string
  document: string
  kind: 'Agreement' | 'Certification' | 'Work permit'
  expiresOn: string
}

/** Agreements / documents lapsing in the next 30 days (seeded). */
export const EXPIRING_DOCUMENTS: ExpiringDocument[] = [
  {
    id: 'exp-01',
    employee: 'Rahul Verma',
    document: 'Fixed-term employment agreement',
    kind: 'Agreement',
    expiresOn: '2026-07-18',
  },
  {
    id: 'exp-02',
    employee: 'Sneha Patil',
    document: 'Confidentiality undertaking (renewal)',
    kind: 'Agreement',
    expiresOn: '2026-07-24',
  },
  {
    id: 'exp-03',
    employee: 'David Miller',
    document: 'Work authorization',
    kind: 'Work permit',
    expiresOn: '2026-07-30',
  },
  {
    id: 'exp-04',
    employee: 'Meera Nair',
    document: 'First-aid officer certification',
    kind: 'Certification',
    expiresOn: '2026-08-02',
  },
]

/** Week-by-week leave requests received (last 8 weeks, seeded). */
export const LEAVE_REQUESTS_WEEKLY = [6, 9, 7, 11, 8, 12, 10, 14]

/** Policy-acknowledgment compliance % over the last 6 checks (seeded tail). */
export const ACK_COMPLIANCE_TREND_DELTAS = [3, 2, 4, 3, 2]

/** Headcount movement over the last 7 periods (backward deltas). */
export const HEADCOUNT_TREND_DELTAS = [0, 1, 0, 1, -1, 1, 1]

// ---------------------------------------------------------------------------
// Portfolio / Group Company oversight extras
// ---------------------------------------------------------------------------

export interface CompanyOversightSeed {
  /** Rolling 12-month attrition, %. */
  attritionPct: number
  /** Change vs previous quarter, percentage points. */
  attritionDeltaPts: number
  /** Approved positions currently open (e.g. from recruitment plans). */
  openPositions: number
  /** Pending approvals routed to company admins. */
  pendingApprovals: number
}

/** Per-company oversight figures, keyed by the employees-module company id. */
export const OVERSIGHT_COMPANY_SEEDS: Record<string, CompanyOversightSeed> = {
  'c-aur-ret': {
    attritionPct: 11.2,
    attritionDeltaPts: -0.8,
    openPositions: 5,
    pendingApprovals: 4,
  },
  'c-aur-tech': {
    attritionPct: 8.4,
    attritionDeltaPts: -1.2,
    openPositions: 3,
    pendingApprovals: 2,
  },
  'c-mer-food': {
    attritionPct: 14.6,
    attritionDeltaPts: 1.1,
    openPositions: 4,
    pendingApprovals: 3,
  },
  'c-mer-log': {
    attritionPct: 9.8,
    attritionDeltaPts: -0.4,
    openPositions: 2,
    pendingApprovals: 1,
  },
}

/** Consolidated headcount movement across the scope (backward deltas). */
export const OVERSIGHT_HEADCOUNT_DELTAS = [1, 0, 2, 0, 1, 1, 0]

/**
 * Row-level security framing for the oversight dashboards: a Portfolio Admin
 * sees every company under the portfolio, a Group Company Admin only the
 * companies of their group. Everyone else sees the full seed list on the
 * module pages they can open.
 */
export function companiesInScope(role: Role): Company[] {
  if (role === 'Group Company Admin') {
    return COMPANIES.filter((c) => c.group === 'Aurora Group')
  }
  return COMPANIES
}

// ---------------------------------------------------------------------------
// Employee (User) extras
// ---------------------------------------------------------------------------

/** Surveys / feedback requests awaiting the signed-in employee (seeded). */
export const MY_OPEN_SURVEYS = [
  {
    id: 'svy-01',
    title: 'Quarterly engagement pulse',
    due: '2026-07-15',
  },
]

/** Personal to-dos assigned through onboarding / HR checklists (seeded). */
export const MY_OPEN_TASKS = [
  {
    id: 'todo-01',
    title: 'Upload renewed address proof',
    due: '2026-07-20',
  },
  {
    id: 'todo-02',
    title: 'Confirm optional-holiday picks for H2',
    due: '2026-07-31',
  },
]

// ---------------------------------------------------------------------------
// Platform Admin — platform health extras
// ---------------------------------------------------------------------------

export const PLATFORM_HEALTH = {
  /** Jurisdictions with an active statutory rule pack. */
  jurisdictionsCovered: 12,
  jurisdictionsAddedThisQuarter: 2,
  /** People who signed in over the last 30 days, across every tenant. */
  activeUsers: 1642,
  activeUsersTrendDeltas: [40, 25, 55, 30, 45, 35, 50],
  /** Data import jobs over the last 7 days. */
  importJobs: { completed: 34, running: 2, failed: 3 },
  /** Import jobs finished per day, last 7 days. */
  importJobsDaily: [4, 6, 3, 7, 5, 8, 6],
  /** Tenant requests waiting on the platform owner. */
  tenantsAwaitingActivation: 2,
}
