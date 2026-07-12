import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
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
  fileName?: string
  totalRecords: number
  submittedBy: string
}

const FAILURE_REASONS = [
  'Referenced parent master does not exist (referential integrity)',
  'Overlapping effective-dated rows for the same entity',
  'Company id outside the authorized tenant scope — row rejected (RLS)',
  'Number series value collides with an existing sequence value',
  "Invalid date '31-02-2025' — the value is not a real calendar date",
]

const WARNING_REASONS = [
  "'Engineering' department not found — will be created",
  "Location left blank — head office 'Hyderabad HQ' assumed",
  "Designation 'Sr. Executive' mapped to 'Senior Executive'",
]

export interface ValidationOutcome {
  success: number
  failed: number
  skipped: number
  /** Rows that import fine but carry a note (subset of success). */
  warnings: number
  records: RecordResult[]
}

/**
 * Deterministic mock of pre-import validation: produces record-level
 * OK / Warning / Error / Skipped outcomes plus a sample of rows with
 * messages (FR 6.24.4).
 */
export function simulateValidation(draft: {
  totalRecords: number
  duplicateHandling: DuplicateHandling
  entity: string
  documentsZip?: string
}): ValidationOutcome {
  const total = draft.totalRecords
  const failed = Math.max(total >= 25 ? Math.round(total * 0.06) : 0, 0)
  const skipped =
    draft.duplicateHandling === 'Ignore duplicates' && total >= 20
      ? Math.round(total * 0.05)
      : 0
  const warnings = total >= 15 ? Math.round(total * 0.04) : 0
  const success = total - failed - skipped

  const records: RecordResult[] = []
  const sample = Math.min(total, 12)
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
    } else if (warnings > 0 && (i === 2 || i === 9)) {
      records.push({
        row,
        key,
        outcome: 'warning',
        reason: WARNING_REASONS[i % WARNING_REASONS.length],
      })
    } else {
      records.push({ row, key, outcome: 'success' })
    }
  }
  return { success, failed, skipped, warnings, records }
}

/** How long the animated In-progress phase runs (ms). */
const PROGRESS_DURATION = 3200
const PROGRESS_TICK = 200

/**
 * In-memory import/export job store. Submitted jobs progress through
 * Submitted → Validating → In-progress (animated progress bar) → terminal
 * state on timers to mock real-time status tracking (FR 6.24.6); a toast
 * stands in for the platform notification engine on terminal transitions
 * (DM-19). Mutations are published to the central audit trail.
 */
export function useDataJobs() {
  const [jobs, setJobs] = useState<DataJob[]>(seedJobs)
  const jobsRef = useRef(jobs)
  jobsRef.current = jobs
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervals = useRef<ReturnType<typeof setInterval>[]>([])

  useEffect(() => {
    const pendingTimers = timers.current
    const pendingIntervals = intervals.current
    return () => {
      pendingTimers.forEach(clearTimeout)
      pendingIntervals.forEach(clearInterval)
    }
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

  /**
   * Animates In-progress with a progress bar over a few seconds, then
   * lands the job on its terminal status.
   */
  const runProgress = useCallback(
    (id: string, onDone: () => void, startAt = 0) => {
      const started = Date.now()
      const interval = setInterval(() => {
        const pct = Math.min(
          100,
          startAt +
            Math.round(((Date.now() - started) / PROGRESS_DURATION) * (100 - startAt))
        )
        patchJob(id, { status: 'In-progress', progress: pct })
        if (pct >= 100) {
          clearInterval(interval)
          onDone()
        }
      }, PROGRESS_TICK)
      intervals.current.push(interval)
    },
    [patchJob]
  )

  // Animate the in-flight seeds to completion so the live progression is
  // visible on first load (Submitted → Validating → In-progress → done).
  // All deps are stable, so this runs once per mount; the unmount cleanup
  // clears any timers a StrictMode replay left behind.
  useEffect(() => {
    for (const job of seedJobs) {
      if (['Completed', 'Failed', 'Partially completed', 'Rolled back'].includes(job.status))
        continue
      const finish = () => {
        patchJob(job.id, {
          status: 'Completed',
          progress: undefined,
          finishedAt: new Date().toISOString(),
        })
        notifyTerminal(job, 'Completed')
      }
      if (job.status === 'In-progress') {
        runProgress(job.id, finish, job.progress ?? 0)
      } else {
        schedule(() => patchJob(job.id, { status: 'Validating' }), 1500)
        schedule(() => runProgress(job.id, finish), 3000)
      }
    }
  }, [notifyTerminal, patchJob, runProgress, schedule])

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
        id: `JOB-${1044 + Math.floor(Math.random() * 900)}`,
        kind: 'import',
        ...draft,
        // Atomic batches reject every record on any failure (FR 6.24.5).
        successRecords: failedBatch ? 0 : outcome.success,
        failedRecords: failedBatch ? draft.totalRecords : outcome.failed,
        skippedRecords: failedBatch ? 0 : outcome.skipped,
        warningRecords: failedBatch ? 0 : outcome.warnings,
        status: 'Submitted',
        rolledBack: failedBatch,
        records: outcome.records,
        submittedAt: new Date().toISOString(),
      }
      setJobs((prev) => [job, ...prev])
      publishAuditEvent({
        module: 'Data Management',
        action: draft.staging
          ? 'Sandbox validation submitted'
          : 'Import submitted',
        actor: draft.submittedBy,
        actionType: 'create',
        recordId: job.id,
        recordName: `${draft.entity} import — ${draft.fileName}`,
      })
      schedule(() => patchJob(job.id, { status: 'Validating' }), 1200)
      schedule(
        () =>
          runProgress(job.id, () => {
            patchJob(job.id, {
              status: terminal,
              progress: undefined,
              finishedAt: new Date().toISOString(),
            })
            notifyTerminal(job, terminal)
            if (failedBatch) {
              toast.error(
                `Job ${job.id}: import failed — no records were created (atomic batch).`
              )
            }
          }),
        2600
      )
      return job
    },
    [notifyTerminal, patchJob, runProgress, schedule]
  )

  const submitExport = useCallback(
    (draft: ExportDraft) => {
      const job: DataJob = {
        id: `JOB-${1044 + Math.floor(Math.random() * 900)}`,
        kind: 'export',
        module: draft.module,
        functionName: draft.functionName,
        entity: draft.entity,
        tier: draft.tier,
        companyId: draft.companyId,
        companyName: draft.companyName,
        format: draft.format,
        fileName:
          draft.fileName ??
          `${draft.entity.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.${draft.format.toLowerCase()}`,
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
      publishAuditEvent({
        module: 'Data Management',
        action: 'Export submitted',
        actor: draft.submittedBy,
        actionType: 'create',
        recordId: job.id,
        recordName: `${draft.entity} export — ${job.fileName}`,
      })
      schedule(
        () =>
          runProgress(job.id, () => {
            patchJob(job.id, {
              status: 'Completed',
              progress: undefined,
              finishedAt: new Date().toISOString(),
            })
            notifyTerminal(job, 'Completed')
          }),
        1200
      )
      return job
    },
    [notifyTerminal, patchJob, runProgress, schedule]
  )

  /**
   * Transactional rollback of a failed/partial import (FR 6.24.5): the
   * batch status flips to Rolled back and the action is audited.
   */
  const rollbackJob = useCallback(
    (id: string, actor?: string) => {
      const job = jobsRef.current.find((j) => j.id === id)
      patchJob(id, { rolledBack: true, status: 'Rolled back' })
      publishAuditEvent({
        module: 'Data Management',
        action: 'Import rolled back',
        actor: actor ?? job?.submittedBy ?? 'Administrator',
        actionType: 'status-change',
        recordId: id,
        recordName: job ? `${job.entity} import — ${job.fileName}` : id,
      })
      toast.success(
        job
          ? `Job ${id} rolled back — the ${job.successRecords.toLocaleString('en-US')} records created by this import were removed.`
          : `Job ${id} rolled back — data restored to its exact pre-import state.`
      )
    },
    [patchJob]
  )

  /** Re-import only the corrected (previously failed) records (DM-13). */
  const reimportCorrected = useCallback(
    (source: DataJob, submittedBy: string) => {
      const job: DataJob = {
        ...source,
        id: `JOB-${1044 + Math.floor(Math.random() * 900)}`,
        fileName: source.fileName.replace(/(\.[a-z]+)$/i, '_corrected$1'),
        totalRecords: source.failedRecords,
        successRecords: source.failedRecords,
        failedRecords: 0,
        skippedRecords: 0,
        warningRecords: 0,
        status: 'Submitted',
        progress: undefined,
        finishedAt: undefined,
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
      schedule(
        () =>
          runProgress(job.id, () => {
            patchJob(job.id, {
              status: 'Completed',
              progress: undefined,
              finishedAt: new Date().toISOString(),
            })
            toast.success(
              `Job ${job.id} completed — ${job.totalRecords} corrected records imported without duplicating prior successes.`
            )
          }),
        2400
      )
      return job
    },
    [patchJob, runProgress, schedule]
  )

  return { jobs, submitImport, submitExport, rollbackJob, reimportCorrected }
}
