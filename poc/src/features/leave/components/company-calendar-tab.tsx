import { useMemo, useState } from 'react'
import { Megaphone } from 'phosphor-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { seedCalendarAnnouncements } from '../data/config'
import { DEPARTMENTS, EMPLOYEES, LOCATIONS, fmtDate } from '../data/shared'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { LeaveCalendar } from './leave-calendar'

interface CompanyCalendarTabProps {
  requests: LeaveRequestsStore
  settings: LeaveSettingsStore
}

/**
 * Company-wide leave calendar with coverage metrics (LVE-10). Scope filters
 * update both the calendar entries and the coverage computation.
 */
export function CompanyCalendarTab({
  requests,
  settings,
}: CompanyCalendarTabProps) {
  const [dept, setDept] = useState('all')
  const [location, setLocation] = useState('all')

  const scopeEmployees = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          e.active &&
          (dept === 'all' || e.department === dept) &&
          (location === 'all' || e.location === location)
      ),
    [dept, location]
  )
  const scopeIds = scopeEmployees.map((e) => e.id)
  const scoped = requests.requests.filter((r) => scopeIds.includes(r.employeeId))

  const holidays = settings.calendars
    .filter(
      (c) =>
        c.status === 'published' &&
        (location === 'all' || c.locations.includes(location))
    )
    .flatMap((c) => c.holidays.map((h) => ({ date: h.date, name: h.name })))

  const closures = settings.closures.filter(
    (c) =>
      (location === 'all' || c.locations.includes(location)) &&
      (dept === 'all' || c.departments.includes(dept))
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Company-wide Calendar
          <span className='text-neutral-1000 ml-2 text-xs'>
            organization-wide leave with coverage metrics
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* CAL-04: event-based announcements surface on the calendar when the
          accessibility configuration has them enabled. */}
      {settings.calendarModuleEnabled &&
        settings.calendarAccess.eventAnnouncements && (
          <div className='mb-3 rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 flex items-center gap-1.5 text-sm font-medium'>
              <Megaphone size={16} weight='bold' />
              Event Announcements
              <span className='text-neutral-1000 ml-1 text-xs font-normal'>
                configured under Admin → Settings → Calendar
              </span>
            </h3>
            <div className='space-y-2'>
              {seedCalendarAnnouncements.map((a) => (
                <div key={a.id} className='flex items-start gap-3 text-sm'>
                  <span className='text-neutral-1000 w-24 shrink-0 text-xs'>
                    {fmtDate(a.date)}
                  </span>
                  <div>
                    <p className='text-neutral-1600 font-medium'>{a.title}</p>
                    <p className='text-neutral-1000 text-xs'>{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      <LeaveCalendar
        requests={scoped}
        holidays={holidays}
        closures={closures}
        showNames
        headcount={Math.max(1, scopeEmployees.length)}
      />
    </div>
  )
}
