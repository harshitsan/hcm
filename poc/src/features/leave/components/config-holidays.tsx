import { useState } from 'react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { CalendarPreview, type CalendarMarker } from '@/components/common/settings/calendar-preview'
import { AdvancedSection } from '@/components/common/settings/advanced-section'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  fmtWeeklyOff,
  type Holiday,
  type HolidayCalendar,
} from '../data/holidays'
import { WEEKDAYS } from '../data/shifts'
import { DEPARTMENTS, LOCATIONS, fmtDate, shortId } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { StatusBadge } from './badges'
import { PagerControls, RefreshButton, usePager } from './list-controls'

const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })

const CALENDAR_PAGE_SIZE = 5

type HolidayKind = 'fixed' | 'optional' | 'weekly-off'
type WeekChoice = 'all' | '1' | '2' | '3' | '4'
type Duration = 'full-day' | 'half-day'

/**
 * Holiday calendars built on shifts (Kensium Holiday Calendar: regular +
 * optional holidays and recurring weekly offs, notify employees, publish —
 * LVE-40) and office closures scoped to locations/departments (LVE-45).
 */
export function ConfigHolidays({ settings }: { settings: LeaveSettingsStore }) {
  const [calOpen, setCalOpen] = useState(false)
  const [calName, setCalName] = useState('')
  const [calYear, setCalYear] = useState('2027')
  const [calShiftIds, setCalShiftIds] = useState<string[]>([])
  const [calNotify, setCalNotify] = useState(false)

  // HOLCAL-03: per-calendar View action showing the holidays it contains.
  const [viewing, setViewing] = useState<HolidayCalendar | null>(null)
  // HOLCAL-04: edit an existing calendar's details, holidays and status.
  const [editing, setEditing] = useState<HolidayCalendar | null>(null)
  const [editName, setEditName] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editShiftIds, setEditShiftIds] = useState<string[]>([])
  const [editNotify, setEditNotify] = useState(false)
  const [editPublished, setEditPublished] = useState(false)
  const [editHolidays, setEditHolidays] = useState<Holiday[]>([])
  const [hName, setHName] = useState('')
  const [hDate, setHDate] = useState('')
  const [hKind, setHKind] = useState<HolidayKind>('fixed')
  const [hDescription, setHDescription] = useState('')
  const [hSwap, setHSwap] = useState('')
  // Recurring-weekly-off branch (Kensium: day, recur on every "X" week, duration).
  const [hDay, setHDay] = useState('Saturday')
  const [hWeek, setHWeek] = useState<WeekChoice>('all')
  const [hDuration, setHDuration] = useState<Duration>('full-day')

  // HOLCAL-05: Next/Back paging over the calendar register.
  const calPager = usePager(settings.calendars, CALENDAR_PAGE_SIZE)

  const [closureOpen, setClosureOpen] = useState(false)
  const [closureReason, setClosureReason] = useState('')
  const [closureFrom, setClosureFrom] = useState('')
  const [closureTo, setClosureTo] = useState('')
  const [closureLocations, setClosureLocations] = useState<string[]>([])
  const [closureDepts, setClosureDepts] = useState<string[]>([])
  const [closureDetails, setClosureDetails] = useState('')
  const [closureEmails, setClosureEmails] = useState('')
  const [closureDuration, setClosureDuration] = useState<Duration>('full-day')

  /** Kensium: applicable locations derive from the selected shifts. */
  const derivedLocations = (shiftIds: string[]) =>
    Array.from(
      new Set(
        settings.shifts
          .filter((s) => shiftIds.includes(s.id))
          .flatMap((s) => s.applicableLocations)
      )
    )

  const saveCalendar = () => {
    if (!calName.trim() || calShiftIds.length === 0) {
      toast.error('Name and at least one shift are required')
      return
    }
    settings.addCalendar({
      name: calName,
      shiftIds: calShiftIds,
      locations: derivedLocations(calShiftIds),
      year: Number(calYear),
      notifyEmployees: calNotify,
      holidays: [],
    })
    setCalOpen(false)
    setCalName('')
    setCalShiftIds([])
    setCalNotify(false)
  }

  const resetHolidayForm = () => {
    setHName('')
    setHDate('')
    setHKind('fixed')
    setHDescription('')
    setHSwap('')
    setHDay('Saturday')
    setHWeek('all')
    setHDuration('full-day')
  }

  const openEdit = (c: HolidayCalendar) => {
    setEditing(c)
    setEditName(c.name)
    setEditYear(String(c.year))
    setEditShiftIds(c.shiftIds)
    setEditNotify(c.notifyEmployees)
    setEditPublished(c.status === 'published')
    setEditHolidays(c.holidays)
    resetHolidayForm()
  }

  const addEditHoliday = () => {
    if (!hName.trim()) {
      toast.error('Holiday name is required')
      return
    }
    if (hKind !== 'weekly-off' && !hDate) {
      toast.error('Select the holiday date from the calendar')
      return
    }
    setEditHolidays((prev) => [
      ...prev,
      hKind === 'weekly-off'
        ? {
            id: shortId('h'),
            name: hName.trim(),
            date: '',
            day: hDay,
            kind: 'weekly-off',
            description: hDescription.trim(),
            swapWith: null,
            weeklyOff: {
              day: hDay,
              recurEveryWeek: hWeek === 'all' ? 'all' : Number(hWeek),
              duration: hDuration,
            },
          }
        : {
            id: shortId('h'),
            name: hName.trim(),
            date: hDate,
            day: weekdayFmt.format(new Date(hDate)),
            kind: hKind,
            description: hDescription.trim(),
            swapWith: hKind === 'optional' && hSwap.trim() ? hSwap.trim() : null,
            weeklyOff: null,
          },
    ])
    resetHolidayForm()
  }

  const saveEdit = () => {
    if (!editing) return
    if (!editName.trim() || editShiftIds.length === 0) {
      toast.error('Name and at least one shift are required')
      return
    }
    settings.updateCalendar(editing.id, {
      name: editName.trim(),
      year: Number(editYear) || editing.year,
      shiftIds: editShiftIds,
      locations: derivedLocations(editShiftIds),
      notifyEmployees: editNotify,
      status: editPublished ? 'published' : 'draft',
      holidays: editHolidays,
    })
    setEditing(null)
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
      details: closureDetails.trim(),
      notifyEmails: closureEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
      duration: closureDuration,
    })
    setClosureOpen(false)
    setClosureReason('')
    setClosureFrom('')
    setClosureTo('')
    setClosureLocations([])
    setClosureDepts([])
    setClosureDetails('')
    setClosureEmails('')
    setClosureDuration('full-day')
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

  /** Shift multi-select + derived locations, shared by both calendar dialogs. */
  const shiftPicker = (
    selected: string[],
    setSelected: (fn: (prev: string[]) => string[]) => void
  ) => (
    <div className='space-y-2'>
      <div>
        <Label className='mb-1 block'>Shifts (from the shift master)</Label>
        <div className='grid grid-cols-1 gap-1'>
          {settings.shifts.map((s) => (
            <label key={s.id} className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={selected.includes(s.id)}
                onCheckedChange={(v) =>
                  setSelected((prev) =>
                    v ? [...prev, s.id] : prev.filter((x) => x !== s.id)
                  )
                }
                variant='blue'
              />
              {s.name}
              <span className='text-neutral-1000 text-xs'>
                ({s.applicableLocations.join(', ')})
              </span>
            </label>
          ))}
        </div>
      </div>
      <p className='text-neutral-1000 text-xs'>
        Applicable locations (derived from the selected shifts):{' '}
        <span className='text-neutral-1600 font-medium'>
          {derivedLocations(selected).join(', ') || '—'}
        </span>
      </p>
    </div>
  )

  const weeklyOffCount = (c: HolidayCalendar) =>
    c.holidays.filter((h) => h.kind === 'weekly-off').length

  const calendarMarkers: CalendarMarker[] = settings.calendars
    .flatMap((c) =>
      c.holidays
        .filter((h) => h.kind !== 'weekly-off' && h.date)
        .map((h) => ({
          date: h.date,
          label: h.name,
          kind: h.kind === 'optional' ? ('optional' as const) : ('holiday' as const),
        }))
    )
    .concat(
      settings.closures.map((cl) => ({
        date: cl.from,
        label: cl.reason,
        kind: 'closure' as const,
      }))
    )

  return (
    <div className='w-full space-y-5'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <h3 className='text-neutral-1600 text-sm font-medium mb-3'>Calendar Preview</h3>
        <CalendarPreview
          markers={calendarMarkers}
          workingDays={[1, 2, 3, 4, 5]}
          months={3}
          onSelectDate={(iso) => {
            // Check if date matches a holiday in any calendar.
            for (const cal of settings.calendars) {
              const matchedHoliday = cal.holidays.find((h) => h.date === iso)
              if (matchedHoliday) {
                // Open the edit calendar dialog pre-filled.
                openEdit(cal)
                // Pre-fill the holiday form with the matched holiday so it can be reviewed.
                setHDate(matchedHoliday.date)
                setHName(matchedHoliday.name)
                setHKind(matchedHoliday.kind as HolidayKind)
                setHDescription(matchedHoliday.description)
                setHSwap(matchedHoliday.swapWith ?? '')
                return
              }
            }
            // No matching holiday marker — open add-closure dialog with date pre-filled.
            setClosureFrom(iso)
            setClosureTo(iso)
            setClosureReason('')
            setClosureLocations([])
            setClosureDepts([])
            setClosureDetails('')
            setClosureEmails('')
            setClosureDuration('full-day')
            setClosureOpen(true)
          }}
        />
      </div>

      <AdvancedSection count={2}>
        <div className='space-y-5'>
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Holiday Calendars ({settings.calendars.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              published calendars appear on the employee Holiday List for their
              location and year
            </span>
          </h3>
          <span className='flex items-center gap-2'>
            {/* HOLCAL-05: refresh the calendar register. */}
            <RefreshButton label='Holiday calendars' />
            <Button variant='outline' className='h-7 gap-1' onClick={() => setCalOpen(true)}>
              <Plus size={12} weight='bold' />
              New Calendar
            </Button>
          </span>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Name</th>
                <th className='px-2 font-medium'>Shifts</th>
                <th className='px-2 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Year</th>
                <th className='px-2 font-medium'>Holidays</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {settings.calendars.length === 0 && (
                <tr>
                  <td colSpan={7} className='text-neutral-1000 py-6 text-center'>
                    No records to display.
                  </td>
                </tr>
              )}
              {calPager.pageItems.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>
                    {c.name}
                    {c.notifyEmployees && (
                      <span className='text-neutral-1000 block text-xs'>
                        shared with employees
                      </span>
                    )}
                  </td>
                  <td className='px-2'>
                    {c.shiftIds
                      .map(
                        (id) => settings.shifts.find((s) => s.id === id)?.name
                      )
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className='px-2'>{c.locations.join(', ')}</td>
                  <td className='px-2'>{c.year}</td>
                  <td className='px-2'>
                    {c.holidays.length} (
                    {c.holidays.filter((h) => h.kind === 'optional').length}{' '}
                    optional, {weeklyOffCount(c)} weekly off)
                  </td>
                  <td className='px-2'>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className='px-2 text-right'>
                    <span className='inline-flex gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setViewing(c)}
                      >
                        View
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </Button>
                      {c.status === 'draft' && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => settings.publishCalendar(c.id)}
                        >
                          Publish
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PagerControls
            page={calPager.page}
            pageCount={calPager.pageCount}
            total={calPager.total}
            onPrev={calPager.prev}
            onNext={calPager.next}
          />
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
          <span className='flex items-center gap-2'>
            {/* OC-04: refresh the office closure list. */}
            <RefreshButton label='Office closures' />
            <Button variant='outline' className='h-7 gap-1' onClick={() => setClosureOpen(true)}>
              <Plus size={12} weight='bold' />
              New Closure
            </Button>
          </span>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Reason</th>
                <th className='px-2 font-medium'>From</th>
                <th className='px-2 font-medium'>To</th>
                <th className='px-2 font-medium'>Duration</th>
                <th className='px-2 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Departments</th>
                <th className='px-2 font-medium'>Notified</th>
              </tr>
            </thead>
            <tbody>
              {settings.closures.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3'>
                    <span className='font-medium'>{c.reason}</span>
                    {c.details && (
                      <span className='text-neutral-1000 block max-w-[260px] truncate text-xs'>
                        {c.details}
                      </span>
                    )}
                  </td>
                  <td className='px-2'>{fmtDate(c.from)}</td>
                  <td className='px-2'>{fmtDate(c.to)}</td>
                  <td className='px-2'>
                    <Badge variant={c.duration === 'full-day' ? 'completed' : 'open'}>
                      {c.duration === 'full-day' ? 'Full day' : 'Half day'}
                    </Badge>
                  </td>
                  <td className='px-2'>{c.locations.join(', ')}</td>
                  <td className='text-neutral-1000 max-w-[200px] truncate px-2'>
                    {c.departments.join(', ')}
                  </td>
                  <td
                    className='text-neutral-1000 max-w-[160px] truncate px-2 text-xs'
                    title={c.notifyEmails.join(', ')}
                  >
                    {c.notifyEmails.length
                      ? `${c.notifyEmails.length} email${c.notifyEmails.length > 1 ? 's' : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </AdvancedSection>

      {/* HOLCAL-03: read-only holiday details for a calendar. */}
      <Dialog
        open={viewing !== null}
        onOpenChange={(o) => {
          if (!o) setViewing(null)
        }}
      >
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {viewing?.name} — {viewing?.year}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className='space-y-3 text-sm'>
              <p className='text-neutral-1000 text-xs'>
                Shifts:{' '}
                {viewing.shiftIds
                  .map((id) => settings.shifts.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(', ') || '—'}{' '}
                · Locations: {viewing.locations.join(', ')} · Status:{' '}
                {viewing.status} ·{' '}
                {viewing.notifyEmployees
                  ? 'shared with employees'
                  : 'not shared with employees'}
              </p>
              {viewing.holidays.length === 0 ? (
                <p className='text-neutral-1000 py-4 text-center'>
                  No records to display — this calendar has no holidays yet.
                </p>
              ) : (
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-neutral-1000 border-b text-left text-xs'>
                      <th className='py-1.5 pr-3 font-medium'>Holiday</th>
                      <th className='px-2 font-medium'>Date / Recurrence</th>
                      <th className='px-2 font-medium'>Day</th>
                      <th className='px-2 font-medium'>Type</th>
                      <th className='px-2 font-medium'>Swap with</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.holidays.map((h) => (
                      <tr
                        key={h.id}
                        className={
                          h.kind === 'weekly-off'
                            ? 'bg-blue-150/40 border-b last:border-0'
                            : 'border-b last:border-0'
                        }
                      >
                        <td className='py-1.5 pr-3'>
                          <span className='font-medium'>{h.name}</span>
                          {h.description && (
                            <span className='text-neutral-1000 block max-w-[240px] truncate text-xs'>
                              {h.description}
                            </span>
                          )}
                        </td>
                        <td className='px-2'>
                          {h.kind === 'weekly-off' && h.weeklyOff
                            ? fmtWeeklyOff(h.weeklyOff)
                            : fmtDate(h.date)}
                        </td>
                        <td className='px-2'>{h.day}</td>
                        <td className='px-2'>
                          {h.kind === 'weekly-off' ? (
                            <Badge variant='open'>Weekly off</Badge>
                          ) : (
                            <span className='capitalize'>{h.kind}</span>
                          )}
                        </td>
                        <td className='text-neutral-1000 px-2'>
                          {h.swapWith ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HOLCAL-04: edit calendar details, holidays and published status. */}
      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit holiday calendar</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className='space-y-1'>
                <Label>Year</Label>
                <Input
                  type='number'
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                />
              </div>
            </div>
            {shiftPicker(editShiftIds, setEditShiftIds)}
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={editNotify}
                onCheckedChange={(v) => setEditNotify(v === true)}
                variant='blue'
              />
              Notify employees — share this calendar with employees
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={editPublished} onCheckedChange={setEditPublished} />
              Published — visible on the employee Holiday List
            </label>
            <div>
              <Label className='mb-1 block'>Holidays ({editHolidays.length})</Label>
              {editHolidays.length === 0 ? (
                <p className='text-neutral-1000 rounded-[6px] border border-gray-200 py-3 text-center text-sm'>
                  No records to display — add holidays below.
                </p>
              ) : (
                <div className='max-h-[180px] space-y-1 overflow-y-auto'>
                  {editHolidays.map((h) => (
                    <div
                      key={h.id}
                      className={
                        h.kind === 'weekly-off'
                          ? 'bg-blue-150/40 flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
                          : 'flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
                      }
                    >
                      <span>
                        {h.name} ·{' '}
                        {h.kind === 'weekly-off' && h.weeklyOff
                          ? fmtWeeklyOff(h.weeklyOff)
                          : `${fmtDate(h.date)} (${h.day})`}{' '}
                        ·{' '}
                        <span className='capitalize'>
                          {h.kind === 'weekly-off' ? 'weekly off' : h.kind}
                        </span>
                        {h.swapWith && ` · swaps with ${h.swapWith}`}
                      </span>
                      <Button
                        variant='outline'
                        className='text-destructive h-6 px-2 text-xs'
                        onClick={() =>
                          setEditHolidays((prev) =>
                            prev.filter((x) => x.id !== h.id)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='space-y-2 rounded-[6px] border border-gray-200 p-3'>
              <Label>Add holiday / recurring weekly off</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='Holiday name'
                  value={hName}
                  onChange={(e) => setHName(e.target.value)}
                />
                <Select
                  value={hKind}
                  onValueChange={(v) => setHKind(v as HolidayKind)}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='fixed'>Fixed</SelectItem>
                    <SelectItem value='optional'>Optional</SelectItem>
                    <SelectItem value='weekly-off'>
                      Recurring weekly off
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className='col-span-2'
                  placeholder='Description (optional)'
                  value={hDescription}
                  onChange={(e) => setHDescription(e.target.value)}
                />
                {hKind === 'weekly-off' ? (
                  <>
                    {/* Kensium recurring weekly off: day + recur on every "X" week. */}
                    <Select value={hDay} onValueChange={setHDay}>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={hWeek}
                      onValueChange={(v) => setHWeek(v as WeekChoice)}
                    >
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>Every week</SelectItem>
                        <SelectItem value='1'>1st week of the month</SelectItem>
                        <SelectItem value='2'>2nd week of the month</SelectItem>
                        <SelectItem value='3'>3rd week of the month</SelectItem>
                        <SelectItem value='4'>4th week of the month</SelectItem>
                      </SelectContent>
                    </Select>
                    <RadioGroup
                      value={hDuration}
                      onValueChange={(v) => setHDuration(v as Duration)}
                      className='col-span-2 flex gap-6'
                    >
                      <label className='flex items-center gap-2 text-sm'>
                        <RadioGroupItem value='full-day' /> Full day
                      </label>
                      <label className='flex items-center gap-2 text-sm'>
                        <RadioGroupItem value='half-day' /> Half day
                      </label>
                    </RadioGroup>
                  </>
                ) : (
                  <>
                    <Input
                      type='date'
                      value={hDate}
                      onChange={(e) => setHDate(e.target.value)}
                    />
                    <Input
                      placeholder='Swap with (optional only)'
                      value={hSwap}
                      disabled={hKind !== 'optional'}
                      onChange={(e) => setHSwap(e.target.value)}
                    />
                  </>
                )}
              </div>
              <Button variant='outline' className='h-7 gap-1' onClick={addEditHoliday}>
                <Plus size={12} weight='bold' />
                {hKind === 'weekly-off' ? 'Add weekly off' : 'Add holiday'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {shiftPicker(calShiftIds, setCalShiftIds)}
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={calNotify}
                onCheckedChange={(v) => setCalNotify(v === true)}
                variant='blue'
              />
              Notify employees — share this calendar with employees
            </label>
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
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
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
            <div className='space-y-1'>
              <Label>Full day or half day</Label>
              <RadioGroup
                value={closureDuration}
                onValueChange={(v) => setClosureDuration(v as Duration)}
                className='flex gap-6'
              >
                <label className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value='full-day' /> Full day
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value='half-day' /> Half day
                </label>
              </RadioGroup>
            </div>
            <div>
              <Label className='mb-1 block'>Locations</Label>
              {checkboxGroup(LOCATIONS, closureLocations, setClosureLocations)}
            </div>
            <div>
              <Label className='mb-1 block'>Departments (all if none selected)</Label>
              {checkboxGroup(DEPARTMENTS, closureDepts, setClosureDepts)}
            </div>
            <div className='space-y-1'>
              <Label>Details</Label>
              <Textarea
                value={closureDetails}
                onChange={(e) => setClosureDetails(e.target.value)}
                rows={2}
                placeholder='Details about the office closure'
              />
            </div>
            <div className='space-y-1'>
              <Label>Employees to be notified (email IDs, comma separated)</Label>
              <Input
                value={closureEmails}
                onChange={(e) => setClosureEmails(e.target.value)}
                placeholder='e.g. a@company.com, b@company.com'
              />
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
