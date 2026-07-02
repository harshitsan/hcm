import { useState } from 'react'
import { Plugs } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type AttendanceRecord } from '../data/attendance'
import { employeeName } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { type AttendanceStore } from '../hooks/use-attendance'
import { StatusBadge } from './badges'

/**
 * Platform Admin surface: tenant module enablement and capture-method
 * integrations with connection testing (TNA-21), plus the bitemporal,
 * tenant-isolated data model with point-in-time reconstruction (TNA-22).
 */
export function PlatformTab({
  config,
  attendance,
}: {
  config: AttendanceConfigStore
  attendance: AttendanceStore
}) {
  const [asOf, setAsOf] = useState<'now' | 'before'>('now')

  // Point-in-time demo: any record carrying an override has a prior state.
  const overridden: AttendanceRecord | undefined = attendance.records.find(
    (r) => r.overrides.length > 0
  )
  const lastOverride = overridden?.overrides[overridden.overrides.length - 1]
  const shownIn = asOf === 'now' ? overridden?.punchIn : lastOverride?.beforeIn
  const shownOut =
    asOf === 'now' ? (overridden?.punchOut ?? '—') : (lastOverride?.beforeOut ?? 'missing')

  return (
    <div className='w-full space-y-5'>
      {/* Tenant enablement (TNA-21) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Tenant Module Enablement ({config.tenants.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            enabling Time & Attendance makes capture methods and configuration
            available to that tenant&apos;s company administrators
          </span>
        </h3>
        <div className='space-y-2'>
          {config.tenants.map((t) => (
            <div
              key={t.tenant}
              className='flex items-center justify-between rounded-[8px] border border-gray-200 bg-white px-4 py-3'
            >
              <div>
                <p className='text-sm font-medium'>{t.tenant}</p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Capture methods: {t.captureMethods.join(', ') || 'none (module disabled)'}
                </p>
              </div>
              <Switch checked={t.enabled} onCheckedChange={() => config.toggleTenant(t.tenant)} />
            </div>
          ))}
        </div>
      </div>

      {/* Integrations (TNA-21) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Capture Integrations ({config.integrations.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            misconfigured credentials surface a clear error on test; CSV/XLS
            templates are published to admins when file import is enabled
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Integration</th>
                <th className='px-2 font-medium'>Kind</th>
                <th className='px-2 font-medium'>Endpoint / template</th>
                <th className='px-2 font-medium'>Credentials</th>
                <th className='px-2 font-medium'>Enabled</th>
                <th className='px-2 text-right font-medium'>Test</th>
              </tr>
            </thead>
            <tbody>
              {config.integrations.map((i) => (
                <tr key={i.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{i.name}</td>
                  <td className='px-2 capitalize'>{i.kind.replace('-', ' ')}</td>
                  <td className='text-neutral-1000 px-2 text-xs'>{i.endpoint}</td>
                  <td className='px-2'>
                    <StatusBadge status={i.credentialStatus} />
                  </td>
                  <td className='px-2'>
                    <Switch checked={i.enabled} onCheckedChange={() => config.toggleIntegration(i.id)} />
                  </td>
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => config.testIntegration(i.id)}
                    >
                      <Plugs size={12} weight='bold' />
                      Test Connection
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitemporal data model (TNA-22) */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>Bitemporal, tenant-scoped data model</h3>
          <ul className='text-paragraph-sm text-neutral-1000 mt-2 list-disc space-y-1.5 pl-4'>
            <li>
              Every record retains <span className='font-medium'>effective time</span> (when it
              applied) and <span className='font-medium'>transaction time</span> (when it was
              recorded), so prior states are reconstructable.
            </li>
            <li>
              Overrides and corrections preserve the previous version as history —
              nothing is overwritten.
            </li>
            <li>
              Row-level security scopes every attendance row to its owning
              company/tenant; cross-tenant access is prevented at the data layer.
            </li>
          </ul>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium'>Point-in-time reconstruction</h3>
            <Select value={asOf} onValueChange={(v) => setAsOf(v as 'now' | 'before')}>
              <SelectTrigger variant='secondary' className='h-7 w-[210px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='now'>As known now</SelectItem>
                <SelectItem value='before'>As-of before last override</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {overridden && lastOverride ? (
            <div className='mt-3 rounded-[6px] border border-gray-200 p-3 text-sm'>
              <p className='font-medium'>
                {employeeName(overridden.employeeId)} · {overridden.date}
              </p>
              <p className='pt-1'>
                Punches: <span className='font-medium'>{shownIn} → {shownOut}</span>{' '}
                {asOf === 'now' ? (
                  <Badge variant='badge_active'>current version</Badge>
                ) : (
                  <Badge variant='badge_inactive'>historical version</Badge>
                )}
              </p>
              <p className='text-paragraph-sm text-neutral-1000 pt-1'>
                Override recorded {lastOverride.at} by {lastOverride.by} — the query
                returns the values that were effective and known at the chosen time.
              </p>
            </div>
          ) : (
            <p className='text-paragraph-sm text-neutral-1000 pt-3'>
              No overridden records available to reconstruct.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
