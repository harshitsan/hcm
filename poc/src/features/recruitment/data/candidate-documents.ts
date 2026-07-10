/**
 * Candidate document submissions against the stage-based required-document
 * checklist (Kensium PDF — Hiring → Documents / Offer Letter gating, TA-54).
 * Each required document is fulfilled in one of four modes: submit now
 * (file upload), submit later (committed date), physical copy held by a
 * custodian, or not needed (with comments).
 */

export const SUBMISSION_STATUSES = [
  'submitted',
  'submit-later',
  'physical-copy',
  'not-needed',
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export interface DocumentSubmission {
  id: string
  applicationId: string
  candidateName: string
  docName: string
  docType: string
  requiredAtStage: string
  status: SubmissionStatus
  /** Uploaded file name when status = submitted. */
  fileName?: string
  /** Committed submission date when status = submit-later. */
  submitLaterDate?: string
  /** Comments — physical-copy location note or not-needed justification. */
  note?: string
  /** Who holds the physical copy when status = physical-copy. */
  custodian?: string
  issuanceDate?: string
  expiryDate?: string
  submittedOn?: string
}

/** Matches the RequiredDocument seeds in data/config.ts (doc-1..doc-4). */
export const seedDocumentSubmissions: DocumentSubmission[] = [
  {
    id: 'sub-1',
    applicationId: 'app-01',
    candidateName: 'Kiran Rao',
    docName: 'PAN Card',
    docType: 'Identity',
    requiredAtStage: 'offer',
    status: 'submitted',
    fileName: 'kiran-rao-pan.pdf',
    issuanceDate: '2014-02-10',
    submittedOn: '2026-06-16',
  },
  {
    id: 'sub-2',
    applicationId: 'app-01',
    candidateName: 'Kiran Rao',
    docName: 'Degree Certificate',
    docType: 'Education',
    requiredAtStage: 'reference-check',
    status: 'submitted',
    fileName: 'kiran-rao-btech-degree.pdf',
    issuanceDate: '2016-06-30',
    submittedOn: '2026-06-16',
  },
  {
    id: 'sub-3',
    applicationId: 'app-01',
    candidateName: 'Kiran Rao',
    docName: 'Last 3 Payslips',
    docType: 'Compensation',
    requiredAtStage: 'offer',
    status: 'physical-copy',
    note: 'Originals verified at the Bengaluru office front desk',
    custodian: 'Sunita Patil',
    submittedOn: '2026-06-18',
  },
  {
    id: 'sub-4',
    applicationId: 'app-06',
    candidateName: 'Anita George',
    docName: 'Degree Certificate',
    docType: 'Education',
    requiredAtStage: 'reference-check',
    status: 'submitted',
    fileName: 'anita-george-msc-degree.pdf',
    issuanceDate: '2018-05-20',
    submittedOn: '2026-06-20',
  },
  {
    id: 'sub-5',
    applicationId: 'app-06',
    candidateName: 'Anita George',
    docName: 'PAN Card',
    docType: 'Identity',
    requiredAtStage: 'offer',
    status: 'submit-later',
    submitLaterDate: '2026-07-14',
    note: 'Reprint requested — original misplaced during relocation',
  },
]
