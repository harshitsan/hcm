export const HOME_ANNOUNCEMENT_CATEGORIES = [
  'General',
  'Policy',
  'Event',
  'IT & Systems',
  'Facilities',
] as const

export type HomeAnnouncementCategory =
  (typeof HOME_ANNOUNCEMENT_CATEGORIES)[number]

/**
 * Announcement card surfaced on the Home / dashboard landing page (HOME-01).
 * A lightweight home-feed projection — the full lifecycle (approvals,
 * scheduling, targeting) lives in the Announcements module.
 */
export interface HomeAnnouncement {
  id: string
  title: string
  body: string
  category: HomeAnnouncementCategory
  /** Human-readable audience the post is targeted to. */
  audience: string
  postedBy: string
  /** ISO date the post went live on the home feed. */
  postedOn: string
  /** Pinned posts stay at the top of the home feed. */
  pinned: boolean
  /** Per-viewer unread flag for the home feed. */
  read: boolean
}

export const seedHomeAnnouncements: HomeAnnouncement[] = [
  {
    id: 'ha-01',
    title: 'Q3 All-Hands on 10 July',
    body: 'Join the quarterly all-hands at 10:00 AM IST in the Hyderabad auditorium and on the live stream. Agenda: H1 results, Q3 priorities, and open Q&A with leadership.',
    category: 'Event',
    audience: 'All employees',
    postedBy: 'Priya Sharma',
    postedOn: '2026-06-28',
    pinned: true,
    read: false,
  },
  {
    id: 'ha-02',
    title: 'New parental leave policy effective 10 July',
    body: 'Parental leave increases to 26 weeks for primary caregivers and 6 weeks for secondary caregivers. The full policy is available in the handbook on the intranet.',
    category: 'Policy',
    audience: 'All employees',
    postedBy: 'Meera Iyer',
    postedOn: '2026-07-02',
    pinned: false,
    read: false,
  },
  {
    id: 'ha-03',
    title: 'Platform maintenance window — 6 July',
    body: 'SatelliteHR will be unavailable on Sunday 6 July, 1:00–3:00 AM UTC for scheduled platform maintenance. All companies are affected.',
    category: 'IT & Systems',
    audience: 'All companies',
    postedBy: 'Platform Ops',
    postedOn: '2026-07-01',
    pinned: false,
    read: true,
  },
  {
    id: 'ha-04',
    title: 'Revised Hyderabad shuttle timings',
    body: 'From 1 July the evening shuttle departs at 6:30 PM and 8:00 PM. Route maps are posted at reception. Contact facilities for stop changes.',
    category: 'Facilities',
    audience: 'Hyderabad office',
    postedBy: 'Rahul Verma',
    postedOn: '2026-06-30',
    pinned: false,
    read: true,
  },
  {
    id: 'ha-05',
    title: 'June wellness challenge — results',
    body: 'Congratulations to the Bengaluru team for topping the June step challenge leaderboard! Prizes will be distributed by the Wellness Committee this week.',
    category: 'General',
    audience: 'All employees',
    postedBy: 'Meera Iyer',
    postedOn: '2026-06-27',
    pinned: false,
    read: true,
  },
]
