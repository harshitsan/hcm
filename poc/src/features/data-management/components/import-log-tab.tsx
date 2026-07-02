import { useMemo, useState } from 'react'
import { ArrowClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type DataJob } from '../data/jobs'
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
}

/**
 * Persistent Import Data Log: every past import with Module, Function,
 * Import Date and Time, Imported By and its All/Success/Failed/Skipped
 * counts, with refresh and pagination (DM-26 / DM-29 / DM-30).
 */
export function ImportLogTab({ jobs, onOpenJob }: ImportLogTabProps) {
  const [page, setPage] = useState(0)

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

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Import Data Log ({imports.length})
        </h2>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          aria-label='Refresh log'
          onClick={() => {
            setPage(0)
            toast.success('Import log refreshed with the latest entries')
          }}
        >
          <ArrowClockwise size={16} weight='bold' />
        </Button>
      </div>

      <div className='overflow-hidden rounded-[6px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Import Date and Time</TableHead>
              <TableHead>Imported By</TableHead>
              <TableHead>All / Success / Failed / Skipped</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((job) => (
              <TableRow
                key={job.id}
                className='cursor-pointer'
                onClick={() => onOpenJob(job)}
              >
                <TableCell className='text-sm'>{job.module}</TableCell>
                <TableCell className='text-sm'>{job.functionName}</TableCell>
                <TableCell className='text-sm'>
                  {dateTimeFmt.format(new Date(job.submittedAt))}
                </TableCell>
                <TableCell className='text-sm'>{job.submittedBy}</TableCell>
                <TableCell className='text-sm whitespace-nowrap'>
                  <span className='text-neutral-1900'>{job.totalRecords}</span>
                  <span className='text-neutral-1000'> / </span>
                  <span className='text-green-1300'>{job.successRecords}</span>
                  <span className='text-neutral-1000'> / </span>
                  <span className='text-red-1400'>{job.failedRecords}</span>
                  <span className='text-neutral-1000'> / </span>
                  <span className='text-neutral-1900'>
                    {job.skippedRecords}
                  </span>
                </TableCell>
                <TableCell>
                  <JobStatusBadge
                    status={job.status}
                    rolledBack={job.rolledBack}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
    </div>
  )
}
