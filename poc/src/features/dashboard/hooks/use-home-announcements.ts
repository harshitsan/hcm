import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  seedHomeAnnouncements,
  type HomeAnnouncement,
  type HomeAnnouncementCategory,
} from '../data/home-announcements'

export interface HomeAnnouncementDraft {
  title: string
  body: string
  category: HomeAnnouncementCategory
  audience: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * In-memory store behind the Home announcements feed (HOME-01). Stands in
 * for the canonical announcements service — mutations reset on reload.
 */
export function useHomeAnnouncements() {
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>(
    seedHomeAnnouncements
  )

  const unreadCount = useMemo(
    () => announcements.filter((a) => !a.read).length,
    [announcements]
  )

  const addAnnouncement = useCallback((draft: HomeAnnouncementDraft) => {
    const announcement: HomeAnnouncement = {
      ...draft,
      id: `ha-${crypto.randomUUID().slice(0, 8)}`,
      postedBy: 'You',
      postedOn: todayIso(),
      pinned: false,
      read: true,
    }
    setAnnouncements((prev) => [announcement, ...prev])
    toast.success(`“${draft.title}” posted to the Home feed`)
  }, [])

  const updateAnnouncement = useCallback(
    (id: string, draft: HomeAnnouncementDraft) => {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...draft } : a))
      )
      toast.success('Announcement updated')
    },
    []
  )

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => {
      const removed = prev.find((a) => a.id === id)
      if (removed) toast.success(`“${removed.title}” removed from the Home feed`)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const togglePinned = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const pinned = !a.pinned
        toast.success(
          pinned
            ? `“${a.title}” pinned to the top of the feed`
            : `“${a.title}” unpinned`
        )
        return { ...a, pinned }
      })
    )
  }, [])

  const markRead = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id && !a.read ? { ...a, read: true } : a))
    )
  }, [])

  const markAllRead = useCallback(() => {
    setAnnouncements((prev) => prev.map((a) => (a.read ? a : { ...a, read: true })))
    toast.success('All announcements marked as read')
  }, [])

  return {
    announcements,
    unreadCount,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePinned,
    markRead,
    markAllRead,
  }
}

export type HomeAnnouncementsStore = ReturnType<typeof useHomeAnnouncements>
