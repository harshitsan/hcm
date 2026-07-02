import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import { authorizedCompanyIds } from '../data/authority'
import {
  seedAssignments,
  type RoleAssignment,
} from '../data/assignments'
import { companyName, personName } from '../data/directory'
import type { AuditAppendInput } from './use-security-audit'

export interface AssignmentDraft {
  personId: string
  roleId: string
  companyId: string
  effectiveFrom: string
  effectiveTo: string | null
}

interface UseAssignmentsOptions {
  append: (input: AuditAppendInput) => void
  actor: string
  actorRole: Role
}

/**
 * Effective-dated role-assignment store (RSEC-15): assignments are never
 * physically deleted — revoking one closes it with an effective-to date and
 * the row remains queryable as-of any date. Per-company roles let one user
 * hold different roles in different companies (RSEC-02); saves outside the
 * persona's company authority are denied (RSEC-11).
 */
export function useAssignments({
  append,
  actor,
  actorRole,
}: UseAssignmentsOptions) {
  const [assignments, setAssignments] =
    useState<RoleAssignment[]>(seedAssignments)

  const assign = useCallback(
    (draft: AssignmentDraft): boolean => {
      if (!authorizedCompanyIds(actorRole).includes(draft.companyId)) {
        toast.error(
          `Denied — ${companyName(draft.companyId)} is outside your authority as ${actorRole}`
        )
        return false
      }
      const assignment: RoleAssignment = {
        ...draft,
        id: `asg-${crypto.randomUUID().slice(0, 8)}`,
        assignedBy: actor,
        recordedOn: new Date().toISOString().slice(0, 10),
      }
      setAssignments((prev) => [assignment, ...prev])
      append({
        category: 'Role Change',
        actor,
        actorRole,
        target: personName(draft.personId),
        detail: `Role assigned in ${companyName(draft.companyId)}, effective ${draft.effectiveFrom}${draft.effectiveTo ? ` to ${draft.effectiveTo}` : ''}`,
        targetCompanyId: draft.companyId,
      })
      toast.success(
        `Role assigned to ${personName(draft.personId)} — effective ${draft.effectiveFrom}`
      )
      return true
    },
    [append, actor, actorRole]
  )

  /**
   * Ends an assignment as of today. The record is retained as history —
   * never deleted (RSEC-15).
   */
  const endAssignment = useCallback(
    (id: string) => {
      const today = new Date().toISOString().slice(0, 10)
      const target = assignments.find((a) => a.id === id)
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, effectiveTo: today } : a))
      )
      if (target) {
        append({
          category: 'Role Change',
          actor,
          actorRole,
          target: personName(target.personId),
          detail: `Assignment ended effective ${today} — prior record retained as history`,
          targetCompanyId: target.companyId,
        })
      }
      toast.success('Assignment ended — the historical record is retained')
    },
    [append, actor, actorRole, assignments]
  )

  return { assignments, assign, endAssignment }
}

export type AssignmentsStore = ReturnType<typeof useAssignments>
