/**
 * Manager/asset-coordinator side of Asset Tracking (More → Asset Tracking →
 * Team Functions): employee asset list, employee requisition list and the
 * New Asset Arrival intake.
 */
import type { TeamDepartment, EmployeeState } from './travel-team'
import { REQUISITION_STATUSES, type RequisitionStatus } from './assets'

export { REQUISITION_STATUSES }

export const TEAM_ASSET_STATUSES = [
  'Acknowledged/Issued',
  'Pending for Receipt Acknowledgement',
  'Pending Return Confirmation',
  'Returned',
] as const
export type TeamAssetStatus = (typeof TEAM_ASSET_STATUSES)[number]

/** Asset in an employee's custody, as reviewed by the team function. */
export interface TeamEmployeeAsset {
  id: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  assetName: string
  serialNumber: string
  assignedOn: string
  returnBy: string | null
  status: TeamAssetStatus
}

export const seedTeamEmployeeAssets: TeamEmployeeAsset[] = [
  { id: 'tea-01', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', assetName: 'MacBook Pro 14"', serialNumber: 'C02ZR4KLMD6T', assignedOn: '2024-01-18', returnBy: null, status: 'Acknowledged/Issued' },
  { id: 'tea-02', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', assetName: 'Dell UltraSharp 27" monitor', serialNumber: 'CN-0F4XT2-74445', assignedOn: '2025-03-02', returnBy: null, status: 'Acknowledged/Issued' },
  { id: 'tea-03', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', assetName: 'iPhone 15 (test device)', serialNumber: 'FFNW3B1RQMKV', assignedOn: '2026-06-20', returnBy: '2026-08-20', status: 'Pending for Receipt Acknowledgement' },
  { id: 'tea-04', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', assetName: 'Portable 4G hotspot', serialNumber: 'HT-20518', assignedOn: '2026-05-11', returnBy: '2026-07-15', status: 'Pending Return Confirmation' },
  { id: 'tea-05', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', assetName: 'Logitech MX keyboard + mouse', serialNumber: 'LG-MX-99106', assignedOn: '2024-09-05', returnBy: '2026-04-10', status: 'Returned' },
]

/** Employee requisition as reviewed/processed by the team function. */
export interface TeamRequisition {
  id: string
  number: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  date: string
  asset: string
  quantity: number
  status: RequisitionStatus
}

export const seedTeamRequisitions: TeamRequisition[] = [
  { id: 'trq-01', number: 'REQ-2026-121', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', date: '2026-07-09', asset: 'Jabra headset', quantity: 1, status: 'Pending Approval' },
  { id: 'trq-02', number: 'REQ-2026-119', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', date: '2026-07-06', asset: 'Dell UltraSharp 27" monitor', quantity: 1, status: 'Pending Approval' },
  { id: 'trq-03', number: 'REQ-2026-115', employee: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', date: '2026-06-30', asset: 'MacBook Pro 14"', quantity: 1, status: 'Pending for Issuance' },
  { id: 'trq-04', number: 'REQ-2026-102', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', date: '2026-06-08', asset: 'Portable 4G hotspot', quantity: 1, status: 'Issued/Acknowledged' },
  { id: 'trq-05', number: 'REQ-2026-097', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', date: '2026-05-27', asset: 'Logitech MX keyboard + mouse', quantity: 1, status: 'Withdrawn' },
]

export const ARRIVAL_STATUSES = ['Awaiting inspection', 'Added to inventory'] as const
export type ArrivalStatus = (typeof ARRIVAL_STATUSES)[number]

/** Freshly delivered stock recorded through New Asset Arrival. */
export interface AssetArrival {
  id: string
  asset: string
  quantity: number
  vendor: string
  poNumber: string
  receivedOn: string
  status: ArrivalStatus
}

export const ASSET_VENDORS = [
  'Ingram Micro India',
  'Redington Ltd',
  'Amazon Business',
] as const

export const seedAssetArrivals: AssetArrival[] = [
  { id: 'arr-01', asset: 'MacBook Pro 14"', quantity: 5, vendor: 'Ingram Micro India', poNumber: 'PO-2026-0343', receivedOn: '2026-07-08', status: 'Awaiting inspection' },
  { id: 'arr-02', asset: 'Jabra headset', quantity: 12, vendor: 'Amazon Business', poNumber: 'PO-2026-0331', receivedOn: '2026-06-30', status: 'Added to inventory' },
  { id: 'arr-03', asset: 'Dell UltraSharp 27" monitor', quantity: 8, vendor: 'Redington Ltd', poNumber: 'PO-2026-0318', receivedOn: '2026-06-21', status: 'Added to inventory' },
]
