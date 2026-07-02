import { useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  COMPANIES,
  companyName,
  manageableCompanyIds,
  type EmployeeRecord,
} from '../data/companies'
import { type AuthUser, type CompanyRole } from '../data/auth-users'
import { type AuthUsersStore } from '../hooks/use-auth-users'
import { MembershipCard } from './membership-card'

interface MembershipsOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUser | null
  employees: EmployeeRecord[]
  store: Pick<
    AuthUsersStore,
    | 'addMembership'
    | 'setMembershipRoles'
    | 'revokeMembership'
    | 'linkEmployee'
    | 'unlinkEmployee'
  >
}

/**
 * Per-company memberships editor (AUTH-04/06/12/13/14). Each membership
 * carries an independent role set and employee linkage; the active admin
 * role's scope decides which companies can be managed.
 */
export function MembershipsOverlay({
  open,
  onOpenChange,
  user,
  employees,
  store,
}: MembershipsOverlayProps) {
  const { role } = useRole()
  const scope = useMemo(() => manageableCompanyIds(role), [role])
  const [newCompanyId, setNewCompanyId] = useState('')

  if (!user) return null
  const actor = `${role} (demo)`

  const availableCompanies = COMPANIES.filter(
    (c) =>
      scope.includes(c.id) &&
      !user.memberships.some(
        (m) => m.companyId === c.id && m.status === 'active'
      )
  )

  const grantMembership = () => {
    if (!newCompanyId) {
      toast.error('Select a company to grant membership in')
      return
    }
    store.addMembership(user.id, newCompanyId, ['Employee' as CompanyRole], actor)
    setNewCompanyId('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Company memberships — {user.name}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-3 overflow-y-auto px-5 py-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            One identity, independent access per company. Acting as{' '}
            <span className='font-medium'>{role}</span>
            {scope.length > 0 ? (
              <>
                {' '}
                — you can manage:{' '}
                {scope.map((id) => companyName(id)).join(', ')}. Changes in one
                company never alter another.
              </>
            ) : (
              ' — read-only: this role cannot manage memberships.'
            )}
          </p>

          {user.memberships.map((membership) => (
            <MembershipCard
              key={membership.id}
              membership={membership}
              employees={employees}
              canManage={scope.includes(membership.companyId)}
              onSetRoles={(id, roles) =>
                store.setMembershipRoles(user.id, id, roles, actor)
              }
              onRevoke={(id) => store.revokeMembership(user.id, id, actor)}
              onLink={(id, employeeId) =>
                store.linkEmployee(user.id, id, employeeId, actor)
              }
              onUnlink={(id) => store.unlinkEmployee(user.id, id, actor)}
            />
          ))}

          {scope.length > 0 && (
            <div className='rounded-[6px] border border-dashed border-gray-300 p-3'>
              <p className='text-neutral-1600 mb-2 text-sm font-medium'>
                Grant membership in another company
              </p>
              <div className='flex items-center gap-2'>
                <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select company' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.group ? ` (${c.group})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size='sm'
                  onClick={grantMembership}
                  disabled={availableCompanies.length === 0}
                >
                  Grant
                </Button>
              </div>
              <p className='text-neutral-1000 mt-2 text-xs'>
                Starts with the Employee role — adjust per company afterwards.
              </p>
            </div>
          )}
        </div>

        <div className='border-grey-200 flex justify-end border-t px-5 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
