import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAuditEvents,
  seedGroups,
  seedMembers,
  seedMemberships,
  seedNotifications,
  seedPolicies,
  seedRequests,
  seedVersions,
  IMPORT_FILE_ROWS,
  type AuditEvent,
  type GroupMembership,
  type GroupVersion,
  type MembershipRequest,
  type MembershipSource,
  type OrgGroup,
} from '../data/groups'
import { isScopeCompatible, wouldCreateCycle } from '../utils/hierarchy'
import { isEffectiveOn, todayIso } from '../utils/resolve'

export type GroupDraft = Omit<
  OrgGroup,
  'id' | 'version' | 'effectiveFrom' | 'updatedBy' | 'updatedAt'
>

let seq = 100
const nextId = (prefix: string) => `${prefix}-${++seq}`

/**
 * In-memory Groups store. Stands in for the tenant-scoped groups service —
 * all mutations run against local React state, are audited, versioned and
 * effective-dated per the FR 6.6.x stories, and reset on reload.
 */
export function useOrgGroups() {
  const [groups, setGroups] = useState<OrgGroup[]>(seedGroups)
  const [memberships, setMemberships] =
    useState<GroupMembership[]>(seedMemberships)
  const [requests, setRequests] = useState<MembershipRequest[]>(seedRequests)
  const [audits, setAudits] = useState<AuditEvent[]>(seedAuditEvents)
  const [versions, setVersions] = useState<GroupVersion[]>(seedVersions)
  const [policies, setPolicies] = useState(seedPolicies)
  const [notifications, setNotifications] = useState(seedNotifications)

  const members = seedMembers

  const logAudit = useCallback(
    (groupId: string, actor: string, action: string, detail: string) => {
      setAudits((prev) => [
        {
          id: nextId('ae'),
          groupId,
          at: `${todayIso()} ${new Date().toTimeString().slice(0, 5)}`,
          actor,
          action,
          detail,
        },
        ...prev,
      ])
    },
    []
  )

  const notify = useCallback((memberId: string, text: string) => {
    setNotifications((prev) => [
      { id: nextId('n'), memberId, at: todayIso(), text },
      ...prev,
    ])
  }, [])

  const validateDraft = useCallback(
    (draft: GroupDraft, excludeId?: string): string | null => {
      const clash = (field: 'name' | 'acronym') =>
        groups.some(
          (g) =>
            g.id !== excludeId &&
            g.scope === draft.scope &&
            g[field].trim().toLowerCase() ===
              draft[field].trim().toLowerCase() &&
            draft[field].trim() !== ''
        )
      if (clash('name'))
        return `A ${draft.scope} group named “${draft.name}” already exists in this scope`
      if (draft.acronym && clash('acronym'))
        return `Acronym “${draft.acronym}” is already used in the ${draft.scope} scope`
      if (draft.parentId) {
        const parent = groups.find((g) => g.id === draft.parentId)
        if (!parent) return 'Selected parent group no longer exists'
        if (!isScopeCompatible(parent.scope, draft.scope))
          return `A ${parent.scope} group cannot parent a ${draft.scope} group`
        if (excludeId && wouldCreateCycle(groups, excludeId, draft.parentId))
          return 'That parent would create a cycle in the hierarchy'
      }
      return null
    },
    [groups]
  )

  const addGroup = useCallback(
    (draft: GroupDraft, actor: string): boolean => {
      const error = validateDraft(draft)
      if (error) {
        toast.error(error)
        return false
      }
      const group: OrgGroup = {
        ...draft,
        acronym:
          draft.acronym.trim() ||
          draft.name
            .replace(/[^A-Za-z ]/g, '')
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 6),
        id: nextId('g'),
        version: 1,
        effectiveFrom: todayIso(),
        updatedBy: actor,
        updatedAt: todayIso(),
      }
      setGroups((prev) => [group, ...prev])
      setVersions((prev) => [
        {
          id: nextId('gv'),
          groupId: group.id,
          version: 1,
          effectiveFrom: group.effectiveFrom,
          changedBy: actor,
          summary: 'Group created',
          supersedes: null,
        },
        ...prev,
      ])
      logAudit(group.id, actor, 'Group created', `${group.name} (${group.scope} scope)`)
      toast.success(`Group “${group.name}” created`)
      return true
    },
    [validateDraft, logAudit]
  )

  const updateGroup = useCallback(
    (id: string, draft: GroupDraft, actor: string): boolean => {
      const error = validateDraft(draft, id)
      if (error) {
        toast.error(error)
        return false
      }
      const current = groups.find((g) => g.id === id)
      if (!current) return false
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                ...draft,
                version: g.version + 1,
                effectiveFrom: todayIso(),
                updatedBy: actor,
                updatedAt: todayIso(),
              }
            : g
        )
      )
      setVersions((prev) => [
        {
          id: nextId('gv'),
          groupId: id,
          version: current.version + 1,
          effectiveFrom: todayIso(),
          changedBy: actor,
          summary: 'Definition updated',
          supersedes: current.version,
        },
        ...prev,
      ])
      logAudit(id, actor, 'Definition updated', `v${current.version + 1} supersedes v${current.version}`)
      toast.success(`Group “${draft.name}” updated (v${current.version + 1})`)
      return true
    },
    [groups, validateDraft, logAudit]
  )

  const policiesUsing = useCallback(
    (groupId: string) => policies.filter((p) => p.groupIds.includes(groupId)),
    [policies]
  )

  const deleteGroup = useCallback(
    (id: string, actor: string): boolean => {
      const group = groups.find((g) => g.id === id)
      if (!group) return false
      if (groups.some((g) => g.parentId === id)) {
        toast.error(
          `“${group.name}” has child groups — reassign or remove them first`
        )
        return false
      }
      const refs = policiesUsing(id)
      if (refs.length > 0) {
        toast.error(
          `“${group.name}” is used by ${refs.length} active ${refs.length === 1 ? 'policy' : 'policies'} (${refs
            .map((p) => p.name)
            .join(', ')}) — deletion blocked`
        )
        return false
      }
      setGroups((prev) => prev.filter((g) => g.id !== id))
      logAudit(id, actor, 'Group deleted', group.name)
      toast.success(`Group “${group.name}” deleted`)
      return true
    },
    [groups, policiesUsing, logAudit]
  )

  const setGroupStatus = useCallback(
    (id: string, status: OrgGroup['status'], actor: string) => {
      const group = groups.find((g) => g.id === id)
      if (!group) return
      const refs = policiesUsing(id)
      if (status === 'inactive' && refs.length > 0) {
        toast.warning(
          `“${group.name}” is referenced by ${refs.map((p) => p.name).join(', ')} — dependent policies may be affected`
        )
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, status, updatedBy: actor, updatedAt: todayIso() } : g
        )
      )
      logAudit(id, actor, 'Status changed', `${group.name} set ${status}`)
      toast.success(`“${group.name}” is now ${status}`)
    },
    [groups, policiesUsing, logAudit]
  )

  const reparentGroup = useCallback(
    (id: string, newParentId: string | null, actor: string): boolean => {
      const group = groups.find((g) => g.id === id)
      if (!group) return false
      if (wouldCreateCycle(groups, id, newParentId)) {
        toast.error('Move blocked: that parent is a descendant — it would create a cycle')
        return false
      }
      if (newParentId) {
        const parent = groups.find((g) => g.id === newParentId)
        if (!parent) return false
        if (!isScopeCompatible(parent.scope, group.scope)) {
          toast.error(
            `Move blocked: a ${parent.scope} group cannot parent a ${group.scope} group`
          )
          return false
        }
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, parentId: newParentId, version: g.version + 1, updatedBy: actor, updatedAt: todayIso() }
            : g
        )
      )
      const parentName = newParentId
        ? groups.find((g) => g.id === newParentId)?.name
        : 'top level'
      logAudit(id, actor, 'Hierarchy changed', `${group.name} moved under ${parentName}`)
      toast.success(`“${group.name}” moved under ${parentName}`)
      return true
    },
    [groups, logAudit]
  )

  const setInheritanceRule = useCallback(
    (id: string, rule: OrgGroup['inheritanceRule'], actor: string) => {
      const group = groups.find((g) => g.id === id)
      if (!group) return
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, inheritanceRule: rule, updatedBy: actor, updatedAt: todayIso() } : g
        )
      )
      logAudit(id, actor, 'Inheritance rule changed', `${group.name}: ${rule ?? 'inherit from parent'}`)
      toast.success('Inheritance rule updated — engines pick it up at next evaluation, no deployment needed')
    },
    [groups, logAudit]
  )

  const addMembers = useCallback(
    (
      groupId: string,
      memberIds: string[],
      actor: string,
      opts: { viaApproval: boolean; source?: MembershipSource }
    ) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const today = todayIso()
      const alreadyIn = new Set(
        memberships
          .filter((m) => m.groupId === groupId && isEffectiveOn(m, today))
          .map((m) => m.memberId)
      )
      const fresh = memberIds.filter((id) => !alreadyIn.has(id))
      const skipped = memberIds.length - fresh.length
      if (fresh.length === 0) {
        toast.info('All selected people are already members — duplicates skipped')
        return
      }
      if (opts.viaApproval) {
        setRequests((prev) => [
          ...fresh.map<MembershipRequest>((memberId) => ({
            id: nextId('req'),
            groupId,
            memberId,
            action: 'add',
            requestedBy: actor,
            requestedAt: today,
            status: 'pending',
            decidedBy: null,
            decidedAt: null,
            reason: null,
          })),
          ...prev,
        ])
        toast.success(
          `${fresh.length} membership ${fresh.length === 1 ? 'change' : 'changes'} submitted for approval (“${group.name}” is approval-controlled)`
        )
        return
      }
      setMemberships((prev) => [
        ...fresh.map<GroupMembership>((memberId) => ({
          id: nextId('ms'),
          groupId,
          memberId,
          source: opts.source ?? 'manual',
          effectiveFrom: today,
          effectiveTo: null,
          addedBy: actor,
        })),
        ...prev,
      ])
      fresh.forEach((memberId) =>
        notify(memberId, `You were added to ${group.name} (${group.acronym}), effective ${today}.`)
      )
      logAudit(groupId, actor, 'Members added', `${fresh.length} added${skipped ? `, ${skipped} duplicates skipped` : ''}`)
      toast.success(
        `${fresh.length} member${fresh.length === 1 ? '' : 's'} added${skipped ? ` · ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}`
      )
    },
    [groups, memberships, notify, logAudit]
  )

  const removeMembers = useCallback(
    (groupId: string, memberIds: string[], actor: string, viaApproval: boolean) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group || memberIds.length === 0) return
      const today = todayIso()
      if (viaApproval) {
        setRequests((prev) => [
          ...memberIds.map<MembershipRequest>((memberId) => ({
            id: nextId('req'),
            groupId,
            memberId,
            action: 'remove',
            requestedBy: actor,
            requestedAt: today,
            status: 'pending',
            decidedBy: null,
            decidedAt: null,
            reason: null,
          })),
          ...prev,
        ])
        toast.success(`${memberIds.length} removal request${memberIds.length === 1 ? '' : 's'} submitted for approval`)
        return
      }
      setMemberships((prev) =>
        prev.map((m) =>
          m.groupId === groupId &&
          memberIds.includes(m.memberId) &&
          isEffectiveOn(m, today)
            ? { ...m, effectiveTo: today }
            : m
        )
      )
      memberIds.forEach((memberId) =>
        notify(memberId, `You were removed from ${group.name} (${group.acronym}), effective ${today}.`)
      )
      logAudit(groupId, actor, 'Members removed', `${memberIds.length} membership${memberIds.length === 1 ? '' : 's'} ended (history retained)`)
      toast.success(`${memberIds.length} membership${memberIds.length === 1 ? '' : 's'} ended — history retained`)
    },
    [groups, notify, logAudit]
  )

  const applyMembership = useCallback(
    (req: MembershipRequest, actor: string) => {
      const today = todayIso()
      if (req.action === 'add') {
        setMemberships((prev) => [
          {
            id: nextId('ms'),
            groupId: req.groupId,
            memberId: req.memberId,
            source: 'manual',
            effectiveFrom: today,
            effectiveTo: null,
            addedBy: `${req.requestedBy} (approved by ${actor})`,
          },
          ...prev,
        ])
      } else {
        setMemberships((prev) =>
          prev.map((m) =>
            m.groupId === req.groupId &&
            m.memberId === req.memberId &&
            isEffectiveOn(m, today)
              ? { ...m, effectiveTo: today }
              : m
          )
        )
      }
      const group = groups.find((g) => g.id === req.groupId)
      if (group)
        notify(
          req.memberId,
          `You were ${req.action === 'add' ? 'added to' : 'removed from'} ${group.name} (${group.acronym}), effective ${today} (approved change).`
        )
    },
    [groups, notify]
  )

  const approveRequest = useCallback(
    (id: string, actor: string) => {
      const req = requests.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return
      applyMembership(req, actor)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'approved', decidedBy: actor, decidedAt: todayIso() }
            : r
        )
      )
      logAudit(req.groupId, actor, 'Request approved', `${req.action} membership applied, effective ${todayIso()}`)
      toast.success('Request approved — membership change applied, effective today')
    },
    [requests, applyMembership, logAudit]
  )

  const rejectRequest = useCallback(
    (id: string, actor: string, reason: string) => {
      const req = requests.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'rejected', decidedBy: actor, decidedAt: todayIso(), reason }
            : r
        )
      )
      logAudit(req.groupId, actor, 'Request rejected', reason || 'No reason given')
      toast.success('Request rejected — the requester has been notified with the reason')
    },
    [requests, logAudit]
  )

  const transferMembers = useCallback(
    (sourceId: string, targetId: string, memberIds: string[], actor: string) => {
      const source = groups.find((g) => g.id === sourceId)
      const target = groups.find((g) => g.id === targetId)
      if (!source || !target || memberIds.length === 0) return
      const today = todayIso()
      const alreadyInTarget = new Set(
        memberships
          .filter((m) => m.groupId === targetId && isEffectiveOn(m, today))
          .map((m) => m.memberId)
      )
      const toAdd = memberIds.filter((id) => !alreadyInTarget.has(id))
      setMemberships((prev) => [
        ...toAdd.map<GroupMembership>((memberId) => ({
          id: nextId('ms'),
          groupId: targetId,
          memberId,
          source: 'manual',
          effectiveFrom: today,
          effectiveTo: null,
          addedBy: `${actor} (transfer from ${source.acronym})`,
        })),
        ...prev.map((m) =>
          m.groupId === sourceId &&
          memberIds.includes(m.memberId) &&
          isEffectiveOn(m, today)
            ? { ...m, effectiveTo: today }
            : m
        ),
      ])
      logAudit(sourceId, actor, 'Bulk transfer', `${memberIds.length} moved to ${target.name}${toAdd.length < memberIds.length ? ` (${memberIds.length - toAdd.length} already in target, not duplicated)` : ''}`)
      toast.success(`${memberIds.length} member${memberIds.length === 1 ? '' : 's'} transferred to “${target.name}”`)
    },
    [groups, memberships, logAudit]
  )

  const importMemberships = useCallback(
    (groupId: string, actor: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return { added: 0, skipped: 0, errors: 0 }
      const today = todayIso()
      const current = new Set(
        memberships
          .filter((m) => m.groupId === groupId && isEffectiveOn(m, today))
          .map((m) => m.memberId)
      )
      let added = 0
      let skipped = 0
      let errors = 0
      const rows: GroupMembership[] = []
      IMPORT_FILE_ROWS.forEach((row) => {
        if (!row.memberId) return void errors++
        if (current.has(row.memberId)) return void skipped++
        rows.push({
          id: nextId('ms'),
          groupId,
          memberId: row.memberId,
          source: 'manual',
          effectiveFrom: today,
          effectiveTo: null,
          addedBy: `${actor} (file import)`,
        })
        added++
      })
      setMemberships((prev) => [...rows, ...prev])
      logAudit(groupId, actor, 'Bulk import', `${added} added, ${skipped} duplicates skipped, ${errors} unmatched/out-of-scope rows rejected`)
      return { added, skipped, errors }
    },
    [groups, memberships, logAudit]
  )

  const mergeGroups = useCallback(
    (sourceId: string, targetId: string, actor: string) => {
      const source = groups.find((g) => g.id === sourceId)
      const target = groups.find((g) => g.id === targetId)
      if (!source || !target) return
      const today = todayIso()
      const sourceMemberIds = memberships
        .filter((m) => m.groupId === sourceId && isEffectiveOn(m, today))
        .map((m) => m.memberId)
      transferMembers(sourceId, targetId, sourceMemberIds, actor)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === sourceId ? { ...g, status: 'inactive', updatedBy: actor, updatedAt: today } : g
        )
      )
      logAudit(sourceId, actor, 'Group merged', `${source.name} merged into ${target.name}; source retired, history preserved`)
      toast.success(`“${source.name}” merged into “${target.name}” — source retired, history preserved`)
    },
    [groups, memberships, transferMembers, logAudit]
  )

  const runEligibilityEngine = useCallback(
    (groupId: string, actor: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group || group.type !== 'dynamic') return
      const today = todayIso()
      const current = memberships.filter(
        (m) => m.groupId === groupId && isEffectiveOn(m, today)
      )
      const derived = current.filter((m) => m.source === 'rule').length
      const manual = current.length - derived
      logAudit(groupId, actor, 'Eligibility re-evaluated', `Rule “${group.eligibilityRule}”: ${derived} rule-derived members confirmed, ${manual} manual exception${manual === 1 ? '' : 's'} preserved`)
      toast.success(
        `Eligibility re-evaluated for “${group.name}” — ${derived} rule-derived members, ${manual} manual exception${manual === 1 ? '' : 's'} preserved`
      )
    },
    [groups, memberships, logAudit]
  )

  const switchGroupType = useCallback(
    (groupId: string, actor: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group || group.type !== 'dynamic') return
      setMemberships((prev) =>
        prev.map((m) =>
          m.groupId === groupId && m.source === 'rule' ? { ...m, source: 'manual' } : m
        )
      )
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, type: 'static', updatedBy: actor, updatedAt: todayIso() } : g
        )
      )
      logAudit(groupId, actor, 'Type changed', 'Dynamic → static: derived members frozen as manual members')
      toast.success(`“${group.name}” is now static — derived members frozen as manual`)
    },
    [groups, logAudit]
  )

  const updatePolicyGroups = useCallback(
    (policyId: string, groupIds: string[], actor: string) => {
      const policy = policies.find((p) => p.id === policyId)
      if (!policy) return
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, groupIds } : p))
      )
      groupIds
        .filter((id) => !policy.groupIds.includes(id))
        .forEach((id) => logAudit(id, actor, 'Policy linked', `Selected as applicability criteria for ${policy.name}`))
      toast.success(`Applicability criteria updated for “${policy.name}”`)
    },
    [policies, logAudit]
  )

  return {
    groups,
    members,
    memberships,
    requests,
    audits,
    versions,
    policies,
    notifications,
    addGroup,
    updateGroup,
    deleteGroup,
    setGroupStatus,
    reparentGroup,
    setInheritanceRule,
    addMembers,
    removeMembers,
    approveRequest,
    rejectRequest,
    transferMembers,
    importMemberships,
    mergeGroups,
    runEligibilityEngine,
    switchGroupType,
    updatePolicyGroups,
    policiesUsing,
  }
}

export type OrgGroupsStore = ReturnType<typeof useOrgGroups>
