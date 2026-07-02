import { type Targeting } from './org'

export const ANNOUNCEMENT_STATUSES = [
  'Draft',
  'Pending approval',
  'Approved',
  'Scheduled',
  'Published',
  'Unpublished',
  'Recently Completed',
  'Completed',
  'Rejected',
  'Withdrawn',
  'On Hold',
] as const

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number]

export const ANNOUNCEMENT_TYPES = ['Adhoc', 'Recurring'] as const
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number]

export const EVENT_BASES = ['None', 'Date of Birth', 'Service Anniversary'] as const
export type EventBasis = (typeof EVENT_BASES)[number]

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** One bitemporal history entry — prior values are retained, never overwritten (ANN-16). */
export interface HistoryEntry {
  at: string
  event: string
}

/**
 * Canonical announcement record (ANN-14): content, author, six structured
 * targeting selectors, and first-class schedule/expiry timestamps.
 */
export interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  eventBasis: EventBasis
  /** Days of week the recurring series fires on (ANN-42). */
  recurrenceDays: string[]
  /** Scheduled publish date — hidden from the audience until reached (ANN-05). */
  startDate: string
  /** Expiry date — removed from view once passed; null keeps it visible (ANN-06). */
  endDate: string | null
  targeting: Targeting
  link: string
  attachment: string
  /** Owning company — row-level security scopes queries to the caller's tenants (ANN-15). */
  tenant: string
  creator: string
  createdAt: string
  status: AnnouncementStatus
  /** Where the record was before On Hold, so Resume can restore it (ANN-28). */
  prevStatus: AnnouncementStatus | null
  /** Assigned approver while Pending approval (ANN-25). */
  pendingWith: string | null
  /** Suppressed from viewers without deleting (ANN-39). */
  hidden: boolean
  /** Unread flag for the self-service feed (ANN-23). */
  read: boolean
  history: HistoryEntry[]
}

const noTargets: Targeting = {
  companies: [],
  jurisdictions: [],
  locations: [],
  departments: [],
  groups: [],
  workforceTypes: [],
}

const t = (partial: Partial<Targeting>): Targeting => ({ ...noTargets, ...partial })

export const seedAnnouncements: Announcement[] = [
  {
    id: 'a-01',
    title: 'Q3 All-Hands on 10 July',
    body: 'Join the quarterly all-hands at 10:00 AM IST in the Hyderabad auditorium and on the live stream. Agenda: H1 results, Q3 priorities, and open Q&A with leadership.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-28',
    endDate: '2026-07-15',
    targeting: t({ companies: ['Aster Digital'], groups: ['All Hands'] }),
    link: 'https://intranet.aster.dev/all-hands-q3',
    attachment: 'Q3-All-Hands-Agenda.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-20',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-20', event: 'Created by Priya Sharma' },
      { at: '2026-06-24', event: 'Approved by Meera Iyer' },
      { at: '2026-06-28', event: 'Published by scheduling engine' },
    ],
  },
  {
    id: 'a-02',
    title: 'Revised Hyderabad shuttle timings',
    body: 'From 1 July the evening shuttle departs at 6:30 PM and 8:00 PM. Route maps are attached. Contact facilities for stop changes.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-22',
    endDate: '2026-07-31',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'], locations: ['Hyderabad'] }),
    link: '',
    attachment: 'Shuttle-Routes-July.pdf',
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-18',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-06-18', event: 'Created by Rahul Verma' },
      { at: '2026-06-22', event: 'Published by Priya Sharma' },
    ],
  },
  {
    id: 'a-03',
    title: 'June wellness challenge — results',
    body: 'Congratulations to the Bengaluru team for topping the June step challenge leaderboard! Prizes will be distributed by the Wellness Committee this week.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-15',
    endDate: '2026-06-30',
    targeting: t({ companies: ['Aster Digital'], groups: ['All Hands', 'Wellness Committee'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-12',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-06-12', event: 'Created by Meera Iyer' },
      { at: '2026-06-15', event: 'Published by Priya Sharma' },
    ],
  },
  {
    id: 'a-04',
    title: 'New parental leave policy',
    body: 'Effective 10 July, parental leave increases to 26 weeks for primary caregivers and 6 weeks for secondary caregivers. Full policy in the attached handbook.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-10',
    endDate: '2026-08-31',
    targeting: t({ companies: ['Aster Digital'], departments: ['Human Resources', 'Engineering', 'Sales', 'Finance', 'Operations'] }),
    link: 'https://intranet.aster.dev/policies/parental-leave',
    attachment: 'Parental-Leave-Policy-v3.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-25',
    status: 'Scheduled',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-25', event: 'Created by Priya Sharma' },
      { at: '2026-06-27', event: 'Approved by Meera Iyer' },
      { at: '2026-06-27', event: 'Scheduled for 10 Jul 2026' },
    ],
  },
  {
    id: 'a-05',
    title: 'Office closure — electrical maintenance',
    body: 'The Hyderabad office will be closed on Saturday 12 July for annual electrical maintenance. Badge access will be disabled from 6 AM to 8 PM.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-08',
    endDate: '2026-07-13',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-30',
    status: 'Pending approval',
    prevStatus: null,
    pendingWith: 'Priya Sharma',
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-30', event: 'Created by Rahul Verma' },
      { at: '2026-06-30', event: 'Submitted for approval to Priya Sharma' },
    ],
  },
  {
    id: 'a-06',
    title: 'Contractor timesheet portal migration',
    body: 'All contractors must move to the new timesheet portal by 20 July. Legacy submissions close on 18 July. Onboarding guide attached.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-05',
    endDate: '2026-07-20',
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Contractor'] }),
    link: 'https://timesheets.aster.dev',
    attachment: 'Timesheet-Portal-Guide.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-29',
    status: 'Pending approval',
    prevStatus: null,
    pendingWith: 'Meera Iyer',
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-29', event: 'Created by Priya Sharma' },
      { at: '2026-06-29', event: 'Submitted for approval to Meera Iyer' },
    ],
  },
  {
    id: 'a-07',
    title: 'Annual compliance training window',
    body: 'The 2026 compliance training window runs 15 July – 15 August. Completion is mandatory for all full-time employees.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Full-time'] }),
    link: 'https://learn.aster.dev/compliance-2026',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-26',
    status: 'Approved',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-26', event: 'Created by Meera Iyer' },
      { at: '2026-06-28', event: 'Approved by Priya Sharma' },
    ],
  },
  {
    id: 'a-08',
    title: 'Diwali celebration planning volunteers',
    body: 'We are looking for volunteers to help plan this year’s Diwali celebrations across India offices. Sign-ups open soon.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-09-20',
    endDate: '2026-10-25',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-07-01',
    status: 'Draft',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [{ at: '2026-07-01', event: 'Created by Priya Sharma' }],
  },
  {
    id: 'a-09',
    title: 'Vendor discount promotion',
    body: 'Partner vendor is offering 20% off gym memberships for employees this month.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    targeting: t({ companies: ['Aster Digital'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-24',
    status: 'Rejected',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-24', event: 'Created by Rahul Verma' },
      { at: '2026-06-25', event: 'Submitted for approval to Priya Sharma' },
      { at: '2026-06-26', event: 'Rejected by Priya Sharma — commercial promotions need procurement sign-off' },
    ],
  },
  {
    id: 'a-10',
    title: 'Beta program for internal AI assistant',
    body: 'Engineering is piloting an internal AI assistant. This announcement was withdrawn pending a security review.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-14',
    endDate: null,
    targeting: t({ companies: ['Aster Digital'], departments: ['Engineering'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-23',
    status: 'Withdrawn',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-23', event: 'Created by Priya Sharma' },
      { at: '2026-06-23', event: 'Submitted for approval to Meera Iyer' },
      { at: '2026-06-27', event: 'Withdrawn by Priya Sharma' },
    ],
  },
  {
    id: 'a-11',
    title: 'Cafeteria vendor change — feedback survey',
    body: 'We are evaluating a new cafeteria vendor and will share a tasting schedule. On hold while contract terms are finalized.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-20',
    endDate: '2026-08-05',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad', 'Bengaluru'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-21',
    status: 'On Hold',
    prevStatus: 'Approved',
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-21', event: 'Created by Meera Iyer' },
      { at: '2026-06-22', event: 'Approved by Priya Sharma' },
      { at: '2026-06-29', event: 'Placed On Hold by Priya Sharma' },
    ],
  },
  {
    id: 'a-12',
    title: 'Old VPN retirement notice',
    body: 'The legacy VPN endpoint retires on 30 June. This notice was retracted after the migration deadline moved.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-10',
    endDate: '2026-06-30',
    targeting: t({ companies: ['Aster Digital'], departments: ['Engineering', 'Operations'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-08',
    status: 'Unpublished',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-08', event: 'Created by Priya Sharma' },
      { at: '2026-06-10', event: 'Published by Priya Sharma' },
      { at: '2026-06-14', event: 'Unpublished by Priya Sharma — deadline moved' },
    ],
  },
  {
    id: 'a-13',
    title: 'May Day holiday reminder',
    body: 'All India offices remain closed on 1 May for May Day.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-04-25',
    endDate: '2026-05-02',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-04-20',
    status: 'Completed',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-04-20', event: 'Created by Meera Iyer' },
      { at: '2026-04-25', event: 'Published by scheduling engine' },
      { at: '2026-05-02', event: 'Expired — moved to Recently Completed' },
      { at: '2026-05-16', event: 'Archived — moved to Completed' },
    ],
  },
  {
    id: 'a-14',
    title: 'Insurance enrollment window closed',
    body: 'The FY27 insurance enrollment window closed on 25 June. Late requests go through HR helpdesk.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-01',
    endDate: '2026-06-25',
    targeting: t({ companies: ['Aster Digital'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-05-28',
    status: 'Recently Completed',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-05-28', event: 'Created by Priya Sharma' },
      { at: '2026-06-01', event: 'Published by scheduling engine' },
      { at: '2026-06-26', event: 'Expired — moved to Recently Completed' },
    ],
  },
  {
    id: 'a-15',
    title: 'Birthday greetings',
    body: 'Wishing you a very happy birthday! Have a wonderful year ahead.',
    type: 'Recurring',
    eventBasis: 'Date of Birth',
    recurrenceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    startDate: '2026-01-01',
    endDate: null,
    targeting: t({ companies: ['Aster Digital'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-01-01',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-01-01', event: 'Created by Meera Iyer' },
      { at: '2026-01-01', event: 'Published — fires on each employee’s date of birth' },
    ],
  },
  {
    id: 'a-16',
    title: 'Service anniversary greetings',
    body: 'Congratulations on your work anniversary! Thank you for everything you do.',
    type: 'Recurring',
    eventBasis: 'Service Anniversary',
    recurrenceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startDate: '2026-01-01',
    endDate: null,
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Full-time', 'Part-time'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-01-01',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: true,
    history: [
      { at: '2026-01-01', event: 'Created by Priya Sharma' },
      { at: '2026-01-01', event: 'Published — fires on each service anniversary' },
    ],
  },
  {
    id: 'a-17',
    title: 'Cafeteria menu update',
    body: 'A refreshed cafeteria menu goes live next week. Hidden while pricing is confirmed.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-06-25',
    endDate: '2026-07-25',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad'] }),
    link: '',
    attachment: '',
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-22',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: true,
    read: false,
    history: [
      { at: '2026-06-22', event: 'Created by Rahul Verma' },
      { at: '2026-06-25', event: 'Published by Priya Sharma' },
      { at: '2026-06-26', event: 'Hidden by Priya Sharma — pricing under review' },
    ],
  },
  {
    id: 'a-18',
    title: 'Platform maintenance window — 6 July',
    body: 'SatelliteHR will be unavailable on Sunday 6 July, 1:00–3:00 AM UTC for scheduled platform maintenance. All companies are affected.',
    type: 'Adhoc',
    eventBasis: 'None',
    recurrenceDays: [],
    startDate: '2026-07-01',
    endDate: '2026-07-07',
    targeting: t({}),
    link: 'https://status.satellitehr.dev',
    attachment: '',
    tenant: 'Platform',
    creator: 'Platform Ops',
    createdAt: '2026-06-28',
    status: 'Published',
    prevStatus: null,
    pendingWith: null,
    hidden: false,
    read: false,
    history: [
      { at: '2026-06-28', event: 'Created by Platform Ops' },
      { at: '2026-07-01', event: 'Published platform-wide by scheduling engine' },
    ],
  },
]

export interface AnnouncementImage {
  id: string
  name: string
  eventType: 'Date of Birth' | 'Service Anniversary'
  years: number
  updatedAt: string
}

export const seedImages: AnnouncementImage[] = [
  { id: 'img-01', name: 'birthday-balloons.png', eventType: 'Date of Birth', years: 0, updatedAt: '2026-01-05' },
  { id: 'img-02', name: 'anniversary-1yr-confetti.png', eventType: 'Service Anniversary', years: 1, updatedAt: '2026-01-05' },
  { id: 'img-03', name: 'anniversary-3yr-badge.png', eventType: 'Service Anniversary', years: 3, updatedAt: '2026-02-11' },
  { id: 'img-04', name: 'anniversary-5yr-trophy.png', eventType: 'Service Anniversary', years: 5, updatedAt: '2026-02-11' },
  { id: 'img-05', name: 'anniversary-10yr-gold.png', eventType: 'Service Anniversary', years: 10, updatedAt: '2026-03-02' },
  { id: 'img-06', name: 'anniversary-15yr-platinum.png', eventType: 'Service Anniversary', years: 15, updatedAt: '2026-03-02' },
]

/** Versioned, effective-dated per-tenant module configuration (ANN-18). */
export interface ConfigVersion {
  version: number
  enabled: boolean
  effectiveFrom: string
  changedBy: string
  note: string
}

export const seedConfigVersions: ConfigVersion[] = [
  { version: 1, enabled: true, effectiveFrom: '2026-01-01', changedBy: 'Platform Ops', note: 'Module enabled for tenant Aster Digital' },
  { version: 2, enabled: true, effectiveFrom: '2026-04-01', changedBy: 'Platform Ops', note: 'Targeting refreshed from governed org config' },
]
