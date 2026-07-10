import { useMemo } from 'react'
import {
  allPlatformCompanies,
  companyMrrUsd,
  PLAN_NAMES,
  platformInvoices,
  platformPortfolios,
  type InvoiceStatus,
  type PlanName,
} from '../data/platform-metrics'

export interface RevenueByTenantRow {
  /** Group company (or standalone company) the revenue rolls up to. */
  tenant: string
  portfolio: string
  mrrUsd: number
}

export interface PlanMixSlice {
  plan: PlanName
  companies: number
  seats: number
  mrrUsd: number
}

export interface InvoiceStatusSummary {
  status: InvoiceStatus
  count: number
  amountUsd: number
}

/**
 * Derives every aggregate the Platform Admin dashboard shows from the
 * in-memory seed data (KPIs, revenue rollups, plan mix, invoice summary).
 */
export function usePlatformMetrics() {
  return useMemo(() => {
    const companies = allPlatformCompanies()
    const groupCompanies = platformPortfolios.flatMap((pf) => pf.groups)

    const totalSeats = companies.reduce((n, c) => n + c.seats, 0)
    const mrrUsd = companies.reduce((n, c) => n + companyMrrUsd(c), 0)

    // ---- Revenue rolled up per group company / standalone tenant ----------
    const revenueByTenant: RevenueByTenantRow[] = []
    for (const pf of platformPortfolios) {
      for (const g of pf.groups) {
        revenueByTenant.push({
          tenant: g.name,
          portfolio: pf.name,
          mrrUsd: g.companies.reduce((n, c) => n + companyMrrUsd(c), 0),
        })
      }
      for (const c of pf.directCompanies) {
        revenueByTenant.push({
          tenant: c.name,
          portfolio: pf.name,
          mrrUsd: companyMrrUsd(c),
        })
      }
    }
    revenueByTenant.sort((a, b) => b.mrrUsd - a.mrrUsd)

    // ---- Revenue per portfolio --------------------------------------------
    const revenueByPortfolio = platformPortfolios.map((pf) => ({
      portfolio: pf.name,
      mrrUsd: [
        ...pf.groups.flatMap((g) => g.companies),
        ...pf.directCompanies,
      ].reduce((n, c) => n + companyMrrUsd(c), 0),
    }))

    // ---- Plan mix -----------------------------------------------------------
    const planMix: PlanMixSlice[] = PLAN_NAMES.map((plan) => {
      const inPlan = companies.filter((c) => c.plan === plan)
      return {
        plan,
        companies: inPlan.length,
        seats: inPlan.reduce((n, c) => n + c.seats, 0),
        mrrUsd: inPlan.reduce((n, c) => n + companyMrrUsd(c), 0),
      }
    })

    // ---- Invoices -----------------------------------------------------------
    const invoiceSummary: InvoiceStatusSummary[] = (
      ['Paid', 'Due', 'Overdue'] as const
    ).map((status) => {
      const rows = platformInvoices.filter((i) => i.status === status)
      return {
        status,
        count: rows.length,
        amountUsd: rows.reduce((n, i) => n + i.amountUsd, 0),
      }
    })
    const openInvoices = platformInvoices.filter((i) => i.status !== 'Paid')
    const openInvoiceAmountUsd = openInvoices.reduce(
      (n, i) => n + i.amountUsd,
      0
    )

    return {
      portfolioCount: platformPortfolios.length,
      groupCompanyCount: groupCompanies.length,
      companyCount: companies.length,
      activeCompanyCount: companies.filter((c) => c.status === 'Active').length,
      totalSeats,
      mrrUsd,
      revenueByTenant,
      revenueByPortfolio,
      planMix,
      invoiceSummary,
      openInvoiceCount: openInvoices.length,
      openInvoiceAmountUsd,
    }
  }, [])
}

/** $12,345 — whole-dollar USD, used across the billing widgets. */
export const formatUsd = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
