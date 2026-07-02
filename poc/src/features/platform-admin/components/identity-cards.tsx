import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type Tenant } from '../data/tenants'
import { type IdentityStore } from '../hooks/use-identity'
import { MiniTable, SectionCard, ToneBadge } from './shared'

/**
 * Person records — one engagement per company per person; company-specific,
 * never shared across tenants (SYS-21, 29, 41, 42, 43, 44).
 */
export function PersonRecordsCard({
  identity,
  tenants,
}: {
  identity: IdentityStore
  tenants: Tenant[]
}) {
  const { hasRole } = useRole()
  const canAdmin = hasRole('Company Admin', 'Platform Admin')
  const tenantCode = (id: string) =>
    tenants.find((t) => t.id === id)?.code ?? id
  const userEmail = (id: string | null) =>
    id ? identity.systemUsers.find((u) => u.id === id)?.email : null

  return (
    <SectionCard
      title={`Person records — engagements (${identity.personRecords.length})`}
      description='Separate, company-specific records per engagement. The same person may be an employee in one company and a contractor in another.'
    >
      <MiniTable
        headers={['Person', 'Company', 'Type', 'Position', 'Status', 'Login', '']}
        rows={identity.personRecords.map((r) => [
          <div key='p' className='flex flex-col'>
            <span className='font-medium'>{r.personName}</span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {r.personKey}
            </span>
          </div>,
          tenantCode(r.tenantId),
          <ToneBadge key='t' tone={r.workforceType === 'employee' ? 'blue' : 'amber'}>
            {r.workforceType}
          </ToneBadge>,
          r.position,
          <ToneBadge key='s' tone={r.status === 'active' ? 'green' : 'grey'}>
            {r.status}
          </ToneBadge>,
          userEmail(r.userId) ?? (
            <ToneBadge key='l' tone='grey'>No login</ToneBadge>
          ),
          <div key='a' className='flex justify-end gap-2'>
            {canAdmin && r.userId === null && r.status === 'active' && (
              <Button
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() => identity.provisionAccess(r)}
              >
                Provision access
              </Button>
            )}
            {canAdmin && r.status === 'active' && (
              <Button
                variant='outline'
                className='h-7 px-2 text-xs'
                onClick={() => identity.terminateEngagement(r.id)}
              >
                Terminate
              </Button>
            )}
          </div>,
        ])}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Reassigning a record to another tenant is rejected — records are owned
        by exactly one company. Non-user records run through reporting and
        lifecycle actions identically to user-mapped records.
      </p>
    </SectionCard>
  )
}

/** Roles as personas composed of reusable permission sets (SYS-07, 10, 12, 17, 31). */
export function RolesCard({ identity }: { identity: IdentityStore }) {
  const { hasRole } = useRole()
  const setName = (id: string) =>
    identity.permissionSets.find((s) => s.id === id)?.name ?? id

  return (
    <SectionCard
      title='Roles & permission sets'
      description='Personas are composed of reusable permission sets — changing a set updates every role that includes it. Employee and contractor catalogs stay separate.'
    >
      <div className='mb-3 flex flex-wrap gap-2'>
        {identity.permissionSets.map((set) => (
          <button
            key={set.id}
            type='button'
            className='border-grey-200 hover:bg-neutral-200 flex items-center gap-2 rounded-[6px] border px-2 py-1 text-left'
            onClick={() => {
              if (hasRole('Company Admin', 'Platform Admin'))
                identity.touchPermissionSet(set.id)
              else toast.error('Only admins can edit permission sets')
            }}
            title={set.capabilities.join(' · ')}
          >
            <span className='text-sm font-medium'>{set.name}</span>
            <Badge variant='pending'>{set.capabilities.length} caps</Badge>
          </button>
        ))}
      </div>
      <MiniTable
        headers={['Role (persona)', 'Catalog', 'Permission sets', 'Scope']}
        rows={identity.roles.map((role) => [
          <span key='n' className='font-medium'>{role.name}</span>,
          <ToneBadge
            key='c'
            tone={
              role.catalog === 'employee'
                ? 'blue'
                : role.catalog === 'contractor'
                  ? 'amber'
                  : 'grey'
            }
          >
            {role.catalog}
          </ToneBadge>,
          <div key='ps' className='flex flex-wrap gap-1'>
            {role.permissionSetIds.map((id) => (
              <Badge key={id} variant='pending'>
                {setName(id)}
              </Badge>
            ))}
          </div>,
          <span key='s' className='text-paragraph-sm'>{role.scope}</span>,
        ])}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Managers approve leave, attendance and onboarding only within their
        team or functional scope; finance/compliance viewers are read-only —
        HR operations and data modifications are denied.
      </p>
    </SectionCard>
  )
}
