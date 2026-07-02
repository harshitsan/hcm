import { type Role } from '@/context/role-context'
import { CURRENT_COMPANY_ID } from '../data/directory'
import {
  ACCESS_LABELS,
  COMPANY_FIELD_RESTRICTIONS,
  DIRECTORY_FIELD_KEYS,
  FIELD_LABELS,
  type DirectoryFieldKey,
  type FieldAccess,
} from '../data/directory-config'

/**
 * Shared privacy rules engine (DIR-21). Every surface — list, card, compact,
 * org chart, search results and exports — resolves field visibility through
 * evaluateField so restricted data is omitted consistently.
 */

export const ADMIN_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

export interface PrivacyConfig {
  platformRules: Record<DirectoryFieldKey, FieldAccess>
  /** Active company override (latest effective version) for the current company. */
  companyOverrides: Partial<Record<DirectoryFieldKey, FieldAccess>>
}

export interface FieldDecision {
  key: DirectoryFieldKey
  label: string
  visible: boolean
  rule: FieldAccess
  source: 'platform-default' | 'company-override' | 'per-company-restriction'
  reason: string
}

/**
 * Resolves one field for one viewer. When `recordCompanyId` is provided the
 * owning company's hard restrictions are honoured even in group/portfolio
 * results (DIR-15) and company overrides only apply to the company that set
 * them (DIR-19).
 */
export function evaluateField(
  key: DirectoryFieldKey,
  role: Role,
  config: PrivacyConfig,
  recordCompanyId?: string
): FieldDecision {
  const label = FIELD_LABELS[key]

  // 1. Per-company hard restriction on the record's own company (DIR-15).
  if (
    recordCompanyId &&
    COMPANY_FIELD_RESTRICTIONS[recordCompanyId]?.includes(key)
  ) {
    return {
      key,
      label,
      visible: false,
      rule: 'restricted',
      source: 'per-company-restriction',
      reason: `Owning company restricts "${label}" on its records — never exposed, even to group roles.`,
    }
  }

  // 2. Company override applies only to the current company's records (DIR-19).
  const overrideApplies =
    recordCompanyId === undefined || recordCompanyId === CURRENT_COMPANY_ID
  const override = overrideApplies ? config.companyOverrides[key] : undefined
  const rule = override ?? config.platformRules[key]
  const source = override ? 'company-override' : 'platform-default'
  const sourceLabel =
    source === 'company-override' ? 'Company override' : 'Platform default'

  // 3. Evaluate the resolved rule against the viewer's role (DIR-21).
  if (rule === 'restricted') {
    return {
      key,
      label,
      visible: false,
      rule,
      source,
      reason: `${sourceLabel} marks "${label}" sensitive — excluded from views, search and exports for every role.`,
    }
  }
  if (rule === 'admins-only') {
    const isAdmin = ADMIN_ROLES.includes(role)
    return {
      key,
      label,
      visible: isAdmin,
      rule,
      source,
      reason: isAdmin
        ? `${sourceLabel}: admins only — your role (${role}) is explicitly permitted.`
        : `${sourceLabel}: admins only — hidden for ${role}.`,
    }
  }
  return {
    key,
    label,
    visible: true,
    rule,
    source,
    reason: `${sourceLabel}: visible to everyone (${ACCESS_LABELS[rule]}).`,
  }
}

/** Field keys visible for a role at the column/schema level. */
export function visibleFieldKeys(
  role: Role,
  config: PrivacyConfig
): DirectoryFieldKey[] {
  return DIRECTORY_FIELD_KEYS.filter(
    (key) => evaluateField(key, role, config).visible
  )
}

/** Full decision trace for the rules-engine inspector (DIR-21). */
export function evaluateAll(
  role: Role,
  config: PrivacyConfig
): FieldDecision[] {
  return DIRECTORY_FIELD_KEYS.map((key) => evaluateField(key, role, config))
}
