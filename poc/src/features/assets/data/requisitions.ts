/**
 * Asset requisition flow (ASM-27..31, ASM-42) mirroring the Kensium
 * "My Asset Requisition List" / "Employee Asset Requisition List" screens.
 */
export const REQUISITION_STATUSES = [
  'Pending Approval',
  'Pending for Issuance',
  'Pending for Partial Issuance',
  'Issued/Acknowledged',
  'Rejected',
  'Withdrawn',
  'Returned',
] as const

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

/** Statuses in which the requester may still withdraw (ASM-28). */
export const WITHDRAWABLE_STATUSES: RequisitionStatus[] = [
  'Pending Approval',
  'Pending for Issuance',
  'Pending for Partial Issuance',
]

export interface RequisitionEvent {
  at: string
  event: string
}

export interface Requisition {
  id: string
  number: string
  requesterId: string
  requesterName: string
  /** Set when a Company Admin raised it for a non-user employee (ASM-42). */
  onBehalfBy: string | null
  department: string
  assetName: string
  category: string
  quantity: number
  issuedQuantity: number
  returnBefore: string
  requestedOn: string
  status: RequisitionStatus
  pendingWith: string | null
  rejectionReason: string | null
  assignedAssetIds: string[]
  history: RequisitionEvent[]
}

export const seedRequisitions: Requisition[] = [
  {
    id: 'rq-01', number: 'ARF-2026-014', requesterId: 'e-01', requesterName: 'Anita Rao', onBehalfBy: null, department: 'Engineering', assetName: 'Dell UltraSharp 27" Monitor', category: 'Peripherals', quantity: 1, issuedQuantity: 0, returnBefore: '2026-12-31', requestedOn: '2026-06-24', status: 'Pending Approval', pendingWith: 'Priya Sharma', rejectionReason: null, assignedAssetIds: [],
    history: [{ at: '2026-06-24', event: 'Raised by Anita Rao — routed to Priya Sharma' }],
  },
  {
    id: 'rq-02', number: 'ARF-2026-013', requesterId: 'e-06', requesterName: 'Nikhil Bose', onBehalfBy: null, department: 'Engineering', assetName: 'MacBook Air 13"', category: 'IT Equipment', quantity: 2, issuedQuantity: 0, returnBefore: '2027-06-30', requestedOn: '2026-06-21', status: 'Pending for Issuance', pendingWith: 'Priya Sharma', rejectionReason: null, assignedAssetIds: [],
    history: [
      { at: '2026-06-21', event: 'Raised by Nikhil Bose' },
      { at: '2026-06-22', event: 'Approved by Priya Sharma — moved to issuance queue' },
    ],
  },
  {
    id: 'rq-03', number: 'ARF-2026-011', requesterId: 'e-01', requesterName: 'Anita Rao', onBehalfBy: null, department: 'Engineering', assetName: 'iPhone 15', category: 'Mobile Devices', quantity: 1, issuedQuantity: 1, returnBefore: '2027-06-30', requestedOn: '2026-06-15', status: 'Issued/Acknowledged', pendingWith: null, rejectionReason: null, assignedAssetIds: ['a-02'],
    history: [
      { at: '2026-06-15', event: 'Raised by Anita Rao' },
      { at: '2026-06-17', event: 'Approved by Priya Sharma' },
      { at: '2026-06-20', event: 'Issued AST-0002 (1 of 1) by Priya Sharma' },
    ],
  },
  {
    id: 'rq-04', number: 'ARF-2026-010', requesterId: 'e-04', requesterName: 'Josh Patel', onBehalfBy: null, department: 'Sales', assetName: 'iPad Pro 12.9"', category: 'Mobile Devices', quantity: 3, issuedQuantity: 1, returnBefore: '2026-09-30', requestedOn: '2026-06-11', status: 'Pending for Partial Issuance', pendingWith: 'Priya Sharma', rejectionReason: null, assignedAssetIds: [],
    history: [
      { at: '2026-06-11', event: 'Raised by Josh Patel' },
      { at: '2026-06-12', event: 'Approved by Priya Sharma' },
      { at: '2026-06-14', event: 'Partially issued 1 of 3 — balance 2 open' },
    ],
  },
  {
    id: 'rq-05', number: 'ARF-2026-009', requesterId: 'e-01', requesterName: 'Anita Rao', onBehalfBy: null, department: 'Engineering', assetName: 'Mechanical Keyboard', category: 'Peripherals', quantity: 1, issuedQuantity: 0, returnBefore: '2026-08-31', requestedOn: '2026-06-02', status: 'Withdrawn', pendingWith: null, rejectionReason: null, assignedAssetIds: [],
    history: [
      { at: '2026-06-02', event: 'Raised by Anita Rao' },
      { at: '2026-06-04', event: 'Withdrawn by Anita Rao' },
    ],
  },
  {
    id: 'rq-06', number: 'ARF-2026-008', requesterId: 'e-08', requesterName: 'Divya Menon', onBehalfBy: null, department: 'Finance', assetName: 'Second Monitor', category: 'Peripherals', quantity: 1, issuedQuantity: 0, returnBefore: '2026-12-31', requestedOn: '2026-05-28', status: 'Rejected', pendingWith: null, rejectionReason: 'Existing monitor within refresh cycle', assignedAssetIds: [],
    history: [
      { at: '2026-05-28', event: 'Raised by Divya Menon' },
      { at: '2026-05-30', event: 'Rejected by Priya Sharma — existing monitor within refresh cycle' },
    ],
  },
  {
    id: 'rq-07', number: 'ARF-2026-007', requesterId: 'e-02', requesterName: 'Ravi Kumar', onBehalfBy: 'Priya Sharma', department: 'Operations', assetName: 'Samsung Galaxy S24', category: 'Mobile Devices', quantity: 1, issuedQuantity: 1, returnBefore: '2027-03-31', requestedOn: '2026-02-20', status: 'Issued/Acknowledged', pendingWith: null, rejectionReason: null, assignedAssetIds: ['a-14'],
    history: [
      { at: '2026-02-20', event: 'Raised by Priya Sharma on behalf of Ravi Kumar (non-user)' },
      { at: '2026-02-22', event: 'Approved by Priya Sharma' },
      { at: '2026-03-02', event: 'Issued AST-0014 — receipt acknowledged on behalf by Priya Sharma' },
    ],
  },
  {
    id: 'rq-08', number: 'ARF-2025-042', requesterId: 'e-03', requesterName: 'Meera Iyer', onBehalfBy: null, department: 'Human Resources', assetName: 'Conference Speakerphone', category: 'Peripherals', quantity: 1, issuedQuantity: 1, returnBefore: '2026-01-31', requestedOn: '2025-11-10', status: 'Returned', pendingWith: null, rejectionReason: null, assignedAssetIds: [],
    history: [
      { at: '2025-11-10', event: 'Raised by Meera Iyer' },
      { at: '2025-11-12', event: 'Approved and issued' },
      { at: '2026-01-28', event: 'Returned to stores — requisition closed' },
    ],
  },
]
