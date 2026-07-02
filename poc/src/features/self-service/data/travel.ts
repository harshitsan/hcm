export const TRAVEL_STATUSES = [
  'Initiated',
  'Approved',
  'Travel Coordinator Confirmed',
  'Completed',
  'Rejected',
  'Cancelled',
] as const
export type TravelStatus = (typeof TRAVEL_STATUSES)[number]

/** Business travel requests with a requested advance (ESS-26). */
export interface TravelRequest {
  id: string
  title: string
  destination: string
  fromDate: string
  toDate: string
  purpose: string
  requestedAdvance: number
  status: TravelStatus
  appliedOn: string
}

export const seedTravelRequests: TravelRequest[] = [
  { id: 'tr-01', title: 'Acme retail — go-live support', destination: 'Mumbai', fromDate: '2026-07-14', toDate: '2026-07-18', purpose: 'On-site go-live support for storefront release', requestedAdvance: 28000, status: 'Initiated', appliedOn: '2026-06-25' },
  { id: 'tr-02', title: 'Northwind quarterly review', destination: 'Singapore', fromDate: '2026-07-27', toDate: '2026-07-30', purpose: 'QBR with client engineering leadership', requestedAdvance: 85000, status: 'Approved', appliedOn: '2026-06-18' },
  { id: 'tr-03', title: 'Hyderabad DC migration', destination: 'Hyderabad', fromDate: '2026-06-09', toDate: '2026-06-11', purpose: 'Data centre cut-over supervision', requestedAdvance: 15000, status: 'Completed', appliedOn: '2026-05-28' },
  { id: 'tr-04', title: 'Kensium tech summit', destination: 'Chennai', fromDate: '2026-08-05', toDate: '2026-08-07', purpose: 'Internal engineering summit — speaker', requestedAdvance: 12000, status: 'Travel Coordinator Confirmed', appliedOn: '2026-06-20' },
  { id: 'tr-05', title: 'Prospect demo — BFSI', destination: 'Pune', fromDate: '2026-05-19', toDate: '2026-05-20', purpose: 'Pre-sales solution demo', requestedAdvance: 9000, status: 'Rejected', appliedOn: '2026-05-12' },
]

export const EXPENSE_STATUSES = [
  'Settlement Pending from Employee',
  'Settlement Pending from Finance',
  'Settled and Closed',
] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

/** Actual trip expenses tracked to settlement (ESS-27). */
export interface TripExpense {
  id: string
  title: string
  amount: number
  addedOn: string
  details: string
  status: ExpenseStatus
  /** Pending step surfaced in the task column (ESS-39). */
  task: string | null
}

export const seedExpenses: TripExpense[] = [
  { id: 'ex-01', title: 'Hyderabad DC migration — hotel & cabs', amount: 13450, addedOn: '2026-06-13', details: '3 nights Lemon Tree + airport transfers', status: 'Settlement Pending from Employee', task: 'Acknowledge settlement' },
  { id: 'ex-02', title: 'Hyderabad DC migration — meals', amount: 2680, addedOn: '2026-06-13', details: 'Per-diem overage with bills', status: 'Settlement Pending from Finance', task: null },
  { id: 'ex-03', title: 'Client workshop supplies', amount: 1890, addedOn: '2026-05-22', details: 'Printing and workshop material', status: 'Settled and Closed', task: null },
  { id: 'ex-04', title: 'Pune demo — travel', amount: 7420, addedOn: '2026-05-21', details: 'Flight + one hotel night', status: 'Settled and Closed', task: null },
]

export const ADVANCE_STATUSES = [
  'Pending Approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number]

/** Advance expense requests raised before travel (ESS-28). */
export interface AdvanceExpense {
  id: string
  title: string
  requestedAdvance: number
  addedOn: string
  /** Actual expenses reconciled against the advance so far. */
  expenses: number
  status: AdvanceStatus
}

export const seedAdvanceExpenses: AdvanceExpense[] = [
  { id: 'ad-01', title: 'Advance — Mumbai go-live trip', requestedAdvance: 28000, addedOn: '2026-06-25', expenses: 0, status: 'Pending Approval' },
  { id: 'ad-02', title: 'Advance — Singapore QBR', requestedAdvance: 85000, addedOn: '2026-06-18', expenses: 0, status: 'Approved' },
  { id: 'ad-03', title: 'Advance — Hyderabad DC migration', requestedAdvance: 15000, addedOn: '2026-05-28', expenses: 16130, status: 'Approved' },
  { id: 'ad-04', title: 'Advance — Pune demo', requestedAdvance: 9000, addedOn: '2026-05-12', expenses: 0, status: 'Rejected' },
]
