import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LOCATIONS, fmtDate } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { StatusBadge } from './badges'

const HOLIDAY_SCOPES = ['Company-wide', ...LOCATIONS] as const

const holidaySchema = z.object({
  name: z.string().min(2, 'Holiday name is required'),
  date: z.string().min(1, 'Pick a date'),
  scope: z.string().min(1, 'Pick a scope'),
  kind: z.enum(['mandatory', 'optional']),
})

type HolidayValues = z.infer<typeof holidaySchema>

const WEEKDAYS = ['Sunday', 'Saturday', 'Friday'] as const

/**
 * Holiday calendars scoped company-wide or per location, with optional
 * holidays (TNA-07/08), plus statutory working-hours configuration aligned to
 * Indian labor law (TNA-12) — both versioned and effective-dated (TNA-24).
 */
export function ConfigHolidays({ config }: { config: AttendanceConfigStore }) {
  const [holidayOpen, setHolidayOpen] = useState(false)
  const cal = config.activeCalendar
  const stat = config.activeStatutory

  const form = useForm<HolidayValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { name: '', date: '2026-10-02', scope: 'Company-wide', kind: 'mandatory' },
  })
  useEffect(() => {
    if (holidayOpen) form.reset()
  }, [holidayOpen, form])

  const [daily, setDaily] = useState(String(stat.dailyHours))
  const [maxDaily, setMaxDaily] = useState(String(stat.maxDailyHours))
  const [maxWeekly, setMaxWeekly] = useState(String(stat.maxWeeklyHours))
  const [weeklyOff, setWeeklyOff] = useState(stat.weeklyOffDay)
  const [effective, setEffective] = useState('2026-08-01')

  const saveStat = () => {
    const d = Number(daily)
    const md = Number(maxDaily)
    const mw = Number(maxWeekly)
    if (!d || !md || !mw || md < d || mw < md) {
      toast.error('Enter valid limits: max daily ≥ daily hours and max weekly ≥ max daily')
      return
    }
    config.saveStatutory({
      dailyHours: d,
      maxDailyHours: md,
      maxWeeklyHours: mw,
      weeklyOffDay: weeklyOff,
      effectiveFrom: effective,
    })
  }

  return (
    <div className='w-full space-y-5'>
      {/* Holiday calendar (TNA-07/08) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Holiday Calendar — {cal.name} v{cal.version} ({cal.holidays.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              effective {fmtDate(cal.effectiveFrom)} · employees may opt into{' '}
              {cal.optionalAllowance} optional holidays · work on a holiday earns
              holiday-category overtime
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setHolidayOpen(true)}>
            <Plus size={12} weight='bold' />
            Add Holiday
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Holiday</th>
                <th className='px-2 font-medium'>Date</th>
                <th className='px-2 font-medium'>Scope</th>
                <th className='px-2 font-medium'>Type</th>
              </tr>
            </thead>
            <tbody>
              {[...cal.holidays]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((h) => (
                  <tr key={h.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{h.name}</td>
                    <td className='px-2'>{fmtDate(h.date)}</td>
                    <td className='px-2'>
                      {h.scope === 'Company-wide' ? (
                        h.scope
                      ) : (
                        <Badge variant='open'>{h.scope}</Badge>
                      )}
                    </td>
                    <td className='px-2'>
                      {h.kind === 'optional' ? (
                        <Badge variant='open'>Optional</Badge>
                      ) : (
                        <Badge variant='badge_active'>Mandatory</Badge>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar version history (TNA-24) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Calendar Versions
          <span className='text-neutral-1000 ml-2 text-xs'>
            superseded versions stay visible; engines read the version effective
            for the date being evaluated
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Calendar</th>
                <th className='px-2 font-medium'>Year</th>
                <th className='px-2 font-medium'>Optional allowance</th>
                <th className='px-2 font-medium'>Version</th>
                <th className='px-2 font-medium'>Effective from</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {config.calendars.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{c.name}</td>
                  <td className='px-2'>{c.year}</td>
                  <td className='px-2'>{c.optionalAllowance}</td>
                  <td className='px-2'>v{c.version}</td>
                  <td className='px-2'>{fmtDate(c.effectiveFrom)}</td>
                  <td className='px-2'>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory working hours (TNA-12) */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>
            Statutory Working Hours (Indian labor law)
          </h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-1'>
            Worked hours beyond these limits are flagged as compliance
            violations; work on the weekly-off day is identified for
            holiday-category overtime handling.
          </p>
          <div className='mt-3 grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Daily hours</Label>
              <Input type='number' value={daily} onChange={(e) => setDaily(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Max daily</Label>
              <Input type='number' value={maxDaily} onChange={(e) => setMaxDaily(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Max weekly</Label>
              <Input
                type='number'
                value={maxWeekly}
                onChange={(e) => setMaxWeekly(e.target.value)}
              />
            </div>
          </div>
          <div className='mt-3 grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Weekly off</Label>
              <Select value={weeklyOff} onValueChange={setWeeklyOff}>
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
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Effective from</Label>
              <Input type='date' value={effective} onChange={(e) => setEffective(e.target.value)} />
            </div>
          </div>
          <Button className='mt-4 h-7' onClick={saveStat}>
            Save as New Version
          </Button>
        </div>

        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Statutory Versions
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Daily / Max daily / Max weekly</th>
                  <th className='px-2 font-medium'>Weekly off</th>
                  <th className='px-2 font-medium'>Version</th>
                  <th className='px-2 font-medium'>Effective</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {config.statutory.map((s) => (
                  <tr key={s.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>
                      {s.dailyHours}h / {s.maxDailyHours}h / {s.maxWeeklyHours}h
                    </td>
                    <td className='px-2'>{s.weeklyOffDay}</td>
                    <td className='px-2'>v{s.version}</td>
                    <td className='px-2'>{fmtDate(s.effectiveFrom)}</td>
                    <td className='px-2'>
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add holiday</DialogTitle>
            <DialogDescription>
              Scope it to the whole company or a specific location; optional
              holidays are handled distinctly from fixed holidays.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                config.addHoliday(values)
                setHolidayOpen(false)
              })}
              className='space-y-3'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday name</FormLabel>
                    <FormControl>
                      <Input placeholder='Gandhi Jayanti' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='kind'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='mandatory'>Mandatory</SelectItem>
                          <SelectItem value='optional'>Optional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='scope'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HOLIDAY_SCOPES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setHolidayOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Add Holiday</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
