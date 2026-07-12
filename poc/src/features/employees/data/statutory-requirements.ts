/**
 * Per-jurisdiction statutory field requirements (W1) — derived read-only from
 * the platform jurisdictions catalog (src/features/jurisdictions). Each
 * jurisdiction entry carries a statutory profile; this helper maps the
 * profile onto the employee statutory capture fields so the record screens
 * can show "Required in India — Karnataka" / "Not applicable in this
 * jurisdiction" hints. Display/reference only — no computation.
 */
import {
  seedJurisdictions,
  type Jurisdiction as CatalogJurisdiction,
  type StatutoryItem,
} from '@/features/jurisdictions/data/jurisdictions'

export type StatutoryFieldKey =
  | 'uan'
  | 'esicNumber'
  | 'pfEligible'
  | 'esiEligible'
  | 'ptRegistration'
  | 'lwfApplicable'
  | 'maternityEligible'
  | 'gratuityEligible'

/** Plain-language labels for the statutory capture fields. */
export const STATUTORY_FIELD_LABELS: Record<StatutoryFieldKey, string> = {
  uan: 'UAN (Provident Fund account number)',
  esicNumber: 'ESIC number (state insurance)',
  pfEligible: 'Provident Fund eligibility',
  esiEligible: 'Employee State Insurance eligibility',
  ptRegistration: 'Professional Tax registration',
  lwfApplicable: 'Labour Welfare Fund applicability',
  maternityEligible: 'Maternity benefit eligibility',
  gratuityEligible: 'Gratuity eligibility',
}

export interface StatutoryFieldHint {
  /** Whether the jurisdiction's statutory profile calls for this field. */
  required: boolean
  /** Plain hint, e.g. "Required in India — Karnataka". */
  hint: string
}

/** Employees-module jurisdiction display labels → catalog entry ids. */
export const JURISDICTION_LABEL_TO_ID: Record<string, string> = {
  'India — Karnataka': 'jur-08',
  'India — Maharashtra': 'jur-09',
  'India — Telangana': 'jur-16',
}

/** Catalog entry for a jurisdictionId (read-only lookup). */
export function findCatalogJurisdiction(
  jurisdictionId?: string
): CatalogJurisdiction | undefined {
  if (!jurisdictionId) return undefined
  return seedJurisdictions.find((j) => j.id === jurisdictionId)
}

/** Display label, e.g. "India — Karnataka", for a catalog entry. */
function jurisdictionLabel(j: CatalogJurisdiction): string {
  return j.region && !j.name.includes(j.region)
    ? `${j.region} — ${j.name}`
    : j.name
}

function findItem(
  items: StatutoryItem[],
  keyword: string
): StatutoryItem | undefined {
  return items.find((i) =>
    i.name.toLowerCase().includes(keyword.toLowerCase())
  )
}

const NOT_LINKED: StatutoryFieldHint = {
  required: false,
  hint: 'No jurisdiction linked — requirements not evaluated',
}

/**
 * Which statutory fields are required for a jurisdiction, derived from the
 * catalog's statutory profile: state-level items (Professional Tax, Labour
 * Welfare Fund) come straight off the profile; central Indian statutes
 * (PF/UAN, ESI, maternity, gratuity) apply to Indian jurisdictions.
 */
export function getStatutoryFieldHints(
  jurisdictionId?: string
): Record<StatutoryFieldKey, StatutoryFieldHint> {
  const jurisdiction = findCatalogJurisdiction(jurisdictionId)
  if (!jurisdiction) {
    return {
      uan: NOT_LINKED,
      esicNumber: NOT_LINKED,
      pfEligible: NOT_LINKED,
      esiEligible: NOT_LINKED,
      ptRegistration: NOT_LINKED,
      lwfApplicable: NOT_LINKED,
      maternityEligible: NOT_LINKED,
      gratuityEligible: NOT_LINKED,
    }
  }

  const label = jurisdictionLabel(jurisdiction)
  const isIndia =
    jurisdiction.region?.includes('India') === true ||
    jurisdiction.code.startsWith('IN')
  const items = jurisdiction.statutoryProfile?.items ?? []

  const central: StatutoryFieldHint = isIndia
    ? { required: true, hint: `Required in ${label} (central labour statute)` }
    : { required: false, hint: 'Not applicable in this jurisdiction' }

  const profileItem = (keyword: string): StatutoryFieldHint => {
    const item = findItem(items, keyword)
    if (!item || item.applicability === 'Not applicable') {
      return { required: false, hint: 'Not applicable in this jurisdiction' }
    }
    if (item.applicability === 'Configured') {
      return {
        required: false,
        hint: `Configured in ${label} — ${item.note}`,
      }
    }
    return { required: true, hint: `Required in ${label} — ${item.note}` }
  }

  return {
    uan: central,
    esicNumber: central,
    pfEligible: central,
    esiEligible: central,
    ptRegistration: profileItem('Professional Tax'),
    lwfApplicable: profileItem('Labour Welfare Fund'),
    maternityEligible: central,
    gratuityEligible: central,
  }
}
