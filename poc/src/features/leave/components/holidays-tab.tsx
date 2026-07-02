import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MAX_OPTIONAL_HOLIDAYS } from '../data/holidays'
import { CURRENT_EMPLOYEE_ID, LOCATIONS, fmtDate } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { StatusBadge } from './badges'

/**
 * Employee Holiday List (LVE-33): published holidays filtered by location and
 * year, optional-holiday confirmation limited by policy, and swap options.
 */
export function HolidaysTab({ settings }: { settings: LeaveSettingsStore }) {
  const [location, setLocation] = useState<string>('Hyderabad')
  const [year, setYear] = useState('2026')

  const calendar = useMemo(
    () =>
      settings.calendars.find(
        (c) =>
          c.status === 'published' &&
          c.year === Number(year) &&
          c.locations.includes(location)
      ),
    [location, settings.calendars, year]
  )

  const myChoices = settings.optionalRequests.filter(
    (r) => r.employeeId === CURRENT_EMPLOYEE_ID && r.status !== 'rejected'
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Holiday List
          <span className='text-neutral-1000 ml-2 text-xs'>
            confirmed optional holidays: {myChoices.length} / {MAX_OPTIONAL_HOLIDAYS}
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
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
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger variant='secondary' className='h-7 w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='2026'>2026</SelectItem>
              <SelectItem value='2027'>2027</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!calendar ? (
        <div className='text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-8 text-center text-sm'>
          No published holiday calendar for {location}, {year}.
        </div>
      ) : (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Holiday</th>
                <th className='px-2 font-medium'>Date</th>
                <th className='px-2 font-medium'>Day</th>
                <th className='px-2 font-medium'>Type</th>
                <th className='px-2 font-medium'>Swap with</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {calendar.holidays.map((h) => {
                const choice = myChoices.find((c) => c.holidayName === h.name)
                const swapTarget = h.swapWith
                return (
                  <tr key={h.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{h.name}</td>
                    <td className='px-2'>{fmtDate(h.date)}</td>
                    <td className='px-2'>{h.day}</td>
                    <td className='px-2'>
                      <Badge variant={h.kind === 'fixed' ? 'completed' : 'open'}>
                        {h.kind === 'fixed' ? 'Fixed' : 'Optional'}
                      </Badge>
                    </td>
                    <td className='text-neutral-1000 px-2'>{h.swapWith ?? '—'}</td>
                    <td className='px-2 text-right'>
                      {h.kind === 'optional' &&
                        (choice ? (
                          <span className='inline-flex items-center gap-2'>
                            <StatusBadge status={choice.status} />
                            {swapTarget && (
                              <Button
                                variant='outline'
                                className='h-6 px-2 text-xs'
                                onClick={() =>
                                  settings.swapOptionalHoliday(choice.id, swapTarget)
                                }
                              >
                                Swap → {swapTarget}
                              </Button>
                            )}
                          </span>
                        ) : (
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() =>
                              settings.confirmOptionalHoliday(h.name, h.date, h.day)
                            }
                          >
                            Confirm
                          </Button>
                        ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
