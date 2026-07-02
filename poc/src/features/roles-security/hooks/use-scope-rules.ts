import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import { authorizedCompanyIds } from '../data/authority'
import {
  seedScopeRules,
  type ScopeRule,
} from '../data/scope-rules'
import type { Department, WorkforceType } from '../data/directory'
import type { AuditAppendInput } from './use-security-audit'

export interface ScopeRuleDraft {
  name: string
  companyIds: string[]
  departments: Department[]
  workforceTypes: WorkforceType[]
  effectiveFrom: string
}

interface UseScopeRulesOptions {
  append: (input: AuditAppendInput) => void
  actor: string
  actorRole: Role
}

/**
 * Governed, versioned scope-rule configuration (RSEC-03, RSEC-19). Rules
 * can only govern companies within the author's authority; edits bump the
 * version and retain the prior one, and publishing makes a draft effective
 * without any code change.
 */
export function useScopeRules({
  append,
  actor,
  actorRole,
}: UseScopeRulesOptions) {
  const [rules, setRules] = useState<ScopeRule[]>(seedScopeRules)

  const withinAuthority = useCallback(
    (companyIds: string[]): boolean => {
      const allowed = authorizedCompanyIds(actorRole)
      return companyIds.every((id) => allowed.includes(id))
    },
    [actorRole]
  )

  const saveRule = useCallback(
    (draft: ScopeRuleDraft, editingId: string | null): boolean => {
      if (!withinAuthority(draft.companyIds)) {
        toast.error(
          `Denied — the rule references companies outside your authority as ${actorRole}. Scope rules cannot widen access beyond your boundary.`
        )
        return false
      }
      const today = new Date().toISOString().slice(0, 10)
      if (editingId) {
        setRules((prev) =>
          prev.map((r) => {
            if (r.id !== editingId) return r
            return {
              ...r,
              ...draft,
              version: r.version + 1,
              updatedBy: actor,
              updatedOn: today,
              history: [
                ...r.history,
                {
                  version: r.version,
                  updatedBy: r.updatedBy,
                  updatedOn: r.updatedOn,
                  note: `Superseded by v${r.version + 1}`,
                },
              ],
            }
          })
        )
        toast.success(
          `Scope rule updated — new version saved, prior version retained for audit`
        )
      } else {
        setRules((prev) => [
          {
            ...draft,
            id: `rule-${crypto.randomUUID().slice(0, 8)}`,
            version: 1,
            status: 'Draft',
            updatedBy: actor,
            updatedOn: today,
            history: [],
          },
          ...prev,
        ])
        toast.success(`Scope rule "${draft.name}" saved as draft v1`)
      }
      append({
        category: 'Config',
        actor,
        actorRole,
        target: draft.name,
        detail: editingId
          ? 'Scope rule re-versioned via governed config'
          : 'Scope rule created as governed config',
      })
      return true
    },
    [append, actor, actorRole, withinAuthority]
  )

  /** Publishing makes the rule effective at its date — no deployment (RSEC-19). */
  const publishRule = useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id)
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Published' } : r))
      )
      append({
        category: 'Config',
        actor,
        actorRole,
        target: rule?.name ?? id,
        detail: `Scope rule published — the access engine enforces it from ${rule?.effectiveFrom ?? 'its effective date'} without a deployment`,
      })
      toast.success('Rule published — enforced by the access engine at its effective date')
    },
    [append, actor, actorRole, rules]
  )

  return { rules, saveRule, publishRule }
}

export type ScopeRulesStore = ReturnType<typeof useScopeRules>
