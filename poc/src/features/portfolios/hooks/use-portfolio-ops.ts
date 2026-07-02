import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { COMPANY_BY_ID, companyName } from '../data/portfolios'
import { type RecordEventFn } from './use-portfolio-audit'

export interface ImportRun {
  id: string
  companyId: string
  fileName: string
  rowsProcessed: number
  rowsSkipped: number
  timestamp: string
}

export interface DeploymentResult {
  companyId: string
  status: 'success' | 'failure'
  detail: string
}

export interface DeploymentRun {
  id: string
  policy: string
  timestamp: string
  results: DeploymentResult[]
}

export interface PortfolioAnnouncement {
  id: string
  title: string
  message: string
  companyIds: string[]
  publishedAt: string
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function shortId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/**
 * In-memory portfolio operations store (PORT-FR-008…010, PORT-19…PORT-24):
 * per-company bulk imports, standardized policy deployment with per-company
 * success/failure, portfolio-wide announcements, report exports and
 * cross-company search logging — every operation lands on the audit trail.
 */
export function usePortfolioOps(record: RecordEventFn) {
  const [imports, setImports] = useState<ImportRun[]>([])
  const [deployments, setDeployments] = useState<DeploymentRun[]>([])
  const [announcements, setAnnouncements] = useState<PortfolioAnnouncement[]>(
    []
  )

  /** Bulk employee import scoped to a single company (PORT-21). */
  const runImport = useCallback(
    (companyId: string, fileName: string) => {
      const company = COMPANY_BY_ID[companyId]
      const file = fileName.trim()
      if (!company || !file) return
      // Deterministic mock outcome derived from the company size.
      const rowsProcessed = Math.max(12, Math.floor(company.headcount / 7))
      const rowsSkipped = rowsProcessed % 5
      const run: ImportRun = {
        id: shortId('imp'),
        companyId,
        fileName: file,
        rowsProcessed,
        rowsSkipped,
        timestamp: stamp(),
      }
      setImports((prev) => [run, ...prev])
      record({
        eventType: 'BULK_IMPORT',
        companiesAffected: [company.name],
        parameters: `${file} — ${rowsProcessed} rows processed, ${rowsSkipped} skipped (scoped to ${company.name})`,
        status: 'success',
      })
      toast.success(
        `Import processed for ${company.name} — ${rowsProcessed} rows`
      )
    },
    [record]
  )

  /** Standardized policy pushed to multiple companies (PORT-23). */
  const deployPolicy = useCallback(
    (policy: string, companyIds: string[]) => {
      if (companyIds.length === 0) return
      // Deterministic per-company outcome: Zephyr Retail (co-06) simulates a
      // configuration conflict so the failure path is visible.
      const results: DeploymentResult[] = companyIds.map((companyId) =>
        companyId === 'co-06'
          ? {
              companyId,
              status: 'failure',
              detail: 'Configuration version conflict — retry required',
            }
          : { companyId, status: 'success', detail: 'Policy applied' }
      )
      const run: DeploymentRun = {
        id: shortId('dep'),
        policy,
        timestamp: stamp(),
        results,
      }
      setDeployments((prev) => [run, ...prev])
      const ok = results.filter((r) => r.status === 'success').length
      record({
        eventType: 'POLICY_DEPLOYED',
        companiesAffected: companyIds.map(companyName),
        parameters: `${policy} — ${ok}/${results.length} companies succeeded`,
        status: ok === results.length ? 'success' : 'failure',
      })
      if (ok === results.length) {
        toast.success(`${policy} deployed to ${ok} companies`)
      } else {
        toast.warning(
          `${policy} deployed — ${ok}/${results.length} succeeded, see per-company results`
        )
      }
    },
    [record]
  )

  /** Portfolio-wide announcement broadcast to every company (PORT-24). */
  const publishAnnouncement = useCallback(
    (title: string, message: string, companyIds: string[]) => {
      const announcement: PortfolioAnnouncement = {
        id: shortId('ann'),
        title: title.trim(),
        message: message.trim(),
        companyIds,
        publishedAt: stamp(),
      }
      setAnnouncements((prev) => [announcement, ...prev])
      record({
        eventType: 'ANNOUNCEMENT_PUBLISHED',
        companiesAffected: companyIds.map(companyName),
        parameters: `"${announcement.title}" — portfolio-wide broadcast to ${companyIds.length} companies`,
        status: 'success',
      })
      toast.success(`Announcement published to ${companyIds.length} companies`)
    },
    [record]
  )

  /** Report export limited to row-level-security-permitted companies (PORT-20). */
  const exportReport = useCallback(
    (format: 'Excel' | 'PDF', companyNames: string[]) => {
      record({
        eventType: 'REPORT_EXPORTED',
        companiesAffected: companyNames,
        parameters: `Consolidated portfolio report — ${format} export (${companyNames.length} companies, RLS applied)`,
        status: 'success',
      })
      toast.success(
        `Report exported to ${format} — only row-level-security-permitted companies included`
      )
    },
    [record]
  )

  /** Cross-company employee search is always audited (PORT-22, §7.2). */
  const logSearch = useCallback(
    (query: string, companyNames: string[], resultCount: number) => {
      record({
        eventType: 'EMPLOYEE_SEARCH',
        companiesAffected: companyNames,
        parameters: `Cross-company search "${query || '*'}" — ${resultCount} result(s) within authorized scope`,
        status: 'success',
      })
    },
    [record]
  )

  return {
    imports,
    deployments,
    announcements,
    runImport,
    deployPolicy,
    publishAnnouncement,
    exportReport,
    logSearch,
  }
}

export type PortfolioOpsStore = ReturnType<typeof usePortfolioOps>
