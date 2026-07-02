/**
 * Delegations and the approvals they route (RSEC-04, RSEC-05, RSEC-21).
 * Delegation is restricted to users of the same company; while active, the
 * workflow engine routes the owner's pending approvals to the delegate and
 * decisions capture both the original owner and the acting delegate.
 */
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
  /** The user handing over their activities. */
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

export const seedDelegations: Delegation[] = [
  {
    id: 'dlg-01',
    ownerId: 'emp-01',
    delegateId: 'emp-02',
    companyId: 'co-1',
    activities: ['Timesheet approvals'],
    startDate: '2026-06-20',
    endDate: null,
    status: 'Active',
  },
  {
    id: 'dlg-02',
    ownerId: 'emp-03',
    delegateId: 'emp-01',
    companyId: 'co-1',
    activities: ['Leave approvals', 'Document acknowledgements'],
    startDate: '2026-06-25',
    endDate: '2026-07-15',
    status: 'Active',
  },
  {
    id: 'dlg-03',
    ownerId: 'emp-04',
    delegateId: 'emp-02',
    companyId: 'co-1',
    activities: ['Expense approvals'],
    startDate: '2026-05-01',
    endDate: '2026-05-20',
    status: 'Revoked',
  },
  {
    id: 'dlg-04',
    ownerId: 'emp-05',
    delegateId: 'emp-07',
    companyId: 'co-2',
    activities: ['Leave approvals'],
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'Expired',
  },
]

export const seedApprovals: ApprovalItem[] = [
  {
    id: 'apr-01',
    activity: 'Leave approvals',
    title: 'Casual leave · 3 days (6–8 Jul)',
    requester: 'Rohan Verma',
    ownerId: 'emp-03',
    companyId: 'co-1',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-02',
    activity: 'Document acknowledgements',
    title: 'Updated code-of-conduct policy',
    requester: 'HR Operations',
    ownerId: 'emp-03',
    companyId: 'co-1',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-03',
    activity: 'Timesheet approvals',
    title: 'Weekly timesheet · W26',
    requester: 'Tanvi Desai',
    ownerId: 'emp-01',
    companyId: 'co-1',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-04',
    activity: 'Timesheet approvals',
    title: 'Weekly timesheet · W25',
    requester: 'Kabir Shah',
    ownerId: 'emp-01',
    companyId: 'co-1',
    status: 'Approved',
    decidedById: 'emp-02',
    decidedOn: '2026-06-23',
  },
  {
    id: 'apr-05',
    activity: 'Leave approvals',
    title: 'Sick leave · 1 day (24 Jun)',
    requester: 'Tanvi Desai',
    ownerId: 'emp-03',
    companyId: 'co-1',
    status: 'Approved',
    decidedById: 'emp-01',
    decidedOn: '2026-06-26',
  },
  {
    id: 'apr-06',
    activity: 'Expense approvals',
    title: 'Client travel reimbursement · ₹8,200',
    requester: 'Rohan Verma',
    ownerId: 'emp-04',
    companyId: 'co-1',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
  {
    id: 'apr-07',
    activity: 'Leave approvals',
    title: 'Earned leave · 5 days (13–17 Jul)',
    requester: 'Nikhil Rao',
    ownerId: 'emp-07',
    companyId: 'co-2',
    status: 'Pending',
    decidedById: null,
    decidedOn: null,
  },
]
