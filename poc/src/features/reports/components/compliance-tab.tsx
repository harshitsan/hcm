import { useMemo, useState } from 'react'
import { DownloadSimple, Scales } from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  COMPLIANCE_PERIODS,
  decisionRules,
  esicStatus,
  pfStatus,
  templateForPeriod,
  type CompliancePeriod,
  type TemplateVersion,
} from '../data/compliance'
import { type Company } from '../data/report-catalog'
import { type ComplianceStore } from '../hooks/use-compliance'
import { NonUserBadge, StatusBadge } from './badges'

const REGISTERS = [
  { value: 'eligibility', label: 'PF / ESIC Eligibility' },
  { value: 'completeness', label: 'Statutory Data Completeness' },
  { value: 'attendance', label: 'Attendance Register' },
  { value: 'leave', label: 'Leave Register' },
  { value: 'wage', label: 'Wage Register' },
] as const

type RegisterKey = (typeof REGISTERS)[number]['value']

const REGISTER_TEMPLATE: Partial<
  Record<RegisterKey, TemplateVersion['register']>
> = {
  attendance: 'Attendance Register',
  leave: 'Leave Register',
  wage: 'Wage Register',
  eligibility: 'PF/ESIC Format',
}

interface ComplianceTabProps {
  store: ComplianceStore
  templates: TemplateVersion[]
  companies: Company[]
}

/**
 * Statutory compliance suite (RPT-10): PF/ESIC eligibility evaluated by the
 * Rules engine decision tables (RPT-25), completeness flagging (RPT-11),
 * and the attendance/leave/wage registers rendered from governed,
 * effective-dated templates (RPT-21). Non-user employees are always included
 * (RPT-16).
 */
export function ComplianceTab({
  store,
  templates,
  companies,
}: ComplianceTabProps) {
  const [register, setRegister] = useState<RegisterKey>('eligibility')
  const [period, setPeriod] = useState<CompliancePeriod>('June 2026')

  const rows = useMemo(
    () => store.employees.filter((e) => companies.includes(e.company)),
    [store.employees, companies]
  )
  const flagged = useMemo(
    () => store.flagged.filter(({ emp }) => companies.includes(emp.company)),
    [store.flagged, companies]
  )

  const registerLabel = REGISTERS.find((r) => r.value === register)?.label
  const templateKey = REGISTER_TEMPLATE[register]
  const template = templateKey
    ? templateForPeriod(templates, templateKey, period)
    : undefined

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Compliance Reports & Registers
          <span className='text-neutral-1000 ml-2 text-xs'>
            {rows.length} in-scope employees incl. non-users
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <Select
            value={register}
            onValueChange={(v) => setRegister(v as RegisterKey)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[240px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGISTERS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as CompliancePeriod)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPLIANCE_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={() =>
              toast.success(
                `${registerLabel} exported in statutory submission format (${period})`
              )
            }
          >
            <DownloadSimple size={14} weight='bold' />
            Export for filing
          </Button>
        </div>
      </div>

      {template && (
        <div className='bg-blue-150 text-blue-1400 mb-3 flex items-start gap-2 rounded-[6px] px-3 py-2 text-xs'>
          <Scales size={14} className='mt-0.5 shrink-0' />
          Generated with {template.register} template v{template.version}{' '}
          (effective {template.effectiveFrom}) — the version in effect for{' '}
          {period}; template changes apply via config without code deployment.
        </div>
      )}

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        {register === 'eligibility' && (
          <>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Employee</th>
                  <th className='px-2 font-medium'>Company · Dept</th>
                  <th className='px-2 font-medium'>Monthly wage</th>
                  <th className='px-2 font-medium'>PF status</th>
                  <th className='px-2 font-medium'>ESIC status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>
                      {e.name} {!e.isUser && <NonUserBadge />}
                    </td>
                    <td className='text-neutral-1000 px-2 text-xs'>
                      {e.company} · {e.department}
                    </td>
                    <td className='px-2'>{inr(e.monthlyWage)}</td>
                    <td className='px-2'>
                      <StatusBadge status={pfStatus(e.monthlyWage)} />
                    </td>
                    <td className='px-2'>
                      <StatusBadge status={esicStatus(e.monthlyWage)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className='text-neutral-1000 mt-3 text-xs'>
              Evaluated by the shared Rules engine using configured decision
              tables:{' '}
              {decisionRules
                .filter((r) => r.table !== 'Statutory Completeness')
                .map((r) => `${r.condition} → ${r.outcome} (${r.version})`)
                .join(' · ')}
              . Rule versions are effective-dated per reporting period.
            </p>
          </>
        )}

        {register === 'completeness' && (
          <>
            <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
              {flagged.length} record(s) failing the required-field rules ·{' '}
              {rows.length - flagged.length} complete
            </p>
            {flagged.length === 0 ? (
              <p className='text-neutral-1000 py-6 text-center text-sm'>
                No completeness gaps — all in-scope records pass the statutory
                required-field rules.
              </p>
            ) : (
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-neutral-1000 border-b text-left text-xs'>
                    <th className='py-2 pr-3 font-medium'>Employee</th>
                    <th className='px-2 font-medium'>Company · Dept</th>
                    <th className='px-2 font-medium'>Missing fields</th>
                    <th className='px-2 text-right font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map(({ emp, missing }) => (
                    <tr key={emp.id} className='border-b last:border-0'>
                      <td className='py-2 pr-3 font-medium'>
                        {emp.name} {!emp.isUser && <NonUserBadge />}
                      </td>
                      <td className='text-neutral-1000 px-2 text-xs'>
                        {emp.company} · {emp.department}
                      </td>
                      <td className='px-2'>
                        <div className='flex flex-wrap gap-1'>
                          {missing.map((m) => (
                            <Badge key={m} variant='overdue'>
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className='px-2 text-right'>
                        <RoleGate roles={['Company Admin', 'Platform Admin']}>
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => store.completeRecord(emp.id)}
                          >
                            Mark data completed
                          </Button>
                        </RoleGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className='text-neutral-1000 mt-3 text-xs'>
              Completeness rules v3 (effective 2026-04-01) run in the Rules
              engine; completing a record removes it from the flagged list on
              the next run.
            </p>
          </>
        )}

        {(register === 'attendance' ||
          register === 'leave' ||
          register === 'wage') && (
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Company · Dept</th>
                {register === 'attendance' && (
                  <>
                    <th className='px-2 font-medium'>Days present</th>
                    <th className='px-2 font-medium'>Leave days</th>
                    <th className='px-2 font-medium'>Loss of Pay days</th>
                  </>
                )}
                {register === 'leave' && (
                  <>
                    <th className='px-2 font-medium'>Leave availed</th>
                    <th className='px-2 font-medium'>Loss of Pay (unpaid)</th>
                  </>
                )}
                {register === 'wage' && (
                  <>
                    <th className='px-2 font-medium'>Monthly wage</th>
                    <th className='px-2 font-medium'>Loss of Pay deduction</th>
                    <th className='px-2 font-medium'>Net payable</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const lopDeduction = Math.round(
                  (e.monthlyWage / 30) * e.lopDays
                )
                return (
                  <tr key={e.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>
                      {e.name} {!e.isUser && <NonUserBadge />}
                    </td>
                    <td className='text-neutral-1000 px-2 text-xs'>
                      {e.company} · {e.department}
                    </td>
                    {register === 'attendance' && (
                      <>
                        <td className='px-2'>{e.attendanceDays}</td>
                        <td className='px-2'>{e.leaveDays}</td>
                        <td className='text-red-1400 px-2'>{e.lopDays}</td>
                      </>
                    )}
                    {register === 'leave' && (
                      <>
                        <td className='px-2'>{e.leaveDays}</td>
                        <td className='text-red-1400 px-2'>{e.lopDays}</td>
                      </>
                    )}
                    {register === 'wage' && (
                      <>
                        <td className='px-2'>{inr(e.monthlyWage)}</td>
                        <td className='text-red-1400 px-2'>
                          {inr(lopDeduction)}
                        </td>
                        <td className='px-2 font-semibold'>
                          {inr(e.monthlyWage - lopDeduction)}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
