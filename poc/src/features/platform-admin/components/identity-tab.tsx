import { useState } from 'react'
import { Plus } from 'phosphor-react'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { type Tenant } from '../data/tenants'
import { type IdentityStore } from '../hooks/use-identity'
import { PersonRecordsCard, RolesCard } from './identity-cards'
import { MiniTable, SectionCard, ToneBadge } from './shared'
import { SystemUserOverlay } from './system-user-overlay'

/**
 * Identity & access tab (SYS-02, 10, 11, 12, 20, 21, 29, 30, 38, 39, 41,
 * 42, 43, 44, 75) — auth providers, system users with per-company
 * memberships, person records, roles and access audits.
 */
export function IdentityTab({
  identity,
  tenants,
  activeCompanyId,
}: {
  identity: IdentityStore
  tenants: Tenant[]
  activeCompanyId: string
}) {
  const { hasRole } = useRole()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const activeTenant = tenants.find((t) => t.id === activeCompanyId)
  const tenantCode = (id: string) =>
    tenants.find((t) => t.id === id)?.code ?? id
  const roleName = (id: string) =>
    identity.roles.find((r) => r.id === id)?.name ?? id

  return (
    <div className='w-full'>
      {/* Authentication methods — Phase 1 = auth providers only (SYS-02, 30, 75) */}
      <SectionCard
        title='Authentication methods & identity integrations'
        description='Phase 1 supports authentication providers only — SAML, Active Directory, Office 365 and Google Apps. No other external integrations.'
      >
        <MiniTable
          headers={[
            'Provider',
            'Platform availability',
            'Tenant adoption',
            `Enabled for ${activeTenant?.code ?? 'company'}`,
          ]}
          rows={identity.authProviders.map((p) => [
            <span key='n' className='font-medium'>{p.name}</span>,
            <div key='pl' className='flex items-center gap-2'>
              <Switch
                checked={p.enabledOnPlatform}
                disabled={!hasRole('Platform Admin')}
                onCheckedChange={() => identity.toggleProvider(p.id)}
              />
              <span className='text-paragraph-sm text-neutral-1000'>
                {p.enabledOnPlatform ? 'Available to tenants' : 'Off'}
              </span>
            </div>,
            <span key='ad'>{p.adoptedByTenantIds.length} companies</span>,
            <Switch
              key='co'
              checked={p.adoptedByTenantIds.includes(activeCompanyId)}
              disabled={
                !p.enabledOnPlatform ||
                !hasRole('Company Admin', 'Platform Admin')
              }
              onCheckedChange={() =>
                identity.adoptProvider(p.id, activeCompanyId)
              }
            />,
          ])}
        />
      </SectionCard>

      {/* System users — one identity, many companies (SYS-11, 20, 38, 39) */}
      <SectionCard
        title={`System users (${identity.systemUsers.length})`}
        description='A user may belong to several companies with independent roles per company; effective permissions always follow the active company context.'
        actions={
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button
              variant='red'
              onClick={() => setOverlayOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New User
            </Button>
          </RoleGate>
        }
      >
        <MiniTable
          headers={['User', 'Status', 'Company memberships (roles per company)', '']}
          rows={identity.systemUsers.map((u) => [
            <div key='u' className='flex flex-col'>
              <span className='font-medium'>{u.name}</span>
              <span className='text-paragraph-sm text-neutral-1000'>
                {u.email}
              </span>
            </div>,
            <ToneBadge
              key='s'
              tone={
                u.status === 'active'
                  ? 'green'
                  : u.status === 'invited'
                    ? 'blue'
                    : 'grey'
              }
            >
              {u.status}
            </ToneBadge>,
            <div key='m' className='flex flex-wrap gap-1'>
              {u.memberships.map((m) => (
                <Badge key={m.tenantId} variant='pending'>
                  {tenantCode(m.tenantId)}: {m.roleIds.map(roleName).join(', ')}
                  {m.personRecordId ? ' · mapped' : ''}
                </Badge>
              ))}
            </div>,
            <div key='a' className='flex justify-end'>
              {hasRole('Company Admin', 'Platform Admin') &&
                u.memberships.length > 1 && (
                  <Button
                    variant='outline'
                    className='h-7 px-2 text-xs'
                    onClick={() =>
                      identity.removeMembership(u.id, u.memberships[0].tenantId)
                    }
                  >
                    Revoke first membership
                  </Button>
                )}
            </div>,
          ])}
        />
      </SectionCard>

      <PersonRecordsCard identity={identity} tenants={tenants} />
      <RolesCard identity={identity} />

      {/* Access audits (SYS-30) */}
      <SectionCard
        title='Access audits'
        description='Company-level review of who has which access'
        actions={
          <RoleGate roles={['Company Admin', 'Platform Admin']}>
            <Button
              variant='outline'
              className='h-8'
              onClick={() =>
                identity.runAccessAudit(activeTenant?.code ?? 'ASTER-IN')
              }
            >
              Run access audit
            </Button>
          </RoleGate>
        }
      >
        <ul className='space-y-2'>
          {identity.accessAudits.map((a) => (
            <li key={a.id} className='flex items-start gap-2 text-sm'>
              <span className='text-neutral-1900 min-w-0 flex-1'>
                <b>{a.userName}</b> — {a.detail}
              </span>
              <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                {a.at}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SystemUserOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        identity={identity}
        tenants={tenants}
        onSubmit={identity.addUser}
      />
    </div>
  )
}
