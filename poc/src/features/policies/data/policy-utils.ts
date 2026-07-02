import { type Role } from '@/context/role-context'
import {
  GROUP_COMPANIES,
  COMPANIES,
  type Policy,
  type PolicyScope,
  type PolicyVersion,
} from './policies'
import { type Worker } from './workers'

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string | null): string {
  return iso ? dateFmt.format(new Date(iso)) : '—'
}

/** True when `date` falls inside the version's effective window (POL-24). */
export function versionCovers(v: PolicyVersion, date: string): boolean {
  if (date < v.effectiveFrom) return false
  if (v.effectiveTill && date > v.effectiveTill) return false
  return true
}

/** The published version in force on a given date, if any (POL-05, POL-14). */
export function versionInForceOn(
  policy: Policy,
  date: string
): PolicyVersion | null {
  return (
    policy.versions.find((v) => v.status === 'published' && versionCovers(v, date)) ??
    null
  )
}

export function currentVersion(policy: Policy): PolicyVersion | null {
  return versionInForceOn(policy, todayIso())
}

export type PolicyStatus = 'active' | 'scheduled' | 'draft' | 'expired' | 'retired'

/** Status is computed from effective dating — expiry needs no manual retirement. */
export function policyStatus(policy: Policy, date = todayIso()): PolicyStatus {
  if (policy.retired) return 'retired'
  if (versionInForceOn(policy, date)) return 'active'
  const published = policy.versions.filter((v) => v.status === 'published')
  if (published.some((v) => v.effectiveFrom > date)) return 'scheduled'
  if (published.length === 0) return 'draft'
  return 'expired'
}

/** Active/Inactive bucketing used by the list filter (POL-21). */
export function isActiveStatus(status: PolicyStatus): boolean {
  return status === 'active' || status === 'scheduled'
}

/** Two effective windows overlap when neither ends before the other begins. */
export function windowsOverlap(
  aFrom: string,
  aTill: string | null,
  bFrom: string,
  bTill: string | null
): boolean {
  const aEnd = aTill ?? '9999-12-31'
  const bEnd = bTill ?? '9999-12-31'
  return aFrom <= bEnd && bFrom <= aEnd
}

/** Companies a policy can reach, given its owner level and scope (POL-10/11). */
export function policyCompanies(policy: Policy): string[] {
  let base: string[]
  if (policy.ownerLevel === 'Company') base = [policy.ownerName]
  else if (policy.ownerLevel === 'Group')
    base = GROUP_COMPANIES[policy.ownerName] ?? []
  else base = [...COMPANIES]
  if (policy.scope.companies.length > 0)
    base = base.filter((c) => policy.scope.companies.includes(c))
  return base
}

/** The org slice each admin role governs in this POC (role-controlled scope). */
export function adminCompaniesFor(role: Role): string[] | 'all' {
  switch (role) {
    case 'Company Admin':
      return ['Acme Retail']
    case 'Group Company Admin':
      return GROUP_COMPANIES['Acme Group']
    case 'Portfolio Admin':
    case 'Platform Admin':
      return 'all'
    default:
      return []
  }
}

export function policyVisibleToRole(policy: Policy, role: Role): boolean {
  const companies = adminCompaniesFor(role)
  if (companies === 'all') return true
  return policyCompanies(policy).some((c) => companies.includes(c))
}

function label(values: string[], name: string): string | null {
  return values.length > 0 ? `${name}: ${values.join(', ')}` : null
}

/** Human-readable applicability summary shown in list rows (POL-30). */
export function scopeSummary(scope: PolicyScope): string {
  const parts = [
    label(scope.companies, 'Company'),
    label(scope.groups, 'Group'),
    label(scope.jurisdictions, 'Jurisdiction'),
    label(scope.locations, 'Location'),
    label(scope.departments, 'Department'),
    label(scope.employmentTypes, 'Employment'),
    label(scope.positionLevels, 'Levels'),
  ].filter((p): p is string => p !== null)
  const kind =
    scope.workerKinds === 'both'
      ? 'Employees & contractors'
      : scope.workerKinds === 'employees'
        ? 'Employees only'
        : 'Contractors only'
  return parts.length > 0 ? `${kind} · ${parts.join(' · ')}` : `${kind} · All entities`
}

export interface Evaluation {
  applies: boolean
  /** First failed rule, when the policy does not apply. */
  failReason: string | null
  /** Excluded-by-position-level is called out separately (POL-23). */
  excludedByLevel: boolean
  /** Higher = more specific scope; used for precedence (POL-17). */
  specificity: number
}

/** Deterministic scope match: every configured dimension must match (POL-02). */
export function evaluatePolicyForWorker(
  policy: Policy,
  worker: Worker,
  date: string
): Evaluation {
  const s = policy.scope
  const ownerWeight =
    policy.ownerLevel === 'Company' ? 30 : policy.ownerLevel === 'Group' ? 20 : 10
  const dims = [
    s.companies,
    s.groups,
    s.jurisdictions,
    s.locations,
    s.departments,
    s.employmentTypes,
    s.positionLevels,
  ]
  const specificity =
    ownerWeight +
    dims.filter((d) => d.length > 0).length +
    (s.workerKinds === 'both' ? 0 : 1) +
    (s.excludedPositionLevels.length > 0 ? 1 : 0)

  const fail = (reason: string, excludedByLevel = false): Evaluation => ({
    applies: false,
    failReason: reason,
    excludedByLevel,
    specificity,
  })

  if (policy.retired) return fail('Policy has been retired')
  if (!versionInForceOn(policy, date))
    return fail('No published version in force on this date')
  if (!policyCompanies(policy).includes(worker.company))
    return fail(`Not applicable to ${worker.company}`)
  if (s.groups.length > 0 && !s.groups.includes(worker.group))
    return fail(`Scoped to group(s): ${s.groups.join(', ')}`)
  if (s.jurisdictions.length > 0 && !s.jurisdictions.includes(worker.jurisdiction))
    return fail(`Scoped to jurisdiction(s): ${s.jurisdictions.join(', ')}`)
  if (s.locations.length > 0 && !s.locations.includes(worker.location))
    return fail(`Scoped to location(s): ${s.locations.join(', ')}`)
  if (s.departments.length > 0 && !s.departments.includes(worker.department))
    return fail(`Scoped to department(s): ${s.departments.join(', ')}`)
  if (s.employmentTypes.length > 0 && !s.employmentTypes.includes(worker.employmentType))
    return fail(`Scoped to employment type(s): ${s.employmentTypes.join(', ')}`)
  if (s.workerKinds === 'employees' && worker.workerKind !== 'Employee')
    return fail('Applies to employees only')
  if (s.workerKinds === 'contractors' && worker.workerKind !== 'Contractor')
    return fail('Applies to contractors only')
  if (s.positionLevels.length > 0 && !s.positionLevels.includes(worker.positionLevel))
    return fail(`Scoped to position level(s): ${s.positionLevels.join(', ')}`)
  if (s.excludedPositionLevels.includes(worker.positionLevel))
    return fail(`Position level ${worker.positionLevel} is excluded`, true)

  return { applies: true, failReason: null, excludedByLevel: false, specificity }
}

export type ResolutionOutcome = 'applies' | 'overridden' | 'excluded' | 'not-applicable'

export interface Resolution {
  policy: Policy
  evaluation: Evaluation
  outcome: ResolutionOutcome
  note: string
}

/**
 * Rules-engine style resolution (POL-17): within a category, the most specific
 * matching policy wins deterministically — company beats group beats portfolio.
 */
export function resolveWorkerPolicies(
  policies: Policy[],
  worker: Worker,
  date: string
): Resolution[] {
  const evaluated = policies.map((policy) => ({
    policy,
    evaluation: evaluatePolicyForWorker(policy, worker, date),
  }))

  const winners = new Map<string, string>()
  for (const e of evaluated) {
    if (!e.evaluation.applies) continue
    const key = e.policy.category
    const bestId = winners.get(key)
    if (!bestId) {
      winners.set(key, e.policy.id)
      continue
    }
    const best = evaluated.find((x) => x.policy.id === bestId)
    if (best && e.evaluation.specificity > best.evaluation.specificity)
      winners.set(key, e.policy.id)
  }

  return evaluated.map(({ policy, evaluation }): Resolution => {
    if (evaluation.applies) {
      const winnerId = winners.get(policy.category)
      if (winnerId !== policy.id) {
        const winner = policies.find((p) => p.id === winnerId)
        return {
          policy,
          evaluation,
          outcome: 'overridden',
          note: `Overridden by more specific "${winner?.name ?? 'policy'}" (${
            winner?.ownerLevel ?? ''
          }-level beats ${policy.ownerLevel}-level in ${policy.category})`,
        }
      }
      return { policy, evaluation, outcome: 'applies', note: 'In force for this worker' }
    }
    if (evaluation.excludedByLevel)
      return {
        policy,
        evaluation,
        outcome: 'excluded',
        note: evaluation.failReason ?? 'Excluded',
      }
    return {
      policy,
      evaluation,
      outcome: 'not-applicable',
      note: evaluation.failReason ?? 'Out of scope',
    }
  })
}
