import { useState } from 'react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/utils/helpers'
import {
  WEEKDAYS,
  YEAR_START_MONTHS,
  type ShiftDefinition,
} from '../data/shifts'
import { LOCATIONS } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { RefreshButton } from './list-controls'

/**
 * Shift master under leave configuration (Kensium Shift section):
 * location-based shift definitions with scheduled hours, default shift,
 * flexi hours (no tolerance), tolerance limits, weekly offs and shift
 * roster visibility.
 */
export function ConfigShifts({ store }: { store: LeaveSettingsStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ShiftDefinition | null>(null)
  const [name, setName] = useState('')
  const [yearStartsFrom, setYearStartsFrom] = useState('April')
  const [startsAt, setStartsAt] = useState('09:00')
  const [endsAt, setEndsAt] = useState('18:00')
  const [defaultShift, setDefaultShift] = useState(false)
  const [flexiHours, setFlexiHours] = useState(false)
  const [tolerance, setTolerance] = useState('15')
  const [weeklyOffs, setWeeklyOffs] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [rosterVisibility, setRosterVisibility] = useState('30')

  const openForm = (s: ShiftDefinition | null) => {
    setEditing(s)
    setName(s?.name ?? '')
    setYearStartsFrom(s?.yearStartsFrom ?? 'April')
    setStartsAt(s?.startsAt ?? '09:00')
    setEndsAt(s?.endsAt ?? '18:00')
    setDefaultShift(s?.defaultShift ?? false)
    setFlexiHours(s?.flexiHours ?? false)
    setTolerance(s?.toleranceMinutes != null ? String(s.toleranceMinutes) : '15')
    setWeeklyOffs(s?.weeklyOffs ?? [])
    setLocations(s?.applicableLocations ?? [])
    setRosterVisibility(String(s?.rosterVisibilityDays ?? 30))
    setOpen(true)
  }

  const save = () => {
    if (!name.trim() || !startsAt || !endsAt) {
      toast.error('Shift name, start time and end time are required')
      return
    }
    if (locations.length === 0) {
      toast.error('Select at least one applicable location')
      return
    }
    const draft: Omit<ShiftDefinition, 'id'> = {
      name: name.trim(),
      yearStartsFrom,
      startsAt,
      endsAt,
      defaultShift,
      flexiHours,
      // Per the PDF, no tolerance limit is kept for flexi-hour shifts.
      toleranceMinutes: flexiHours ? null : Number(tolerance) || 0,
      weeklyOffs,
      applicableLocations: locations,
      rosterVisibilityDays: Number(rosterVisibility) || 30,
    }
    if (editing) store.updateShift(editing.id, draft)
    else store.addShift(draft)
    setOpen(false)
    setEditing(null)
  }

  return (
    <div className='w-full space-y-5'>
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Shifts ({store.shifts.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              the default shift is assigned to employees with no shift
              assignment; flexi shifts do not track lost hours
            </span>
          </h3>
          <span className='flex items-center gap-2'>
            <RefreshButton label='Shifts' />
            <Button variant='outline' className='h-7 gap-1' onClick={() => openForm(null)}>
              <Plus size={12} weight='bold' />
              Add New Shift
            </Button>
          </span>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          {store.shifts.length === 0 ? (
            <p className='text-neutral-1000 py-4 text-center text-sm'>
              No records to display — define a shift so holiday calendars and
              rosters can be configured.
            </p>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Name</th>
                  <th className='px-2 font-medium'>Timing</th>
                  <th className='px-2 font-medium'>Flexi / Tolerance</th>
                  <th className='px-2 font-medium'>Weekly offs</th>
                  <th className='px-2 font-medium'>Locations</th>
                  <th className='px-2 font-medium'>Roster visibility</th>
                  <th className='px-2 text-right font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {store.shifts.map((s) => (
                  <tr key={s.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>
                      <span className='inline-flex items-center gap-1.5'>
                        {s.name}
                        {s.defaultShift && (
                          <Badge variant='completed'>Default</Badge>
                        )}
                      </span>
                    </td>
                    <td className='px-2'>
                      {s.startsAt} – {s.endsAt}
                      <span className='text-neutral-1000 block text-xs'>
                        year starts {s.yearStartsFrom}
                      </span>
                    </td>
                    <td className='px-2'>
                      {s.flexiHours ? (
                        <Badge variant='open'>Flexi hours</Badge>
                      ) : (
                        `${s.toleranceMinutes ?? 0} min tolerance`
                      )}
                    </td>
                    <td className='px-2'>{s.weeklyOffs.join(', ') || '—'}</td>
                    <td className='px-2'>{s.applicableLocations.join(', ')}</td>
                    <td className='px-2'>{s.rosterVisibilityDays} days</td>
                    <td className='px-2 text-right'>
                      <span className='inline-flex gap-1'>
                        {!s.defaultShift && (
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => store.setDefaultShift(s.id)}
                          >
                            Make default
                          </Button>
                        )}
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => openForm(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          className='text-destructive h-6 px-2 text-xs'
                          onClick={() => store.removeShift(s.id)}
                        >
                          Delete
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit shift' : 'Add new shift'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Shift name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. General Shift (9–6)'
                />
              </div>
              <div className='space-y-1'>
                <Label>Year starts from</Label>
                <Select value={yearStartsFrom} onValueChange={setYearStartsFrom}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_START_MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Shift starts at</Label>
                <Input
                  type='time'
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>Shift ends at</Label>
                <Input
                  type='time'
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={defaultShift} onCheckedChange={setDefaultShift} />
              Default shift — assigned to employees with no shift assignment
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={flexiHours} onCheckedChange={setFlexiHours} />
              Flexi hours — lost hours (late arrival / early departure) are not
              tracked
            </label>
            {/* Per the PDF the tolerance field is hidden for flexi shifts. */}
            {!flexiHours && (
              <div className='space-y-1'>
                <Label>Shift tolerance limit in minutes</Label>
                <Input
                  type='number'
                  className='w-32'
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label className='mb-1 block'>Weekly off</Label>
              <div className='grid grid-cols-2 gap-1'>
                {WEEKDAYS.map((d) => (
                  <label key={d} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={weeklyOffs.includes(d)}
                      onCheckedChange={(v) =>
                        setWeeklyOffs((prev) =>
                          v ? [...prev, d] : prev.filter((x) => x !== d)
                        )
                      }
                      variant='blue'
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className='mb-1 block'>Applicable locations</Label>
              <div className='flex flex-wrap gap-1.5'>
                {LOCATIONS.map((l) => {
                  const active = locations.includes(l)
                  return (
                    <button
                      key={l}
                      type='button'
                      onClick={() =>
                        setLocations((prev) =>
                          active ? prev.filter((x) => x !== l) : [...prev, l]
                        )
                      }
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        active
                          ? 'border-blue-1400 bg-blue-150 text-blue-1400 font-medium'
                          : 'text-neutral-1000 border-gray-200 bg-white hover:bg-gray-50'
                      )}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Roster visibility (days)</Label>
              <Input
                type='number'
                className='w-32'
                value={rosterVisibility}
                onChange={(e) => setRosterVisibility(e.target.value)}
              />
              <p className='text-neutral-1000 text-xs'>
                How many days ahead employees can see the shift roster.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
