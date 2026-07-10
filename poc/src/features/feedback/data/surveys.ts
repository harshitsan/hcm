/**
 * Survey configuration & catalog seeds (Kensium Configuration → Surveys):
 * per-tenant Survey Module toggle (SET-01..04), location-mapped survey
 * approvers (SAP-01..05), the survey list with period/status search
 * (SVL-01..07), and survey email templates. In-memory for the POC.
 */

export const SURVEY_STATUSES = [
  'Draft',
  'Pending Approval',
  'Published',
  'Completed',
] as const
export type SurveyStatus = (typeof SURVEY_STATUSES)[number]

export const SURVEY_PERIODS = [
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
] as const
export type SurveyPeriod = (typeof SURVEY_PERIODS)[number]

export const SURVEY_APPLICABILITY = [
  'All Employees',
  'Aster Retail',
  'Aster Logistics',
  'Borealis Tech',
  'Managers Only',
] as const

export const SURVEY_LOCATIONS = [
  'Hyderabad',
  'Chennai',
  'Bengaluru',
  'Mumbai',
  'Remote (India)',
] as const

/** People eligible to act as survey approvers (mock directory slice). */
export const SURVEY_APPROVER_CATALOG = [
  'Meera Iyer',
  'Rahul Verma',
  'Anita Desai',
  'Vikram Rao',
  'Priya Nair',
  'Suresh Menon',
] as const

export interface Survey {
  id: string
  title: string
  period: SurveyPeriod
  startDate: string
  endDate: string
  anonymous: boolean
  createdBy: string
  publishedOn: string | null
  applicability: string
  status: SurveyStatus
  description: string
}

export interface SurveyApproverMapping {
  id: string
  groupId: string
  location: string
  approvers: string[]
}

export interface SurveyEmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  updatedOn: string
}

export interface SurveySettings {
  /** "Enable Survey Module?" Yes/No (SET-01). */
  moduleEnabled: boolean
  savedOn: string | null
  savedBy: string | null
}

export const seedSurveySettings: SurveySettings = {
  moduleEnabled: true,
  savedOn: '2026-05-20',
  savedBy: 'Meera Iyer',
}

export const seedSurveyApprovers: SurveyApproverMapping[] = [
  {
    id: 'sap-1',
    groupId: 'GRP-001',
    location: 'Hyderabad',
    approvers: ['Meera Iyer', 'Rahul Verma'],
  },
  {
    id: 'sap-2',
    groupId: 'GRP-002',
    location: 'Chennai',
    approvers: ['Anita Desai'],
  },
  {
    id: 'sap-3',
    groupId: 'GRP-003',
    location: 'Remote (India)',
    approvers: ['Vikram Rao', 'Priya Nair'],
  },
]

export const seedSurveys: Survey[] = [
  {
    id: 'svy-1',
    title: 'Quarterly Engagement Pulse',
    period: 'Q2 2026',
    startDate: '2026-04-06',
    endDate: '2026-04-20',
    anonymous: true,
    createdBy: 'Meera Iyer',
    publishedOn: '2026-04-05',
    applicability: 'All Employees',
    status: 'Completed',
    description: 'Recurring pulse on engagement, manager support and workload.',
  },
  {
    id: 'svy-2',
    title: 'Cafeteria & Facilities Feedback',
    period: 'Q2 2026',
    startDate: '2026-05-11',
    endDate: '2026-05-25',
    anonymous: false,
    createdBy: 'Rahul Verma',
    publishedOn: '2026-05-10',
    applicability: 'Aster Retail',
    status: 'Completed',
    description: 'Site services satisfaction across retail locations.',
  },
  {
    id: 'svy-3',
    title: 'Hybrid Work Policy Survey',
    period: 'Q3 2026',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    anonymous: true,
    createdBy: 'Meera Iyer',
    publishedOn: '2026-06-28',
    applicability: 'All Employees',
    status: 'Published',
    description: 'Input on the proposed 3-2 hybrid working policy.',
  },
  {
    id: 'svy-4',
    title: 'Manager Effectiveness 360',
    period: 'Q3 2026',
    startDate: '2026-07-20',
    endDate: '2026-08-03',
    anonymous: true,
    createdBy: 'Anita Desai',
    publishedOn: null,
    applicability: 'Managers Only',
    status: 'Pending Approval',
    description: 'Upward feedback cycle for people managers.',
  },
  {
    id: 'svy-5',
    title: 'Benefits Enrollment Experience',
    period: 'Q3 2026',
    startDate: '2026-08-10',
    endDate: '2026-08-24',
    anonymous: false,
    createdBy: 'Priya Nair',
    publishedOn: null,
    applicability: 'Borealis Tech',
    status: 'Pending Approval',
    description: 'Post-enrollment experience and plan clarity check.',
  },
  {
    id: 'svy-6',
    title: 'Exit Themes Deep-Dive',
    period: 'Q4 2026',
    startDate: '2026-10-05',
    endDate: '2026-10-19',
    anonymous: true,
    createdBy: 'Meera Iyer',
    publishedOn: null,
    applicability: 'All Employees',
    status: 'Draft',
    description: 'Follow-up on attrition themes surfaced in exit interviews.',
  },
  {
    id: 'svy-7',
    title: 'IT Helpdesk Satisfaction',
    period: 'Q4 2026',
    startDate: '2026-11-02',
    endDate: '2026-11-16',
    anonymous: false,
    createdBy: 'Vikram Rao',
    publishedOn: null,
    applicability: 'All Employees',
    status: 'Draft',
    description: 'Service desk responsiveness and resolution quality.',
  },
]

export const seedSurveyTemplates: SurveyEmailTemplate[] = [
  {
    id: 'svy-tmpl-invite',
    name: 'Survey invitation',
    subject: 'You are invited: {{survey_title}}',
    body: 'Hi {{recipient}},\n\nThe survey "{{survey_title}}" is open from {{start_date}} to {{end_date}}. {{anonymity_note}}\n\nPlease share your feedback before the closing date.\n\n— {{company}} HR',
    updatedOn: '2026-05-20',
  },
  {
    id: 'svy-tmpl-approval',
    name: 'Approval request to survey approver',
    subject: 'Approval needed: {{survey_title}}',
    body: 'Hi {{approver}},\n\nA new survey "{{survey_title}}" targeting {{applicability}} awaits your approval for the {{location}} group.\n\n— Survey workflow',
    updatedOn: '2026-05-20',
  },
  {
    id: 'svy-tmpl-reminder',
    name: 'Participation reminder',
    subject: 'Reminder: {{survey_title}} closes on {{end_date}}',
    body: 'Hi {{recipient}},\n\nA quick reminder that "{{survey_title}}" closes on {{end_date}}. It takes about 5 minutes to complete.\n\n— {{company}} HR',
    updatedOn: '2026-06-02',
  },
]
