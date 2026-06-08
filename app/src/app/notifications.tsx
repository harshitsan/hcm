/* eslint-disable react-refresh/only-export-components */
/**
 * Shared notification store so the top-bar bell and the Notifications page agree
 * on read state — reading (anywhere) clears the bell's red dot.
 * Mock data, session state. Role decides whether admin-only rows are included.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './store'

export type NotifKind =
  | 'leave' | 'attendance' | 'policy' | 'security' | 'announcement'
  | 'mention' | 'document' | 'context' | 'delegation'

export type Notif = {
  id: string
  kind: NotifKind
  module: string
  title: string
  body: string
  actorIdx: number | null   // index into employees for an avatar; null = system
  time: string
  order: number             // deterministic sort key (higher = newer)
  read: boolean
  mention: boolean
}

export const SEED_NOTIFS: Notif[] = [
  { id: 'n1', kind: 'leave', module: 'Leave Management', title: 'Leave request approved', body: 'Your annual leave for Jun 18–19 was approved.', actorIdx: 1, time: '12 min ago', order: 99, read: false, mention: false },
  { id: 'n2', kind: 'mention', module: 'Feedback', title: 'You were mentioned', body: '“@you can you confirm the asset hand-back note?”', actorIdx: 3, time: '40 min ago', order: 98, read: false, mention: true },
  { id: 'n3', kind: 'policy', module: 'Policy Distribution', title: 'Acknowledgment due', body: 'Code of Conduct v3 needs your sign-off by Jun 14.', actorIdx: null, time: '2 hours ago', order: 97, read: false, mention: false },
  { id: 'n4', kind: 'document', module: 'HR Letters', title: 'New letter available', body: 'Your experience certificate is ready to download.', actorIdx: 4, time: '5 hours ago', order: 96, read: true, mention: false },
  { id: 'n5', kind: 'attendance', module: 'Time & Attendance', title: 'Correction request decided', body: 'Your missed-punch correction for Jun 6 was accepted.', actorIdx: 2, time: 'Yesterday', order: 95, read: false, mention: false },
  { id: 'n6', kind: 'announcement', module: 'Announcements', title: 'Company town hall', body: 'All-hands scheduled for Jun 20 at 4:00 PM IST.', actorIdx: null, time: 'Yesterday', order: 94, read: true, mention: false },
  { id: 'n7', kind: 'mention', module: 'Onboarding', title: 'You were mentioned', body: '“@you please review the buddy assignment.”', actorIdx: 5, time: '2 days ago', order: 93, read: true, mention: true },
  { id: 'n8', kind: 'delegation', module: 'Delegation', title: 'Delegation activated', body: 'Pending approvals delegated to you until Jun 15.', actorIdx: 0, time: '2 days ago', order: 92, read: true, mention: false },
]

export const ADMIN_NOTIFS: Notif[] = [
  { id: 'n9', kind: 'security', module: 'Authentication', title: 'New sign-in detected', body: 'Local login from a new device · MFA satisfied.', actorIdx: null, time: '3 hours ago', order: 96, read: false, mention: false },
  { id: 'n10', kind: 'context', module: 'Tenant Isolation', title: 'Company context switched', body: 'Active context moved between authorized companies.', actorIdx: null, time: 'Yesterday', order: 94, read: true, mention: false },
]

type NotifState = {
  feed: Notif[]
  unreadCount: number
  mentionCount: number
  toggleRead: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const Ctx = createContext<NotifState | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { role } = useApp()
  const isManagerOrAdmin =
    role === 'provider_admin' || role === 'portfolio_manager' || role === 'company_hr_admin' || role === 'people_manager'
  // overrides[id] = read flag set by the user this session (wins over the seed)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const feed = useMemo(() => {
    const base = isManagerOrAdmin ? [...SEED_NOTIFS, ...ADMIN_NOTIFS] : SEED_NOTIFS
    return base
      .map((n) => ({ ...n, read: overrides[n.id] ?? n.read }))
      .sort((a, b) => b.order - a.order)
  }, [isManagerOrAdmin, overrides])

  const unreadCount = feed.filter((n) => !n.read).length
  const mentionCount = feed.filter((n) => n.mention).length

  const setRead = (id: string, read: boolean) => setOverrides((o) => ({ ...o, [id]: read }))
  const toggleRead = (id: string) => setRead(id, !(feed.find((n) => n.id === id)?.read ?? false))
  const markRead = (id: string) => setRead(id, true)
  const markAllRead = () =>
    setOverrides((o) => {
      const next = { ...o }
      feed.forEach((n) => { next[n.id] = true })
      return next
    })

  return (
    <Ctx.Provider value={{ feed, unreadCount, mentionCount, toggleRead, markRead, markAllRead }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
