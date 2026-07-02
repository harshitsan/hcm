import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { companyName, type EmployeeRecord } from '../data/companies'
import {
  COMPANY_ROLES,
  type CompanyMembership,
  type CompanyRole,
} from '../data/auth-users'

const NO_EMPLOYEE = 'none'

interface MembershipCardProps {
  membership: CompanyMembership
  employees: EmployeeRecord[]
  /** Whether the active admin role may manage this company (AUTH-12/13). */
  canManage: boolean
  onSetRoles: (membershipId: string, roles: CompanyRole[]) => void
  onRevoke: (membershipId: string) => void
  onLink: (membershipId: string, employeeId: string) => void
  onUnlink: (membershipId: string) => void
}

/**
 * One tenant-scoped membership: independent role set, employee linkage and
 * effective dates. Revoked rows stay visible, effective-dated (AUTH-16).
 */
export function MembershipCard({
  membership,
  employees,
  canManage,
  onSetRoles,
  onRevoke,
  onLink,
  onUnlink,
}: MembershipCardProps) {
  const [roles, setRoles] = useState<CompanyRole[]>(membership.roles)
  const [linkTarget, setLinkTarget] = useState(NO_EMPLOYEE)

  const revoked = membership.status === 'revoked'
  const linkedEmployee = membership.employeeId
    ? employees.find((e) => e.id === membership.employeeId)
    : null
  const linkable = employees.filter(
    (e) => e.companyId === membership.companyId && e.linkedUserId === null
  )

  const toggleRole = (role: CompanyRole, checked: boolean) =>
    setRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role)
    )

  const applyRoles = () => {
    if (roles.length === 0) {
      toast.error('A membership needs at least one role — revoke it instead')
      return
    }
    onSetRoles(membership.id, roles)
  }

  return (
    <div
      className={`rounded-[6px] border border-gray-200 bg-white p-3 ${revoked ? 'opacity-60' : ''}`}
    >
      <div className='mb-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-neutral-1600 text-sm font-medium'>
            {companyName(membership.companyId)}
          </span>
          <Badge variant={revoked ? 'badge_inactive' : 'badge_active'}>
            {revoked ? 'Revoked' : 'Active'}
          </Badge>
        </div>
        <span className='text-neutral-1000 text-xs'>
          {membership.effectiveFrom} → {membership.effectiveTo ?? 'present'}
        </span>
      </div>

      {revoked ? (
        <p className='text-neutral-1000 text-xs'>
          Prior roles retained for history: {membership.roles.join(', ')}.
          Access is denied in this company.
        </p>
      ) : (
        <>
          <div className='mb-2 grid grid-cols-2 gap-1.5'>
            {COMPANY_ROLES.map((role) => (
              <label
                key={role}
                className='text-neutral-1900 flex items-center gap-2 text-xs'
              >
                <Checkbox
                  variant='blue'
                  disabled={!canManage}
                  checked={roles.includes(role)}
                  onCheckedChange={(checked) => toggleRole(role, !!checked)}
                />
                {role}
              </label>
            ))}
          </div>

          <div className='mb-2 flex items-center gap-2'>
            <span className='text-neutral-1000 text-xs'>Employee link:</span>
            {linkedEmployee ? (
              <>
                <Badge variant='qualified'>
                  {linkedEmployee.name} · {linkedEmployee.title}
                </Badge>
                {canManage && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-6 px-2 text-xs'
                    onClick={() => onUnlink(membership.id)}
                  >
                    Unlink
                  </Button>
                )}
              </>
            ) : canManage ? (
              <>
                <Select value={linkTarget} onValueChange={setLinkTarget}>
                  <SelectTrigger
                    variant='secondary'
                    className='h-7 w-[220px] text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_EMPLOYEE}>
                      No workforce record
                    </SelectItem>
                    {linkable.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} · {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  disabled={linkTarget === NO_EMPLOYEE}
                  onClick={() => {
                    onLink(membership.id, linkTarget)
                    setLinkTarget(NO_EMPLOYEE)
                  }}
                >
                  Link
                </Button>
              </>
            ) : (
              <span className='text-neutral-1000 text-xs'>
                None — valid without a workforce record
              </span>
            )}
          </div>

          {canManage && (
            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='h-6 px-2 text-xs'
                onClick={applyRoles}
              >
                Apply roles
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-destructive h-6 px-2 text-xs'
                onClick={() => onRevoke(membership.id)}
              >
                Revoke membership
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
