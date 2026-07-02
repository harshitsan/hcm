import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { employeeById, employeeName, fmtDate, fmtHours } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { OtBadge, StatusBadge } from './badges'
import { SummaryCards } from './summary-cards'

/**
 * Overtime management (TNA-09/10/25/26/30): the Time engine's accrued OT,
 * the Rules engine decision table + worker-category eligibility, and
 * location-routed approver configurations with the supervisor cap.
 */
export function OvertimeTab({
  attendance,
  config,
}: {
  attendance: AttendanceStore
  config: AttendanceConfigStore
}) {
  const [capDrafts, setCapDrafts] = useState<Record<string, string>>({})

  const otRecords = attendance.records.filter(
    (r) => r.overtimeHours > 0 && !r.duplicateOfId && r.employeeId !== null
  )
  const byCategory = (cat: string) =>
    Math.round(
      otRecords
        .filter((r) => r.overtimeCategory === cat)
        .reduce((sum, r) => sum + r.overtimeHours, 0) * 100
    ) / 100

  const otWorkflows = config.workflows.filter((w) => w.kind === 'overtime')

  return (
    <div className='w-full space-y-5'>
      <SummaryCards
        title='Overtime — calculated and categorized by the shared engines'
        items={[
          { label: 'Total OT hours', value: fmtHours(attendance.summary.overtimeHours) },
          { label: 'Normal OT', value: fmtHours(byCategory('normal')) },
          { label: 'Holiday OT', value: fmtHours(byCategory('holiday')) },
          { label: 'Night-shift OT', value: fmtHours(byCategory('night-shift')) },
        ]}
      />

      {/* Accrued OT register (TNA-09/25) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Accrued Overtime ({otRecords.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            worked hours beyond standard, categorized by day type and shift;
            finalized OT flows to payroll
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Worker category</th>
                <th className='px-2 font-medium'>Date</th>
                <th className='px-2 font-medium'>Day type</th>
                <th className='px-2 font-medium'>OT hours</th>
                <th className='px-2 font-medium'>Category</th>
                <th className='px-2 font-medium'>Eligible</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {otRecords.map((r) => {
                const emp = employeeById(r.employeeId)
                const eligible = config.otEligibility.find(
                  (e) => e.category === emp?.workerCategory
                )?.eligible
                return (
                  <tr key={r.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{employeeName(r.employeeId)}</td>
                    <td className='px-2'>{emp?.workerCategory ?? '—'}</td>
                    <td className='px-2'>{fmtDate(r.date)}</td>
                    <td className='px-2 capitalize'>{r.dayType}</td>
                    <td className='px-2 font-medium'>{fmtHours(r.overtimeHours)}</td>
                    <td className='px-2'>
                      <OtBadge category={r.overtimeCategory} />
                    </td>
                    <td className='px-2'>
                      {eligible ? (
                        'Yes'
                      ) : (
                        <span className='text-neutral-1000'>No — accrues none</span>
                      )}
                    </td>
                    <td className='px-2'>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Rules engine decision table (TNA-26) */}
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Rules Engine — Decision Table
            <span className='text-neutral-1000 ml-2 text-xs'>
              config-driven categorization, no code changes
            </span>
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Condition</th>
                  <th className='px-2 font-medium'>Category</th>
                  <th className='px-2 font-medium'>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {config.overtimeRules.map((rule) => (
                  <tr key={rule.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>{rule.condition}</td>
                    <td className='px-2'>
                      <OtBadge category={rule.category} />
                    </td>
                    <td className='px-2'>{rule.multiplier}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worker-category eligibility (TNA-10) */}
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Eligibility by Worker Category
            <span className='text-neutral-1000 ml-2 text-xs'>
              ineligible categories are excluded from OT accrual
            </span>
          </h3>
          <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white p-3'>
            {config.otEligibility.map((e) => (
              <div
                key={e.category}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
              >
                <span className='font-medium'>{e.category}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1000 text-xs'>
                    {e.eligible ? 'Eligible for overtime' : 'Not eligible'}
                  </span>
                  <Switch
                    checked={e.eligible}
                    onCheckedChange={() => config.toggleOtEligibility(e.category)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OT approvers with location routing + supervisor cap (TNA-30) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Overtime Approvers ({otWorkflows.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            requests above the supervisor cap require higher authorization;
            edits apply to subsequently submitted requests
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Applicable locations</th>
                <th className='px-2 font-medium'>Approver hierarchy</th>
                <th className='px-2 font-medium'>Supervisor cap (h)</th>
                <th className='px-2 font-medium'>Version</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {otWorkflows.map((w) => (
                <tr key={w.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{w.scope}</td>
                  <td className='px-2'>{w.levels.join(' → ')}</td>
                  <td className='px-2'>
                    <Input
                      type='number'
                      className='h-7 w-20'
                      value={capDrafts[w.id] ?? String(w.supervisorCapHours ?? 0)}
                      onChange={(e) =>
                        setCapDrafts((prev) => ({ ...prev, [w.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className='px-2'>v{w.version}</td>
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => {
                        const cap = Number(capDrafts[w.id] ?? w.supervisorCapHours)
                        if (Number.isNaN(cap) || cap <= 0) {
                          toast.error('Cap must be a positive number of hours')
                          return
                        }
                        config.updateWorkflow(w.id, { supervisorCapHours: cap })
                      }}
                    >
                      Save
                    </Button>
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
