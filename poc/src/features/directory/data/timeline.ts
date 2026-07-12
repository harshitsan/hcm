/**
 * Employee Timeline feed — seed data.
 *
 * The event-type catalogue (colors, descriptions, documents) is configured in
 * the Employees module; this file holds the actual per-employee feed the
 * Kensium "Employee Timeline" renders, plus the comment threads attached to
 * each milestone. Employee ids/names mirror the directory seed data.
 */
import { seedTimelineEvents as timelineEventConfigs } from '@/features/employees/data/configuration'
import { CURRENT_EMPLOYEE } from '@/features/self-service/data/profile'

/** Fixed "today" used across the POC. */
export const TIMELINE_TODAY = '2026-07-09'

/** The eight configured event types (mirrors the Employees configuration). */
export const TIMELINE_EVENT_TYPES = [
  'Joined',
  'Confirmed',
  'Manager change',
  'Exit',
  'Probation extended',
  'Transferred',
  'Promotion',
  'Rehired',
] as const
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number]

/** Fallback colors if an event type is missing from the configuration. */
const FALLBACK_EVENT_COLORS: Record<TimelineEventType, string> = {
  Joined: '#2563eb',
  Confirmed: '#16a34a',
  'Manager change': '#9333ea',
  Exit: '#dc2626',
  'Probation extended': '#f59e0b',
  Transferred: '#0891b2',
  Promotion: '#7c3aed',
  Rehired: '#059669',
}

const configColorByEvent = new Map(
  timelineEventConfigs.map((c) => [c.event, c.color])
)

/** Color for an event type — configured value first, fallback map second. */
export function eventTypeColor(type: TimelineEventType): string {
  return configColorByEvent.get(type) ?? FALLBACK_EVENT_COLORS[type] ?? '#64748b'
}

/**
 * The signed-in mock employee. Self-service fakes "Anika Sharma"; her feed is
 * keyed under a dedicated id so "My Timeline" and comment authorship both
 * resolve to the same identity.
 */
export const SELF_EMPLOYEE_ID = 'self-anika'
export const SELF_EMPLOYEE_NAME = CURRENT_EMPLOYEE

export interface TimelineEvent {
  id: string
  employeeId: string
  employeeName: string
  eventType: TimelineEventType
  date: string
  description: string
}

export type CommentVisibility = 'public' | 'private'

export interface TimelineComment {
  id: string
  eventId: string
  author: string
  text: string
  visibility: CommentVisibility
  createdOn: string
  attachmentName?: string
}

export const TIMELINE_AUDIENCES = [
  'All employees',
  'HR & managers only',
] as const
export type TimelineAudience = (typeof TIMELINE_AUDIENCES)[number]

/** Per-event-type admin setting (local to this module). */
export interface TimelineEventSetting {
  event: TimelineEventType
  enabled: boolean
  audience: TimelineAudience
}

export const seedTimelineSettings: TimelineEventSetting[] =
  TIMELINE_EVENT_TYPES.map((event) => ({
    event,
    enabled: true,
    // Sensitive lifecycle records default to the restricted audience.
    audience: event === 'Probation extended' ? 'HR & managers only' : 'All employees',
  }))

/**
 * Feed events for the signed-in mock employee plus five directory employees
 * (Daniel Kim e-04, Rohit Verma e-06, Grace Osei e-07, Liam O'Connor e-08,
 * Nina Kowalski e-13). Dates line up with the directory's effective-dated
 * reporting history where one exists.
 */
export const seedFeedEvents: TimelineEvent[] = [
  // ── Anika Sharma (signed-in mock employee) ────────────────────────────────
  { id: 'ev-a1', employeeId: SELF_EMPLOYEE_ID, employeeName: SELF_EMPLOYEE_NAME, eventType: 'Joined', date: '2022-02-14', description: 'Joined Kensium Solutions as Software Engineer, Product Engineering — Bengaluru.' },
  { id: 'ev-a2', employeeId: SELF_EMPLOYEE_ID, employeeName: SELF_EMPLOYEE_NAME, eventType: 'Confirmed', date: '2022-08-14', description: 'Probation completed — confirmed as a permanent employee.' },
  { id: 'ev-a3', employeeId: SELF_EMPLOYEE_ID, employeeName: SELF_EMPLOYEE_NAME, eventType: 'Transferred', date: '2023-05-02', description: 'Moved from Bengaluru Tower A to Tower B with the Product Engineering pod.' },
  { id: 'ev-a4', employeeId: SELF_EMPLOYEE_ID, employeeName: SELF_EMPLOYEE_NAME, eventType: 'Manager change', date: '2024-11-01', description: 'Reporting manager changed to Vikram Mehta (Product Engineering).' },
  { id: 'ev-a5', employeeId: SELF_EMPLOYEE_ID, employeeName: SELF_EMPLOYEE_NAME, eventType: 'Promotion', date: '2025-04-01', description: 'Promoted to Senior Software Engineer — annual promotion cycle.' },

  // ── Daniel Kim (e-04) ─────────────────────────────────────────────────────
  { id: 'ev-d1', employeeId: 'e-04', employeeName: 'Daniel Kim', eventType: 'Joined', date: '2019-11-04', description: 'Joined as Senior Software Engineer, Platform work group — Chennai HQ.' },
  { id: 'ev-d2', employeeId: 'e-04', employeeName: 'Daniel Kim', eventType: 'Exit', date: '2021-01-31', description: 'Resigned — last working day recorded, relieving letter issued.' },
  { id: 'ev-d3', employeeId: 'e-04', employeeName: 'Daniel Kim', eventType: 'Rehired', date: '2021-06-14', description: 'Rejoined after prior exit — earlier service history linked to the new record.' },
  { id: 'ev-d4', employeeId: 'e-04', employeeName: 'Daniel Kim', eventType: 'Promotion', date: '2022-04-01', description: 'Promoted to Engineering Manager.' },
  { id: 'ev-d5', employeeId: 'e-04', employeeName: 'Daniel Kim', eventType: 'Manager change', date: '2023-01-09', description: 'Reporting line moved to Marcus Bell (VP of Engineering).' },

  // ── Rohit Verma (e-06) ────────────────────────────────────────────────────
  { id: 'ev-r1', employeeId: 'e-06', employeeName: 'Rohit Verma', eventType: 'Joined', date: '2021-02-08', description: 'Joined as Software Engineer, Platform work group — Chennai HQ.' },
  { id: 'ev-r2', employeeId: 'e-06', employeeName: 'Rohit Verma', eventType: 'Confirmed', date: '2021-08-08', description: 'Probation completed — confirmation letter issued.' },
  { id: 'ev-r3', employeeId: 'e-06', employeeName: 'Rohit Verma', eventType: 'Promotion', date: '2023-04-01', description: 'Promoted to Senior Software Engineer.' },
  { id: 'ev-r4', employeeId: 'e-06', employeeName: 'Rohit Verma', eventType: 'Transferred', date: '2024-06-01', description: 'Inter-location transfer from Chennai HQ to Hyderabad — transfer letter issued.' },

  // ── Grace Osei (e-07) ─────────────────────────────────────────────────────
  { id: 'ev-g1', employeeId: 'e-07', employeeName: 'Grace Osei', eventType: 'Joined', date: '2023-03-20', description: 'Joined as Software Engineer, Platform work group — Remote.' },
  { id: 'ev-g2', employeeId: 'e-07', employeeName: 'Grace Osei', eventType: 'Probation extended', date: '2023-09-20', description: 'Probation extended by three months — extension letter issued.' },
  { id: 'ev-g3', employeeId: 'e-07', employeeName: 'Grace Osei', eventType: 'Confirmed', date: '2023-12-20', description: 'Confirmed as a permanent employee after the extended probation.' },
  { id: 'ev-g4', employeeId: 'e-07', employeeName: 'Grace Osei', eventType: 'Manager change', date: '2024-02-01', description: 'Reporting manager changed to Daniel Kim (Platform).' },

  // ── Liam O'Connor (e-08) ──────────────────────────────────────────────────
  { id: 'ev-l1', employeeId: 'e-08', employeeName: "Liam O'Connor", eventType: 'Joined', date: '2024-01-15', description: 'Joined as Software Engineer, Delivery work group — Chicago.' },
  { id: 'ev-l2', employeeId: 'e-08', employeeName: "Liam O'Connor", eventType: 'Confirmed', date: '2024-07-15', description: 'Probation completed — confirmation letter issued.' },
  { id: 'ev-l3', employeeId: 'e-08', employeeName: "Liam O'Connor", eventType: 'Transferred', date: '2025-05-12', description: 'Moved from the Platform pod to the Delivery work group.' },
  { id: 'ev-l4', employeeId: 'e-08', employeeName: "Liam O'Connor", eventType: 'Manager change', date: '2026-03-01', description: 'Primary manager changed from Daniel Kim to Elena Petrova, effective 1 Mar 2026.' },

  // ── Nina Kowalski (e-13) ──────────────────────────────────────────────────
  { id: 'ev-n1', employeeId: 'e-13', employeeName: 'Nina Kowalski', eventType: 'Joined', date: '2022-04-01', description: 'Joined as Senior Accountant, Finance Ops — Chicago.' },
  { id: 'ev-n2', employeeId: 'e-13', employeeName: 'Nina Kowalski', eventType: 'Confirmed', date: '2022-10-01', description: 'Probation completed — confirmed as a permanent employee.' },
  { id: 'ev-n3', employeeId: 'e-13', employeeName: 'Nina Kowalski', eventType: 'Promotion', date: '2024-04-01', description: 'Promoted to Finance Manager.' },
  { id: 'ev-n4', employeeId: 'e-13', employeeName: 'Nina Kowalski', eventType: 'Manager change', date: '2026-05-01', description: 'Reporting line moved from Ananya Rao to Priya Sharma, effective 1 May 2026.' },
]

/** Comment threads — a mix of public notes and private HR annotations. */
export const seedFeedComments: TimelineComment[] = [
  // Anika
  { id: 'cm-01', eventId: 'ev-a1', author: 'Tomás Alvarez', text: 'Welcome aboard, Anika! Onboarding checklist shared over email.', visibility: 'public', createdOn: '2022-02-14' },
  { id: 'cm-02', eventId: 'ev-a5', author: 'Vikram Mehta', text: 'Very well deserved — congratulations on the promotion!', visibility: 'public', createdOn: '2025-04-01' },
  { id: 'cm-03', eventId: 'ev-a5', author: 'Tomás Alvarez', text: 'Revised appointment letter issued; new designation effective 1 Apr.', visibility: 'private', createdOn: '2025-04-02', attachmentName: 'promotion-letter-anika.pdf' },
  { id: 'cm-04', eventId: 'ev-a3', author: SELF_EMPLOYEE_NAME, text: 'Note to self: desk allocation CH-B-214 confirmed with facilities.', visibility: 'private', createdOn: '2023-05-03' },

  // Daniel
  { id: 'cm-05', eventId: 'ev-d3', author: 'Marcus Bell', text: 'Welcome back, Daniel — great to have you on Platform again.', visibility: 'public', createdOn: '2021-06-14' },
  { id: 'cm-06', eventId: 'ev-d2', author: 'Tomás Alvarez', text: 'Exit interview completed; flagged as eligible for rehire.', visibility: 'private', createdOn: '2021-02-01', attachmentName: 'exit-interview-daniel.pdf' },

  // Rohit
  { id: 'cm-07', eventId: 'ev-r4', author: 'Daniel Kim', text: 'Transfer aligned with the Hyderabad platform pod ramp-up.', visibility: 'public', createdOn: '2024-06-02' },

  // Grace
  { id: 'cm-08', eventId: 'ev-g2', author: 'Tomás Alvarez', text: 'Extension approved by the panel; revised review scheduled for December.', visibility: 'private', createdOn: '2023-09-21', attachmentName: 'extension-letter-grace.pdf' },
  { id: 'cm-09', eventId: 'ev-g3', author: 'Daniel Kim', text: 'Strong close to the probation period — congratulations, Grace!', visibility: 'public', createdOn: '2023-12-20' },

  // Liam
  { id: 'cm-10', eventId: 'ev-l4', author: 'Elena Petrova', text: 'Welcome to the Delivery team, Liam.', visibility: 'public', createdOn: '2026-03-02' },
  { id: 'cm-11', eventId: 'ev-l4', author: 'Tomás Alvarez', text: 'Reporting change synced to downstream access systems.', visibility: 'private', createdOn: '2026-03-02' },

  // Nina
  { id: 'cm-12', eventId: 'ev-n3', author: 'Priya Sharma', text: 'Congratulations — Finance Ops is in great hands.', visibility: 'public', createdOn: '2024-04-01' },
]
