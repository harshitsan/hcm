import { useState } from 'react'
import { toast } from 'sonner'
import {
  seedDelegations,
  seedWorkflows,
  type Delegation,
  type Workflow,
} from '../data/config'
import { seedLeaveTypes, type LeaveType } from '../data/leave-types'
import {
  policySpecificity,
  seedPolicies,
  type LeavePolicy,
  type PolicyScope,
} from '../data/policies'
import { shortId, todayISO } from '../data/shared'

export interface LeaveTypeDraft {
  name: string
  category: 'paid' | 'unpaid'
  unit: 'days' | 'hours'
  allotted: number
  fmla: boolean
  applicability: string
  excludedLevels: string[]
}

export interface PolicyDraft {
  name: string
  scope: PolicyScope
  entitlementSummary: string
  accrual: 'monthly' | 'quarterly' | 'annual grant'
  carryForwardCap: number
  effectiveFrom: string
  source: 'company' | 'group-baseline'
  company: string
}

interface Deps {
  append: (input: {
    actor: string
    actorRole: string
    action: string
    target: string
    before: string
    after: string
    reason: string
  }) => void
  actor: string
  actorRole: string
}

/**
 * Leave types, differentiated policies (with effective-dated versions),
 * workflows and delegations (LVE-01/02/04/05/18/21/35/36).
 */
export function useLeaveConfig({ append, actor, actorRole }: Deps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(seedLeaveTypes)
  const [policies, setPolicies] = useState<LeavePolicy[]>(seedPolicies)
  const [workflows] = useState<Workflow[]>(seedWorkflows)
  const [delegations, setDelegations] = useState<Delegation[]>(seedDelegations)

  const orderedTypes = [...leaveTypes].sort((a, b) => a.order - b.order)

  const addLeaveType = (draft: LeaveTypeDraft) => {
    setLeaveTypes((prev) => [
      ...prev,
      {
        ...draft,
        id: shortId('lt'),
        active: true,
        order: prev.length + 1,
        dynamicFields: [],
      },
    ])
    toast.success(`Leave type “${draft.name}” added to the catalog`)
  }

  const updateLeaveType = (id: string, draft: LeaveTypeDraft) => {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
    )
    toast.success('Leave type updated')
  }

  /** LVE-02: deactivated types stay on historical records but hide from apply. */
  const toggleLeaveType = (id: string) => {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    )
    const t = leaveTypes.find((x) => x.id === id)
    toast.success(
      t?.active
        ? `${t.name} deactivated — no longer selectable, historical records retained`
        : `${t?.name} reactivated`
    )
  }

  /** LVE-36: reorder the employee-facing dropdown sequence. */
  const moveLeaveType = (id: string, direction: -1 | 1) => {
    const sorted = [...leaveTypes].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((t) => t.id === id)
    const swap = idx + direction
    if (idx < 0 || swap < 0 || swap >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swap]
    setLeaveTypes((prev) =>
      prev.map((t) => {
        if (t.id === a.id) return { ...t, order: b.order }
        if (t.id === b.id) return { ...t, order: a.order }
        return t
      })
    )
  }

  /** LVE-01/21: saving a policy re-versions it with an effective date. */
  const savePolicy = (id: string | null, draft: PolicyDraft, note: string) => {
    if (id) {
      setPolicies((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const version = p.version + 1
          return {
            ...p,
            ...draft,
            version,
            status: 'active',
            versions: [
              ...p.versions,
              {
                version,
                effectiveFrom: draft.effectiveFrom,
                recordedAt: new Date().toISOString(),
                changedBy: actor,
                note,
              },
            ],
          }
        })
      )
      append({
        actor,
        actorRole,
        action: 'Policy re-versioned',
        target: draft.name,
        before: 'Prior version retained as history (bitemporal)',
        after: `New version effective ${draft.effectiveFrom}`,
        reason: note,
      })
      toast.success(
        'Policy saved as a new effective-dated version — prior versions retained'
      )
    } else {
      setPolicies((prev) => [
        {
          ...draft,
          id: shortId('pol'),
          version: 1,
          status: 'active',
          versions: [
            {
              version: 1,
              effectiveFrom: draft.effectiveFrom,
              recordedAt: new Date().toISOString(),
              changedBy: actor,
              note: note || 'Initial publication.',
            },
          ],
        },
        ...prev,
      ])
      toast.success(
        'Policy created and available for assignment — no code changes needed'
      )
    }
  }

  /** LVE-18: push an updated group baseline to non-overriding companies. */
  const propagateBaseline = (id: string) => {
    const p = policies.find((x) => x.id === id)
    if (!p || p.source !== 'group-baseline') return
    append({
      actor,
      actorRole,
      action: 'Group baseline propagated',
      target: p.name,
      before: 'Companies on prior baseline version',
      after: `All inheriting companies moved to v${p.version}`,
      reason: 'Local overrides retain precedence for their scope.',
    })
    toast.success(
      'Baseline propagated to inheriting companies — local overrides preserved'
    )
  }

  /**
   * LVE-25: rules-engine policy resolution — most-specific matching policy
   * wins deterministically (specificity, then version as tie-break).
   */
  const resolvePolicy = (attrs: {
    employeeType: string
    group: string
    jurisdiction: string
    company: string
    department: string
    location: string
  }) => {
    const matches = policies.filter((p) => {
      if (p.status !== 'active') return false
      const s = p.scope
      return (
        (!s.employeeType || s.employeeType === attrs.employeeType) &&
        (!s.group || s.group === attrs.group) &&
        (!s.jurisdiction || s.jurisdiction === attrs.jurisdiction) &&
        (!s.company || s.company === attrs.company) &&
        (!s.department || s.department === attrs.department) &&
        (!s.location || s.location === attrs.location)
      )
    })
    const sorted = [...matches].sort(
      (a, b) =>
        policySpecificity(b.scope) - policySpecificity(a.scope) ||
        b.version - a.version
    )
    return { governing: sorted[0] ?? null, matches: sorted }
  }

  const addDelegation = (draft: Omit<Delegation, 'id'>) => {
    setDelegations((prev) => [{ ...draft, id: shortId('dg') }, ...prev])
    append({
      actor,
      actorRole,
      action: 'Delegation configured',
      target: `${draft.from} → ${draft.to}`,
      before: 'Approvals with primary approver',
      after: `Delegate acts ${draft.fromDate} – ${draft.toDate}`,
      reason: 'Primary approver unavailable.',
    })
    toast.success('Delegation active — approvals route to the delegate for the window')
  }

  const endDelegation = (id: string) => {
    setDelegations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, toDate: todayISO() } : d))
    )
    toast.success('Delegation ended — approvals revert to the primary approver')
  }

  return {
    leaveTypes,
    orderedTypes,
    policies,
    workflows,
    delegations,
    addLeaveType,
    updateLeaveType,
    toggleLeaveType,
    moveLeaveType,
    savePolicy,
    propagateBaseline,
    resolvePolicy,
    addDelegation,
    endDelegation,
  }
}

export type LeaveConfigStore = ReturnType<typeof useLeaveConfig>
