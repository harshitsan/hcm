/**
 * Inbound (new asset arrival, ASM-32/33) and outbound (security gate pass,
 * ASM-34/35) movement records, mirroring the Kensium Team Functions screens.
 */
export const MOVEMENT_STATUSES = ['Pending Approval', 'Approved', 'Rejected'] as const

export type MovementStatus = (typeof MOVEMENT_STATUSES)[number]

export interface ArrivalRecord {
  id: string
  assetTagPrefix: string
  category: string
  name: string
  vendor: string
  procuredDate: string
  invoiceNumber: string
  approvedQuantity: number
  totalValue: number
  status: MovementStatus
  recordedBy: string
  recordedOn: string
  decidedBy: string | null
  decidedOn: string | null
}

export const seedArrivals: ArrivalRecord[] = [
  {
    id: 'ar-01', assetTagPrefix: 'AST', category: 'IT Equipment', name: 'MacBook Air 13"', vendor: 'Ingram Micro', procuredDate: '2026-05-02', invoiceNumber: 'INV-2044', approvedQuantity: 2, totalValue: 268000, status: 'Approved', recordedBy: 'Priya Sharma', recordedOn: '2026-05-08', decidedBy: 'Divya Menon', decidedOn: '2026-05-11',
  },
  {
    id: 'ar-02', assetTagPrefix: 'AST', category: 'Peripherals', name: 'Logitech MX Master 3S', vendor: 'Redington', procuredDate: '2026-06-18', invoiceNumber: 'INV-2101', approvedQuantity: 10, totalValue: 89000, status: 'Pending Approval', recordedBy: 'Priya Sharma', recordedOn: '2026-06-20', decidedBy: null, decidedOn: null,
  },
  {
    id: 'ar-03', assetTagPrefix: 'AST', category: 'Mobile Devices', name: 'iPad Pro 12.9"', vendor: 'Redington', procuredDate: '2026-06-10', invoiceNumber: 'INV-2093', approvedQuantity: 3, totalValue: 372000, status: 'Pending Approval', recordedBy: 'Priya Sharma', recordedOn: '2026-06-12', decidedBy: null, decidedOn: null,
  },
  {
    id: 'ar-04', assetTagPrefix: 'AST', category: 'Network Equipment', name: 'Ubiquiti Access Point', vendor: 'Cisco Partner Co', procuredDate: '2026-04-25', invoiceNumber: 'INV-2071', approvedQuantity: 6, totalValue: 126000, status: 'Rejected', recordedBy: 'Priya Sharma', recordedOn: '2026-04-28', decidedBy: 'Divya Menon', decidedOn: '2026-05-01',
  },
]

export interface OutboundRecord {
  id: string
  category: string
  name: string
  vendor: string
  passNumber: string
  passDate: string
  reason: string
  status: MovementStatus
  recordedBy: string
  recordedOn: string
  decidedBy: string | null
  decidedOn: string | null
}

export const seedOutbound: OutboundRecord[] = [
  {
    id: 'ob-01', category: 'Network Equipment', name: 'Cisco Catalyst Switch', vendor: 'Cisco Partner Co', passNumber: 'GP-2026-118', passDate: '2026-05-30', reason: 'Sent to vendor service centre for repair', status: 'Approved', recordedBy: 'Priya Sharma', recordedOn: '2026-05-29', decidedBy: 'Priya Sharma', decidedOn: '2026-05-30',
  },
  {
    id: 'ob-02', category: 'Other Equipment', name: 'LG 55" Conference Display', vendor: 'E-Waste Co', passNumber: 'GP-2026-131', passDate: '2026-06-26', reason: 'Disposal pickup — retired asset', status: 'Pending Approval', recordedBy: 'Priya Sharma', recordedOn: '2026-06-25', decidedBy: null, decidedOn: null,
  },
  {
    id: 'ob-03', category: 'Peripherals', name: 'Epson Projector EB-2250U', vendor: '—', passNumber: 'GP-2026-124', passDate: '2026-06-10', reason: 'Off-site client demo (loan to Josh Patel)', status: 'Approved', recordedBy: 'Priya Sharma', recordedOn: '2026-06-09', decidedBy: 'Priya Sharma', decidedOn: '2026-06-10',
  },
]
