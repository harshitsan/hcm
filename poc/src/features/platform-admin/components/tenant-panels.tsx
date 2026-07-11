import { useState } from 'react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { seedPersonRecords } from '../data/identity'
import { type TenantsStore } from '../hooks/use-tenants'
import { MiniTable, SectionCard, ToneBadge, type BadgeTone } from './shared'

const logTone: Record<string, BadgeTone> = {
  provisioned: 'green',
  status: 'amber',
  config: 'blue',
  health: 'green',
  denial: 'red',
}

/** Jurisdictions catalog — add makes it selectable for company setup (SYS-01). */
export function JurisdictionsCard({ store }: { store: TenantsStore }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  return (
    <SectionCard
      title={`Jurisdictions catalog (${store.jurisdictions.length})`}
      description='Platform-wide catalog — companies pick supported jurisdictions from here'
    >
      <MiniTable
        headers={['Code', 'Jurisdiction', 'Rule-pack', 'Status']}
        rows={store.jurisdictions.map((j) => [
          <span key='c' className='font-medium'>{j.code}</span>,
          j.name,
          j.rulePack,
          <ToneBadge key='s' tone={j.status === 'available' ? 'green' : 'grey'}>
            {j.status === 'available' ? 'Available' : 'Draft'}
          </ToneBadge>,
        ])}
      />
      <RoleGate roles={['Platform Admin']}>
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <Input
            placeholder='Code (e.g. AE)'
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className='h-8 w-[130px]'
          />
          <Input
            placeholder='Jurisdiction name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='h-8 w-[220px]'
          />
          <Button
            className='h-8'
            disabled={code.length < 2 || name.length < 3}
            onClick={() => {
              store.addJurisdiction(code, name)
              setCode('')
              setName('')
            }}
          >
            Add to catalog
          </Button>
        </div>
      </RoleGate>
    </SectionCard>
  )
}

/** Portfolios — shared-services patterns & scoped operations (SYS-03, 15). */
export function PortfoliosCard({ store }: { store: TenantsStore }) {
  const { hasRole } = useRole()
  return (
    <SectionCard
      title='Portfolios'
      description='Shared-services administration of multiple companies with reusable setup patterns'
    >
      <MiniTable
        headers={['Portfolio', 'Manager', 'Setup pattern', 'Companies', '']}
        rows={store.portfolios.map((p) => {
          const managed = store.tenants.filter((t) => t.portfolioId === p.id)
          return [
            <span key='n' className='font-medium'>{p.name}</span>,
            p.manager,
            p.setupPattern,
            managed.length,
            <div key='a' className='flex justify-end gap-2'>
              {hasRole('Portfolio Admin', 'Platform Admin') && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() =>
                    toast.success(
                      `${p.setupPattern} applied to ${managed.length} managed companies — standardization enforced`
                    )
                  }
                >
                  Apply setup pattern
                </Button>
              )}
              {hasRole('Portfolio Admin') && (
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() =>
                    toast.info(
                      `Read-only oversight report generated across ${managed.length} assigned companies only`
                    )
                  }
                >
                  Oversight report
                </Button>
              )}
            </div>,
          ]
        })}
      />
      <RoleGate roles={['Portfolio Admin']}>
        <div className='border-gray-200 mt-3 flex flex-wrap items-center gap-2 rounded-[6px] border p-3'>
          <span className='text-paragraph-sm text-neutral-1000'>
            Portfolio HR operations (assigned companies only):
          </span>
          {['Onboarding task', 'Leave adjustment', 'Exit checklist'].map(
            (task) => (
              <Button
                key={task}
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() =>
                  toast.success(
                    `${task} executed across assigned portfolio companies — no structural master data changed`
                  )
                }
              >
                {task}
              </Button>
            )
          )}
        </div>
      </RoleGate>
    </SectionCard>
  )
}

/** Group governance, sharing approvals & consolidated visibility (SYS-05, 16, 49). */
export function GroupsCard({ store }: { store: TenantsStore }) {
  const { hasRole } = useRole()
  const [directoryQuery, setDirectoryQuery] = useState('')
  const canGovern = hasRole('Group Company Admin', 'Platform Admin')

  const groupTenantIds = store.tenants
    .filter((t) => t.groupId !== null)
    .map((t) => t.id)
  const directory = seedPersonRecords.filter(
    (p) =>
      groupTenantIds.includes(p.tenantId) &&
      directoryQuery.trim() !== '' &&
      p.personName.toLowerCase().includes(directoryQuery.toLowerCase())
  )

  const tenantCode = (id: string) =>
    store.tenants.find((t) => t.id === id)?.code ?? id

  return (
    <SectionCard
      title='Group-company structures'
      description='Approved group relationships, consolidated visibility and cross-company sharing'
    >
      <MiniTable
        headers={['Group', 'Companies', 'Shared locations', 'Consolidated visibility']}
        rows={store.groups.map((g) => [
          <span key='n' className='font-medium'>{g.name}</span>,
          store.tenants
            .filter((t) => t.groupId === g.id)
            .map((t) => t.code)
            .join(', '),
          <Switch
            key='sl'
            checked={g.sharedLocations}
            disabled={!canGovern}
            onCheckedChange={(v) => store.updateGroup(g.id, { sharedLocations: v })}
          />,
          <Switch
            key='cv'
            checked={g.consolidatedVisibility}
            disabled={!canGovern}
            onCheckedChange={(v) =>
              store.updateGroup(g.id, { consolidatedVisibility: v })
            }
          />,
        ])}
      />

      <h3 className='text-paragraph-sm text-neutral-1600 mt-4 mb-2 font-medium'>
        Cross-company sharing requests (approval required)
      </h3>
      <MiniTable
        headers={['Resource', 'From → To', 'Requested', 'Status', '']}
        rows={store.sharingRequests.map((r) => [
          r.resource,
          `${tenantCode(r.fromTenantId)} → ${tenantCode(r.toTenantId)}`,
          r.requestedAt,
          <ToneBadge
            key='s'
            tone={
              r.status === 'approved'
                ? 'green'
                : r.status === 'denied'
                  ? 'red'
                  : 'amber'
            }
          >
            {r.status[0].toUpperCase() + r.status.slice(1)}
          </ToneBadge>,
          <div key='a' className='flex justify-end gap-2'>
            {r.status === 'pending' && canGovern && (
              <>
                <Button
                  className='h-7 px-2 text-xs'
                  onClick={() => store.resolveSharing(r.id, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  variant='outline'
                  className='h-7 px-2 text-xs'
                  onClick={() => store.resolveSharing(r.id, 'denied')}
                >
                  Deny
                </Button>
              </>
            )}
          </div>,
        ])}
      />

      <RoleGate roles={['Group Company Admin', 'Platform Admin']}>
        <div className='mt-4'>
          <h3 className='text-paragraph-sm text-neutral-1600 mb-2 font-medium'>
            Cross-company employee directory (group companies, read-only)
          </h3>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='Search employees across authorized group companies…'
              value={directoryQuery}
              onChange={(e) => setDirectoryQuery(e.target.value)}
              className='h-8 max-w-[360px]'
            />
            <Button
              variant='outline'
              className='h-8'
              onClick={() =>
                toast.success(
                  'Consolidated group report generated — aggregated across group companies (view-only)'
                )
              }
            >
              Consolidated report
            </Button>
          </div>
          {directoryQuery.trim() !== '' && (
            <ul className='mt-2 space-y-1'>
              {directory.length === 0 && (
                <li className='text-paragraph-sm text-neutral-1000'>
                  No matches within your authorized group companies
                </li>
              )}
              {directory.map((p) => (
                <li key={p.id} className='text-paragraph-sm text-neutral-1900'>
                  {p.personName} — {p.position} · {tenantCode(p.tenantId)}
                </li>
              ))}
            </ul>
          )}
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Group Reporting Viewers have no transactional or configuration
            rights — any such action is denied.
          </p>
        </div>
      </RoleGate>
    </SectionCard>
  )
}

/** Onboarding, health & isolation log (SYS-01, 08, 13, 52). */
export function PlatformLogCard({ store }: { store: TenantsStore }) {
  return (
    <SectionCard
      title='Platform health, onboarding & isolation log'
      description='Tenant onboarding status, platform health and cross-tenant denials — metadata only'
      actions={
        <RoleGate roles={['Platform Admin']}>
          <Button
            variant='outline'
            className='h-8'
            onClick={() =>
              store.log(
                'config',
                'Approved data import assisted by platform operations (1,032 rows) — no super-admin rights used'
              )
            }
          >
            Assist approved import
          </Button>
        </RoleGate>
      }
    >
      <ul className='space-y-2'>
        {store.platformLog.slice(0, 8).map((entry) => (
          <li key={entry.id} className='flex items-start gap-2 text-sm'>
            <ToneBadge tone={logTone[entry.kind] ?? 'grey'}>
              {entry.kind}
            </ToneBadge>
            <span className='text-neutral-1900 min-w-0 flex-1'>
              {entry.message}
            </span>
            <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
              {entry.at}
            </span>
          </li>
        ))}
      </ul>
      <p className='text-paragraph-sm text-neutral-1000 mt-3'>
        Tenant business data is logically isolated — cross-company access only
        via authorized multi-company users, portfolios or group relationships.
      </p>
    </SectionCard>
  )
}
