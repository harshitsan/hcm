/* eslint-disable react-refresh/only-export-components */
/**
 * Shared policy inheritance store (mock, session state).
 * A PARENT (a Group, e.g. Kensium Group) authors a policy as a set of CLAUSES,
 * enforces it across member companies, and may ALLOW children to rewrite clauses.
 * A CHILD company overrides individual clauses; the parent sees every override.
 * Both the parent (Shared Policies) and child (Policies) screens read this store,
 * so a child's edit is visible to the parent immediately.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './store'
import { portfolios } from '../data/mock'

export type Clause = { id: string; text: string; mandatory: boolean }
export type SharedPolicy = {
  id: string
  name: string
  category: string
  version: string
  owner: string                       // e.g. 'Kensium Group'
  ownerScope: 'Group' | 'Portfolio' | 'Platform'
  appliesTo: string[]                 // companyIds
  enforced: boolean                   // children must adopt
  allowOverride: boolean              // children may rewrite clauses
  clauses: Clause[]
}
export type ResolvedClause = Clause & { overridden: boolean; original: string }
export type OverrideRow = { companyId: string; policyId: string; clauseId: string; original: string; text: string }
// A child override is a SNAPSHOT for that company only — the parent master is never mutated.
export type PolicyLogEntry = { id: string; companyId: string; policyId: string; clauseId: string; action: 'Customized' | 'Reverted'; at: string }
export type PolicyUsage = { companyId: string; overrides: number; customized: boolean }

const SEED: SharedPolicy[] = [
  {
    id: 'sp-coc', name: 'Code of Conduct', category: 'Compliance', version: 'v3.0',
    owner: 'Kensium Group', ownerScope: 'Group', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'],
    enforced: true, allowOverride: true,
    clauses: [
      { id: 'cl1', text: 'Treat every colleague with respect and professionalism.', mandatory: true },
      { id: 'cl2', text: 'Harassment, discrimination, or retaliation of any kind is prohibited.', mandatory: true },
      { id: 'cl3', text: 'Standard working hours are 09:00–18:00, Monday to Friday.', mandatory: false },
      { id: 'cl4', text: 'Disclose any conflict of interest to HR promptly.', mandatory: true },
      { id: 'cl5', text: 'Protect confidential and customer information at all times.', mandatory: true },
      { id: 'cl6', text: 'Company assets are for business use; reasonable personal use is allowed.', mandatory: false },
    ],
  },
  {
    id: 'sp-leave', name: 'Leave Policy', category: 'HR', version: 'v2.1',
    owner: 'Kensium Group', ownerScope: 'Group', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'],
    enforced: true, allowOverride: true,
    clauses: [
      { id: 'cl1', text: 'Employees accrue 21 days of annual leave per year.', mandatory: false },
      { id: 'cl2', text: '12 days of combined casual and sick leave per year.', mandatory: false },
      { id: 'cl3', text: 'Apply for planned leave at least 3 working days in advance.', mandatory: true },
      { id: 'cl4', text: 'Unused annual leave carries over up to 10 days.', mandatory: false },
      { id: 'cl5', text: 'Manager approval is required for all leave.', mandatory: true },
    ],
  },
  {
    id: 'sp-infosec', name: 'Information Security', category: 'Security', version: 'v1.4',
    owner: 'Kensium Group', ownerScope: 'Group', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'],
    enforced: true, allowOverride: false, // locked — children cannot edit
    clauses: [
      { id: 'cl1', text: 'Enable multi-factor authentication on all company accounts.', mandatory: true },
      { id: 'cl2', text: 'Never share credentials or access tokens.', mandatory: true },
      { id: 'cl3', text: 'Report security incidents within 24 hours.', mandatory: true },
      { id: 'cl4', text: 'Encrypt all devices that store company data.', mandatory: true },
    ],
  },
]

// `${companyId}|${policyId}|${clauseId}` → override text (pre-seeded examples)
const SEED_OVERRIDES: Record<string, string> = {
  'c1|sp-coc|cl3': 'Standard working hours are 10:00–19:00 IST, Monday to Friday (Kensium Pvt Ltd).',
  'c3|sp-leave|cl1': 'Employees accrue 24 days of annual leave per year (Readywire).',
}
const SEED_LOG: PolicyLogEntry[] = [
  { id: 'pl1', companyId: 'c1', policyId: 'sp-coc', clauseId: 'cl3', action: 'Customized', at: '2 days ago' },
  { id: 'pl2', companyId: 'c3', policyId: 'sp-leave', clauseId: 'cl1', action: 'Customized', at: 'yesterday' },
]

type PoliciesState = {
  shared: SharedPolicy[]
  addSharedPolicy: (p: Omit<SharedPolicy, 'id' | 'version'>) => void
  policiesForCompany: (companyId: string) => SharedPolicy[]
  resolveClauses: (companyId: string, policy: SharedPolicy) => ResolvedClause[]
  overrideClause: (companyId: string, policyId: string, clauseId: string, text: string) => void
  resetClause: (companyId: string, policyId: string, clauseId: string) => void
  overridesForPolicy: (policyId: string) => OverrideRow[]
  usageForPolicy: (policyId: string) => PolicyUsage[]
  logForPolicy: (policyId: string) => PolicyLogEntry[]
  hasSnapshot: (companyId: string, policyId: string) => boolean
  log: PolicyLogEntry[]
  snapshotCount: number
  totalOverrides: number
}

const Ctx = createContext<PoliciesState | null>(null)
const k = (c: string, p: string, cl: string) => `${c}|${p}|${cl}`

export function PoliciesProvider({ children }: { children: ReactNode }) {
  // The raw master list. Selectors that are already keyed by a single companyId
  // (policiesForCompany / resolveClauses / override*) read this directly; the
  // PARENT console's `shared` list is scoped to the caller's portfolio below.
  const [allShared, setAllShared] = useState<SharedPolicy[]>(SEED)
  const [overrides, setOverrides] = useState<Record<string, string>>(SEED_OVERRIDES)
  const [log, setLog] = useState<PolicyLogEntry[]>(SEED_LOG)
  const { authorizedCompanies, persona } = useApp()

  // Authorization scope: which company tenants this persona may see. An empty
  // persona.companyIds means full access (provider/platform) → no filtering.
  const authorizedIds = useMemo(
    () => (persona && persona.companyIds.length > 0
      ? new Set(authorizedCompanies.map((c) => c.id))
      : null),
    [authorizedCompanies, persona],
  )

  // Derive the publishing owner/scope/appliesTo from the persona's own portfolio
  // instead of hard-coding Kensium Group / c1..c5 in the screen.
  const publishScope = useMemo(() => {
    const ids = authorizedCompanies.map((c) => c.id)
    const groupLabels = new Set(authorizedCompanies.map((c) => c.group).filter(Boolean) as string[])
    const portfolio = portfolios.find((pf) =>
      ids.length > 0 && pf.companyIds.length === ids.length && pf.companyIds.every((id) => ids.includes(id)),
    )
    if (groupLabels.size === 1) {
      return { owner: [...groupLabels][0], ownerScope: 'Group' as const, appliesTo: ids }
    }
    if (portfolio) {
      return { owner: portfolio.name, ownerScope: 'Portfolio' as const, appliesTo: ids }
    }
    return { owner: 'SatelliteHR', ownerScope: 'Platform' as const, appliesTo: ids }
  }, [authorizedCompanies])

  // What the PARENT console renders: only policies that touch an authorized company.
  const shared = useMemo(
    () => (authorizedIds ? allShared.filter((p) => p.appliesTo.some((id) => authorizedIds.has(id))) : allShared),
    [allShared, authorizedIds],
  )

  const value = useMemo<PoliciesState>(() => ({
    shared,
    log,
    // owner / appliesTo come from the publisher's portfolio, never the caller's literals.
    addSharedPolicy: (p) =>
      setAllShared((list) => [{
        ...p,
        owner: publishScope.owner,
        ownerScope: publishScope.ownerScope,
        appliesTo: publishScope.appliesTo,
        id: `sp-new-${list.length + 1}`,
        version: 'v1.0',
      }, ...list]),
    policiesForCompany: (companyId) => allShared.filter((p) => p.appliesTo.includes(companyId)),
    resolveClauses: (companyId, policy) =>
      policy.clauses.map((cl) => {
        const o = overrides[k(companyId, policy.id, cl.id)]
        return { ...cl, original: cl.text, text: o ?? cl.text, overridden: o != null }
      }),
    // Overriding writes ONLY to this company's snapshot; the parent master is untouched.
    overrideClause: (companyId, policyId, clauseId, text) => {
      setOverrides((o) => ({ ...o, [k(companyId, policyId, clauseId)]: text }))
      setLog((l) => [{ id: `pl${l.length + 1}`, companyId, policyId, clauseId, action: 'Customized', at: 'just now' }, ...l])
    },
    resetClause: (companyId, policyId, clauseId) => {
      setOverrides((o) => {
        const next = { ...o }
        delete next[k(companyId, policyId, clauseId)]
        return next
      })
      setLog((l) => [{ id: `pl${l.length + 1}`, companyId, policyId, clauseId, action: 'Reverted', at: 'just now' }, ...l])
    },
    overridesForPolicy: (policyId) =>
      Object.entries(overrides)
        .map(([key, text]) => {
          const [companyId, pid, clauseId] = key.split('|')
          if (pid !== policyId) return null
          const original = allShared.find((p) => p.id === pid)?.clauses.find((c) => c.id === clauseId)?.text ?? ''
          return { companyId, policyId: pid, clauseId, original, text }
        })
        .filter((r): r is OverrideRow => r !== null),
    // Per applies-to company: are they on the group master, or their own snapshot?
    usageForPolicy: (policyId) => {
      const policy = allShared.find((p) => p.id === policyId)
      if (!policy) return []
      return policy.appliesTo.map((companyId) => {
        const n = policy.clauses.filter((cl) => overrides[k(companyId, policyId, cl.id)] != null).length
        return { companyId, overrides: n, customized: n > 0 }
      })
    },
    logForPolicy: (policyId) => log.filter((e) => e.policyId === policyId),
    hasSnapshot: (companyId, policyId) => {
      const policy = allShared.find((p) => p.id === policyId)
      return !!policy && policy.clauses.some((cl) => overrides[k(companyId, policyId, cl.id)] != null)
    },
    // distinct (company, policy) pairs that have forked their own snapshot
    snapshotCount: new Set(Object.keys(overrides).map((key) => key.split('|').slice(0, 2).join('|'))).size,
    totalOverrides: Object.keys(overrides).length,
  }), [shared, allShared, overrides, log, publishScope])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePolicies() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePolicies must be used within PoliciesProvider')
  return ctx
}
