import {
  type GroupScope,
  type InheritanceRule,
  type OrgGroup,
} from '../data/groups'

/** Broader scopes rank lower — a parent must be at least as broad as its child. */
const SCOPE_RANK: Record<GroupScope, number> = {
  global: 0,
  'group-company': 1,
  company: 2,
}

export function childrenOf(groups: OrgGroup[], parentId: string | null) {
  return groups.filter((g) => g.parentId === parentId)
}

export function descendantIds(groups: OrgGroup[], id: string): string[] {
  const direct = groups.filter((g) => g.parentId === id).map((g) => g.id)
  return direct.flatMap((childId) => [
    childId,
    ...descendantIds(groups, childId),
  ])
}

export function ancestorIds(groups: OrgGroup[], id: string): string[] {
  const byId = new Map(groups.map((g) => [g.id, g]))
  const result: string[] = []
  let current = byId.get(id)?.parentId ?? null
  while (current) {
    result.push(current)
    current = byId.get(current)?.parentId ?? null
  }
  return result
}

/** True when setting `newParentId` as parent of `groupId` would create a cycle. */
export function wouldCreateCycle(
  groups: OrgGroup[],
  groupId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false
  if (newParentId === groupId) return true
  return descendantIds(groups, groupId).includes(newParentId)
}

/** A company group cannot parent a global group, etc. */
export function isScopeCompatible(
  parentScope: GroupScope,
  childScope: GroupScope
): boolean {
  return SCOPE_RANK[parentScope] <= SCOPE_RANK[childScope]
}

export function hierarchyPath(groups: OrgGroup[], id: string): string {
  const byId = new Map(groups.map((g) => [g.id, g]))
  const names: string[] = []
  let current: OrgGroup | undefined = byId.get(id)
  while (current) {
    names.unshift(current.name)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return names.join(' › ')
}

export function depthOf(groups: OrgGroup[], id: string): number {
  return ancestorIds(groups, id).length
}

/**
 * Effective inheritance rule: the group's own rule, else the nearest ancestor
 * with a rule (most specific wins), else the platform default.
 */
export function effectiveInheritanceRule(
  groups: OrgGroup[],
  id: string
): InheritanceRule {
  const byId = new Map(groups.map((g) => [g.id, g]))
  let current = byId.get(id)
  while (current) {
    if (current.inheritanceRule) return current.inheritanceRule
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return 'inherit-downward'
}
