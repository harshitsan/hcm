import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAnnouncements,
  seedNotifications,
  type AnnounceOn,
  type Announcement,
  type AnnouncementKind,
  type AnnouncementStatus,
  type AnnouncementType,
  type EventBasis,
  type NotificationEntry,
  type RecurrencePattern,
} from '../data/announcements'
import { CURRENT_ADMIN, seedEmployees, type Targeting } from '../data/org'
import { resolveAudience, todayIso } from '../utils/audience'
import { type WorkflowAction } from '../utils/workflow'

export interface AnnouncementDraft {
  title: string
  body: string
  kind: AnnouncementKind
  type: AnnouncementType
  eventBasis: EventBasis
  recurrencePattern: RecurrencePattern
  recurrenceDays: string[]
  announceOn: AnnounceOn
  announceOffsetDays: number
  notifyAnnouncerBeforeDays: number
  expireInDays: number
  announceOnWeeklyOff: boolean
  announceOnHolidays: boolean
  startDate: string
  startTime: string
  endDate: string | null
  visibleToAll: boolean
  targeting: Targeting
  notifyByEmail: boolean
  notifySubject: string
  template: string
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
 * Also owns the simulated email notification log, timeline comments, and
 * Vacancy/Event enrollments recorded through the announcement window.
 */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements)
  const [notifications, setNotifications] = useState<NotificationEntry[]>(seedNotifications)

  /** Simulated email: toast + an in-store notification entry (no real delivery). */
  const recordNotification = useCallback((a: Announcement | AnnouncementDraft) => {
    const { reachable } = resolveAudience(a.targeting, seedEmployees)
    const to = a.visibleToAll
      ? `All employees (${a.tenant})`
      : `${reachable.length} employee${reachable.length === 1 ? '' : 's'} (matched audience)`
    setNotifications((prev) => [
      {
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        at: todayIso(),
        channel: 'Email',
        to,
        subject: a.notifySubject || a.title,
        announcementTitle: a.title,
      },
      ...prev,
    ])
    toast.success(`Email notification sent to ${to} (simulated)`)
  }, [])

  const addAnnouncement = useCallback(
    (draft: AnnouncementDraft, intent: 'draft' | 'submit' | 'publish') => {
      const publishesNow = intent === 'publish' && draft.startDate <= todayIso()
      const status: AnnouncementStatus =
        intent === 'publish'
          ? publishesNow
            ? 'Published'
            : 'Scheduled'
          : intent === 'submit'
            ? 'Pending approval'
            : 'Draft'
      const announcement: Announcement = {
        ...draft,
        id: `a-${crypto.randomUUID().slice(0, 8)}`,
        creator: CURRENT_ADMIN,
        createdAt: todayIso(),
        status,
        prevStatus: null,
        pendingWith: intent === 'submit' ? 'Meera Iyer' : null,
        hidden: false,
        read: false,
        comments: [],
        enrollments: [],
        history: [
          { at: todayIso(), event: `Created by ${CURRENT_ADMIN}` },
          ...(intent === 'submit'
            ? [{ at: todayIso(), event: 'Submitted for approval to Meera Iyer' }]
            : []),
          ...(intent === 'publish'
            ? [
                {
                  at: todayIso(),
                  event: publishesNow
                    ? `Published by ${CURRENT_ADMIN}`
                    : `Scheduled for ${draft.startDate} by ${CURRENT_ADMIN}`,
                },
              ]
            : []),
        ],
      }
      setAnnouncements((prev) => [announcement, ...prev])
      toast.success(
        intent === 'publish'
          ? publishesNow
            ? `“${draft.title}” published — live for its audience`
            : `“${draft.title}” scheduled to go live on ${draft.startDate}`
          : intent === 'submit'
            ? `“${draft.title}” submitted for approval`
            : `“${draft.title}” saved as draft`
      )
      if (publishesNow && draft.notifyByEmail) recordNotification(draft)
    },
    [recordNotification]
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

  /** Comment on an employee timeline directly from the announcement window (PDF #5). */
  const addComment = useCallback((id: string, author: string, text: string) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              comments: [
                ...a.comments,
                {
                  id: `c-${crypto.randomUUID().slice(0, 8)}`,
                  author,
                  at: todayIso(),
                  text,
                },
              ],
            }
          : a
      )
    )
    toast.success('Comment posted to the employee timeline')
  }, [])

  /** Enroll/apply through the announcement window (PDF #11/#12). */
  const enroll = useCallback((id: string, employee: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        if (a.enrollments.includes(employee)) {
          toast.info(
            a.kind === 'Vacancy'
              ? `${employee} has already applied for this vacancy`
              : `${employee} is already enrolled`
          )
          return a
        }
        toast.success(
          a.kind === 'Vacancy'
            ? `Application recorded — ${employee} applied for “${a.title}”`
            : `Enrollment recorded — ${employee} enrolled in “${a.title}”`
        )
        return withHistory(
          { ...a, enrollments: [...a.enrollments, employee] },
          a.kind === 'Vacancy'
            ? `${employee} applied through the announcement window`
            : `${employee} enrolled through the announcement window`
        )
      })
    )
  }, [])

  const runAction = useCallback(
    (id: string, action: WorkflowAction, comment?: string) => {
      /** Decision comment is retained on the bitemporal history line (ANN-16). */
      const note = comment?.trim() ? ` — “${comment.trim()}”` : ''
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a
          switch (action) {
            case 'submit':
              toast.success(`“${a.title}” submitted for approval`)
              return withHistory(
                { ...a, status: 'Pending approval', pendingWith: 'Meera Iyer' },
                `Submitted for approval by ${CURRENT_ADMIN}${note}`
              )
            case 'approve':
              toast.success(`“${a.title}” approved — eligible for publishing`)
              return withHistory(
                { ...a, status: 'Approved', pendingWith: null },
                `Approved by ${CURRENT_ADMIN}${note}`
              )
            case 'reject':
              toast.warning(`“${a.title}” rejected`)
              return withHistory(
                { ...a, status: 'Rejected', pendingWith: null },
                `Rejected by ${CURRENT_ADMIN}${note}`
              )
            case 'withdraw':
              toast.success(`“${a.title}” withdrawn from the approval queue`)
              return withHistory(
                { ...a, status: 'Withdrawn', pendingWith: null },
                `Withdrawn by ${CURRENT_ADMIN}${note}`
              )
            case 'hold':
              toast.success(`“${a.title}” placed On Hold`)
              return withHistory(
                { ...a, prevStatus: a.status, status: 'On Hold', pendingWith: null },
                `Placed On Hold by ${CURRENT_ADMIN}${note}`
              )
            case 'resume': {
              const restored: AnnouncementStatus = a.prevStatus ?? 'Draft'
              toast.success(`“${a.title}” resumed to ${restored}`)
              return withHistory(
                { ...a, status: restored, prevStatus: null },
                `Resumed to ${restored} by ${CURRENT_ADMIN}${note}`
              )
            }
            case 'publish': {
              if (a.startDate > todayIso()) {
                toast.success(`“${a.title}” scheduled to go live on ${a.startDate}`)
                return withHistory(
                  { ...a, status: 'Scheduled' },
                  `Scheduled for ${a.startDate} by ${CURRENT_ADMIN}${note}`
                )
              }
              toast.success(`“${a.title}” is now live for its targeted audience`)
              if (a.notifyByEmail) recordNotification(a)
              return withHistory(
                { ...a, status: 'Published' },
                `Published by ${CURRENT_ADMIN}${note}`
              )
            }
            case 'unpublish':
              toast.success(`“${a.title}” unpublished — removed from audience visibility`)
              return withHistory(
                { ...a, status: 'Unpublished' },
                `Unpublished by ${CURRENT_ADMIN}${note}`
              )
            case 'cancelSchedule':
              toast.success(`Schedule cancelled — “${a.title}” will not auto-publish`)
              return withHistory(
                { ...a, status: 'Approved' },
                `Schedule cancelled by ${CURRENT_ADMIN}${note}`
              )
            default:
              return a
          }
        })
      )
    },
    [recordNotification]
  )

  /**
   * Shared scheduling engine (ANN-20): processes all due publish and expiry
   * transitions idempotently — Scheduled → Published once the start date is
   * reached, Published → Recently Completed past expiry, then → Completed
   * after a 14-day archive window.
   */
  const runSchedulingEngine = useCallback(() => {
    const today = todayIso()
    const archiveCutoff = new Date(
      new Date(`${today}T00:00:00Z`).getTime() - 14 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10)
    let published = 0
    let expired = 0
    let archived = 0
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.status === 'Scheduled' && a.startDate <= today) {
          published += 1
          if (a.notifyByEmail) recordNotification(a)
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
  }, [recordNotification])

  return {
    announcements,
    notifications,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleHidden,
    markRead,
    addComment,
    enroll,
    runAction,
    runSchedulingEngine,
  }
}

export type AnnouncementsStore = ReturnType<typeof useAnnouncements>
