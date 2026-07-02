export const REQUISITION_STATUSES = [
  'Pending Approval',
  'Pending for Issuance',
  'Issued/Acknowledged',
  'Rejected',
  'Withdrawn',
  'Returned',
] as const
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

export const ASSET_CATALOG = [
  'MacBook Pro 14"',
  'Dell UltraSharp 27" monitor',
  'Logitech MX keyboard + mouse',
  'iPhone 15 (test device)',
  'Jabra headset',
  'Portable 4G hotspot',
] as const

/** Asset requisitions raised by the employee (ESS-31). */
export interface AssetRequisition {
  id: string
  number: string
  date: string
  asset: string
  quantity: number
  returnBefore: string | null
  status: RequisitionStatus
  /** Pending step surfaced in the task column (ESS-39). */
  task: string | null
}

export const seedAssetRequisitions: AssetRequisition[] = [
  { id: 'rq-01', number: 'REQ-2026-118', date: '2026-06-24', asset: 'iPhone 15 (test device)', quantity: 1, returnBefore: '2026-08-24', status: 'Pending Approval', task: null },
  { id: 'rq-02', number: 'REQ-2026-104', date: '2026-06-10', asset: 'Dell UltraSharp 27" monitor', quantity: 1, returnBefore: null, status: 'Pending for Issuance', task: null },
  { id: 'rq-03', number: 'REQ-2026-091', date: '2026-05-20', asset: 'Jabra headset', quantity: 1, returnBefore: null, status: 'Issued/Acknowledged', task: null },
  { id: 'rq-04', number: 'REQ-2026-076', date: '2026-04-28', asset: 'Portable 4G hotspot', quantity: 1, returnBefore: '2026-06-30', status: 'Issued/Acknowledged', task: 'Return before 30 Jun' },
  { id: 'rq-05', number: 'REQ-2026-063', date: '2026-04-02', asset: 'Logitech MX keyboard + mouse', quantity: 1, returnBefore: null, status: 'Rejected', task: null },
  { id: 'rq-06', number: 'REQ-2026-044', date: '2026-03-05', asset: 'iPhone 15 (test device)', quantity: 1, returnBefore: '2026-04-05', status: 'Returned', task: null },
  { id: 'rq-07', number: 'REQ-2026-039', date: '2026-02-20', asset: 'Dell UltraSharp 27" monitor', quantity: 2, returnBefore: null, status: 'Withdrawn', task: null },
]

export const ASSIGNED_ASSET_STATUSES = [
  'Pending for Receipt Acknowledgement',
  'Acknowledged/Issued',
  'Pending Return Confirmation',
  'Returned',
] as const
export type AssignedAssetStatus = (typeof ASSIGNED_ASSET_STATUSES)[number]

/** Assets currently in my custody (ESS-32). */
export interface AssignedAsset {
  id: string
  requisitionNumber: string
  assetName: string
  serialNumber: string
  assignedOn: string
  returnBy: string | null
  returnedOn: string | null
  status: AssignedAssetStatus
  /** Pending step surfaced in the task column (ESS-39). */
  task: string | null
}

export const seedAssignedAssets: AssignedAsset[] = [
  { id: 'aa-01', requisitionNumber: 'REQ-2022-011', assetName: 'MacBook Pro 14"', serialNumber: 'C02XK1PWJHD3', assignedOn: '2022-02-14', returnBy: null, returnedOn: null, status: 'Acknowledged/Issued', task: null },
  { id: 'aa-02', requisitionNumber: 'REQ-2026-091', assetName: 'Jabra headset', serialNumber: 'JB-88410-C', assignedOn: '2026-05-24', returnBy: null, returnedOn: null, status: 'Pending for Receipt Acknowledgement', task: 'Acknowledge receipt' },
  { id: 'aa-03', requisitionNumber: 'REQ-2026-076', assetName: 'Portable 4G hotspot', serialNumber: 'HT-20441', assignedOn: '2026-05-02', returnBy: '2026-06-30', returnedOn: null, status: 'Pending Return Confirmation', task: 'Confirm return' },
  { id: 'aa-04', requisitionNumber: 'REQ-2026-044', assetName: 'iPhone 15 (test device)', serialNumber: 'FFMX2A0QPLJT', assignedOn: '2026-03-08', returnBy: '2026-04-05', returnedOn: '2026-04-03', status: 'Returned', task: null },
]
