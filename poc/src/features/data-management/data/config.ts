import {
  DATA_ENTITIES,
  IMPORT_FUNCTIONS,
  type FileFormat,
  type Tier,
} from './catalog'

/**
 * Versioned, effective-dated import/export configuration (DM-17).
 * The engine reads the latest effective version at runtime.
 */
export interface ConfigVersion {
  version: number
  effectiveFrom: string
  publishedBy: string
  formats: FileFormat[]
  maxFileSizeMb: number
  maxBatchRecords: number
  note: string
}

export const seedConfigVersions: ConfigVersion[] = [
  {
    version: 2,
    effectiveFrom: '2026-04-01',
    publishedBy: 'Platform Ops',
    formats: ['CSV', 'XLS', 'XLSX', 'JSON'],
    maxFileSizeMb: 50,
    maxBatchRecords: 10000,
    note: 'Added JSON format; aligned limits with FR 6.24.2',
  },
  {
    version: 1,
    effectiveFrom: '2026-01-01',
    publishedBy: 'Platform Ops',
    formats: ['CSV', 'XLS', 'XLSX'],
    maxFileSizeMb: 25,
    maxBatchRecords: 5000,
    note: 'Initial platform defaults',
  },
]

/** Per-tenant limit/format override (applies only within that tenant). */
export interface TenantOverride {
  id: string
  companyId: string
  companyName: string
  maxFileSizeMb: number
  maxBatchRecords: number
  note: string
}

export const seedOverrides: TenantOverride[] = [
  {
    id: 'ovr-01',
    companyId: 'co-06',
    companyName: 'Crestline Retail Co',
    maxFileSizeMb: 25,
    maxBatchRecords: 5000,
    note: 'Retail POS feeds throttled during migration',
  },
]

export type NotificationEvent = 'Completed' | 'Failed' | 'Partially completed'

/** Governed notification templates for async job events (DM-19). */
export interface NotificationTemplate {
  event: NotificationEvent
  subject: string
  body: string
}

export const seedTemplates: NotificationTemplate[] = [
  {
    event: 'Completed',
    subject: 'Import/export job {jobId} completed',
    body: 'Job {jobId} for {entity} ({format}) finished successfully. Download the output file from the job dashboard.',
  },
  {
    event: 'Failed',
    subject: 'Import job {jobId} failed',
    body: 'Job {jobId} for {entity} ({format}) failed. {failed} of {total} records errored — open the record-level error report for details. Data was rolled back to its pre-import state.',
  },
  {
    event: 'Partially completed',
    subject: 'Import job {jobId} partially completed',
    body: 'Job {jobId} for {entity} ({format}) committed {success} records; {failed} failed and {skipped} were skipped. Download the error report to correct and re-import only the failed records.',
  },
]

/** Import routing catalog governance (DM-32). */
export interface FunctionToggle {
  functionId: string
  enabled: boolean
  hiddenForCompanyIds: string[]
}

export const seedFunctionToggles: FunctionToggle[] = IMPORT_FUNCTIONS.map(
  (f) => ({
    functionId: f.id,
    enabled: f.id !== 'fn-salary',
    hiddenForCompanyIds: f.id === 'fn-employee-docs' ? ['co-07'] : [],
  })
)

/** Entity → dependency tier classification, governed as config (DM-17). */
export const seedTierMap: Record<string, Tier> = Object.fromEntries(
  DATA_ENTITIES.map((e) => [e.id, e.tier])
) as Record<string, Tier>
