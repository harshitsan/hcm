import {
  computeBreakup,
  findSlab,
  seedCompensationSlabs,
  type ComponentMode,
  type ComponentType,
} from './compensation'

export const OFFER_STATUSES = [
  'draft',
  'pending-approval',
  'needs-clarification',
  'approved',
  'released',
  'accepted',
  'refused',
  'cancelled',
  'expired',
  'rejected',
] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export interface OfferApproval {
  level: number
  approver: string
  approverRole: string
  decision: 'pending' | 'approved' | 'rejected'
  comment?: string
  decidedAt?: string
}

/** One salary-component line on the offer (derived from the matched slab). */
export interface OfferComponent {
  name: string
  type: ComponentType
  mode: ComponentMode
  /** Percent (0–100) when mode = percent-of-gross, annual ₹ when fixed. */
  value: number
  /** Annualised ₹ amount as offered (may be manually adjusted). */
  amount: number
}

/** Audit entry for a manual salary-component amount edit. */
export interface ComponentChange {
  component: string
  from: number
  to: number
  by: string
  at: string
}

/** Approver clarification request raised during offer approval. */
export interface OfferClarification {
  question: string
  askedBy: string
  askedAt: string
  answer?: string
  answeredAt?: string
}

/** Handoff summary recorded when the candidate converts to an employee. */
export interface OfferConversion {
  employeeCode: string
  onboardingCaseId: string
  /** Whether a sign-in user account was created alongside the employee record. */
  userAccount: boolean
  at: string
}

/** Offer lifecycle record (TA-11, TA-12, TA-46, TA-47, TA-49, TA-50). */
export interface Offer {
  id: string
  applicationId: string
  candidateName: string
  requisitionId: string
  requisitionTitle: string
  location: string
  templateId: string
  templateVersion: number
  annualCtc: number
  /** Top of the approved salary band for the role (TA-46). */
  bandMax: number
  outOfBand: boolean
  status: OfferStatus
  responseDeadline: string
  /** Candidate compensation context captured at generation time. */
  expectedDoj: string
  currentCtc: number
  expectedCtc: number
  /** Recommended CTC from the matched compensation slab. */
  recommendedCtc: number
  /** Salary-component breakup derived from the matched slab. */
  breakup: OfferComponent[]
  /** Manual component-amount edits (generation + approver-side). */
  componentChanges: ComponentChange[]
  /** Approver clarification threads (needs-clarification loop). */
  clarifications: OfferClarification[]
  /** Offer letter generated after required documents are complete. */
  offerLetterGenerated: boolean
  /** Candidate-uploaded signed acknowledgment file name (on accept). */
  acknowledgmentFile?: string
  /** Candidate's reason for refusing the offer. */
  refuseComments?: string
  /** Company-side cancellation details (Cancel Offer view). */
  cancelReason?: string
  cancelLetterGenerated?: boolean
  cancelEmailSent?: boolean
  approvals: OfferApproval[]
  releasedAt?: string
  respondedAt?: string
  joiningLetterIssued: boolean
  appointmentLetterIssued: boolean
  joined: boolean
  convertedTo?: 'employee-user' | 'employee-non-user'
  /** Onboarding handoff summary — set when the candidate is converted. */
  conversion?: OfferConversion
}

/** Slab-derived breakup for seed offers (mirrors the generate-offer flow). */
const seedBreakup = (
  ctc: number,
  location: string,
  department: string
): OfferComponent[] => {
  const slab = findSlab(seedCompensationSlabs, ctc, location, department)
  if (!slab) return []
  return computeBreakup(slab, ctc).map(({ name, type, mode, value, amount }) => ({
    name,
    type,
    mode,
    value,
    amount,
  }))
}

export const seedOffers: Offer[] = [
  {
    id: 'OFR-501',
    applicationId: 'app-01',
    candidateName: 'Kiran Rao',
    requisitionId: 'RRF-1001',
    requisitionTitle: 'Senior Backend Engineer',
    location: 'Bengaluru',
    templateId: 'tpl-offer-std',
    templateVersion: 3,
    annualCtc: 3800000,
    bandMax: 4000000,
    outOfBand: false,
    status: 'released',
    responseDeadline: '2026-07-15',
    expectedDoj: '2026-08-03',
    currentCtc: 3000000,
    expectedCtc: 4000000,
    recommendedCtc: 3400000,
    breakup: seedBreakup(3800000, 'Bengaluru', 'Engineering'),
    componentChanges: [],
    clarifications: [],
    offerLetterGenerated: true,
    approvals: [
      {
        level: 1,
        approver: 'Sunita Patil',
        approverRole: 'Offer Approver — Bengaluru',
        decision: 'approved',
        decidedAt: '2026-06-19T09:00:00Z',
      },
    ],
    releasedAt: '2026-06-20',
    joiningLetterIssued: false,
    appointmentLetterIssued: false,
    joined: false,
  },
  {
    id: 'OFR-502',
    applicationId: 'app-07',
    candidateName: 'Ishita Malhotra',
    requisitionId: 'RRF-1008',
    requisitionTitle: 'QA Automation Engineer',
    location: 'Pune',
    templateId: 'tpl-offer-std',
    templateVersion: 2,
    annualCtc: 2400000,
    bandMax: 2600000,
    outOfBand: false,
    status: 'accepted',
    responseDeadline: '2026-05-20',
    expectedDoj: '2026-06-15',
    currentCtc: 1900000,
    expectedCtc: 2500000,
    recommendedCtc: 3400000,
    breakup: seedBreakup(2400000, 'Pune', 'Engineering'),
    componentChanges: [],
    clarifications: [],
    offerLetterGenerated: true,
    acknowledgmentFile: 'ishita-offer-acknowledgment-signed.pdf',
    approvals: [
      {
        level: 1,
        approver: 'Divya Menon',
        approverRole: 'Offer Approver — Pune',
        decision: 'approved',
        decidedAt: '2026-05-10T11:00:00Z',
      },
    ],
    releasedAt: '2026-05-12',
    respondedAt: '2026-05-18',
    joiningLetterIssued: true,
    appointmentLetterIssued: false,
    joined: true,
  },
  {
    id: 'OFR-503',
    applicationId: 'app-06',
    candidateName: 'Anita George',
    requisitionId: 'RRF-1007',
    requisitionTitle: 'Data Engineer',
    location: 'Hyderabad',
    templateId: 'tpl-offer-std',
    templateVersion: 3,
    annualCtc: 4600000,
    bandMax: 4200000,
    outOfBand: true,
    status: 'pending-approval',
    responseDeadline: '2026-07-30',
    expectedDoj: '2026-08-17',
    currentCtc: 3800000,
    expectedCtc: 4800000,
    recommendedCtc: 3400000,
    // Conveyance bumped by the L1 approver — mirrored in componentChanges.
    breakup: seedBreakup(4600000, 'Hyderabad', 'Engineering').map((c) =>
      c.name === 'Conveyance Allowance' ? { ...c, amount: 36000 } : c
    ),
    componentChanges: [
      {
        component: 'Conveyance Allowance',
        from: 24000,
        to: 36000,
        by: 'Karthik Rao',
        at: '2026-06-24T10:05:00Z',
      },
    ],
    clarifications: [
      {
        question: 'Why is the offer above the approved band for this role?',
        askedBy: 'Karthik Rao',
        askedAt: '2026-06-23T14:00:00Z',
        answer: 'Niche data-platform skills; approved by TA head over email.',
        answeredAt: '2026-06-24T09:30:00Z',
      },
    ],
    offerLetterGenerated: false,
    approvals: [
      {
        level: 1,
        approver: 'Karthik Rao',
        approverRole: 'Offer Approver — Hyderabad',
        decision: 'approved',
        decidedAt: '2026-06-24T10:00:00Z',
      },
      {
        level: 2,
        approver: 'Rohit Bansal',
        approverRole: 'Out-of-Band Salary Approver',
        decision: 'pending',
      },
    ],
    joiningLetterIssued: false,
    appointmentLetterIssued: false,
    joined: false,
  },
  {
    id: 'OFR-504',
    applicationId: 'app-09',
    candidateName: 'Arjun Nambiar',
    requisitionId: 'RRF-1002',
    requisitionTitle: 'Product Designer',
    location: 'Pune',
    templateId: 'tpl-offer-std',
    templateVersion: 2,
    annualCtc: 2800000,
    bandMax: 3000000,
    outOfBand: false,
    status: 'refused',
    responseDeadline: '2026-06-10',
    expectedDoj: '2026-07-01',
    currentCtc: 2200000,
    expectedCtc: 3000000,
    recommendedCtc: 3400000,
    breakup: seedBreakup(2800000, 'Pune', 'Product'),
    componentChanges: [],
    clarifications: [],
    offerLetterGenerated: true,
    refuseComments: 'Accepted a counter-offer from current employer',
    approvals: [
      {
        level: 1,
        approver: 'Divya Menon',
        approverRole: 'Offer Approver — Pune',
        decision: 'approved',
        decidedAt: '2026-05-28T10:00:00Z',
      },
    ],
    releasedAt: '2026-05-30',
    respondedAt: '2026-06-08',
    joiningLetterIssued: false,
    appointmentLetterIssued: false,
    joined: false,
  },
  {
    id: 'OFR-505',
    applicationId: 'app-10',
    candidateName: 'Lakshmi Venkatesh',
    requisitionId: 'RRF-1003',
    requisitionTitle: 'Payroll Analyst',
    location: 'Mumbai',
    templateId: 'tpl-offer-std',
    templateVersion: 3,
    annualCtc: 1800000,
    bandMax: 2000000,
    outOfBand: false,
    status: 'expired',
    responseDeadline: '2026-06-20',
    expectedDoj: '2026-07-15',
    currentCtc: 1500000,
    expectedCtc: 2000000,
    recommendedCtc: 1800000,
    breakup: seedBreakup(1800000, 'Mumbai', 'Finance'),
    componentChanges: [],
    clarifications: [],
    offerLetterGenerated: true,
    approvals: [
      {
        level: 1,
        approver: 'Farhan Ali',
        approverRole: 'Offer Approver — Mumbai',
        decision: 'approved',
        decidedAt: '2026-06-05T10:00:00Z',
      },
    ],
    releasedAt: '2026-06-06',
    joiningLetterIssued: false,
    appointmentLetterIssued: false,
    joined: false,
  },
  {
    id: 'OFR-506',
    applicationId: 'app-11',
    candidateName: 'Priya Nair',
    requisitionId: 'RRF-1008',
    requisitionTitle: 'QA Automation Engineer',
    location: 'Pune',
    templateId: 'tpl-offer-std',
    templateVersion: 2,
    annualCtc: 2000000,
    bandMax: 2600000,
    outOfBand: false,
    status: 'accepted',
    responseDeadline: '2026-05-05',
    expectedDoj: '2026-06-01',
    currentCtc: 1400000,
    expectedCtc: 1900000,
    recommendedCtc: 2200000,
    breakup: seedBreakup(2000000, 'Pune', 'Engineering'),
    componentChanges: [],
    clarifications: [],
    offerLetterGenerated: true,
    acknowledgmentFile: 'priya-offer-acknowledgment-signed.pdf',
    approvals: [
      {
        level: 1,
        approver: 'Divya Menon',
        approverRole: 'Offer Approver — Pune',
        decision: 'approved',
        decidedAt: '2026-04-26T10:00:00Z',
      },
    ],
    releasedAt: '2026-04-28',
    respondedAt: '2026-05-02',
    joiningLetterIssued: true,
    appointmentLetterIssued: true,
    joined: true,
    convertedTo: 'employee-user',
    conversion: {
      employeeCode: 'AUR-0102',
      onboardingCaseId: 'onb-7',
      userAccount: true,
      at: '2026-06-01',
    },
  },
]

export const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
