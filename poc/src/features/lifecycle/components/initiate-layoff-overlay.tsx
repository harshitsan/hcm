import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { selectColumn } from '@/features/workflows/components/table-helpers'
import {
  LAYOFF_EMPLOYEE_POOL,
  LOCATION_HEADCOUNT,
  type LayoffEmployee,
} from '../data/layoffs'
import { LOCATIONS } from '../data/shared'
import { type LayoffsStore } from '../hooks/use-layoffs'
import { layoffEmployeeColumns } from './layoff-columns'

const pickerColumns = [selectColumn<LayoffEmployee>(), ...layoffEmployeeColumns]

interface InitiateLayoffOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: LayoffsStore
}

/**
 * Bulk layoff initiation — pick a location, select employees in the grid and
 * submit. Blocked when the remaining headcount would fall below the
 * configured minimum; routed to the seeded location approver on success.
 */
export function InitiateLayoffOverlay({
  open,
  onOpenChange,
  store,
}: InitiateLayoffOverlayProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [reason, setReason] = useState('')
  const [selected, setSelected] = useState<LayoffEmployee[]>([])
  const [selectionKey, setSelectionKey] = useState(0)

  useEffect(() => {
    if (open) {
      setName('')
      setLocation(LOCATIONS[0])
      setReason('')
      setSelected([])
      setSelectionKey((k) => k + 1)
    }
  }, [open])

  // Employees already committed to an in-flight/exited batch are not
  // selectable again.
  const pool = useMemo(() => {
    const committed = new Set(
      store.batches
        .filter((b) =>
          ['pending-approval', 'approved', 'exited'].includes(b.status)
        )
        .flatMap((b) => b.employees.map((e) => e.code))
    )
    return LAYOFF_EMPLOYEE_POOL.filter(
      (e) => e.location === location && !committed.has(e.code)
    )
  }, [location, store.batches])

  const remaining = store.remainingAfter(location, selected.length)
  const belowMinimum = remaining < store.minEmployees
  const approver = store.approverForLocation(location)

  const submit = () => {
    if (!name.trim()) {
      toast.error('Layoff name is required')
      return
    }
    if (!reason.trim()) {
      toast.error('Provide a business reason for the layoff')
      return
    }
    const batch = store.initiateLayoff({
      name: name.trim(),
      location,
      reason: reason.trim(),
      employees: selected,
    })
    if (batch) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[640px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Initiate layoff
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            Select the employees to include — the batch routes to the
            location&apos;s seeded layoff approver, then HR.
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='layoff-name'>Layoff name</Label>
              <Input
                id='layoff-name'
                placeholder='e.g. Pune Ops restructuring — Wave 1'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Location</Label>
              <Select
                value={location}
                onValueChange={(v) => {
                  setLocation(v)
                  setSelected([])
                  setSelectionKey((k) => k + 1)
                }}
              >
                <SelectTrigger variant='secondary' className='w-full'>
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
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='layoff-reason'>Reason</Label>
            <Textarea
              id='layoff-reason'
              placeholder='Business justification for the workforce reduction'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Min-employee guard preview */}
          <div
            className={`rounded-[6px] border px-3 py-2 text-xs ${
              belowMinimum
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-neutral-1000'
            }`}
          >
            {LOCATION_HEADCOUNT[location] ?? 0} employee(s) on rolls at{' '}
            {location} · {selected.length} selected · remaining after layoff:{' '}
            <span className='font-semibold'>{remaining}</span> · configured
            minimum: {store.minEmployees}
            {belowMinimum &&
              ' — initiation is blocked below the configured minimum'}
            <span className='block'>
              Location approver: {approver}
              {' · '}then HR
            </span>
          </div>

          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Employees at {location} ({pool.length})
            </p>
            <DataTable
              columns={pickerColumns}
              data={pool}
              variant='no-status'
              onSelectionChange={setSelected}
              resetSelectionKey={selectionKey}
            />
          </div>
        </div>

        <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
          <p className='text-neutral-1000 text-xs'>
            {selected.length} employee(s) selected
          </p>
          <div className='flex items-center gap-3'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={selected.length === 0 || belowMinimum}
            >
              Initiate layoff
            </Button>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
