/** Portal-surface seeds: announcements, documents, feedback, access policy. */

export interface PortalAnnouncement {
  id: string
  title: string
  body: string
  audience: string
  /** Whether the notification engine's targeting includes the current employee (ESS-17). */
  targetsMe: boolean
  template: string
  publishedOn: string
  read: boolean
}

export const seedAnnouncements: PortalAnnouncement[] = [
  { id: 'an-01', title: 'Q2 town hall on 10 July', body: 'Join the all-hands in the Bengaluru auditorium at 4 PM. Remote employees can join the live stream.', audience: 'All employees', targetsMe: true, template: 'Company broadcast', publishedOn: '2026-06-28', read: false },
  { id: 'an-02', title: 'New health insurance partner', body: 'From 1 August our group medical cover moves to Aditya Birla Health. Existing claims are unaffected.', audience: 'All employees', targetsMe: true, template: 'Benefits update', publishedOn: '2026-06-20', read: false },
  { id: 'an-03', title: 'Engineering guild: RFC review Friday', body: 'Product Engineering RFC review moves to Fridays 11 AM starting this week.', audience: 'Product Engineering', targetsMe: true, template: 'Team notice', publishedOn: '2026-06-18', read: true },
  { id: 'an-04', title: 'Chennai office parking changes', body: 'Basement 2 is closed for maintenance during July.', audience: 'Chennai office', targetsMe: false, template: 'Facility notice', publishedOn: '2026-06-15', read: false },
  { id: 'an-05', title: 'Sales incentive plan FY27', body: 'Updated commission slabs for the sales organisation.', audience: 'Sales', targetsMe: false, template: 'Policy update', publishedOn: '2026-06-10', read: false },
]

export interface EmployeeDocument {
  id: string
  name: string
  category: string
  addedOn: string
  /** Documents outside the employee's authorized scope stay hidden (ESS-07). */
  authorized: boolean
}

export const seedDocuments: EmployeeDocument[] = [
  { id: 'doc-01', name: 'Offer letter — Anika Sharma.pdf', category: 'Employment', addedOn: '2022-02-01', authorized: true },
  { id: 'doc-02', name: 'Promotion letter FY25.pdf', category: 'Employment', addedOn: '2025-04-01', authorized: true },
  { id: 'doc-03', name: 'Form 16 — FY 2025-26.pdf', category: 'Tax', addedOn: '2026-06-05', authorized: true },
  { id: 'doc-04', name: 'Experience letter request — approved.pdf', category: 'Employment', addedOn: '2026-06-01', authorized: true },
  { id: 'doc-05', name: 'POSH policy 2026.pdf', category: 'Policy', addedOn: '2026-01-10', authorized: true },
  { id: 'doc-06', name: 'Org design review (HR only).xlsx', category: 'Restricted', addedOn: '2026-03-14', authorized: false },
  { id: 'doc-07', name: 'Grievance case notes (HR only).pdf', category: 'Restricted', addedOn: '2026-04-22', authorized: false },
]

export type FeedbackStatus = 'Open' | 'Submitted'

export interface FeedbackItem {
  id: string
  title: string
  type: 'Survey' | 'Peer feedback' | 'Pulse poll'
  due: string
  status: FeedbackStatus
}

export const seedFeedback: FeedbackItem[] = [
  { id: 'fb-01', title: 'Annual engagement survey 2026', type: 'Survey', due: '2026-07-15', status: 'Open' },
  { id: 'fb-02', title: 'Peer feedback — Dev Patel (mid-year)', type: 'Peer feedback', due: '2026-07-08', status: 'Open' },
  { id: 'fb-03', title: 'June pulse: hybrid work check-in', type: 'Pulse poll', due: '2026-06-30', status: 'Submitted' },
]

/**
 * Role/policy-controlled section access (ESS-08/11). Company Admins toggle
 * which self-service areas employees can view and act on.
 */
export interface SectionPolicy {
  id: string
  label: string
  view: boolean
  manage: boolean
}

export const seedSectionPolicies: SectionPolicy[] = [
  { id: 'profile', label: 'Profile information', view: true, manage: true },
  { id: 'leave', label: 'Leave', view: true, manage: true },
  { id: 'attendance', label: 'Attendance', view: true, manage: true },
  { id: 'announcements', label: 'Announcements', view: true, manage: false },
  { id: 'documents', label: 'Documents & feedback', view: true, manage: true },
  { id: 'timesheets', label: 'Timesheets', view: true, manage: true },
  { id: 'travel', label: 'Travel & expenses', view: true, manage: true },
  { id: 'learning', label: 'Learning', view: true, manage: true },
  { id: 'assets', label: 'Assets', view: true, manage: true },
  { id: 'tax', label: 'Tax planning', view: true, manage: true },
  { id: 'work', label: 'Allocation & knowledge transfer', view: true, manage: false },
]
