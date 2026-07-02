import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { DEPARTMENTS, EMPLOYEES, LOCATIONS, POSITIONS } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'

interface ManualSheetOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendance: AttendanceStore
}

/**
 * Bulk manual attendance sheet (TNA-46): scope employees by location,
 * department and position, key one punch row with comments, and submit for
 * every selected employee — each record traceable to the entering admin.
 */
export function ManualSheetOverlay({
  open,
  onOpenChange,
  attendance,
}: ManualSheetOverlayProps) {
  const [location, setLocation] = useState('all')
  const [department, setDepartment] = useState('all')
  const [position, setPosition] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [date, setDate] = useState('2026-07-02')
  const [inTime, setInTime] = useState('09:00')
  const [outTime, setOutTime] = useState('18:00')
  const [inComment, setInComment] = useState('')
  const [outComment, setOutComment] = useState('')

  const scoped = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          (location === 'all' || e.location === location) &&
          (department === 'all' || e.department === department) &&
          (position === 'all' || e.position === position)
      ),
    [department, location, position]
  )

  const submit = () => {
    if (selected.length === 0) {
      toast.error('Select at least one employee in the scoped list')
      return
    }
    if (outTime <= inTime) {
      toast.error('Out-time must be after in-time')
      return
    }
    const comment = [inComment && `In: ${inComment}`, outComment && `Out: ${outComment}`]
      .filter(Boolean)
      .join(' · ')
    selected.forEach((employeeId) =>
      attendance.addManual(
        { employeeId, date, punchIn: inTime, punchOut: outTime, workCategory: 'office', comment },
        'Manual attendance sheet'
      )
    )
    toast.success(`Manual attendance sheet submitted for ${selected.length} employee(s)`)
    setSelected([])
    onOpenChange(false)
  }

  const scopeSelect = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: readonly string[]
  ) => (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger variant='secondary' className='h-8 w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Manual Attendance Sheet
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='grid grid-cols-3 gap-3'>
            {scopeSelect('Location', location, setLocation, LOCATIONS)}
            {scopeSelect('Department', department, setDepartment, DEPARTMENTS)}
            {scopeSelect('Position', position, setPosition, POSITIONS)}
          </div>

          <div>
            <Label className='text-xs'>
              Scoped employees ({scoped.length}) — select who this sheet applies to
            </Label>
            <div className='mt-1 max-h-44 space-y-1 overflow-y-auto rounded-[6px] border border-gray-200 bg-white p-2'>
              {scoped.map((e) => (
                <label key={e.id} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    checked={selected.includes(e.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, e.id] : prev.filter((id) => id !== e.id)
                      )
                    }
                    variant='blue'
                  />
                  {e.name} · {e.code} · {e.department}
                  {!e.selfService && (
                    <span className='text-neutral-1000 text-xs'>(non-user)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Attendance date</Label>
              <Input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>In-time</Label>
              <Input type='time' value={inTime} onChange={(e) => setInTime(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Out-time</Label>
              <Input type='time' value={outTime} onChange={(e) => setOutTime(e.target.value)} />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>In-time comment</Label>
              <Input
                placeholder='e.g. transport delay'
                value={inComment}
                onChange={(e) => setInComment(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Out-time comment</Label>
              <Input
                placeholder='e.g. shift extension'
                value={outComment}
                onChange={(e) => setOutComment(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit Sheet ({selected.length})</Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
