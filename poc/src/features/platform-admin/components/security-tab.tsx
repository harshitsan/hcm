import { useState } from 'react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  complianceItems,
  encryptionPosture,
  sdlcControls,
} from '../data/security'
import { type SecurityStore } from '../hooks/use-security'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/**
 * Security & compliance tab (SYS-08, 14, 25, 32, 52, 65, 66, 67, 68) —
 * platform password policy, immutable metadata-level audit trail, tenant
 * boundary enforcement and the compliance/encryption posture.
 */
export function SecurityTab({ store }: { store: SecurityStore }) {
  const { hasRole } = useRole()
  const [policy, setPolicy] = useState(store.policy)
  const isPlatformAdmin = hasRole('Platform Admin')

  return (
    <div className='w-full'>
      {/* Security policies & password rules (SYS-14) */}
      <SectionCard
        title='Security policies & password rules'
        description='Managed by the Platform Admin — updated rules apply platform-wide. Platform roles never modify transactional data.'
      >
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          <div className='flex flex-col gap-1.5'>
            <Label>Minimum length</Label>
            <Input
              type='number'
              min={8}
              value={policy.minLength}
              disabled={!isPlatformAdmin}
              onChange={(e) =>
                setPolicy({ ...policy, minLength: Number(e.target.value) })
              }
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Expiry (days)</Label>
            <Input
              type='number'
              min={30}
              value={policy.expiryDays}
              disabled={!isPlatformAdmin}
              onChange={(e) =>
                setPolicy({ ...policy, expiryDays: Number(e.target.value) })
              }
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Lockout attempts</Label>
            <Input
              type='number'
              min={3}
              value={policy.lockoutAttempts}
              disabled={!isPlatformAdmin}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  lockoutAttempts: Number(e.target.value),
                })
              }
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Complexity required</Label>
            <Switch
              checked={policy.requireComplexity}
              disabled={!isPlatformAdmin}
              onCheckedChange={(v) =>
                setPolicy({ ...policy, requireComplexity: v })
              }
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>MFA required</Label>
            <Switch
              checked={policy.mfaRequired}
              disabled={!isPlatformAdmin}
              onCheckedChange={(v) => setPolicy({ ...policy, mfaRequired: v })}
            />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-3'>
          <Button
            disabled={!isPlatformAdmin}
            onClick={() => store.updatePolicy(policy)}
          >
            Save security policy
          </Button>
          <RoleGate roles={['Platform Admin']}>
            <Button
              variant='outline'
              onClick={() =>
                toast.error(
                  'Not permitted — platform roles cannot modify transactional records'
                )
              }
            >
              Try a transactional data edit
            </Button>
          </RoleGate>
        </div>
      </SectionCard>

      {/* Immutable audit trail (SYS-32, 52, 08) */}
      <SectionCard
        title={`Audit trail (${store.auditRecords.length})`}
        description='Immutable, tenant-scoped, effective-dated records for every security and data-change event — AES-256 at rest, retained 1 year active + 6 years archived. Cross-tenant platform review sees metadata only; records cannot be altered or deleted.'
        actions={
          <Button
            variant='outline'
            className='h-8'
            onClick={store.simulateCrossTenantRead}
          >
            Simulate cross-tenant read
          </Button>
        }
      >
        <MiniTable
          headers={['Timestamp', 'Tenant', 'Actor', 'Event', 'Kind', 'Context (metadata)']}
          rows={store.auditRecords.map((r) => [
            <span key='t' className='whitespace-nowrap'>{r.at}</span>,
            r.tenantCode,
            r.actor,
            <span key='e' className='font-medium'>{r.event}</span>,
            <ToneBadge
              key='k'
              tone={
                r.kind === 'denial'
                  ? 'red'
                  : r.kind === 'security'
                    ? 'blue'
                    : 'grey'
              }
            >
              {r.kind}
            </ToneBadge>,
            <span key='c' className='text-paragraph-sm text-neutral-1000'>
              {r.context}
            </span>,
          ])}
        />
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          Tenant boundaries are enforced before any data is returned;
          unauthorized cross-tenant requests are denied and logged above.
        </p>
      </SectionCard>

      {/* Compliance, encryption & residency (SYS-25, 65, 66, 67, 68) */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <SectionCard title='Encryption everywhere' className='mb-0'>
          <ul className='space-y-2'>
            {encryptionPosture.map((e) => (
              <li key={e.name} className='flex items-center gap-2 text-sm'>
                <ToneBadge tone='green'>{e.name}</ToneBadge>
                <span className='text-neutral-1900'>{e.detail}</span>
              </li>
            ))}
          </ul>
          <p className='text-paragraph-sm text-neutral-1000 mt-3'>
            Data residency: customer data for India-based customers resides in
            India unless a contractual exception specifies otherwise —
            residency compliance is auditable.
          </p>
        </SectionCard>

        <SectionCard title='Compliance certifications' className='mb-0'>
          <ul className='space-y-2'>
            {complianceItems.map((c) => (
              <li key={c.name} className='flex items-center gap-2 text-sm'>
                <ToneBadge
                  tone={
                    c.status === 'Planned'
                      ? 'grey'
                      : c.status === 'Phase 1'
                        ? 'blue'
                        : 'green'
                  }
                >
                  {c.status}
                </ToneBadge>
                <span className='font-medium'>{c.name}</span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title='Secure development & vulnerability management'
        className='mt-4'
      >
        <ul className='text-neutral-1900 list-disc space-y-1 ps-5 text-sm'>
          {sdlcControls.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
