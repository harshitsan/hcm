export const OFFER_STATUSES = [
  'draft',
  'pending-approval',
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
  approvals: OfferApproval[]
  releasedAt?: string
  respondedAt?: string
  joiningLetterIssued: boolean
  appointmentLetterIssued: boolean
  joined: boolean
  convertedTo?: 'employee-user' | 'employee-non-user'
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
]

export const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
