import { useMemo, useSyncExternalStore } from 'react'
import {
  isEffectivelyActive,
  ROLE_SCOPE,
  type TargetModule,
} from '../data/business-logic'
import { useRole } from '@/context/role-context'
import { subscribe, getSnapshot } from './use-business-logic'

/**
 * Returns { active, total } for engine artifacts targeting `module`.
 * Uses the same filter as EngineArtifactsPanel (WFE-49) so counts stay
 * consistent with what the panel renders.
 */
export function useEngineArtifactCounts(module: TargetModule): {
  active: number
  total: number
} {
  const { role } = useRole()
  const artifacts = useSyncExternalStore(subscribe, getSnapshot)
  const myScope = ROLE_SCOPE[role]

  return useMemo(() => {
    const moduleArtifacts = artifacts.filter((a) =>
      a.attachments.some((x) => x.module === module)
    )
    const active = moduleArtifacts.filter(
      (a) => myScope && isEffectivelyActive(a.scopes, myScope)
    ).length
    return { active, total: moduleArtifacts.length }
  }, [artifacts, module, myScope])
}
