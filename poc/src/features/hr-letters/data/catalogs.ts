/**
 * Domain-scoped template catalogs, channel templates, routing, questionnaire,
 * decision tables, and governance/platform seeds.
 * Covers HLC-20, HLC-23..HLC-27, HLC-30..HLC-38 and the Platform Admin data
 * model stories HLC-16/HLC-17.
 */
import { SIGNING_AUTHORITIES, type HrDocType } from './hr-letters'

/* --------------------------- Domain catalogs (HLC-23) --------------------------- */

export interface DomainCatalog {
  id: string
  name: string
  /** Co-located approver/receiver routing tab, when the domain has one (HLC-31). */
  routingLabel?: string
}

export const DOMAIN_CATALOGS: DomainCatalog[] = [
  { id: 'recruitment', name: 'Recruitment & Onboarding' },
  { id: 'performance', name: 'Performance Management' },
  { id: 'resource', name: 'Resource / Project Management' },
  { id: 'training', name: 'Training & Development' },
  { id: 'timesheet', name: 'Timesheet Management', routingLabel: 'Short Time Settings' },
  { id: 'travel', name: 'Travel & Expense', routingLabel: 'Travel Request Expense Approvers' },
  { id: 'survey', name: 'Survey', routingLabel: 'Survey Approvers' },
  { id: 'feedback', name: 'Feedback & Grievance', routingLabel: 'Feedback/Grievance Receivers' },
  { id: 'asset', name: 'Asset Management' },
  { id: 'finance', name: 'Finance', routingLabel: 'Food Allowance' },
]

export type CatalogChannel = 'email' | 'notification'

export interface CatalogTemplate {
  /** Template Type ID — unique reference for events/integrations (HLC-24). */
  id: string
  domainId: string
  channel: CatalogChannel
  templateType: string
  description: string
  body: string
}

const ct = (
  id: string,
  domainId: string,
  channel: CatalogChannel,
  templateType: string,
  description: string,
  body: string
): CatalogTemplate => ({ id, domainId, channel, templateType, description, body })

export const seedCatalogTemplates: CatalogTemplate[] = [
  // Recruitment & Onboarding — notification channel (HLC-32)
  ct('TT-101', 'recruitment', 'notification', 'Offer Approval', 'Notifies approvers when an offer awaits approval', 'Offer for {{candidate.name}} is awaiting your approval.'),
  ct('TT-102', 'recruitment', 'notification', 'Candidate Acknowledgement', 'Confirms receipt of candidate application', 'Thank you {{candidate.name}}, your application has been received.'),
  ct('TT-103', 'recruitment', 'notification', 'Employee Joining', 'Announces a new joiner to stakeholders', '{{employee.name}} joins {{position.department}} on {{joining.date}}.'),
  ct('TT-104', 'recruitment', 'notification', 'Pre Joining HR', 'Pre-joining checklist reminder to HR', 'Pre-joining checklist for {{candidate.name}} is due.'),
  ct('TT-105', 'recruitment', 'notification', 'Employee Reference Check', 'Requests reference verification', 'Reference check requested for {{candidate.name}}.'),
  ct('TT-106', 'recruitment', 'notification', 'Document Custodian', 'Alerts custodian to collect joining documents', 'Collect joining documents for {{employee.name}}.'),
  ct('TT-107', 'recruitment', 'notification', 'Cancel Candidate', 'Notifies stakeholders of candidature cancellation', 'Candidature of {{candidate.name}} has been cancelled.'),
  ct('TT-108', 'recruitment', 'notification', 'Vacancy', 'Publishes a new vacancy internally', 'New vacancy: {{vacancy.title}} in {{vacancy.department}}.'),
  // Recruitment & Onboarding — email channel (HLC-25)
  ct('TT-121', 'recruitment', 'email', 'Offer Approval Email', 'Email to offer approvers', 'Dear approver, the offer for {{candidate.name}} awaits your action.'),
  ct('TT-122', 'recruitment', 'email', 'Candidate Acknowledgement Email', 'Email acknowledgement to candidate', 'Dear {{candidate.name}}, we have received your application.'),
  ct('TT-123', 'recruitment', 'email', 'Joining Instructions Email', 'Email with day-one instructions', 'Dear {{candidate.name}}, welcome aboard! Please report at 9:00 AM.'),
  ct('TT-124', 'recruitment', 'email', 'Reference Check Email', 'Email to referee', 'Dear {{referee.name}}, please verify the reference for {{candidate.name}}.'),
  ct('TT-125', 'recruitment', 'email', 'Cancel Candidate Email', 'Email informing candidature cancellation', 'Dear {{candidate.name}}, your candidature stands cancelled.'),
  ct('TT-126', 'recruitment', 'email', 'Vacancy Broadcast Email', 'Email broadcasting an open vacancy', 'A new vacancy {{vacancy.title}} is open for applications.'),
  // Performance Management (HLC-33)
  ct('TT-201', 'performance', 'notification', 'KRA / Goal Assignment', 'Notifies employee of assigned KRAs', 'Your KRAs for {{review.cycle}} have been assigned.'),
  ct('TT-202', 'performance', 'notification', 'High Rating Escalation', 'Escalates high ratings to the performance coordinator', 'High rating recorded for {{employee.name}} — coordinator review required.'),
  ct('TT-203', 'performance', 'notification', 'Low Rating Escalation', 'Escalates low ratings to the performance coordinator', 'Low rating recorded for {{employee.name}} — coordinator review required.'),
  ct('TT-204', 'performance', 'notification', 'Publish Ratings', 'Announces published ratings', 'Ratings for {{review.cycle}} have been published.'),
  ct('TT-205', 'performance', 'notification', 'Pre Review Reminder', 'Reminds reviewers before the review window', 'Review window for {{review.cycle}} opens on {{review.start}}.'),
  ct('TT-206', 'performance', 'notification', 'Cutoff Reminder', 'Reminds parties of the ratings cutoff date', 'Ratings cutoff for {{review.cycle}} is {{review.cutoff}}.'),
  // Resource / Project Management (HLC-34)
  ct('TT-301', 'resource', 'notification', 'Project Added', 'Notifies stakeholders of a new project', 'Project {{project.name}} has been created.'),
  ct('TT-302', 'resource', 'notification', 'Project Modified', 'Notifies stakeholders of project changes', 'Project {{project.name}} has been modified.'),
  ct('TT-303', 'resource', 'notification', 'Project Closed', 'Notifies stakeholders of project closure', 'Project {{project.name}} has been closed.'),
  ct('TT-304', 'resource', 'notification', 'Resource Assigned', 'Notifies RM of a resource assignment', '{{employee.name}} assigned to {{project.name}}.'),
  ct('TT-305', 'resource', 'notification', 'Resource Assigned — No RM Escalation', 'Escalates to HR when no reporting manager exists', '{{employee.name}} assigned to {{project.name}} without a reporting manager — HR action needed.'),
  ct('TT-306', 'resource', 'notification', 'Closure Date Reminder', 'Reminds project admin of approaching closure', 'Project {{project.name}} closes on {{project.closureDate}}.'),
  // Training & Development (HLC-35)
  ct('TT-401', 'training', 'email', 'Learning Management', 'Learning management lifecycle email', 'Your learning plan {{course.name}} has been updated.'),
  ct('TT-402', 'training', 'email', 'Reimbursement', 'Training reimbursement email', 'Your reimbursement claim for {{course.name}} is {{claim.status}}.'),
  ct('TT-403', 'training', 'email', 'Sponsorship', 'Training sponsorship email', 'Your sponsorship for {{course.name}} has been {{sponsorship.status}}.'),
  ct('TT-404', 'training', 'email', 'Training Management', 'Training schedule email', 'Training {{course.name}} is scheduled on {{course.date}}.'),
  ct('TT-405', 'training', 'email', 'Enrollment', 'Training enrollment email', 'You are enrolled in {{course.name}} starting {{course.date}}.'),
  // Timesheet Management (HLC-36)
  ct('TT-501', 'timesheet', 'email', 'Timesheet Reminder', 'Standard timesheet submission reminder', 'Your timesheet for {{week.range}} is due.'),
  ct('TT-502', 'timesheet', 'email', 'Timesheet Reminder — RM Disabled', 'Variant used when no active reporting manager exists', 'Your timesheet for {{week.range}} is due (routed via HR — no active RM).'),
  ct('TT-503', 'timesheet', 'email', 'Short Time Email', 'Sent when logged hours fall below the short-time threshold', 'Logged hours for {{week.range}} are below the configured threshold.'),
  // Travel & Expense (HLC-37)
  ct('TT-601', 'travel', 'email', 'Travel Management', 'Travel request lifecycle email', 'Your travel request {{trip.id}} is {{trip.status}}.'),
  ct('TT-602', 'travel', 'email', 'Actual Expense', 'Actual expense submission email', 'Actual expenses for {{trip.id}} have been submitted for approval.'),
  ct('TT-603', 'travel', 'email', 'Additional Advance', 'Additional advance request email', 'Additional advance requested for {{trip.id}}.'),
  // Survey
  ct('TT-701', 'survey', 'notification', 'Survey Published', 'Notifies employees of a new survey', 'Survey {{survey.name}} is now open.'),
  ct('TT-702', 'survey', 'notification', 'Survey Reminder', 'Reminds employees to complete a survey', 'Survey {{survey.name}} closes on {{survey.end}}.'),
  // Feedback & Grievance
  ct('TT-801', 'feedback', 'notification', 'Feedback Received', 'Notifies receivers of new feedback', 'New feedback submitted by {{employee.name}}.'),
  ct('TT-802', 'feedback', 'notification', 'Grievance Escalation', 'Escalates unresolved grievances', 'Grievance {{case.id}} pending beyond SLA.'),
  // Asset Management
  ct('TT-901', 'asset', 'notification', 'Asset Assigned', 'Notifies employee of asset assignment', 'Asset {{asset.tag}} has been assigned to you.'),
  ct('TT-902', 'asset', 'notification', 'Asset Return Due', 'Reminds employee of asset return', 'Asset {{asset.tag}} is due for return on {{asset.dueDate}}.'),
  // Finance
  ct('TT-951', 'finance', 'email', 'Payslip Published', 'Notifies employee of payslip availability', 'Your payslip for {{payroll.month}} is available.'),
  ct('TT-952', 'finance', 'email', 'Food Allowance Credit', 'Food allowance credit email', 'Food allowance for {{payroll.month}} has been credited.'),
]

/* ----------------------- Approver / receiver routing (HLC-31) ----------------------- */

export interface RoutingConfig {
  domainId: string
  label: string
  members: string[]
  /** Short Time Settings threshold, only used by the timesheet domain (HLC-36). */
  thresholdHours?: number
}

export const seedRoutings: RoutingConfig[] = [
  { domainId: 'travel', label: 'Travel Request Expense Approvers', members: ['Kavitha Reddy (Finance)', 'Meera Krishnan (HR Director)'] },
  { domainId: 'survey', label: 'Survey Approvers', members: ['Lakshmi Rao (Company Admin)'] },
  { domainId: 'feedback', label: 'Feedback/Grievance Receivers', members: ['Priya Sharma (HR Executive)', 'Meera Krishnan (HR Director)'] },
  { domainId: 'timesheet', label: 'Short Time Settings', members: ['Priya Sharma (HR Executive)'], thresholdHours: 32 },
  { domainId: 'finance', label: 'Food Allowance', members: [] },
]

/* -------------------- Certification questionnaire (HLC-30) -------------------- */

export interface QuestionnaireQuestion {
  id: string
  text: string
  required: boolean
}

export const seedQuestionnaire: QuestionnaireQuestion[] = [
  { id: 'q-1', text: 'Which certification are you pursuing under this agreement?', required: true },
  { id: 'q-2', text: 'What is the planned examination date?', required: true },
  { id: 'q-3', text: 'How will this certification apply to your current role?', required: false },
]

/* ------------------------- Decision tables (HLC-20) ------------------------- */

export const APPROVAL_WORKFLOWS = [
  'None — finalize directly',
  'Single-step approval',
  'Two-step approval',
] as const
export type ApprovalWorkflow = (typeof APPROVAL_WORKFLOWS)[number]

export interface DecisionRule {
  id: string
  docType: HrDocType
  context: string
  templateVersionRule: string
  approvalWorkflow: ApprovalWorkflow
  signingAuthority: string
  isDefault: boolean
}

export const seedDecisionRules: DecisionRule[] = [
  { id: 'dr-1', docType: 'Appointment Letter', context: 'Event = Hire', templateVersionRule: 'Version effective on generation date', approvalWorkflow: 'Single-step approval', signingAuthority: SIGNING_AUTHORITIES[1], isDefault: false },
  { id: 'dr-2', docType: 'Confirmation Letter', context: 'Event = Confirmation', templateVersionRule: 'Version effective on generation date', approvalWorkflow: 'Single-step approval', signingAuthority: SIGNING_AUTHORITIES[0], isDefault: false },
  { id: 'dr-3', docType: 'Transfer Letter', context: 'Event = Transfer', templateVersionRule: 'Version effective on generation date', approvalWorkflow: 'Single-step approval', signingAuthority: SIGNING_AUTHORITIES[0], isDefault: false },
  { id: 'dr-4', docType: 'Promotion Letter', context: 'Event = Promotion, grade ≥ L4', templateVersionRule: 'Version effective on generation date', approvalWorkflow: 'Two-step approval', signingAuthority: SIGNING_AUTHORITIES[1], isDefault: false },
  { id: 'dr-5', docType: 'Relieving Letter', context: 'Event = Relieving', templateVersionRule: 'Version effective on generation date', approvalWorkflow: 'Single-step approval', signingAuthority: SIGNING_AUTHORITIES[0], isDefault: false },
  { id: 'dr-6', docType: 'Experience Certificate', context: 'On request', templateVersionRule: 'Latest published version', approvalWorkflow: 'None — finalize directly', signingAuthority: SIGNING_AUTHORITIES[0], isDefault: false },
  { id: 'dr-7', docType: 'Address Proof', context: 'On request', templateVersionRule: 'Latest published version', approvalWorkflow: 'None — finalize directly', signingAuthority: SIGNING_AUTHORITIES[2], isDefault: false },
  { id: 'dr-8', docType: 'Employment Verification', context: 'No matching rule', templateVersionRule: 'Latest published version', approvalWorkflow: 'None — finalize directly', signingAuthority: SIGNING_AUTHORITIES[2], isDefault: true },
]

/* --------------------- Group governance (HLC-15 / HLC-38) --------------------- */

export interface CompanyGovernance {
  company: string
  templatesAligned: boolean
  workflowsAligned: boolean
  retentionAligned: boolean
  catalogsAligned: boolean
  divergence: string
}

export const seedGovernance: CompanyGovernance[] = [
  { company: 'Kensium Solutions', templatesAligned: true, workflowsAligned: true, retentionAligned: true, catalogsAligned: true, divergence: '—' },
  { company: 'Kensium LLC', templatesAligned: true, workflowsAligned: false, retentionAligned: true, catalogsAligned: true, divergence: 'Promotion letters skip the two-step approval standard' },
  { company: 'Adroitent', templatesAligned: false, workflowsAligned: true, retentionAligned: true, catalogsAligned: false, divergence: 'Local appointment template diverges; travel catalog missing expense approvers' },
  { company: 'CloudSwipe', templatesAligned: true, workflowsAligned: true, retentionAligned: false, catalogsAligned: true, divergence: 'Retention configured at 5 years instead of the 7-year group rule' },
]

/* ----------------------- Platform data model (HLC-16/17) ----------------------- */

export interface TenantRecord {
  tenant: string
  documents: number
  templates: number
  rowLevelSecurity: boolean
  integrity: 'pass' | 'violations'
  auditEvents: number
  oldestRetained: string
}

export const seedTenantRecords: TenantRecord[] = [
  { tenant: 'Kensium Solutions', documents: 1284, templates: 10, rowLevelSecurity: true, integrity: 'pass', auditEvents: 5921, oldestRetained: '2019-07-02' },
  { tenant: 'Kensium LLC', documents: 342, templates: 8, rowLevelSecurity: true, integrity: 'pass', auditEvents: 1408, oldestRetained: '2020-01-15' },
  { tenant: 'Adroitent', documents: 897, templates: 9, rowLevelSecurity: true, integrity: 'violations', auditEvents: 3610, oldestRetained: '2019-09-20' },
  { tenant: 'CloudSwipe', documents: 156, templates: 7, rowLevelSecurity: true, integrity: 'pass', auditEvents: 640, oldestRetained: '2021-03-11' },
]
