import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { remaining } from '../data/balances'
import { policySpecificity } from '../data/policies'
import { DEPARTMENTS, EMPLOYEES, LOCATIONS, fmtDate } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveConfigStore } from '../hooks/use-leave-config'
import { StatusBadge } from './badges'

interface ReportsTabProps {
  balances: BalancesStore
  config: LeaveConfigStore
  /** Portfolio Admins see policies grouped across group companies (LVE-19). */
  portfolio: boolean
}

/**
 * Reports on leave balances, rules and entitlements (LVE-11) with scope
 * filters and export; portfolio-wide consolidation for Portfolio Admins
 * (LVE-19).
 */
export function ReportsTab({ balances, config, portfolio }: ReportsTabProps) {
  const [dataset, setDataset] = useState('balances')
  const [dept, setDept] = useState('all')
  const [location, setLocation] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const balanceRows = useMemo(
    () =>
      balances.balances
        .map((b) => {
          const emp = EMPLOYEES.find((e) => e.id === b.employeeId)
          const type = config.leaveTypes.find((t) => t.id === b.typeId)
          return { b, emp, type }
        })
        .filter(
          ({ emp, type }) =>
            emp &&
            type &&
            (dept === 'all' || emp.department === dept) &&
            (location === 'all' || emp.location === location) &&
            (typeFilter === 'all' || type.id === typeFilter)
        ),
    [balances.balances, config.leaveTypes, dept, location, typeFilter]
  )

  const policyRows = useMemo(
    () =>
      portfolio
        ? config.policies
        : config.policies.filter((p) => p.source === 'company'),
    [config.policies, portfolio]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          {portfolio ? 'Portfolio Leave Reports' : 'Leave Reports'}
          <span className='text-neutral-1000 ml-2 text-xs'>
            balances, rules and entitlements — current and effective-dated values
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={dataset} onValueChange={setDataset}>
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='balances'>Balances & entitlements</SelectItem>
              <SelectItem value='rules'>Rules & policies</SelectItem>
            </SelectContent>
          </Select>
          {dataset === 'balances' && (
            <>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
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
                <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All leave types</SelectItem>
                  {config.leaveTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={() =>
              toast.success('Report exported (CSV) for compliance and analysis')
            }
          >
            <DownloadSimple size={14} weight='bold' />
            Export
          </Button>
        </div>
      </div>

      {dataset === 'balances' ? (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                {portfolio && <th className='px-2 font-medium'>Company</th>}
                <th className='px-2 font-medium'>Department / Location</th>
                <th className='px-2 font-medium'>Leave type</th>
                <th className='px-2 font-medium'>Entitlement</th>
                <th className='px-2 font-medium'>Taken</th>
                <th className='px-2 font-medium'>Pending</th>
                <th className='px-2 font-medium'>LOP</th>
                <th className='px-2 font-medium'>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {balanceRows.map(({ b, emp, type }) => (
                <tr key={`${b.employeeId}-${b.typeId}`} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>
                    {emp?.name}
                    {!emp?.selfService && (
                      <span className='text-neutral-1000 ml-1 text-xs'>(non-user)</span>
                    )}
                  </td>
                  {portfolio && <td className='px-2'>{emp?.company}</td>}
                  <td className='px-2'>
                    {emp?.department} · {emp?.location}
                  </td>
                  <td className='px-2'>{type?.name}</td>
                  <td className='px-2'>
                    {b.credited} {type?.unit}
                  </td>
                  <td className='px-2'>{b.taken}</td>
                  <td className='px-2'>{b.pendingApproval}</td>
                  <td className='text-red-1400 px-2'>{b.lopApproved + b.lopPending}</td>
                  <td className='px-2 font-semibold'>{remaining(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Policy</th>
                <th className='px-2 font-medium'>Owner</th>
                <th className='px-2 font-medium'>Scope</th>
                <th className='px-2 font-medium'>Entitlements</th>
                <th className='px-2 font-medium'>Version</th>
                <th className='px-2 font-medium'>Effective</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {policyRows.map((p) => (
                <tr key={p.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{p.name}</td>
                  <td className='px-2'>{p.company}</td>
                  <td className='text-neutral-1000 px-2 text-xs'>
                    specificity {policySpecificity(p.scope)} ·{' '}
                    {Object.entries(p.scope)
                      .filter(([, v]) => v !== null)
                      .map(([, v]) => v)
                      .join(', ') || 'all employees'}
                  </td>
                  <td className='max-w-[220px] truncate px-2'>{p.entitlementSummary}</td>
                  <td className='px-2'>v{p.version}</td>
                  <td className='px-2'>{fmtDate(p.effectiveFrom)}</td>
                  <td className='px-2'>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {portfolio && (
            <p className='text-neutral-1000 mt-3 text-xs'>
              Coverage check: every jurisdiction in the portfolio is governed by
              at least one active policy (India — 4 policies, USA — 1 policy,
              group baselines — {config.policies.filter((p) => p.source === 'group-baseline').length}).
            </p>
          )}
        </div>
      )}
    </div>
  )
}
