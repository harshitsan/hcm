import { useMemo, useState } from 'react'
import { ROLES } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DASHBOARD_LAYOUTS, type DashboardLayout } from '../data/dashboards'
import { REPORT_CATEGORIES } from '../data/report-catalog'
import { type ReportConfigStore } from '../hooks/use-report-config'
import { CustomFieldBadge } from './badges'
import { GovernancePlatformPanels } from './governance-platform'

/**
 * Platform Admin governance surface: per-tenant report catalog and
 * role-dashboard config (RPT-22), builder field metadata (RPT-23), RLS
 * grants (RPT-20), statutory templates (RPT-21) and shared engines
 * (RPT-24, RPT-25).
 */
export function GovernanceTab({ config }: { config: ReportConfigStore }) {
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0])

  const categoryReports = useMemo(
    () => config.reports.filter((r) => r.category === category),
    [config.reports, category]
  )
  const enabledCount = config.reports.filter((r) => r.enabled).length

  return (
    <div className='w-full space-y-4'>
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {/* Tenant report catalog config (RPT-22) */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              Tenant report catalog{' '}
              <span className='text-neutral-1000 text-xs font-normal'>
                {enabledCount}/{config.reports.length} enabled
              </span>
            </p>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger variant='secondary' className='h-7 w-[210px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            {categoryReports.map((r) => (
              <div
                key={r.id}
                className='flex items-center justify-between gap-2 border-b pb-1.5 text-sm last:border-0'
              >
                <span className={r.enabled ? '' : 'text-neutral-1000'}>
                  {r.name}
                </span>
                <Switch
                  checked={r.enabled}
                  onCheckedChange={() => config.toggleReport(r.id)}
                />
              </div>
            ))}
          </div>
          <p className='text-neutral-1000 mt-2 text-xs'>
            Disabled reports disappear from every role's catalog immediately —
            no code change required.
          </p>
        </div>

        <div className='space-y-3'>
          {/* Role → default dashboard mapping (RPT-05, RPT-22) */}
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
              Role-based default dashboards
            </p>
            <div className='space-y-2'>
              {ROLES.map((role) => {
                const mapping = config.roleDashboards.find(
                  (m) => m.role === role
                )
                if (!mapping) return null
                return (
                  <div
                    key={role}
                    className='flex items-center justify-between gap-2 text-sm'
                  >
                    <span className='min-w-0 truncate'>{role}</span>
                    <div className='flex items-center gap-2'>
                      <Badge variant='open'>
                        v{mapping.version} · eff. {mapping.effectiveFrom}
                      </Badge>
                      <Select
                        value={mapping.layout}
                        onValueChange={(v) =>
                          config.setRoleDashboard(role, v as DashboardLayout)
                        }
                      >
                        <SelectTrigger
                          variant='secondary'
                          className='h-7 w-[210px]'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DASHBOARD_LAYOUTS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className='text-neutral-1000 mt-2 text-xs'>
              Changes are versioned and effective-dated; users of the role get
              the new default on their next login without manual setup.
            </p>
          </div>

          {/* Builder field metadata (RPT-23) */}
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
              Ad hoc builder field catalog
            </p>
            <div className='space-y-1.5'>
              {config.fields.map((f) => (
                <div
                  key={f.key}
                  className='flex items-center justify-between gap-2 border-b pb-1.5 text-sm last:border-0'
                >
                  <span
                    className={`flex items-center gap-2 ${f.visible ? '' : 'text-neutral-1000'}`}
                  >
                    {f.label}
                    {f.source === 'custom' && <CustomFieldBadge />}
                  </span>
                  <Switch
                    checked={f.visible}
                    onCheckedChange={() => config.toggleField(f.key)}
                  />
                </div>
              ))}
            </div>
            <p className='text-neutral-1000 mt-2 text-xs'>
              The builder's selectable field list is derived from this tenant
              metadata schema — newly configured custom/UDF fields become
              reportable here; hidden fields stop appearing.
            </p>
          </div>
        </div>
      </div>

      <GovernancePlatformPanels config={config} />
    </div>
  )
}
