import { useCallback, useState } from 'react'
import {
  seedAudit,
  seedNotifications,
  type AuditEvent,
  type LifecycleNotification,
} from '../data/audit'
import { shortId } from '../data/shared'

export type LogInput = Omit<AuditEvent, 'id' | 'timestamp'>

export interface LifecycleLog {
  events: AuditEvent[]
  notifications: LifecycleNotification[]
  logEvent: (input: LogInput) => void
  notify: (input: Omit<LifecycleNotification, 'id' | 'sentAt'>) => void
}

/**
 * Append-only in-memory audit trail + templated notification feed.
 * Every lifecycle action funnels through logEvent; the store exposes no
 * update/delete, mirroring the immutable audit-store requirement.
 */
export function useLifecycleLog(): LifecycleLog {
  const [events, setEvents] = useState<AuditEvent[]>(seedAudit)
  const [notifications, setNotifications] =
    useState<LifecycleNotification[]>(seedNotifications)

  const logEvent = useCallback((input: LogInput) => {
    const event: AuditEvent = {
      ...input,
      id: shortId('evt'),
      timestamp: new Date().toISOString(),
    }
    setEvents((prev) => [event, ...prev])
  }, [])

  const notify = useCallback(
    (input: Omit<LifecycleNotification, 'id' | 'sentAt'>) => {
      const notification: LifecycleNotification = {
        ...input,
        id: shortId('ntf'),
        sentAt: new Date().toISOString(),
      }
      setNotifications((prev) => [notification, ...prev])
      // The notification engine records every dispatch in the audit trail.
      logEvent({
        company: 'Aurora Software India',
        module: 'Notification',
        action: 'Notification dispatched',
        target: `${input.recipient} · ${input.title}`,
        actor: 'System (notification engine)',
        actorRole: 'Platform Admin',
        outcome: `Template rendered (${input.kind}) and sent`,
        onBehalfOf: null,
      })
    },
    [logEvent]
  )

  return { events, notifications, logEvent, notify }
}
