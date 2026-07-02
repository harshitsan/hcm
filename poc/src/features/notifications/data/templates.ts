/**
 * Notification/Email template library (FR 6.27.4 + Kensium Configuration >
 * HRMS > Templates). Templates are versioned + effective-dated (NTF-20) and
 * seeded per HR domain (NTF-25); email and in-app variants are paired per
 * event (NTF-27).
 */

export const TEMPLATE_DOMAINS = [
  'Recruitment & Onboarding',
  'Asset',
  'Finance',
  'Travel',
  'Timesheet',
  'Performance',
  'Survey',
  'Training',
  'Resource Management',
  'Feedback & Grievance',
] as const

export type TemplateDomain = (typeof TEMPLATE_DOMAINS)[number]

export type TemplateChannel = 'email' | 'in-app'

export type TemplateLevel = 'Portfolio' | 'Group' | 'Company'

/** Supported dynamic fields the placeholder picker offers (NTF-11). */
export const PLACEHOLDERS = [
  '{{employee_name}}',
  '{{company_name}}',
  '{{item_name}}',
  '{{requester_name}}',
  '{{approver_name}}',
  '{{due_date}}',
  '{{effective_date}}',
  '{{amount}}',
  '{{link}}',
] as const

/** Sample data used by the live preview renderer (NTF-24). */
export const PLACEHOLDER_SAMPLES: Record<string, string> = {
  employee_name: 'Priya Nair',
  company_name: 'Northwind Retail Co.',
  item_name: 'Leave request LR-2214',
  requester_name: 'Marcus Lane',
  approver_name: 'Dana Whitfield',
  due_date: '15 Jul 2026',
  effective_date: '01 Aug 2026',
  amount: '$412.80',
  // 'link' intentionally has no sample so missing-value handling is visible.
}

export const BRAND_COLORS = [
  'Northwind Blue',
  'Slate Grey',
  'Forest Green',
  'Signal Orange',
] as const

export interface TemplateVersion {
  version: number
  subject: string
  body: string
  brandColor: (typeof BRAND_COLORS)[number]
  includeLogo: boolean
  effectiveFrom: string
  updatedBy: string
  note: string
}

export interface NotificationTemplate {
  /** Kensium-style Template Type ID shown in the list screen (NTF-26). */
  id: string
  event: string
  domain: TemplateDomain
  channel: TemplateChannel
  description: string
  task: string
  level: TemplateLevel
  /** Ships seeded with the product; customized once an admin edits it. */
  customized: boolean
  versions: TemplateVersion[]
}

function v1(
  subject: string,
  body: string,
  effectiveFrom = '2026-01-01'
): TemplateVersion {
  return {
    version: 1,
    subject,
    body,
    brandColor: 'Northwind Blue',
    includeLogo: true,
    effectiveFrom,
    updatedBy: 'System (seeded)',
    note: 'Seeded default',
  }
}

export const seedTemplates: NotificationTemplate[] = [
  {
    id: 'TPL-REC-001',
    event: 'Offer Approval',
    domain: 'Recruitment & Onboarding',
    channel: 'email',
    description: 'Sent to the approver when an offer requires approval',
    task: 'Notify offer approver',
    level: 'Company',
    customized: true,
    versions: [
      v1(
        'Offer approval required — {{item_name}}',
        'Dear {{approver_name}},\n\nAn offer for {{item_name}} raised by {{requester_name}} awaits your approval by {{due_date}}.\n\nOpen the offer: {{link}}'
      ),
      {
        version: 2,
        subject: 'Action needed: offer approval — {{item_name}}',
        body: 'Hi {{approver_name}},\n\n{{requester_name}} has submitted an offer ({{item_name}}) that needs your approval by {{due_date}}.\n\nReview it here: {{link}}\n\n— {{company_name}} Talent Team',
        brandColor: 'Northwind Blue',
        includeLogo: true,
        effectiveFrom: '2026-05-12',
        updatedBy: 'Dana Whitfield',
        note: 'Warmer tone + talent team signature',
      },
    ],
  },
  {
    id: 'TPL-REC-002',
    event: 'Candidate Acknowledgement',
    domain: 'Recruitment & Onboarding',
    channel: 'email',
    description: 'Acknowledges a candidate application was received',
    task: 'Acknowledge candidate',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'We received your application, {{employee_name}}',
        'Dear {{employee_name}},\n\nThank you for applying to {{company_name}}. Your application for {{item_name}} has been received and is under review.'
      ),
    ],
  },
  {
    id: 'TPL-REC-003',
    event: 'Employee Joining',
    domain: 'Recruitment & Onboarding',
    channel: 'email',
    description: 'Welcome email with joining details for a new employee',
    task: 'Notify joiner',
    level: 'Group',
    customized: false,
    versions: [
      v1(
        'Welcome to {{company_name}} — your joining details',
        'Dear {{employee_name}},\n\nWelcome aboard! Your joining date is {{effective_date}}. Your pre-joining checklist is available at {{link}}.'
      ),
    ],
  },
  {
    id: 'TPL-REC-004',
    event: 'Pre-Joining HR',
    domain: 'Recruitment & Onboarding',
    channel: 'in-app',
    description: 'In-app task alert to HR for pre-joining preparation',
    task: 'Notify HR custodian',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Pre-joining tasks for {{employee_name}}',
        '{{employee_name}} joins on {{effective_date}}. Complete the pre-joining checklist: {{item_name}}.'
      ),
    ],
  },
  {
    id: 'TPL-REC-005',
    event: 'Cancel Candidate',
    domain: 'Recruitment & Onboarding',
    channel: 'email',
    description: 'Informs a candidate their candidature is cancelled',
    task: 'Notify candidate',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Update on your application with {{company_name}}',
        'Dear {{employee_name}},\n\nWe regret to inform you that your candidature for {{item_name}} has been cancelled. We wish you the best in your search.'
      ),
    ],
  },
  {
    id: 'TPL-REC-006',
    event: 'Reference Check',
    domain: 'Recruitment & Onboarding',
    channel: 'email',
    description: 'Requests a reference check from a referee',
    task: 'Contact referee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Reference request for {{employee_name}}',
        'Hello,\n\n{{employee_name}} has listed you as a referee for their application at {{company_name}}. Please share your feedback by {{due_date}}: {{link}}'
      ),
    ],
  },
  {
    id: 'TPL-AST-001',
    event: 'Asset Assignment',
    domain: 'Asset',
    channel: 'email',
    description: 'Notifies an employee that an asset has been assigned',
    task: 'Notify assignee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Asset assigned: {{item_name}}',
        'Dear {{employee_name}},\n\n{{item_name}} has been assigned to you effective {{effective_date}}. Please acknowledge receipt at {{link}}.'
      ),
    ],
  },
  {
    id: 'TPL-AST-002',
    event: 'Asset Assignment',
    domain: 'Asset',
    channel: 'in-app',
    description: 'In-app notification pairing the asset assignment email',
    task: 'Notify assignee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Asset assigned',
        '{{item_name}} was assigned to you on {{effective_date}}. Tap to acknowledge.'
      ),
    ],
  },
  {
    id: 'TPL-AST-003',
    event: 'Asset Return / Custodian Change',
    domain: 'Asset',
    channel: 'email',
    description: 'Notifies custodian changes and asset return requests',
    task: 'Notify custodian',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Asset return requested: {{item_name}}',
        'Dear {{employee_name}},\n\nPlease return {{item_name}} by {{due_date}}. The receiving custodian is {{approver_name}}.'
      ),
    ],
  },
  {
    id: 'TPL-FIN-001',
    event: 'Reimbursement Processed',
    domain: 'Finance',
    channel: 'email',
    description: 'Confirms a reimbursement has been processed for payout',
    task: 'Notify claimant',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Reimbursement processed: {{amount}}',
        'Dear {{employee_name}},\n\nYour reimbursement of {{amount}} for {{item_name}} has been processed and will reflect in your next payout.'
      ),
    ],
  },
  {
    id: 'TPL-TRV-001',
    event: 'Travel Management Actual Expense',
    domain: 'Travel',
    channel: 'email',
    description: 'Sends actual expense summary after trip completion',
    task: 'Notify traveller',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Actual expenses recorded for {{item_name}}',
        'Dear {{employee_name}},\n\nActual expenses of {{amount}} were recorded for {{item_name}}. Review the breakdown: {{link}}'
      ),
    ],
  },
  {
    id: 'TPL-TRV-002',
    event: 'Travel Request Approval',
    domain: 'Travel',
    channel: 'in-app',
    description: 'Alerts the approver that a travel request awaits action',
    task: 'Notify approver',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Travel request awaiting approval',
        '{{requester_name}} submitted {{item_name}} for approval. Due by {{due_date}}.'
      ),
    ],
  },
  {
    id: 'TPL-TSM-001',
    event: 'Short Time',
    domain: 'Timesheet',
    channel: 'email',
    description: 'Flags a short-time condition on an employee timesheet',
    task: 'Notify employee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Short time recorded for {{item_name}}',
        'Dear {{employee_name}},\n\nYour timesheet {{item_name}} shows recorded time below the expected hours. Please review and correct by {{due_date}}.'
      ),
    ],
  },
  {
    id: 'TPL-TSM-002',
    event: 'Timesheet Submission Reminder',
    domain: 'Timesheet',
    channel: 'in-app',
    description: 'Reminds employees to submit their weekly timesheet',
    task: 'Remind employee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Timesheet due',
        'Your timesheet {{item_name}} is due by {{due_date}}. Submit it to stay compliant.'
      ),
    ],
  },
  {
    id: 'TPL-PRF-001',
    event: 'Goal KRA Ratings',
    domain: 'Performance',
    channel: 'email',
    description: 'Notifies an employee their goal/KRA ratings are published',
    task: 'Notify employee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Your goal & KRA ratings are published',
        'Dear {{employee_name}},\n\nYour ratings for {{item_name}} have been published by {{approver_name}}. View them here: {{link}}'
      ),
    ],
  },
  {
    id: 'TPL-PRF-002',
    event: 'Appraisal Cycle Stage Change',
    domain: 'Performance',
    channel: 'in-app',
    description: 'Alerts participants when the appraisal cycle advances',
    task: 'Notify participants',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Appraisal cycle updated',
        '{{item_name}} has advanced to the next stage. Your action is due by {{due_date}}.'
      ),
    ],
  },
  {
    id: 'TPL-SRV-001',
    event: 'Survey Notification',
    domain: 'Survey',
    channel: 'email',
    description: 'Invites employees to participate in a launched survey',
    task: 'Invite employee',
    level: 'Group',
    customized: false,
    versions: [
      v1(
        'You are invited: {{item_name}}',
        'Dear {{employee_name}},\n\nYou are invited to take part in {{item_name}}. The survey closes on {{due_date}}: {{link}}'
      ),
    ],
  },
  {
    id: 'TPL-TRN-001',
    event: 'Enrollment',
    domain: 'Training',
    channel: 'email',
    description: 'Confirms enrollment into a training program',
    task: 'Notify learner',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Enrolled: {{item_name}}',
        'Dear {{employee_name}},\n\nYou are enrolled in {{item_name}} starting {{effective_date}}. Session details: {{link}}'
      ),
    ],
  },
  {
    id: 'TPL-TRN-002',
    event: 'Reimbursement / Sponsorship',
    domain: 'Training',
    channel: 'in-app',
    description: 'Updates learners on training reimbursement or sponsorship',
    task: 'Notify learner',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Training sponsorship update',
        'Your sponsorship request for {{item_name}} ({{amount}}) was updated by {{approver_name}}.'
      ),
    ],
  },
  {
    id: 'TPL-RSM-001',
    event: 'Resource Allocation',
    domain: 'Resource Management',
    channel: 'in-app',
    description: 'Alerts an employee when allocated to a project/resource plan',
    task: 'Notify employee',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'You have been allocated',
        'You are allocated to {{item_name}} effective {{effective_date}}. Contact {{approver_name}} for details.'
      ),
    ],
  },
  {
    id: 'TPL-FGR-001',
    event: 'Feedback / Grievance Acknowledgement',
    domain: 'Feedback & Grievance',
    channel: 'email',
    description: 'Acknowledges a submitted feedback or grievance',
    task: 'Acknowledge submitter',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'We received your submission: {{item_name}}',
        'Dear {{employee_name}},\n\nYour submission {{item_name}} has been received and will be reviewed. You will be notified of status changes.'
      ),
    ],
  },
  {
    id: 'TPL-FGR-002',
    event: 'Feedback / Grievance Acknowledgement',
    domain: 'Feedback & Grievance',
    channel: 'in-app',
    description: 'In-app pairing of the grievance acknowledgement email',
    task: 'Acknowledge submitter',
    level: 'Company',
    customized: false,
    versions: [
      v1(
        'Submission received',
        '{{item_name}} was received. Track its status here: {{link}}'
      ),
    ],
  },
]

/** Renders template text substituting sample values; unresolved placeholders degrade gracefully (NTF-11). */
export function renderWithSamples(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = PLACEHOLDER_SAMPLES[key]
    return value !== undefined ? value : '—'
  })
}

export function currentVersion(template: NotificationTemplate): TemplateVersion {
  return template.versions[template.versions.length - 1]
}
