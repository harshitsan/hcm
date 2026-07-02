/**
 * Company-scoped sign-in security configuration — MFA (RSEC-08, RSEC-12),
 * password policy (RSEC-24 … RSEC-29), Active Directory integration
 * (RSEC-30 … RSEC-32) — plus scheduled jobs (RSEC-37, RSEC-38) and support
 * teams (RSEC-39).
 */
import type { AppModule, Department, WorkforceType } from './directory'

export interface PasswordPolicy {
  /** Days until a password expires; 0 = passwords never force-expire (RSEC-24). */
  expiryDays: number
  /** Consecutive wrong attempts before the account locks (RSEC-25). */
  maxWrongAttempts: number
  /** Hours until a locked account automatically reactivates (RSEC-26). */
  reactivationHours: number
  /** Most-recent passwords that cannot be reused; 0 = no restriction (RSEC-27). */
  historyDepth: number
  minLength: number
  maxLength: number
  requireUpper: boolean
  requireLower: boolean
  requireNumber: boolean
  requireSpecial: boolean
}

export interface CompanySecurity {
  companyId: string
  /** MFA applies per company only (RSEC-08). */
  mfaEnabled: boolean
  passwordPolicy: PasswordPolicy
}

export const seedCompanySecurity: CompanySecurity[] = [
  {
    companyId: 'co-1',
    mfaEnabled: true,
    passwordPolicy: {
      expiryDays: 90,
      maxWrongAttempts: 5,
      reactivationHours: 24,
      historyDepth: 3,
      minLength: 10,
      maxLength: 64,
      requireUpper: true,
      requireLower: true,
      requireNumber: true,
      requireSpecial: true,
    },
  },
  {
    companyId: 'co-2',
    mfaEnabled: false,
    passwordPolicy: {
      expiryDays: 180,
      maxWrongAttempts: 3,
      reactivationHours: 12,
      historyDepth: 5,
      minLength: 8,
      maxLength: 32,
      requireUpper: true,
      requireLower: true,
      requireNumber: true,
      requireSpecial: false,
    },
  },
  {
    companyId: 'co-3',
    mfaEnabled: false,
    passwordPolicy: {
      expiryDays: 0,
      maxWrongAttempts: 5,
      reactivationHours: 48,
      historyDepth: 0,
      minLength: 8,
      maxLength: 24,
      requireUpper: false,
      requireLower: true,
      requireNumber: true,
      requireSpecial: false,
    },
  },
  {
    companyId: 'co-4',
    mfaEnabled: true,
    passwordPolicy: {
      expiryDays: 60,
      maxWrongAttempts: 4,
      reactivationHours: 6,
      historyDepth: 4,
      minLength: 12,
      maxLength: 40,
      requireUpper: true,
      requireLower: true,
      requireNumber: true,
      requireSpecial: true,
    },
  },
]

/* ---------- Active Directory (RSEC-30 … RSEC-32) ---------- */

export interface AdConfig {
  companyId: string
  enabled: boolean
  /** Employee classes governed by AD authentication (RSEC-31). */
  classes: WorkforceType[]
  locations: string[]
  departments: Department[]
  /** Positions selected as applicable for AD (shuttle control, RSEC-32). */
  selectedPositions: string[]
  /** Subset of selected positions that must have an AD account. */
  mandatoryPositions: string[]
}

export const seedAdConfig: AdConfig = {
  companyId: 'co-1',
  enabled: true,
  classes: ['Permanent', 'Contract'],
  locations: ['Hyderabad', 'Bengaluru'],
  departments: ['Engineering', 'Finance'],
  selectedPositions: ['Software Engineer', 'QA Engineer', 'Finance Controller'],
  mandatoryPositions: ['Software Engineer'],
}

/* ---------- Scheduled jobs (RSEC-37, RSEC-38) ---------- */

export interface JobRecipient {
  kind: 'Employee' | 'Role'
  name: string
}

export interface ScheduledJob {
  id: string
  name: string
  description: string
  enabled: boolean
  recipients: JobRecipient[]
  lastRun: string | null
}

export const seedJobs: ScheduledJob[] = [
  {
    id: 'job-01',
    name: 'Attendance job',
    description: 'Processes daily punch data into attendance records',
    enabled: true,
    recipients: [{ kind: 'Role', name: 'Company HR Manager' }],
    lastRun: '2026-07-01',
  },
  {
    id: 'job-02',
    name: 'Leave-credit job',
    description: 'Accrues monthly leave credits per policy',
    enabled: true,
    recipients: [
      { kind: 'Role', name: 'Company HR Manager' },
      { kind: 'Employee', name: 'Meera Iyer' },
    ],
    lastRun: '2026-07-01',
  },
  {
    id: 'job-03',
    name: 'Confirmation job',
    description: 'Flags employees reaching probation confirmation dates',
    enabled: false,
    recipients: [],
    lastRun: '2026-05-31',
  },
  {
    id: 'job-04',
    name: 'Acumatica integration job',
    description: 'Syncs employee and payroll data with Acumatica ERP',
    enabled: true,
    recipients: [{ kind: 'Employee', name: 'Kabir Shah' }],
    lastRun: '2026-06-30',
  },
  {
    id: 'job-05',
    name: 'Timesheet reminder job',
    description: 'Reminds employees with unsubmitted timesheets',
    enabled: true,
    recipients: [{ kind: 'Role', name: 'Team Approver' }],
    lastRun: '2026-06-29',
  },
  {
    id: 'job-06',
    name: 'Document reminder job',
    description: 'Chases pending document acknowledgements',
    enabled: false,
    recipients: [],
    lastRun: null,
  },
  {
    id: 'job-07',
    name: 'Utilization job',
    description: 'Computes weekly project utilization metrics',
    enabled: true,
    recipients: [{ kind: 'Role', name: 'Portfolio Auditor' }],
    lastRun: '2026-06-28',
  },
]

/* ---------- Support teams (RSEC-39) ---------- */

export interface SupportTeam {
  id: string
  name: string
  locations: string[]
  modules: AppModule[]
  contactType: 'Functional' | 'Technical'
  primaryContactId: string
  secondaryContactId: string
}

export const seedSupportTeams: SupportTeam[] = [
  {
    id: 'st-01',
    name: 'HR Helpdesk — South',
    locations: ['Hyderabad', 'Bengaluru'],
    modules: ['Leave Management', 'Employee Self-Service'],
    contactType: 'Functional',
    primaryContactId: 'emp-03',
    secondaryContactId: 'emp-14',
  },
  {
    id: 'st-02',
    name: 'Payroll Support',
    locations: ['Hyderabad', 'Chennai', 'Pune'],
    modules: ['Payroll Configuration'],
    contactType: 'Functional',
    primaryContactId: 'emp-04',
    secondaryContactId: 'emp-03',
  },
  {
    id: 'st-03',
    name: 'Systems & Access',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Remote'],
    modules: ['Organization', 'Time & Attendance'],
    contactType: 'Technical',
    primaryContactId: 'emp-02',
    secondaryContactId: 'emp-05',
  },
  {
    id: 'st-04',
    name: 'Recruitment Desk',
    locations: ['Remote'],
    modules: ['Recruitment'],
    contactType: 'Functional',
    primaryContactId: 'emp-07',
    secondaryContactId: 'emp-03',
  },
]
