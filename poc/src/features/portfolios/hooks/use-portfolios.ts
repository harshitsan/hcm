import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  MANAGER_BY_ID,
  companyName,
  seedPortfolios,
  type Portfolio,
} from '../data/portfolios'
import { type RecordEventFn } from './use-portfolio-audit'

export interface PortfolioDraft {
  name: string
  description: string
  managerId: string
  companyIds: string[]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Stamp ModifiedDate/ModifiedBy on a successful modification (PORT-08/09). */
function touch(p: Portfolio, actorEmail: string): Portfolio {
  return { ...p, modifiedDate: today(), modifiedBy: actorEmail }
}

/** Auto-generate PortfolioCode in format PORT-YYYY-NNN (PORT-01). */
function nextCode(portfolios: Portfolio[]) {
  const year = new Date().getFullYear()
  const seq = portfolios.filter((p) => p.code.includes(`-${year}-`)).length + 1
  return `PORT-${year}-${String(seq).padStart(3, '0')}`
}

/**
 * In-memory portfolio store (PORT-FR-001…003). Enforces unique names
 * (PORT_001), one-portfolio-per-company (PORT_002), the Portfolio Manager
 * role requirement, and the minimum-one-company rule; records every change
 * on the portfolio audit trail.
 */
export function usePortfolios(record: RecordEventFn, actorEmail: string) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(seedPortfolios)

  /** companyId → portfolio currently holding it (PORT-03). */
  const companyAssignment = useMemo(() => {
    const map = new Map<string, Portfolio>()
    portfolios.forEach((p) =>
      p.companies.forEach((link) => map.set(link.companyId, p))
    )
    return map
  }, [portfolios])

  const createPortfolio = useCallback(
    (draft: PortfolioDraft): boolean => {
      if (
        portfolios.some(
          (p) => p.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
        )
      ) {
        toast.error('PORT_001 — Portfolio name exists (409)')
        return false
      }
      const conflict = draft.companyIds.find((id) => companyAssignment.has(id))
      if (conflict) {
        toast.error(
          `PORT_002 — ${companyName(conflict)} is already in another portfolio (409)`
        )
        return false
      }
      const manager = MANAGER_BY_ID[draft.managerId]
      if (!manager?.isPortfolioManager) {
        toast.error('Assigned manager must hold the Portfolio Manager role')
        return false
      }
      const portfolio: Portfolio = {
        id: `pf-${crypto.randomUUID().slice(0, 8)}`,
        code: nextCode(portfolios),
        name: draft.name.trim(),
        description: draft.description.trim(),
        managerId: draft.managerId,
        status: 'Active',
        createdDate: today(),
        createdBy: actorEmail,
        modifiedDate: null,
        modifiedBy: null,
        companies: draft.companyIds.map((companyId) => ({
          companyId,
          addedDate: today(),
          addedBy: actorEmail,
        })),
      }
      setPortfolios((prev) => [portfolio, ...prev])
      record({
        eventType: 'PORTFOLIO_CREATED',
        companiesAffected: draft.companyIds.map(companyName),
        parameters: `${portfolio.code} ${portfolio.name} — manager ${manager.name}, ${draft.companyIds.length} companies`,
        status: 'success',
      })
      toast.success(`Portfolio ${portfolio.code} created (status Active)`)
      return true
    },
    [portfolios, companyAssignment, record, actorEmail]
  )

  const updatePortfolio = useCallback(
    (
      id: string,
      changes: Partial<
        Pick<Portfolio, 'name' | 'description' | 'managerId' | 'status'>
      >
    ): boolean => {
      const target = portfolios.find((p) => p.id === id)
      if (!target) return false
      if (
        changes.name &&
        portfolios.some(
          (p) =>
            p.id !== id &&
            p.name.trim().toLowerCase() === changes.name!.trim().toLowerCase()
        )
      ) {
        toast.error('PORT_001 — Portfolio name exists (409)')
        return false
      }
      if (
        changes.managerId &&
        !MANAGER_BY_ID[changes.managerId]?.isPortfolioManager
      ) {
        toast.error('Assigned manager must hold the Portfolio Manager role')
        return false
      }
      const summary: string[] = []
      if (changes.name && changes.name !== target.name)
        summary.push('name updated')
      if (
        changes.description !== undefined &&
        changes.description !== target.description
      )
        summary.push('description updated')
      if (changes.managerId && changes.managerId !== target.managerId)
        summary.push(`manager → ${MANAGER_BY_ID[changes.managerId].name}`)
      if (changes.status && changes.status !== target.status)
        summary.push(`status ${target.status} → ${changes.status}`)
      if (summary.length === 0) {
        toast.info('No changes to save')
        return true
      }
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === id ? touch({ ...p, ...changes }, actorEmail) : p
        )
      )
      record({
        eventType: 'PORTFOLIO_MODIFIED',
        companiesAffected: target.companies.map((l) =>
          companyName(l.companyId)
        ),
        parameters: `${target.name} — ${summary.join(', ')}`,
        status: 'success',
      })
      toast.success(`${target.name} updated`)
      return true
    },
    [portfolios, record, actorEmail]
  )

  const addCompanies = useCallback(
    (id: string, companyIds: string[]): boolean => {
      const target = portfolios.find((p) => p.id === id)
      if (!target || companyIds.length === 0) return false
      const conflict = companyIds.find((cid) => companyAssignment.has(cid))
      if (conflict) {
        toast.error(
          `PORT_002 — ${companyName(conflict)} is already in another portfolio (409)`
        )
        return false
      }
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === id
            ? touch(
                {
                  ...p,
                  companies: [
                    ...p.companies,
                    ...companyIds.map((companyId) => ({
                      companyId,
                      addedDate: today(),
                      addedBy: actorEmail,
                    })),
                  ],
                },
                actorEmail
              )
            : p
        )
      )
      record({
        eventType: 'PORTFOLIO_MODIFIED',
        companiesAffected: companyIds.map(companyName),
        parameters: `${target.name} — ${companyIds.length} company(ies) added`,
        status: 'success',
      })
      toast.success(
        `${companyIds.length === 1 ? companyName(companyIds[0]) : `${companyIds.length} companies`} added to ${target.name}`
      )
      return true
    },
    [portfolios, companyAssignment, record, actorEmail]
  )

  /** Blocked removals leave ModifiedDate/By unchanged and write no audit event (PORT-05). */
  const removeCompany = useCallback(
    (id: string, companyId: string): boolean => {
      const target = portfolios.find((p) => p.id === id)
      if (!target) return false
      if (target.companies.length <= 1) {
        toast.error('A portfolio must contain at least one company')
        return false
      }
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === id
            ? touch(
                {
                  ...p,
                  companies: p.companies.filter(
                    (l) => l.companyId !== companyId
                  ),
                },
                actorEmail
              )
            : p
        )
      )
      record({
        eventType: 'PORTFOLIO_MODIFIED',
        companiesAffected: [companyName(companyId)],
        parameters: `${target.name} — ${companyName(companyId)} removed`,
        status: 'success',
      })
      toast.success(`${companyName(companyId)} removed from ${target.name}`)
      return true
    },
    [portfolios, record, actorEmail]
  )

  return {
    portfolios,
    companyAssignment,
    createPortfolio,
    updatePortfolio,
    addCompanies,
    removeCompany,
  }
}

export type PortfoliosStore = ReturnType<typeof usePortfolios>
