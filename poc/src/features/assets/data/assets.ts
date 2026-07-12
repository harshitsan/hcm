/**
 * Asset master + lifecycle domain (ASM-01, ASM-02, ASM-11, ASM-36).
 * Every state change is retained as an append-only, effective-dated history
 * entry (ASM-17) with the rules-engine decision that allowed it (ASM-23).
 */
export const ASSET_STATES = [
  'Available',
  'Allocated',
  'Issued',
  'Loan',
  'In Repair',
  'Returned',
  'Lost',
  'Retired',
  'Disposed',
] as const

export type AssetState = (typeof ASSET_STATES)[number]

export type AssetAction =
  | 'issue'
  | 'loan'
  | 'transfer'
  | 'return'
  | 'recover'
  | 'mark-available'
  | 'send-repair'
  | 'repair-complete'
  | 'mark-lost'
  | 'retire'
  | 'dispose'

export const ACTION_LABELS: Record<AssetAction, string> = {
  issue: 'Issue to employee',
  loan: 'Issue on loan',
  transfer: 'Transfer to employee',
  return: 'Record return',
  recover: 'Record recovery',
  'mark-available': 'Assess serviceable → Available',
  'send-repair': 'Send for repair',
  'repair-complete': 'Repair complete → Available',
  'mark-lost': 'Report lost',
  retire: 'Retire asset',
  dispose: 'Dispose asset',
}

/**
 * Workflow origin an assignment came from — shown as a distinct tag in the
 * movement history and on the asset record so cross-workflow moves (onboarding
 * issuance, internal transfer, exit recovery) stay traceable.
 */
export const ASSIGNMENT_ORIGINS = [
  'Onboarding (W2)',
  'Internal transfer (W5)',
  'Exit recovery (W8)',
] as const

export type AssignmentOrigin = (typeof ASSIGNMENT_ORIGINS)[number]

export interface AssetHistoryEntry {
  id: string
  event: string
  priorState: AssetState | null
  newState: AssetState
  actor: string
  /** Affected employee name, when the event involves a workforce member. */
  employee: string | null
  /** Business (effective) date of the event. */
  effectiveDate: string
  /** System-recorded transaction timestamp (bitemporal pair, ASM-17). */
  recordedAt: string
  /** Rules-engine decision-table rule that permitted the transition (ASM-23). */
  ruleId: string | null
  /** Workflow the movement originated from, when not an ad-hoc transaction. */
  origin?: AssignmentOrigin | null
  note: string
}

export interface Asset {
  id: string
  /** Tenant-unique tag (ASM-18) — duplicates within a company are rejected. */
  assetTag: string
  serial: string
  name: string
  category: string
  vendor: string
  poDate: string
  warrantyMonths: number
  /** Asset value in INR (ASM-39). */
  value: number
  company: string
  state: AssetState
  holderId: string | null
  issueDate: string | null
  expectedReturnDate: string | null
  /** Workflow the current assignment came from (e.g. onboarding issuance). */
  assignmentOrigin?: AssignmentOrigin | null
  history: AssetHistoryEntry[]
}

function h(
  id: string,
  event: string,
  priorState: AssetState | null,
  newState: AssetState,
  actor: string,
  employee: string | null,
  effectiveDate: string,
  ruleId: string | null,
  note = '',
  origin: AssignmentOrigin | null = null
): AssetHistoryEntry {
  return {
    id,
    event,
    priorState,
    newState,
    actor,
    employee,
    effectiveDate,
    recordedAt: `${effectiveDate}T10:00:00.000Z`,
    ruleId,
    origin,
    note,
  }
}

export const seedAssets: Asset[] = [
  {
    id: 'a-01', assetTag: 'AST-0001', serial: 'SN-MBP16-4471', name: 'MacBook Pro 16"', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2025-02-10', warrantyMonths: 36, value: 245000, company: 'Aster Digital', state: 'Issued', holderId: 'e-01', issueDate: '2025-03-01', expectedReturnDate: null, assignmentOrigin: 'Onboarding (W2)',
    history: [
      h('ah-01a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-02-18', null, 'New arrival admitted to inventory'),
      h('ah-01b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Anita Rao', '2025-03-01', 'R-ISSUE', 'Issued against onboarding workflow step "Issue laptop"', 'Onboarding (W2)'),
    ],
  },
  {
    id: 'a-02', assetTag: 'AST-0002', serial: 'SN-IP15-8812', name: 'iPhone 15', category: 'Mobile Devices', vendor: 'Redington', poDate: '2025-04-05', warrantyMonths: 24, value: 82000, company: 'Aster Digital', state: 'Issued', holderId: 'e-01', issueDate: '2026-06-20', expectedReturnDate: null,
    history: [
      h('ah-02a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-04-12', null),
      h('ah-02b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Anita Rao', '2026-06-20', 'R-ISSUE', 'Receipt acknowledgement pending'),
    ],
  },
  {
    id: 'a-03', assetTag: 'AST-0003', serial: 'SN-DELL27-0093', name: 'Dell UltraSharp 27" Monitor', category: 'Peripherals', vendor: 'Ingram Micro', poDate: '2025-02-10', warrantyMonths: 36, value: 38500, company: 'Aster Digital', state: 'Available', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [h('ah-03a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-02-18', null)],
  },
  {
    id: 'a-04', assetTag: 'AST-0004', serial: 'SN-TPX1-2210', name: 'ThinkPad X1 Carbon', category: 'IT Equipment', vendor: 'Lenovo India', poDate: '2024-11-20', warrantyMonths: 36, value: 168000, company: 'Aster Digital', state: 'Issued', holderId: 'e-09', issueDate: '2024-12-05', expectedReturnDate: '2026-06-15',
    history: [
      h('ah-04a', 'Registered', null, 'Available', 'Priya Sharma', null, '2024-11-28', null),
      h('ah-04b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Karan Mehta', '2024-12-05', 'R-ISSUE', 'Return expected before exit clearance'),
    ],
  },
  {
    id: 'a-05', assetTag: 'AST-0005', serial: 'SN-CSC-5521', name: 'Cisco Catalyst Switch', category: 'Network Equipment', vendor: 'Cisco Partner Co', poDate: '2024-06-14', warrantyMonths: 60, value: 210000, company: 'Aster Digital', state: 'In Repair', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-05a', 'Registered', null, 'Available', 'Priya Sharma', null, '2024-06-25', null),
      h('ah-05b', 'Sent for repair', 'Available', 'In Repair', 'Priya Sharma', null, '2026-05-30', 'R-REPAIR', 'Port bank 3 failure'),
    ],
  },
  {
    id: 'a-06', assetTag: 'AST-0006', serial: 'SN-HM-CHAIR-77', name: 'Herman Miller Aeron Chair', category: 'Furniture', vendor: 'OfficeWorks', poDate: '2023-09-01', warrantyMonths: 144, value: 95000, company: 'Aster Digital', state: 'Allocated', holderId: 'e-03', issueDate: '2023-09-20', expectedReturnDate: null,
    history: [
      h('ah-06a', 'Registered', null, 'Available', 'Priya Sharma', null, '2023-09-10', null),
      h('ah-06b', 'Allocated to workstation', 'Available', 'Allocated', 'Priya Sharma', 'Meera Iyer', '2023-09-20', 'R-ISSUE'),
    ],
  },
  {
    id: 'a-07', assetTag: 'AST-0007', serial: 'SN-JBL-PRJ-31', name: 'Epson Projector EB-2250U', category: 'Peripherals', vendor: 'Redington', poDate: '2024-01-18', warrantyMonths: 24, value: 74000, company: 'Aster Digital', state: 'Loan', holderId: 'e-04', issueDate: '2026-06-10', expectedReturnDate: '2026-06-24',
    history: [
      h('ah-07a', 'Registered', null, 'Available', 'Priya Sharma', null, '2024-01-30', null),
      h('ah-07b', 'Issued on loan', 'Available', 'Loan', 'Priya Sharma', 'Josh Patel', '2026-06-10', 'R-LOAN', 'Client demo — expected back 24 Jun'),
    ],
  },
  {
    id: 'a-08', assetTag: 'AST-0008', serial: 'SN-YK-ACC-19', name: 'YubiKey 5C Access Key', category: 'Security & Access', vendor: 'SecureID Dist', poDate: '2025-07-22', warrantyMonths: 12, value: 6500, company: 'Aster Digital', state: 'Returned', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-08a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-08-01', null),
      h('ah-08b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Nikhil Bose', '2025-08-05', 'R-ISSUE'),
      h('ah-08c', 'Returned', 'Issued', 'Returned', 'Priya Sharma', 'Nikhil Bose', '2026-06-18', 'R-RETURN', 'Awaiting condition reassessment'),
    ],
  },
  {
    id: 'a-09', assetTag: 'AST-0009', serial: 'LIC-ADBE-2026-08', name: 'Adobe Creative Cloud Licence', category: 'Software Licenses', vendor: 'Adobe (Direct)', poDate: '2026-01-02', warrantyMonths: 12, value: 58000, company: 'Aster Digital', state: 'Available', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [h('ah-09a', 'Registered', null, 'Available', 'Priya Sharma', null, '2026-01-02', null)],
  },
  {
    id: 'a-10', assetTag: 'AST-0010', serial: 'SN-LGTV-0042', name: 'LG 55" Conference Display', category: 'Other Equipment', vendor: 'OfficeWorks', poDate: '2022-05-09', warrantyMonths: 36, value: 88000, company: 'Aster Digital', state: 'Retired', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-10a', 'Registered', null, 'Available', 'Priya Sharma', null, '2022-05-20', null),
      h('ah-10b', 'Retired', 'Available', 'Retired', 'Priya Sharma', null, '2026-04-11', 'R-RETIRE', 'Panel burn-in — beyond economical repair'),
    ],
  },
  {
    id: 'a-11', assetTag: 'AST-0011', serial: 'SN-OLDLT-0007', name: 'HP EliteBook 840 G5', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2019-03-15', warrantyMonths: 36, value: 92000, company: 'Aster Digital', state: 'Disposed', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-11a', 'Registered', null, 'Available', 'Priya Sharma', null, '2019-03-28', null),
      h('ah-11b', 'Retired', 'Available', 'Retired', 'Priya Sharma', null, '2025-10-02', 'R-RETIRE', 'End of life'),
      h('ah-11c', 'Disposed', 'Retired', 'Disposed', 'Priya Sharma', null, '2025-11-14', 'R-DISPOSE', 'E-waste vendor certificate EWC-2291'),
    ],
  },
  {
    id: 'a-12', assetTag: 'AST-0012', serial: 'SN-MBA13-6605', name: 'MacBook Air 13"', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2026-05-02', warrantyMonths: 36, value: 134000, company: 'Aster Digital', state: 'Available', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [h('ah-12a', 'Registered', null, 'Available', 'Priya Sharma', null, '2026-05-12', null, 'Admitted from arrival INV-2044')],
  },
  {
    id: 'a-13', assetTag: 'AST-0013', serial: 'SN-MBA13-6606', name: 'MacBook Air 13"', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2026-05-02', warrantyMonths: 36, value: 134000, company: 'Aster Digital', state: 'Available', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [h('ah-13a', 'Registered', null, 'Available', 'Priya Sharma', null, '2026-05-12', null, 'Admitted from arrival INV-2044')],
  },
  {
    id: 'a-14', assetTag: 'AST-0014', serial: 'SN-S24-3310', name: 'Samsung Galaxy S24', category: 'Mobile Devices', vendor: 'Redington', poDate: '2026-02-15', warrantyMonths: 24, value: 69000, company: 'Aster Digital', state: 'Issued', holderId: 'e-02', issueDate: '2026-03-02', expectedReturnDate: null,
    history: [
      h('ah-14a', 'Registered', null, 'Available', 'Priya Sharma', null, '2026-02-25', null),
      h('ah-14b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Ravi Kumar', '2026-03-02', 'R-ISSUE', 'Issued to non-user employee — ack recorded on behalf'),
    ],
  },
  {
    id: 'a-19', assetTag: 'AST-0019', serial: 'SN-LAT7440-2231', name: 'Dell Latitude 7440', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2024-12-20', warrantyMonths: 36, value: 142000, company: 'Aster Digital', state: 'Returned', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-19a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-01-05', null),
      h('ah-19b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Anita Rao', '2025-01-10', 'R-ISSUE', 'Interim laptop during MacBook procurement'),
      h('ah-19c', 'Returned', 'Issued', 'Returned', 'Priya Sharma', 'Anita Rao', '2026-06-22', 'R-RETURN', 'Handed to IT desk — employee return confirmation pending'),
    ],
  },
  {
    id: 'a-20', assetTag: 'AST-0020', serial: 'SN-JBR-EVO2-518', name: 'Jabra Evolve2 65 Headset', category: 'Peripherals', vendor: 'Redington', poDate: '2024-07-15', warrantyMonths: 24, value: 21500, company: 'Aster Digital', state: 'Returned', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [
      h('ah-20a', 'Registered', null, 'Available', 'Priya Sharma', null, '2024-07-25', null),
      h('ah-20b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Anita Rao', '2024-08-01', 'R-ISSUE'),
      h('ah-20c', 'Returned', 'Issued', 'Returned', 'Priya Sharma', 'Anita Rao', '2025-12-15', 'R-RETURN', 'Return acknowledged with condition assessment'),
    ],
  },
  {
    id: 'a-21', assetTag: 'AST-0021', serial: 'SN-HID-ACC-204', name: 'HID Access Card', category: 'Security & Access', vendor: 'SecureID Dist', poDate: '2026-05-28', warrantyMonths: 24, value: 1800, company: 'Aster Digital', state: 'Issued', holderId: 'e-10', issueDate: '2026-06-22', expectedReturnDate: null, assignmentOrigin: 'Onboarding (W2)',
    history: [
      h('ah-21a', 'Registered', null, 'Available', 'Priya Sharma', null, '2026-06-05', null),
      h('ah-21b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Grace Lin', '2026-06-22', 'R-ISSUE', 'Issued on joining day against onboarding workflow step "Issue access card"', 'Onboarding (W2)'),
    ],
  },
  {
    id: 'a-22', assetTag: 'AST-0022', serial: 'SN-LAT5440-1187', name: 'Dell Latitude 5440', category: 'IT Equipment', vendor: 'Ingram Micro', poDate: '2025-04-18', warrantyMonths: 36, value: 118000, company: 'Aster Digital', state: 'Issued', holderId: 'e-03', issueDate: '2026-04-01', expectedReturnDate: null, assignmentOrigin: 'Internal transfer (W5)',
    history: [
      h('ah-22a', 'Registered', null, 'Available', 'Priya Sharma', null, '2025-04-30', null),
      h('ah-22b', 'Issued', 'Available', 'Issued', 'Priya Sharma', 'Josh Patel', '2025-05-10', 'R-ISSUE'),
      h('ah-22c', 'Transferred out', 'Issued', 'Issued', 'Priya Sharma', 'Josh Patel', '2026-04-01', 'R-TRANSFER', 'Handed over on internal transfer — new holder Meera Iyer', 'Internal transfer (W5)'),
      h('ah-22d', 'Transferred in', 'Issued', 'Issued', 'Priya Sharma', 'Meera Iyer', '2026-04-01', 'R-TRANSFER', 'Received from Josh Patel — assignment moved without a return/reissue cycle', 'Internal transfer (W5)'),
    ],
  },
  {
    id: 'a-15', assetTag: 'AMF-0001', serial: 'SN-FORK-889', name: 'Zebra Handheld Scanner', category: 'IT Equipment', vendor: 'Zebra Partner', poDate: '2025-06-01', warrantyMonths: 24, value: 54000, company: 'Aster Manufacturing', state: 'Issued', holderId: 'e-11', issueDate: '2025-06-20', expectedReturnDate: null,
    history: [
      h('ah-15a', 'Registered', null, 'Available', 'AM Admin', null, '2025-06-10', null),
      h('ah-15b', 'Issued', 'Available', 'Issued', 'AM Admin', 'Lena Fischer', '2025-06-20', 'R-ISSUE'),
    ],
  },
  {
    id: 'a-16', assetTag: 'ARL-0001', serial: 'SN-POS-1102', name: 'POS Terminal V2', category: 'IT Equipment', vendor: 'Pine Labs', poDate: '2025-09-12', warrantyMonths: 24, value: 41000, company: 'Aster Retail', state: 'Available', holderId: null, issueDate: null, expectedReturnDate: null,
    history: [h('ah-16a', 'Registered', null, 'Available', 'AR Admin', null, '2025-09-20', null)],
  },
  {
    id: 'a-17', assetTag: 'BOR-0001', serial: 'SN-OSC-5560', name: 'Keysight Oscilloscope', category: 'Other Equipment', vendor: 'Keysight Direct', poDate: '2024-04-08', warrantyMonths: 36, value: 480000, company: 'Borealis Labs', state: 'Issued', holderId: 'e-13', issueDate: '2024-05-01', expectedReturnDate: null,
    history: [
      h('ah-17a', 'Registered', null, 'Available', 'BL Admin', null, '2024-04-20', null),
      h('ah-17b', 'Issued', 'Available', 'Issued', 'BL Admin', 'Sana Sheikh', '2024-05-01', 'R-ISSUE'),
    ],
  },
  {
    id: 'a-18', assetTag: 'CYN-0001', serial: 'SN-GPS-7743', name: 'Garmin Fleet GPS Unit', category: 'Network Equipment', vendor: 'Garmin Dist', poDate: '2025-01-20', warrantyMonths: 24, value: 32000, company: 'Cyan Logistics', state: 'Issued', holderId: 'e-14', issueDate: '2025-02-02', expectedReturnDate: null,
    history: [
      h('ah-18a', 'Registered', null, 'Available', 'CL Admin', null, '2025-01-30', null),
      h('ah-18b', 'Issued', 'Available', 'Issued', 'CL Admin', 'Diego Morales', '2025-02-02', 'R-ISSUE'),
    ],
  },
]
