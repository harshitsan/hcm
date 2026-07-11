/**
 * Employee Feedback / Grievance worklist entries (EFG-05).
 *
 * Each entry is raised by a directory employee (`raisedById` references the
 * canonical directory seed), so the worklist can be narrowed by the
 * submitter's employment status (Active / Inactive) and by submitter.
 * Entries submitted by the signed-in mock employee use `SELF_EMPLOYEE_ID`
 * (see ../data/timeline.ts) so the self-service "My Feedback" list and the
 * admin worklist share one queue.
 */

import { SELF_EMPLOYEE_ID } from './timeline'

export const WORKLIST_CATEGORIES = [
  'Grievance',
  'Feedback',
  'Suggestion',
] as const
export type WorklistCategory = (typeof WORKLIST_CATEGORIES)[number]

export const WORKLIST_STATUSES = [
  'Submitted',
  'Under Review',
  'Resolved',
  'Closed',
] as const
export type WorklistStatus = (typeof WORKLIST_STATUSES)[number]

/** Triage flow used by both the admin worklist and My Feedback status list. */
export const NEXT_WORKLIST_STATUS: Partial<
  Record<WorklistStatus, WorklistStatus>
> = {
  Submitted: 'Under Review',
  'Under Review': 'Resolved',
  Resolved: 'Closed',
}

export interface FeedbackWorklistEntry {
  id: string
  /** Human-readable reference number. */
  code: string
  /**
   * Directory employee id of the submitter, or `SELF_EMPLOYEE_ID` for
   * entries filed by the signed-in mock employee through self-service.
   */
  raisedById: string
  category: WorklistCategory
  subject: string
  /** Free-text detail captured by the self-service form. */
  description?: string
  /** Identity withheld from the admin worklist when true. */
  anonymous?: boolean
  submittedOn: string
  status: WorklistStatus
}

export const seedWorklistEntries: FeedbackWorklistEntry[] = [
  {
    id: 'fbw-self-01',
    code: 'EFG-1044',
    raisedById: SELF_EMPLOYEE_ID,
    category: 'Grievance',
    subject: 'Cab drop point changed without prior notice',
    description:
      'The evening cab drop point moved from Gate 2 to Gate 4 this week with no announcement — the extra walk is unsafe after the late shift.',
    submittedOn: '2026-06-24',
    status: 'Under Review',
  },
  {
    id: 'fbw-self-02',
    code: 'EFG-1033',
    raisedById: SELF_EMPLOYEE_ID,
    category: 'Feedback',
    subject: 'Quarterly town hall Q&A format works well',
    description:
      'The anonymous upvoted Q&A in the last town hall surfaced the questions people actually cared about. Please keep it.',
    submittedOn: '2026-05-26',
    status: 'Resolved',
  },
  {
    id: 'fbw-01',
    code: 'EFG-1042',
    raisedById: 'e-02',
    category: 'Grievance',
    subject: 'Overtime hours not reflected in June payroll',
    submittedOn: '2026-06-22',
    status: 'Submitted',
  },
  {
    id: 'fbw-02',
    code: 'EFG-1041',
    raisedById: 'e-05',
    category: 'Feedback',
    subject: 'Onboarding buddy program worked really well',
    submittedOn: '2026-06-20',
    status: 'Under Review',
  },
  {
    id: 'fbw-03',
    code: 'EFG-1040',
    raisedById: 'e-15',
    category: 'Grievance',
    subject: 'Final settlement pending beyond exit date',
    submittedOn: '2026-06-18',
    status: 'Submitted',
  },
  {
    id: 'fbw-04',
    code: 'EFG-1039',
    raisedById: 'e-08',
    category: 'Suggestion',
    subject: 'Add a quiet room on the Hyderabad 3rd floor',
    submittedOn: '2026-06-16',
    status: 'Under Review',
  },
  {
    id: 'fbw-05',
    code: 'EFG-1038',
    raisedById: 'e-02',
    category: 'Feedback',
    subject: 'Manager 1:1 cadence has improved since Q1',
    submittedOn: '2026-06-11',
    status: 'Resolved',
  },
  {
    id: 'fbw-06',
    code: 'EFG-1037',
    raisedById: 'e-15',
    category: 'Grievance',
    subject: 'Experience letter not yet issued after deactivation',
    submittedOn: '2026-06-08',
    status: 'Under Review',
  },
  {
    id: 'fbw-07',
    code: 'EFG-1036',
    raisedById: 'e-11',
    category: 'Grievance',
    subject: 'Cafeteria vendor billing dispute for May',
    submittedOn: '2026-06-04',
    status: 'Resolved',
  },
  {
    id: 'fbw-08',
    code: 'EFG-1035',
    raisedById: 'e-06',
    category: 'Suggestion',
    subject: 'Publish the shift roster two weeks in advance',
    submittedOn: '2026-05-30',
    status: 'Closed',
  },
]
