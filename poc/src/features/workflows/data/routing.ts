/**
 * Routing decision table (WFE-02, WFE-23). Rows are governed metadata keyed
 * by company / jurisdiction / location / department / group / transaction
 * type. Evaluation is deterministic: ascending priority, first match wins;
 * the default row catches everything else.
 */

export interface RoutingRule {
  id: string
  priority: number
  transactionType: string
  company: string
  jurisdiction: string
  location: string
  department: string
  orgGroup: string
  /** Workflow definition (by name) the matching transaction routes to. */
  routeTo: string
  isDefault: boolean
  updatedBy: string
  updatedAt: string
}

export const ANY = 'Any'

export const seedRoutingRules: RoutingRule[] = [
  {
    id: 'rt-01',
    priority: 1,
    transactionType: 'Overtime',
    company: 'Aurora Foods',
    jurisdiction: 'India',
    location: 'Chennai',
    department: 'Operations',
    orgGroup: 'Aurora Group',
    routeTo: 'Overtime Approval — Plants',
    isDefault: false,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-12',
  },
  {
    id: 'rt-02',
    priority: 2,
    transactionType: 'Overtime',
    company: 'Aurora Foods',
    jurisdiction: 'India',
    location: ANY,
    department: ANY,
    orgGroup: 'Aurora Group',
    routeTo: 'Overtime Approval — Plants',
    isDefault: false,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-12',
  },
  {
    id: 'rt-03',
    priority: 3,
    transactionType: 'Leave Request',
    company: 'Aurora Foods',
    jurisdiction: ANY,
    location: ANY,
    department: ANY,
    orgGroup: 'Aurora Group',
    routeTo: 'Leave Approval — Standard',
    isDefault: false,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-04-01',
  },
  {
    id: 'rt-04',
    priority: 4,
    transactionType: 'Expense Claim',
    company: 'Aurora Foods',
    jurisdiction: 'India',
    location: ANY,
    department: 'Sales',
    orgGroup: ANY,
    routeTo: 'Expense Claim — Under ₹50k',
    isDefault: false,
    updatedBy: 'Farhan Ali',
    updatedAt: '2025-09-15',
  },
  {
    id: 'rt-05',
    priority: 5,
    transactionType: 'Expense Claim',
    company: 'Aurora Foods',
    jurisdiction: ANY,
    location: ANY,
    department: ANY,
    orgGroup: ANY,
    routeTo: 'Expense Claim — Under ₹50k',
    isDefault: false,
    updatedBy: 'Farhan Ali',
    updatedAt: '2025-09-15',
  },
  {
    id: 'rt-06',
    priority: 6,
    transactionType: 'Work From Home',
    company: 'Aurora Fresh Retail',
    jurisdiction: 'India',
    location: ANY,
    department: ANY,
    orgGroup: 'Aurora Group',
    routeTo: 'WFH Approval — Retail',
    isDefault: false,
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-01-02',
  },
  {
    id: 'rt-07',
    priority: 7,
    transactionType: 'Exit Clearance',
    company: 'Aurora Foods',
    jurisdiction: ANY,
    location: ANY,
    department: ANY,
    orgGroup: ANY,
    routeTo: 'Exit Clearance — Corporate',
    isDefault: false,
    updatedBy: 'Sunita Patil',
    updatedAt: '2025-11-01',
  },
  {
    id: 'rt-08',
    priority: 8,
    transactionType: 'Confirmation',
    company: 'Northwind Logistics',
    jurisdiction: 'United States',
    location: 'Austin',
    department: ANY,
    orgGroup: ANY,
    routeTo: 'Confirmation Review — Logistics',
    isDefault: false,
    updatedBy: 'Devika Rao',
    updatedAt: '2025-08-03',
  },
  {
    id: 'rt-09',
    priority: 9,
    transactionType: 'Layoff',
    company: 'Zenith Software',
    jurisdiction: 'United Kingdom',
    location: ANY,
    department: ANY,
    orgGroup: ANY,
    routeTo: 'Layoff Approval — Zenith',
    isDefault: false,
    updatedBy: 'Devika Rao',
    updatedAt: '2025-10-01',
  },
  {
    id: 'rt-10',
    priority: 99,
    transactionType: ANY,
    company: ANY,
    jurisdiction: ANY,
    location: ANY,
    department: ANY,
    orgGroup: ANY,
    routeTo: 'Leave Approval — Standard',
    isDefault: true,
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-04-01',
  },
]

export interface RoutingCandidate {
  transactionType: string
  company: string
  jurisdiction: string
  location: string
  department: string
  orgGroup: string
}

/**
 * Deterministic evaluation: rules sorted by ascending priority; a rule
 * matches when every attribute is 'Any' or equal; the default row is the
 * terminal fallback (WFE-02).
 */
export function evaluateRouting(
  rules: RoutingRule[],
  tx: RoutingCandidate
): { rule: RoutingRule; matchedOnDefault: boolean } | null {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const fields = [
    'transactionType',
    'company',
    'jurisdiction',
    'location',
    'department',
    'orgGroup',
  ] as const
  const match = sorted.find((rule) =>
    fields.every((f) => rule[f] === ANY || rule[f] === tx[f])
  )
  if (!match) return null
  return { rule: match, matchedOnDefault: match.isDefault }
}
