import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Requisition } from '../data/requisitions'
import type { BulkFileResult } from '../hooks/use-candidates'

interface QueuedFile {
  name: string
  size: number
}

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisitions: Requisition[]
  onProcess: (
    files: QueuedFile[],
    requisitionId: string,
    requisitionTitle: string
  ) => BulkFileResult[]
}

/**
 * Bulk resume upload against a target requisition (TA-33) — queue with
 * per-file name/size/progress, department filter for the target picker, and
 * per-file success/failure results.
 */
export function BulkUploadDialog({
  open,
  onOpenChange,
  requisitions,
  onProcess,
}: BulkUploadDialogProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [target, setTarget] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [results, setResults] = useState<BulkFileResult[] | null>(null)

  const openReqs = useMemo(
    () =>
      requisitions.filter(
        (r) =>
          ['approved', 'sourcing'].includes(r.status) &&
          (deptFilter === 'all' || r.department === deptFilter)
      ),
    [requisitions, deptFilter]
  )
  const departments = [...new Set(requisitions.map((r) => r.department))]

  const reset = () => {
    setQueue([])
    setResults(null)
    setTarget('')
  }

  const process = () => {
    const req = requisitions.find((r) => r.id === target)
    if (!req || queue.length === 0) return
    setResults(onProcess(queue, req.id, req.title))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Bulk resume upload</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='mb-1 text-sm font-medium'>Filter by department</p>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className='mb-1 text-sm font-medium'>Target requisition</p>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select open requisition' />
                </SelectTrigger>
                <SelectContent>
                  {openReqs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.id} — {r.title} ({r.location}, {r.headcount} openings,
                      closes {r.closingDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className='mb-1 text-sm font-medium'>
              Select resume files (multiple / folder)
            </p>
            <Input
              type='file'
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).map((f) => ({
                  name: f.name,
                  size: f.size,
                }))
                setQueue(files)
                setResults(null)
              }}
            />
          </div>

          {queue.length > 0 && (
            <div className='max-h-[220px] space-y-1 overflow-y-auto rounded border border-gray-200 p-2'>
              {queue.map((f) => {
                const result = results?.find((r) => r.file === f.name)
                return (
                  <div
                    key={f.name}
                    className='flex items-center justify-between gap-2 text-sm'
                  >
                    <span className='text-neutral-1900 min-w-0 truncate'>
                      {f.name}{' '}
                      <span className='text-neutral-1000 text-paragraph-sm'>
                        ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                    {result ? (
                      result.ok ? (
                        <Badge variant='completed'>Imported</Badge>
                      ) : (
                        <Badge variant='dropped'>{result.reason}</Badge>
                      )
                    ) : (
                      <Badge variant='pending'>Queued</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {results && (
            <p className='text-paragraph-sm text-neutral-1000'>
              {results.filter((r) => r.ok).length} of {results.length} resumes
              parsed and linked as candidates to {target}. Failed rows are
              flagged with a reason.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={!target || queue.length === 0 || !!results} onClick={process}>
            Process queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
