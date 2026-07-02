/**
 * Versioned, effective-dated jurisdiction rule-packs (FR 6.4.2 L2/L3).
 * The Rules engine reads the pack effective as of the evaluation date —
 * publishing a new version needs no code deployment (JUR-13, JUR-14).
 */

export const RULE_PACK_KINDS = ['Tax & Fee', 'Policy Applicability'] as const
export type RulePackKind = (typeof RULE_PACK_KINDS)[number]

export const RULE_PACK_STATUSES = ['published', 'superseded', 'draft'] as const
export type RulePackStatus = (typeof RULE_PACK_STATUSES)[number]

export interface JurisdictionRulePack {
  id: string
  /** Groups all versions of the same logical pack. */
  packKey: string
  jurisdictionId: string
  name: string
  kind: RulePackKind
  version: number
  status: RulePackStatus
  effectiveFrom: string
  ruleCount: number
  publishedBy: string
  publishedAt: string
  changeNote: string
}

export const seedRulePacks: JurisdictionRulePack[] = [
  {
    id: 'rp-01',
    packKey: 'in-tax',
    jurisdictionId: 'jur-01',
    name: 'India Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 2,
    status: 'superseded',
    effectiveFrom: '2024-04-01',
    ruleCount: 11,
    publishedBy: 'Asha Verma',
    publishedAt: '2024-03-22',
    changeNote: 'GST 12% → 18% per Finance Act 2024.',
  },
  {
    id: 'rp-02',
    packKey: 'in-tax',
    jurisdictionId: 'jur-01',
    name: 'India Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 3,
    status: 'published',
    effectiveFrom: '2025-04-01',
    ruleCount: 12,
    publishedBy: 'Rahul Menon',
    publishedAt: '2025-03-28',
    changeNote: 'Added LWF fee decision row.',
  },
  {
    id: 'rp-03',
    packKey: 'in-policy',
    jurisdictionId: 'jur-01',
    name: 'India Policy Applicability Pack',
    kind: 'Policy Applicability',
    version: 1,
    status: 'published',
    effectiveFrom: '2025-04-01',
    ruleCount: 6,
    publishedBy: 'Rahul Menon',
    publishedAt: '2025-03-28',
    changeNote: 'Initial decision table for leave & compliance policies.',
  },
  {
    id: 'rp-04',
    packKey: 'ka-tax',
    jurisdictionId: 'jur-08',
    name: 'Karnataka Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 2,
    status: 'published',
    effectiveFrom: '2025-04-01',
    ruleCount: 5,
    publishedBy: 'Rahul Menon',
    publishedAt: '2025-03-30',
    changeNote: 'PT slab revision + S&E fee row.',
  },
  {
    id: 'rp-05',
    packKey: 'us-tax',
    jurisdictionId: 'jur-02',
    name: 'US Federal Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 4,
    status: 'published',
    effectiveFrom: '2025-01-01',
    ruleCount: 9,
    publishedBy: 'Dana Whitfield',
    publishedAt: '2024-12-15',
    changeNote: 'FICA wage-base update for tax year 2025.',
  },
  {
    id: 'rp-06',
    packKey: 'ca-tax',
    jurisdictionId: 'jur-10',
    name: 'California Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 2,
    status: 'published',
    effectiveFrom: '2025-01-01',
    ruleCount: 7,
    publishedBy: 'Dana Whitfield',
    publishedAt: '2024-12-18',
    changeNote: 'SUI new-employer rate confirmed at 3.4%.',
  },
  {
    id: 'rp-07',
    packKey: 'gb-policy',
    jurisdictionId: 'jur-03',
    name: 'UK Policy Applicability Pack',
    kind: 'Policy Applicability',
    version: 3,
    status: 'published',
    effectiveFrom: '2025-04-06',
    ruleCount: 8,
    publishedBy: 'Asha Verma',
    publishedAt: '2025-03-20',
    changeNote: 'SSP threshold uplift for 2025/26.',
  },
  {
    id: 'rp-08',
    packKey: 'sg-tax',
    jurisdictionId: 'jur-04',
    name: 'Singapore Tax & Fee Pack',
    kind: 'Tax & Fee',
    version: 1,
    status: 'published',
    effectiveFrom: '2024-01-01',
    ruleCount: 6,
    publishedBy: 'Asha Verma',
    publishedAt: '2023-12-08',
    changeNote: 'Initial CPF + SDL decision table.',
  },
  {
    id: 'rp-09',
    packKey: 'gift-tax',
    jurisdictionId: 'jur-13',
    name: 'GIFT City SEZ Concession Pack',
    kind: 'Tax & Fee',
    version: 1,
    status: 'draft',
    effectiveFrom: '2026-04-01',
    ruleCount: 3,
    publishedBy: '—',
    publishedAt: '—',
    changeNote: 'Draft: SEZ concessional rates pending sign-off.',
  },
  {
    id: 'rp-10',
    packKey: 'de-policy',
    jurisdictionId: 'jur-05',
    name: 'Germany Policy Applicability Pack',
    kind: 'Policy Applicability',
    version: 2,
    status: 'published',
    effectiveFrom: '2025-01-01',
    ruleCount: 5,
    publishedBy: 'Rahul Menon',
    publishedAt: '2024-12-20',
    changeNote: 'Working-time directive rows updated.',
  },
]

/**
 * The version of a pack the engine reads as of a date: highest-version
 * non-draft entry of the packKey whose effectiveFrom ≤ asOf (deterministic).
 */
export function effectivePack(
  packs: JurisdictionRulePack[],
  packKey: string,
  asOf: string
): JurisdictionRulePack | undefined {
  return packs
    .filter(
      (p) => p.packKey === packKey && p.status !== 'draft' && p.effectiveFrom <= asOf
    )
    .sort((a, b) => b.version - a.version)[0]
}

/** All packs effective for a jurisdiction as of a date. */
export function effectivePacksFor(
  packs: JurisdictionRulePack[],
  jurisdictionId: string,
  asOf: string
): JurisdictionRulePack[] {
  const keys = [
    ...new Set(
      packs.filter((p) => p.jurisdictionId === jurisdictionId).map((p) => p.packKey)
    ),
  ]
  return keys
    .map((k) => effectivePack(packs, k, asOf))
    .filter((p): p is JurisdictionRulePack => p !== undefined)
}
