import { type GroupMembership, type OrgGroup } from '../data/groups'
import { childrenOf, effectiveInheritanceRule } from './hierarchy'

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** True when the membership row is effective on the given ISO date. */
export function isEffectiveOn(m: GroupMembership, asOf: string): boolean {
  if (m.effectiveFrom > asOf) return false
  if (m.effectiveTo && m.effectiveTo < asOf) return false
  return true
}

export function membershipsOf(
  memberships: GroupMembership[],
  groupId: string,
  asOf: string
): GroupMembership[] {
  return memberships.filter(
    (m) => m.groupId === groupId && isEffectiveOn(m, asOf)
  )
}

export function memberCountOf(
  memberships: GroupMembership[],
  groupId: string,
  asOf: string
): number {
  return membershipsOf(memberships, groupId, asOf).length
}

export interface ResolutionStep {
  groupId: string
  groupName: string
  level: number
  directCount: number
  rule: 'target' | 'inherit-downward' | 'no-inheritance'
}

export interface ResolutionResult {
  memberIds: string[]
  steps: ResolutionStep[]
}

/**
 * Rules-engine style expansion of a target group: includes the group's direct
 * members effective as of `asOf`, then traverses n-level descendants when the
 * governing inheritance rule allows, deduplicating members that appear in
 * several groups.
 */
export function resolveApplicability(
  groups: OrgGroup[],
  memberships: GroupMembership[],
  targetGroupId: string,
  asOf: string
): ResolutionResult {
  const memberIds = new Set<string>()
  const steps: ResolutionStep[] = []

  const visit = (groupId: string, level: number) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    const direct = membershipsOf(memberships, groupId, asOf)
    direct.forEach((m) => memberIds.add(m.memberId))
    const rule = effectiveInheritanceRule(groups, groupId)
    steps.push({
      groupId,
      groupName: group.name,
      level,
      directCount: direct.length,
      rule: level === 0 ? 'target' : rule,
    })
    if (rule === 'inherit-downward') {
      childrenOf(groups, groupId).forEach((child) => visit(child.id, level + 1))
    }
  }

  visit(targetGroupId, 0)
  return { memberIds: [...memberIds], steps }
}
