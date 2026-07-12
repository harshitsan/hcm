import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight, Moon } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { patternTimeLabel, type ShiftPattern } from '../data/shifts'
import { EMPLOYEES, employeeName, todayIso } from '../data/shared'
import { type ShiftsStore } from '../hooks/use-shifts'

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Monday of the week the given date falls in. */
function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  const shift = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  return addDays(iso, -shift)
}

const dayHeaderFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit' })
const weekTitleFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

/** Compact shift chip for a roster cell; night shifts explain the midnight crossing. */
function ShiftChip({ pattern }: { pattern: ShiftPattern }) {
  if (pattern.nightShift) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='inline-flex'>
            <Badge variant='completed' className='gap-1 whitespace-nowrap'>
              <Moon size={11} weight='fill' />
              {pattern.name}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side='top' className='max-w-[240px]'>
          {pattern.name} runs {pattern.startTime} – {pattern.endTime} and crosses
          midnight — it ends at {pattern.endTime} on the NEXT calendar day. Any
          overtime worked after 00:00 is attributed to that next day.
        </TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Badge variant='open' className='whitespace-nowrap'>
      {pattern.name}
    </Badge>
  )
}

/**
 * Week roster grid (employees × days). Each cell shows the assigned shift
 * resolved from the roster (single-day changes and approved swaps override
 * standing assignments); clicking a cell assigns or changes the shift for
 * that employee on that day.
 */
export function RosterGrid({ shifts }: { shifts: ShiftsStore }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayIso()))
  const [editCell, setEditCell] = useState<{ employeeId: string; date: string } | null>(null)
  const [editShiftId, setEditShiftId] = useState('')

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const activePatterns = shifts.patterns.filter((p) => p.status === 'active')

  const openCell = (employeeId: string, date: string) => {
    const current = shifts.shiftForDay(employeeId, date)
    setEditShiftId(current?.id ?? '')
    setEditCell({ employeeId, date })
  }

  const saveCell = () => {
    if (!editCell) return
    if (!editShiftId) {
      toast.error('Pick a shift pattern for the day')
      return
    }
    shifts.assignDay(editCell.employeeId, editCell.date, editShiftId)
    setEditCell(null)
  }

  const weekTitle = `${weekTitleFmt.format(new Date(`${days[0]}T00:00:00`))} – ${weekTitleFmt.format(new Date(`${days[6]}T00:00:00`))}`

  return (
    <div>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Week Roster
          <span className='text-neutral-1000 ml-2 text-xs'>
            click a day to assign or change the shift; approved swaps appear
            here automatically
          </span>
        </h3>
        <div className='flex items-center gap-1.5'>
          <Button
            variant='outline'
            className='h-7 px-2'
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <CaretLeft size={12} weight='bold' />
          </Button>
          <span className='text-xs font-medium'>{weekTitle}</span>
          <Button
            variant='outline'
            className='h-7 px-2'
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <CaretRight size={12} weight='bold' />
          </Button>
          <Button
            variant='outline'
            className='h-7 text-xs'
            onClick={() => setWeekStart(mondayOf(todayIso()))}
          >
            This Week
          </Button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              {days.map((d) => (
                <th key={d} className='px-2 text-center font-medium'>
                  {dayHeaderFmt.format(new Date(`${d}T00:00:00`))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPLOYEES.map((emp) => (
              <tr key={emp.id} className='border-b last:border-0'>
                <td className='py-2 pr-3'>
                  <span className='font-medium'>{emp.name}</span>
                  <span className='text-neutral-1000 block text-xs'>{emp.code}</span>
                </td>
                {days.map((d) => {
                  const pattern = shifts.shiftForDay(emp.id, d)
                  return (
                    <td key={d} className='px-1 text-center'>
                      <button
                        type='button'
                        onClick={() => openCell(emp.id, d)}
                        className='hover:bg-neutral-100 w-full rounded-md px-1 py-1.5 transition-colors'
                        title={pattern ? undefined : 'Assign a shift'}
                      >
                        {pattern ? (
                          <ShiftChip pattern={pattern} />
                        ) : (
                          <span className='text-neutral-1000 text-xs'>—</span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign / change the shift for one employee on one day */}
      <Dialog open={editCell !== null} onOpenChange={(v) => !v && setEditCell(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>
              {editCell && shifts.shiftForDay(editCell.employeeId, editCell.date)
                ? 'Change shift for the day'
                : 'Assign shift for the day'}
            </DialogTitle>
            <DialogDescription>
              {editCell &&
                `${employeeName(editCell.employeeId)} on ${weekTitleFmt.format(new Date(`${editCell.date}T00:00:00`))}. A single-day change overrides the standing roster for that day only.`}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Shift pattern</Label>
            <Select value={editShiftId} onValueChange={setEditShiftId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select shift' />
              </SelectTrigger>
              <SelectContent>
                {activePatterns.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({patternTimeLabel(p)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditCell(null)}>
              Cancel
            </Button>
            <Button onClick={saveCell}>Save Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
