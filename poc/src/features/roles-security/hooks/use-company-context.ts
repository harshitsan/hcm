import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import { authorizedCompanyIds } from '../data/authority'
import { HOME_COMPANY_ID, companyName } from '../data/directory'
import type { AuditAppendInput, NotifyInput } from './use-security-audit'

interface UseCompanyContextOptions {
  append: (input: AuditAppendInput) => void
  notify: (input: NotifyInput) => void
  actor: string
  actorRole: Role
}

/**
 * Secure, explicit company context switching (RSEC-09, RSEC-10): switching
 * requires an explicit confirmation, only authorized companies are
 * selectable, every switch is audit-logged with source and target, and the
 * active company is always indicated.
 */
export function useCompanyContext({
  append,
  notify,
  actor,
  actorRole,
}: UseCompanyContextOptions) {
  const [activeCompanyId, setActiveCompanyId] = useState(HOME_COMPANY_ID)
  const authorizedIds = authorizedCompanyIds(actorRole)

  /** RSEC-10: switching to an unauthorized company is denied and logged. */
  const switchCompany = useCallback(
    (targetCompanyId: string): boolean => {
      if (!authorizedIds.includes(targetCompanyId)) {
        append({
          category: 'Context Switch',
          actor,
          actorRole,
          target: 'Company context',
          detail: `Switch DENIED — not authorized for ${companyName(targetCompanyId)}`,
          sourceCompanyId: activeCompanyId,
          targetCompanyId,
        })
        toast.error(
          `Denied — you are not authorized for ${companyName(targetCompanyId)}`
        )
        return false
      }
      const source = activeCompanyId
      setActiveCompanyId(targetCompanyId)
      append({
        category: 'Context Switch',
        actor,
        actorRole,
        target: 'Company context',
        detail: `Switched active company: ${companyName(source)} → ${companyName(targetCompanyId)}`,
        sourceCompanyId: source,
        targetCompanyId,
      })
      notify({
        event: 'Company context switch',
        template: 'security/context-switch',
        recipients: ['Platform Security Desk'],
        companyId: targetCompanyId,
      })
      toast.success(`Active company is now ${companyName(targetCompanyId)}`)
      return true
    },
    [append, notify, actor, actorRole, activeCompanyId, authorizedIds]
  )

  return { activeCompanyId, authorizedIds, switchCompany }
}

export type CompanyContextStore = ReturnType<typeof useCompanyContext>
