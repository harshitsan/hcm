import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  EVENT_TYPE_LABELS,
  seedDeliveries,
  seedNotifications,
  type AppNotification,
  type DeliveryRecord,
  type EventTypeId,
} from '../data/notifications'

/**
 * In-memory notification-center + delivery-record store. Stands in for the
 * shared Notification/Template engine (NTF-21): "simulate event" mimics
 * event-driven dispatch, and delivery records capture per-channel outcomes
 * with retry / email-fallback / dead-letter handling (NTF-08, NTF-18, NTF-22).
 */
export function useNotifications() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>(seedNotifications)
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(seedDeliveries)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }, [])

  /**
   * Event-driven dispatch: the engine resolves recipients, channels and the
   * effective template at send time, then persists a delivery record.
   */
  const simulateEvent = useCallback((category: EventTypeId, title: string) => {
    const now = new Date().toISOString().slice(0, 19)
    const notification: AppNotification = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      category,
      title,
      body: `${title} — dispatched event-driven (no batching). The engine resolved your channel preferences with email enforced as mandatory.`,
      linkedItem: `Simulated event — ${EVENT_TYPE_LABELS[category]}`,
      createdAt: now,
      read: false,
    }
    const record: DeliveryRecord = {
      id: `DLV-${Math.floor(9000 + Math.random() * 900)}`,
      eventType: category,
      subject: title,
      recipient: 'you@satellitehr.com',
      recipientType: 'user',
      tenant: 'Northwind Retail Co.',
      templateVersion: 'Resolved at dispatch',
      createdAt: now,
      attempts: [
        { channel: 'in-app', status: 'delivered', timestamp: now },
        { channel: 'email', status: 'delivered', timestamp: now },
      ],
      finalStatus: 'delivered',
    }
    setNotifications((prev) => [notification, ...prev])
    setDeliveries((prev) => [record, ...prev])
    toast.success(
      `Engine dispatched "${title}" immediately: recipients, channels and the effective template were resolved at send time (email + in-app delivered).`
    )
  }, [])

  /** Scheduler-driven digest run: consolidates unread items, skips empty periods (NTF-09). */
  const runDigest = useCallback(() => {
    const eligible = notifications.filter(
      (n) => !n.read && n.category !== 'digest'
    )
    if (eligible.length === 0) {
      toast.info('No events accumulated this period — empty digest skipped.')
      return
    }
    const now = new Date().toISOString().slice(0, 19)
    const digest: AppNotification = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      category: 'digest',
      title: `Digest — ${eligible.length} update${eligible.length === 1 ? '' : 's'} consolidated`,
      body: `Scheduler-driven digest compiled ${eligible.length} accumulated notification(s) since the last run into a single summary, honoring your frequency preference.`,
      linkedItem: 'Digest (scheduler run)',
      createdAt: now,
      read: false,
    }
    setNotifications((prev) => [digest, ...prev])
    toast.success(
      `Digest compiled: ${eligible.length} notification(s) consolidated into one summary.`
    )
  }, [notifications])

  /** Retry a failed/pending channel attempt per the backoff policy (NTF-22). */
  const retryDelivery = useCallback((id: string) => {
    const now = new Date().toISOString().slice(0, 19)
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const retried = d.attempts.map((a) =>
          a.status === 'failed' || a.status === 'retrying' || a.status === 'pending'
            ? { ...a, status: 'delivered' as const, timestamp: now, error: undefined }
            : a
        )
        return { ...d, attempts: retried, finalStatus: 'delivered' }
      })
    )
    toast.success(`${id}: retry succeeded — all channels delivered.`)
  }, [])

  /** Fail over a stuck non-email channel to guaranteed email (NTF-01, NTF-22). */
  const fallbackToEmail = useCallback((id: string) => {
    const now = new Date().toISOString().slice(0, 19)
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        return {
          ...d,
          attempts: [
            ...d.attempts,
            { channel: 'email', status: 'delivered', timestamp: now },
          ],
          finalStatus: 'delivered',
        }
      })
    )
    toast.success(`${id}: fell back to mandatory email — notification not lost.`)
  }, [])

  /** Re-drive a dead-lettered notification after admin review (NTF-22). */
  const resolveDeadLetter = useCallback((id: string) => {
    const now = new Date().toISOString().slice(0, 19)
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.finalStatus !== 'dead-letter') return d
        return {
          ...d,
          attempts: [
            ...d.attempts,
            { channel: 'email', status: 'delivered', timestamp: now },
          ],
          finalStatus: 'delivered',
        }
      })
    )
    toast.success(`${id}: re-driven from the dead-letter store via email.`)
  }, [])

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    simulateEvent,
    runDigest,
    deliveries,
    retryDelivery,
    fallbackToEmail,
    resolveDeadLetter,
  }
}
