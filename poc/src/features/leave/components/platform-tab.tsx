import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { INTEGRITY_CONSTRAINTS } from '../data/config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'

/**
 * Platform Admin surface: master leave-type catalog and global defaults
 * (LVE-20), tenant-scoped isolation / RLS (LVE-22) and data-model integrity
 * constraints (LVE-23).
 */
export function PlatformTab({ settings }: { settings: LeaveSettingsStore }) {
  const d = settings.platformDefaults

  return (
    <div className='w-full space-y-5'>
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* LVE-20: master catalog */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
            Master Leave-Type Catalog
          </h3>
          <p className='text-neutral-1000 mb-3 text-xs'>
            Tenants configure their leave types from this catalog; disabling an
            entry removes it from new tenant configurations.
          </p>
          <div className='space-y-1.5'>
            {settings.catalog.map((c) => (
              <div
                key={c.id}
                className='flex items-center justify-between rounded-[6px] border border-gray-100 px-3 py-1.5 text-sm'
              >
                <span className='flex items-center gap-2'>
                  {c.name}
                  {c.statutory && <Badge variant='open'>Statutory</Badge>}
                </span>
                <Switch
                  checked={c.enabledForTenants}
                  onCheckedChange={() => settings.toggleCatalogEntry(c.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* LVE-20: global defaults */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
            Global Defaults (inherited on tenant provisioning)
          </h3>
          <p className='text-neutral-1000 mb-3 text-xs'>
            New tenants inherit these workflow, SLA and audit defaults and can
            differentiate them downstream.
          </p>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between'>
              <span>Leave management feature available</span>
              <Switch
                checked={d.leaveModuleAvailable}
                onCheckedChange={(v) => settings.setDefaults({ leaveModuleAvailable: v })}
              />
            </div>
            <div className='flex items-center justify-between'>
              <span>SLA-based escalation</span>
              <Switch
                checked={d.escalationEnabled}
                onCheckedChange={(v) => settings.setDefaults({ escalationEnabled: v })}
              />
            </div>
            <div className='flex items-center justify-between'>
              <span>Bitemporal storage (valid-time + transaction-time)</span>
              <Switch
                checked={d.bitemporalStorage}
                onCheckedChange={(v) => settings.setDefaults({ bitemporalStorage: v })}
              />
            </div>
            <div className='flex items-center justify-between'>
              <span>Row-level security enforced</span>
              <Switch
                checked={d.rlsEnforced}
                onCheckedChange={(v) => settings.setDefaults({ rlsEnforced: v })}
              />
            </div>
            <div className='text-neutral-1000 flex items-center justify-between text-xs'>
              <span>Default approval SLA</span>
              <span>{d.defaultSlaHours} hours</span>
            </div>
            <div className='text-neutral-1000 flex items-center justify-between text-xs'>
              <span>Audit retention</span>
              <span>{d.auditRetentionYears} years</span>
            </div>
          </div>
        </div>
      </div>

      {/* LVE-22: tenant isolation */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
          Tenant Isolation (Row-Level Security)
        </h3>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Every leave row is scoped to its owning tenant. Cross-tenant access
          is denied and logged; data stays fully reportable within each
          tenant’s own scope.
        </p>
        <table className='mb-3 w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Tenant</th>
              <th className='px-2 font-medium'>Leave rows</th>
              <th className='px-2 font-medium'>Isolation</th>
              <th className='px-2 text-right font-medium'>Simulate</th>
            </tr>
          </thead>
          <tbody>
            {settings.tenants.map((t, i) => (
              <tr key={t.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{t.name}</td>
                <td className='px-2'>{t.leaveRows.toLocaleString('en-US')}</td>
                <td className='px-2'>
                  <Badge variant='badge_active'>RLS enforced</Badge>
                </td>
                <td className='px-2 text-right'>
                  <Button
                    variant='outline'
                    className='h-6 px-2 text-xs'
                    onClick={() =>
                      settings.probeCrossTenant(
                        t.id,
                        settings.tenants[(i + 1) % settings.tenants.length].id
                      )
                    }
                  >
                    Attempt cross-tenant read
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className='rounded-[6px] bg-neutral-100 p-2'>
          <h4 className='mb-1 text-xs font-semibold'>Denied-access log</h4>
          {settings.deniedAccessLog.map((line, i) => (
            <p key={i} className='text-red-1400 font-mono text-xs'>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* LVE-23: integrity constraints */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
          Integrity Constraints — Leave Records & Balances
        </h3>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Referential integrity, overlap exclusion, balance floors and
          concurrency control prevent invalid, duplicate or conflicting leave
          and balance corruption.
        </p>
        <div className='space-y-2'>
          {INTEGRITY_CONSTRAINTS.map((c) => (
            <div key={c.id} className='rounded-[6px] border border-gray-100 p-3 text-sm'>
              <div className='mb-0.5 font-medium'>{c.name}</div>
              <code className='text-blue-1400 block text-xs'>{c.rule}</code>
              <p className='text-neutral-1000 text-xs'>{c.enforcement}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
