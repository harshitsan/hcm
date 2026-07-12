/**
 * Delegations and the approvals they route (RSEC-04, RSEC-05, RSEC-21).
 * Delegation is restricted to users of the same company; while active, the
 * workflow engine routes the owner's pending approvals to the delegate and
 * decisions capture both the original owner and the acting delegate.
 *
 * Delegation participants are records from the company directory
 * (`@/features/directory/data/directory`) so the org chart can show who is
 * delegating and who is acting, and the overlay can show the owner's
 * reporting context (manager above, direct reports below).
 *
 * The delegation list itself lives in a module-level external store (not
 * component state) so the Directory & Org Chart module can read it too.
 */
import {
  seedEmployees,
  type Employee,
} from '@/features/directory/data/directory'

export const DELEGATABLE_ACTIVITIES = [
  'Leave approvals',
  'Timesheet approvals',
  'Expense approvals',
  'Document acknowledgements',
] as const
export type DelegatableActivity = (typeof DELEGATABLE_ACTIVITIES)[number]

export type DelegationStatus = 'Active' | 'Revoked' | 'Expired'

export interface Delegation {
  id: string
  /** The user handing over their activities (directory employee id). */
  ownerId: string
  /** Must belong to the same company as the owner (RSEC-04). */
  delegateId: string
  companyId: string
  activities: DelegatableActivity[]
  startDate: string
  endDate: string | null
  status: DelegationStatus
}

export interface ApprovalItem {
  id: string
  activity: DelegatableActivity
  title: string
  requester: string
  /** The original approver the work belongs to (RSEC-21). */
  ownerId: string
  companyId: string
  status: 'Pending' | 'Approved' | 'Rejected'
  /** Who actually decided — may be a delegate acting on behalf (RSEC-05). */
  decidedById: string | null
  decidedOn: string | null
}

/* ---------- Directory-backed people helpers ---------- */

/** The signed-in Employee (User) persona's record in the company directory. */
export const CURRENT_DELEGATION_USER_ID = 'e-04'
/** Company whose delegations the Company Admin oversees. */
export const DELEGATION_COMPANY_ID = 'co-kensium'

export function delegationPersonById(
  id: string | null | undefined
): Employee | undefined {
  return seedEmployees.find((e) => e.id === id)
}

export function delegationPersonName(id: string | null | undefined): string {
  return delegationPersonById(id)?.name ?? '—'
}

/* ---------- Effective status (auto-expiry at read time) ---------- */

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** ISO date string N days from now — used so seed data stays demo-ready. */
function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Status computed at read time: an Active delegation whose end date has
 * passed is Expired, so approval rights return to the owner automatically —
 * no job or manual step is required.
 */
export function delegationEffectiveStatus(
  delegation: Delegation,
  today: string = todayIso()
): DelegationStatus {
  if (delegation.status !== 'Active') return delegation.status
  if (delegation.endDate && delegation.endDate < today) return 'Expired'
  return 'Active'
}

/** Whole days until the end date (0 = ends today); null if open-ended. */
export function daysUntilExpiry(
  delegation: Delegation,
  today: string = todayIso()
): number | null {
  if (!delegation.endDate) return null
  const diff =
    new Date(`${delegation.endDate}T00:00:00`).getTime() -
    new Date(`${today}T00:00:00`).getTime()
  return Math.round(diff / 86_400_000)
}

/* ---------- Seed data ---------- */

const seedDelegations: Delegation[] = [
  {
    // Owned by the current persona; ends within a week so the
    // "expires in N days" chip is always demonstrable.
    id: 'dlg-01',
    ownerId: 'e-04', // Daniel Kim, Engineering Manager
    delegateId: 'e-06', // Rohit Verma, Senior Software Engineer (his report)
    companyId: 'co-kensium',
    activities: ['Timesheet approvals'],
    startDate: isoDaysFromNow(-12),
    endDate: isoDaysFromNow(5),
    status: 'Active',
  },
  {
    id: 'dlg-02',
    ownerId: 'e-10', // Tomás Alvarez, HR Manager
    delegateId: 'e-04', // Daniel Kim — approvals route to the current persona
    companyId: 'co-kensium',
    activities: ['Leave approvals', 'Document acknowledgements'],
    startDate: isoDaysFromNow(-8),
    endDate: isoDaysFromNow(20),
    status: 'Active',
  },
  {
    id: 'dlg-03',
    ownerId: 'e-13', // Nina Kowalski, Finance Manager
    delegateId: 'e-06',
    companyId: 'co-kensium',
    activities: ['Expense approvals'],
    startDate: isoDaysFromNow(-60),
    endDate: isoDaysFromNow(-40),
    status: 'Revoked',
  },
  {
    // Stored as Active but the end date has passed — the read-time status
    // computation reports it Expired and rights are back with the owner.
    id: 'dlg-04',
    ownerId: 'e-05', // Elena Petrova, Engineering Manager
    delegateId: 'e-09', // Mei Chen, QA Lead
    companyId: 'co-kensium',
    activities: ['Leave approvals'],
    startDate: isoDaysFromNow(-30),
    endDate: isoDaysFromNow(-3),
    status: 'Active',
  },
]

export const seedApprovals: ApprovalItem[] = [
  {
    id: 'apr-01',
    activity: 'Leave approvals',
    title: 'Casual leave · 3 days (6–8 Aug)',
    requester: 'Sara Haddad',
    ownerId: 'e-10',
    companyId: 'co-kensium',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-02',
    activity: 'Document acknowledgements',
    title: 'Updated code-of-conduct policy',
    requester: 'HR Operations',
    ownerId: 'e-10',
    companyId: 'co-kensium',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-03',
    activity: 'Timesheet approvals',
    title: 'Weekly timesheet · W28',
    requester: 'Grace Osei',
    ownerId: 'e-04',
    companyId: 'co-kensium',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-04',
    activity: 'Timesheet approvals',
    title: 'Weekly timesheet · W27',
    requester: 'Rohit Verma',
    ownerId: 'e-04',
    companyId: 'co-kensium',
    status: 'Approved',
    decidedById: 'e-06',
    decidedOn: isoDaysFromNow(-5),
  },
  {
    id: 'apr-05',
    activity: 'Leave approvals',
    title: 'Sick leave · 1 day (7 Jul)',
    requester: 'Sara Haddad',
    ownerId: 'e-10',
    companyId: 'co-kensium',
    status: 'Approved',
    decidedById: 'e-04',
    decidedOn: isoDaysFromNow(-2),
  },
  {
    id: 'apr-06',
    activity: 'Expense approvals',
    title: 'Client travel reimbursement · ₹8,200',
    requester: 'Omar Farouk',
    ownerId: 'e-13',
    companyId: 'co-kensium',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
]

/* ---------- Module-level external delegation store ---------- */

let delegations: Delegation[] = seedDelegations
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** Current delegation list — stable reference until a mutation occurs. */
export function getDelegations(): Delegation[] {
  return delegations
}

export function subscribeDelegations(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function addDelegation(delegation: Delegation) {
  delegations = [delegation, ...delegations]
  emit()
}

export function markDelegationRevoked(id: string) {
  delegations = delegations.map((d) =>
    d.id === id ? { ...d, status: 'Revoked' } : d
  )
  emit()
}

/**
 * Active delegations involving a directory employee (as owner or delegate),
 * expiry applied at read time. Used by the org chart node detail panel.
 */
export function activeDelegationsInvolving(
  employeeId: string,
  list: Delegation[] = delegations
): Delegation[] {
  const today = todayIso()
  return list.filter(
    (d) =>
      delegationEffectiveStatus(d, today) === 'Active' &&
      (d.ownerId === employeeId || d.delegateId === employeeId)
  )
}
