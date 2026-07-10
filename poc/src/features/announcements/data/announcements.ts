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

/** What the announcement carries — plain news, a vacancy posting (PDF #11) or an enrollable event (PDF #12). */
export const ANNOUNCEMENT_KINDS = ['General', 'Vacancy', 'Event'] as const
export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number]

/** Events the recurring engine can key off — extended per the PDF event drop-down. */
export const EVENT_BASES = [
  'None',
  'Date of Birth',
  'Service Anniversary',
  'Wedding Anniversary',
  'New Joinee Welcome',
] as const
export type EventBasis = (typeof EVENT_BASES)[number]

export const RECURRENCE_PATTERNS = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const
export type RecurrencePattern = (typeof RECURRENCE_PATTERNS)[number]

/** Publish timing relative to the event/date (PDF Recurring pointer #4). */
export const ANNOUNCE_ON_OPTIONS = ['On date', 'Before date', 'After date'] as const
export type AnnounceOn = (typeof ANNOUNCE_ON_OPTIONS)[number]

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** One bitemporal history entry — prior values are retained, never overwritten (ANN-16). */
export interface HistoryEntry {
  at: string
  event: string
}

/** Comment posted to an employee timeline from the announcement window (PDF #5). */
export interface AnnouncementComment {
  id: string
  author: string
  at: string
  text: string
}

/**
 * Canonical announcement record (ANN-14) extended to the full Kensium field
 * set: content + template, Adhoc/Recurring scheduling (announce on/offset,
 * expiry-in-days, announcer review reminder, weekly-off/holiday flags,
 * recurrence pattern, event basis), visible-to-all vs selective targeting,
 * email notification config, and Vacancy/Event enrollment.
 */
export interface Announcement {
  id: string
  title: string
  body: string
  kind: AnnouncementKind
  type: AnnouncementType
  eventBasis: EventBasis
  /** Recurrence cadence for recurring series (PDF Recurring pointer #8). */
  recurrencePattern: RecurrencePattern
  /** Days of week the recurring series fires on (ANN-42). */
  recurrenceDays: string[]
  /** Publish on / before / after the event date (PDF Recurring pointer #4). */
  announceOn: AnnounceOn
  /** "x" days for Before date / After date. */
  announceOffsetDays: number
  /** Remind the announcement coordinator this many days before publish (PDF pointer #5). */
  notifyAnnouncerBeforeDays: number
  /** Each occurrence expires this many days after it is announced (PDF pointer #6). */
  expireInDays: number
  announceOnWeeklyOff: boolean
  announceOnHolidays: boolean
  /** Scheduled publish date — hidden from the audience until reached (ANN-05). */
  startDate: string
  /** Publish time for adhoc announcements (PDF Adhoc pointer #3), e.g. "10:00". */
  startTime: string
  /** Expiry date — removed from the portal once passed; null keeps it visible (ANN-06). */
  endDate: string | null
  /** Visible to all employees; targeting then only narrows by Applicable groups (PDF pointer #12). */
  visibleToAll: boolean
  targeting: Targeting
  /** Notify the selected employees by email about the announcement (PDF pointer #13). */
  notifyByEmail: boolean
  /** Email subject line used by the simulated notification engine. */
  notifySubject: string
  /** Announcement template with {{employee}}/{{event}}/{{date}}/{{company}} tokens (PDF pointer #15). */
  template: string
  link: string
  /** Uploaded image/document published with the announcement (PDF pointer #14). */
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
  /** Timeline comments posted from the announcement window. */
  comments: AnnouncementComment[]
  /** Employees enrolled through the announcement window (Vacancy applications / Event enrollments). */
  enrollments: string[]
  history: HistoryEntry[]
}

const noTargets: Targeting = {
  companies: [],
  jurisdictions: [],
  locations: [],
  departments: [],
  positions: [],
  groups: [],
  workforceTypes: [],
}

const t = (partial: Partial<Targeting>): Targeting => ({ ...noTargets, ...partial })

const defaults = {
  kind: 'General' as AnnouncementKind,
  type: 'Adhoc' as AnnouncementType,
  eventBasis: 'None' as EventBasis,
  recurrencePattern: 'Yearly' as RecurrencePattern,
  recurrenceDays: [] as string[],
  announceOn: 'On date' as AnnounceOn,
  announceOffsetDays: 0,
  notifyAnnouncerBeforeDays: 0,
  expireInDays: 0,
  announceOnWeeklyOff: false,
  announceOnHolidays: false,
  startTime: '',
  visibleToAll: false,
  notifyByEmail: false,
  notifySubject: '',
  template: '',
  link: '',
  attachment: '',
  prevStatus: null as AnnouncementStatus | null,
  pendingWith: null as string | null,
  hidden: false,
  read: false,
  comments: [] as AnnouncementComment[],
  enrollments: [] as string[],
}

type SeedInput = Partial<Announcement> &
  Pick<
    Announcement,
    | 'id'
    | 'title'
    | 'body'
    | 'startDate'
    | 'endDate'
    | 'targeting'
    | 'tenant'
    | 'creator'
    | 'createdAt'
    | 'status'
    | 'history'
  >

const ann = (input: SeedInput): Announcement => ({ ...defaults, ...input })

export const seedAnnouncements: Announcement[] = [
  ann({
    id: 'a-01',
    title: 'Q3 All-Hands on 10 July',
    body: 'Join the quarterly all-hands at 10:00 AM IST in the Hyderabad auditorium and on the live stream. Agenda: H1 results, Q3 priorities, and open Q&A with leadership.',
    startTime: '09:00',
    startDate: '2026-06-28',
    endDate: '2026-07-15',
    targeting: t({ companies: ['Aster Digital'], groups: ['All Hands'] }),
    visibleToAll: true,
    notifyByEmail: true,
    notifySubject: 'Reminder: Q3 All-Hands on 10 July',
    link: 'https://intranet.aster.dev/all-hands-q3',
    attachment: 'Q3-All-Hands-Agenda.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-20',
    status: 'Published',
    comments: [
      { id: 'c-01', author: 'Anita Rao', at: '2026-06-29', text: 'Looking forward to the Q&A — posted to my timeline.' },
    ],
    history: [
      { at: '2026-06-20', event: 'Created by Priya Sharma' },
      { at: '2026-06-24', event: 'Approved by Meera Iyer' },
      { at: '2026-06-28', event: 'Published by scheduling engine' },
    ],
  }),
  ann({
    id: 'a-02',
    title: 'Revised Hyderabad shuttle timings',
    body: 'From 1 July the evening shuttle departs at 6:30 PM and 8:00 PM. Route maps are attached. Contact facilities for stop changes.',
    startDate: '2026-06-22',
    startTime: '10:00',
    endDate: '2026-07-31',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'], locations: ['Hyderabad'] }),
    attachment: 'Shuttle-Routes-July.pdf',
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-18',
    status: 'Published',
    read: true,
    history: [
      { at: '2026-06-18', event: 'Created by Rahul Verma' },
      { at: '2026-06-22', event: 'Published by Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-03',
    title: 'June wellness challenge — results',
    body: 'Congratulations to the Bengaluru team for topping the June step challenge leaderboard! Prizes will be distributed by the Wellness Committee this week.',
    startDate: '2026-06-15',
    endDate: '2026-06-30',
    targeting: t({ companies: ['Aster Digital'], groups: ['All Hands', 'Wellness Committee'] }),
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-12',
    status: 'Published',
    read: true,
    history: [
      { at: '2026-06-12', event: 'Created by Meera Iyer' },
      { at: '2026-06-15', event: 'Published by Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-04',
    title: 'New parental leave policy',
    body: 'Effective 10 July, parental leave increases to 26 weeks for primary caregivers and 6 weeks for secondary caregivers. Full policy in the attached handbook.',
    startDate: '2026-07-10',
    startTime: '09:00',
    endDate: '2026-08-31',
    targeting: t({ companies: ['Aster Digital'], departments: ['Human Resources', 'Engineering', 'Sales', 'Finance', 'Operations'] }),
    notifyByEmail: true,
    notifySubject: 'New parental leave policy effective 10 July',
    link: 'https://intranet.aster.dev/policies/parental-leave',
    attachment: 'Parental-Leave-Policy-v3.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-25',
    status: 'Scheduled',
    notifyAnnouncerBeforeDays: 2,
    history: [
      { at: '2026-06-25', event: 'Created by Priya Sharma' },
      { at: '2026-06-27', event: 'Approved by Meera Iyer' },
      { at: '2026-06-27', event: 'Scheduled for 10 Jul 2026' },
    ],
  }),
  ann({
    id: 'a-05',
    title: 'Office closure — electrical maintenance',
    body: 'The Hyderabad office will be closed on Saturday 12 July for annual electrical maintenance. Badge access will be disabled from 6 AM to 8 PM.',
    startDate: '2026-07-08',
    endDate: '2026-07-13',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad'] }),
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-30',
    status: 'Pending approval',
    pendingWith: 'Priya Sharma',
    history: [
      { at: '2026-06-30', event: 'Created by Rahul Verma' },
      { at: '2026-06-30', event: 'Submitted for approval to Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-06',
    title: 'Contractor timesheet portal migration',
    body: 'All contractors must move to the new timesheet portal by 20 July. Legacy submissions close on 18 July. Onboarding guide attached.',
    startDate: '2026-07-05',
    endDate: '2026-07-20',
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Contractor'] }),
    link: 'https://timesheets.aster.dev',
    attachment: 'Timesheet-Portal-Guide.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-29',
    status: 'Pending approval',
    pendingWith: 'Meera Iyer',
    history: [
      { at: '2026-06-29', event: 'Created by Priya Sharma' },
      { at: '2026-06-29', event: 'Submitted for approval to Meera Iyer' },
    ],
  }),
  ann({
    id: 'a-07',
    title: 'Annual compliance training window',
    body: 'The 2026 compliance training window runs 15 July – 15 August. Completion is mandatory for all full-time employees.',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Full-time'] }),
    link: 'https://learn.aster.dev/compliance-2026',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-26',
    status: 'Approved',
    notifyAnnouncerBeforeDays: 5,
    history: [
      { at: '2026-06-26', event: 'Created by Meera Iyer' },
      { at: '2026-06-28', event: 'Approved by Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-08',
    title: 'Diwali celebration planning volunteers',
    body: 'We are looking for volunteers to help plan this year’s Diwali celebrations across India offices. Sign-ups open soon.',
    startDate: '2026-09-20',
    endDate: '2026-10-25',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'] }),
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-07-01',
    status: 'Draft',
    history: [{ at: '2026-07-01', event: 'Created by Priya Sharma' }],
  }),
  ann({
    id: 'a-09',
    title: 'Vendor discount promotion',
    body: 'Partner vendor is offering 20% off gym memberships for employees this month.',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    targeting: t({ companies: ['Aster Digital'] }),
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-24',
    status: 'Rejected',
    history: [
      { at: '2026-06-24', event: 'Created by Rahul Verma' },
      { at: '2026-06-25', event: 'Submitted for approval to Priya Sharma' },
      { at: '2026-06-26', event: 'Rejected by Priya Sharma — commercial promotions need procurement sign-off' },
    ],
  }),
  ann({
    id: 'a-10',
    title: 'Beta program for internal AI assistant',
    body: 'Engineering is piloting an internal AI assistant. This announcement was withdrawn pending a security review.',
    startDate: '2026-07-14',
    endDate: null,
    targeting: t({ companies: ['Aster Digital'], departments: ['Engineering'] }),
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-23',
    status: 'Withdrawn',
    history: [
      { at: '2026-06-23', event: 'Created by Priya Sharma' },
      { at: '2026-06-23', event: 'Submitted for approval to Meera Iyer' },
      { at: '2026-06-27', event: 'Withdrawn by Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-11',
    title: 'Cafeteria vendor change — feedback survey',
    body: 'We are evaluating a new cafeteria vendor and will share a tasting schedule. On hold while contract terms are finalized.',
    startDate: '2026-07-20',
    endDate: '2026-08-05',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad', 'Bengaluru'] }),
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-06-21',
    status: 'On Hold',
    prevStatus: 'Approved',
    history: [
      { at: '2026-06-21', event: 'Created by Meera Iyer' },
      { at: '2026-06-22', event: 'Approved by Priya Sharma' },
      { at: '2026-06-29', event: 'Placed On Hold by Priya Sharma' },
    ],
  }),
  ann({
    id: 'a-12',
    title: 'Old VPN retirement notice',
    body: 'The legacy VPN endpoint retires on 30 June. This notice was retracted after the migration deadline moved.',
    startDate: '2026-06-10',
    endDate: '2026-06-30',
    targeting: t({ companies: ['Aster Digital'], departments: ['Engineering', 'Operations'] }),
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-08',
    status: 'Unpublished',
    history: [
      { at: '2026-06-08', event: 'Created by Priya Sharma' },
      { at: '2026-06-10', event: 'Published by Priya Sharma' },
      { at: '2026-06-14', event: 'Unpublished by Priya Sharma — deadline moved' },
    ],
  }),
  ann({
    id: 'a-13',
    title: 'May Day holiday reminder',
    body: 'All India offices remain closed on 1 May for May Day.',
    startDate: '2026-04-25',
    endDate: '2026-05-02',
    targeting: t({ companies: ['Aster Digital'], jurisdictions: ['India'] }),
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-04-20',
    status: 'Completed',
    read: true,
    history: [
      { at: '2026-04-20', event: 'Created by Meera Iyer' },
      { at: '2026-04-25', event: 'Published by scheduling engine' },
      { at: '2026-05-02', event: 'Expired — moved to Recently Completed' },
      { at: '2026-05-16', event: 'Archived — moved to Completed' },
    ],
  }),
  ann({
    id: 'a-14',
    title: 'Insurance enrollment window closed',
    body: 'The FY27 insurance enrollment window closed on 25 June. Late requests go through HR helpdesk.',
    startDate: '2026-06-01',
    endDate: '2026-06-25',
    targeting: t({ companies: ['Aster Digital'] }),
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-05-28',
    status: 'Recently Completed',
    read: true,
    history: [
      { at: '2026-05-28', event: 'Created by Priya Sharma' },
      { at: '2026-06-01', event: 'Published by scheduling engine' },
      { at: '2026-06-26', event: 'Expired — moved to Recently Completed' },
    ],
  }),
  ann({
    id: 'a-15',
    title: 'Birthday greetings',
    body: 'Wishing you a very happy birthday! Have a wonderful year ahead.',
    type: 'Recurring',
    eventBasis: 'Date of Birth',
    recurrencePattern: 'Yearly',
    recurrenceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    announceOn: 'On date',
    notifyAnnouncerBeforeDays: 1,
    expireInDays: 1,
    announceOnWeeklyOff: true,
    announceOnHolidays: true,
    startDate: '2026-01-01',
    endDate: null,
    visibleToAll: true,
    targeting: t({ companies: ['Aster Digital'] }),
    notifyByEmail: true,
    notifySubject: 'Happy birthday, {{employee}}!',
    template: 'Dear {{employee}},\n\nThe whole {{company}} family wishes you a very happy birthday on {{date}}. Have a wonderful year ahead!',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-01-01',
    status: 'Published',
    read: true,
    comments: [
      { id: 'c-02', author: 'Josh Patel', at: '2026-07-08', text: 'Happy birthday Anita! Posted to her timeline.' },
    ],
    history: [
      { at: '2026-01-01', event: 'Created by Meera Iyer' },
      { at: '2026-01-01', event: 'Published — fires on each employee’s date of birth' },
    ],
  }),
  ann({
    id: 'a-16',
    title: 'Service anniversary greetings',
    body: 'Congratulations on your work anniversary! Thank you for everything you do.',
    type: 'Recurring',
    eventBasis: 'Service Anniversary',
    recurrencePattern: 'Yearly',
    recurrenceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    announceOn: 'Before date',
    announceOffsetDays: 1,
    notifyAnnouncerBeforeDays: 2,
    expireInDays: 2,
    startDate: '2026-01-01',
    endDate: null,
    targeting: t({ companies: ['Aster Digital'], workforceTypes: ['Full-time', 'Part-time'] }),
    notifyByEmail: true,
    notifySubject: 'Congratulations on your service anniversary, {{employee}}!',
    template: 'Dear {{employee}},\n\nCongratulations on completing another year at {{company}}. Thank you for everything you do!',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-01-01',
    status: 'Published',
    read: true,
    history: [
      { at: '2026-01-01', event: 'Created by Priya Sharma' },
      { at: '2026-01-01', event: 'Published — fires one day before each service anniversary' },
    ],
  }),
  ann({
    id: 'a-17',
    title: 'Cafeteria menu update',
    body: 'A refreshed cafeteria menu goes live next week. Hidden while pricing is confirmed.',
    startDate: '2026-06-25',
    endDate: '2026-07-25',
    targeting: t({ companies: ['Aster Digital'], locations: ['Hyderabad'] }),
    tenant: 'Aster Digital',
    creator: 'Rahul Verma',
    createdAt: '2026-06-22',
    status: 'Published',
    hidden: true,
    history: [
      { at: '2026-06-22', event: 'Created by Rahul Verma' },
      { at: '2026-06-25', event: 'Published by Priya Sharma' },
      { at: '2026-06-26', event: 'Hidden by Priya Sharma — pricing under review' },
    ],
  }),
  ann({
    id: 'a-18',
    title: 'Platform maintenance window — 6 July',
    body: 'SatelliteHR will be unavailable on Sunday 6 July, 1:00–3:00 AM UTC for scheduled platform maintenance. All companies are affected.',
    startDate: '2026-07-01',
    endDate: '2026-07-07',
    targeting: t({}),
    visibleToAll: true,
    link: 'https://status.satellitehr.dev',
    tenant: 'Platform',
    creator: 'Platform Ops',
    createdAt: '2026-06-28',
    status: 'Published',
    history: [
      { at: '2026-06-28', event: 'Created by Platform Ops' },
      { at: '2026-07-01', event: 'Published platform-wide by scheduling engine' },
    ],
  }),
  ann({
    id: 'a-19',
    title: 'Open vacancy: Senior Software Engineer (Platform team)',
    body: 'We are hiring a Senior Software Engineer for the Platform team in Hyderabad. Internal candidates and referrals are welcome — apply through this announcement before 25 July.',
    kind: 'Vacancy',
    startDate: '2026-07-02',
    startTime: '11:00',
    endDate: '2026-07-25',
    visibleToAll: true,
    targeting: t({ companies: ['Aster Digital'] }),
    notifyByEmail: true,
    notifySubject: 'Internal vacancy: Senior Software Engineer (Platform team)',
    link: 'https://careers.aster.dev/jobs/sse-platform',
    attachment: 'SSE-Platform-JD.pdf',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-06-30',
    status: 'Published',
    enrollments: ['Nikhil Bose'],
    history: [
      { at: '2026-06-30', event: 'Created by Priya Sharma' },
      { at: '2026-07-01', event: 'Approved by Meera Iyer' },
      { at: '2026-07-02', event: 'Published — vacancy posted to the announcement window' },
      { at: '2026-07-06', event: 'Nikhil Bose applied through the announcement window' },
    ],
  }),
  ann({
    id: 'a-20',
    title: 'Enroll: Advanced Excel training — 18 July',
    body: 'A hands-on Advanced Excel workshop will be conducted on 18 July, 2–5 PM in the Hyderabad training room (and remote). Seats are limited to 25 — enroll through this announcement.',
    kind: 'Event',
    startDate: '2026-07-03',
    startTime: '09:30',
    endDate: '2026-07-18',
    targeting: t({ companies: ['Aster Digital'], departments: ['Finance', 'Operations', 'Human Resources'] }),
    notifyByEmail: true,
    notifySubject: 'Enrollments open: Advanced Excel training on 18 July',
    attachment: 'Advanced-Excel-Syllabus.pdf',
    tenant: 'Aster Digital',
    creator: 'Meera Iyer',
    createdAt: '2026-07-01',
    status: 'Published',
    enrollments: ['Ravi Kumar', 'Grace Lin'],
    comments: [
      { id: 'c-03', author: 'Grace Lin', at: '2026-07-05', text: 'Enrolled — pivot tables at last! Shared on my timeline.' },
    ],
    history: [
      { at: '2026-07-01', event: 'Created by Meera Iyer' },
      { at: '2026-07-02', event: 'Approved by Priya Sharma' },
      { at: '2026-07-03', event: 'Published — enrollments open through the announcement window' },
      { at: '2026-07-04', event: 'Ravi Kumar enrolled through the announcement window' },
      { at: '2026-07-05', event: 'Grace Lin enrolled through the announcement window' },
    ],
  }),
  ann({
    id: 'a-21',
    title: 'New joinee welcome',
    body: 'Please join us in giving a warm welcome to our newest colleagues!',
    type: 'Recurring',
    eventBasis: 'New Joinee Welcome',
    recurrencePattern: 'Weekly',
    recurrenceDays: ['Mon'],
    announceOn: 'After date',
    announceOffsetDays: 1,
    notifyAnnouncerBeforeDays: 1,
    expireInDays: 7,
    startDate: '2026-03-01',
    endDate: null,
    visibleToAll: true,
    targeting: t({ companies: ['Aster Digital'], groups: ['All Hands'] }),
    template: 'Team {{company}},\n\nPlease give a warm welcome to {{employee}}, who joined us on {{date}}. Say hello on their timeline!',
    tenant: 'Aster Digital',
    creator: 'Priya Sharma',
    createdAt: '2026-03-01',
    status: 'Draft',
    history: [{ at: '2026-03-01', event: 'Created by Priya Sharma — awaiting review' }],
  }),
]

/** Event-based image repository entry (PDF: Announcement images). */
export interface AnnouncementImage {
  id: string
  name: string
  /** Source location captured on upload (filename browse or URL). */
  url: string
  eventType: Exclude<EventBasis, 'None'>
  years: number
  updatedAt: string
}

export const seedImages: AnnouncementImage[] = [
  { id: 'img-01', name: 'birthday-balloons.png', url: 'https://assets.aster.dev/announcements/birthday-balloons.png', eventType: 'Date of Birth', years: 0, updatedAt: '2026-01-05' },
  { id: 'img-02', name: 'anniversary-1yr-confetti.png', url: 'https://assets.aster.dev/announcements/anniversary-1yr-confetti.png', eventType: 'Service Anniversary', years: 1, updatedAt: '2026-01-05' },
  { id: 'img-03', name: 'anniversary-3yr-badge.png', url: 'https://assets.aster.dev/announcements/anniversary-3yr-badge.png', eventType: 'Service Anniversary', years: 3, updatedAt: '2026-02-11' },
  { id: 'img-04', name: 'anniversary-5yr-trophy.png', url: 'https://assets.aster.dev/announcements/anniversary-5yr-trophy.png', eventType: 'Service Anniversary', years: 5, updatedAt: '2026-02-11' },
  { id: 'img-05', name: 'anniversary-10yr-gold.png', url: 'https://assets.aster.dev/announcements/anniversary-10yr-gold.png', eventType: 'Service Anniversary', years: 10, updatedAt: '2026-03-02' },
  { id: 'img-06', name: 'anniversary-15yr-platinum.png', url: 'https://assets.aster.dev/announcements/anniversary-15yr-platinum.png', eventType: 'Service Anniversary', years: 15, updatedAt: '2026-03-02' },
  { id: 'img-07', name: 'welcome-aboard-banner.png', url: 'https://assets.aster.dev/announcements/welcome-aboard-banner.png', eventType: 'New Joinee Welcome', years: 0, updatedAt: '2026-03-10' },
  { id: 'img-08', name: 'wedding-anniversary-flowers.png', url: 'https://assets.aster.dev/announcements/wedding-anniversary-flowers.png', eventType: 'Wedding Anniversary', years: 0, updatedAt: '2026-04-15' },
]

/** Simulated email notification entry recorded by the notification engine. */
export interface NotificationEntry {
  id: string
  at: string
  channel: 'Email'
  to: string
  subject: string
  announcementTitle: string
}

export const seedNotifications: NotificationEntry[] = [
  {
    id: 'n-01',
    at: '2026-07-02',
    channel: 'Email',
    to: '11 employees (Aster Digital — all)',
    subject: 'Internal vacancy: Senior Software Engineer (Platform team)',
    announcementTitle: 'Open vacancy: Senior Software Engineer (Platform team)',
  },
  {
    id: 'n-02',
    at: '2026-07-03',
    channel: 'Email',
    to: '5 employees (Finance, Operations, Human Resources)',
    subject: 'Enrollments open: Advanced Excel training on 18 July',
    announcementTitle: 'Enroll: Advanced Excel training — 18 July',
  },
  {
    id: 'n-03',
    at: '2026-07-08',
    channel: 'Email',
    to: 'Priya Sharma (Announcement Coordinator)',
    subject: 'Review reminder: "New parental leave policy" publishes on 10 Jul',
    announcementTitle: 'New parental leave policy',
  },
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
