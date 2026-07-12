/**
 * Mobile push event feed (F7): the notification engine emits push events onto
 * a stream the separate mobile app consumes. Push delivery itself is the app
 * team's concern — this side only guarantees the events are emitted.
 */

export interface PushEvent {
  id: string
  /** Emitted event name, e.g. approval.requested. */
  event: string
  targetUser: string
  payloadSummary: string
  emittedAt: string
}

export const seedPushEvents: PushEvent[] = [
  {
    id: 'PSH-7001',
    event: 'approval.requested',
    targetUser: 'Dana Whitfield',
    payloadSummary: 'Leave request LR-2214 — Priya Nair, 3 days (14–16 Jul)',
    emittedAt: '2026-07-02T09:42:04',
  },
  {
    id: 'PSH-7002',
    event: 'approval.requested',
    targetUser: 'Dana Whitfield',
    payloadSummary: 'Expense claim EXP-0981 — Marcus Lane, $412.80',
    emittedAt: '2026-07-02T08:15:02',
  },
  {
    id: 'PSH-7003',
    event: 'escalation.raised',
    targetUser: 'Dana Whitfield',
    payloadSummary: 'Timesheet TS-4471 overdue 5 days — escalation level 1',
    emittedAt: '2026-07-01T18:00:02',
  },
  {
    id: 'PSH-7004',
    event: 'escalation.raised',
    targetUser: 'Rachel Kim',
    payloadSummary: 'Onboarding task OB-118 unattended — escalation level 2',
    emittedAt: '2026-07-01T09:30:01',
  },
  {
    id: 'PSH-7005',
    event: 'workflow.status_changed',
    targetUser: 'Marcus Lane',
    payloadSummary: 'Travel request TR-0332 — Pending Approval → Approved',
    emittedAt: '2026-06-30T16:20:03',
  },
  {
    id: 'PSH-7006',
    event: 'lifecycle.joiner_upcoming',
    targetUser: 'Dana Whitfield',
    payloadSummary: 'Sofia Reyes joins 07 Jul — pre-joining checklist assigned',
    emittedAt: '2026-06-27T14:30:10',
  },
  {
    id: 'PSH-7007',
    event: 'lifecycle.role_change',
    targetUser: 'Priya Nair',
    payloadSummary: 'Role change effective 01 Aug — Senior Analyst → Team Lead',
    emittedAt: '2026-06-28T10:00:00',
  },
  {
    id: 'PSH-7008',
    event: 'escalation.critical',
    targetUser: 'Dana Whitfield',
    payloadSummary: 'Payroll batch PB-0712 — sign-off needed before 06:00 cutoff',
    emittedAt: '2026-07-11T23:05:00',
  },
]
