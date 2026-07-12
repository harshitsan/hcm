export const POLICY_TYPES = ['HR', 'Business'] as const
export type PolicyType = (typeof POLICY_TYPES)[number]

export const POLICY_CATEGORIES = [
  'Code of Conduct',
  'Leave & Time Off',
  'Attendance',
  'Remote Work',
  'Compensation & Expense',
  'Health & Safety',
  'Onboarding & Probation',
  'Exit & Offboarding',
  'Assets & IT',
  'Compliance',
] as const

export const COMPANIES = [
  'Acme Retail',
  'Acme Logistics',
  'Northwind Foods',
  'Zenith Software',
] as const

export const ORG_GROUPS = ['Acme Group', 'Northwind Group'] as const

/** Which companies each org group contains (group-level policies cascade here). */
export const GROUP_COMPANIES: Record<string, string[]> = {
  'Acme Group': ['Acme Retail', 'Acme Logistics'],
  'Northwind Group': ['Northwind Foods', 'Zenith Software'],
}

export const JURISDICTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'UAE',
] as const

export const LOCATIONS = [
  'Hyderabad',
  'Bengaluru',
  'Austin',
  'London',
  'Dubai',
] as const

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Sales',
  'Operations',
  'Support',
] as const

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contractor',
  'Intern',
] as const

export const POSITION_LEVELS = [
  'L1 — Associate',
  'L2 — Senior',
  'L3 — Manager',
  'L4 — Director',
  'L5 — Executive',
] as const

export const LINKED_MODULES = [
  'Leave',
  'Attendance',
  'Onboarding',
  'Probation',
  'Performance',
  'Exit',
  'Asset Management',
] as const

export const WORKER_KIND_SCOPES = ['employees', 'contractors', 'both'] as const
export type WorkerKindScope = (typeof WORKER_KIND_SCOPES)[number]

export const OWNER_LEVELS = ['Company', 'Group', 'Portfolio'] as const
export type OwnerLevel = (typeof OWNER_LEVELS)[number]

export interface PolicyAttachment {
  fileName: string
  sizeKb: number
}

export type VersionStatus = 'draft' | 'published'

export interface PolicyVersion {
  version: number
  /** Named edition, e.g. "Employee Manual 2025" (POL-32). */
  editionName: string
  effectiveFrom: string
  /** null = open-ended (active indefinitely from its start). */
  effectiveTill: string | null
  content: string
  attachment: PolicyAttachment | null
  status: VersionStatus
  changeNote: string
  /** Version published because a law or regulation changed — the resulting
   * re-acknowledgment wave is treated as priority. */
  regulatoryUpdate?: boolean
  createdBy: string
  createdOn: string
}

/** Applicability scope — empty array on a dimension means "no restriction". */
export interface PolicyScope {
  companies: string[]
  groups: string[]
  jurisdictions: string[]
  locations: string[]
  departments: string[]
  employmentTypes: string[]
  workerKinds: WorkerKindScope
  /** Included position levels; empty = all levels. */
  positionLevels: string[]
  /** Position levels carved out even when the rest of the scope matches. */
  excludedPositionLevels: string[]
}

/** Governed, versioned applicability configuration (POL-16). */
export interface ScopeConfigVersion {
  version: number
  effectiveFrom: string
  changedBy: string
  note: string
  scope: PolicyScope
}

export interface Policy {
  id: string
  name: string
  type: PolicyType
  category: string
  tenant: string
  ownerLevel: OwnerLevel
  /** Company or group name that owns the policy (portfolio-level = portfolio name). */
  ownerName: string
  linkedModules: string[]
  scope: PolicyScope
  scopeConfigVersions: ScopeConfigVersion[]
  versions: PolicyVersion[]
  retired: boolean
}

export const TENANT = 'aurora-hcm'
export const PORTFOLIO_NAME = 'Aurora Portfolio'

export const emptyScope: PolicyScope = {
  companies: [],
  groups: [],
  jurisdictions: [],
  locations: [],
  departments: [],
  employmentTypes: [],
  workerKinds: 'both',
  positionLevels: [],
  excludedPositionLevels: [],
}

function scope(partial: Partial<PolicyScope>): PolicyScope {
  return { ...emptyScope, ...partial }
}

function configV1(s: PolicyScope, effectiveFrom: string): ScopeConfigVersion[] {
  return [
    {
      version: 1,
      effectiveFrom,
      changedBy: 'Company Admin',
      note: 'Initial applicability configuration',
      scope: s,
    },
  ]
}

export const seedPolicies: Policy[] = [
  {
    id: 'pol-1001',
    name: 'Employee Manual',
    type: 'HR',
    category: 'Code of Conduct',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Onboarding'],
    scope: scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
      '2024-01-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Employee Manual 2024',
        effectiveFrom: '2024-01-01',
        effectiveTill: '2024-12-31',
        content:
          'The 2024 edition of the Acme Retail Employee Manual covering conduct, working hours, grievance redressal and disciplinary procedure.',
        attachment: { fileName: 'employee-manual-2024.pdf', sizeKb: 2140 },
        status: 'published',
        changeNote: 'First manual edition issued under SatelliteHR',
        createdBy: 'Meera Iyer',
        createdOn: '2023-12-12',
      },
      {
        version: 2,
        editionName: 'Employee Manual 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: '2025-12-31',
        content:
          'The 2025 edition adds the hybrid-work code of conduct and the updated grievance escalation matrix.',
        attachment: { fileName: 'employee-manual-2025.pdf', sizeKb: 2380 },
        status: 'published',
        changeNote: 'Annual refresh — hybrid work conduct added',
        createdBy: 'Meera Iyer',
        createdOn: '2024-12-10',
      },
      {
        version: 3,
        editionName: 'Employee Manual 2026',
        effectiveFrom: '2026-01-01',
        effectiveTill: null,
        content:
          'The 2026 edition introduces the AI-assisted tooling usage policy and revised anti-harassment reporting channels.',
        attachment: { fileName: 'employee-manual-2026.pdf', sizeKb: 2510 },
        status: 'published',
        changeNote: 'Annual refresh — AI tooling usage policy added',
        createdBy: 'Meera Iyer',
        createdOn: '2025-12-15',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1002',
    name: 'Group Leave Policy',
    type: 'HR',
    category: 'Leave & Time Off',
    tenant: TENANT,
    ownerLevel: 'Group',
    ownerName: 'Acme Group',
    linkedModules: ['Leave'],
    scope: scope({ groups: ['Acme Group'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ groups: ['Acme Group'], workerKinds: 'employees' }),
      '2025-04-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Group Leave Policy FY26',
        effectiveFrom: '2025-04-01',
        effectiveTill: null,
        content:
          'Baseline leave entitlements for all Acme Group companies: 24 days annual leave, 12 days sick leave, carry-forward of up to 8 days.',
        attachment: { fileName: 'acme-group-leave-fy26.pdf', sizeKb: 890 },
        status: 'published',
        changeNote: 'Group-wide baseline entitlements',
        createdBy: 'Rohit Malhotra',
        createdOn: '2025-03-20',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1003',
    name: 'Acme Retail Leave Policy',
    type: 'HR',
    category: 'Leave & Time Off',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Leave', 'Attendance'],
    scope: scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
      '2025-04-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Acme Retail Leave Policy FY26',
        effectiveFrom: '2025-04-01',
        effectiveTill: null,
        content:
          'Company-specific leave rules for Acme Retail: 26 days annual leave with festival block-leave windows for store staff. Overrides the group baseline.',
        attachment: { fileName: 'acme-retail-leave-fy26.pdf', sizeKb: 940 },
        status: 'published',
        changeNote: 'Company override of the group baseline',
        createdBy: 'Meera Iyer',
        createdOn: '2025-03-25',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1004',
    name: 'Attendance & Shift Policy',
    type: 'HR',
    category: 'Attendance',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Attendance'],
    scope: scope({
      companies: ['Acme Retail'],
      workerKinds: 'both',
      excludedPositionLevels: ['L4 — Director', 'L5 — Executive'],
    }),
    scopeConfigVersions: [
      {
        version: 1,
        effectiveFrom: '2025-01-01',
        changedBy: 'Company Admin',
        note: 'Initial applicability configuration',
        scope: scope({ companies: ['Acme Retail'], workerKinds: 'both' }),
      },
      {
        version: 2,
        effectiveFrom: '2025-06-01',
        changedBy: 'Company Admin',
        note: 'Directors and executives exempted from shift tracking',
        scope: scope({
          companies: ['Acme Retail'],
          workerKinds: 'both',
          excludedPositionLevels: ['L4 — Director', 'L5 — Executive'],
        }),
      },
    ],
    versions: [
      {
        version: 1,
        editionName: 'Attendance & Shift Policy 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          'Biometric check-in is mandatory for all store and warehouse shifts. Grace period of 10 minutes, three late marks convert to a half-day deduction.',
        attachment: { fileName: 'attendance-shift-2025.pdf', sizeKb: 610 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2024-12-18',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1005',
    name: 'Contractor Engagement Policy',
    type: 'Business',
    category: 'Compliance',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Onboarding', 'Exit'],
    scope: scope({ companies: ['Acme Retail'], workerKinds: 'contractors' }),
    scopeConfigVersions: configV1(
      scope({ companies: ['Acme Retail'], workerKinds: 'contractors' }),
      '2025-02-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Contractor Engagement Policy v1',
        effectiveFrom: '2025-02-01',
        effectiveTill: null,
        content:
          'Engagement terms for contract workers: statement-of-work sign-off, badge access limits, invoicing cadence and off-boarding checklist. Applies to contractors only.',
        attachment: { fileName: 'contractor-engagement.docx', sizeKb: 320 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2025-01-22',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1006',
    name: 'POSH Compliance Policy',
    type: 'HR',
    category: 'Compliance',
    tenant: TENANT,
    ownerLevel: 'Group',
    ownerName: 'Acme Group',
    linkedModules: ['Onboarding'],
    scope: scope({ groups: ['Acme Group'], jurisdictions: ['India'] }),
    scopeConfigVersions: configV1(
      scope({ groups: ['Acme Group'], jurisdictions: ['India'] }),
      '2024-06-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'POSH Policy (India) 2024',
        effectiveFrom: '2024-06-01',
        effectiveTill: null,
        content:
          'Prevention of Sexual Harassment policy as mandated by Indian law: Internal Committee constitution, complaint timelines and mandatory annual training. Applies to workers in the India jurisdiction only.',
        attachment: { fileName: 'posh-policy-india.pdf', sizeKb: 780 },
        status: 'published',
        changeNote: 'Statutory issue for India jurisdiction',
        createdBy: 'Rohit Malhotra',
        createdOn: '2024-05-14',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1007',
    name: 'US At-Will Employment Handbook',
    type: 'HR',
    category: 'Compliance',
    tenant: TENANT,
    ownerLevel: 'Group',
    ownerName: 'Acme Group',
    linkedModules: [],
    scope: scope({
      groups: ['Acme Group'],
      jurisdictions: ['United States'],
      workerKinds: 'employees',
    }),
    scopeConfigVersions: configV1(
      scope({
        groups: ['Acme Group'],
        jurisdictions: ['United States'],
        workerKinds: 'employees',
      }),
      '2025-01-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'US Handbook 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          'US-jurisdiction employment handbook covering at-will employment, FMLA leave interplay and state-level wage notices.',
        attachment: { fileName: 'us-handbook-2025.pdf', sizeKb: 1450 },
        status: 'published',
        changeNote: 'Statutory issue for US jurisdiction',
        createdBy: 'Rohit Malhotra',
        createdOn: '2024-12-02',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1008',
    name: 'Remote Work Policy',
    type: 'Business',
    category: 'Remote Work',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Attendance', 'Asset Management'],
    scope: scope({
      companies: ['Acme Retail'],
      departments: ['Engineering', 'Support'],
      employmentTypes: ['Full-time', 'Part-time'],
      workerKinds: 'employees',
      excludedPositionLevels: ['L5 — Executive'],
    }),
    scopeConfigVersions: configV1(
      scope({
        companies: ['Acme Retail'],
        departments: ['Engineering', 'Support'],
        employmentTypes: ['Full-time', 'Part-time'],
        workerKinds: 'employees',
        excludedPositionLevels: ['L5 — Executive'],
      }),
      '2025-05-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Remote Work Policy 2025',
        effectiveFrom: '2025-05-01',
        effectiveTill: null,
        content:
          'Hybrid schedule of 3 office days for Engineering and Support. Home-office equipment issued through the asset requisition flow.',
        attachment: { fileName: 'remote-work-2025.pdf', sizeKb: 540 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2025-04-16',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1009',
    name: 'Travel & Expense Policy',
    type: 'Business',
    category: 'Compensation & Expense',
    tenant: TENANT,
    ownerLevel: 'Portfolio',
    ownerName: PORTFOLIO_NAME,
    linkedModules: [],
    scope: scope({}),
    scopeConfigVersions: configV1(scope({}), '2025-01-01'),
    versions: [
      {
        version: 1,
        editionName: 'T&E Policy 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          'Portfolio-wide travel booking classes, per-diem bands by city tier and expense submission deadlines. Applies to every company in the Aurora Portfolio.',
        attachment: { fileName: 'travel-expense-2025.pdf', sizeKb: 720 },
        status: 'published',
        changeNote: 'Portfolio-wide baseline',
        createdBy: 'Alicia Fernandez',
        createdOn: '2024-12-05',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1010',
    name: 'Probation & Confirmation Policy',
    type: 'HR',
    category: 'Onboarding & Probation',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Onboarding', 'Probation', 'Performance'],
    scope: scope({
      companies: ['Acme Retail'],
      employmentTypes: ['Full-time'],
      workerKinds: 'employees',
    }),
    scopeConfigVersions: configV1(
      scope({
        companies: ['Acme Retail'],
        employmentTypes: ['Full-time'],
        workerKinds: 'employees',
      }),
      '2025-01-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Probation Policy 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          '6-month probation for full-time hires with a 30-60-90 review cadence feeding the performance module. Confirmation letters auto-generated on clearance.',
        attachment: { fileName: 'probation-policy.pdf', sizeKb: 410 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2024-12-19',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1011',
    name: 'Asset Custody Policy',
    type: 'Business',
    category: 'Assets & IT',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Asset Management', 'Exit'],
    scope: scope({ companies: ['Acme Retail'] }),
    scopeConfigVersions: configV1(scope({ companies: ['Acme Retail'] }), '2025-03-01'),
    versions: [
      {
        version: 1,
        editionName: 'Asset Custody Policy v1',
        effectiveFrom: '2025-03-01',
        effectiveTill: '2026-07-31',
        content:
          'Custody, care and return obligations for company-issued laptops, phones and store hardware. Clearance required at exit.',
        attachment: { fileName: 'asset-custody-v1.pdf', sizeKb: 380 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2025-02-11',
      },
      {
        version: 2,
        editionName: 'Asset Custody Policy v2',
        effectiveFrom: '2026-08-01',
        effectiveTill: null,
        content:
          'Adds BYOD registration, mobile-device-management enrollment and accidental-damage cover. Supersedes v1 on 1 Aug 2026.',
        attachment: { fileName: 'asset-custody-v2.pdf', sizeKb: 430 },
        status: 'published',
        changeNote: 'BYOD and MDM coverage added — scheduled',
        createdBy: 'Meera Iyer',
        createdOn: '2026-06-20',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1012',
    name: 'Summer Hours Policy 2025',
    type: 'Business',
    category: 'Attendance',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Attendance'],
    scope: scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
      '2025-06-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Summer Hours 2025',
        effectiveFrom: '2025-06-01',
        effectiveTill: '2025-09-30',
        content:
          'Seasonal early-finish Fridays for the 2025 summer window. Expired automatically at the end of its validity window.',
        attachment: null,
        status: 'published',
        changeNote: 'Seasonal policy',
        createdBy: 'Meera Iyer',
        createdOn: '2025-05-20',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1013',
    name: 'Dress Code Policy',
    type: 'HR',
    category: 'Code of Conduct',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: [],
    scope: scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ companies: ['Acme Retail'], workerKinds: 'employees' }),
      '2023-01-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Dress Code 2023',
        effectiveFrom: '2023-01-01',
        effectiveTill: '2025-10-31',
        content:
          'Formal dress code for store-facing staff. Retired in favour of the conduct chapter of the Employee Manual; retained for audit.',
        attachment: { fileName: 'dress-code-2023.pdf', sizeKb: 210 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Meera Iyer',
        createdOn: '2022-12-08',
      },
    ],
    retired: true,
  },
  {
    id: 'pol-1014',
    name: 'Intern Conduct Policy',
    type: 'HR',
    category: 'Code of Conduct',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Acme Retail',
    linkedModules: ['Onboarding'],
    scope: scope({
      companies: ['Acme Retail'],
      employmentTypes: ['Intern'],
      workerKinds: 'employees',
    }),
    scopeConfigVersions: configV1(
      scope({
        companies: ['Acme Retail'],
        employmentTypes: ['Intern'],
        workerKinds: 'employees',
      }),
      '2026-08-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Intern Conduct Policy v1',
        effectiveFrom: '2026-08-01',
        effectiveTill: null,
        content:
          'Draft conduct and mentorship expectations for the 2026 intern cohort. Not yet published — visible to admins only.',
        attachment: null,
        status: 'draft',
        changeNote: 'Drafted for the autumn intern cohort',
        createdBy: 'Meera Iyer',
        createdOn: '2026-06-25',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1015',
    name: 'Food Safety & Hygiene Policy',
    type: 'Business',
    category: 'Health & Safety',
    tenant: TENANT,
    ownerLevel: 'Company',
    ownerName: 'Northwind Foods',
    linkedModules: ['Onboarding', 'Attendance'],
    scope: scope({ companies: ['Northwind Foods'] }),
    scopeConfigVersions: configV1(scope({ companies: ['Northwind Foods'] }), '2025-01-01'),
    versions: [
      {
        version: 1,
        editionName: 'Food Safety Policy 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          'HACCP-aligned hygiene procedures for Northwind Foods production staff. Owned by Northwind — outside the Acme Group admin scope.',
        attachment: { fileName: 'food-safety-2025.pdf', sizeKb: 980 },
        status: 'published',
        changeNote: 'Initial issue',
        createdBy: 'Grace Liu',
        createdOn: '2024-12-11',
      },
    ],
    retired: false,
  },
  {
    id: 'pol-1016',
    name: 'Exit & Offboarding Policy',
    type: 'HR',
    category: 'Exit & Offboarding',
    tenant: TENANT,
    ownerLevel: 'Group',
    ownerName: 'Acme Group',
    linkedModules: ['Exit', 'Asset Management'],
    scope: scope({ groups: ['Acme Group'] }),
    scopeConfigVersions: configV1(scope({ groups: ['Acme Group'] }), '2025-01-01'),
    versions: [
      {
        version: 1,
        editionName: 'Exit Policy 2025',
        effectiveFrom: '2025-01-01',
        effectiveTill: null,
        content:
          'Notice periods by level, clearance checklist (assets, finance, knowledge transfer) and full-and-final settlement timelines for all Acme Group companies.',
        attachment: { fileName: 'exit-policy-2025.pdf', sizeKb: 660 },
        status: 'published',
        changeNote: 'Group-wide baseline',
        createdBy: 'Rohit Malhotra',
        createdOn: '2024-12-03',
      },
    ],
    retired: false,
  },
  // Publishing a new version of this policy demonstrates population-scoped
  // re-acknowledgment: the acknowledgment tracker applies the Code of
  // Conduct to office-based staff only, so a version bump re-asks part of
  // the earlier roster and closes the rest as "No longer applicable".
  {
    id: 'pol-1017',
    name: 'Code of Conduct',
    type: 'HR',
    category: 'Code of Conduct',
    tenant: TENANT,
    ownerLevel: 'Group',
    ownerName: 'Acme Group',
    linkedModules: ['Onboarding'],
    scope: scope({ groups: ['Acme Group'], workerKinds: 'employees' }),
    scopeConfigVersions: configV1(
      scope({ groups: ['Acme Group'], workerKinds: 'employees' }),
      '2026-01-01'
    ),
    versions: [
      {
        version: 1,
        editionName: 'Code of Conduct 2026',
        effectiveFrom: '2026-01-01',
        effectiveTill: null,
        content:
          'Group-wide standards of professional and ethical behaviour for office-based staff: conflicts of interest, gifts and hospitality, fair dealing and the duty to report misconduct through the confidential ethics line.',
        attachment: { fileName: 'code-of-conduct-2026.pdf', sizeKb: 1180 },
        status: 'published',
        changeNote: 'Annual refresh of the group code',
        createdBy: 'Rohit Malhotra',
        createdOn: '2025-12-18',
      },
    ],
    retired: false,
  },
]
