import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ADMIN_CANDIDATES,
  activeMemberships,
  seedCompanies,
  seedGroups,
  SETTING_LABELS,
  type GroupCompany,
  type GroupMembership,
  type GroupType,
  type MemberCompany,
  type RelationshipType,
  type SharedSetting,
} from '../data/group-companies'
import { seedRoleGrants, type GroupLevelRole, type GroupRoleGrant } from '../data/sharing'
import { type RecordAudit } from './use-audit'

export interface GroupDraft {
  name: string
  type: GroupType
  parentCompanyId: string | null
  administratorEmail: string
  memberIds: string[]
}

const today = () => new Date().toISOString().slice(0, 10)

function relationshipFor(type: GroupType, isParent: boolean): RelationshipType {
  if (type === 'Holding') return isParent ? 'Parent' : 'Subsidiary'
  if (type === 'Sister') return 'Sister Concern'
  return 'JV Partner'
}

/** True when `ownerId` (transitively) owns `targetId` — GROUP_002 detection. */
function ownsTransitively(
  companies: MemberCompany[],
  ownerId: string,
  targetId: string
): boolean {
  const direct = companies.find((c) => c.id === ownerId)?.ownsCompanyIds ?? []
  if (direct.includes(targetId)) return true
  return direct.some((next) => ownsTransitively(companies, next, targetId))
}

/**
 * In-memory group-company store (FR 6.3). Holds constructs with
 * effective-dated memberships, versioned shared-scenario config, and explicit
 * group-level role grants. All validations from §3.3.1/§4.2.4 are enforced
 * here so every entry point (create, edit, member panel) behaves identically.
 */
export function useGroupCompanies(record: RecordAudit, actorEmail: string) {
  const [groups, setGroups] = useState<GroupCompany[]>(seedGroups)
  const [roleGrants, setRoleGrants] = useState<GroupRoleGrant[]>(seedRoleGrants)
  const companies = seedCompanies

  const companyName = useCallback(
    (id: string | null) => companies.find((c) => c.id === id)?.name ?? '—',
    [companies]
  )

  /** Group a company actively belongs to, if any (one-group-per-company). */
  const groupOfCompany = useCallback(
    (companyId: string, ignoreGroupId?: string) =>
      groups.find(
        (g) =>
          g.id !== ignoreGroupId &&
          activeMemberships(g).some((m) => m.companyId === companyId)
      ),
    [groups]
  )

  const validateDraft = useCallback(
    (draft: GroupDraft, editingId?: string): boolean => {
      const dup = groups.some(
        (g) =>
          g.id !== editingId &&
          g.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
      )
      if (dup) {
        toast.error('Group Name must be unique across the platform')
        return false
      }
      for (const id of draft.memberIds) {
        const c = companies.find((x) => x.id === id)
        if (!c || c.status !== 'Active') {
          toast.error(`${companyName(id)} is not Active — group companies must be active companies`)
          return false
        }
        const other = groupOfCompany(id, editingId)
        if (other) {
          toast.error(`GROUP_001 (409) — ${c.name} already belongs to ${other.name}`)
          return false
        }
      }
      if (draft.type === 'Holding' && draft.parentCompanyId) {
        const cyclic = draft.memberIds.find(
          (m) =>
            m !== draft.parentCompanyId &&
            ownsTransitively(companies, m, draft.parentCompanyId as string)
        )
        if (cyclic) {
          toast.error(
            `GROUP_002 (400) — Circular reference detected: ${companyName(cyclic)} owns ${companyName(draft.parentCompanyId)}, so it cannot also be the parent`
          )
          return false
        }
      }
      return true
    },
    [companies, companyName, groupOfCompany, groups]
  )

  const createGroup = useCallback(
    (draft: GroupDraft): boolean => {
      if (!validateDraft(draft)) return false
      const year = new Date().getFullYear()
      const maxSeq = groups.reduce(
        (max, g) => Math.max(max, Number(g.code.split('-')[2] ?? 0)),
        0
      )
      const code = `GROUP-${year}-${String(maxSeq + 1).padStart(3, '0')}`
      const admin = ADMIN_CANDIDATES.find((a) => a.email === draft.administratorEmail)
      const memberships: GroupMembership[] = draft.memberIds.map((id) => ({
        id: `gm-${crypto.randomUUID().slice(0, 6)}`,
        companyId: id,
        relationshipType: relationshipFor(draft.type, id === draft.parentCompanyId),
        effectiveFrom: today(),
        effectiveTo: null,
        addedBy: actorEmail,
      }))
      const group: GroupCompany = {
        id: `g-${crypto.randomUUID().slice(0, 6)}`,
        code,
        name: draft.name.trim(),
        type: draft.type,
        parentCompanyId: draft.type === 'Holding' ? draft.parentCompanyId : null,
        administratorName: admin?.name ?? draft.administratorEmail,
        administratorEmail: draft.administratorEmail,
        tenantId: 'ten-001',
        createdOn: today(),
        createdBy: actorEmail,
        memberships,
        sharedAdministration: false,
        sharedLocations: false,
        crossCompanyAccess: false,
        configVersions: [],
      }
      setGroups((prev) => [group, ...prev])
      record({
        action: 'GROUP_CREATED',
        category: 'construct',
        groupCode: code,
        detail: `${draft.type} group "${group.name}" created with ${memberships.length} member companies — shared scenarios disabled by default`,
      })
      toast.success(`${code} created — Status Active, shared scenarios OFF by default`)
      return true
    },
    [actorEmail, groups, record, validateDraft]
  )

  const updateGroup = useCallback(
    (id: string, draft: GroupDraft): boolean => {
      if (!validateDraft(draft, id)) return false
      const admin = ADMIN_CANDIDATES.find((a) => a.email === draft.administratorEmail)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                name: draft.name.trim(),
                type: draft.type,
                parentCompanyId: draft.type === 'Holding' ? draft.parentCompanyId : null,
                administratorName: admin?.name ?? draft.administratorEmail,
                administratorEmail: draft.administratorEmail,
              }
            : g
        )
      )
      const g = groups.find((x) => x.id === id)
      record({
        action: 'GROUP_UPDATED',
        category: 'construct',
        groupCode: g?.code ?? null,
        detail: `Construct "${draft.name}" updated (type ${draft.type})`,
      })
      toast.success('Group updated')
      return true
    },
    [groups, record, validateDraft]
  )

  const addMember = useCallback(
    (
      groupId: string,
      companyId: string,
      relationshipType: RelationshipType,
      effectiveFrom: string
    ): boolean => {
      const group = groups.find((g) => g.id === groupId)
      const company = companies.find((c) => c.id === companyId)
      if (!group || !company) return false
      if (company.status !== 'Active') {
        toast.error(`${company.name} is ${company.status} — only Active companies can join a group`)
        return false
      }
      if (activeMemberships(group).some((m) => m.companyId === companyId)) {
        toast.error(`Integrity constraint — ${company.name} is already an active member of ${group.name}`)
        return false
      }
      const other = groupOfCompany(companyId, groupId)
      if (other) {
        toast.error(`GROUP_001 (409) — ${company.name} already belongs to ${other.name}`)
        return false
      }
      const membership: GroupMembership = {
        id: `gm-${crypto.randomUUID().slice(0, 6)}`,
        companyId,
        relationshipType,
        effectiveFrom,
        effectiveTo: null,
        addedBy: actorEmail,
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, memberships: [...g.memberships, membership] } : g
        )
      )
      record({
        action: 'MEMBER_ADDED',
        category: 'membership',
        groupCode: group.code,
        targetCompany: company.name,
        detail: `${company.name} joined as ${relationshipType}, effective ${effectiveFrom} (JoinDate + AddedBy captured)`,
      })
      toast.success(`${company.name} added — effective-dated membership recorded`)
      return true
    },
    [actorEmail, companies, groupOfCompany, groups, record]
  )

  const removeMember = useCallback(
    (groupId: string, membershipId: string) => {
      const group = groups.find((g) => g.id === groupId)
      const member = group?.memberships.find((m) => m.id === membershipId)
      if (!group || !member) return
      const end = today()
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                memberships: g.memberships.map((m) =>
                  m.id === membershipId ? { ...m, effectiveTo: end } : m
                ),
              }
            : g
        )
      )
      record({
        action: 'MEMBER_REMOVED',
        category: 'membership',
        groupCode: group.code,
        targetCompany: companyName(member.companyId),
        detail: `Membership ended effective ${end} — prior state retained as history; shared scenarios no longer apply`,
      })
      toast.success(
        `${companyName(member.companyId)} removed effective ${end} — history preserved, shared access revoked`
      )
    },
    [companyName, groups, record]
  )

  /** Versioned, effective-dated shared-scenario configuration (GRP-13). */
  const setScenario = useCallback(
    (groupId: string, setting: SharedSetting, value: boolean, effectiveDate: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const scheduled = effectiveDate > today()
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g
          const version = g.configVersions.length + 1
          const next = {
            ...g,
            configVersions: [
              ...g.configVersions,
              {
                id: `cv-${crypto.randomUUID().slice(0, 6)}`,
                version,
                setting,
                priorValue: g[setting],
                newValue: value,
                effectiveDate,
                changedBy: actorEmail,
                changedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
              },
            ],
          }
          return scheduled ? next : { ...next, [setting]: value }
        })
      )
      record({
        action: 'CONFIG_CHANGED',
        category: 'config',
        groupCode: group.code,
        detail: `${SETTING_LABELS[setting]}: ${group[setting]} → ${value} (v${group.configVersions.length + 1}, effective ${effectiveDate})`,
      })
      toast.success(
        scheduled
          ? `${SETTING_LABELS[setting]} change versioned — takes effect ${effectiveDate} without a deployment`
          : `${SETTING_LABELS[setting]} ${value ? 'authorized' : 'revoked'} — new config version recorded`
      )
    },
    [actorEmail, groups, record]
  )

  const grantRole = useCallback(
    (
      groupId: string,
      grant: { userName: string; userEmail: string; companyId: string | null; role: GroupLevelRole }
    ) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const exists = roleGrants.some(
        (r) =>
          r.groupId === groupId &&
          r.userEmail === grant.userEmail &&
          r.role === grant.role &&
          !r.revoked
      )
      if (exists) {
        toast.error(`${grant.userEmail} already holds ${grant.role} for this group`)
        return
      }
      setRoleGrants((prev) => [
        {
          id: `rg-${crypto.randomUUID().slice(0, 6)}`,
          groupId,
          ...grant,
          grantedBy: actorEmail,
          grantedOn: today(),
          revoked: false,
          revokedOn: null,
        },
        ...prev,
      ])
      record({
        action: 'GROUP_ROLE_GRANTED',
        category: 'role-grant',
        groupCode: group.code,
        targetCompany: companyName(grant.companyId),
        detail: `${grant.role} granted to ${grant.userEmail} — effective on next access attempt`,
      })
      toast.success(`${grant.role} granted to ${grant.userName}`)
    },
    [actorEmail, companyName, groups, record, roleGrants]
  )

  const revokeRole = useCallback(
    (grantId: string) => {
      const grant = roleGrants.find((r) => r.id === grantId)
      const group = groups.find((g) => g.id === grant?.groupId)
      if (!grant) return
      setRoleGrants((prev) =>
        prev.map((r) => (r.id === grantId ? { ...r, revoked: true, revokedOn: today() } : r))
      )
      record({
        action: 'GROUP_ROLE_REVOKED',
        category: 'role-grant',
        groupCode: group?.code ?? null,
        detail: `${grant.role} revoked from ${grant.userEmail} — subsequent cross-company access will be denied`,
      })
      toast.success(`${grant.role} revoked — takes effect on the next access attempt`)
    },
    [groups, record, roleGrants]
  )

  /** Cross-company administrative action under shared administration (GRP-02). */
  const runAdminAction = useCallback(
    (groupId: string, targetCompanyId: string, action: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      if (!group.sharedAdministration) {
        toast.error('Denied — shared administration is not explicitly authorized for this group')
        return
      }
      if (!activeMemberships(group).some((m) => m.companyId === targetCompanyId)) {
        toast.error('Denied — target company is outside the group-company construct')
        return
      }
      record({
        action: 'ADMIN_ACTION_EXECUTED',
        category: 'admin-action',
        groupCode: group.code,
        targetCompany: companyName(targetCompanyId),
        detail: `Cross-company action "${action}" executed under shared administration`,
      })
      toast.success(`"${action}" applied to ${companyName(targetCompanyId)} — captured in the audit trail`)
    },
    [companyName, groups, record]
  )

  return {
    groups,
    companies,
    roleGrants,
    companyName,
    groupOfCompany,
    createGroup,
    updateGroup,
    addMember,
    removeMember,
    setScenario,
    grantRole,
    revokeRole,
    runAdminAction,
  }
}

export type GroupCompaniesStore = ReturnType<typeof useGroupCompanies>
