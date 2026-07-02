import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEPARTMENTS, EMPLOYEES, LOCATIONS } from '../data/shared'
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
