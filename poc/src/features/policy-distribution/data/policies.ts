/**
 * Policy catalogue for the distribution module. Each policy carries the
 * compliance controls the stories configure: acknowledgment type
 * (Required / Optional / Read-Only), criticality (drives escalation
 * routing) and an optional periodic renewal cycle.
 */

export const ACK_TYPES = ['Required', 'Optional', 'Read-Only'] as const
export type AckType = (typeof ACK_TYPES)[number]

export const CRITICALITIES = ['Critical', 'High', 'Standard'] as const
export type Criticality = (typeof CRITICALITIES)[number]

export const RENEWAL_CADENCES = ['Annually', 'Every 2 years', 'None'] as const
export type RenewalCadence = (typeof RENEWAL_CADENCES)[number]

/** Months in one renewal cycle, or null when the policy never renews. */
export function renewalCadenceMonths(cadence: RenewalCadence): number | null {
  if (cadence === 'Annually') return 12
  if (cadence === 'Every 2 years') return 24
  return null
}

export interface Policy {
  id: string
  title: string
  category: string
  /** Current published version, e.g. 'v3'. */
  version: string
  criticality: Criticality
  /** Default acknowledgment type suggested when distributing. */
  defaultAckType: AckType
  summary: string
  /** Full text shown in the employee review interface. */
  content: string
  lastUpdated: string
  /** How often acknowledgments must be renewed even without content changes. */
  renewalCadence: RenewalCadence
}

export const seedPolicies: Policy[] = [
  {
    id: 'pol-01',
    title: 'Code of Conduct',
    category: 'Ethics & Compliance',
    version: 'v3',
    criticality: 'Critical',
    defaultAckType: 'Required',
    summary: 'Group-wide standards of professional and ethical behaviour.',
    content:
      'All employees of Meridian Holdings group companies are expected to act with integrity, honesty and respect in every business interaction. This policy covers conflicts of interest, gifts and hospitality, fair dealing with customers and suppliers, and the duty to report misconduct through the confidential ethics line.\n\nViolations of this Code may result in disciplinary action up to and including termination. Managers carry an additional duty to model these standards and to respond promptly to concerns raised by their teams.',
    lastUpdated: '2026-05-28',
    renewalCadence: 'Annually',
  },
  {
    id: 'pol-02',
    title: 'Information Security Policy',
    category: 'IT & Security',
    version: 'v2',
    criticality: 'Critical',
    defaultAckType: 'Required',
    summary: 'Rules for handling company data, devices and credentials.',
    content:
      'Company information must be classified, stored and shared according to its sensitivity level. Multi-factor authentication is mandatory on all corporate accounts, and credentials must never be shared. Removable media is prohibited for Confidential and Restricted data.\n\nSuspected security incidents must be reported to the Security Operations Centre within one hour of discovery. Contractors and interns with system access are bound by the same obligations as permanent staff.',
    lastUpdated: '2026-06-14',
    renewalCadence: 'Annually',
  },
  {
    id: 'pol-03',
    title: 'Prevention of Sexual Harassment (POSH)',
    category: 'Workplace Conduct',
    version: 'v1',
    criticality: 'Critical',
    defaultAckType: 'Required',
    summary: 'Zero-tolerance policy and Internal Committee escalation route.',
    content:
      'The company maintains a zero-tolerance stance on sexual harassment as defined under the POSH Act, 2013. Every workplace and location has a constituted Internal Committee whose contact details are published on the intranet.\n\nComplaints may be raised directly with the Internal Committee and will be handled confidentially within statutory timelines. Retaliation against complainants or witnesses is itself a policy violation.',
    lastUpdated: '2026-04-02',
    renewalCadence: 'Annually',
  },
  {
    id: 'pol-04',
    title: 'Travel & Expense Policy',
    category: 'Finance',
    version: 'v4',
    criticality: 'Standard',
    defaultAckType: 'Optional',
    summary: 'Booking classes, per-diem limits and reimbursement timelines.',
    content:
      'Business travel must be booked through the approved travel desk. Economy class applies to flights under six hours; per-diem rates vary by city tier and are published in the finance portal.\n\nExpense claims must be submitted within 30 days of travel completion with itemised receipts. Claims outside policy require pre-approval from the cost-centre owner.',
    lastUpdated: '2026-03-19',
    renewalCadence: 'Every 2 years',
  },
  {
    id: 'pol-05',
    title: 'Holiday Calendar 2026',
    category: 'HR Operations',
    version: 'v1',
    criticality: 'Standard',
    defaultAckType: 'Read-Only',
    summary: 'Published list of company holidays per location for 2026.',
    content:
      'The attached calendar lists the mandatory and optional holidays for each work location in 2026. Optional holidays may be availed as per the leave policy — up to two per calendar year, applied through the leave module.\n\nPlant locations follow the state-notified factory holiday list where it differs from the corporate calendar.',
    lastUpdated: '2026-01-05',
    renewalCadence: 'None',
  },
  {
    id: 'pol-06',
    title: 'Data Privacy Policy',
    category: 'IT & Security',
    version: 'v2',
    criticality: 'High',
    defaultAckType: 'Required',
    summary: 'Handling of personal data under the DPDP Act and GDPR.',
    content:
      'Personal data of employees, customers and partners may only be collected for declared purposes and retained no longer than the published retention schedule. Cross-border transfers require a documented lawful basis.\n\nEvery employee who processes personal data must complete this acknowledgment and the annual privacy refresher. Data subject requests must be forwarded to the privacy office within 24 hours.',
    lastUpdated: '2026-06-01',
    renewalCadence: 'Annually',
  },
  {
    id: 'pol-07',
    title: 'Workplace Safety Handbook',
    category: 'Health & Safety',
    version: 'v5',
    criticality: 'High',
    defaultAckType: 'Required',
    summary: 'Mandatory safety procedures for plant and field staff.',
    content:
      'Personal protective equipment is mandatory in all marked zones. Lock-out/tag-out procedures must be followed before any machine maintenance, and near-misses must be logged in the safety register within the same shift.\n\nEvacuation drills run quarterly at every plant. Field staff must complete the defensive driving module before operating company vehicles.',
    lastUpdated: '2026-05-11',
    renewalCadence: 'Annually',
  },
  {
    id: 'pol-08',
    title: 'Remote Work Guidelines',
    category: 'HR Operations',
    version: 'v3',
    criticality: 'Standard',
    defaultAckType: 'Optional',
    summary: 'Eligibility, equipment and availability expectations for hybrid work.',
    content:
      'Eligible roles may work remotely up to three days per week with manager approval recorded in the HRMS. Core collaboration hours are 11:00–16:00 IST regardless of location.\n\nCompany equipment used at home remains subject to the Information Security Policy. Ergonomic self-assessments are recommended every six months.',
    lastUpdated: '2026-02-23',
    renewalCadence: 'Annually',
  },
]

/** Bump 'v3' → 'v4'; used when a content change forces re-acknowledgment. */
export function bumpVersion(version: string): string {
  const n = Number.parseInt(version.replace(/^v/i, ''), 10)
  return Number.isNaN(n) ? `${version}.1` : `v${n + 1}`
}
