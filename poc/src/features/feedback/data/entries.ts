import { type Role } from '@/context/role-context'

export const ENTRY_TYPES = ['Feedback', 'Grievance'] as const
export type EntryType = (typeof ENTRY_TYPES)[number]

export const ENTRY_STATUSES = [
  'Submitted',
  'Feedback received',
  'Under Review',
  'On Hold',
  'Escalated',
  'Resolved',
  'Closed',
] as const

/** Statuses a receiver may set when responding (Kensium respond form). */
export const RESPONSE_STATUSES = ['Feedback received', 'Closed'] as const
export type EntryStatus = (typeof ENTRY_STATUSES)[number]

/** Companies in the demo tenant hierarchy (portfolio → groups → companies). */
export const COMPANIES = [
  { name: 'Aster Retail', group: 'Aster Group' },
  { name: 'Aster Logistics', group: 'Aster Group' },
  { name: 'Borealis Tech', group: 'Borealis Group' },
] as const

export type CompanyName = (typeof COMPANIES)[number]['name']

/** Personas used by the POC (no auth backend). */
export const CURRENT_EMPLOYEE = 'Riya Sharma'
export const CURRENT_ADMIN = 'Meera Iyer'

/**
 * Authorization scope per canonical role: which companies' entries the active
 * role may see (FBG-03 / FBG-09 / FBG-10 — access restricted to authorized
 * personnel within organizational scope).
 */
export function companiesForRole(role: Role): CompanyName[] {
  switch (role) {
    case 'Platform Admin':
    case 'Portfolio Admin':
      return ['Aster Retail', 'Aster Logistics', 'Borealis Tech']
    case 'Group Company Admin':
      return ['Aster Retail', 'Aster Logistics']
    default:
      return ['Aster Retail']
  }
}

export interface AuditEvent {
  id: string
  at: string
  actor: string
  action: string
  detail: string
}

/**
 * A receiver response to an entry — Type is read-only (the entry's type);
 * copy-to recipients can view the response but cannot respond.
 */
export interface EntryResponse {
  id: string
  at: string
  by: string
  sendTo: string[]
  copyTo: string[]
  comments: string
  /** When checked, the response and comments are visible to the submitter. */
  showToSubmitter: boolean
  /** Status set with the response ('Feedback received' or 'Closed'). */
  status: EntryStatus
}

export interface FeedbackEntry {
  id: string
  type: EntryType
  category: string
  subject: string
  /** Values captured under the form schema active at submission time. */
  details: Record<string, string>
  status: EntryStatus
  /** "Send to" recipients chosen by the submitter (employees or roles). */
  sendTo: string[]
  /** "Copy to" recipients — may view responses but cannot respond. */
  copyTo: string[]
  /** Anonymous only: comma-separated emails where responses are sent. */
  responseEmails: string[]
  /** Optional submitter comments. */
  comments: string
  /** Receiver responses (feedback/grievance history details). */
  responses: EntryResponse[]
  anonymous: boolean
  /** Tracking reference shown instead of an identity for anonymous entries. */
  anonymousRef: string | null
  submittedBy: string | null
  /** Set when a Company Admin filed the entry for an Employee (Non-User). */
  onBehalfOf: string | null
  /** POC stand-in for "this record belongs to the signed-in employee". */
  isMine: boolean
  company: CompanyName
  assignedTo: string
  submittedOn: string
  lastActionOn: string
  schemaVersion: number
  audit: AuditEvent[]
}

let auditSeq = 0
export function auditEvent(
  at: string,
  actor: string,
  action: string,
  detail: string
): AuditEvent {
  auditSeq += 1
  return { id: `ae-${auditSeq}`, at, actor, action, detail }
}

let respSeq = 0
export function entryResponse(
  at: string,
  by: string,
  partial: Omit<EntryResponse, 'id' | 'at' | 'by'>
): EntryResponse {
  respSeq += 1
  return { id: `resp-${respSeq}`, at, by, ...partial }
}

/** Seed shape: recipient/response fields optional, defaulted on load. */
type SeedEntry = Omit<
  FeedbackEntry,
  'sendTo' | 'copyTo' | 'responseEmails' | 'comments' | 'responses'
> &
  Partial<
    Pick<
      FeedbackEntry,
      'sendTo' | 'copyTo' | 'responseEmails' | 'comments' | 'responses'
    >
  >

const rawSeedEntries: SeedEntry[] = [
  {
    id: 'FG-2026-015',
    type: 'Feedback',
    category: 'Workplace Environment',
    subject: 'Parking lot lighting for the night shift',
    details: {
      description:
        'The staff parking lot is poorly lit after 21:00; several colleagues feel unsafe walking to their vehicles.',
      desiredOutcome: 'Install two additional lamp posts near gate 3.',
    },
    status: 'Feedback received',
    anonymous: true,
    anonymousRef: 'ANON-8B4C',
    submittedBy: null,
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Retail',
    assignedTo: 'Meera Iyer',
    submittedOn: '2026-07-01',
    lastActionOn: '2026-07-06',
    schemaVersion: 3,
    sendTo: ['Meera Iyer'],
    copyTo: ['Arjun Mehta'],
    responseEmails: ['night.shift.concerns@personal-mail.example'],
    comments: 'Please treat as urgent before the winter schedule starts.',
    responses: [
      entryResponse('2026-07-06', 'Meera Iyer (HR Manager)', {
        sendTo: ['Sara Thomas'],
        copyTo: ['Arjun Mehta'],
        comments:
          'Facilities budget approved for two lamp posts; installation scheduled within 3 weeks. Security patrol extended in the interim.',
        showToSubmitter: true,
        status: 'Feedback received',
      }),
    ],
    audit: [
      auditEvent('2026-07-01', 'Anonymous (ANON-8B4C)', 'Submitted', 'Anonymous entry submitted via the public (no-login) form — submitter identity never stored.'),
      auditEvent('2026-07-01', 'Workflow engine', 'Routed', 'Sent to Meera Iyer; copy to Arjun Mehta (copy-to recipients can view responses but cannot respond).'),
      auditEvent('2026-07-06', 'Meera Iyer (HR Manager)', 'Responded — status set to Feedback received', 'Response recorded and shown to the submitter.'),
      auditEvent('2026-07-06', 'Notification engine', 'Notification sent', 'Response sent to the submitter-provided email(s): night.shift.concerns@personal-mail.example — identity remains unknown.'),
    ],
  },
  {
    id: 'FG-2026-014',
    type: 'Feedback',
    category: 'Facilities & IT',
    subject: 'Second monitor request queue is too slow',
    details: {
      description:
        'IT asset requests for second monitors take 3+ weeks. Suggest a self-service stock list.',
      desiredOutcome: 'Publish available stock and a 5-day SLA.',
    },
    status: 'Submitted',
    anonymous: false,
    anonymousRef: null,
    submittedBy: CURRENT_EMPLOYEE,
    onBehalfOf: null,
    isMine: true,
    company: 'Aster Retail',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-30',
    lastActionOn: '2026-06-30',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-30', CURRENT_EMPLOYEE, 'Submitted', 'Entry created via submission form (schema v3).'),
      auditEvent('2026-06-30', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Manager.'),
      auditEvent('2026-06-30', 'Notification engine', 'Notification sent', 'Acknowledgement issued to submitter (template: Submission acknowledgement).'),
    ],
  },
  {
    id: 'FG-2026-013',
    type: 'Grievance',
    category: 'Manager Conduct',
    subject: 'Repeated public criticism in team stand-ups',
    details: {
      description:
        'My reporting manager has repeatedly criticised my work in front of the whole team despite requests to give feedback privately.',
      incidentDate: '2026-06-24',
      witnesses: 'Two teammates present in the stand-up',
      desiredOutcome: 'Mediated conversation and a change in review practice.',
    },
    status: 'Under Review',
    anonymous: false,
    anonymousRef: null,
    submittedBy: CURRENT_EMPLOYEE,
    onBehalfOf: null,
    isMine: true,
    company: 'Aster Retail',
    assignedTo: 'HR Business Partner',
    submittedOn: '2026-06-25',
    lastActionOn: '2026-06-27',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-25', CURRENT_EMPLOYEE, 'Submitted', 'Grievance created; confidential handling applies (FR 6.19.2).'),
      auditEvent('2026-06-25', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Business Partner.'),
      auditEvent('2026-06-25', 'Notification engine', 'Notification sent', 'Acknowledgement issued to submitter.'),
      auditEvent('2026-06-27', 'Priya Nair (HR Business Partner)', 'Status changed to Under Review', 'Initial assessment started; interviews scheduled.'),
      auditEvent('2026-06-27', 'Notification engine', 'Notification sent', 'Status-change notification issued to submitter.'),
    ],
  },
  {
    id: 'FG-2026-012',
    type: 'Grievance',
    category: 'Harassment / Discrimination',
    subject: 'Exclusion from projects after maternity leave',
    details: {
      description:
        'Since returning from maternity leave I have been removed from client-facing projects without explanation.',
      incidentDate: '2026-06-10',
      desiredOutcome: 'Restore project allocation; review the decision trail.',
    },
    status: 'Under Review',
    anonymous: true,
    anonymousRef: 'ANON-7K2M',
    submittedBy: null,
    onBehalfOf: null,
    isMine: true,
    company: 'Aster Retail',
    assignedTo: 'Ethics Officer',
    submittedOn: '2026-06-18',
    lastActionOn: '2026-06-22',
    schemaVersion: 3,
    sendTo: ['Leo Grant'],
    copyTo: [],
    responseEmails: ['fair.treatment.2026@personal-mail.example'],
    responses: [
      entryResponse('2026-06-22', 'Leo Grant (Ethics Officer)', {
        sendTo: ['Priya Nair'],
        copyTo: [],
        comments:
          'Case opened under the confidentiality protocol. Project allocation records for Q2 requested from the Engineering PMO.',
        showToSubmitter: true,
        status: 'Feedback received',
      }),
    ],
    audit: [
      auditEvent('2026-06-18', 'Anonymous (ANON-7K2M)', 'Submitted', 'Anonymous entry — submitter identity withheld from receivers.'),
      auditEvent('2026-06-18', 'Workflow engine', 'Routed', 'Assigned to Anonymous receiver role: Ethics Officer.'),
      auditEvent('2026-06-18', 'Notification engine', 'Notification sent', 'Acknowledgement issued via anonymous reference; no identifying details included.'),
      auditEvent('2026-06-22', 'Leo Grant (Ethics Officer)', 'Status changed to Under Review', 'Case notes opened; anonymity preserved.'),
    ],
  },
  {
    id: 'FG-2026-011',
    type: 'Feedback',
    category: 'Policy Suggestion',
    subject: 'Extend hybrid-work core hours policy to warehouse admin staff',
    details: {
      description:
        'Warehouse admin staff can do most planning work remotely; the hybrid policy currently excludes them.',
    },
    status: 'Submitted',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Tomás Rivera',
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Logistics',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-26',
    lastActionOn: '2026-06-26',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-26', 'Tomás Rivera', 'Submitted', 'Entry created via submission form (schema v3).'),
      auditEvent('2026-06-26', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Manager.'),
    ],
  },
  {
    id: 'FG-2026-010',
    type: 'Grievance',
    category: 'Compensation & Benefits',
    subject: 'Overtime hours not reflected in June payslip',
    details: {
      description:
        '14 approved overtime hours from the May stocktake are missing from the June payslip.',
      incidentDate: '2026-06-01',
      desiredOutcome: 'Correction with arrears in the July run.',
    },
    status: 'Escalated',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Harpreet Kaur',
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Logistics',
    assignedTo: 'People Ops Lead',
    submittedOn: '2026-06-12',
    lastActionOn: '2026-06-24',
    schemaVersion: 2,
    audit: [
      auditEvent('2026-06-12', 'Harpreet Kaur', 'Submitted', 'Entry created (schema v2).'),
      auditEvent('2026-06-12', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Manager.'),
      auditEvent('2026-06-17', 'SLA engine', 'Approver reminder issued', 'No approver action within 3 days of receipt.'),
      auditEvent('2026-06-24', 'SLA engine', 'Escalated to coordinator', 'No approver action within 7 days — escalated to People Ops Lead.'),
    ],
  },
  {
    id: 'FG-2026-009',
    type: 'Grievance',
    category: 'Workplace Environment',
    subject: 'Night-shift loading dock lighting is unsafe',
    details: {
      description:
        'Two of four floodlights at dock B are out; forklift operators are working in near darkness.',
      incidentDate: '2026-06-20',
      witnesses: 'Night-shift crew, dock B',
    },
    status: 'Submitted',
    anonymous: false,
    anonymousRef: null,
    submittedBy: null,
    onBehalfOf: 'Sanjay Patel (warehouse operative, non-user)',
    isMine: false,
    company: 'Aster Logistics',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-23',
    lastActionOn: '2026-06-23',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-23', CURRENT_ADMIN, 'Submitted on behalf', 'Filed by Company Admin on behalf of Sanjay Patel (Employee — Non-User).'),
      auditEvent('2026-06-23', 'Workflow engine', 'Routed', 'Entered the same role-based review workflow as direct submissions.'),
    ],
  },
  {
    id: 'FG-2026-008',
    type: 'Feedback',
    category: 'Facilities & IT',
    subject: 'Cafeteria vegetarian options ran out by 12:30 all week',
    details: {
      description: 'Vegetarian counters are consistently understocked; staff on second lunch slot get nothing.',
    },
    status: 'Resolved',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Alina Novak',
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Retail',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-08',
    lastActionOn: '2026-06-15',
    schemaVersion: 2,
    sendTo: ['Meera Iyer'],
    copyTo: ['Devika Rao'],
    responses: [
      entryResponse('2026-06-15', 'Meera Iyer (HR Manager)', {
        sendTo: ['Alina Novak'],
        copyTo: ['Devika Rao'],
        comments:
          'Vendor has doubled the vegetarian stock and added a second counter; we will monitor for two weeks.',
        showToSubmitter: true,
        status: 'Feedback received',
      }),
    ],
    audit: [
      auditEvent('2026-06-08', 'Alina Novak', 'Submitted', 'Entry created (schema v2).'),
      auditEvent('2026-06-09', 'Meera Iyer (HR Manager)', 'Status changed to Under Review', 'Raised with the cafeteria vendor.'),
      auditEvent('2026-06-15', 'Meera Iyer (HR Manager)', 'Status changed to Resolved', 'Vendor doubled vegetarian stock; monitoring for 2 weeks.'),
      auditEvent('2026-06-15', 'Notification engine', 'Notification sent', 'Resolution notification issued to submitter.'),
    ],
  },
  {
    id: 'FG-2026-007',
    type: 'Grievance',
    category: 'Manager Conduct',
    subject: 'Leave requests ignored for over two weeks',
    details: {
      description: 'Three leave requests pending with no response; travel bookings are now at risk.',
      incidentDate: '2026-06-05',
    },
    status: 'On Hold',
    anonymous: true,
    anonymousRef: 'ANON-3Q9X',
    submittedBy: null,
    onBehalfOf: null,
    isMine: false,
    company: 'Borealis Tech',
    assignedTo: 'Unrouted — held',
    submittedOn: '2026-06-21',
    lastActionOn: '2026-06-21',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-21', 'Anonymous (ANON-3Q9X)', 'Submitted', 'Anonymous entry — identity withheld.'),
      auditEvent('2026-06-21', 'Workflow engine', 'Held', 'No Anonymous receiver role configured for this tenant — entry held and flagged rather than routed to an unauthorized party.'),
    ],
  },
  {
    id: 'FG-2026-006',
    type: 'Feedback',
    category: 'Policy Suggestion',
    subject: 'Add a written code-review checklist to onboarding',
    details: {
      description: 'New joiners learn review standards by trial and error; a checklist would cut rework.',
    },
    status: 'Closed',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Wei Chen',
    onBehalfOf: null,
    isMine: false,
    company: 'Borealis Tech',
    assignedTo: 'HR Manager',
    submittedOn: '2026-05-28',
    lastActionOn: '2026-06-11',
    schemaVersion: 2,
    audit: [
      auditEvent('2026-05-28', 'Wei Chen', 'Submitted', 'Entry created (schema v2).'),
      auditEvent('2026-06-02', 'Noah Berg (HR Manager)', 'Status changed to Under Review', 'Shared with the engineering enablement team.'),
      auditEvent('2026-06-11', 'Noah Berg (HR Manager)', 'Status changed to Closed', 'Checklist added to the onboarding wiki.'),
    ],
  },
  {
    id: 'FG-2026-005',
    type: 'Grievance',
    category: 'Harassment / Discrimination',
    subject: 'Offensive jokes in the team chat channel',
    details: {
      description: 'A recurring pattern of offensive "jokes" targeting accents in the #general channel.',
      incidentDate: '2026-06-14',
      witnesses: 'Channel history available',
    },
    status: 'Under Review',
    anonymous: true,
    anonymousRef: 'ANON-5T1W',
    submittedBy: null,
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Retail',
    assignedTo: 'Ethics Officer',
    submittedOn: '2026-06-16',
    lastActionOn: '2026-06-19',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-16', 'Anonymous (ANON-5T1W)', 'Submitted', 'Anonymous entry — identity withheld from receivers and reviewers.'),
      auditEvent('2026-06-16', 'Workflow engine', 'Routed', 'Assigned to Anonymous receiver role: Ethics Officer.'),
      auditEvent('2026-06-19', 'Leo Grant (Ethics Officer)', 'Status changed to Under Review', 'Chat export requested from IT under confidentiality protocol.'),
    ],
  },
  {
    id: 'FG-2026-004',
    type: 'Feedback',
    category: 'Compensation & Benefits',
    subject: 'Meal card top-up date should match payday',
    details: {
      description: 'Meal cards recharge on the 10th but salaries land on the 1st; align the two.',
    },
    status: 'Resolved',
    anonymous: false,
    anonymousRef: null,
    submittedBy: CURRENT_EMPLOYEE,
    onBehalfOf: null,
    isMine: true,
    company: 'Aster Retail',
    assignedTo: 'HR Manager',
    submittedOn: '2026-05-20',
    lastActionOn: '2026-06-03',
    schemaVersion: 2,
    audit: [
      auditEvent('2026-05-20', CURRENT_EMPLOYEE, 'Submitted', 'Entry created (schema v2).'),
      auditEvent('2026-05-26', 'Meera Iyer (HR Manager)', 'Status changed to Under Review', 'Benefits vendor consulted.'),
      auditEvent('2026-06-03', 'Meera Iyer (HR Manager)', 'Status changed to Resolved', 'Top-up moved to the 1st from July.'),
      auditEvent('2026-06-03', 'Notification engine', 'Notification sent', 'Resolution notification issued to submitter.'),
    ],
  },
  {
    id: 'FG-2026-003',
    type: 'Grievance',
    category: 'Workplace Environment',
    subject: 'Broken chairs in the Borealis 3F bullpen',
    details: {
      description: 'Six chairs with broken lumbar support; two engineers report back pain.',
      incidentDate: '2026-06-02',
    },
    status: 'Under Review',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Fatima Al-Amin',
    onBehalfOf: null,
    isMine: false,
    company: 'Borealis Tech',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-27',
    lastActionOn: '2026-06-28',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-27', 'Fatima Al-Amin', 'Submitted', 'Entry created via submission form (schema v3).'),
      auditEvent('2026-06-27', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Manager.'),
      auditEvent('2026-06-28', 'Noah Berg (HR Manager)', 'Status changed to Under Review', 'Facilities ticket raised.'),
    ],
  },
  {
    id: 'FG-2026-002',
    type: 'Feedback',
    category: 'Workplace Environment',
    subject: 'Quiet room is used for calls all day',
    details: {
      description: 'The designated quiet room is permanently occupied by sales calls; needs booking rules.',
    },
    status: 'Submitted',
    anonymous: false,
    anonymousRef: null,
    submittedBy: null,
    onBehalfOf: 'Lena Fischer (store associate, non-user)',
    isMine: false,
    company: 'Aster Retail',
    assignedTo: 'HR Manager',
    submittedOn: '2026-06-24',
    lastActionOn: '2026-06-24',
    schemaVersion: 3,
    audit: [
      auditEvent('2026-06-24', CURRENT_ADMIN, 'Submitted on behalf', 'Filed by Company Admin on behalf of Lena Fischer (Employee — Non-User).'),
      auditEvent('2026-06-24', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Manager.'),
    ],
  },
  {
    id: 'FG-2026-001',
    type: 'Grievance',
    category: 'Compensation & Benefits',
    subject: 'Shift allowance discontinued without notice',
    details: {
      description: 'The weekend shift allowance disappeared from April onwards with no policy communication.',
      incidentDate: '2026-04-30',
      desiredOutcome: 'Reinstate or communicate the policy change formally.',
    },
    status: 'Under Review',
    anonymous: false,
    anonymousRef: null,
    submittedBy: 'Igor Petrov',
    onBehalfOf: null,
    isMine: false,
    company: 'Aster Logistics',
    assignedTo: 'HR Business Partner',
    submittedOn: '2026-06-14',
    lastActionOn: '2026-06-20',
    schemaVersion: 2,
    audit: [
      auditEvent('2026-06-14', 'Igor Petrov', 'Submitted', 'Entry created (schema v2).'),
      auditEvent('2026-06-14', 'Workflow engine', 'Routed', 'Assigned to Non-Anonymous receiver role: HR Business Partner.'),
      auditEvent('2026-06-20', 'Priya Nair (HR Business Partner)', 'Status changed to Under Review', 'Payroll policy history requested.'),
    ],
  },
]

export const seedEntries: FeedbackEntry[] = rawSeedEntries.map((e) => ({
  sendTo: [e.assignedTo],
  copyTo: [],
  responseEmails: [],
  comments: '',
  responses: [],
  ...e,
}))
