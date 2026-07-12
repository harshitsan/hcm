/**
 * Survey configuration & catalog seeds (Kensium Configuration → Surveys):
 * per-tenant Survey Module toggle (SET-01..04), location-mapped survey
 * approvers (SAP-01..05), the survey list with period/status search
 * (SVL-01..07), survey email templates, plus the P4 additions — per-survey
 * questionnaires, audience targeting over the shared applicability
 * dimensions, and collected responses with anonymity separation.
 * In-memory for the POC.
 */
import {
  allEmployeesAudience,
  type Audience,
} from './survey-audience'

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

/* ------------------------------------------------------------------ */
/* Questionnaire                                                       */
/* ------------------------------------------------------------------ */

export const QUESTION_TYPES = [
  'Single choice',
  'Multiple choice',
  'Rating (1–5)',
  'Yes / No',
  'Free text',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface SurveyQuestion {
  id: string
  prompt: string
  type: QuestionType
  required: boolean
  /** Answer options — only used by the two choice types. */
  options: string[]
}

/**
 * A recorded answer: option label for single choice / yes-no, option labels
 * for multiple choice, 1–5 for ratings, free text for text questions.
 */
export type SurveyAnswerValue = string | string[] | number

export interface SurveyResponseRecord {
  id: string
  surveyId: string
  /**
   * Who answered — always null for anonymous surveys: identity is separated
   * from responses at submission time and never stored with the answers.
   */
  respondent: string | null
  submittedOn: string
  /** questionId → answer. */
  answers: Record<string, SurveyAnswerValue>
}

/**
 * Participation ledger, kept apart from the answer records. For anonymous
 * surveys this is the only place a name appears — it says who completed
 * (so HR can chase pending invitees) but is not linkable to any answer set.
 */
export interface SurveyParticipant {
  name: string
  completedOn: string
}

export interface Survey {
  id: string
  title: string
  period: SurveyPeriod
  startDate: string
  endDate: string
  /** Locked once the survey is published — responses may already exist. */
  anonymous: boolean
  createdBy: string
  publishedOn: string | null
  /** Human-readable summary of the targeted audience. */
  applicability: string
  /** Audience targeting over the shared applicability dimensions (D1). */
  audience: Audience
  /** Ordered questionnaire the survey presents to its audience. */
  questions: SurveyQuestion[]
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

/* ------------------------------------------------------------------ */
/* Seed questionnaires                                                 */
/* ------------------------------------------------------------------ */

function q(
  id: string,
  prompt: string,
  type: QuestionType,
  required: boolean,
  options: string[] = []
): SurveyQuestion {
  return { id, prompt, type, required, options }
}

const PULSE_QUESTIONS: SurveyQuestion[] = [
  q('svy1-q1', 'How engaged do you feel at work this quarter?', 'Rating (1–5)', true),
  q('svy1-q2', 'How well does your manager support your growth?', 'Rating (1–5)', true),
  q('svy1-q3', 'How manageable is your current workload?', 'Single choice', true, [
    'Very manageable',
    'Mostly manageable',
    'Often stretched',
    'Consistently overloaded',
  ]),
  q('svy1-q4', 'Would you recommend working here to a friend?', 'Yes / No', true),
  q('svy1-q5', 'Which of these would most improve your experience?', 'Multiple choice', false, [
    'Career growth',
    'Recognition',
    'Flexible working',
    'Better tooling',
    'Team events',
  ]),
  q('svy1-q6', 'Anything else you would like leadership to know?', 'Free text', false),
]

const CAFETERIA_QUESTIONS: SurveyQuestion[] = [
  q('svy2-q1', 'How satisfied are you with the food quality?', 'Rating (1–5)', true),
  q('svy2-q2', 'How often do you use the cafeteria?', 'Single choice', true, [
    'Daily',
    '2–3 times a week',
    'Occasionally',
    'Never',
  ]),
  q('svy2-q3', 'Does the menu offer enough variety?', 'Yes / No', true),
  q('svy2-q4', 'What should we add or change?', 'Free text', false),
]

const HYBRID_QUESTIONS: SurveyQuestion[] = [
  q('svy3-q1', 'Do you support the proposed 3-2 hybrid pattern?', 'Yes / No', true),
  q('svy3-q2', 'Which days would you prefer in the office?', 'Single choice', true, [
    'Monday–Wednesday',
    'Tuesday–Thursday',
    'Wednesday–Friday',
    'No preference',
  ]),
  q('svy3-q3', 'How productive is your current work-from-home setup?', 'Rating (1–5)', true),
  q('svy3-q4', 'What concerns you most about the 3-2 pattern?', 'Multiple choice', false, [
    'Commute time',
    'Desk availability',
    'Meeting overload',
    'Team coordination',
    'Childcare / caregiving',
  ]),
  q('svy3-q5', 'Any suggestions to make hybrid work better?', 'Free text', false),
]

const MANAGER_360_QUESTIONS: SurveyQuestion[] = [
  q('svy4-q1', 'My manager communicates priorities clearly.', 'Rating (1–5)', true),
  q('svy4-q2', 'My manager gives actionable feedback.', 'Rating (1–5)', true),
  q('svy4-q3', 'How often do you have one-to-ones?', 'Single choice', true, [
    'Weekly',
    'Fortnightly',
    'Monthly',
    'Rarely',
  ]),
  q('svy4-q4', 'What should your manager start, stop or continue doing?', 'Free text', false),
]

const BENEFITS_QUESTIONS: SurveyQuestion[] = [
  q('svy5-q1', 'How clear were the plan options during enrollment?', 'Rating (1–5)', true),
  q('svy5-q2', 'Did you complete enrollment without needing help?', 'Yes / No', true),
  q('svy5-q3', 'What was confusing or missing?', 'Free text', false),
]

const EXIT_THEMES_QUESTIONS: SurveyQuestion[] = [
  q('svy6-q1', 'Which theme resonates most with why colleagues leave?', 'Single choice', true, [
    'Career growth',
    'Compensation',
    'Manager relationship',
    'Workload',
    'Relocation',
  ]),
  q('svy6-q2', 'What would make people stay longer?', 'Free text', false),
]

const HELPDESK_QUESTIONS: SurveyQuestion[] = [
  q('svy7-q1', 'How satisfied are you with helpdesk response times?', 'Rating (1–5)', true),
  q('svy7-q2', 'How was your last ticket resolved?', 'Single choice', true, [
    'On first contact',
    'Within a day',
    'Within a week',
    'Still open',
  ]),
  q('svy7-q3', 'Anything the service desk should improve?', 'Free text', false),
]

/* ------------------------------------------------------------------ */
/* Survey catalog                                                      */
/* ------------------------------------------------------------------ */

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
    audience: allEmployeesAudience(),
    questions: PULSE_QUESTIONS,
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
    applicability: 'Company: Aster Retail',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'company', values: ['Aster Retail'] }],
    },
    questions: CAFETERIA_QUESTIONS,
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
    audience: allEmployeesAudience(),
    questions: HYBRID_QUESTIONS,
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
    applicability: 'Role group: Department Head, HR Manager, HR Business Partner',
    audience: {
      logic: 'OR',
      criteria: [
        {
          field: 'group',
          values: ['Department Head', 'HR Manager', 'HR Business Partner'],
        },
      ],
    },
    questions: MANAGER_360_QUESTIONS,
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
    applicability: 'Company: Borealis Tech',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'company', values: ['Borealis Tech'] }],
    },
    questions: BENEFITS_QUESTIONS,
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
    audience: allEmployeesAudience(),
    questions: EXIT_THEMES_QUESTIONS,
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
    audience: allEmployeesAudience(),
    questions: HELPDESK_QUESTIONS,
    status: 'Draft',
    description: 'Service desk responsiveness and resolution quality.',
  },
]

/* ------------------------------------------------------------------ */
/* Collected responses                                                 */
/* ------------------------------------------------------------------ */

let seedCounter = 0
function resp(
  surveyId: string,
  respondent: string | null,
  submittedOn: string,
  answers: Record<string, SurveyAnswerValue>
): SurveyResponseRecord {
  seedCounter += 1
  return { id: `resp-${seedCounter}`, surveyId, respondent, submittedOn, answers }
}

/**
 * Answer records. Anonymous surveys (svy-1, svy-3) carry respondent: null —
 * identity was separated at submission. The named cafeteria survey (svy-2)
 * records who said what.
 */
export const seedSurveyResponses: SurveyResponseRecord[] = [
  // svy-1 — Quarterly Engagement Pulse (anonymous, completed): 12 of 16.
  resp('svy-1', null, '2026-04-07', { 'svy1-q1': 4, 'svy1-q2': 4, 'svy1-q3': 'Mostly manageable', 'svy1-q4': 'Yes', 'svy1-q5': ['Career growth', 'Recognition'], 'svy1-q6': 'Quarterly town halls have been a great addition.' }),
  resp('svy-1', null, '2026-04-08', { 'svy1-q1': 3, 'svy1-q2': 2, 'svy1-q3': 'Often stretched', 'svy1-q4': 'No', 'svy1-q5': ['Better tooling', 'Flexible working'] }),
  resp('svy-1', null, '2026-04-09', { 'svy1-q1': 5, 'svy1-q2': 5, 'svy1-q3': 'Very manageable', 'svy1-q4': 'Yes', 'svy1-q5': ['Team events'] }),
  resp('svy-1', null, '2026-04-10', { 'svy1-q1': 4, 'svy1-q2': 4, 'svy1-q3': 'Mostly manageable', 'svy1-q4': 'Yes', 'svy1-q6': 'More cross-team projects would help growth.' }),
  resp('svy-1', null, '2026-04-11', { 'svy1-q1': 2, 'svy1-q2': 3, 'svy1-q3': 'Consistently overloaded', 'svy1-q4': 'No', 'svy1-q5': ['Flexible working'], 'svy1-q6': 'On-call weeks are burning the team out.' }),
  resp('svy-1', null, '2026-04-12', { 'svy1-q1': 4, 'svy1-q2': 5, 'svy1-q3': 'Mostly manageable', 'svy1-q4': 'Yes', 'svy1-q5': ['Career growth'] }),
  resp('svy-1', null, '2026-04-13', { 'svy1-q1': 3, 'svy1-q2': 3, 'svy1-q3': 'Often stretched', 'svy1-q4': 'Yes', 'svy1-q5': ['Recognition', 'Team events'] }),
  resp('svy-1', null, '2026-04-14', { 'svy1-q1': 5, 'svy1-q2': 4, 'svy1-q3': 'Very manageable', 'svy1-q4': 'Yes' }),
  resp('svy-1', null, '2026-04-15', { 'svy1-q1': 4, 'svy1-q2': 3, 'svy1-q3': 'Mostly manageable', 'svy1-q4': 'Yes', 'svy1-q5': ['Better tooling'] }),
  resp('svy-1', null, '2026-04-16', { 'svy1-q1': 3, 'svy1-q2': 4, 'svy1-q3': 'Often stretched', 'svy1-q4': 'Yes', 'svy1-q6': 'Please review meeting load on Mondays.' }),
  resp('svy-1', null, '2026-04-18', { 'svy1-q1': 4, 'svy1-q2': 4, 'svy1-q3': 'Mostly manageable', 'svy1-q4': 'Yes', 'svy1-q5': ['Career growth', 'Flexible working'] }),
  resp('svy-1', null, '2026-04-19', { 'svy1-q1': 5, 'svy1-q2': 5, 'svy1-q3': 'Very manageable', 'svy1-q4': 'Yes', 'svy1-q6': 'Best quarter so far — keep the momentum.' }),

  // svy-2 — Cafeteria & Facilities (named, completed): 5 of 7 Aster Retail.
  resp('svy-2', 'Meera Iyer', '2026-05-12', { 'svy2-q1': 4, 'svy2-q2': 'Daily', 'svy2-q3': 'Yes', 'svy2-q4': 'A larger salad selection would be welcome.' }),
  resp('svy-2', 'Priya Nair', '2026-05-13', { 'svy2-q1': 3, 'svy2-q2': '2–3 times a week', 'svy2-q3': 'No', 'svy2-q4': 'More vegetarian mains, please.' }),
  resp('svy-2', 'Arjun Mehta', '2026-05-15', { 'svy2-q1': 4, 'svy2-q2': 'Daily', 'svy2-q3': 'Yes' }),
  resp('svy-2', 'Sara Thomas', '2026-05-18', { 'svy2-q1': 2, 'svy2-q2': 'Occasionally', 'svy2-q3': 'No', 'svy2-q4': 'Queues at 1pm are far too long.' }),
  resp('svy-2', 'Leo Grant', '2026-05-21', { 'svy2-q1': 5, 'svy2-q2': '2–3 times a week', 'svy2-q3': 'Yes' }),

  // svy-3 — Hybrid Work Policy (anonymous, still open): 6 of 16 so far.
  resp('svy-3', null, '2026-07-02', { 'svy3-q1': 'Yes', 'svy3-q2': 'Tuesday–Thursday', 'svy3-q3': 4, 'svy3-q4': ['Commute time'], 'svy3-q5': 'Anchor days per team would help coordination.' }),
  resp('svy-3', null, '2026-07-03', { 'svy3-q1': 'Yes', 'svy3-q2': 'Monday–Wednesday', 'svy3-q3': 5 }),
  resp('svy-3', null, '2026-07-04', { 'svy3-q1': 'No', 'svy3-q2': 'No preference', 'svy3-q3': 5, 'svy3-q4': ['Commute time', 'Childcare / caregiving'], 'svy3-q5': 'Fully remote works better for my situation.' }),
  resp('svy-3', null, '2026-07-06', { 'svy3-q1': 'Yes', 'svy3-q2': 'Tuesday–Thursday', 'svy3-q3': 3, 'svy3-q4': ['Desk availability'] }),
  resp('svy-3', null, '2026-07-08', { 'svy3-q1': 'Yes', 'svy3-q2': 'Wednesday–Friday', 'svy3-q3': 4 }),
  resp('svy-3', null, '2026-07-10', { 'svy3-q1': 'No', 'svy3-q2': 'No preference', 'svy3-q3': 4, 'svy3-q4': ['Meeting overload'], 'svy3-q5': 'Please define which meetings must be in person.' }),
]

/**
 * Who completed each survey (participation tracking for reminders). Stored
 * apart from the answers: for anonymous surveys the two sets are not
 * linkable — the order here intentionally differs from the answer records.
 */
export const seedSurveyParticipation: Record<string, SurveyParticipant[]> = {
  'svy-1': [
    { name: 'Riya Sharma', completedOn: '2026-04-12' },
    { name: 'Meera Iyer', completedOn: '2026-04-07' },
    { name: 'Priya Nair', completedOn: '2026-04-08' },
    { name: 'Leo Grant', completedOn: '2026-04-09' },
    { name: 'Arjun Mehta', completedOn: '2026-04-10' },
    { name: 'Sara Thomas', completedOn: '2026-04-11' },
    { name: 'Tomás Rivera', completedOn: '2026-04-13' },
    { name: 'Harpreet Kaur', completedOn: '2026-04-14' },
    { name: 'Alina Novak', completedOn: '2026-04-15' },
    { name: 'Noah Berg', completedOn: '2026-04-16' },
    { name: 'Wei Chen', completedOn: '2026-04-18' },
    { name: 'Marcus Bell', completedOn: '2026-04-19' },
  ],
  'svy-2': [
    { name: 'Meera Iyer', completedOn: '2026-05-12' },
    { name: 'Priya Nair', completedOn: '2026-05-13' },
    { name: 'Arjun Mehta', completedOn: '2026-05-15' },
    { name: 'Sara Thomas', completedOn: '2026-05-18' },
    { name: 'Leo Grant', completedOn: '2026-05-21' },
  ],
  'svy-3': [
    { name: 'Arjun Mehta', completedOn: '2026-07-02' },
    { name: 'Sara Thomas', completedOn: '2026-07-03' },
    { name: 'Harpreet Kaur', completedOn: '2026-07-04' },
    { name: 'Alina Novak', completedOn: '2026-07-06' },
    { name: 'Wei Chen', completedOn: '2026-07-08' },
    { name: 'Marcus Bell', completedOn: '2026-07-10' },
  ],
}

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
