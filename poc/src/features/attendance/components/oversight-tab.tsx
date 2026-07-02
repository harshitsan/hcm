import { ShieldCheck } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GROUP_COMPANIES } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { SummaryCards } from './summary-cards'

/**
 * Group Company Admin oversight (TNA-20): shift/holiday/overtime/statutory
 * configuration and compliance trends across the companies in the group —
 * scoped so only in-group companies are visible.
 */
export function OversightTab({ config }: { config: AttendanceConfigStore }) {
  const rows = config.groupCompliance
  const totalViolations = rows.reduce((s, r) => s + r.violations30d, 0)
  const totalOt = rows.reduce((s, r) => s + r.otHours30d, 0)
  const deviations = rows.filter((r) => r.deviation !== null).length

  return (
    <div className='w-full space-y-4'>
      <SummaryCards
        title='Group Oversight — last 30 days'
        items={[
          { label: 'Companies in scope', value: rows.length },
          { label: 'Statutory violations', value: totalViolations },
          { label: 'Overtime hours', value: totalOt },
          { label: 'Policy deviations', value: deviations },
        ]}
      />

      <div className='flex items-start gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
        <ShieldCheck size={16} weight='bold' className='text-neutral-1000 mt-0.5 shrink-0' />
        <p className='text-paragraph-sm text-neutral-1000'>
          Data is scoped to your group: {GROUP_COMPANIES.join(', ')}. Companies
          outside your group scope are not accessible.
        </p>
      </div>

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Cross-Company Attendance Configuration & Compliance
          </h3>
          <Button
            variant='outline'
            className='h-7 text-xs'
            onClick={() =>
              toast.success('Group compliance report exported (group-compliance-30d.xlsx)')
            }
          >
            Export Group Report
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Company</th>
                <th className='px-2 font-medium'>Shift patterns</th>
                <th className='px-2 font-medium'>Holiday calendars</th>
                <th className='px-2 font-medium'>OT policy</th>
                <th className='px-2 font-medium'>Max daily hours</th>
                <th className='px-2 font-medium'>Violations (30d)</th>
                <th className='px-2 font-medium'>OT hours (30d)</th>
                <th className='px-2 font-medium'>Deviation</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.company} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{r.company}</td>
                  <td className='px-2'>{r.shiftPatterns}</td>
                  <td className='px-2'>{r.holidayCalendars}</td>
                  <td className='px-2'>{r.otPolicy}</td>
                  <td className='px-2'>{r.maxDailyHours}h</td>
                  <td className='px-2'>
                    {r.violations30d > 5 ? (
                      <Badge variant='overdue'>{r.violations30d}</Badge>
                    ) : (
                      r.violations30d
                    )}
                  </td>
                  <td className='px-2'>{r.otHours30d}</td>
                  <td className='px-2'>
                    {r.deviation ? (
                      <span className='text-destructive text-xs font-medium'>{r.deviation}</span>
                    ) : (
                      <Badge variant='badge_active'>In policy</Badge>
                    )}
                  </td>
                  <td className='px-2 text-right'>
                    {r.deviation && (
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() =>
                          toast.success(
                            `Correction directive sent to ${r.company}'s Company Admin`
                          )
                        }
                      >
                        Direct Correction
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
