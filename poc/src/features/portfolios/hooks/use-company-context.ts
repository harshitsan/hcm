import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type Role } from '@/context/role-context'
import {
  COMPANY_BY_ID,
  ROLE_PERMISSIONS,
  companyName,
  type Persona,
} from '../data/portfolios'
import { type RecordEventFn } from './use-portfolio-audit'

/** Mock JWT carrying the company claim (PORT-14, §7.2 session binding). */
function issueToken(role: Role, companyId: string) {
  const claims = btoa(
    JSON.stringify({ role, company: companyId, iat: Date.now() })
  ).replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${claims}`
}

/**
 * In-memory company-context store (PORT-FR-004…007, PORT-12…PORT-18).
 * Validates authorization before every switch (AUTH_002 on denial), issues a
 * new session token with the target company claim, preserves per-company
 * unsaved session drafts, and logs every attempt — success or failure.
 */
export function useCompanyContext(
  record: RecordEventFn,
  persona: Persona,
  role: Role
) {
  const authorizedIds = persona.authorizedCompanyIds
  const [currentCompanyId, setCurrentCompanyId] = useState(authorizedIds[0])
  const [sessionToken, setSessionToken] = useState(() =>
    issueToken(role, authorizedIds[0])
  )
  /** Unsaved in-progress HR actions per company (PORT-15). */
  const [drafts, setDrafts] = useState<Record<string, string>>({
    'co-01': 'Leave approval for Ananya Iyer — pending comment',
  })
  const [lastApiResponse, setLastApiResponse] = useState<string | null>(null)

  // Re-anchor context when the mock role (and therefore persona) changes.
  useEffect(() => {
    setCurrentCompanyId(authorizedIds[0])
    setSessionToken(issueToken(role, authorizedIds[0]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const currentCompany = COMPANY_BY_ID[currentCompanyId]
  const permissions = ROLE_PERMISSIONS[role]

  const switchCompany = useCallback(
    (targetCompanyId: string, via: 'selector' | 'url'): boolean => {
      const target = COMPANY_BY_ID[targetCompanyId]
      if (!target) return false
      if (!authorizedIds.includes(targetCompanyId)) {
        // Denied switches keep the current context and are audited (§7.2).
        setLastApiResponse(
          JSON.stringify(
            {
              status: 403,
              error: 'AUTH_002',
              message: 'Context switch not permitted',
              targetCompany: target.name,
            },
            null,
            2
          )
        )
        record({
          eventType: 'CONTEXT_SWITCHED',
          companiesAffected: [target.name],
          parameters: `AUTH_002 — ${via === 'url' ? 'bookmarked URL' : 'selector'} switch to ${target.name} denied (403)`,
          status: 'failure',
        })
        toast.error('AUTH_002 — Context switch not permitted (403)')
        return false
      }
      if (targetCompanyId === currentCompanyId) {
        toast.info(`Already operating in ${target.name}`)
        return true
      }
      const previous = companyName(currentCompanyId)
      const token = issueToken(role, targetCompanyId)
      setCurrentCompanyId(targetCompanyId)
      setSessionToken(token)
      setLastApiResponse(
        JSON.stringify(
          {
            status: 200,
            success: true,
            previousCompany: previous,
            currentCompany: target.name,
            sessionToken: `${token.slice(0, 34)}…`,
            permissions,
            configuration: {
              currency: target.currency,
              timeZone: target.timeZone,
              dateFormat: target.dateFormat,
            },
          },
          null,
          2
        )
      )
      record({
        eventType: 'CONTEXT_SWITCHED',
        companiesAffected: [previous, target.name],
        parameters: `from=${previous}, to=${target.name}${via === 'url' ? ' (bookmarked URL)' : ''}`,
        status: 'success',
      })
      toast.success(
        `Switched to ${target.name} — ${target.currency}, ${target.timeZone}`
      )
      return true
    },
    [authorizedIds, currentCompanyId, permissions, record, role]
  )

  const saveDraft = useCallback((companyId: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [companyId]: text }))
  }, [])

  const authorizedCompanies = useMemo(
    () => authorizedIds.map((id) => COMPANY_BY_ID[id]).filter(Boolean),
    [authorizedIds]
  )

  return {
    currentCompany,
    authorizedCompanies,
    sessionToken,
    permissions,
    drafts,
    saveDraft,
    switchCompany,
    lastApiResponse,
  }
}

export type CompanyContextStore = ReturnType<typeof useCompanyContext>
