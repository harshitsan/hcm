import { Database, PlugsConnected, ShieldCheck } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useRole } from '@/context/role-context'
import { LINKED_MODULES, TENANT } from '../data/policies'
import { formatDate } from '../data/policy-utils'
import { type PoliciesStore } from '../hooks/use-policies'

/**
 * Governance & platform configuration: role-controlled maintenance matrix with
 * an audit trail of allowed/denied actions (POL-08), operational-module
 * integration switches (POL-07), the notification engine log (POL-18) and the
 * effective-dated tenant-scoped persistence guarantees (POL-14/15).
 */
export function GovernanceTab({ store }: { store: PoliciesStore }) {
  const { role } = useRole()
  const isPlatformAdmin = role === 'Platform Admin'

  const linkedCount = (module: string) =>
    store.policies.filter(
      (p) => !p.retired && p.linkedModules.includes(module)
    ).length

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      {/* Role-controlled maintenance & visibility (POL-08/09) */}
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-1.5 font-medium'>
            <ShieldCheck size={16} />
            Role-based policy permissions
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {isPlatformAdmin
              ? 'Define which roles may maintain or view policies — enforced consistently across the platform.'
              : 'Read-only: only the Platform Admin can change these permissions.'}
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='border-grey-200 divide-grey-200 divide-y rounded-[6px] border'>
            <div className='grid grid-cols-[1fr_110px_110px] gap-2 px-3 py-2'>
              <span className='text-neutral-1000 text-sm'>Role</span>
              <span className='text-neutral-1000 text-sm'>Maintain</span>
              <span className='text-neutral-1000 text-sm'>View</span>
            </div>
            {store.rolePermissions.map((p) => (
              <div
                key={p.role}
                className='grid grid-cols-[1fr_110px_110px] items-center gap-2 px-3 py-2'
              >
                <span className='text-neutral-1900 text-sm'>{p.role}</span>
                <Switch
                  checked={p.canMaintain}
                  disabled={!isPlatformAdmin}
                  onCheckedChange={() =>
                    store.toggleRolePermission(p.role, 'canMaintain')
                  }
                  aria-label={`${p.role} can maintain policies`}
                />
                <Switch
                  checked={p.canView}
                  disabled={!isPlatformAdmin}
                  onCheckedChange={() =>
                    store.toggleRolePermission(p.role, 'canView')
                  }
                  aria-label={`${p.role} can view policies`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational module integration (POL-07) */}
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-1.5 font-medium'>
            <PlugsConnected size={16} />
            Operational module integration
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            When enabled, processes in a module automatically consume the
            in-force version of every policy linked to it; out-of-scope workers
            are never affected.
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='border-grey-200 divide-grey-200 divide-y rounded-[6px] border'>
            {LINKED_MODULES.map((module) => (
              <div
                key={module}
                className='flex items-center justify-between px-3 py-2'
              >
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1900 text-sm'>{module}</span>
                  <Badge variant='open'>
                    {linkedCount(module)} linked policy(ies)
                  </Badge>
                </div>
                <Switch
                  checked={store.integrations[module] ?? false}
                  onCheckedChange={() => store.toggleIntegration(module)}
                  aria-label={`${module} integration`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification engine log (POL-18) */}
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Notification engine — policy change alerts
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Generated from the platform template engine on publish; only
            workers inside the policy scope are notified.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {store.notifications.map((n) => (
            <div key={n.id} className='border-grey-200 rounded-[6px] border p-2.5'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {n.editionName}
                </span>
                <Badge variant='badge_active'>
                  {n.workerIds.length} recipient(s)
                </Badge>
              </div>
              <p className='text-paragraph-sm text-neutral-1900 mt-1'>
                {n.message}
              </p>
              <p className='text-paragraph-sm text-neutral-1000'>
                Sent {formatDate(n.sentOn)} · scope-filtered recipient list
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audit trail + persistence guarantees (POL-08/14/15) */}
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-1.5 font-medium'>
            <Database size={16} />
            Audit trail & persistence
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Tenant <span className='font-medium'>{TENANT}</span> — policies are
            stored as effective-dated, tenant-scoped records: prior states are
            never overwritten, effective windows must not overlap, and
            row-level isolation prevents cross-tenant access.
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='border-grey-200 divide-grey-200 divide-y rounded-[6px] border'>
            {store.auditLog.map((entry) => (
              <div
                key={entry.id}
                className='flex items-center justify-between gap-2 px-3 py-2'
              >
                <div className='flex min-w-0 flex-col'>
                  <span className='text-neutral-1900 text-sm'>
                    {entry.action} — {entry.target}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {entry.timestamp} · {entry.actorRole}
                  </span>
                </div>
                <Badge
                  variant={
                    entry.outcome === 'success' ? 'badge_active' : 'dropped'
                  }
                >
                  {entry.outcome === 'success' ? 'Success' : 'Denied'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
