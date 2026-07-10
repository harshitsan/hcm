export const QUESTION_SECTIONS = ['Sponsorship', 'Reimbursement'] as const
export type QuestionSection = (typeof QUESTION_SECTIONS)[number]

export const RESPONSE_TYPES = [
  'Free text',
  'Yes / No',
  'Number',
  'Date',
  'Attachment',
] as const
export type ResponseType = (typeof RESPONSE_TYPES)[number]

/** Certification questionnaire question (CQ-01/02): asked when an employee requests sponsorship or reimbursement. */
export interface QuestionnaireQuestion {
  id: string
  section: QuestionSection
  question: string
  responseType: ResponseType
  mandatory: boolean
}

export const seedQuestionnaire: QuestionnaireQuestion[] = [
  { id: 'qq-01', section: 'Sponsorship', question: 'Which certification are you requesting sponsorship for?', responseType: 'Free text', mandatory: true },
  { id: 'qq-02', section: 'Sponsorship', question: 'How does this certification align with your current role?', responseType: 'Free text', mandatory: true },
  { id: 'qq-03', section: 'Sponsorship', question: 'Expected examination date', responseType: 'Date', mandatory: false },
  { id: 'qq-04', section: 'Sponsorship', question: 'Estimated total cost (course + exam)', responseType: 'Number', mandatory: true },
  { id: 'qq-05', section: 'Reimbursement', question: 'Have you already completed the certification?', responseType: 'Yes / No', mandatory: true },
  { id: 'qq-06', section: 'Reimbursement', question: 'Upload the payment receipt', responseType: 'Attachment', mandatory: true },
  { id: 'qq-07', section: 'Reimbursement', question: 'Amount claimed for reimbursement', responseType: 'Number', mandatory: true },
  { id: 'qq-08', section: 'Reimbursement', question: 'Date of certification completion', responseType: 'Date', mandatory: false },
]

/** External trainer engaged for training topics (MET-01..03). */
export interface ExternalTrainer {
  id: string
  name: string
  company: string
  email: string
  skill: string
  trainingsConducted: number
}

export const seedExternalTrainers: ExternalTrainer[] = [
  { id: 'et-01', name: 'Meera Krishnan', company: 'CloudSkill Labs', email: 'meera.k@cloudskilllabs.io', skill: 'AWS / Cloud architecture', trainingsConducted: 14 },
  { id: 'et-02', name: 'Daniel Fernandes', company: 'Agile Gurus', email: 'daniel@agilegurus.com', skill: 'Scrum & SAFe coaching', trainingsConducted: 22 },
  { id: 'et-03', name: 'Priyanka Rao', company: 'SecureFirst Consulting', email: 'priyanka.rao@securefirst.in', skill: 'Application security / OWASP', trainingsConducted: 9 },
  { id: 'et-04', name: 'Vikram Nair', company: 'DataCraft Academy', email: 'vikram@datacraft.academy', skill: 'Data engineering & Spark', trainingsConducted: 6 },
]

/** Learning-management module setup (SET-01..03). */
export interface LearningSetup {
  moduleEnabled: boolean
  selfNomination: boolean
  managerApprovalRequired: boolean
}

export const seedLearningSetup: LearningSetup = {
  moduleEnabled: true,
  selfNomination: true,
  managerApprovalRequired: true,
}

/** Training cost approval routing rule (TCA-01..03). */
export interface TrainingCostApprover {
  id: string
  costFrom: number
  costTo: number
  locations: string
  approvers: string
}

export const seedCostApprovers: TrainingCostApprover[] = [
  { id: 'tca-01', costFrom: 0, costTo: 25000, locations: 'Hyderabad, Chennai', approvers: 'Reporting Manager', },
  { id: 'tca-02', costFrom: 25001, costTo: 100000, locations: 'All India locations', approvers: 'Reporting Manager, HR Head' },
  { id: 'tca-03', costFrom: 100001, costTo: 500000, locations: 'All locations', approvers: 'HR Head, Finance Controller' },
]

export const TRAINING_MODES = ['Classroom', 'Online', 'Hybrid'] as const
export type TrainingMode = (typeof TRAINING_MODES)[number]

/** Training topic in the catalog (TT-01..03). */
export interface TrainingTopic {
  id: string
  name: string
  description: string
  mode: TrainingMode
  durationHours: number
  trainers: string
}

export const seedTrainingTopics: TrainingTopic[] = [
  { id: 'tt-01', name: 'AWS Solutions Architecture', description: 'Designing resilient workloads on AWS', mode: 'Online', durationHours: 24, trainers: 'Meera Krishnan' },
  { id: 'tt-02', name: 'Secure coding essentials', description: 'OWASP top-10 with hands-on labs', mode: 'Classroom', durationHours: 16, trainers: 'Priyanka Rao, Daniel Fernandes' },
  { id: 'tt-03', name: 'Agile delivery foundations', description: 'Scrum ceremonies, estimation and flow metrics', mode: 'Hybrid', durationHours: 12, trainers: 'Daniel Fernandes' },
  { id: 'tt-04', name: 'Data engineering with Spark', description: 'Batch and streaming pipelines at scale', mode: 'Online', durationHours: 32, trainers: 'Vikram Nair' },
  { id: 'tt-05', name: 'Effective business communication', description: 'Writing and presenting for stakeholders', mode: 'Classroom', durationHours: 8, trainers: 'Meera Krishnan, Daniel Fernandes' },
  { id: 'tt-06', name: 'Kubernetes operations', description: 'Cluster operations, monitoring and drills', mode: 'Hybrid', durationHours: 20, trainers: 'Vikram Nair' },
]
