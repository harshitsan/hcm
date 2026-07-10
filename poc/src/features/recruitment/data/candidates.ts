import type { ReferenceAnswer } from './reference-questions'

export const SOURCE_CHANNELS = [
  'LinkedIn',
  'Naukri',
  'Referral',
  'Career Site',
  'Mailbox Import',
  'Bulk Upload',
] as const
export type SourceChannel = (typeof SOURCE_CHANNELS)[number]

export const TALENT_FOLDERS = [
  'Backend Bench',
  'Design 2026',
  'Sales Campaign Q3',
  'Support Leads',
  'Campus Drive',
] as const

export const GENDERS = ['Male', 'Female', 'Other'] as const

/** Talent-pool candidate (TA-05, TA-39, TA-40) with the Kensium resume-bank profile fields. */
export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  currentRole: string
  skills: string[]
  source: SourceChannel
  folders: string[]
  reviewStatus: 'not-reviewed' | 'reviewed'
  resume: string
  linkedRequisitionId: string | null
  addedAt: string
  gender: 'Male' | 'Female' | 'Other' | ''
  referredBy: string
  address: string
  experienceYears: number
  /** Annual CTC in ₹ lakhs. */
  currentCtc: number
  expectedCtc: number
  qualification: string
  noticePeriodDays: number
  /** Fine-grained channel behind the source (e.g. "LinkedIn Jobs", "Employee Referral"). */
  channelSource: string
  /** Whether the profile was shortlisted against a live vacancy (vs. parked in the pool). */
  appliedForVacancy: boolean
  vacancyId: string | null
}

/** End-to-end hiring stages, in gate order (TA-13, TA-28). */
export const PIPELINE_STAGES = [
  'applied',
  'screening',
  'shortlisted',
  'interview',
  'reference-check',
  'offer',
  'hired',
] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export type ApplicationStatus = PipelineStage | 'on-hold' | 'rejected' | 'cancelled'

export interface ReferenceCheck {
  id: string
  referee: string
  relationship: string
  status: 'pending' | 'completed'
  outcome?: 'positive' | 'mixed' | 'negative'
  notes?: string
  contactEmail?: string
  contactPhone?: string
  /** Responses to the configured reference-check questionnaire. */
  answers?: ReferenceAnswer[]
  /** File name of the signed reference document, if uploaded. */
  uploadedDocument?: string
}

export interface ScorecardRating {
  criterionId: string
  criterion: string
  score: number
}

export interface Scorecard {
  id: string
  round: number
  interviewer: string
  ratings: ScorecardRating[]
  comments: string
  recommendation: 'advance' | 'hold' | 'reject'
  submittedAt: string
}

export interface Interview {
  id: string
  round: number
  roundName: string
  panel: string[]
  date: string
  time: string
  mode: 'Video' | 'In-person' | 'Phone'
  status: 'scheduled' | 'completed' | 'cancelled'
  conflict?: string
  /** Round explicitly skipped for this candidate — cannot be scheduled again. */
  skipped?: boolean
  /** Whether the candidate was emailed the invite, with the template used. */
  emailCandidate?: boolean
  emailSubject?: string
  emailBody?: string
  comments?: string
}

export interface StageEvent {
  at: string
  actor: string
  from: string
  to: string
  note?: string
}

/** A candidate's application against one requisition (TA-06, TA-13, TA-45). */
export interface Application {
  id: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  requisitionId: string
  requisitionTitle: string
  status: ApplicationStatus
  /** Stage the application was in before being placed on hold (TA-45). */
  heldFromStage?: PipelineStage
  resume: string
  appliedAt: string
  rejectionReason?: string
  preScreenScore: number | null
  interviews: Interview[]
  scorecards: Scorecard[]
  referenceChecks: ReferenceCheck[]
  stageHistory: StageEvent[]
  /** Pre-onboarding checklist responses keyed by checklist item id (TA-51). */
  checklist: Record<string, string>
}

export const seedCandidates: Candidate[] = [
  {
    id: 'c-01',
    name: 'Kiran Rao',
    email: 'kiran.rao@gmail.com',
    phone: '+91 98450 11223',
    currentRole: 'Backend Engineer @ Finstack',
    skills: ['Java', 'PostgreSQL', 'Kafka'],
    source: 'LinkedIn',
    folders: ['Backend Bench'],
    reviewStatus: 'reviewed',
    resume: 'kiran-rao-resume.pdf',
    linkedRequisitionId: 'RRF-1001',
    addedAt: '2026-05-20',
    gender: 'Male',
    referredBy: '',
    address: 'HSR Layout, Bengaluru',
    experienceYears: 7,
    currentCtc: 24,
    expectedCtc: 32,
    qualification: 'B.Tech, Computer Science',
    noticePeriodDays: 60,
    channelSource: 'LinkedIn Jobs',
    appliedForVacancy: true,
    vacancyId: 'v-01',
  },
  {
    id: 'c-02',
    name: 'Neha Kulkarni',
    email: 'neha.kulkarni@outlook.com',
    phone: '+91 99870 44556',
    currentRole: 'Senior Software Engineer @ Cartwheel',
    skills: ['Go', 'Kubernetes', 'gRPC'],
    source: 'Referral',
    folders: ['Backend Bench'],
    reviewStatus: 'reviewed',
    resume: 'neha-kulkarni-resume.pdf',
    linkedRequisitionId: 'RRF-1001',
    addedAt: '2026-05-22',
    gender: 'Female',
    referredBy: 'Dev Patel',
    address: 'Baner, Pune',
    experienceYears: 8,
    currentCtc: 30,
    expectedCtc: 40,
    qualification: 'M.Tech, Distributed Systems',
    noticePeriodDays: 90,
    channelSource: 'Employee Referral',
    appliedForVacancy: true,
    vacancyId: 'v-01',
  },
  {
    id: 'c-03',
    name: 'Arjun Nambiar',
    email: 'arjun.nambiar@yahoo.com',
    phone: '+91 90080 77441',
    currentRole: 'Product Designer @ Loomly',
    skills: ['Figma', 'Design Systems', 'Prototyping'],
    source: 'Career Site',
    folders: ['Design 2026'],
    reviewStatus: 'not-reviewed',
    resume: 'arjun-nambiar-portfolio.pdf',
    linkedRequisitionId: null,
    addedAt: '2026-06-12',
    gender: 'Male',
    referredBy: '',
    address: 'Panampilly Nagar, Kochi',
    experienceYears: 5,
    currentCtc: 16,
    expectedCtc: 22,
    qualification: 'B.Des, Communication Design',
    noticePeriodDays: 30,
    channelSource: 'Career Site',
    appliedForVacancy: false,
    vacancyId: null,
  },
  {
    id: 'c-04',
    name: 'Pooja Hegde',
    email: 'pooja.hegde@gmail.com',
    phone: '+91 91234 55678',
    currentRole: 'SDR @ CloudSprint',
    skills: ['Outbound', 'HubSpot', 'Cold-calling'],
    source: 'Naukri',
    folders: ['Sales Campaign Q3'],
    reviewStatus: 'reviewed',
    resume: 'pooja-hegde-resume.pdf',
    linkedRequisitionId: 'RRF-1005',
    addedAt: '2026-06-01',
    gender: 'Female',
    referredBy: '',
    address: 'Indiranagar, Bengaluru',
    experienceYears: 3,
    currentCtc: 8,
    expectedCtc: 11,
    qualification: 'BBA, Marketing',
    noticePeriodDays: 30,
    channelSource: 'Naukri Premium',
    appliedForVacancy: true,
    vacancyId: 'v-02',
  },
  {
    id: 'c-05',
    name: 'Sameer Shaikh',
    email: 'sameer.shaikh@gmail.com',
    phone: '+91 98220 33445',
    currentRole: 'Support Team Lead @ HelpDeskly',
    skills: ['Zendesk', 'Team Leadership', 'CSAT'],
    source: 'Mailbox Import',
    folders: ['Support Leads'],
    reviewStatus: 'not-reviewed',
    resume: 'sameer-shaikh-resume.pdf',
    linkedRequisitionId: 'RRF-1004',
    addedAt: '2026-06-15',
    gender: 'Male',
    referredBy: '',
    address: 'Andheri West, Mumbai',
    experienceYears: 6,
    currentCtc: 12,
    expectedCtc: 16,
    qualification: 'B.Com',
    noticePeriodDays: 45,
    channelSource: 'applications@ mailbox',
    appliedForVacancy: true,
    vacancyId: 'v-03',
  },
  {
    id: 'c-06',
    name: 'Lakshmi Venkatesh',
    email: 'lakshmi.venkatesh@gmail.com',
    phone: '+91 95550 22110',
    currentRole: 'Payroll Specialist @ PeoplePro',
    skills: ['Payroll', 'Compliance', 'Excel'],
    source: 'LinkedIn',
    folders: [],
    reviewStatus: 'not-reviewed',
    resume: 'lakshmi-venkatesh-resume.pdf',
    linkedRequisitionId: null,
    addedAt: '2026-06-18',
    gender: 'Female',
    referredBy: '',
    address: 'T. Nagar, Chennai',
    experienceYears: 4,
    currentCtc: 9,
    expectedCtc: 12,
    qualification: 'M.Com',
    noticePeriodDays: 30,
    channelSource: 'LinkedIn Jobs',
    appliedForVacancy: false,
    vacancyId: null,
  },
  {
    id: 'c-07',
    name: 'Rohan Dutta',
    email: 'rohan.dutta@gmail.com',
    phone: '+91 90909 18273',
    currentRole: 'Backend Developer @ ShopLane',
    skills: ['Node.js', 'MongoDB', 'AWS'],
    source: 'Bulk Upload',
    folders: ['Backend Bench'],
    reviewStatus: 'not-reviewed',
    resume: 'rohan-dutta-resume.pdf',
    linkedRequisitionId: 'RRF-1001',
    addedAt: '2026-06-20',
    gender: 'Male',
    referredBy: '',
    address: 'Salt Lake, Kolkata',
    experienceYears: 4,
    currentCtc: 14,
    expectedCtc: 19,
    qualification: 'B.Tech, Information Technology',
    noticePeriodDays: 60,
    channelSource: 'Bulk Upload',
    appliedForVacancy: true,
    vacancyId: 'v-01',
  },
  {
    id: 'c-08',
    name: 'Ishita Malhotra',
    email: 'ishita.malhotra@gmail.com',
    phone: '+91 98111 66778',
    currentRole: 'QA Engineer @ Testify',
    skills: ['Playwright', 'CI/CD', 'API Testing'],
    source: 'Career Site',
    folders: ['Campus Drive'],
    reviewStatus: 'reviewed',
    resume: 'ishita-malhotra-resume.pdf',
    linkedRequisitionId: 'RRF-1008',
    addedAt: '2026-04-02',
    gender: 'Female',
    referredBy: '',
    address: 'Sector 45, Gurugram',
    experienceYears: 5,
    currentCtc: 18,
    expectedCtc: 24,
    qualification: 'B.Tech, Electronics',
    noticePeriodDays: 0,
    channelSource: 'Career Site',
    appliedForVacancy: true,
    vacancyId: 'v-04',
  },
  {
    id: 'c-09',
    name: 'Manav Kapoor',
    email: 'manav.kapoor@gmail.com',
    phone: '+91 93400 55667',
    currentRole: 'SDR @ LeadLoop',
    skills: ['Outbound', 'Salesforce'],
    source: 'Referral',
    folders: ['Sales Campaign Q3'],
    reviewStatus: 'reviewed',
    resume: 'manav-kapoor-resume.pdf',
    linkedRequisitionId: 'RRF-1005',
    addedAt: '2026-06-05',
    gender: 'Male',
    referredBy: 'Karthik Rao',
    address: 'Sector 62, Noida',
    experienceYears: 2,
    currentCtc: 6,
    expectedCtc: 9,
    qualification: 'BBA',
    noticePeriodDays: 15,
    channelSource: 'Employee Referral',
    appliedForVacancy: true,
    vacancyId: 'v-02',
  },
  {
    id: 'c-10',
    name: 'Anita George',
    email: 'anita.george@gmail.com',
    phone: '+91 96000 11224',
    currentRole: 'Data Engineer @ Metricly',
    skills: ['Spark', 'dbt', 'Airflow'],
    source: 'LinkedIn',
    folders: [],
    reviewStatus: 'not-reviewed',
    resume: 'anita-george-resume.pdf',
    linkedRequisitionId: 'RRF-1007',
    addedAt: '2026-05-10',
    gender: 'Female',
    referredBy: '',
    address: 'Whitefield, Bengaluru',
    experienceYears: 6,
    currentCtc: 22,
    expectedCtc: 30,
    qualification: 'M.Sc, Data Science',
    noticePeriodDays: 90,
    channelSource: 'LinkedIn Jobs',
    appliedForVacancy: true,
    vacancyId: 'v-06',
  },
]

export const seedApplications: Application[] = [
  {
    id: 'app-01',
    candidateId: 'c-01',
    candidateName: 'Kiran Rao',
    candidateEmail: 'kiran.rao@gmail.com',
    requisitionId: 'RRF-1001',
    requisitionTitle: 'Senior Backend Engineer',
    status: 'offer',
    resume: 'kiran-rao-resume.pdf',
    appliedAt: '2026-05-21',
    preScreenScore: 86,
    interviews: [
      {
        id: 'iv-01',
        round: 1,
        roundName: 'Technical Screen',
        panel: ['Ananya Sharma', 'Dev Patel'],
        date: '2026-06-02',
        time: '10:00',
        mode: 'Video',
        status: 'completed',
      },
      {
        id: 'iv-02',
        round: 2,
        roundName: 'System Design',
        panel: ['Ananya Sharma', 'Ritu Saxena'],
        date: '2026-06-09',
        time: '14:00',
        mode: 'Video',
        status: 'completed',
      },
    ],
    scorecards: [
      {
        id: 'sc-01',
        round: 1,
        interviewer: 'Dev Patel',
        ratings: [
          { criterionId: 'cr-1', criterion: 'Technical depth', score: 4 },
          { criterionId: 'cr-2', criterion: 'Problem solving', score: 5 },
          { criterionId: 'cr-3', criterion: 'Communication', score: 4 },
          { criterionId: 'cr-4', criterion: 'Culture add', score: 4 },
        ],
        comments: 'Strong on distributed systems fundamentals.',
        recommendation: 'advance',
        submittedAt: '2026-06-02T12:00:00Z',
      },
      {
        id: 'sc-02',
        round: 2,
        interviewer: 'Ritu Saxena',
        ratings: [
          { criterionId: 'cr-1', criterion: 'Technical depth', score: 5 },
          { criterionId: 'cr-2', criterion: 'Problem solving', score: 4 },
          { criterionId: 'cr-3', criterion: 'Communication', score: 4 },
          { criterionId: 'cr-4', criterion: 'Culture add', score: 5 },
        ],
        comments: 'Excellent design trade-off discussion.',
        recommendation: 'advance',
        submittedAt: '2026-06-09T16:30:00Z',
      },
    ],
    referenceChecks: [
      {
        id: 'rf-01',
        referee: 'Vivek Anand (Manager, Finstack)',
        relationship: 'Direct manager',
        status: 'completed',
        outcome: 'positive',
        notes: 'Would rehire without hesitation.',
      },
      {
        id: 'rf-02',
        referee: 'Shreya Iyengar (Peer, Finstack)',
        relationship: 'Peer',
        status: 'completed',
        outcome: 'positive',
        notes: 'Great collaborator.',
      },
    ],
    stageHistory: [
      { at: '2026-05-21', actor: 'Meera Iyer', from: '—', to: 'applied' },
      { at: '2026-05-24', actor: 'Meera Iyer', from: 'applied', to: 'screening' },
      { at: '2026-05-28', actor: 'Ananya Sharma', from: 'screening', to: 'shortlisted' },
      { at: '2026-06-01', actor: 'Meera Iyer', from: 'shortlisted', to: 'interview' },
      { at: '2026-06-11', actor: 'Meera Iyer', from: 'interview', to: 'reference-check' },
      { at: '2026-06-18', actor: 'Sunita Patil', from: 'reference-check', to: 'offer' },
    ],
    checklist: {},
  },
  {
    id: 'app-02',
    candidateId: 'c-02',
    candidateName: 'Neha Kulkarni',
    candidateEmail: 'neha.kulkarni@outlook.com',
    requisitionId: 'RRF-1001',
    requisitionTitle: 'Senior Backend Engineer',
    status: 'interview',
    resume: 'neha-kulkarni-resume.pdf',
    appliedAt: '2026-05-23',
    preScreenScore: 78,
    interviews: [
      {
        id: 'iv-03',
        round: 1,
        roundName: 'Technical Screen',
        panel: ['Ananya Sharma', 'Dev Patel'],
        date: '2026-07-06',
        time: '11:00',
        mode: 'Video',
        status: 'scheduled',
      },
    ],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-05-23', actor: 'Meera Iyer', from: '—', to: 'applied' },
      { at: '2026-05-30', actor: 'Ananya Sharma', from: 'applied', to: 'screening' },
      { at: '2026-06-08', actor: 'Ananya Sharma', from: 'screening', to: 'shortlisted' },
      { at: '2026-06-25', actor: 'Meera Iyer', from: 'shortlisted', to: 'interview' },
    ],
    checklist: {},
  },
  {
    id: 'app-03',
    candidateId: 'c-04',
    candidateName: 'Pooja Hegde',
    candidateEmail: 'pooja.hegde@gmail.com',
    requisitionId: 'RRF-1005',
    requisitionTitle: 'Sales Development Rep',
    status: 'shortlisted',
    resume: 'pooja-hegde-resume.pdf',
    appliedAt: '2026-06-02',
    preScreenScore: 71,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-02', actor: 'Sana Qureshi', from: '—', to: 'applied' },
      { at: '2026-06-06', actor: 'Karthik Rao', from: 'applied', to: 'screening' },
      { at: '2026-06-12', actor: 'Karthik Rao', from: 'screening', to: 'shortlisted' },
    ],
    checklist: {},
  },
  {
    id: 'app-04',
    candidateId: 'c-09',
    candidateName: 'Manav Kapoor',
    candidateEmail: 'manav.kapoor@gmail.com',
    requisitionId: 'RRF-1005',
    requisitionTitle: 'Sales Development Rep',
    status: 'shortlisted',
    resume: 'manav-kapoor-resume.pdf',
    appliedAt: '2026-06-06',
    preScreenScore: 64,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-06', actor: 'Sana Qureshi', from: '—', to: 'applied' },
      { at: '2026-06-15', actor: 'Karthik Rao', from: 'applied', to: 'screening' },
      { at: '2026-06-20', actor: 'Karthik Rao', from: 'screening', to: 'shortlisted' },
    ],
    checklist: {},
  },
  {
    id: 'app-05',
    candidateId: 'c-05',
    candidateName: 'Sameer Shaikh',
    candidateEmail: 'sameer.shaikh@gmail.com',
    requisitionId: 'RRF-1004',
    requisitionTitle: 'Customer Support Lead',
    status: 'screening',
    resume: 'sameer-shaikh-resume.pdf',
    appliedAt: '2026-06-16',
    preScreenScore: null,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-16', actor: 'Sunita Patil', from: '—', to: 'applied' },
      { at: '2026-06-21', actor: 'Karthik Rao', from: 'applied', to: 'screening' },
    ],
    checklist: {},
  },
  {
    id: 'app-06',
    candidateId: 'c-10',
    candidateName: 'Anita George',
    candidateEmail: 'anita.george@gmail.com',
    requisitionId: 'RRF-1007',
    requisitionTitle: 'Data Engineer',
    status: 'on-hold',
    heldFromStage: 'interview',
    resume: 'anita-george-resume.pdf',
    appliedAt: '2026-05-12',
    preScreenScore: 82,
    interviews: [
      {
        id: 'iv-04',
        round: 1,
        roundName: 'Technical Screen',
        panel: ['Ananya Sharma', 'Dev Patel'],
        date: '2026-05-26',
        time: '15:00',
        mode: 'Video',
        status: 'completed',
      },
    ],
    scorecards: [
      {
        id: 'sc-03',
        round: 1,
        interviewer: 'Dev Patel',
        ratings: [
          { criterionId: 'cr-1', criterion: 'Technical depth', score: 4 },
          { criterionId: 'cr-2', criterion: 'Problem solving', score: 4 },
          { criterionId: 'cr-3', criterion: 'Communication', score: 3 },
          { criterionId: 'cr-4', criterion: 'Culture add', score: 4 },
        ],
        comments: 'Solid pipeline experience; requisition on hold.',
        recommendation: 'hold',
        submittedAt: '2026-05-26T17:00:00Z',
      },
    ],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-05-12', actor: 'Vikram Joshi', from: '—', to: 'applied' },
      { at: '2026-05-18', actor: 'Vikram Joshi', from: 'applied', to: 'screening' },
      { at: '2026-05-22', actor: 'Ananya Sharma', from: 'screening', to: 'shortlisted' },
      { at: '2026-05-25', actor: 'Vikram Joshi', from: 'shortlisted', to: 'interview' },
      {
        at: '2026-06-01',
        actor: 'Sunita Patil',
        from: 'interview',
        to: 'on-hold',
        note: 'Requisition paused pending budget review',
      },
    ],
    checklist: {},
  },
  {
    id: 'app-07',
    candidateId: 'c-08',
    candidateName: 'Ishita Malhotra',
    candidateEmail: 'ishita.malhotra@gmail.com',
    requisitionId: 'RRF-1008',
    requisitionTitle: 'QA Automation Engineer',
    status: 'hired',
    resume: 'ishita-malhotra-resume.pdf',
    appliedAt: '2026-04-03',
    preScreenScore: 90,
    interviews: [
      {
        id: 'iv-05',
        round: 1,
        roundName: 'Technical Screen',
        panel: ['Ananya Sharma', 'Dev Patel'],
        date: '2026-04-15',
        time: '10:00',
        mode: 'Video',
        status: 'completed',
      },
    ],
    scorecards: [
      {
        id: 'sc-04',
        round: 1,
        interviewer: 'Dev Patel',
        ratings: [
          { criterionId: 'cr-1', criterion: 'Technical depth', score: 5 },
          { criterionId: 'cr-2', criterion: 'Problem solving', score: 4 },
          { criterionId: 'cr-3', criterion: 'Communication', score: 5 },
          { criterionId: 'cr-4', criterion: 'Culture add', score: 5 },
        ],
        comments: 'Best automation candidate this cycle.',
        recommendation: 'advance',
        submittedAt: '2026-04-15T12:00:00Z',
      },
    ],
    referenceChecks: [
      {
        id: 'rf-03',
        referee: 'Nikhil Bhatia (Manager, Testify)',
        relationship: 'Direct manager',
        status: 'completed',
        outcome: 'positive',
      },
    ],
    stageHistory: [
      { at: '2026-04-03', actor: 'Meera Iyer', from: '—', to: 'applied' },
      { at: '2026-05-20', actor: 'Sunita Patil', from: 'offer', to: 'hired' },
    ],
    checklist: { 'cq-1': 'Yes', 'cq-2': 'PAN, Aadhaar submitted' },
  },
  {
    id: 'app-08',
    candidateId: 'c-07',
    candidateName: 'Rohan Dutta',
    candidateEmail: 'rohan.dutta@gmail.com',
    requisitionId: 'RRF-1001',
    requisitionTitle: 'Senior Backend Engineer',
    status: 'applied',
    resume: 'rohan-dutta-resume.pdf',
    appliedAt: '2026-06-20',
    preScreenScore: null,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-20', actor: 'Meera Iyer', from: '—', to: 'applied' },
    ],
    checklist: {},
  },
  {
    id: 'app-09',
    candidateId: 'c-03',
    candidateName: 'Arjun Nambiar',
    candidateEmail: 'arjun.nambiar@yahoo.com',
    requisitionId: 'RRF-1002',
    requisitionTitle: 'Product Designer',
    status: 'rejected',
    resume: 'arjun-nambiar-portfolio.pdf',
    appliedAt: '2026-06-13',
    rejectionReason: 'Requisition still pending approval; profile parked in pool',
    preScreenScore: 55,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-13', actor: 'Divya Menon', from: '—', to: 'applied' },
      {
        at: '2026-06-19',
        actor: 'Divya Menon',
        from: 'applied',
        to: 'rejected',
        note: 'Requisition not yet approved',
      },
    ],
    checklist: {},
  },
  {
    id: 'app-10',
    candidateId: 'c-06',
    candidateName: 'Lakshmi Venkatesh',
    candidateEmail: 'lakshmi.venkatesh@gmail.com',
    requisitionId: 'RRF-1003',
    requisitionTitle: 'Payroll Analyst',
    status: 'cancelled',
    resume: 'lakshmi-venkatesh-resume.pdf',
    appliedAt: '2026-06-19',
    rejectionReason: 'Candidature dropped by candidate',
    preScreenScore: null,
    interviews: [],
    scorecards: [],
    referenceChecks: [],
    stageHistory: [
      { at: '2026-06-19', actor: 'Sunita Patil', from: '—', to: 'applied' },
      {
        at: '2026-06-24',
        actor: 'Sunita Patil',
        from: 'applied',
        to: 'cancelled',
        note: 'Candidate withdrew',
      },
    ],
    checklist: {},
  },
]

/** Candidate persona used by the self-service portal tab (TA-31). */
export const PORTAL_CANDIDATE_ID = 'c-01'
