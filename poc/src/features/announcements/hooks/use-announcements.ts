import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAnnouncements,
  type Announcement,
  type AnnouncementStatus,
  type AnnouncementType,
  type EventBasis,
} from '../data/announcements'
import { CURRENT_ADMIN, type Targeting } from '../data/org'
import { todayIso } from '../utils/audience'
import { type WorkflowAction } from '../utils/workflow'

export interface AnnouncementDraft {
  title: string
  body: string
  type: AnnouncementType
  eventBasis: EventBasis
  recurrenceDays: string[]
  startDate: string
  endDate: string | null
  targeting: Targeting
  link: string
  attachment: string
  tenant: string
}

function withHistory(a: Announcement, event: string): Announcement {
  return { ...a, history: [...a.history, { at: todayIso(), event }] }
}

/**
 * In-memory announcements store. Stands in for the real canonical store —
 * mutations append bitemporal history entries (ANN-16) and reset on reload.
 */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements)

  const addAnnouncement = useCallback(
    (draft: AnnouncementDraft, intent: 'draft' | 'submit') => {
      const announcement: Announcement = {
        ...draft,
        id: `a-${crypto.randomUUID().slice(0, 8)}`,
        creator: CURRENT_ADMIN,
        createdAt: todayIso(),
        status: intent === 'submit' ? 'Pending approval' : 'Draft',
        prevStatus: null,
        pendingWith: intent === 'submit' ? 'Meera Iyer' : null,
        hidden: false,
        read: false,
        history: [
          { at: todayIso(), event: `Created by ${CURRENT_ADMIN}` },
          ...(intent === 'submit'
            ? [{ at: todayIso(), event: 'Submitted for approval to Meera Iyer' }]
            : []),
        ],
      }
      setAnnouncements((prev) => [announcement, ...prev])
      toast.success(
        intent === 'submit'
          ? `“${draft.title}” submitted for approval`
          : `“${draft.title}” saved as draft`
      )
    },
    []
  )

  const updateAnnouncement = useCallback((id: string, draft: AnnouncementDraft) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id
          ? withHistory({ ...a, ...draft }, `Edited by ${CURRENT_ADMIN} — prior values retained in history`)
          : a
      )
    )
    toast.success('Announcement updated')
  }, [])

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleHidden = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const hidden = !a.hidden
        toast.success(hidden ? 'Announcement hidden from viewers' : 'Announcement is visible again')
        return withHistory(
          { ...a, hidden },
          hidden ? `Hidden by ${CURRENT_ADMIN}` : `Unhidden by ${CURRENT_ADMIN}`
        )
      })
    )
  }, [])

  const markRead = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id && !a.read ? { ...a, read: true } : a))
    )
  }, [])

  const runAction = useCallback((id: string, action: WorkflowAction) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        switch (action) {
          case 'submit':
            toast.success(`“${a.title}” submitted for approval`)
            return withHistory(
              { ...a, status: 'Pending approval', pendingWith: 'Meera Iyer' },
              `Submitted for approval by ${CURRENT_ADMIN}`
            )
          case 'approve':
            toast.success(`“${a.title}” approved — eligible for publishing`)
            return withHistory(
              { ...a, status: 'Approved', pendingWith: null },
              `Approved by ${CURRENT_ADMIN}`
            )
          case 'reject':
            toast.warning(`“${a.title}” rejected`)
            return withHistory(
              { ...a, status: 'Rejected', pendingWith: null },
              `Rejected by ${CURRENT_ADMIN}`
            )
          case 'withdraw':
            toast.success(`“${a.title}” withdrawn from the approval queue`)
            return withHistory(
              { ...a, status: 'Withdrawn', pendingWith: null },
              `Withdrawn by ${CURRENT_ADMIN}`
            )
          case 'hold':
            toast.success(`“${a.title}” placed On Hold`)
            return withHistory(
              { ...a, prevStatus: a.status, status: 'On Hold', pendingWith: null },
              `Placed On Hold by ${CURRENT_ADMIN}`
            )
          case 'resume': {
            const restored: AnnouncementStatus = a.prevStatus ?? 'Draft'
            toast.success(`“${a.title}” resumed to ${restored}`)
            return withHistory(
              { ...a, status: restored, prevStatus: null },
              `Resumed to ${restored} by ${CURRENT_ADMIN}`
            )
          }
          case 'publish': {
            if (a.startDate > todayIso()) {
              toast.success(`“${a.title}” scheduled to go live on ${a.startDate}`)
              return withHistory(
                { ...a, status: 'Scheduled' },
                `Scheduled for ${a.startDate} by ${CURRENT_ADMIN}`
              )
            }
            toast.success(`“${a.title}” is now live for its targeted audience`)
            return withHistory({ ...a, status: 'Published' }, `Published by ${CURRENT_ADMIN}`)
          }
          case 'unpublish':
            toast.success(`“${a.title}” unpublished — removed from audience visibility`)
            return withHistory({ ...a, status: 'Unpublished' }, `Unpublished by ${CURRENT_ADMIN}`)
          case 'cancelSchedule':
            toast.success(`Schedule cancelled — “${a.title}” will not auto-publish`)
            return withHistory(
              { ...a, status: 'Approved' },
              `Schedule cancelled by ${CURRENT_ADMIN}`
            )
          default:
            return a
        }
      })
    )
  }, [])

  /**
   * Shared scheduling engine (ANN-20): processes all due publish and expiry
   * transitions idempotently — Scheduled → Published once the start date is
   * reached, Published → Recently Completed past expiry, then → Completed
   * after a 14-day archive window.
   */
  const runSchedulingEngine = useCallback(() => {
    const today = todayIso()
    const archiveCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    let published = 0
    let expired = 0
    let archived = 0
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.status === 'Scheduled' && a.startDate <= today) {
          published += 1
          return withHistory({ ...a, status: 'Published' }, 'Published by scheduling engine')
        }
        if (a.status === 'Published' && a.endDate && a.endDate < today) {
          expired += 1
          return withHistory(
            { ...a, status: 'Recently Completed' },
            'Expired — moved to Recently Completed by scheduling engine'
          )
        }
        if (a.status === 'Recently Completed' && a.endDate && a.endDate < archiveCutoff) {
          archived += 1
          return withHistory(
            { ...a, status: 'Completed' },
            'Archived — moved to Completed by scheduling engine'
          )
        }
        return a
      })
    )
    const total = published + expired + archived
    toast.success(
      total === 0
        ? 'Scheduling engine ran — no due transitions'
        : `Scheduling engine processed ${total} transition${total === 1 ? '' : 's'} (${published} published, ${expired} expired, ${archived} archived)`
    )
  }, [])

  return {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleHidden,
    markRead,
    runAction,
    runSchedulingEngine,
  }
}

export type AnnouncementsStore = ReturnType<typeof useAnnouncements>
