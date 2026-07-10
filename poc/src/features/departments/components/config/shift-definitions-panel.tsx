import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  shiftDurationHours,
  WEEK_DAYS,
  type Shift,
  type WeekDay,
} from '../../data/org-config'
import { type DepartmentsStore } from '../../hooks/use-departments'

const PAGE_SIZE = 8

/**
 * Editable shift catalog (SHFT-06/07): browse all shift definitions with
 * pagination + refresh, create new shifts and edit/save or delete existing
 * ones. Departments and employees referencing a shift pick up edits live.
 */
export function ShiftDefinitionsPanel({ store }: { store: DepartmentsStore }) {
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null)

  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [weeklyOffs, setWeeklyOffs] = useState<WeekDay[]>([])

  const pageCount = Math.max(1, Math.ceil(store.shifts.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => store.shifts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [store.shifts, safePage]
  )

  const usedByCount = (shiftId: string) =>
    store.departments.filter(
      (d) => d.shiftIds.includes(shiftId) || d.defaultShiftId === shiftId
    ).length

  const openDialog = (shift: Shift | null) => {
    setEditingShift(shift)
    setName(shift?.name ?? '')
    setStartTime(shift?.startTime ?? '09:00')
    setEndTime(shift?.endTime ?? '18:00')
    setWeeklyOffs(shift ? [...shift.weeklyOffs] : [])
    setDialogOpen(true)
  }

  const toggleOff = (day: WeekDay) =>
    setWeeklyOffs((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )

  const submit = () => {
    if (name.trim().length < 2) {
      toast.error('Enter a shift name')
      return
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      toast.error('Enter start and end times as HH:mm')
      return
    }
    if (startTime === endTime) {
      toast.error('Start and end time cannot be identical')
      return
    }
    const draft = {
      name: name.trim(),
      startTime,
      endTime,
      durationHours: shiftDurationHours(startTime, endTime),
      weeklyOffs: WEEK_DAYS.filter((d) => weeklyOffs.includes(d)),
    }
    if (editingShift) {
      store.updateShift(editingShift.id, draft)
    } else {
      store.addShift(draft)
    }
    setDialogOpen(false)
    setEditingShift(null)
  }

  const blockers = deleteShift ? store.shiftDeleteBlockersFor(deleteShift.id) : []

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Shift definitions ({store.shifts.length})
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label='Refresh shift list'
              onClick={() => store.refreshShifts()}
            >
              <ArrowsClockwise size={16} weight='bold' />
            </Button>
            <Button className='h-7 gap-1 px-2 text-xs' onClick={() => openDialog(null)}>
              <Plus size={12} weight='bold' />
              New shift
            </Button>
          </div>
        </div>
        <p className='text-neutral-1000 text-xs'>
          Company-wide shift catalog. Edits apply immediately to every department and
          employee assigned to the shift.
        </p>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Weekly offs</TableHead>
              <TableHead>Used by</TableHead>
              <TableHead className='w-[110px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((shift) => {
              const used = usedByCount(shift.id)
              return (
                <TableRow key={shift.id}>
                  <TableCell className='text-neutral-1000 text-xs'>{shift.id}</TableCell>
                  <TableCell className='text-neutral-1600 text-sm font-medium'>
                    {shift.name}
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {shift.startTime}–{shift.endTime}
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {shift.durationHours}h
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {shift.weeklyOffs.join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={used > 0 ? 'open' : 'secondary'}>
                      {used} dept{used === 1 ? '' : 's'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Edit ${shift.name}`}
                        onClick={() => openDialog(shift)}
                      >
                        <PencilSimple size={14} weight='fill' />
                      </Button>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label={`Delete ${shift.name}`}
                        onClick={() => setDeleteShift(shift)}
                      >
                        <Trash size={14} weight='bold' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Pagination (SHFT-07) */}
        <div className='flex items-center justify-end gap-2'>
          <span className='text-neutral-1000 text-xs'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='icon2'
            className='h-7 w-7'
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            aria-label='Previous page'
          >
            <CaretLeft size={14} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            className='h-7 w-7'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            aria-label='Next page'
          >
            <CaretRight size={14} weight='bold' />
          </Button>
        </div>
      </CardContent>

      {/* -------- add/edit dialog (SHFT-06) -------- */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingShift(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editingShift ? `Edit shift — ${editingShift.name}` : 'New shift'}
            </DialogTitle>
            <DialogDescription>
              Duration is computed from the times; overnight shifts wrap past midnight.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Shift name</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Evening Support'
              />
            </div>
            <div className='flex items-center gap-3'>
              <div className='flex-1'>
                <p className='text-neutral-1600 mb-1 text-sm font-medium'>Start time</p>
                <Input
                  type='time'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className='flex-1'>
                <p className='text-neutral-1600 mb-1 text-sm font-medium'>End time</p>
                <Input
                  type='time'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <p className='text-neutral-1000 text-xs'>
              Duration: {shiftDurationHours(startTime, endTime)}h
            </p>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Weekly offs</p>
              <div className='flex flex-wrap items-center gap-1.5'>
                {WEEK_DAYS.map((day) => {
                  const active = weeklyOffs.includes(day)
                  return (
                    <button
                      key={day}
                      type='button'
                      onClick={() => toggleOff(day)}
                      className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                        active
                          ? 'bg-blue-1400 border-blue-1400 text-white'
                          : 'text-neutral-1900 border-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingShift ? 'Save shift' : 'Create shift'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- delete confirmation -------- */}
      <AlertDialog
        open={deleteShift !== null}
        onOpenChange={(open) => !open && setDeleteShift(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shift "{deleteShift?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-2'>
                {blockers.length > 0 ? (
                  <>
                    <p className='text-red-1400 font-medium'>Deletion is blocked:</p>
                    <ul className='list-disc space-y-1 pl-5'>
                      {blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>
                    The shift is removed from the catalog; the change is logged in the
                    audit history.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={blockers.length > 0}
              onClick={() => {
                if (deleteShift) store.deleteShift(deleteShift.id)
                setDeleteShift(null)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
