/**
 * Impersonation ("login as user") — restricted to support users a Company
 * Admin has explicitly authorized (RSEC-06, RSEC-14) and fully audit-logged
 * (RSEC-07).
 */
export const SUPPORT_USERS = [
  'Platform Ops',
  'Neha Support',
  'Liam Helpdesk',
] as const
export type SupportUser = (typeof SUPPORT_USERS)[number]

/** The support persona acting when the Platform Admin role is selected. */
export const CURRENT_SUPPORT_USER: SupportUser = 'Platform Ops'

export interface ImpersonationAuth {
  id: string
  supportUser: SupportUser
  companyId: string
  grantedBy: string
  grantedOn: string
  status: 'Active' | 'Revoked'
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

export const seedImpersonationAuths: ImpersonationAuth[] = [
  {
    id: 'ia-01',
    supportUser: 'Platform Ops',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: '2026-05-10',
    status: 'Active',
  },
  {
    id: 'ia-02',
    supportUser: 'Neha Support',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: '2026-04-02',
    status: 'Active',
  },
  {
    id: 'ia-03',
    supportUser: 'Liam Helpdesk',
    companyId: 'co-1',
    grantedBy: 'Sunita Patil',
    grantedOn: '2026-03-15',
    status: 'Revoked',
  },
  {
    id: 'ia-04',
    supportUser: 'Platform Ops',
    companyId: 'co-2',
    grantedBy: 'Sara Fernandes',
    grantedOn: '2026-05-18',
    status: 'Active',
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
      {
        at: '2026-06-18T10:15:00',
        description: 'Re-submitted failed timesheet W24',
      },
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
        description: 'Reproduced leave-balance display issue',
      },
    ],
  },
]
