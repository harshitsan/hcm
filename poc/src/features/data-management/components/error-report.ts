import { toast } from 'sonner'
import { type DataJob, type RecordResult } from '../data/jobs'

function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/**
 * Builds and downloads the record-level error report for a job as a real
 * CSV file (row, record key, outcome, reason) from the simulated
 * validation outcomes (DM-08 / FR 6.24.4).
 */
export function downloadErrorReportCsv(job: DataJob) {
  // Atomic batches ('No records if error occurred') reject every record,
  // so rows that validated fine are reported as rejected too (FR 6.24.5).
  const atomicReject =
    job.processType === 'No records if error occurred' &&
    job.totalRecords > 0 &&
    job.failedRecords === job.totalRecords

  const rows: RecordResult[] = atomicReject
    ? job.records.map((r) =>
        r.outcome === 'failed'
          ? r
          : {
              ...r,
              outcome: 'failed' as const,
              reason:
                'Rejected: batch processed atomically — another record in the batch failed',
            }
      )
    : job.records.filter((r) => r.outcome !== 'success')

  if (rows.length === 0) {
    toast.info(`No record-level errors to report for ${job.id}`)
    return
  }

  const header = ['Job Id', 'Row', 'Record Key', 'Entity', 'Outcome', 'Reason']
  const lines = rows.map((r) =>
    [job.id, r.row, r.key, job.entity, r.outcome, r.reason ?? '']
      .map(csvCell)
      .join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${job.id.toLowerCase()}-error-report.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(
    `Error report for ${job.id} downloaded — ${rows.length} record${rows.length === 1 ? '' : 's'} (CSV)`
  )
}
