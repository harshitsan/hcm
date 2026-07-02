/**
 * Immutable append-only audit store for security events (RSEC-17) and the
 * notification feed the template engine produces for sensitive events
 * (RSEC-22). Records are only ever appended — edits and deletes are
 * rejected by the store hook.
 */
export const AUDIT_CATEGORIES = [
  'Impersonation',
  'Context Switch',
  'Delegation',
  'Role Change',
  'Sign-in',
  'Config',
  'Job',
] as const
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

export interface AuditEvent {
  id: string
  at: string
  category: AuditCategory
  actor: string
  actorRole: string
  target: string
  sourceCompanyId: string | null
  targetCompanyId: string | null
  detail: string
  /** Flagged when the action was performed under impersonation (RSEC-07). */
  underImpersonation: boolean
}

export interface SecurityNotification {
  id: string
  at: string
  event: string
  /** Governed template the message was rendered from (RSEC-22). */
  template: string
  recipients: string[]
  companyId: string
}

export const seedAuditEvents: AuditEvent[] = [
  {
    id: 'aud-901',
    at: '2026-06-18T10:05:00',
    category: 'Impersonation',
    actor: 'Neha Support',
    actorRole: 'Platform Admin',
    target: 'Rohan Verma',
    sourceCompanyId: null,
    targetCompanyId: 'co-1',
    detail: 'Impersonation session started (support ticket #4821)',
    underImpersonation: false,
  },
  {
    id: 'aud-902',
    at: '2026-06-18T10:15:00',
    category: 'Impersonation',
    actor: 'Neha Support',
    actorRole: 'Platform Admin',
    target: 'Rohan Verma',
    sourceCompanyId: null,
    targetCompanyId: 'co-1',
    detail: 'Re-submitted failed timesheet W24',
    underImpersonation: true,
  },
  {
    id: 'aud-903',
    at: '2026-06-18T10:22:00',
    category: 'Impersonation',
    actor: 'Neha Support',
    actorRole: 'Platform Admin',
    target: 'Rohan Verma',
    sourceCompanyId: null,
    targetCompanyId: 'co-1',
    detail: 'Impersonation session ended — returned to own context',
    underImpersonation: false,
  },
  {
    id: 'aud-904',
    at: '2026-06-20T09:02:00',
    category: 'Delegation',
    actor: 'Ananya Sharma',
    actorRole: 'Employee (User)',
    target: 'Rohan Verma',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Delegated timesheet approvals (open-ended)',
    underImpersonation: false,
  },
  {
    id: 'aud-905',
    at: '2026-06-22T14:31:00',
    category: 'Context Switch',
    actor: 'Devika Rao',
    actorRole: 'Portfolio Admin',
    target: 'Company context',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-3',
    detail: 'Switched active company: Aurora Software → Cedar Retail',
    underImpersonation: false,
  },
  {
    id: 'aud-906',
    at: '2026-06-23T11:12:00',
    category: 'Role Change',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    target: 'Company HR Manager',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Published role version v2 — added timesheet approval permission',
    underImpersonation: false,
  },
  {
    id: 'aud-907',
    at: '2026-06-24T15:40:00',
    category: 'Impersonation',
    actor: 'Platform Ops',
    actorRole: 'Platform Admin',
    target: 'Divya Pillai',
    sourceCompanyId: null,
    targetCompanyId: 'co-2',
    detail: 'Impersonation session started (support ticket #4903)',
    underImpersonation: false,
  },
  {
    id: 'aud-908',
    at: '2026-06-24T16:20:00',
    category: 'Context Switch',
    actor: 'Arjun Mehta',
    actorRole: 'Group Company Admin',
    target: 'Company context',
    sourceCompanyId: 'co-2',
    targetCompanyId: 'co-1',
    detail: 'Switched active company: Northwind Analytics → Aurora Software',
    underImpersonation: false,
  },
  {
    id: 'aud-909',
    at: '2026-06-25T08:45:00',
    category: 'Sign-in',
    actor: 'Kabir Shah',
    actorRole: 'Employee (User)',
    target: 'Own account',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Account locked after 5 consecutive failed attempts',
    underImpersonation: false,
  },
  {
    id: 'aud-910',
    at: '2026-06-25T09:10:00',
    category: 'Config',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    target: 'Password policy',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Lowered reactivation cooldown from 48 to 24 hours',
    underImpersonation: false,
  },
  {
    id: 'aud-911',
    at: '2026-06-26T12:20:00',
    category: 'Delegation',
    actor: 'Meera Iyer',
    actorRole: 'Employee (User)',
    target: 'Ananya Sharma',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Delegated leave approvals until 15 Jul 2026',
    underImpersonation: false,
  },
  {
    id: 'aud-912',
    at: '2026-06-28T07:00:00',
    category: 'Job',
    actor: 'Scheduler',
    actorRole: 'System',
    target: 'Utilization job',
    sourceCompanyId: 'co-1',
    targetCompanyId: 'co-1',
    detail: 'Weekly utilization job completed — 214 records processed',
    underImpersonation: false,
  },
]

export const seedNotifications: SecurityNotification[] = [
  {
    id: 'ntf-01',
    at: '2026-06-18T10:05:00',
    event: 'Impersonation started',
    template: 'security/impersonation-start',
    recipients: ['Sunita Patil (Company Admin)', 'Meera Iyer (HR Manager)'],
    companyId: 'co-1',
  },
  {
    id: 'ntf-02',
    at: '2026-06-22T14:31:00',
    event: 'Company context switch',
    template: 'security/context-switch',
    recipients: ['Platform Security Desk'],
    companyId: 'co-3',
  },
  {
    id: 'ntf-03',
    at: '2026-06-24T15:40:00',
    event: 'Impersonation started',
    template: 'security/impersonation-start',
    recipients: ['Sara Fernandes (Company Admin)'],
    companyId: 'co-2',
  },
  {
    id: 'ntf-04',
    at: '2026-06-25T08:45:00',
    event: 'Account lockout',
    template: 'security/account-lockout',
    recipients: ['Sunita Patil (Company Admin)'],
    companyId: 'co-1',
  },
]
