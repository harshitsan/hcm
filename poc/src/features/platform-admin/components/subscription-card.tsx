import { useState } from 'react'
import { Plus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PLATFORM_MODULES,
  SUBSCRIPTION_TIERS,
  TIER_DEFAULTS,
  type SubscriptionTier,
} from '../data/tenants'
import { type TenantsStore } from '../hooks/use-tenants'
import { SectionCard, ToneBadge, type BadgeTone } from './shared'

function usageTone(used: number, limit: number): BadgeTone {
  if (used >= limit) return 'red'
  if (used >= limit * 0.9) return 'amber'
  return 'green'
}

/**
 * Commercial subscription per tenant (US-PA-42..44) — tier, employee limit
 * and module entitlements, with the limits enforced in the mock flows
 * (hires past the cap and tier downgrades below headcount are blocked).
 */
export function SubscriptionCard({ store }: { store: TenantsStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Platform Admin')
  const [selectedId, setSelectedId] = useState(store.activeCompanyId)
  const tenant =
    store.tenants.find((t) => t.id === selectedId) ?? store.tenants[0]
  if (!tenant) return null

  const { subscription } = tenant
  const tone = usageTone(tenant.employees, subscription.employeeLimit)

  return (
    <SectionCard
      title='Subscription & entitlements'
      description='Commercial tier, employee limit and subscribed modules per company — limits are enforced across the platform'
    >
      <div className='mb-3 flex flex-wrap items-center gap-3'>
        <Select value={tenant.id} onValueChange={setSelectedId}>
          <SelectTrigger className='w-[300px] bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {store.tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} · {t.subscription.tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToneBadge
          tone={
            tenant.status === 'active'
              ? 'green'
              : tenant.status === 'suspended'
                ? 'red'
                : 'blue'
          }
        >
          {tenant.status}
        </ToneBadge>
      </div>

      {tenant.suspension && (
        <div className='mb-3 rounded-[6px] border border-amber-300 bg-amber-50 p-3'>
          <p className='text-paragraph-sm text-amber-800'>
            <b>Suspended</b> — {tenant.suspension.reason} · approved by{' '}
            {tenant.suspension.approvedBy} · {tenant.suspension.at}
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
        {/* Tier */}
        <div className='border-gray-200 rounded-[6px] border p-3'>
          <p className='text-paragraph-sm text-neutral-1000 mb-2'>
            Subscription tier
          </p>
          <Select
            value={subscription.tier}
            disabled={!canEdit}
            onValueChange={(v) =>
              store.changeTier(tenant.id, v as SubscriptionTier)
            }
          >
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)} — up to{' '}
                  {TIER_DEFAULTS[t].employeeLimit.toLocaleString('en-US')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Downgrades below the current headcount are denied.
          </p>
        </div>

        {/* Employee limit enforcement (US-PA-43) */}
        <div className='border-gray-200 rounded-[6px] border p-3'>
          <p className='text-paragraph-sm text-neutral-1000 mb-2'>
            Employee limit
          </p>
          <div className='flex items-center gap-2'>
            <span className='text-neutral-1900 text-xl font-medium'>
              {tenant.employees.toLocaleString('en-US')} /{' '}
              {subscription.employeeLimit.toLocaleString('en-US')}
            </span>
            <ToneBadge tone={tone}>
              {tone === 'red'
                ? 'At limit'
                : tone === 'amber'
                  ? 'Near limit'
                  : 'Within limit'}
            </ToneBadge>
          </div>
          {canEdit && (
            <Button
              variant='outline'
              className='mt-2 h-7 gap-1 px-2 text-xs'
              onClick={() => store.simulateHire(tenant.id)}
            >
              <Plus size={10} weight='bold' />
              Add employee (enforced)
            </Button>
          )}
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Hires beyond the limit are blocked until the tier is upgraded.
          </p>
        </div>

        {/* Module entitlements (US-PA-44) */}
        <div className='border-gray-200 rounded-[6px] border p-3'>
          <p className='text-paragraph-sm text-neutral-1000 mb-2'>
            Module entitlements ({subscription.modules.length} of{' '}
            {PLATFORM_MODULES.length})
          </p>
          <div className='flex flex-wrap gap-1'>
            {PLATFORM_MODULES.map((m) => {
              const entitled = subscription.modules.includes(m)
              return (
                <button
                  key={m}
                  type='button'
                  disabled={!canEdit}
                  onClick={() => store.toggleModuleEntitlement(tenant.id, m)}
                  className={`rounded-[6px] border px-2 py-0.5 text-xs ${
                    entitled
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-gray-200 text-neutral-1000 bg-white line-through'
                  } ${canEdit ? 'hover:opacity-80' : ''}`}
                  title={
                    entitled
                      ? `Subscribed — click to unsubscribe ${m}`
                      : `Not subscribed — users are denied ${m}. Click to entitle.`
                  }
                >
                  {m}
                </button>
              )
            })}
          </div>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Unsubscribed modules are denied for the company&apos;s users. Core
            HR is always included.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
