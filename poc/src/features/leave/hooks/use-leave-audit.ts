import { useCallback, useState } from 'react'
import { shortId } from '../data/shared'

/**
 * Append-only audit trail (LVE-08) + template-driven notification feed
 * (LVE-27, LVE-48). Entries are never mutated or removed — the store only
 * exposes `append`, which keeps the trail immutable by construction.
 */

export interface AuditEntry {
  id: string
  at: string
  actor: string
  actorRole: string
  action: string
  target: string
  before: string
  after: string
  reason: string
}

export interface NotificationEvent {
  id: string
  at: string
  event: string
  recipients: string
  channel: string
  message: string
}

const seedAudit: AuditEntry[] = [
  {
    id: 'aud-1',
    at: '2026-06-20T09:05:00Z',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    action: 'Delegated approval',
    target: 'lr-2007 · Ananya Sharma',
    before: 'Pending with Rahul Menon',
    after: 'Approved by Sunita Patil (delegate)',
    reason: 'Active delegation window 15 Jun – 05 Jul.',
  },
  {
    id: 'aud-2',
    at: '2026-06-23T09:00:00Z',
    actor: 'Workflow Engine',
    actorRole: 'Platform Admin',
    action: 'SLA escalation',
    target: 'lr-2010 · Sunita Patil',
    before: 'Pending with Rahul Menon (48h SLA)',
    after: 'Reassigned to Escalation: Dept Head',
    reason: 'No approver action within the configured SLA.',
  },
  {
    id: 'aud-3',
    at: '2026-06-24T14:30:00Z',
    actor: 'Sunita Patil',
    actorRole: 'Company Admin',
    action: 'Balance override',
    target: 'Priya Iyer · Sick / Medical Leave',
    before: 'Credited: 88 hours',
    after: 'Credited: 96 hours',
    reason: 'Payroll migration shortfall — restored statutory sick hours.',
  },
]

const seedNotifications: NotificationEvent[] = [
  {
    id: 'ntf-1',
    at: '2026-06-28T09:12:00Z',
    event: 'Submitted',
    recipients: 'Rahul Menon (approver), Priya Iyer (peer)',
    channel: 'Email + In-app',
    message:
      'Leave submitted: Ananya Sharma — Privileged / Annual Leave, 20 Jul to 24 Jul. Status: Pending.',
  },
  {
    id: 'ntf-2',
    at: '2026-06-23T09:00:00Z',
    event: 'Escalated',
    recipients: 'Dept Head (escalation approver), Sunita Patil (applicant)',
    channel: 'Email',
    message:
      'Leave escalated: Sunita Patil — Privileged / Annual Leave. SLA of 48h breached at level 1.',
  },
]

export function useLeaveAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>(seedAudit)
  const [notifications, setNotifications] =
    useState<NotificationEvent[]>(seedNotifications)

  const append = useCallback(
    (input: Omit<AuditEntry, 'id' | 'at'>) => {
      setEntries((prev) => [
        { ...input, id: shortId('aud'), at: new Date().toISOString() },
        ...prev,
      ])
    },
    []
  )

  /** Renders the configured template for the event and "delivers" it. */
  const notify = useCallback(
    (event: string, recipients: string, message: string, channel = 'Email + In-app') => {
      setNotifications((prev) => [
        {
          id: shortId('ntf'),
          at: new Date().toISOString(),
          event,
          recipients,
          channel,
          message,
        },
        ...prev,
      ])
    },
    []
  )

  return { entries, notifications, append, notify }
}

export type LeaveAuditStore = ReturnType<typeof useLeaveAudit>
