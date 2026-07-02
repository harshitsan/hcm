export const LEARNING_STATUSES = [
  'Requested',
  'Pending approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type LearningStatus = (typeof LEARNING_STATUSES)[number]

export const LEARNING_TYPES = ['Training', 'Certification'] as const
export type LearningType = (typeof LEARNING_TYPES)[number]

export const SPONSORSHIP_MODES = [
  'Company sponsored',
  'Reimbursement',
  'Self-funded',
] as const
export type SponsorshipMode = (typeof SPONSORSHIP_MODES)[number]

/** Learning / certification enrolment requests (ESS-29). */
export interface LearningRequest {
  id: string
  program: string
  learningType: LearningType
  sponsorship: SponsorshipMode
  result: string
  status: LearningStatus
  raisedOn: string
  /** Pending step surfaced in the task column (ESS-39). */
  task: string | null
}

export const seedLearningRequests: LearningRequest[] = [
  { id: 'lr-01', program: 'AWS Solutions Architect — Professional', learningType: 'Certification', sponsorship: 'Company sponsored', result: '—', status: 'Pending approval', raisedOn: '2026-06-22', task: null },
  { id: 'lr-02', program: 'Advanced React performance workshop', learningType: 'Training', sponsorship: 'Company sponsored', result: 'Completed — 92%', status: 'Approved', raisedOn: '2026-04-10', task: 'Upload completion certificate' },
  { id: 'lr-03', program: 'Kubernetes CKA', learningType: 'Certification', sponsorship: 'Reimbursement', result: '—', status: 'Requested', raisedOn: '2026-06-26', task: null },
  { id: 'lr-04', program: 'Domain-driven design masterclass', learningType: 'Training', sponsorship: 'Self-funded', result: '—', status: 'Rejected', raisedOn: '2026-03-02', task: null },
  { id: 'lr-05', program: 'Prompt engineering for engineers', learningType: 'Training', sponsorship: 'Company sponsored', result: 'In progress', status: 'Approved', raisedOn: '2026-05-18', task: null },
  { id: 'lr-06', program: 'PMP prep bootcamp', learningType: 'Certification', sponsorship: 'Reimbursement', result: '—', status: 'Cancelled', raisedOn: '2026-02-14', task: null },
]

export type ProgramStatus = 'Enrolled' | 'In Progress' | 'Completed'

/** Enrolled training programs (ESS-30). */
export interface TrainingProgram {
  id: string
  title: string
  description: string
  status: ProgramStatus
  schedule: string
}

export const seedTrainingPrograms: TrainingProgram[] = [
  { id: 'tp-01', title: 'Prompt engineering for engineers', description: 'Applied LLM patterns for product teams', status: 'In Progress', schedule: 'Tue, Thu — 5 to 6 PM' },
  { id: 'tp-02', title: 'Advanced React performance workshop', description: 'Profiling, memoisation and RSC migration', status: 'Completed', schedule: 'Mon, Wed — 4 to 5:30 PM' },
  { id: 'tp-03', title: 'Secure coding essentials', description: 'OWASP top-10 with hands-on labs (mandatory)', status: 'Enrolled', schedule: 'Fri — 3 to 5 PM' },
]

export type CertificationStatus = 'Completed' | 'In Progress' | 'Expired'

/** My certifications with mandatory flags and validity (ESS-30). */
export interface Certification {
  id: string
  name: string
  mandatory: boolean
  status: CertificationStatus
  completedOn: string | null
  validTill: string | null
}

export const seedCertifications: Certification[] = [
  { id: 'ce-01', name: 'AWS Solutions Architect — Associate', mandatory: false, status: 'Completed', completedOn: '2024-09-12', validTill: '2027-09-12' },
  { id: 'ce-02', name: 'Information security awareness', mandatory: true, status: 'Completed', completedOn: '2026-01-20', validTill: '2027-01-20' },
  { id: 'ce-03', name: 'POSH compliance training', mandatory: true, status: 'Completed', completedOn: '2025-08-02', validTill: '2026-08-02' },
  { id: 'ce-04', name: 'First-aid responder', mandatory: false, status: 'Expired', completedOn: '2023-05-15', validTill: '2025-05-15' },
  { id: 'ce-05', name: 'Kubernetes CKAD', mandatory: false, status: 'In Progress', completedOn: null, validTill: null },
]
