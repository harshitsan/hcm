import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Tier } from '../data/catalog'
import { type DataJob } from '../data/jobs'
import { JobStatusBadge, OutcomeBadge, TierBadge } from './badges'
import { downloadErrorReportCsv } from './error-report'
import { ADMIN_ROLES } from './scope'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function infoRows(job: DataJob): [string, string][] {
  const rows: [string, string][] = [
    ['Type', job.kind === 'import' ? 'Import' : 'Export'],
    ['Module / Function', `${job.module} / ${job.functionName}`],
    ['Company (tenant scope)', job.companyName],
    ['Format', `${job.format} · ${job.fileSizeMb} MB`],
  ]
  if (job.duplicateHandling) rows.push(['Duplicates', job.duplicateHandling])
  if (job.processType) rows.push(['Process type', job.processType])
  if (job.documentsZip) rows.push(['Documents zip', job.documentsZip])
  rows.push([
    'Submitted',
    `${dateTimeFmt.format(new Date(job.submittedAt))} by ${job.submittedBy}`,
  ])
  return rows
}

interface JobDetailOverlayProps {
  job: DataJob | null
  onOpenChange: (open: boolean) => void
  onRollback: (id: string) => void
  onReimport: (job: DataJob) => void
}

/**
 * Record-level job results: success/failure per record with reasons,
 * All/Success/Failed/Skipped counts, error-report download, transactional
 * rollback and re-import of corrected records
 * (DM-07 / DM-08 / DM-13 / DM-26).
 */
export function JobDetailOverlay({
  job,
  onOpenChange,
  onRollback,
  onReimport,
}: JobDetailOverlayProps) {
  const { hasRole } = useRole()
  const isAdmin = hasRole(...ADMIN_ROLES)
  const terminal =
    job && ['Completed', 'Failed', 'Partially completed'].includes(job.status)
  const hasFailures = Boolean(job && job.failedRecords > 0)

  return (
    <Sheet open={Boolean(job)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[640px]'>
        {job && (
          <>
            <SheetHeader className='border-gray-200 border-b px-5 py-4'>
              <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
                {job.id} — {job.fileName}
                <JobStatusBadge
                  status={job.status}
                  rolledBack={job.rolledBack}
                />
              </SheetTitle>
            </SheetHeader>

            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='overflow-hidden rounded-[6px] border border-gray-200'>
                {infoRows(job).map(([label, value]) => (
                  <div
                    key={label}
                    className='grid grid-cols-[170px_1fr] gap-2 border-b border-gray-100 px-3 py-1.5 text-sm last:border-b-0'
                  >
                    <span className='text-neutral-1000'>{label}</span>
                    <span className='text-neutral-1600'>{value}</span>
                  </div>
                ))}
                <div className='grid grid-cols-[170px_1fr] items-center gap-2 px-3 py-1.5 text-sm'>
                  <span className='text-neutral-1000'>Entity / tier</span>
                  <span className='flex items-center gap-2'>
                    {job.entity} <TierBadge tier={job.tier as Tier} />
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-4 gap-2 text-center'>
                {(
                  [
                    ['All Records', job.totalRecords],
                    ['Success', job.successRecords],
                    ['Failed', job.failedRecords],
                    ['Skipped', job.skippedRecords],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className='rounded-[6px] border border-gray-200 px-2 py-1.5'
                  >
                    <div className='text-paragraph-sm text-neutral-1000'>
                      {label}
                    </div>
                    <div className='text-neutral-1600 text-lg font-medium'>
                      {value.toLocaleString('en-US')}
                    </div>
                  </div>
                ))}
              </div>

              {job.staging && (
                <p className='bg-blue-150 text-blue-1400 rounded-[6px] px-3 py-2 text-sm'>
                  Staging validation only — no records were committed to
                  production.
                </p>
              )}
              {job.rolledBack && (
                <p className='text-neutral-1900 rounded-[6px] bg-neutral-200 px-3 py-2 text-sm'>
                  Rolled back: data reflects the exact state prior to this
                  import.
                </p>
              )}

              {job.records.length > 0 && (
                <div>
                  <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                    Record-level results (sample)
                  </h3>
                  <div className='max-h-[260px] overflow-y-auto rounded-[6px] border border-gray-200'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-14'>Row</TableHead>
                          <TableHead>Record key</TableHead>
                          <TableHead className='w-24'>Result</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.records.map((r) => (
                          <TableRow key={`${r.row}-${r.key}`}>
                            <TableCell className='text-sm'>{r.row}</TableCell>
                            <TableCell className='font-mono text-xs'>
                              {r.key}
                            </TableCell>
                            <TableCell>
                              <OutcomeBadge outcome={r.outcome} />
                            </TableCell>
                            <TableCell className='text-paragraph-sm text-neutral-1900'>
                              {r.reason ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className='border-gray-200 flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4'>
              {terminal && job.kind === 'export' && (
                <Button
                  variant='outline'
                  onClick={() =>
                    toast.success(
                      `${job.fileName} downloaded (${job.format}, tenant-scoped)`
                    )
                  }
                >
                  Download output file
                </Button>
              )}
              {terminal && hasFailures && (
                <Button
                  variant='outline'
                  onClick={() => downloadErrorReportCsv(job)}
                >
                  Download error report
                </Button>
              )}
              {isAdmin &&
                terminal &&
                hasFailures &&
                job.kind === 'import' &&
                !job.rolledBack && (
                  <Button
                    variant='outline'
                    onClick={() => onRollback(job.id)}
                    className='text-red-1400'
                  >
                    Roll back import
                  </Button>
                )}
              {isAdmin && terminal && hasFailures && job.kind === 'import' && (
                <Button onClick={() => onReimport(job)}>
                  Re-import corrected records ({job.failedRecords})
                </Button>
              )}
            </div>
          </>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
