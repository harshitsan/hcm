/**
 * Orientation module vocabulary + seed data — configuration artifacts
 * (notification rules, physical resources, presenter panels, question bank,
 * email/notification templates) and the orientation programs run against them.
 */

export const TRAINING_MODES = ['In-person', 'Virtual', 'Hybrid'] as const
export type TrainingMode = (typeof TRAINING_MODES)[number]

export const NOTIFICATION_MODES = ['Email', 'SMS', 'Email & SMS'] as const
export type NotificationMode = (typeof NOTIFICATION_MODES)[number]

export const RECURRENCE_PATTERNS = [
  'One-time',
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
] as const
export type RecurrencePattern = (typeof RECURRENCE_PATTERNS)[number]

export const RESOURCE_TYPES = [
  'Conference Room',
  'Training Hall',
  'Auditorium',
  'Computer Lab',
  'Cafeteria',
] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const ORIENTATION_TOPICS = [
  'Company Overview',
  'HR Policies',
  'IT & Security',
  'Payroll & Benefits',
  'Workplace Safety',
] as const

export interface NotificationRule {
  id: string
  location: string
  mode: NotificationMode
  recurrence: RecurrencePattern
}

export interface PhysicalResource {
  id: string
  resource: string
  type: ResourceType
  location: string
  capacity: number
  contactPerson: string
  department: string
  mobile: string
  email: string
}

export interface PresenterPanel {
  id: string
  panel: string
  description: string
  locations: string[]
  topics: string[]
}

export interface OrientationQuestion {
  id: string
  question: string
  options: string[]
  answer: string
  locations: string[]
  topic: string
}

/** Read-only communication template (email or in-app notification). */
export interface OrientationTemplate {
  id: string
  type: string
  description: string
  task: string
  subject: string
  body: string
}

export type ProgramStatus =
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled'

export interface OrientationProgram {
  id: string
  title: string
  mode: TrainingMode
  participants: number
  location: string
  startDate: string
  panel: string
  status: ProgramStatus
}

export const seedNotificationRules: NotificationRule[] = [
  { id: 'nr-9a01', location: 'Hyderabad', mode: 'Email', recurrence: 'Daily' },
  {
    id: 'nr-9a02',
    location: 'Bengaluru',
    mode: 'Email & SMS',
    recurrence: 'Weekly',
  },
]

export const seedPhysicalResources: PhysicalResource[] = [
  {
    id: 'prs-3f01',
    resource: 'Innovation Hall',
    type: 'Training Hall',
    location: 'Hyderabad',
    capacity: 60,
    contactPerson: 'Kavya Reddy',
    department: 'Operations',
    mobile: '+91 98480 22110',
    email: 'kavya.reddy@aurora.example',
  },
  {
    id: 'prs-3f02',
    resource: 'Summit Boardroom',
    type: 'Conference Room',
    location: 'Bengaluru',
    capacity: 18,
    contactPerson: 'Arjun Nair',
    department: 'IT Support',
    mobile: '+91 99020 45678',
    email: 'arjun.nair@aurora.example',
  },
  {
    id: 'prs-3f03',
    resource: 'Lakeside Auditorium',
    type: 'Auditorium',
    location: 'Pune',
    capacity: 140,
    contactPerson: 'Sneha Kulkarni',
    department: 'Human Resources',
    mobile: '+91 98220 78901',
    email: 'sneha.kulkarni@aurora.example',
  },
]

export const seedPresenterPanels: PresenterPanel[] = [
  {
    id: 'pnl-7c01',
    panel: 'People Team Panel',
    description: 'HR business partners covering policy and benefits sessions.',
    locations: ['Hyderabad', 'Bengaluru'],
    topics: ['HR Policies', 'Payroll & Benefits'],
  },
  {
    id: 'pnl-7c02',
    panel: 'Tech Enablement Panel',
    description: 'IT security leads for device, access and security induction.',
    locations: ['Hyderabad', 'Pune', 'Austin'],
    topics: ['IT & Security'],
  },
]

export const seedQuestions: OrientationQuestion[] = [
  {
    id: 'qsn-5d01',
    question: 'How many days of paid leave does a new full-time hire accrue per year?',
    options: ['12 days', '18 days', '24 days', '30 days'],
    answer: '24 days',
    locations: ['Hyderabad', 'Bengaluru'],
    topic: 'HR Policies',
  },
  {
    id: 'qsn-5d02',
    question: 'Which team should you contact first when you suspect a phishing email?',
    options: ['Your manager', 'IT Security desk', 'Human Resources', 'Facilities'],
    answer: 'IT Security desk',
    locations: ['Hyderabad', 'Bengaluru', 'Pune', 'Austin'],
    topic: 'IT & Security',
  },
  {
    id: 'qsn-5d03',
    question: 'By what day of the month is payroll processed?',
    options: ['25th', '28th', 'Last working day', '1st of next month'],
    answer: 'Last working day',
    locations: ['Hyderabad'],
    topic: 'Payroll & Benefits',
  },
]

export const seedEmailTemplates: OrientationTemplate[] = [
  {
    id: 'emt-1a01',
    type: 'Welcome Email',
    description: 'Warm welcome sent when the joiner is added to a program.',
    task: 'Send on program enrolment',
    subject: 'Welcome to Aurora — your orientation awaits',
    body: 'Hi {{FirstName}},\n\nWelcome aboard! You have been enrolled in the {{ProgramTitle}} orientation starting {{StartDate}}. Your agenda, venue and presenter details are attached.\n\n— People Team',
  },
  {
    id: 'emt-1a02',
    type: 'Orientation Invite',
    description: 'Calendar invitation with venue / meeting link details.',
    task: 'Send 3 days before the session',
    subject: 'Invitation: {{ProgramTitle}} on {{StartDate}}',
    body: 'Hi {{FirstName}},\n\nYou are invited to {{ProgramTitle}} at {{Venue}} ({{Location}}). Please arrive 15 minutes early and carry a government ID.\n\n— People Team',
  },
  {
    id: 'emt-1a03',
    type: 'Agenda & Logistics',
    description: 'Day-wise agenda, dress code and logistics summary.',
    task: 'Send 1 day before the session',
    subject: 'Your orientation agenda for {{StartDate}}',
    body: 'Hi {{FirstName}},\n\nHere is your day-wise agenda for {{ProgramTitle}}: sessions run 9:30–17:00 with lunch at 13:00. Wi-Fi and badge collection details are included below.\n\n— People Team',
  },
  {
    id: 'emt-1a04',
    type: 'Evaluation Reminder',
    description: 'Reminder to complete the orientation evaluation quiz.',
    task: 'Send on session completion',
    subject: 'Action needed: complete your orientation evaluation',
    body: 'Hi {{FirstName}},\n\nPlease complete the {{ProgramTitle}} evaluation within 3 working days. It takes about 10 minutes.\n\n— People Team',
  },
  {
    id: 'emt-1a05',
    type: 'Completion Certificate',
    description: 'Certificate email issued after passing the evaluation.',
    task: 'Send on evaluation pass',
    subject: 'Congratulations — orientation complete!',
    body: 'Hi {{FirstName}},\n\nCongratulations on completing {{ProgramTitle}}. Your certificate is attached and has been added to your employee profile.\n\n— People Team',
  },
]

export const seedNotificationTemplates: OrientationTemplate[] = [
  {
    id: 'ntt-2b01',
    type: 'Session Reminder',
    description: 'In-app reminder before each orientation session.',
    task: 'Push 2 hours before the session',
    subject: 'Reminder: {{ProgramTitle}} starts soon',
    body: 'Your orientation session {{ProgramTitle}} begins at {{StartTime}} in {{Venue}}. Tap to view the agenda.',
  },
  {
    id: 'ntt-2b02',
    type: 'Presenter Assignment',
    description: 'Notifies panel members they are presenting a topic.',
    task: 'Push on schedule confirmation',
    subject: 'You are presenting {{Topic}}',
    body: 'You have been assigned to present {{Topic}} for {{ProgramTitle}} on {{StartDate}} at {{Venue}}.',
  },
  {
    id: 'ntt-2b03',
    type: 'Reschedule Notice',
    description: 'Alerts participants when a session is rescheduled.',
    task: 'Push on schedule change',
    subject: '{{ProgramTitle}} has been rescheduled',
    body: 'The session originally planned for {{OldDate}} now runs on {{NewDate}}. Your calendar invite has been updated.',
  },
  {
    id: 'ntt-2b04',
    type: 'Evaluation Due',
    description: 'Nudges new hires whose evaluation is still pending.',
    task: 'Push daily until submitted',
    subject: 'Your orientation evaluation is due',
    body: 'You have not yet submitted the {{ProgramTitle}} evaluation. Complete it to receive your certificate.',
  },
]

export const seedPrograms: OrientationProgram[] = [
  {
    id: 'orp-4e01',
    title: 'July 2026 New Hire Induction — Batch A',
    mode: 'In-person',
    participants: 14,
    location: 'Hyderabad',
    startDate: '2026-07-13',
    panel: 'People Team Panel',
    status: 'scheduled',
  },
  {
    id: 'orp-4e02',
    title: 'Engineering Campus Hires Orientation',
    mode: 'Hybrid',
    participants: 22,
    location: 'Bengaluru',
    startDate: '2026-07-06',
    panel: 'Tech Enablement Panel',
    status: 'in-progress',
  },
  {
    id: 'orp-4e03',
    title: 'Sales Onboarding Cohort Q2',
    mode: 'Virtual',
    participants: 9,
    location: 'Austin',
    startDate: '2026-06-15',
    panel: 'People Team Panel',
    status: 'completed',
  },
  {
    id: 'orp-4e04',
    title: 'Finance & Ops Joiners — June Intake',
    mode: 'In-person',
    participants: 7,
    location: 'Pune',
    startDate: '2026-06-22',
    panel: 'People Team Panel',
    status: 'completed',
  },
  {
    id: 'orp-4e05',
    title: 'Contractor Compliance Orientation',
    mode: 'Virtual',
    participants: 11,
    location: 'Hyderabad',
    startDate: '2026-07-20',
    panel: 'Tech Enablement Panel',
    status: 'scheduled',
  },
  {
    id: 'orp-4e06',
    title: 'Support Desk Refresher Induction',
    mode: 'Hybrid',
    participants: 5,
    location: 'Bengaluru',
    startDate: '2026-07-27',
    panel: 'Tech Enablement Panel',
    status: 'scheduled',
  },
  {
    id: 'orp-4e07',
    title: 'Interns Summer Orientation',
    mode: 'In-person',
    participants: 18,
    location: 'Hyderabad',
    startDate: '2026-06-01',
    panel: 'People Team Panel',
    status: 'cancelled',
  },
]
