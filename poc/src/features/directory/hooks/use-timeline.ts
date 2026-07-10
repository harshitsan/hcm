import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import {
  SELF_EMPLOYEE_NAME,
  TIMELINE_TODAY,
  seedFeedComments,
  seedFeedEvents,
  seedTimelineSettings,
  type CommentVisibility,
  type TimelineAudience,
  type TimelineComment,
  type TimelineEvent,
  type TimelineEventSetting,
  type TimelineEventType,
} from '../data/timeline'

/** Admin/HR stand-in roles that can read private comments and restricted events. */
const PRIVATE_VIEWER_ROLES: readonly Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

export function canViewPrivateComments(role: Role): boolean {
  return PRIVATE_VIEWER_ROLES.includes(role)
}

export interface AddCommentInput {
  text: string
  visibility: CommentVisibility
  attachmentName?: string
}

/**
 * In-memory Employee Timeline store: milestone events per employee, comment
 * threads with public/private visibility, and the admin per-event-type
 * settings (enable/disable + who-can-view) that shape both feeds.
 */
export function useTimeline() {
  const [events] = useState<TimelineEvent[]>(seedFeedEvents)
  const [comments, setComments] = useState<TimelineComment[]>(seedFeedComments)
  const [settings, setSettings] = useState<TimelineEventSetting[]>(
    seedTimelineSettings
  )

  /**
   * Events for one employee, newest first. Disabled event types never
   * surface; types restricted to 'HR & managers only' are hidden from
   * employee roles unless they are looking at their own timeline.
   */
  const eventsFor = useCallback(
    (employeeId: string, viewerRole: Role, isOwnTimeline = false) =>
      events
        .filter((e) => e.employeeId === employeeId)
        .filter((e) => {
          const setting = settings.find((s) => s.event === e.eventType)
          if (!setting) return true
          if (!setting.enabled) return false
          if (
            setting.audience === 'HR & managers only' &&
            !canViewPrivateComments(viewerRole) &&
            !isOwnTimeline
          )
            return false
          return true
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [events, settings]
  )

  /**
   * Comments on one event, oldest first. Admin/HR roles read everything;
   * employee roles read public comments plus their own private notes
   * (author match against the mock signed-in identity).
   */
  const commentsFor = useCallback(
    (eventId: string, viewerRole: Role) =>
      comments
        .filter((c) => c.eventId === eventId)
        .filter(
          (c) =>
            c.visibility === 'public' ||
            canViewPrivateComments(viewerRole) ||
            c.author === SELF_EMPLOYEE_NAME
        )
        .sort((a, b) => a.createdOn.localeCompare(b.createdOn)),
    [comments]
  )

  const addComment = useCallback(
    (eventId: string, input: AddCommentInput) => {
      const comment: TimelineComment = {
        id: `cm-${crypto.randomUUID().slice(0, 8)}`,
        eventId,
        author: SELF_EMPLOYEE_NAME,
        text: input.text.trim(),
        visibility: input.visibility,
        createdOn: TIMELINE_TODAY,
        attachmentName: input.attachmentName?.trim() || undefined,
      }
      setComments((prev) => [...prev, comment])
      toast.success('Comment added — notification sent to HR')
    },
    []
  )

  const setEventEnabled = useCallback(
    (event: TimelineEventType, enabled: boolean) => {
      setSettings((prev) =>
        prev.map((s) => (s.event === event ? { ...s, enabled } : s))
      )
      toast.success(
        enabled
          ? `"${event}" events are now shown on timelines`
          : `"${event}" events are now hidden from timelines`
      )
    },
    []
  )

  const setEventAudience = useCallback(
    (event: TimelineEventType, audience: TimelineAudience) => {
      setSettings((prev) =>
        prev.map((s) => (s.event === event ? { ...s, audience } : s))
      )
      toast.success(`"${event}" events are now visible to ${audience.toLowerCase()}`)
    },
    []
  )

  return {
    events,
    comments,
    settings,
    eventsFor,
    commentsFor,
    addComment,
    setEventEnabled,
    setEventAudience,
  }
}

export type TimelineStore = ReturnType<typeof useTimeline>
