import { useMemo, useState } from 'react'
import { ArrowClockwise, ArrowCounterClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { LongText } from '@/components/common/long-text'
import { isAtomicBatch, type DataJob } from '../data/jobs'
import { JobStatusBadge } from './badges'

const PAGE_SIZE = 8

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface ImportLogTabProps {
  jobs: DataJob[]
  onOpenJob: (job: DataJob) => void
  onRollback: (job: DataJob) => void
}

/**
 * Persistent import history: every batch with entity, file, record counts,
 * status, started/finished times and actor — plus transactional rollback
 * for Failed/Partial batches (DM-26 / DM-29 / DM-30 / FR 6.24.5).
 */
export function ImportLogTab({ jobs, onOpenJob, onRollback }: ImportLogTabProps) {
  const [page, setPage] = useState(0)
  const [rollbackTarget, setRollbackTarget] = useState<DataJob | null>(null)

  const imports = useMemo(
    () =>
      jobs
        .filter((j) => j.kind === 'import')
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [jobs]
  )

  const pageCount = Math.max(1, Math.ceil(imports.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const rows = imports.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )
  const rangeStart = imports.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, imports.length)

  const canRollBack = (job: DataJob) =>
    !job.rolledBack &&
    ['Failed', 'Partially completed'].includes(job.status) &&
    job.successRecords + job.failedRecords > 0

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Import History ({imports.length})
        </h2>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Refresh history'
          onClick={() => {
            setPage(0)
            toast.success('Import history refreshed with the latest entries')
          }}
        >
          <ArrowClockwise size={16} weight='bold' />
        </Button>
      </div>

      <div className='overflow-hidden rounded-[6px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Records ok / failed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started / Finished</TableHead>
              <TableHead>Imported By</TableHead>
              <TableHead className='w-24'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((job) => (
              <TableRow
                key={job.id}
                className='cursor-pointer'
                onClick={() => onOpenJob(job)}
              >
                <TableCell className='text-sm'>
                  <div className='flex flex-col'>
                    <span className='text-neutral-1600 flex items-center gap-1.5 font-medium'>
                      {job.entity}
                      {isAtomicBatch(job) && (
                        <Badge variant='badge_inactive'>Atomic</Badge>
                      )}
                    </span>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {job.module} / {job.functionName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-sm'>
                  <LongText className='text-neutral-1900 max-w-[180px]'>
                    {job.fileName}
                  </LongText>
                </TableCell>
                <TableCell className='text-sm whitespace-nowrap'>
                  <span className='text-green-1300'>{job.successRecords}</span>
                  <span className='text-neutral-1000'> ok / </span>
                  <span className='text-red-1400'>{job.failedRecords}</span>
                  <span className='text-neutral-1000'> failed</span>
                </TableCell>
                <TableCell>
                  <JobStatusBadge
                    status={job.status}
                    rolledBack={job.rolledBack}
                  />
                  {isAtomicBatch(job) &&
                    job.status === 'Failed' &&
                    job.rolledBack && (
                      <span className='text-paragraph-sm text-neutral-1000 mt-0.5 block max-w-[200px]'>
                        Import failed — no records were created (atomic batch)
                      </span>
                    )}
                </TableCell>
                <TableCell className='text-sm'>
                  <div className='flex flex-col'>
                    <span className='text-neutral-1900'>
                      {dateTimeFmt.format(new Date(job.submittedAt))}
                    </span>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {job.finishedAt
                        ? `Finished ${dateTimeFmt.format(new Date(job.finishedAt))}`
                        : 'Running…'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-sm'>{job.submittedBy}</TableCell>
                <TableCell>
                  {canRollBack(job) && (
                    <Button
                      variant='outline'
                      className='text-red-1400 h-7 gap-1 rounded-[6px] px-2'
                      onClick={(e) => {
                        e.stopPropagation()
                        setRollbackTarget(job)
                      }}
                    >
                      <ArrowCounterClockwise size={12} weight='bold' />
                      Roll back
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-neutral-1000 py-8 text-center text-sm'
                >
                  No imports in your tenant scope yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='mt-3 flex items-center justify-between'>
        <span className='text-paragraph-sm text-neutral-1000'>
          Showing {rangeStart}–{rangeEnd} of {imports.length} imports
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            className='h-7 px-2'
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: pageCount }, (_, i) => (
            <Button
              key={i}
              variant={i === safePage ? 'default' : 'outline'}
              className='h-7 w-7 px-0'
              onClick={() => setPage(i)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant='outline'
            className='h-7 px-2'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
          <Button
            variant='outline'
            className='h-7 px-2'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(pageCount - 1)}
          >
            Last
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(rollbackTarget)}
        onOpenChange={(open) => {
          if (!open) setRollbackTarget(null)
        }}
        title={`Roll back ${rollbackTarget?.id}?`}
        desc={`This removes the ${rollbackTarget?.successRecords.toLocaleString('en-US')} records created by this import. Master data referenced by later imports cannot be removed — those rows will be reported.`}
        confirmText='Roll back'
        destructive
        handleConfirm={() => {
          if (rollbackTarget) onRollback(rollbackTarget)
          setRollbackTarget(null)
        }}
      />
    </div>
  )
}
