import { toast } from 'sonner'
import { downloadFile, toCsv } from '../data/files'
import { type DataJob, type RecordResult } from '../data/jobs'

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

  const csv = toCsv(
    ['Job Id', 'Row', 'Record Key', 'Entity', 'Outcome', 'Reason'],
    rows.map((r) => [job.id, r.row, r.key, job.entity, r.outcome, r.reason ?? ''])
  )
  downloadFile(`${job.id.toLowerCase()}-error-report.csv`, csv, 'text/csv')
  toast.success(
    `Error report for ${job.id} downloaded — ${rows.length} record${rows.length === 1 ? '' : 's'} (CSV)`
  )
}

/**
 * Downloads the record-level results of a sandbox validation run as a real
 * CSV, before anything is committed (row, record key, result, message).
 */
export function downloadValidationReportCsv(
  entity: string,
  records: RecordResult[]
) {
  if (records.length === 0) {
    toast.info('Run validation first — there are no results to download yet')
    return
  }
  const label: Record<RecordResult['outcome'], string> = {
    success: 'OK',
    warning: 'Warning',
    failed: 'Error',
    skipped: 'Skipped',
  }
  const csv = toCsv(
    ['Row', 'Record Key', 'Result', 'Message'],
    records.map((r) => [r.row, r.key, label[r.outcome], r.reason ?? ''])
  )
  downloadFile(
    `${entity.toLowerCase().replace(/\s+/g, '-')}-validation-report.csv`,
    csv,
    'text/csv'
  )
  toast.success(
    `Validation report downloaded — ${records.length} record${records.length === 1 ? '' : 's'} (CSV)`
  )
}
