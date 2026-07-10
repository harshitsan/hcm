import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DEPARTMENTS,
  EXPERIENCE_BY_LEVEL,
  HIRING_AS,
  LOCATIONS,
  POSITION_LEVELS,
  REQUISITION_PRIORITIES,
} from '../data/requisitions'
import type {
  BulkRequisitionInput,
  RequisitionsStore,
} from '../hooks/use-requisitions'

const emptyRow: BulkRequisitionInput = {
  title: '',
  department: 'Engineering',
  positionLevel: 'Mid',
  headcount: 1,
  closingDate: '',
  priority: 'Low',
  location: 'Bengaluru',
  hiringAs: 'New Join',
  functionalLocation: '',
  reasonForHiring: '',
}

interface BulkRequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: RequisitionsStore
}

/**
 * Bulk requisition entry (Transactions → Resource Requisition): stage
 * multiple RRFs in a grid and submit them in one shot, optionally
 * self-approved with a mandatory supporting document.
 */
export function BulkRequisitionDialog({
  open,
  onOpenChange,
  store,
}: BulkRequisitionDialogProps) {
  const [row, setRow] = useState<BulkRequisitionInput>(emptyRow)
  const [rows, setRows] = useState<BulkRequisitionInput[]>([])
  // "I am the approver" → auto-approve on submit with a mandatory document.
  const [selfApprove, setSelfApprove] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [documentName, setDocumentName] = useState('')

  const set = <K extends keyof BulkRequisitionInput>(
    key: K,
    value: BulkRequisitionInput[K]
  ) => setRow((prev) => ({ ...prev, [key]: value }))

  const reset = () => {
    setRow(emptyRow)
    setRows([])
    setSelfApprove(false)
    setApproverName('')
    setDocumentName('')
  }

  const stageRow = () => {
    if (row.title.trim().length < 3) {
      toast.error('Position title is required')
      return
    }
    if (!row.closingDate) {
      toast.error('Closing date is required')
      return
    }
    if (!row.reasonForHiring.trim()) {
      toast.error('Reason for hiring is required')
      return
    }
    setRows((prev) => [...prev, { ...row, title: row.title.trim() }])
    setRow(emptyRow)
  }

  const submit = () => {
    if (rows.length === 0) {
      toast.error('Add at least one requisition row before submitting')
      return
    }
    if (selfApprove && !approverName.trim()) {
      toast.error('Approver name is required for self-approval')
      return
    }
    if (selfApprove && !documentName.trim()) {
      toast.error('Supporting document is mandatory for self-approval')
      return
    }
    store.addRequisitions(rows, selfApprove, approverName.trim() || undefined)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className='sm:max-w-[720px]'>
        <DialogHeader>
          <DialogTitle>Create bulk requisition</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          {/* Entry form */}
          <div className='space-y-3 rounded-[8px] border border-gray-200 bg-white p-3'>
            <div className='grid grid-cols-3 gap-3'>
              <div>
                <p className='mb-1 text-sm font-medium'>Department</p>
                <Select
                  value={row.department}
                  onValueChange={(v) =>
                    set('department', v as BulkRequisitionInput['department'])
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Position title</p>
                <Input
                  placeholder='e.g. Backend Engineer'
                  value={row.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Position level</p>
                <Select
                  value={row.positionLevel}
                  onValueChange={(v) =>
                    set('positionLevel', v as BulkRequisitionInput['positionLevel'])
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l} ({EXPERIENCE_BY_LEVEL[l]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div>
                <p className='mb-1 text-sm font-medium'>Number of vacancies</p>
                <Input
                  type='number'
                  min={1}
                  value={row.headcount}
                  onChange={(e) =>
                    set('headcount', Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Closing date</p>
                <Input
                  type='date'
                  value={row.closingDate}
                  onChange={(e) => set('closingDate', e.target.value)}
                />
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Priority</p>
                <Select
                  value={row.priority}
                  onValueChange={(v) =>
                    set('priority', v as BulkRequisitionInput['priority'])
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUISITION_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div>
                <p className='mb-1 text-sm font-medium'>Work location</p>
                <Select
                  value={row.location}
                  onValueChange={(v) =>
                    set('location', v as BulkRequisitionInput['location'])
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Hiring as</p>
                <Select
                  value={row.hiringAs}
                  onValueChange={(v) =>
                    set('hiringAs', v as BulkRequisitionInput['hiringAs'])
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HIRING_AS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Functional location</p>
                <Input
                  placeholder='e.g. Platform Engineering'
                  value={row.functionalLocation}
                  onChange={(e) => set('functionalLocation', e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className='mb-1 text-sm font-medium'>Reason for hiring</p>
              <Input
                placeholder='e.g. H2 pipeline expansion'
                value={row.reasonForHiring}
                onChange={(e) => set('reasonForHiring', e.target.value)}
              />
            </div>

            <div className='flex items-center gap-2'>
              <Button variant='outline' className='h-7' onClick={stageRow}>
                Add
              </Button>
              <Button
                variant='outline'
                className='h-7'
                onClick={() => setRow(emptyRow)}
              >
                Add New Record
              </Button>
            </div>
          </div>

          {/* Staged rows grid */}
          {rows.length > 0 && (
            <div className='rounded-[8px] border border-gray-200 bg-white'>
              <div className='text-neutral-1000 text-paragraph-sm grid grid-cols-[1fr_100px_70px_90px_60px_28px] gap-2 border-b border-gray-200 px-3 py-1.5'>
                <span>Position</span>
                <span>Department</span>
                <span>Level</span>
                <span>Closing</span>
                <span>Priority</span>
                <span />
              </div>
              {rows.map((r, i) => (
                <div
                  key={i}
                  className='grid grid-cols-[1fr_100px_70px_90px_60px_28px] items-center gap-2 border-b border-gray-200 px-3 py-1.5 text-sm last:border-b-0'
                >
                  <span className='text-neutral-1600 truncate font-medium'>
                    {r.title} × {r.headcount} · {r.location}
                  </span>
                  <span className='text-neutral-1900 truncate'>
                    {r.department}
                  </span>
                  <span className='text-neutral-1900'>{r.positionLevel}</span>
                  <span className='text-neutral-1900'>{r.closingDate}</span>
                  <span className='text-neutral-1900'>{r.priority}</span>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-6 w-6'
                    aria-label='Remove row'
                    onClick={() =>
                      setRows((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <X className='size-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Self-approval (auto-approve) path */}
          <div className='space-y-3 rounded-[8px] border border-gray-200 bg-white p-3'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Checkbox
                checked={selfApprove}
                onCheckedChange={(v) => setSelfApprove(Boolean(v))}
                variant='blue'
              />
              I am the approver (all levels approved on submission)
            </label>
            {selfApprove && (
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='mb-1 text-sm font-medium'>Approver name</p>
                  <Input
                    placeholder='e.g. Sunita Patil'
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                  />
                </div>
                <div>
                  <p className='mb-1 text-sm font-medium'>
                    Supporting document *
                  </p>
                  <Input
                    placeholder='e.g. headcount-approval-fy27.pdf'
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            Submit {rows.length > 0 ? `(${rows.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
