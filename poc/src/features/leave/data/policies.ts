/**
 * Differentiated leave policies (LVE-01) with effective-dated versions
 * (LVE-21), group-level baselines (LVE-18) and portfolio-wide visibility
 * (LVE-19). Scope differentiators combine with AND semantics; the most
 * specific matching policy governs (LVE-25).
 */

export interface PolicyScope {
  employeeType: string | null
  group: string | null
  jurisdiction: string | null
  company: string | null
  department: string | null
  location: string | null
}

export interface PolicyVersion {
  version: number
  effectiveFrom: string
  recordedAt: string
  changedBy: string
  note: string
}

export interface LeavePolicy {
  id: string
  name: string
  scope: PolicyScope
  /** Human-readable entitlement summary applied by this policy. */
  entitlementSummary: string
  accrual: 'monthly' | 'quarterly' | 'annual grant'
  carryForwardCap: number
  version: number
  effectiveFrom: string
  status: 'active' | 'draft' | 'superseded'
  source: 'company' | 'group-baseline'
  /** Which company owns this policy (portfolio oversight). */
  company: string
  versions: PolicyVersion[]
}

/** Number of populated scope differentiators — higher wins precedence. */
export function policySpecificity(scope: PolicyScope): number {
  return Object.values(scope).filter((v) => v !== null).length
}

export const emptyScope: PolicyScope = {
  employeeType: null,
  group: null,
  jurisdiction: null,
  company: null,
  department: null,
  location: null,
}

export const seedPolicies: LeavePolicy[] = [
  {
    id: 'pol-001',
    name: 'India Standard Leave Policy',
    scope: { ...emptyScope, jurisdiction: 'India' },
    entitlementSummary: '18 PL / 8 CL / 12 SL days, comp-off enabled',
    accrual: 'monthly',
    carryForwardCap: 10,
    version: 3,
    effectiveFrom: '2026-04-01',
    status: 'active',
    source: 'company',
    company: 'Satellite Tech India',
    versions: [
      {
        version: 1,
        effectiveFrom: '2024-04-01',
        recordedAt: '2024-03-12T10:04:00Z',
        changedBy: 'Sunita Patil',
        note: 'Initial policy publication.',
      },
      {
        version: 2,
        effectiveFrom: '2025-04-01',
        recordedAt: '2025-03-20T08:31:00Z',
        changedBy: 'Sunita Patil',
        note: 'Carry-forward cap raised from 8 to 10 days.',
      },
      {
        version: 3,
        effectiveFrom: '2026-04-01',
        recordedAt: '2026-03-15T14:22:00Z',
        changedBy: 'Sunita Patil',
        note: 'Privileged leave raised from 16 to 18 days.',
      },
    ],
  },
  {
    id: 'pol-002',
    name: 'US FMLA-Aligned Policy',
    scope: { ...emptyScope, jurisdiction: 'USA' },
    entitlementSummary: '15 PTO days, 96 sick hours, FMLA 480 hours',
    accrual: 'annual grant',
    carryForwardCap: 5,
    version: 2,
    effectiveFrom: '2026-01-01',
    status: 'active',
    source: 'company',
    company: 'Satellite Tech USA',
    versions: [
      {
        version: 1,
        effectiveFrom: '2025-01-01',
        recordedAt: '2024-12-02T09:00:00Z',
        changedBy: 'Dana Willis',
        note: 'Initial US policy.',
      },
      {
        version: 2,
        effectiveFrom: '2026-01-01',
        recordedAt: '2025-12-10T16:45:00Z',
        changedBy: 'Dana Willis',
        note: 'Sick hours aligned to Austin ordinance (96h).',
      },
    ],
  },
  {
    id: 'pol-003',
    name: 'Hyderabad Engineering Policy',
    scope: {
      ...emptyScope,
      jurisdiction: 'India',
      department: 'Engineering',
      location: 'Hyderabad',
    },
    entitlementSummary: 'India standard + 2 wellness days, comp-off expiry 90d',
    accrual: 'monthly',
    carryForwardCap: 12,
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'active',
    source: 'company',
    company: 'Satellite Tech India',
    versions: [
      {
        version: 1,
        effectiveFrom: '2026-01-01',
        recordedAt: '2025-12-18T11:12:00Z',
        changedBy: 'Sunita Patil',
        note: 'Most-specific policy for Hyderabad Engineering.',
      },
    ],
  },
  {
    id: 'pol-004',
    name: 'Contract Staff Policy',
    scope: { ...emptyScope, employeeType: 'Contract' },
    entitlementSummary: '6 CL days only, no carry-forward',
    accrual: 'quarterly',
    carryForwardCap: 0,
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'active',
    source: 'company',
    company: 'Orbital Services',
    versions: [
      {
        version: 1,
        effectiveFrom: '2026-01-01',
        recordedAt: '2025-12-05T09:40:00Z',
        changedBy: 'HR Ops',
        note: 'Contractor entitlements per MSA.',
      },
    ],
  },
  {
    id: 'pol-005',
    name: 'Group Baseline — Satellite Group',
    scope: { ...emptyScope, group: 'Satellite Group' },
    entitlementSummary: 'Baseline: 15 PL / 6 CL / 10 SL days minimum',
    accrual: 'monthly',
    carryForwardCap: 8,
    version: 2,
    effectiveFrom: '2026-01-01',
    status: 'active',
    source: 'group-baseline',
    company: 'Satellite Group (all companies)',
    versions: [
      {
        version: 1,
        effectiveFrom: '2025-01-01',
        recordedAt: '2024-12-01T10:00:00Z',
        changedBy: 'Group HR Council',
        note: 'Group-wide baseline established.',
      },
      {
        version: 2,
        effectiveFrom: '2026-01-01',
        recordedAt: '2025-12-15T10:00:00Z',
        changedBy: 'Group HR Council',
        note: 'Baseline sick leave raised to 10 days.',
      },
    ],
  },
  {
    id: 'pol-006',
    name: 'Legacy Chennai Policy',
    scope: { ...emptyScope, location: 'Chennai' },
    entitlementSummary: 'Superseded by India Standard v3',
    accrual: 'monthly',
    carryForwardCap: 6,
    version: 1,
    effectiveFrom: '2024-01-01',
    status: 'superseded',
    source: 'company',
    company: 'Satellite Tech India',
    versions: [
      {
        version: 1,
        effectiveFrom: '2024-01-01',
        recordedAt: '2023-12-14T09:30:00Z',
        changedBy: 'HR Ops',
        note: 'Original Chennai site policy.',
      },
    ],
  },
]
