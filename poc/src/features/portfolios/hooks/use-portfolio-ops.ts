import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  type UploadErrorDetail,
  type UploadResult,
} from '@/components/common/upload-modal'
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

/** Deterministic dry-run rejections surfaced row-by-row in the UploadModal. */
const IMPORT_ERROR_TEMPLATES: Omit<UploadErrorDetail, 'row'>[] = [
  {
    fieldName: 'Email',
    reason: 'Duplicate email — an active employee record already uses it',
  },
  {
    fieldName: 'Company code',
    reason: 'Row belongs to another company — import is scoped to one company (PORT-21)',
  },
  {
    fieldName: 'Joining date',
    reason: 'Invalid date format — expected YYYY-MM-DD',
  },
  {
    fieldName: 'Department',
    reason: 'Unknown department code — no match in the target company',
  },
]

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

  /**
   * Bulk employee import scoped to a single company (PORT-21), run through
   * the sanctioned UploadModal framework: the uploaded file is staged, every
   * staged row is validated, the dry-run reports row-level errors and only
   * clean rows commit — the run is audited either way.
   */
  const importEmployees = useCallback(
    async (companyId: string, file: File): Promise<UploadResult> => {
      const company = COMPANY_BY_ID[companyId]
      if (!company) {
        toast.error('Select a target company before importing')
        return { state: 'failed', progress: 0 }
      }
      // Staging: rows parsed out of the uploaded file (mock batch — the POC
      // has no backend, so the staged content is deterministic per company).
      const rowsStaged = Math.max(12, Math.floor(company.headcount / 7))
      const rejected: UploadErrorDetail[] = IMPORT_ERROR_TEMPLATES.slice(
        0,
        rowsStaged % 5
      ).map((template, i) => ({ row: 3 + i * 4, ...template }))

      // Validate + dry-run: simulate the round-trip before committing.
      await new Promise((resolve) => setTimeout(resolve, 900))
      const rowsCommitted = rowsStaged - rejected.length

      const run: ImportRun = {
        id: shortId('imp'),
        companyId,
        fileName: file.name,
        rowsProcessed: rowsCommitted,
        rowsSkipped: rejected.length,
        timestamp: stamp(),
      }
      setImports((prev) => [run, ...prev])
      record({
        eventType: 'BULK_IMPORT',
        companiesAffected: [company.name],
        parameters: `${file.name} — ${rowsStaged} rows staged, dry-run committed ${rowsCommitted}, rejected ${rejected.length} (scoped to ${company.name})`,
        status: rejected.length === 0 ? 'success' : 'failure',
      })
      if (rejected.length === 0) {
        toast.success(
          `Import committed for ${company.name} — ${rowsCommitted} rows`
        )
      } else {
        toast.warning(
          `${file.name}: ${rowsStaged} rows staged — dry-run committed ${rowsCommitted}, rejected ${rejected.length} with row-level errors`
        )
      }
      return {
        state: rejected.length === 0 ? 'success' : 'partial',
        successCount: rowsCommitted,
        failedCount: rejected.length,
        errors: rejected,
      }
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
    importEmployees,
    deployPolicy,
    publishAnnouncement,
    exportReport,
    logSearch,
  }
}

export type PortfolioOpsStore = ReturnType<typeof usePortfolioOps>
