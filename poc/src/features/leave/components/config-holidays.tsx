import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { toast } from 'sonner'
import { DEPARTMENTS, LOCATIONS, fmtDate } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { StatusBadge } from './badges'

/**
 * Holiday calendars per location and year with publish (LVE-40) and office
 * closures scoped to locations/departments (LVE-45).
 */
export function ConfigHolidays({ settings }: { settings: LeaveSettingsStore }) {
  const [calOpen, setCalOpen] = useState(false)
  const [calName, setCalName] = useState('')
  const [calYear, setCalYear] = useState('2027')
  const [calLocations, setCalLocations] = useState<string[]>([])

  const [closureOpen, setClosureOpen] = useState(false)
  const [closureReason, setClosureReason] = useState('')
  const [closureFrom, setClosureFrom] = useState('')
  const [closureTo, setClosureTo] = useState('')
  const [closureLocations, setClosureLocations] = useState<string[]>([])
  const [closureDepts, setClosureDepts] = useState<string[]>([])

  const saveCalendar = () => {
    if (!calName.trim() || calLocations.length === 0) {
      toast.error('Name and at least one location are required')
      return
    }
    settings.addCalendar({
      name: calName,
      locations: calLocations,
      year: Number(calYear),
      holidays: [],
    })
    setCalOpen(false)
    setCalName('')
    setCalLocations([])
  }

  const saveClosure = () => {
    if (!closureReason.trim() || !closureFrom || !closureTo || closureLocations.length === 0) {
      toast.error('Reason, dates and locations are required')
      return
    }
    settings.addClosure({
      reason: closureReason,
      from: closureFrom,
      to: closureTo,
      locations: closureLocations,
      departments: closureDepts.length ? closureDepts : [...DEPARTMENTS],
    })
    setClosureOpen(false)
    setClosureReason('')
    setClosureFrom('')
    setClosureTo('')
    setClosureLocations([])
    setClosureDepts([])
  }

  const checkboxGroup = (
    options: readonly string[],
    selected: string[],
    setSelected: (fn: (prev: string[]) => string[]) => void
  ) => (
    <div className='grid grid-cols-2 gap-1'>
      {options.map((o) => (
        <label key={o} className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={selected.includes(o)}
            onCheckedChange={(v) =>
              setSelected((prev) => (v ? [...prev, o] : prev.filter((x) => x !== o)))
            }
            variant='blue'
          />
          {o}
        </label>
      ))}
    </div>
  )

  return (
    <div className='w-full space-y-5'>
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Holiday Calendars ({settings.calendars.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              published calendars appear on the employee Holiday List for their
              location and year
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setCalOpen(true)}>
            <Plus size={12} weight='bold' />
            New Calendar
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Name</th>
                <th className='px-2 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Year</th>
                <th className='px-2 font-medium'>Holidays</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {settings.calendars.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{c.name}</td>
                  <td className='px-2'>{c.locations.join(', ')}</td>
                  <td className='px-2'>{c.year}</td>
                  <td className='px-2'>
                    {c.holidays.length} (
                    {c.holidays.filter((h) => h.kind === 'optional').length} optional)
                  </td>
                  <td className='px-2'>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className='px-2 text-right'>
                    {c.status === 'draft' && (
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => settings.publishCalendar(c.id)}
                      >
                        Publish
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Office Closures ({settings.closures.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              closed dates are non-working and never consume leave balance
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setClosureOpen(true)}>
            <Plus size={12} weight='bold' />
            New Closure
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Reason</th>
                <th className='px-2 font-medium'>From</th>
                <th className='px-2 font-medium'>To</th>
                <th className='px-2 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Departments</th>
              </tr>
            </thead>
            <tbody>
              {settings.closures.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{c.reason}</td>
                  <td className='px-2'>{fmtDate(c.from)}</td>
                  <td className='px-2'>{fmtDate(c.to)}</td>
                  <td className='px-2'>{c.locations.join(', ')}</td>
                  <td className='text-neutral-1000 max-w-[220px] truncate px-2'>
                    {c.departments.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={calOpen} onOpenChange={setCalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New holiday calendar</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input value={calName} onChange={(e) => setCalName(e.target.value)} placeholder='e.g. India Holidays 2027' />
            </div>
            <div className='space-y-1'>
              <Label>Year</Label>
              <Input type='number' value={calYear} onChange={(e) => setCalYear(e.target.value)} />
            </div>
            <div>
              <Label className='mb-1 block'>Locations</Label>
              {checkboxGroup(LOCATIONS, calLocations, setCalLocations)}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCalendar}>Create draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closureOpen} onOpenChange={setClosureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule office closure</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Reason</Label>
              <Input
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder='e.g. Year-end shutdown'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>From</Label>
                <Input type='date' value={closureFrom} onChange={(e) => setClosureFrom(e.target.value)} />
              </div>
              <div className='space-y-1'>
                <Label>To</Label>
                <Input type='date' value={closureTo} onChange={(e) => setClosureTo(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className='mb-1 block'>Locations</Label>
              {checkboxGroup(LOCATIONS, closureLocations, setClosureLocations)}
            </div>
            <div>
              <Label className='mb-1 block'>Departments (all if none selected)</Label>
              {checkboxGroup(DEPARTMENTS, closureDepts, setClosureDepts)}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setClosureOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClosure}>Schedule closure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
