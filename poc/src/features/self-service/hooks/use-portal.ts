import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAnnouncements,
  seedDocuments,
  seedFeedback,
  seedSectionPolicies,
  type PortalAnnouncement,
  type SectionPolicy,
} from '../data/portal'

/**
 * In-memory portal store: targeted announcements (ESS-06/17), authorized
 * documents and feedback actions (ESS-07), plus the role/policy section
 * access matrix Company Admins configure (ESS-08/11).
 */
export function usePortal() {
  const [announcements, setAnnouncements] =
    useState<PortalAnnouncement[]>(seedAnnouncements)
  const [documents] = useState(seedDocuments)
  const [feedback, setFeedback] = useState(seedFeedback)
  const [policies, setPolicies] =
    useState<SectionPolicy[]>(seedSectionPolicies)

  /** Notification-engine targeting: only announcements aimed at me (ESS-17). */
  const myAnnouncements = useMemo(
    () => announcements.filter((a) => a.targetsMe),
    [announcements]
  )
  const unreadCount = useMemo(
    () => myAnnouncements.filter((a) => !a.read).length,
    [myAnnouncements]
  )

  const markRead = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    )
  }, [])

  const submitFeedback = useCallback((id: string) => {
    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'Submitted' } : f))
    )
    toast.success('Feedback submitted — thank you')
  }, [])

  const policyFor = useCallback(
    (id: string): SectionPolicy | undefined =>
      policies.find((p) => p.id === id),
    [policies]
  )

  /** Company Admin toggles view/manage per section (ESS-08/11). */
  const setPolicy = useCallback(
    (id: string, patch: Partial<Pick<SectionPolicy, 'view' | 'manage'>>) => {
      setPolicies((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const next = { ...p, ...patch }
          // Removing view access also removes manage access.
          if (!next.view) next.manage = false
          return next
        })
      )
      toast.success(
        'Authorization scope saved — applies to subsequent self-service sessions'
      )
    },
    []
  )

  return {
    announcements,
    myAnnouncements,
    unreadCount,
    markRead,
    documents,
    feedback,
    submitFeedback,
    policies,
    policyFor,
    setPolicy,
  }
}

export type PortalStore = ReturnType<typeof usePortal>
