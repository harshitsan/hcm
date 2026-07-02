import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  type DuplicateHandling,
  type FileFormat,
  type ProcessType,
} from '../data/catalog'
import {
  seedJobs,
  type DataJob,
  type JobStatus,
  type RecordResult,
} from '../data/jobs'

export interface ImportDraft {
  module: string
  functionName: string
  entity: string
  tier: string
  companyId: string
  companyName: string
  format: FileFormat
  fileName: string
  fileSizeMb: number
  totalRecords: number
  duplicateHandling: DuplicateHandling
  processType: ProcessType
  staging: boolean
  preserveEffectiveDates: boolean
  documentsZip?: string
  submittedBy: string
}

export interface ExportDraft {
  entity: string
  tier: string
  module: string
  functionName: string
  companyId: string
  companyName: string
  format: FileFormat
  totalRecords: number
  submittedBy: string
}

const FAILURE_REASONS = [
  'Referenced parent master does not exist (referential integrity)',
  'Overlapping effective-dated rows for the same entity',
  'Company id outside the authorized tenant scope — row rejected (RLS)',
  'Number series value collides with an existing sequence value',
  'Value violates the target field type/format (record-level failure)',
]

/**
 * Deterministic mock of pre-import validation: produces record-level
 * success/failed/skipped outcomes plus a sample of rows with reasons.
 */
export function simulateValidation(draft: {
  totalRecords: number
  duplicateHandling: DuplicateHandling
  entity: string
  documentsZip?: string
}): {
  success: number
  failed: number
  skipped: number
  records: RecordResult[]
} {
  const total = draft.totalRecords
  const failed = Math.max(total >= 25 ? Math.round(total * 0.06) : 0, 0)
  const skipped =
    draft.duplicateHandling === 'Ignore duplicates' && total >= 20
      ? Math.round(total * 0.05)
      : 0
  const success = total - failed - skipped

  const records: RecordResult[] = []
  const sample = Math.min(total, 10)
  for (let i = 0; i < sample; i++) {
    const row = i + 2
    const key = `${draft.entity.toUpperCase().slice(0, 3)}-${1000 + i}`
    if (failed > 0 && (i === 3 || i === 7)) {
      const reason =
        draft.documentsZip && i === 7
          ? 'Referenced document missing from the uploaded zip archive'
          : FAILURE_REASONS[i % FAILURE_REASONS.length]
      records.push({ row, key, outcome: 'failed', reason })
    } else if (skipped > 0 && i === 5) {
      records.push({
        row,
        key,
        outcome: 'skipped',
        reason: 'Duplicate business key — existing record left unchanged',
      })
    } else {
      records.push({ row, key, outcome: 'success' })
    }
  }
  return { success, failed, skipped, records }
}

/**
 * In-memory import/export job store. Submitted jobs progress through
 * Submitted → Validating → In-progress → terminal state on timers to
 * mock real-time status tracking (FR 6.24.6); a toast stands in for the
 * platform notification engine on terminal transitions (DM-19).
 */
export function useDataJobs() {
  const [jobs, setJobs] = useState<DataJob[]>(seedJobs)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const patchJob = useCallback((id: string, patch: Partial<DataJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const notifyTerminal = useCallback((job: DataJob, status: JobStatus) => {
    if (status === 'Completed') {
      toast.success(
        `Job ${job.id} completed — ${job.entity} (${job.format}). Output file is ready to download.`
      )
    } else if (status === 'Failed') {
      toast.error(
        `Job ${job.id} failed — ${job.failedRecords} of ${job.totalRecords} records errored. Data rolled back; error report available.`
      )
    } else {
      toast.warning(
        `Job ${job.id} partially completed — ${job.successRecords} committed, ${job.failedRecords} failed, ${job.skippedRecords} skipped.`
      )
    }
  }, [])

  const submitImport = useCallback(
    (draft: ImportDraft) => {
      const outcome = simulateValidation(draft)
      const atomic = draft.processType === 'No records if error occurred'
      const failedBatch = atomic && outcome.failed > 0
      const terminal: JobStatus = draft.staging
        ? 'Completed'
        : failedBatch
          ? 'Failed'
          : outcome.failed > 0
            ? 'Partially completed'
            : 'Completed'

      const job: DataJob = {
        id: `JOB-${1042 + Math.floor(Math.random() * 900)}`,
        kind: 'import',
        ...draft,
        // Atomic batches reject every record on any failure (FR 6.24.5).
        successRecords: failedBatch ? 0 : outcome.success,
        failedRecords: failedBatch ? draft.totalRecords : outcome.failed,
        skippedRecords: failedBatch ? 0 : outcome.skipped,
        status: 'Submitted',
        rolledBack: failedBatch,
        records: outcome.records,
        submittedAt: new Date().toISOString(),
      }
      setJobs((prev) => [job, ...prev])
      schedule(() => patchJob(job.id, { status: 'Validating' }), 1200)
      schedule(() => patchJob(job.id, { status: 'In-progress' }), 2600)
      schedule(() => {
        patchJob(job.id, { status: terminal })
        notifyTerminal({ ...job, successRecords: job.successRecords }, terminal)
      }, 4200)
      return job
    },
    [notifyTerminal, patchJob, schedule]
  )

  const submitExport = useCallback(
    (draft: ExportDraft) => {
      const job: DataJob = {
        id: `JOB-${1042 + Math.floor(Math.random() * 900)}`,
        kind: 'export',
        module: draft.module,
        functionName: draft.functionName,
        entity: draft.entity,
        tier: draft.tier,
        companyId: draft.companyId,
        companyName: draft.companyName,
        format: draft.format,
        fileName: `${draft.entity.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.${draft.format.toLowerCase()}`,
        fileSizeMb: Math.max(0.1, Math.round(draft.totalRecords * 0.003)),
        totalRecords: draft.totalRecords,
        successRecords: draft.totalRecords,
        failedRecords: 0,
        skippedRecords: 0,
        status: 'Submitted',
        staging: false,
        submittedBy: draft.submittedBy,
        submittedAt: new Date().toISOString(),
        rolledBack: false,
        records: [],
      }
      setJobs((prev) => [job, ...prev])
      schedule(() => patchJob(job.id, { status: 'In-progress' }), 1200)
      schedule(() => {
        patchJob(job.id, { status: 'Completed' })
        notifyTerminal(job, 'Completed')
      }, 3000)
      return job
    },
    [notifyTerminal, patchJob, schedule]
  )

  /** Transactional rollback of a failed/partial import (FR 6.24.5). */
  const rollbackJob = useCallback(
    (id: string) => {
      patchJob(id, { rolledBack: true })
      toast.success(
        `Job ${id} rolled back — data restored to its exact pre-import state.`
      )
    },
    [patchJob]
  )

  /** Re-import only the corrected (previously failed) records (DM-13). */
  const reimportCorrected = useCallback(
    (source: DataJob, submittedBy: string) => {
      const job: DataJob = {
        ...source,
        id: `JOB-${1042 + Math.floor(Math.random() * 900)}`,
        fileName: source.fileName.replace(/(\.[a-z]+)$/i, '_corrected$1'),
        totalRecords: source.failedRecords,
        successRecords: source.failedRecords,
        failedRecords: 0,
        skippedRecords: 0,
        status: 'Submitted',
        rolledBack: false,
        submittedBy,
        submittedAt: new Date().toISOString(),
        records: source.records
          .filter((r) => r.outcome === 'failed')
          .map((r) => ({
            ...r,
            outcome: 'success' as const,
            reason: undefined,
          })),
      }
      setJobs((prev) => [job, ...prev])
      schedule(() => patchJob(job.id, { status: 'Validating' }), 1200)
      schedule(() => patchJob(job.id, { status: 'In-progress' }), 2400)
      schedule(() => {
        patchJob(job.id, { status: 'Completed' })
        toast.success(
          `Job ${job.id} completed — ${job.totalRecords} corrected records imported without duplicating prior successes.`
        )
      }, 3800)
      return job
    },
    [patchJob, schedule]
  )

  return { jobs, submitImport, submitExport, rollbackJob, reimportCorrected }
}
