/* eslint-disable react-refresh/only-export-components */
/**
 * Shared policy governance store (mock, session state).
 *
 * Two layers:
 *  1. INHERITANCE — a PARENT (Group/Portfolio/Platform) authors a policy as CLAUSES,
 *     enforces it across member companies, and may ALLOW children to rewrite clauses.
 *     A CHILD company overrides individual clauses; the parent sees every override.
 *  2. GOVERNANCE — every policy carries a LEVEL (Platform/Portfolio/Group/Company), a
 *     lifecycle STATUS gated by an APPROVAL chain (a policy can only be Enforced after
 *     it is Approved), and the platform admin sets a LEVEL PRECEDENCE that resolves
 *     conflicts: when two enforced policies of the same category overlap, the one at the
 *     higher-priority level is EFFECTIVE and the other is SHADOWED.
 *
 * Both the parent (Shared Policies) and child (Policies) screens read this store.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './store'
import { portfolios } from '../data/mock'

export type Clause = { id: string; text: string; mandatory: boolean }

export const POLICY_LEVELS = ['Platform', 'Portfolio', 'Group', 'Company'] as const
export type PolicyLevel = (typeof POLICY_LEVELS)[number]
export type PolicyStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Enforced' | 'Rejected'
export type ApprovalState = 'pending' | 'approved' | 'rejected'
export type ApprovalStep = { id: string; role: string; state: ApprovalState; actor?: string; at?: string; note?: string }

export type SharedPolicy = {
  id: string
  name: string
  category: string
  version: string
  owner: string                       // e.g. 'Kensium Group'
  ownerScope: PolicyLevel             // the policy's LEVEL — drives precedence
  appliesTo: string[]                 // companyIds
  status: PolicyStatus
  approval: ApprovalStep[]            // ordered chain; empty = auto-approve on submit
  enforced: boolean                   // derived mirror of (status === 'Enforced'); kept for child reads
  allowOverride: boolean              // children may rewrite clauses
  clauses: Clause[]
}
export type ResolvedClause = Clause & { overridden: boolean; original: string }
export type OverrideRow = { companyId: string; policyId: string; clauseId: string; original: string; text: string }
export type PolicyLogEntry = { id: string; companyId: string; policyId: string; clauseId: string; action: 'Customized' | 'Reverted'; at: string }
export type PolicyUsage = { companyId: string; overrides: number; customized: boolean }
export type Effective = { effective: boolean; shadowedBy: SharedPolicy | null }

const done = (role: string, actor: string): ApprovalStep => ({ id: `ap-${role}`, role, state: 'approved', actor, at: 'earlier' })

const SEED: SharedPolicy[] = [
  {
    id: 'sp-coc', name: 'Code of Conduct', category: 'Compliance', version: 'v3.0',
    owner: 'Kensium Group', ownerScope: 'Group', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'],
    status: 'Enforced', enforced: true, allowOverride: true,
    approval: [done('Legal', 'Anita Rao'), done('Platform Admin', 'Anita Rao')],
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
    status: 'Enforced', enforced: true, allowOverride: true,
    approval: [done('HR Council', 'OpsMaven'), done('Platform Admin', 'Anita Rao')],
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
    status: 'Enforced', enforced: true, allowOverride: false, // locked — children cannot edit
    approval: [done('Security Office', 'Anita Rao')],
    clauses: [
      { id: 'cl1', text: 'Enable multi-factor authentication on all company accounts.', mandatory: true },
      { id: 'cl2', text: 'Never share credentials or access tokens.', mandatory: true },
      { id: 'cl3', text: 'Report security incidents within 24 hours.', mandatory: true },
      { id: 'cl4', text: 'Encrypt all devices that store company data.', mandatory: true },
    ],
  },
  {
    // Platform-level security mandate — same category as Information Security and overlapping
    // companies, so at the default precedence (Platform > Group) it SHADOWS the group policy.
    id: 'sp-gdp', name: 'Global Data Protection Standard', category: 'Security', version: 'v2.0',
    owner: 'SatelliteHR', ownerScope: 'Platform', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
    status: 'Enforced', enforced: true, allowOverride: false,
    approval: [done('Legal', 'Anita Rao'), done('Security Office', 'Anita Rao'), done('Platform Admin', 'Anita Rao')],
    clauses: [
      { id: 'cl1', text: 'Personal data is processed only on a lawful basis and minimised by default.', mandatory: true },
      { id: 'cl2', text: 'Breaches affecting personal data are reported to the DPO within 72 hours.', mandatory: true },
      { id: 'cl3', text: 'Cross-border transfers require an approved transfer mechanism.', mandatory: true },
      { id: 'cl4', text: 'Data subject access requests are fulfilled within 30 days.', mandatory: true },
    ],
  },
  {
    // Mid-approval — demonstrates the gate: Approved by HR, awaiting Platform Admin, not yet enforceable.
    id: 'sp-remote', name: 'Remote Work Policy', category: 'HR', version: 'v1.0',
    owner: 'OpsMaven', ownerScope: 'Portfolio', appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'],
    status: 'Pending Approval', enforced: false, allowOverride: true,
    approval: [
      { id: 'ap-hr', role: 'HR Council', state: 'approved', actor: 'OpsMaven', at: 'yesterday' },
      { id: 'ap-pa', role: 'Platform Admin', state: 'pending' },
    ],
    clauses: [
      { id: 'cl1', text: 'Eligible roles may work remotely up to 3 days per week.', mandatory: false },
      { id: 'cl2', text: 'Core collaboration hours are 11:00–16:00 in the employee’s home time zone.', mandatory: true },
      { id: 'cl3', text: 'A safe, confidential home workspace is the employee’s responsibility.', mandatory: true },
    ],
  },
  {
    // Draft — shows the submit-for-approval entry point.
    id: 'sp-expense', name: 'Travel & Expense Policy', category: 'Finance', version: 'v0.1',
    owner: 'Kensium Pvt Ltd', ownerScope: 'Company', appliesTo: ['c1'],
    status: 'Draft', enforced: false, allowOverride: true,
    approval: [
      { id: 'ap-fin', role: 'Finance', state: 'pending' },
      { id: 'ap-pa', role: 'Platform Admin', state: 'pending' },
    ],
    clauses: [
      { id: 'cl1', text: 'Economy class for flights under 6 hours; business class above.', mandatory: false },
      { id: 'cl2', text: 'Submit expense claims within 30 days with itemised receipts.', mandatory: true },
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

const DEFAULT_PRIORITY: PolicyLevel[] = ['Platform', 'Portfolio', 'Group', 'Company']

export type NewPolicyInput = {
  name: string
  category: string
  ownerScope: PolicyLevel
  allowOverride: boolean
  clauses: Clause[]
  approval: ApprovalStep[]
}

type PoliciesState = {
  shared: SharedPolicy[]
  levelPriority: PolicyLevel[]
  setLevelPriority: (next: PolicyLevel[]) => void
  moveLevel: (level: PolicyLevel, dir: -1 | 1) => void
  addSharedPolicy: (p: NewPolicyInput) => void
  // governance lifecycle
  submitForApproval: (id: string, actor: string) => void
  decideApproval: (id: string, stepId: string, decision: 'approved' | 'rejected', actor: string, note?: string) => void
  enforcePolicy: (id: string) => void
  unenforce: (id: string) => void
  effectiveFor: (policy: SharedPolicy) => Effective
  // inheritance (unchanged)
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
const overlaps = (a: string[], b: string[]) => a.some((x) => b.includes(x))

export function PoliciesProvider({ children }: { children: ReactNode }) {
  const [allShared, setAllShared] = useState<SharedPolicy[]>(SEED)
  const [overrides, setOverrides] = useState<Record<string, string>>(SEED_OVERRIDES)
  const [log, setLog] = useState<PolicyLogEntry[]>(SEED_LOG)
  const [levelPriority, setLevelPriorityState] = useState<PolicyLevel[]>(DEFAULT_PRIORITY)
  const { authorizedCompanies, persona } = useApp()

  // Authorization scope: which company tenants this persona may see.
  const authorizedIds = useMemo(
    () => (persona && persona.companyIds.length > 0
      ? new Set(authorizedCompanies.map((c) => c.id))
      : null),
    [authorizedCompanies, persona],
  )

  // Derive the publishing owner/scope from the persona's own portfolio.
  const publishScope = useMemo(() => {
    const ids = authorizedCompanies.map((c) => c.id)
    const groupLabels = new Set(authorizedCompanies.map((c) => c.group).filter(Boolean) as string[])
    const portfolio = portfolios.find((pf) =>
      ids.length > 0 && pf.companyIds.length === ids.length && pf.companyIds.every((id) => ids.includes(id)),
    )
    if (groupLabels.size === 1) return { owner: [...groupLabels][0], appliesTo: ids }
    if (portfolio) return { owner: portfolio.name, appliesTo: ids }
    return { owner: 'SatelliteHR', appliesTo: ids.length ? ids : ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'] }
  }, [authorizedCompanies])

  // What the PARENT console renders: only policies that touch an authorized company.
  const shared = useMemo(
    () => (authorizedIds ? allShared.filter((p) => p.appliesTo.some((id) => authorizedIds.has(id))) : allShared),
    [allShared, authorizedIds],
  )

  const value = useMemo<PoliciesState>(() => {
    const prio = (lvl: PolicyLevel) => {
      const i = levelPriority.indexOf(lvl)
      return i === -1 ? 99 : i
    }
    const effectiveFor = (policy: SharedPolicy): Effective => {
      if (!policy.enforced) return { effective: false, shadowedBy: null }
      const shadow = allShared
        .filter((q) =>
          q.id !== policy.id && q.enforced && q.category === policy.category &&
          overlaps(q.appliesTo, policy.appliesTo) && prio(q.ownerScope) < prio(policy.ownerScope))
        .sort((a, b) => prio(a.ownerScope) - prio(b.ownerScope))[0] ?? null
      return { effective: !shadow, shadowedBy: shadow }
    }

    const setStatus = (id: string, status: PolicyStatus, mut?: (p: SharedPolicy) => SharedPolicy) =>
      setAllShared((list) => list.map((p) =>
        p.id !== id ? p : { ...(mut ? mut(p) : p), status, enforced: status === 'Enforced' }))

    return {
      shared,
      log,
      levelPriority,
      setLevelPriority: setLevelPriorityState,
      moveLevel: (level, dir) =>
        setLevelPriorityState((order) => {
          const i = order.indexOf(level)
          const j = i + dir
          if (i === -1 || j < 0 || j >= order.length) return order
          const next = [...order]
          ;[next[i], next[j]] = [next[j], next[i]]
          return next
        }),
      addSharedPolicy: (p) =>
        setAllShared((list) => [{
          name: p.name,
          category: p.category,
          ownerScope: p.ownerScope,
          owner: publishScope.owner,
          appliesTo: publishScope.appliesTo,
          allowOverride: p.allowOverride,
          clauses: p.clauses,
          approval: p.approval,
          status: 'Draft' as const,
          enforced: false,
          id: `sp-new-${list.length + 1}`,
          version: 'v0.1',
        }, ...list]),
      submitForApproval: (id) =>
        setAllShared((list) => list.map((p) => {
          if (p.id !== id) return p
          const reset = p.approval.map((s) => ({ ...s, state: 'pending' as ApprovalState, actor: undefined, at: undefined, note: undefined }))
          const status: PolicyStatus = reset.length === 0 ? 'Approved' : 'Pending Approval'
          return { ...p, approval: reset, status, enforced: false }
        })),
      decideApproval: (id, stepId, decision, actor, note) =>
        setAllShared((list) => list.map((p) => {
          if (p.id !== id) return p
          const approval = p.approval.map((s) => s.id === stepId ? { ...s, state: decision, actor, at: 'just now', note } : s)
          const anyRejected = approval.some((s) => s.state === 'rejected')
          const allApproved = approval.every((s) => s.state === 'approved')
          const status: PolicyStatus = anyRejected ? 'Rejected' : allApproved ? 'Approved' : 'Pending Approval'
          return { ...p, approval, status, enforced: false }
        })),
      enforcePolicy: (id) =>
        setAllShared((list) => list.map((p) =>
          p.id === id && p.status === 'Approved' ? { ...p, status: 'Enforced', enforced: true } : p)),
      unenforce: (id) => setStatus(id, 'Approved'),
      effectiveFor,

      policiesForCompany: (companyId) => allShared.filter((p) => p.enforced && p.appliesTo.includes(companyId)),
      resolveClauses: (companyId, policy) =>
        policy.clauses.map((cl) => {
          const o = overrides[k(companyId, policy.id, cl.id)]
          return { ...cl, original: cl.text, text: o ?? cl.text, overridden: o != null }
        }),
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
      snapshotCount: new Set(Object.keys(overrides).map((key) => key.split('|').slice(0, 2).join('|'))).size,
      totalOverrides: Object.keys(overrides).length,
    }
  }, [shared, allShared, overrides, log, publishScope, levelPriority])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePolicies() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePolicies must be used within PoliciesProvider')
  return ctx
}
