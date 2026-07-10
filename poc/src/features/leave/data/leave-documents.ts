/**
 * Post-submission document submissions against leave requests (PTO #29–#31,
 * UPTO #20–#22). When a leave type has `documentsRequired`, the employee
 * submits proof from My Leave after applying — upload now, promise a later
 * date, hand over a physical copy, or mark it not needed with a comment.
 */

export type LeaveDocumentStatus =
  | 'submitted'
  | 'submit-later'
  | 'physical-copy'
  | 'not-needed'

export interface LeaveDocumentSubmission {
  id: string
  requestId: string
  leaveType: string
  status: LeaveDocumentStatus
  /** Uploaded file name (status 'submitted'). */
  fileName?: string
  /** Promised submission date (status 'submit-later'). */
  submitLaterDate?: string
  /** Free-text note — physical-copy handover details or not-needed comments. */
  note?: string
  submittedOn?: string
}

export const seedLeaveDocuments: LeaveDocumentSubmission[] = [
  // Priya's dental half-day (lr-2002) — certificate already uploaded.
  {
    id: 'ldoc-1',
    requestId: 'lr-2002',
    leaveType: 'Sick / Medical Leave',
    status: 'submitted',
    fileName: 'dental-procedure-certificate.pdf',
    submittedOn: '2026-07-07',
  },
  // Jordan's FMLA leave (lr-2005) — medical certification promised later.
  {
    id: 'ldoc-2',
    requestId: 'lr-2005',
    leaveType: 'FMLA Leave',
    status: 'submit-later',
    submitLaterDate: '2026-07-20',
    note: 'Awaiting the surgeon’s discharge summary.',
  },
]
