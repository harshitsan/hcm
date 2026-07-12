/**
 * Agreements (O10) — employment agreements, bonds and NDAs as trackable
 * records inside the Documents module (F12). Records are generated from the
 * Template Engine's agreement templates (F8) with merge-field gap checking,
 * optionally acknowledged by the employee (W11), and tracked for validity and
 * expiry: agreements inside their rule's notice window derive an
 * "Expiring soon" status and surface an expiry-notification timeline (F7).
 */
import {
  CONTRACT_AGREEMENT_TYPES,
  EMPLOYEES,
  SIGNATORIES,
  seedTemplates,
  todayIso,
  type ContractAgreementType,
  type LetterTemplate,
  type Signatory,
} from '@/features/hr-letters/data/hr-letters'
import {
  resolveMergeFields,
  type MergeResult,
} from '@/features/hr-letters/data/merge-engine'

export { CONTRACT_AGREEMENT_TYPES }
export type { ContractAgreementType }

/* ------------------------------ Expiry rules ------------------------------ */

export const EXPIRY_RULES = [
  'No expiry',
  'Notify 30 days before',
  'Notify 60 days before',
  'Notify 90 days before',
] as const
export type ExpiryRule = (typeof EXPIRY_RULES)[number]

/** Notice-window length for a rule; null means the agreement never expires. */
export function noticeDaysOf(rule: ExpiryRule): number | null {
  switch (rule) {
    case 'Notify 30 days before':
      return 30
    case 'Notify 60 days before':
      return 60
    case 'Notify 90 days before':
      return 90
    default:
      return null
  }
}

/* -------------------------------- Statuses -------------------------------- */

export const AGREEMENT_STATUSES = [
  'Draft',
  'Sent for acknowledgment',
  'Acknowledged',
  'Active',
  'Expiring soon',
  'Expired',
  'Terminated',
] as const
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number]

/* --------------------------------- Record --------------------------------- */

export interface AgreementHistoryEntry {
  on: string
  actor: string
  action: string
  detail: string
}

export interface AgreementAcknowledgment {
  /** Whether this agreement must be acknowledged by the employee (W11). */
  required: boolean
  acknowledgedOn?: string
  note?: string
}

/** Where the generated agreement file lives in Documents (F12). */
export interface AgreementDocumentRef {
  fileName: string
  storedIn: string
}

export interface Agreement {
  id: string
  employeeId: string
  employeeName: string
  type: ContractAgreementType
  /** Template Engine (F8) template this record was generated from. */
  templateId: string
  templateName: string
  signingAuthority: string
  /** Stored lifecycle status — expiry states are derived at read time. */
  status: AgreementStatus
  executedOn: string
  validFrom: string
  validUntil?: string
  expiryRule: ExpiryRule
  acknowledgment: AgreementAcknowledgment
  documentRef: AgreementDocumentRef
  /** Fully merged agreement text, rendered at generation time. */
  renderedBody: string
  /** Set when this agreement is a renewal of an earlier one. */
  renewalOf?: string
  /** Set on the original once a renewal has been created from it. */
  renewedAs?: string
  createdBy: string
  createdOn: string
  history: AgreementHistoryEntry[]
}

/* --------------------------- Derived expiry state --------------------------- */

export function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysFromToday(days: number): string {
  return addDaysIso(todayIso(), days)
}

/**
 * Effective status, derived at read time from the validity window. Terminated
 * and Draft records keep their stored state; everything else is checked
 * against today: past its valid-until date it reads "Expired", inside the
 * expiry rule's notice window it reads "Expiring soon".
 */
export function effectiveStatusOf(
  agreement: Agreement,
  today: string = todayIso()
): AgreementStatus {
  if (agreement.status === 'Terminated' || agreement.status === 'Draft') {
    return agreement.status
  }
  if (agreement.validUntil) {
    if (agreement.validUntil < today) return 'Expired'
    const notice = noticeDaysOf(agreement.expiryRule)
    if (notice !== null && agreement.validUntil <= addDaysIso(today, notice)) {
      return 'Expiring soon'
    }
  }
  return agreement.status
}

/* ------------------------ Expiry notifications (F7) ------------------------ */

export interface AgreementNotification {
  id: string
  label: string
  channel: string
  scheduledFor: string
  state: 'Scheduled' | 'Sent'
  detail: string
}

/**
 * Expiry-notification timeline for an agreement, mirroring what the
 * Notifications module (F7) schedules for it: one reminder when the notice
 * window opens and a final notice on the expiry date itself.
 */
export function notificationTimelineOf(
  agreement: Agreement,
  today: string = todayIso()
): AgreementNotification[] {
  const notice = noticeDaysOf(agreement.expiryRule)
  if (notice === null || !agreement.validUntil) return []
  if (agreement.status === 'Terminated' || agreement.status === 'Draft') {
    return []
  }
  const reminderOn = addDaysIso(agreement.validUntil, -notice)
  const reminder: AgreementNotification = {
    id: `${agreement.id}-reminder`,
    label: `Expiry reminder — ${notice} days before expiry`,
    channel: 'Email + in-app',
    scheduledFor: reminderOn,
    state: reminderOn <= today ? 'Sent' : 'Scheduled',
    detail:
      reminderOn <= today
        ? `Reminder sent via email + in-app — ${notice} days before expiry (Notifications)`
        : `Expiry reminder scheduled via Notifications — email + in-app, ${notice} days before expiry`,
  }
  const finalNotice: AgreementNotification = {
    id: `${agreement.id}-final`,
    label: 'Expiry notice — on the expiry date',
    channel: 'Email + in-app',
    scheduledFor: agreement.validUntil,
    state: agreement.validUntil <= today ? 'Sent' : 'Scheduled',
    detail:
      agreement.validUntil <= today
        ? 'Expiry notice sent via email + in-app — agreement reached its valid-until date'
        : 'Expiry notice scheduled via Notifications — email + in-app, on the expiry date',
  }
  return [reminder, finalNotice]
}

/* ---------------------------- Template rendering ---------------------------- */

/** Agreement templates from the Template Engine catalog (F8). */
export function agreementTemplates(): LetterTemplate[] {
  return seedTemplates.filter((t) =>
    (CONTRACT_AGREEMENT_TYPES as readonly string[]).includes(t.docType)
  )
}

export function templatesForType(type: ContractAgreementType): LetterTemplate[] {
  return seedTemplates.filter((t) => t.docType === type)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const fmtLong = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00`))

export interface AgreementDates {
  executedOn: string
  validFrom: string
  validUntil?: string
}

const AGREEMENT_TOKEN =
  /\{\{\s*agreement\.(executedOn|validFrom|validUntil)\s*\}\}/g

/**
 * Render an agreement template for one employee: agreement-level tokens
 * ({{agreement.validFrom}}, {{agreement.validUntil}}, {{agreement.executedOn}})
 * are filled from the validity dates, then every remaining token goes through
 * the Template Engine's merge-field resolver (F8) — generation stays blocked
 * while the gap list is non-empty, exactly like letters.
 */
export function renderAgreementBody(
  templateBody: string,
  employeeId: string,
  dates: AgreementDates
): MergeResult {
  const withDates = templateBody.replace(AGREEMENT_TOKEN, (_match, field) => {
    if (field === 'executedOn') return fmtLong(dates.executedOn)
    if (field === 'validFrom') return fmtLong(dates.validFrom)
    return dates.validUntil ? fmtLong(dates.validUntil) : 'no fixed end date'
  })
  return resolveMergeFields(withDates, employeeId)
}

/** Signatory matching a template's signing-authority label, for PDF output. */
export function signatoryFor(signingAuthority: string): Signatory {
  return (
    SIGNATORIES.find((s) => signingAuthority.includes(s.name)) ?? SIGNATORIES[0]
  )
}

/* --------------------------------- Seeds ---------------------------------- */

const fileNameFor = (id: string, type: ContractAgreementType) =>
  `${id.toUpperCase()}-${type.replace(/\s+/g, '-')}.pdf`

interface SeedInput {
  id: string
  employeeId: string
  type: ContractAgreementType
  templateId: string
  status: AgreementStatus
  executedOn: string
  validFrom: string
  validUntil?: string
  expiryRule: ExpiryRule
  acknowledgment: AgreementAcknowledgment
  renewalOf?: string
  renewedAs?: string
  createdBy: string
  history: AgreementHistoryEntry[]
}

function seedAgreement(input: SeedInput): Agreement {
  const template = seedTemplates.find((t) => t.id === input.templateId)
  const employee = EMPLOYEES.find((e) => e.id === input.employeeId)
  const { rendered } = renderAgreementBody(
    template?.body ?? '',
    input.employeeId,
    {
      executedOn: input.executedOn,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
    }
  )
  return {
    id: input.id,
    employeeId: input.employeeId,
    employeeName: employee?.name ?? 'Unknown employee',
    type: input.type,
    templateId: input.templateId,
    templateName: template?.name ?? input.type,
    signingAuthority: template?.signingAuthority ?? '',
    status: input.status,
    executedOn: input.executedOn,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    expiryRule: input.expiryRule,
    acknowledgment: input.acknowledgment,
    documentRef: {
      fileName: fileNameFor(input.id, input.type),
      storedIn: 'Documents — Contract category, employee record',
    },
    renderedBody: rendered,
    renewalOf: input.renewalOf,
    renewedAs: input.renewedAs,
    createdBy: input.createdBy,
    createdOn: input.executedOn,
    history: input.history,
  }
}

const h = (
  on: string,
  actor: string,
  action: string,
  detail: string
): AgreementHistoryEntry => ({ on, actor, action, detail })

const ADMIN = 'Lakshmi Rao (Company Admin)'

/**
 * ~10 seeded agreements across all four types and every lifecycle state,
 * including records inside their notice window ("Expiring soon"), an expired
 * bond with its renewal, and agreements awaiting acknowledgment.
 */
export const seedAgreements: Agreement[] = [
  // Active employment agreement for the signed-in employee (Ananya Iyer).
  seedAgreement({
    id: 'agr-2001',
    employeeId: 'emp-3',
    type: 'Employment agreement',
    templateId: 'tpl-agr-employment',
    status: 'Active',
    executedOn: '2026-02-02',
    validFrom: '2026-02-02',
    expiryRule: 'No expiry',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2026-02-04',
      note: 'Read and accepted in the portal.',
    },
    createdBy: ADMIN,
    history: [
      h('2026-02-02', ADMIN, 'Generated', 'Generated from Standard Employment Agreement (F8) — no merge gaps'),
      h('2026-02-02', ADMIN, 'Sent for acknowledgment', 'Delivered to the employee portal for acknowledgment'),
      h('2026-02-04', 'Ananya Iyer', 'Acknowledged', 'Employee acknowledged in the portal'),
      h('2026-02-04', 'System', 'Activated', 'Agreement moved to Active after acknowledgment'),
    ],
  }),
  // Service bond well inside its validity, 60-day notice rule.
  seedAgreement({
    id: 'agr-2002',
    employeeId: 'emp-1',
    type: 'Service bond',
    templateId: 'tpl-agr-bond',
    status: 'Active',
    executedOn: '2026-01-15',
    validFrom: '2026-01-15',
    validUntil: daysFromToday(240),
    expiryRule: 'Notify 60 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2026-01-17',
      note: 'Bond terms accepted.',
    },
    createdBy: ADMIN,
    history: [
      h('2026-01-15', ADMIN, 'Generated', 'Generated from Service Bond (F8) — no merge gaps'),
      h('2026-01-17', 'Arjun Mehta', 'Acknowledged', 'Employee acknowledged in the portal'),
      h('2026-01-17', 'System', 'Activated', 'Agreement moved to Active after acknowledgment'),
    ],
  }),
  // NDA inside its 30-day notice window — derives "Expiring soon".
  seedAgreement({
    id: 'agr-2003',
    employeeId: 'emp-2',
    type: 'Non-disclosure agreement',
    templateId: 'tpl-agr-nda',
    status: 'Active',
    executedOn: '2025-08-01',
    validFrom: '2025-08-01',
    validUntil: daysFromToday(18),
    expiryRule: 'Notify 30 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2025-08-03',
    },
    createdBy: ADMIN,
    history: [
      h('2025-08-01', ADMIN, 'Generated', 'Generated from Non-Disclosure Agreement (F8) — no merge gaps'),
      h('2025-08-03', 'Priya Sharma', 'Acknowledged', 'Employee acknowledged in the portal'),
      h('2025-08-03', 'System', 'Activated', 'Agreement moved to Active after acknowledgment'),
    ],
  }),
  // Non-compete inside its 90-day notice window — also "Expiring soon".
  seedAgreement({
    id: 'agr-2004',
    employeeId: 'emp-4',
    type: 'Non-compete agreement',
    templateId: 'tpl-agr-noncompete',
    status: 'Active',
    executedOn: '2025-10-10',
    validFrom: '2025-10-10',
    validUntil: daysFromToday(75),
    expiryRule: 'Notify 90 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2025-10-12',
    },
    createdBy: ADMIN,
    history: [
      h('2025-10-10', ADMIN, 'Generated', 'Generated from Non-Compete Agreement (F8) — no merge gaps'),
      h('2025-10-12', 'Rohan Verma', 'Acknowledged', 'Employee acknowledged in the portal'),
      h('2025-10-12', 'System', 'Activated', 'Agreement moved to Active after acknowledgment'),
    ],
  }),
  // NDA awaiting the signed-in employee's acknowledgment (W11).
  seedAgreement({
    id: 'agr-2005',
    employeeId: 'emp-3',
    type: 'Non-disclosure agreement',
    templateId: 'tpl-agr-nda',
    status: 'Sent for acknowledgment',
    executedOn: daysFromToday(-6),
    validFrom: daysFromToday(-6),
    validUntil: daysFromToday(720),
    expiryRule: 'Notify 30 days before',
    acknowledgment: { required: true },
    createdBy: ADMIN,
    history: [
      h(daysFromToday(-6), ADMIN, 'Generated', 'Generated from Non-Disclosure Agreement (F8) — no merge gaps'),
      h(daysFromToday(-6), ADMIN, 'Sent for acknowledgment', 'Delivered to the employee portal for acknowledgment'),
    ],
  }),
  // Expired service bond — renewed as agr-2011.
  seedAgreement({
    id: 'agr-2006',
    employeeId: 'emp-5',
    type: 'Service bond',
    templateId: 'tpl-agr-bond',
    status: 'Active',
    executedOn: '2024-07-01',
    validFrom: '2024-07-01',
    validUntil: daysFromToday(-24),
    expiryRule: 'Notify 30 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2024-07-02',
    },
    renewedAs: 'agr-2011',
    createdBy: ADMIN,
    history: [
      h('2024-07-01', ADMIN, 'Generated', 'Generated from Service Bond (F8) — no merge gaps'),
      h('2024-07-02', 'Kavitha Reddy', 'Acknowledged', 'Employee acknowledged in the portal'),
      h(daysFromToday(-10), ADMIN, 'Renewed', 'Renewal agr-2011 created with fresh validity and acknowledgment cycle'),
    ],
  }),
  // Terminated employment agreement (employee exited).
  seedAgreement({
    id: 'agr-2007',
    employeeId: 'emp-6',
    type: 'Employment agreement',
    templateId: 'tpl-agr-employment',
    status: 'Terminated',
    executedOn: '2025-03-01',
    validFrom: '2025-03-01',
    validUntil: '2027-02-28',
    expiryRule: 'Notify 60 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: '2025-03-03',
    },
    createdBy: ADMIN,
    history: [
      h('2025-03-01', ADMIN, 'Generated', 'Generated from Standard Employment Agreement (F8) — no merge gaps'),
      h('2025-03-03', 'Suresh Patil', 'Acknowledged', 'Physical copy signed and filed by HR'),
      h('2026-05-31', ADMIN, 'Terminated', 'Terminated early — employee moved to a fixed-term contract'),
    ],
  }),
  // Draft non-compete, not yet sent out.
  seedAgreement({
    id: 'agr-2008',
    employeeId: 'emp-7',
    type: 'Non-compete agreement',
    templateId: 'tpl-agr-noncompete',
    status: 'Draft',
    executedOn: daysFromToday(-2),
    validFrom: daysFromToday(-2),
    validUntil: daysFromToday(363),
    expiryRule: 'Notify 60 days before',
    acknowledgment: { required: true },
    createdBy: ADMIN,
    history: [
      h(daysFromToday(-2), ADMIN, 'Generated', 'Generated from Non-Compete Agreement (F8) — saved as draft'),
    ],
  }),
  // Recently acknowledged NDA.
  seedAgreement({
    id: 'agr-2009',
    employeeId: 'emp-9',
    type: 'Non-disclosure agreement',
    templateId: 'tpl-agr-nda',
    status: 'Acknowledged',
    executedOn: daysFromToday(-14),
    validFrom: daysFromToday(-14),
    validUntil: daysFromToday(351),
    expiryRule: 'Notify 30 days before',
    acknowledgment: {
      required: true,
      acknowledgedOn: daysFromToday(-12),
      note: 'Confidentiality terms accepted.',
    },
    createdBy: ADMIN,
    history: [
      h(daysFromToday(-14), ADMIN, 'Generated', 'Generated from Non-Disclosure Agreement (F8) — no merge gaps'),
      h(daysFromToday(-14), ADMIN, 'Sent for acknowledgment', 'Delivered to the employee portal for acknowledgment'),
      h(daysFromToday(-12), 'Fatima Khan', 'Acknowledged', 'Employee acknowledged in the portal'),
    ],
  }),
  // Employment agreement with no acknowledgment step (W11 is optional).
  seedAgreement({
    id: 'agr-2010',
    employeeId: 'emp-10',
    type: 'Employment agreement',
    templateId: 'tpl-agr-employment',
    status: 'Active',
    executedOn: '2026-04-15',
    validFrom: '2026-04-15',
    expiryRule: 'No expiry',
    acknowledgment: { required: false },
    createdBy: ADMIN,
    history: [
      h('2026-04-15', ADMIN, 'Generated', 'Generated from Standard Employment Agreement (F8) — no merge gaps'),
      h('2026-04-15', 'System', 'Activated', 'No acknowledgment required — agreement active on execution'),
    ],
  }),
  // Renewal of the expired bond — fresh validity, fresh acknowledgment cycle.
  seedAgreement({
    id: 'agr-2011',
    employeeId: 'emp-5',
    type: 'Service bond',
    templateId: 'tpl-agr-bond',
    status: 'Sent for acknowledgment',
    executedOn: daysFromToday(-10),
    validFrom: daysFromToday(-10),
    validUntil: daysFromToday(355),
    expiryRule: 'Notify 60 days before',
    acknowledgment: { required: true },
    renewalOf: 'agr-2006',
    createdBy: ADMIN,
    history: [
      h(daysFromToday(-10), ADMIN, 'Generated', 'Renewal of agr-2006 — regenerated from Service Bond (F8) with fresh validity'),
      h(daysFromToday(-10), ADMIN, 'Sent for acknowledgment', 'Delivered to the employee portal for a fresh acknowledgment cycle'),
    ],
  }),
]
