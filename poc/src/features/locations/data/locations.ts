/**
 * Locations module — domain types + seed data.
 *
 * A location is a physical office / operational site that belongs to exactly
 * one jurisdiction and is owned by exactly one company (company-specific by
 * default). Sharing across group companies is explicit, versioned and
 * effective-dated configuration (FR 6.5.1 – 6.5.4).
 */

export interface Jurisdiction {
  id: string
  name: string
  country: string
}

export const JURISDICTIONS: Jurisdiction[] = [
  { id: 'jur-ka', name: 'Karnataka', country: 'India' },
  { id: 'jur-mh', name: 'Maharashtra', country: 'India' },
  { id: 'jur-dl', name: 'Delhi NCR', country: 'India' },
  { id: 'jur-tx', name: 'Texas', country: 'United States' },
  { id: 'jur-ny', name: 'New York', country: 'United States' },
  { id: 'jur-uk', name: 'England & Wales', country: 'United Kingdom' },
]

export const TIMEZONES = [
  'Asia/Kolkata',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Asia/Dubai',
  'Australia/Sydney',
] as const

export interface Company {
  id: string
  name: string
  /** Group-company structure the company belongs to, or null when unrelated. */
  groupId: string | null
}

export const GROUP_ID = 'grp-orion'
export const GROUP_NAME = 'Orion Group'

/** The company the signed-in Company Admin / Employee belongs to. */
export const CURRENT_COMPANY_ID = 'co-orion-in'

export const COMPANIES: Company[] = [
  { id: 'co-orion-in', name: 'Orion Retail India', groupId: GROUP_ID },
  { id: 'co-orion-us', name: 'Orion Retail USA', groupId: GROUP_ID },
  { id: 'co-orion-log', name: 'Orion Logistics', groupId: GROUP_ID },
  { id: 'co-nimbus', name: 'Nimbus Foods', groupId: null },
]

export const LOCATION_STATUSES = ['active', 'inactive'] as const
export type LocationStatus = (typeof LOCATION_STATUSES)[number]

export interface CompanyLocation {
  id: string
  name: string
  /** Short unique abbreviation for the site (Kensium: Location acronym). */
  acronym: string
  /** Exactly one jurisdiction per location (FR 6.5.1). */
  jurisdictionId: string
  /** Owning company — locations are company-specific by default (FR 6.5.2). */
  companyId: string
  timezone: string
  /** IP address or CIDR range used for network-based validation. */
  ipAddress: string
  address1: string
  address2: string
  city: string
  state: string
  country: string
  pinCode: string
  status: LocationStatus
  createdOn: string
}

export const seedLocations: CompanyLocation[] = [
  {
    id: 'LOC-1001',
    name: 'Bengaluru Headquarters',
    acronym: 'BLR-HQ',
    jurisdictionId: 'jur-ka',
    companyId: 'co-orion-in',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.10.1.0/24',
    address1: '4th Floor, Prestige Tech Park',
    address2: 'Outer Ring Road, Kadubeesanahalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pinCode: '560103',
    status: 'active',
    createdOn: '2023-02-14',
  },
  {
    id: 'LOC-1002',
    name: 'Bengaluru Whitefield Office',
    acronym: 'BLR-WF',
    jurisdictionId: 'jur-ka',
    companyId: 'co-orion-in',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.10.2.0/24',
    address1: 'Block B, ITPL Main Road',
    address2: 'Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pinCode: '560066',
    status: 'active',
    createdOn: '2023-09-01',
  },
  {
    id: 'LOC-1003',
    name: 'Mumbai Andheri Office',
    acronym: 'MUM-AN',
    jurisdictionId: 'jur-mh',
    companyId: 'co-orion-in',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.20.1.0/24',
    address1: 'Unit 902, Supreme Business Park',
    address2: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '400069',
    status: 'active',
    createdOn: '2023-11-20',
  },
  {
    id: 'LOC-1004',
    name: 'Pune Hinjewadi Centre',
    acronym: 'PNQ-HJ',
    jurisdictionId: 'jur-mh',
    companyId: 'co-orion-in',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.20.2.0/24',
    address1: 'Tower 3, Embassy TechZone',
    address2: 'Hinjewadi Phase 2',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '411057',
    status: 'active',
    createdOn: '2024-03-05',
  },
  {
    id: 'LOC-1005',
    name: 'Delhi Okhla Warehouse',
    acronym: 'DEL-OK',
    jurisdictionId: 'jur-dl',
    companyId: 'co-orion-in',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.30.1.0/24',
    address1: 'Plot 48, Okhla Industrial Estate',
    address2: 'Phase III',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pinCode: '110020',
    status: 'inactive',
    createdOn: '2024-06-18',
  },
  {
    id: 'LOC-2001',
    name: 'Austin Support Hub',
    acronym: 'AUS-SH',
    jurisdictionId: 'jur-tx',
    companyId: 'co-orion-us',
    timezone: 'America/Chicago',
    ipAddress: '172.16.4.0/23',
    address1: '600 Congress Avenue, Suite 1400',
    address2: '',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    pinCode: '73301',
    status: 'active',
    createdOn: '2022-08-30',
  },
  {
    id: 'LOC-2002',
    name: 'Dallas Fulfilment Center',
    acronym: 'DAL-FC',
    jurisdictionId: 'jur-tx',
    companyId: 'co-orion-us',
    timezone: 'America/Chicago',
    ipAddress: '172.16.8.0/22',
    address1: '2200 Logistics Parkway',
    address2: '',
    city: 'Dallas',
    state: 'Texas',
    country: 'United States',
    pinCode: '75201',
    status: 'active',
    createdOn: '2023-04-12',
  },
  {
    id: 'LOC-2003',
    name: 'New York Sales Office',
    acronym: 'NYC-SO',
    jurisdictionId: 'jur-ny',
    companyId: 'co-orion-us',
    timezone: 'America/New_York',
    ipAddress: '172.17.1.0/24',
    address1: '335 Madison Avenue, Floor 16',
    address2: '',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    pinCode: '10017',
    status: 'active',
    createdOn: '2024-01-22',
  },
  {
    id: 'LOC-3001',
    name: 'London Liaison Office',
    acronym: 'LDN-LO',
    jurisdictionId: 'jur-uk',
    companyId: 'co-orion-log',
    timezone: 'Europe/London',
    ipAddress: '192.168.40.0/24',
    address1: '1 Poultry',
    address2: 'City of London',
    city: 'London',
    state: 'Greater London',
    country: 'United Kingdom',
    pinCode: 'EC2R 8EJ',
    status: 'active',
    createdOn: '2023-07-03',
  },
  {
    id: 'LOC-3002',
    name: 'Nashik Cold Storage',
    acronym: 'NSK-CS',
    jurisdictionId: 'jur-mh',
    companyId: 'co-orion-log',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.40.1.0/24',
    address1: 'Gat 221, Sinnar Industrial Area',
    address2: '',
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '422103',
    status: 'active',
    createdOn: '2024-10-09',
  },
  {
    id: 'LOC-9001',
    name: 'Nimbus Foods Processing Plant',
    acronym: 'NIM-PP',
    jurisdictionId: 'jur-mh',
    companyId: 'co-nimbus',
    timezone: 'Asia/Kolkata',
    ipAddress: '10.99.1.0/24',
    address1: 'D-14, MIDC Taloja',
    address2: '',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '410208',
    status: 'active',
    createdOn: '2023-05-25',
  },
]

/* ------------------------------------------------------------------ */
/* Sharing — explicit, versioned, effective-dated configuration        */
/* ------------------------------------------------------------------ */

export type ShareAction = 'enabled' | 'updated' | 'revoked'

export interface ShareVersion {
  version: number
  action: ShareAction
  effectiveFrom: string
  targetCompanyIds: string[]
  changedBy: string
  changedOn: string
  summary: string
}

export interface LocationShare {
  id: string
  locationId: string
  targetCompanyIds: string[]
  /** Explicitly revoked shares stay on file for history/audit. */
  revoked: boolean
  effectiveFrom: string
  version: number
  history: ShareVersion[]
}

export const seedShares: LocationShare[] = [
  {
    id: 'SHR-01',
    locationId: 'LOC-2001',
    targetCompanyIds: ['co-orion-in'],
    revoked: false,
    effectiveFrom: '2025-01-01',
    version: 2,
    history: [
      {
        version: 1,
        action: 'enabled',
        effectiveFrom: '2024-11-01',
        targetCompanyIds: ['co-orion-in'],
        changedBy: 'G. Menon (Group Company Admin)',
        changedOn: '2024-10-28',
        summary: 'Sharing enabled for Orion Retail India.',
      },
      {
        version: 2,
        action: 'updated',
        effectiveFrom: '2025-01-01',
        targetCompanyIds: ['co-orion-in'],
        changedBy: 'G. Menon (Group Company Admin)',
        changedOn: '2024-12-19',
        summary: 'Effective date moved to the new financial period.',
      },
    ],
  },
  {
    id: 'SHR-02',
    locationId: 'LOC-3001',
    targetCompanyIds: ['co-orion-in', 'co-orion-us'],
    revoked: false,
    effectiveFrom: '2025-04-01',
    version: 1,
    history: [
      {
        version: 1,
        action: 'enabled',
        effectiveFrom: '2025-04-01',
        targetCompanyIds: ['co-orion-in', 'co-orion-us'],
        changedBy: 'G. Menon (Group Company Admin)',
        changedOn: '2025-03-24',
        summary: 'London liaison office shared with both retail companies.',
      },
    ],
  },
  {
    id: 'SHR-03',
    locationId: 'LOC-1005',
    targetCompanyIds: ['co-orion-log'],
    revoked: false,
    effectiveFrom: '2026-08-01',
    version: 1,
    history: [
      {
        version: 1,
        action: 'enabled',
        effectiveFrom: '2026-08-01',
        targetCompanyIds: ['co-orion-log'],
        changedBy: 'R. Iyer (Group Company Admin)',
        changedOn: '2026-06-15',
        summary: 'Scheduled: warehouse access for Orion Logistics from August.',
      },
    ],
  },
  {
    id: 'SHR-04',
    locationId: 'LOC-3002',
    targetCompanyIds: ['co-orion-in'],
    revoked: true,
    effectiveFrom: '2025-02-01',
    version: 2,
    history: [
      {
        version: 1,
        action: 'enabled',
        effectiveFrom: '2025-02-01',
        targetCompanyIds: ['co-orion-in'],
        changedBy: 'R. Iyer (Group Company Admin)',
        changedOn: '2025-01-27',
        summary: 'Cold storage shared with Orion Retail India.',
      },
      {
        version: 2,
        action: 'revoked',
        effectiveFrom: '2026-02-01',
        targetCompanyIds: [],
        changedBy: 'R. Iyer (Group Company Admin)',
        changedOn: '2026-01-30',
        summary: 'Sharing revoked — site handed to a 3PL operator.',
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Audit trail                                                         */
/* ------------------------------------------------------------------ */

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  locationId: string
  detail: string
}

export const seedAudit: AuditEntry[] = [
  {
    id: 'aud-006',
    timestamp: '2026-06-15T10:42:00Z',
    actor: 'R. Iyer (Group Company Admin)',
    action: 'Sharing scheduled',
    locationId: 'LOC-1005',
    detail:
      'Delhi Okhla Warehouse scheduled to be shared with Orion Logistics, effective 01 Aug 2026 (v1).',
  },
  {
    id: 'aud-005',
    timestamp: '2026-01-30T15:05:00Z',
    actor: 'R. Iyer (Group Company Admin)',
    action: 'Sharing revoked',
    locationId: 'LOC-3002',
    detail:
      'Nashik Cold Storage sharing to Orion Retail India revoked (v2). Reference no longer resolvable.',
  },
  {
    id: 'aud-004',
    timestamp: '2025-03-24T09:18:00Z',
    actor: 'G. Menon (Group Company Admin)',
    action: 'Sharing enabled',
    locationId: 'LOC-3001',
    detail:
      'London Liaison Office shared with Orion Retail India and Orion Retail USA, effective 01 Apr 2025 (v1).',
  },
  {
    id: 'aud-003',
    timestamp: '2025-01-27T11:30:00Z',
    actor: 'R. Iyer (Group Company Admin)',
    action: 'Sharing enabled',
    locationId: 'LOC-3002',
    detail:
      'Nashik Cold Storage shared with Orion Retail India, effective 01 Feb 2025 (v1).',
  },
  {
    id: 'aud-002',
    timestamp: '2024-12-19T14:47:00Z',
    actor: 'G. Menon (Group Company Admin)',
    action: 'Sharing updated',
    locationId: 'LOC-2001',
    detail:
      'Austin Support Hub share to Orion Retail India re-dated to 01 Jan 2025 (v2).',
  },
  {
    id: 'aud-001',
    timestamp: '2024-10-28T08:12:00Z',
    actor: 'G. Menon (Group Company Admin)',
    action: 'Sharing enabled',
    locationId: 'LOC-2001',
    detail:
      'Austin Support Hub shared with Orion Retail India, effective 01 Nov 2024 (v1).',
  },
]

/** The signed-in employee's assignment, used by the "My Location" view. */
export const EMPLOYEE_PROFILE = {
  name: 'Ananya Deshpande',
  employeeId: 'EMP-0412',
  designation: 'Senior Payroll Analyst',
  companyId: CURRENT_COMPANY_ID,
  locationId: 'LOC-1001',
}
