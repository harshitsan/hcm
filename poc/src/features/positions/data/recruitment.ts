/**
 * Recruitment & onboarding records that consume governed positions
 * (POS-04, 18, 37): requisitions carry a position (+ level), resolve the
 * mapped pay-grade band and, on onboarding completion, the hire becomes an
 * employee holding that position.
 */

export const REQUISITION_STATUSES = [
  'open',
  'offer-extended',
  'onboarding',
  'hired',
] as const

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

export interface Requisition {
  id: string
  companyId: string
  /** Governed position reference — never free text (POS-13/18). */
  positionId: string
  candidateName: string
  status: RequisitionStatus
  /** Offer salary; validated against the level's pay-grade band (POS-37). */
  offeredSalary: number | null
  /** Pay grade resolved from the position level at offer time (POS-37). */
  resolvedPayGradeId: string | null
  createdOn: string
}

export const seedRequisitions: Requisition[] = [
  {
    id: 'REQ-2026-014',
    companyId: 'co-meridian',
    positionId: 'POS-MER-0002',
    candidateName: 'Elena Petrova',
    status: 'offer-extended',
    offeredSalary: 78000,
    resolvedPayGradeId: 'pg-l2',
    createdOn: '2026-05-18',
  },
  {
    id: 'REQ-2026-015',
    companyId: 'co-meridian',
    positionId: 'POS-MER-0005',
    candidateName: 'Marcus Hill',
    status: 'open',
    offeredSalary: null,
    resolvedPayGradeId: null,
    createdOn: '2026-06-02',
  },
  {
    id: 'REQ-2026-016',
    companyId: 'co-meridian',
    positionId: 'POS-MER-0010',
    candidateName: 'Fatima Zahra',
    status: 'onboarding',
    offeredSalary: 82000,
    resolvedPayGradeId: 'pg-l2',
    createdOn: '2026-04-22',
  },
  {
    id: 'REQ-2026-011',
    companyId: 'co-meridian',
    positionId: 'POS-MER-0004',
    candidateName: 'Diego Fuentes',
    status: 'hired',
    offeredSalary: 112000,
    resolvedPayGradeId: 'pg-l3',
    createdOn: '2026-02-10',
  },
]
