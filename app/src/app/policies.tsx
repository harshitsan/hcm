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

type PoliciesState = {
  shared: SharedPolicy[]
  addSharedPolicy: (p: Omit<SharedPolicy, 'id' | 'version'>) => void
  policiesForCompany: (companyId: string) => SharedPolicy[]
  resolveClauses: (companyId: string, policy: SharedPolicy) => ResolvedClause[]
  overrideClause: (companyId: string, policyId: string, clauseId: string, text: string) => void
  resetClause: (companyId: string, policyId: string, clauseId: string) => void
  overridesForPolicy: (policyId: string) => OverrideRow[]
  totalOverrides: number
}

const Ctx = createContext<PoliciesState | null>(null)
const k = (c: string, p: string, cl: string) => `${c}|${p}|${cl}`

export function PoliciesProvider({ children }: { children: ReactNode }) {
  const [shared, setShared] = useState<SharedPolicy[]>(SEED)
  const [overrides, setOverrides] = useState<Record<string, string>>(SEED_OVERRIDES)

  const value = useMemo<PoliciesState>(() => ({
    shared,
    addSharedPolicy: (p) =>
      setShared((list) => [{ ...p, id: `sp-new-${list.length + 1}`, version: 'v1.0' }, ...list]),
    policiesForCompany: (companyId) => shared.filter((p) => p.appliesTo.includes(companyId)),
    resolveClauses: (companyId, policy) =>
      policy.clauses.map((cl) => {
        const o = overrides[k(companyId, policy.id, cl.id)]
        return { ...cl, original: cl.text, text: o ?? cl.text, overridden: o != null }
      }),
    overrideClause: (companyId, policyId, clauseId, text) =>
      setOverrides((o) => ({ ...o, [k(companyId, policyId, clauseId)]: text })),
    resetClause: (companyId, policyId, clauseId) =>
      setOverrides((o) => {
        const next = { ...o }
        delete next[k(companyId, policyId, clauseId)]
        return next
      }),
    overridesForPolicy: (policyId) =>
      Object.entries(overrides)
        .map(([key, text]) => {
          const [companyId, pid, clauseId] = key.split('|')
          if (pid !== policyId) return null
          const original = shared.find((p) => p.id === pid)?.clauses.find((c) => c.id === clauseId)?.text ?? ''
          return { companyId, policyId: pid, clauseId, original, text }
        })
        .filter((r): r is OverrideRow => r !== null),
    totalOverrides: Object.keys(overrides).length,
  }), [shared, overrides])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePolicies() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePolicies must be used within PoliciesProvider')
  return ctx
}
