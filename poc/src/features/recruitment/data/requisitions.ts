export const REQUISITION_STATUSES = [
  'draft',
  'pending-approval',
  'needs-clarification',
  'approved',
  'sourcing',
  'on-hold',
  'filled',
  'closed',
  'cancelled',
  'rejected',
  'withdrawn',
] as const
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Finance',
  'Human Resources',
  'Sales',
  'Customer Support',
] as const

export const LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Remote — India',
] as const

export const EMPLOYEE_CLASSES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
] as const

/** RL-04 — reason for the vacancy: fresh headcount vs backfill. */
export const HIRING_AS = ['New Join', 'Replacement'] as const
export type HiringAs = (typeof HIRING_AS)[number]

/** Hiring urgency captured on the RRF (Transactions → Resource Requisition). */
export const REQUISITION_PRIORITIES = ['High', 'Low'] as const
export type RequisitionPriority = (typeof REQUISITION_PRIORITIES)[number]

export const POSITION_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const
export type PositionLevel = (typeof POSITION_LEVELS)[number]

/** Read-only experience band derived from the selected position level. */
export const EXPERIENCE_BY_LEVEL: Record<PositionLevel, string> = {
  Junior: '0–2 years',
  Mid: '2–4 years',
  Senior: '4–8 years',
  Lead: '8+ years',
}

export const RECRUITERS = [
  'Meera Iyer',
  'Rahul Verma',
  'Sana Qureshi',
  'Vikram Joshi',
] as const

export const HIRING_MANAGERS = [
  'Ananya Sharma',
  'Karthik Rao',
  'Divya Menon',
  'Farhan Ali',
] as const

/** One level in a requisition's approval chain (TA-02, TA-25, TA-52). */
export interface ApprovalStep {
  level: number
  approver: string
  approverRole: string
  decision: 'pending' | 'approved' | 'rejected'
  comment?: string
  decidedAt?: string
}

/** Effective-dated change record (TA-22 — bitemporal history & audit). */
export interface HistoryEntry {
  id: string
  actor: string
  change: string
  validFrom: string
  validTo: string | null
}

/** One approver-question ↔ answer exchange on an in-flight RRF. */
export interface RequisitionClarification {
  question: string
  askedBy: string
  askedOf: string
  askedAt: string
  answer?: string
  answeredAt?: string
}

export interface Requisition {
  id: string
  title: string
  department: (typeof DEPARTMENTS)[number]
  /** Work location for the opening. */
  location: (typeof LOCATIONS)[number]
  employeeClass: (typeof EMPLOYEE_CLASSES)[number]
  /** RL-04: why the position is open — New Join (fresh) or Replacement. */
  hiringAs: HiringAs
  /** RL-04: employee being backfilled when hiringAs = 'Replacement'. */
  replacementFor: string | null
  headcount: number
  description: string
  requirements: string
  nonBudgeted: boolean
  /** Confidential hiring — title is masked outside the approval chain. */
  confidential: boolean
  priority: RequisitionPriority
  positionLevel: PositionLevel
  /** Read-only text derived from positionLevel, e.g. '4–8 years'. */
  experience: string
  personalTraits: string
  additionalSkills: string
  reasonForHiring: string
  /** Organisational/functional unit the position reports into. */
  functionalLocation: string
  comments: string
  status: RequisitionStatus
  recruiter: string | null
  hiringManager: string | null
  /** Tenant-defined UDF values keyed by custom-field id (TA-26, TA-30). */
  custom: Record<string, string>
  createdAt: string
  closingDate: string
  approvals: ApprovalStep[]
  history: HistoryEntry[]
  /** Approver ↔ requester question/answer thread. */
  clarifications: RequisitionClarification[]
  /** Set when the RRF is closed early before all positions were hired. */
  preClosure: {
    originalHeadcount: number
    closedEarlyAt: string
    note: string
  } | null
}

function chain(
  levels: Array<[string, string, 'pending' | 'approved' | 'rejected']>
): ApprovalStep[] {
  return levels.map(([approver, approverRole, decision], i) => ({
    level: i + 1,
    approver,
    approverRole,
    decision,
    decidedAt: decision === 'pending' ? undefined : '2026-06-20T10:00:00Z',
    comment: decision === 'rejected' ? 'Budget not confirmed for FY27' : undefined,
  }))
}

export const seedRequisitions: Requisition[] = [
  {
    id: 'RRF-1001',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Bengaluru',
    employeeClass: 'Full-time',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 2,
    description: 'Own core platform services and mentor mid-level engineers.',
    requirements: '6+ yrs Java/Go, distributed systems, PostgreSQL',
    nonBudgeted: false,
    confidential: false,
    priority: 'High',
    positionLevel: 'Senior',
    experience: EXPERIENCE_BY_LEVEL.Senior,
    personalTraits: 'Ownership mindset, mentors juniors, calm under incident load',
    additionalSkills: 'Kafka, gRPC, capacity planning',
    reasonForHiring: 'Platform pod scaling with the FY27 roadmap',
    functionalLocation: 'Platform Engineering — Tech Park Block B',
    comments: 'Prefer candidates able to join within 30 days.',
    status: 'sourcing',
    recruiter: 'Meera Iyer',
    hiringManager: 'Ananya Sharma',
    custom: { 'cf-band': 'B3' },
    createdAt: '2026-05-12',
    closingDate: '2026-07-31',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [
      {
        id: 'h-1',
        actor: 'Sunita Patil',
        change: 'Created as draft',
        validFrom: '2026-05-12',
        validTo: '2026-05-14',
      },
      {
        id: 'h-2',
        actor: 'Sunita Patil',
        change: 'Submitted for approval',
        validFrom: '2026-05-14',
        validTo: '2026-05-16',
      },
      {
        id: 'h-3',
        actor: 'Rohit Bansal',
        change: 'Fully approved → sourcing',
        validFrom: '2026-05-16',
        validTo: null,
      },
    ],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1002',
    title: 'Product Designer',
    department: 'Product',
    location: 'Pune',
    employeeClass: 'Full-time',
    hiringAs: 'Replacement',
    replacementFor: 'Nikhil Kulkarni (EMP-0231)',
    headcount: 1,
    description: 'Design end-to-end flows for the HR self-service portal.',
    requirements: '4+ yrs product design, Figma, design systems',
    nonBudgeted: false,
    confidential: false,
    priority: 'High',
    positionLevel: 'Mid',
    experience: EXPERIENCE_BY_LEVEL.Mid,
    personalTraits: 'User-obsessed, strong storytelling, works well with PMs',
    additionalSkills: 'Design tokens, usability testing',
    reasonForHiring: 'Backfill — incumbent resigned, notice ends July',
    functionalLocation: 'Product Design Studio — Pune Hub',
    comments: '',
    status: 'pending-approval',
    recruiter: null,
    hiringManager: 'Divya Menon',
    custom: {},
    createdAt: '2026-06-10',
    closingDate: '2026-08-15',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'pending'],
    ]),
    history: [
      {
        id: 'h-4',
        actor: 'Divya Menon',
        change: 'Created and submitted',
        validFrom: '2026-06-10',
        validTo: null,
      },
    ],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1003',
    title: 'Payroll Analyst',
    department: 'Finance',
    location: 'Mumbai',
    employeeClass: 'Full-time',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 1,
    description: 'Run monthly payroll and statutory filings.',
    requirements: '3+ yrs payroll, Indian statutory compliance',
    nonBudgeted: true,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Mid',
    experience: EXPERIENCE_BY_LEVEL.Mid,
    personalTraits: 'Detail-oriented, deadline-driven',
    additionalSkills: 'GreytHR, PF/ESI portals',
    reasonForHiring: 'Payroll volume outgrew the shared-services pod',
    functionalLocation: 'Finance Shared Services — Mumbai HQ',
    comments: 'Non-budgeted — needs cost-centre confirmation.',
    status: 'needs-clarification',
    recruiter: null,
    hiringManager: 'Farhan Ali',
    custom: {},
    createdAt: '2026-06-18',
    closingDate: '2026-08-01',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'pending'],
      ['Priya Deshmukh', 'Non-Budgeted Position Approver', 'pending'],
    ]),
    history: [
      {
        id: 'h-5',
        actor: 'Farhan Ali',
        change: 'Created (non-budgeted) and submitted',
        validFrom: '2026-06-18',
        validTo: '2026-06-24',
      },
      {
        id: 'h-5b',
        actor: 'Rohit Bansal',
        change: 'Clarification requested from requester',
        validFrom: '2026-06-24',
        validTo: null,
      },
    ],
    clarifications: [
      {
        question: 'Which cost centre funds this non-budgeted role for FY27?',
        askedBy: 'Rohit Bansal',
        askedOf: 'Farhan Ali',
        askedAt: '2026-06-24T09:30:00Z',
      },
    ],
    preClosure: null,
  },
  {
    id: 'RRF-1004',
    title: 'Customer Support Lead',
    department: 'Customer Support',
    location: 'Hyderabad',
    employeeClass: 'Full-time',
    hiringAs: 'Replacement',
    replacementFor: 'Shreya Kapoor (EMP-0187)',
    headcount: 1,
    description: 'Lead the L1 support pod and own CSAT.',
    requirements: '5+ yrs support ops, team leadership',
    nonBudgeted: false,
    confidential: true,
    priority: 'High',
    positionLevel: 'Lead',
    experience: EXPERIENCE_BY_LEVEL.Lead,
    personalTraits: 'Coaches the pod, escalation-calm, metric-driven',
    additionalSkills: 'Zendesk admin, QA scorecards',
    reasonForHiring: 'Confidential replacement of the current pod lead',
    functionalLocation: 'Support Operations — Hyderabad Campus',
    comments: 'Keep off the public careers page until offer stage.',
    status: 'approved',
    recruiter: null,
    hiringManager: 'Karthik Rao',
    custom: {},
    createdAt: '2026-06-01',
    closingDate: '2026-07-20',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [
      {
        id: 'h-6',
        actor: 'Karthik Rao',
        change: 'Approved — awaiting recruiter assignment',
        validFrom: '2026-06-05',
        validTo: null,
      },
    ],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1005',
    title: 'Sales Development Rep',
    department: 'Sales',
    location: 'Remote — India',
    employeeClass: 'Contract',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 4,
    description: 'Outbound prospecting for the mid-market segment.',
    requirements: '1+ yr SaaS outbound, CRM hygiene',
    nonBudgeted: false,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Junior',
    experience: EXPERIENCE_BY_LEVEL.Junior,
    personalTraits: 'Resilient, coachable, high call energy',
    additionalSkills: 'HubSpot sequences, LinkedIn Sales Navigator',
    reasonForHiring: 'Mid-market pipeline expansion for H2',
    functionalLocation: 'Sales — Mid-Market Pod (Remote)',
    comments: '',
    status: 'sourcing',
    recruiter: 'Sana Qureshi',
    hiringManager: 'Karthik Rao',
    custom: {},
    createdAt: '2026-05-25',
    closingDate: '2026-07-10',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1006',
    title: 'HR Generalist',
    department: 'Human Resources',
    location: 'Bengaluru',
    employeeClass: 'Full-time',
    hiringAs: 'Replacement',
    replacementFor: 'Amit Trivedi (EMP-0092)',
    headcount: 1,
    description: 'Generalist support across onboarding and engagement.',
    requirements: '2+ yrs HR operations',
    nonBudgeted: false,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Junior',
    experience: EXPERIENCE_BY_LEVEL.Junior,
    personalTraits: 'Empathetic, organised, discreet with employee data',
    additionalSkills: 'HRIS data entry, engagement surveys',
    reasonForHiring: 'Backfill for internal transfer to the L&D team',
    functionalLocation: 'People Operations — Bengaluru HQ',
    comments: '',
    status: 'draft',
    recruiter: null,
    hiringManager: null,
    custom: {},
    createdAt: '2026-06-22',
    closingDate: '2026-09-01',
    approvals: [],
    history: [],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1007',
    title: 'Data Engineer',
    department: 'Engineering',
    location: 'Hyderabad',
    employeeClass: 'Full-time',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 1,
    description: 'Build the analytics lakehouse and pipelines.',
    requirements: 'Spark, dbt, warehouse modelling',
    nonBudgeted: false,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Senior',
    experience: EXPERIENCE_BY_LEVEL.Senior,
    personalTraits: 'Pragmatic modeller, documents pipelines well',
    additionalSkills: 'Airflow, Iceberg, cost tuning',
    reasonForHiring: 'Analytics lakehouse build-out (paused pending budget)',
    functionalLocation: 'Data Platform — Hyderabad Campus',
    comments: 'On hold until Q3 budget review.',
    status: 'on-hold',
    recruiter: 'Vikram Joshi',
    hiringManager: 'Ananya Sharma',
    custom: {},
    createdAt: '2026-04-30',
    closingDate: '2026-08-30',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1008',
    title: 'QA Automation Engineer',
    department: 'Engineering',
    location: 'Pune',
    employeeClass: 'Full-time',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 2,
    description: 'Own the Playwright regression suite.',
    requirements: 'Playwright/Cypress, CI pipelines',
    nonBudgeted: false,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Mid',
    experience: EXPERIENCE_BY_LEVEL.Mid,
    personalTraits: 'Automation-first, breaks things constructively',
    additionalSkills: 'GitHub Actions, contract testing',
    reasonForHiring: 'Regression coverage for the new release cadence',
    functionalLocation: 'Quality Engineering — Pune Hub',
    comments: '',
    status: 'filled',
    recruiter: 'Meera Iyer',
    hiringManager: 'Ananya Sharma',
    custom: {},
    createdAt: '2026-03-15',
    closingDate: '2026-05-31',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1009',
    title: 'Finance Intern',
    department: 'Finance',
    location: 'Mumbai',
    employeeClass: 'Intern',
    hiringAs: 'New Join',
    replacementFor: null,
    headcount: 2,
    description: 'Support AP/AR reconciliation.',
    requirements: 'B.Com final year',
    nonBudgeted: true,
    confidential: false,
    priority: 'Low',
    positionLevel: 'Junior',
    experience: EXPERIENCE_BY_LEVEL.Junior,
    personalTraits: 'Eager to learn, careful with numbers',
    additionalSkills: 'Excel, Tally basics',
    reasonForHiring: 'Seasonal reconciliation workload',
    functionalLocation: 'Finance Shared Services — Mumbai HQ',
    comments: 'Rejected — to be resubmitted with cost-centre mapping.',
    status: 'rejected',
    recruiter: null,
    hiringManager: 'Farhan Ali',
    custom: {},
    createdAt: '2026-06-02',
    closingDate: '2026-07-01',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Priya Deshmukh', 'Non-Budgeted Position Approver', 'rejected'],
    ]),
    history: [],
    clarifications: [],
    preClosure: null,
  },
  {
    id: 'RRF-1010',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote — India',
    employeeClass: 'Full-time',
    hiringAs: 'Replacement',
    replacementFor: 'Kavya Nair (EMP-0310)',
    headcount: 1,
    description: 'Kubernetes platform and release tooling.',
    requirements: 'K8s, Terraform, observability stack',
    nonBudgeted: false,
    confidential: false,
    priority: 'High',
    positionLevel: 'Senior',
    experience: EXPERIENCE_BY_LEVEL.Senior,
    personalTraits: 'Automates toil, strong incident hygiene',
    additionalSkills: 'ArgoCD, Prometheus, FinOps basics',
    reasonForHiring: 'Backfill — withdrawn after the incumbent rescinded resignation',
    functionalLocation: 'Platform Engineering — Remote Pod',
    comments: '',
    status: 'withdrawn',
    recruiter: 'Rahul Verma',
    hiringManager: 'Ananya Sharma',
    custom: {},
    createdAt: '2026-05-05',
    closingDate: '2026-06-30',
    approvals: chain([
      ['Sunita Patil', 'HR Head', 'approved'],
      ['Rohit Bansal', 'Finance Controller', 'approved'],
    ]),
    history: [
      {
        id: 'h-7',
        actor: 'Ananya Sharma',
        change: 'Withdrawn by requester — incumbent stayed on',
        validFrom: '2026-06-12',
        validTo: null,
      },
    ],
    clarifications: [],
    preClosure: null,
  },
]
