import { type AssetAction, type AssetState } from './assets'

/**
 * Governed, versioned, effective-dated tenant configuration for the asset
 * module (ASM-19, ASM-20, ASM-21, ASM-23, ASM-37, ASM-40, ASM-43). Every
 * save bumps the version and stamps a new effective date — no code deploys.
 */

export interface AssetCategoryConfig {
  id: string
  name: string
  code: string
  /** When true, a unique per-unit asset tag is mandatory (ASM-37). */
  maintainAssetIds: boolean
  approxLifeMonths: number
  active: boolean
}

export const seedCategories: AssetCategoryConfig[] = [
  { id: 'cat-01', name: 'IT Equipment', code: 'ITEQ', maintainAssetIds: true, approxLifeMonths: 48 },
  { id: 'cat-02', name: 'Mobile Devices', code: 'MOBD', maintainAssetIds: true, approxLifeMonths: 30 },
  { id: 'cat-03', name: 'Network Equipment', code: 'NETW', maintainAssetIds: true, approxLifeMonths: 72 },
  { id: 'cat-04', name: 'Peripherals', code: 'PERI', maintainAssetIds: true, approxLifeMonths: 48 },
  { id: 'cat-05', name: 'Furniture', code: 'FURN', maintainAssetIds: false, approxLifeMonths: 120 },
  { id: 'cat-06', name: 'Security & Access', code: 'SECA', maintainAssetIds: true, approxLifeMonths: 24 },
  { id: 'cat-07', name: 'Software Licenses', code: 'SOFT', maintainAssetIds: false, approxLifeMonths: 12 },
  { id: 'cat-08', name: 'Other Equipment', code: 'OTHR', maintainAssetIds: false, approxLifeMonths: 60 },
].map((c) => ({ ...c, active: true }))

export type QuestionType = 'text' | 'rating' | 'yesno'

export interface QuestionField {
  id: string
  label: string
  type: QuestionType
  required: boolean
}

export interface QuestionnaireVersion {
  version: number
  effectiveFrom: string
  fields: QuestionField[]
}

export const seedQuestionnaireVersions: QuestionnaireVersion[] = [
  {
    version: 1,
    effectiveFrom: '2025-01-01',
    fields: [
      { id: 'q-cond', label: 'Overall condition', type: 'rating', required: true },
      { id: 'q-damage', label: 'Any visible damage?', type: 'yesno', required: true },
      { id: 'q-notes', label: 'Notes', type: 'text', required: false },
    ],
  },
  {
    version: 2,
    effectiveFrom: '2026-04-01',
    fields: [
      { id: 'q-cond', label: 'Overall condition', type: 'rating', required: true },
      { id: 'q-damage', label: 'Any visible damage?', type: 'yesno', required: true },
      { id: 'q-acc', label: 'All accessories present?', type: 'yesno', required: true },
      { id: 'q-notes', label: 'Notes', type: 'text', required: false },
    ],
  },
]

export interface AckRules {
  version: number
  effectiveFrom: string
  receiptAckRequired: boolean
  returnAckRequired: boolean
  /** Default expected-return window for loans, in days (ASM-21). */
  expectedReturnDays: number
  /** Days past the expected return date after which an asset is overdue. */
  overdueAfterDays: number
  reminderEveryDays: number
}

export const seedAckRules: AckRules = {
  version: 3,
  effectiveFrom: '2026-02-01',
  receiptAckRequired: true,
  returnAckRequired: true,
  expectedReturnDays: 14,
  overdueAfterDays: 2,
  reminderEveryDays: 3,
}

export type RequestType = 'Requisition' | 'Arrival' | 'Outbound'

export interface ApprovalRoute {
  requestType: RequestType
  approvers: string[]
  version: number
  effectiveFrom: string
}

export const seedRouting: ApprovalRoute[] = [
  { requestType: 'Requisition', approvers: ['Priya Sharma'], version: 2, effectiveFrom: '2026-01-15' },
  { requestType: 'Arrival', approvers: ['Priya Sharma', 'Divya Menon'], version: 1, effectiveFrom: '2025-01-01' },
  { requestType: 'Outbound', approvers: ['Priya Sharma'], version: 1, effectiveFrom: '2025-01-01' },
]

/**
 * Lifecycle transition decision table evaluated by the mock rules engine
 * before every transaction (ASM-23). Transitions not listed are denied.
 */
export interface TransitionRule {
  id: string
  action: AssetAction
  from: AssetState[]
  to: AssetState
  description: string
}

export const TRANSITION_RULES: TransitionRule[] = [
  { id: 'R-ISSUE', action: 'issue', from: ['Available', 'Allocated'], to: 'Issued', description: 'Only issuable inventory may be issued to an employee' },
  { id: 'R-LOAN', action: 'loan', from: ['Available'], to: 'Loan', description: 'Temporary loans start from Available stock with an expected return date' },
  { id: 'R-TRANSFER', action: 'transfer', from: ['Issued', 'Allocated', 'Loan'], to: 'Issued', description: 'Held assets move between employees without a return/reissue cycle' },
  { id: 'R-RETURN', action: 'return', from: ['Issued', 'Loan', 'Allocated'], to: 'Returned', description: 'Held assets come back to stores for reassessment' },
  { id: 'R-RECOVER', action: 'recover', from: ['Issued', 'Loan', 'Allocated'], to: 'Returned', description: 'Outstanding assets are reclaimed during exit or overdue follow-up' },
  { id: 'R-AVAILABLE', action: 'mark-available', from: ['Returned'], to: 'Available', description: 'Serviceable returns re-enter issuable inventory' },
  { id: 'R-REPAIR', action: 'send-repair', from: ['Returned', 'Issued', 'Available', 'Loan'], to: 'In Repair', description: 'Unserviceable assets are excluded from issuable inventory' },
  { id: 'R-REPAIR-DONE', action: 'repair-complete', from: ['In Repair'], to: 'Available', description: 'Repaired assets return to issuable inventory' },
  { id: 'R-LOST', action: 'mark-lost', from: ['Issued', 'Loan', 'Allocated'], to: 'Lost', description: 'Assets unaccounted for while with an employee are flagged Lost and routed to disciplinary review / recovery' },
  { id: 'R-RETIRE', action: 'retire', from: ['Returned', 'In Repair', 'Available', 'Allocated', 'Lost'], to: 'Retired', description: 'End-of-life (or written-off lost) assets leave issuable inventory' },
  { id: 'R-DISPOSE', action: 'dispose', from: ['Retired'], to: 'Disposed', description: 'Only retired assets may be physically disposed' },
]

export function findRule(action: AssetAction, from: AssetState): TransitionRule | null {
  const rule = TRANSITION_RULES.find((r) => r.action === action)
  if (!rule) return null
  return rule.from.includes(from) ? rule : null
}

export function denialReason(action: AssetAction, from: AssetState): string {
  const rule = TRANSITION_RULES.find((r) => r.action === action)
  if (!rule) return `No decision-table rule defines "${action}"`
  return `Rules engine denied: "${rule.id}" only permits this from ${rule.from.join(', ')} — asset is ${from}`
}
