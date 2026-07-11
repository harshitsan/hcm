/**
 * hire-bridge.ts — recruitment → employees/lifecycle conversion handoff
 * (BRD 6.13.6, TA-14, TA-18).
 *
 * Converting an accepted offer must produce a *real* employee record and an
 * onboarding case that are visible in /employees and /lifecycle — not just an
 * in-module status flip. The employees and lifecycle stores are page-local
 * (useState seeded from their module-level seed arrays), so the default
 * bridge appends the new records to those seed arrays: the next mount of
 * /employees or /lifecycle picks them up with no re-entry of data.
 *
 * A richer cross-module implementation can take over at any time by calling
 * registerHireBridge() from the employees/lifecycle side (a one-liner);
 * recruitment's call site — hireFromOffer() — stays unchanged.
 */
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  COMPANIES,
  seedEmployees,
  type Employee,
  type Gender,
  type Jurisdiction,
} from '@/features/employees/data/employees'
import {
  STANDARD_DOCS,
  STANDARD_ASSETS,
  seedOnboarding,
  type OnboardingCase,
} from '@/features/lifecycle/data/onboarding'

/** Offer data handed off on conversion — no re-entry in onboarding. */
export interface HirePayload {
  offerId: string
  applicationId: string
  requisitionId: string
  candidateName: string
  email: string
  phone?: string
  gender?: 'Male' | 'Female' | 'Other'
  /** Position title from the requisition the offer was raised against. */
  position: string
  department: string
  /** Recruitment work location (e.g. 'Bengaluru'). */
  location: string
  employeeClass?: string
  positionLevel?: string
  hiringManager?: string
  annualCtc: number
  breakup: { name: string; type: string; amount: number }[]
  /** Expected date of joining from the offer. */
  joinDate: string
  /** true = Employee (User) with a provisioned login. */
  hasUserAccount: boolean
}

export interface HireResult {
  employeeId: string
  employeeCode: string
  onboardingCaseId: string
}

export type HireBridge = (payload: HirePayload) => HireResult

let bridge: HireBridge | null = null

/** Lets the employees/lifecycle side supply the real cross-module hire. */
export function registerHireBridge(fn: HireBridge) {
  bridge = fn
}

/** Recruitment work location → employees-module location / jurisdiction. */
const LOCATION_MAP: Record<string, { location: string; jurisdiction: Jurisdiction }> = {
  Bengaluru: { location: 'Bengaluru HQ', jurisdiction: 'India — Karnataka' },
  Hyderabad: { location: 'Hyderabad Hub', jurisdiction: 'India — Telangana' },
  Pune: { location: 'Pune Plant', jurisdiction: 'India — Maharashtra' },
  Mumbai: { location: 'Mumbai Office', jurisdiction: 'India — Maharashtra' },
}

/** Recruitment employee class → employees-module class vocabulary. */
const CLASS_MAP: Record<string, Employee['employeeClass']> = {
  'Full-time': 'Permanent',
  'Part-time': 'Contract',
  Contract: 'Contract',
  Intern: 'Trainee',
}

const nextNumericId = (ids: string[]) =>
  ids.reduce((max, id) => Math.max(max, Number(id.replace(/\D/g, '')) || 0), 0) + 1

/**
 * Default bridge — creates the employee record and the onboarding case by
 * appending to the seed arrays both target modules hydrate from on mount.
 */
function defaultBridge(p: HirePayload): HireResult {
  const n = nextNumericId(seedEmployees.map((e) => e.id))
  const employeeId = `e-${n}`
  const employeeCode = `AUR-${String(n).padStart(4, '0')}`
  const company = COMPANIES[0]
  const geo = LOCATION_MAP[p.location] ?? {
    location: p.location,
    jurisdiction: 'India — Karnataka' as Jurisdiction,
  }

  const employee: Employee = {
    id: employeeId,
    code: employeeCode,
    name: p.candidateName,
    email: p.email,
    gender: (p.gender ?? 'Other') as Gender,
    socialMediaLinkedIn: '',
    socialMediaTwitter: '',
    companyId: company.id,
    jurisdiction: geo.jurisdiction,
    departments: [p.department],
    position: p.position,
    functionalLocation: geo.location,
    positionLevel: p.positionLevel ?? 'L1 — Associate',
    roles: p.hasUserAccount ? ['Employee (User)'] : ['Employee (Non-User)'],
    groups: [],
    locations: [geo.location],
    employeeClass: CLASS_MAP[p.employeeClass ?? ''] ?? 'Probationer',
    attendanceTracked: true,
    abscondingAlertsEnabled: true,
    supervisorApprovalRequired: false,
    suspension: null,
    roleTransferNote: null,
    primaryManager: p.hiringManager ?? 'Vikram Shetty',
    dottedLineManagers: [],
    managerEffectiveDate: p.joinDate,
    hasUserAccount: p.hasUserAccount,
    lifecycleStage: 'Onboarding',
    joinDate: p.joinDate,
    aadhar: '',
    pan: '',
    passport: '',
    uan: '',
    esicNumber: '',
    esiPfEligibility: 'Pending evaluation',
    ptRegistered: false,
    lwfApplicable: false,
    maternityEligibility: 'Pending evaluation',
    gratuityEligibility: 'Pending evaluation',
    evaluatedRulePack: 'Pending first evaluation',
    leaveBalances: [
      { type: 'Earned Leave', balance: 0, statutoryEntitlement: 18 },
      { type: 'Casual Leave', balance: 0, statutoryEntitlement: 12 },
      { type: 'Sick Leave', balance: 0, statutoryEntitlement: 12 },
    ],
    dependants: [],
    lifeEvents: [],
    lifecycleEvents: [
      {
        id: `lc-${employeeId}-1`,
        type: 'Onboarding',
        date: p.joinDate,
        note: `Hired via offer ${p.offerId} (requisition ${p.requisitionId}) at CTC ₹${p.annualCtc.toLocaleString('en-IN')} — compensation breakup carried over from the offer`,
      },
    ],
  }
  seedEmployees.push(employee)

  const onbN = nextNumericId(seedOnboarding.map((c) => c.id))
  const onboardingCaseId = `onb-${onbN}`
  const onboardingCase: OnboardingCase = {
    id: onboardingCaseId,
    employeeName: p.candidateName,
    employeeCode,
    department: p.department,
    location: p.location,
    company: company.name,
    portalUser: p.hasUserAccount,
    startDate: p.joinDate,
    templateVersion: 'v2',
    // Offer already accepted in recruitment — case starts at documents.
    currentStage: 'Document Submission',
    status: 'in-progress',
    offerAccepted: true,
    documents: STANDARD_DOCS.map(([name, required], i) => ({
      id: `d${i + 1}`,
      name,
      required,
      status: name === 'Signed offer letter' ? ('submitted' as const) : ('missing' as const),
    })),
    assets: STANDARD_ASSETS.map((name, i) => ({
      id: `a${i + 1}`,
      name,
      assigned: false,
    })),
    inductionComplete: false,
  }
  seedOnboarding.push(onboardingCase)

  return { employeeId, employeeCode, onboardingCaseId }
}

/**
 * Conversion entry point used by the offers store: creates the employee +
 * onboarding case via the registered bridge (or the seed-array default).
 */
export function hireFromOffer(payload: HirePayload): HireResult {
  const result = (bridge ?? defaultBridge)(payload)
  // Mirror the conversion into the central platform trail (worklist #26).
  publishAuditEvent({
    module: 'Recruitment',
    action: 'Offer converted to employee',
    actor: 'You',
    actorRole: 'HR Manager',
    actionType: 'create',
    recordId: result.employeeCode,
    recordName: payload.candidateName,
    changes: [
      { field: 'Offer', previousValue: payload.offerId, newValue: 'Hired' },
      {
        field: 'Onboarding case',
        previousValue: null,
        newValue: result.onboardingCaseId,
      },
    ],
  })
  return result
}
