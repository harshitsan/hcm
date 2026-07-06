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

export const TRAINING_PROGRAM_STATUSES = [
  'Scheduled',
  'Confirmed',
  'Published',
  'Completed',
  'Enrolled',
  'In Progress',
] as const
export type ProgramStatus = (typeof TRAINING_PROGRAM_STATUSES)[number]

/** Enrolled training programs (ESS-30, TP-02/03/06). */
export interface TrainingProgram {
  id: string
  title: string
  description: string
  status: ProgramStatus
  schedule: string
  /** Schedule window used by the From/To filter (TP-02). */
  scheduleStart: string
  scheduleEnd: string
  /** Pending action on the program, e.g. confirm attendance (TP-06). */
  task: string | null
}

export const seedTrainingPrograms: TrainingProgram[] = [
  { id: 'tp-01', title: 'Prompt engineering for engineers', description: 'Applied LLM patterns for product teams', status: 'In Progress', schedule: 'Tue, Thu — 5 to 6 PM', scheduleStart: '2026-05-19', scheduleEnd: '2026-07-16', task: null },
  { id: 'tp-02', title: 'Advanced React performance workshop', description: 'Profiling, memoisation and RSC migration', status: 'Completed', schedule: 'Mon, Wed — 4 to 5:30 PM', scheduleStart: '2026-04-13', scheduleEnd: '2026-05-06', task: 'Submit feedback form' },
  { id: 'tp-03', title: 'Secure coding essentials', description: 'OWASP top-10 with hands-on labs (mandatory)', status: 'Enrolled', schedule: 'Fri — 3 to 5 PM', scheduleStart: '2026-07-10', scheduleEnd: '2026-08-14', task: null },
  { id: 'tp-04', title: 'Kubernetes operations bootcamp', description: 'Cluster operations, monitoring and incident drills', status: 'Scheduled', scheduleStart: '2026-09-01', scheduleEnd: '2026-09-25', schedule: 'Sat, Sun — 10 AM to 1 PM', task: 'Confirm participation' },
  { id: 'tp-05', title: 'Data privacy & DPDP act briefing', description: 'Compliance briefing for all staff', status: 'Published', schedule: 'Self-paced', scheduleStart: '2026-08-01', scheduleEnd: '2026-08-31', task: null },
  { id: 'tp-06', title: 'Design thinking sprint', description: 'Five-day facilitated product discovery sprint', status: 'Confirmed', schedule: 'Mon–Fri — full day', scheduleStart: '2026-09-07', scheduleEnd: '2026-09-11', task: null },
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
