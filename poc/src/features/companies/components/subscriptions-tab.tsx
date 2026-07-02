import { useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type Company } from '../data/companies'
import { currentVersion } from '../data/subscriptions'
import { scopeCompanies, type CompaniesStore } from '../hooks/use-companies'
import { type SubscriptionsStore } from '../hooks/use-subscriptions'
import { PackageVersionForm } from './package-version-form'
import { RulesSimulator } from './rules-simulator'

interface SubscriptionsTabProps {
  store: CompaniesStore
  subscriptions: SubscriptionsStore
}

/**
 * FR 6.2.5 — commercial packaging (companies × employees × modules) as
 * governed versioned config, entitlement usage, and rules-engine evaluation.
 */
export function SubscriptionsTab({ store, subscriptions }: SubscriptionsTabProps) {
  const { role } = useRole()
  const [versioningId, setVersioningId] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)

  const scoped = useMemo(
    () => scopeCompanies(store.companies, role),
    [store.companies, role]
  )
  const isPlatformAdmin = role === 'Platform Admin'

  const usageBar = (company: Company) => {
    const pct = Math.min(
      100,
      Math.round((company.employeeCount / company.employeeLimit) * 100)
    )
    const color =
      pct >= 100 ? 'bg-red-1400' : pct >= 90 ? 'bg-orange-1200' : 'bg-green-1300'
    return (
      <div className='h-2 w-40 overflow-hidden rounded-full bg-neutral-200'>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  return (
    <div className='w-full space-y-4'>
      {/* Package definitions */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Subscription packages — versioned, effective-dated configuration
      </p>
      <div className='space-y-3'>
        {subscriptions.packages.map((pkg) => {
          const current = currentVersion(pkg)
          return (
            <div
              key={pkg.id}
              className='space-y-2 rounded-[6px] border border-gray-200 bg-white p-4'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>{pkg.name}</span>
                  <Badge variant='open'>
                    v{current.version} · effective {current.effectiveDate}
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-7 px-2 text-xs'
                    onClick={() =>
                      setHistoryId(historyId === pkg.id ? null : pkg.id)
                    }
                  >
                    {historyId === pkg.id ? 'Hide versions' : `Versions (${pkg.versions.length})`}
                  </Button>
                  {isPlatformAdmin && (
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      onClick={() =>
                        setVersioningId(versioningId === pkg.id ? null : pkg.id)
                      }
                    >
                      New version
                    </Button>
                  )}
                </div>
              </div>
              <p className='text-sm'>
                Up to <strong>{current.companyLimit}</strong> companies ·{' '}
                <strong>{current.employeeLimit.toLocaleString('en-US')}</strong>{' '}
                employees · ${current.pricePerEmployeeMonth}/employee/month
              </p>
              <div className='flex flex-wrap gap-1'>
                {current.modules.map((m) => (
                  <Badge key={m} variant='pending'>
                    {m}
                  </Badge>
                ))}
              </div>
              {historyId === pkg.id && (
                <div className='divide-y divide-gray-100 rounded-[6px] bg-neutral-100 px-3'>
                  {pkg.versions.map((v) => (
                    <div
                      key={v.version}
                      className='flex items-center justify-between py-1.5 text-sm'
                    >
                      <span>
                        v{v.version} · effective {v.effectiveDate} ·{' '}
                        {v.companyLimit} companies / {v.employeeLimit} employees
                        / {v.modules.length} modules
                      </span>
                      <Badge
                        variant={v.status === 'current' ? 'badge_active' : 'pending'}
                      >
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {versioningId === pkg.id && isPlatformAdmin && (
                <PackageVersionForm
                  pkg={pkg}
                  onPublish={subscriptions.addPackageVersion}
                  onCancel={() => setVersioningId(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Entitlement usage */}
      <p className='text-paragraph-sm text-neutral-1000 font-medium'>
        Entitlement usage — limits enforced per subscription
      </p>
      <div className='rounded-[6px] border border-gray-200 bg-white'>
        {scoped
          .filter((c) => c.status === 'active' || c.status === 'suspended')
          .map((c) => {
            const enabled = Object.values(c.config.modules).filter(Boolean).length
            return (
              <div
                key={c.id}
                className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <span className='truncate text-sm font-medium'>
                    {c.legalName}
                  </span>
                  <Badge variant='open'>{c.subscriptionTier}</Badge>
                </div>
                <div className='flex items-center gap-3'>
                  {usageBar(c)}
                  <span className='text-paragraph-sm text-neutral-1000 w-32'>
                    {c.employeeCount}/{c.employeeLimit} employees
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {enabled} modules on
                  </span>
                </div>
              </div>
            )
          })}
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        When entitlements change, updated limits and module access apply on the
        next evaluation. Access is granted only for subscribed modules; company
        and employee limits are prevented or flagged per policy.
      </p>

      <RulesSimulator companies={scoped} subscriptions={subscriptions} />
    </div>
  )
}
