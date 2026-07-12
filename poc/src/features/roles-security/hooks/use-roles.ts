import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import { canGovernScope } from '../data/authority'
import type { HierarchyLevel } from '../data/directory'
import {
  canHoldCompensationPermissions,
  isCompensationPermission,
  seedProjectRoles,
  seedRoles,
  type PermissionFunction,
  type ProjectRole,
  type RoleDef,
  type RoleStatus,
} from '../data/roles'
import type { AuditAppendInput } from './use-security-audit'

export interface RoleDraft {
  name: string
  description: string
  isAdmin: boolean
  scopeLevel: HierarchyLevel
  scopeEntityId: string | null
  permissions: PermissionFunction[]
  effectiveFrom: string
  status: RoleStatus
  note: string
}

export type ProjectRoleDraft = Omit<ProjectRole, 'id'>

interface UseRolesOptions {
  append: (input: AuditAppendInput) => void
  actor: string
  actorRole: Role
}

/**
 * Role catalog store — versioned governed config (RSEC-18): edits create a
 * new version and retain the prior one in history. Saves are validated
 * against the persona's authority (RSEC-01, RSEC-11). Also holds
 * screen-level permissions (RSEC-33/34) and project roles (RSEC-36).
 */
export function useRoles({ append, actor, actorRole }: UseRolesOptions) {
  const [roles, setRoles] = useState<RoleDef[]>(seedRoles)
  const [projectRoles, setProjectRoles] =
    useState<ProjectRole[]>(seedProjectRoles)

  const denyOutOfScope = useCallback(
    (draft: RoleDraft): boolean => {
      if (!canGovernScope(actorRole, draft.scopeLevel, draft.scopeEntityId)) {
        toast.error(
          `Denied — as ${actorRole} you cannot govern roles at the selected scope. Your authority boundary was not widened.`
        )
        return true
      }
      return false
    },
    [actorRole]
  )

  /**
   * Compensation-visibility rule (Phase 1 policy): salary/tax/payroll-report
   * permissions are only allowed on HR Admin, Finance & Compliance Viewer,
   * or platform/portfolio-scoped roles — enforced at save time too.
   */
  const denyCompensationViolation = useCallback((draft: RoleDraft): boolean => {
    const holdsCompensation = draft.permissions.some(isCompensationPermission)
    if (
      holdsCompensation &&
      !canHoldCompensationPermissions(draft.name, draft.scopeLevel)
    ) {
      toast.error(
        'Not saved — compensation permissions can only be granted to HR Admin, Finance & Compliance Viewer, or platform/portfolio roles (Phase 1 policy).'
      )
      return true
    }
    return false
  }, [])

  const addRole = useCallback(
    (draft: RoleDraft): boolean => {
      if (denyOutOfScope(draft)) return false
      if (denyCompensationViolation(draft)) return false
      const role: RoleDef = {
        ...draft,
        id: `role-${crypto.randomUUID().slice(0, 8)}`,
        screenIds: [],
        version: 1,
        history: [],
      }
      setRoles((prev) => [role, ...prev])
      append({
        category: 'Role Change',
        actor,
        actorRole,
        target: draft.name,
        detail: `Created role v1 at ${draft.scopeLevel} scope (${draft.status})`,
        targetCompanyId:
          draft.scopeLevel === 'Company' ? draft.scopeEntityId : null,
      })
      toast.success(`Role "${draft.name}" saved as version 1`)
      return true
    },
    [append, actor, actorRole, denyOutOfScope, denyCompensationViolation]
  )

  /** Edits publish a new version; the prior version is retained (RSEC-18). */
  const updateRole = useCallback(
    (id: string, draft: RoleDraft): boolean => {
      if (denyOutOfScope(draft)) return false
      if (denyCompensationViolation(draft)) return false
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          return {
            ...r,
            ...draft,
            version: r.version + 1,
            history: [
              ...r.history,
              {
                version: r.version,
                effectiveFrom: r.effectiveFrom,
                permissions: r.permissions,
                changedBy: actor,
                changedOn: new Date().toISOString().slice(0, 10),
                note: draft.note || 'Updated definition',
              },
            ],
          }
        })
      )
      append({
        category: 'Role Change',
        actor,
        actorRole,
        target: draft.name,
        detail: `Published new role version effective ${draft.effectiveFrom} — prior version retained`,
      })
      toast.success(
        `Role "${draft.name}" saved as a new version — history retained`
      )
      return true
    },
    [append, actor, actorRole, denyOutOfScope, denyCompensationViolation]
  )

  /** Screen-level permissions for a role (RSEC-33, RSEC-34). */
  const setRoleScreens = useCallback(
    (roleId: string, screenIds: string[]) => {
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, screenIds } : r))
      )
      const role = roles.find((r) => r.id === roleId)
      append({
        category: 'Role Change',
        actor,
        actorRole,
        target: role?.name ?? roleId,
        detail: `Screen permissions updated — ${screenIds.length} screen(s) granted`,
      })
      toast.success(
        `${screenIds.length} screen(s) granted to ${role?.name ?? 'role'}`
      )
    },
    [append, actor, actorRole, roles]
  )

  const addProjectRole = useCallback((draft: ProjectRoleDraft) => {
    setProjectRoles((prev) => [
      { ...draft, id: `pr-${crypto.randomUUID().slice(0, 8)}` },
      ...prev,
    ])
    toast.success(`Project role "${draft.name}" added`)
  }, [])

  const updateProjectRole = useCallback(
    (id: string, draft: ProjectRoleDraft) => {
      setProjectRoles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...draft } : p))
      )
      toast.success(`Project role "${draft.name}" updated`)
    },
    []
  )

  return {
    roles,
    projectRoles,
    addRole,
    updateRole,
    setRoleScreens,
    addProjectRole,
    updateProjectRole,
  }
}

export type RolesStore = ReturnType<typeof useRoles>
