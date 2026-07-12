/**
 * Impersonation ("login as user") — view-only, restricted to support users a
 * Company Admin has explicitly authorized (RSEC-06, RSEC-14) and fully
 * audit-logged (RSEC-07). Authorizations are requested by support staff,
 * approved or denied by the Company Admin, and expire automatically.
 */
export const SUPPORT_USERS = [
  'Platform Ops',
  'Neha Support',
  'Liam Helpdesk',
] as const
export type SupportUser = (typeof SUPPORT_USERS)[number]

/** The support persona acting when the Platform Admin role is selected. */
export const CURRENT_SUPPORT_USER: SupportUser = 'Platform Ops'

export const IMPERSONATION_DURATIONS = [
  '4 hours',
  '24 hours',
  '7 days',
] as const
export type ImpersonationDuration = (typeof IMPERSONATION_DURATIONS)[number]

const DURATION_MS: Record<ImpersonationDuration, number> = {
  '4 hours': 4 * 3_600_000,
  '24 hours': 24 * 3_600_000,
  '7 days': 7 * 86_400_000,
}

/** Expiry timestamp (ISO) for an authorization granted now. */
export function expiryFromDuration(duration: ImpersonationDuration): string {
  return new Date(Date.now() + DURATION_MS[duration]).toISOString()
}

export type ImpersonationAuthStatus = 'Active' | 'Revoked' | 'Expired'

export interface ImpersonationAuth {
  id: string
  supportUser: SupportUser
  companyId: string
  grantedBy: string
  grantedOn: string
  /** ISO timestamp after which the authorization no longer works. */
  expiresOn: string | null
  status: ImpersonationAuthStatus
}

/**
 * Status computed at read time: an Active authorization past its expiry is
 * Expired and can no longer start sessions — no job or manual step needed.
 */
export function authEffectiveStatus(
  auth: ImpersonationAuth,
  nowIso: string = new Date().toISOString()
): ImpersonationAuthStatus {
  if (auth.status !== 'Active') return auth.status
  if (auth.expiresOn && auth.expiresOn < nowIso) return 'Expired'
  return 'Active'
}

export type ImpersonationRequestStatus = 'Pending' | 'Approved' | 'Denied'

/** A support user's request to be authorized for a company (RSEC-14). */
export interface ImpersonationRequest {
  id: string
  supportUser: SupportUser
  companyId: string
  reason: string
  requestedOn: string
  duration: ImpersonationDuration
  status: ImpersonationRequestStatus
  decidedBy?: string
  decidedOn?: string
  denialReason?: string
}

export interface ImpersonationAction {
  at: string
  description: string
}

export interface ImpersonationSession {
  id: string
  supportUser: SupportUser
  targetPersonId: string
  companyId: string
  startedAt: string
  endedAt: string | null
  actions: ImpersonationAction[]
}

/** Sessions are view-only — these are the actions a support user can take. */
export const VIEW_ONLY_ACTIONS = [
  'Viewed My Payslips screen',
  'Viewed leave balance',
  'Opened profile',
  'Viewed timesheet',
] as const

/** ISO timestamp offset by whole days — keeps seed data demo-ready. */
function isoFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

export const seedImpersonationAuths: ImpersonationAuth[] = [
  {
    id: 'ia-01',
    supportUser: 'Platform Ops',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: isoFromNow(-2).slice(0, 10),
    expiresOn: isoFromNow(5),
    status: 'Active',
  },
  {
    // Stored as Active but past its expiry — the read-time status reports
    // Expired and any impersonation attempt is denied.
    id: 'ia-02',
    supportUser: 'Neha Support',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: isoFromNow(-9).slice(0, 10),
    expiresOn: isoFromNow(-2),
    status: 'Active',
  },
  {
    id: 'ia-03',
    supportUser: 'Liam Helpdesk',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: '2026-03-15',
    expiresOn: '2026-03-22T09:00:00.000Z',
    status: 'Revoked',
  },
  {
    id: 'ia-04',
    supportUser: 'Platform Ops',
    companyId: 'co-2',
    grantedBy: 'Sara Fernandes',
    grantedOn: isoFromNow(-1).slice(0, 10),
    expiresOn: isoFromNow(6),
    status: 'Active',
  },
]

export const seedImpersonationRequests: ImpersonationRequest[] = [
  {
    id: 'ir-01',
    supportUser: 'Liam Helpdesk',
    companyId: 'co-1',
    reason: 'Employee reports their payslip screen shows a blank page',
    requestedOn: isoFromNow(-1).slice(0, 10),
    duration: '24 hours',
    status: 'Pending',
  },
  {
    id: 'ir-02',
    supportUser: 'Platform Ops',
    companyId: 'co-1',
    reason: 'Verify a leave-balance discrepancy reported by an employee',
    requestedOn: isoFromNow(-2).slice(0, 10),
    duration: '7 days',
    status: 'Approved',
    decidedBy: 'Sunita Patil',
    decidedOn: isoFromNow(-2).slice(0, 10),
  },
  {
    id: 'ir-03',
    supportUser: 'Neha Support',
    companyId: 'co-1',
    reason: 'General account review',
    requestedOn: '2026-06-02',
    duration: '7 days',
    status: 'Denied',
    decidedBy: 'Sunita Patil',
    decidedOn: '2026-06-03',
    denialReason: 'No open support ticket references this account.',
  },
]

export const seedImpersonationSessions: ImpersonationSession[] = [
  {
    id: 'is-01',
    supportUser: 'Neha Support',
    targetPersonId: 'emp-02',
    companyId: 'co-1',
    startedAt: '2026-06-18T10:05:00',
    endedAt: '2026-06-18T10:22:00',
    actions: [
      { at: '2026-06-18T10:08:00', description: 'Viewed My Payslips screen' },
      { at: '2026-06-18T10:15:00', description: 'Viewed timesheet' },
    ],
  },
  {
    id: 'is-02',
    supportUser: 'Platform Ops',
    targetPersonId: 'emp-05',
    companyId: 'co-2',
    startedAt: '2026-06-24T15:40:00',
    endedAt: '2026-06-24T15:52:00',
    actions: [
      {
        at: '2026-06-24T15:44:00',
        description: 'Viewed leave balance',
      },
    ],
  },
]
