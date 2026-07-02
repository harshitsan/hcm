import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { companyName, type EmployeeRecord } from '../data/companies'
import { activeMemberships, type AuthUser } from '../data/auth-users'
import { type SessionState } from '../hooks/use-login-session'
import { MethodBadge } from './auth-badges'

interface SessionPanelProps {
  session: SessionState
  user: AuthUser
  employees: EmployeeRecord[]
  onSwitchCompany: (companyId: string) => void
  onLogout: () => void
}

/**
 * Active session card (AUTH-04/05/06/19): shows the company switcher only
 * for multi-company users, applies the selected company's role set and
 * surfaces the tenant-scoped employee context when a linkage exists.
 */
export function SessionPanel({
  session,
  user,
  employees,
  onSwitchCompany,
  onLogout,
}: SessionPanelProps) {
  const memberships = activeMemberships(user)
  const active = memberships.find(
    (m) => m.companyId === session.activeCompanyId
  )
  const linkedEmployee = active?.employeeId
    ? (employees.find((e) => e.id === active.employeeId) ?? null)
    : null

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Signed in — {user.name}
          </h3>
          <p className='text-neutral-1000 text-xs'>{user.email}</p>
        </div>
        <div className='flex items-center gap-2'>
          <MethodBadge method={session.method} />
          <Button
            variant='outline'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={onLogout}
          >
            Sign out
          </Button>
        </div>
      </div>

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <span className='text-neutral-1000 text-xs'>Active company:</span>
        {memberships.length > 1 ? (
          <Select
            value={session.activeCompanyId}
            onValueChange={onSwitchCompany}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[240px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((m) => (
                <SelectItem key={m.id} value={m.companyId}>
                  {companyName(m.companyId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Badge variant='open'>{companyName(session.activeCompanyId)}</Badge>
            <span className='text-neutral-1000 text-xs'>
              Single-company user — set as default context, no switcher shown.
            </span>
          </>
        )}
      </div>

      <div className='grid gap-3 lg:grid-cols-2'>
        <div className='rounded border border-gray-100 p-3'>
          <p className='text-neutral-1600 mb-1.5 text-xs font-medium'>
            Roles in {companyName(session.activeCompanyId)}
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {(active?.roles ?? []).map((r) => (
              <Badge key={r} variant='pending'>
                {r}
              </Badge>
            ))}
            {!active && <Badge variant='dropped'>No role — access denied</Badge>}
          </div>
          <p className='text-neutral-1000 mt-2 text-xs'>
            Permissions applied are exactly those defined for this company —
            switching context swaps the role set without re-authentication.
          </p>
        </div>
        <div className='rounded border border-gray-100 p-3'>
          <p className='text-neutral-1600 mb-1.5 text-xs font-medium'>
            Employee context (this company)
          </p>
          {linkedEmployee ? (
            <p className='text-neutral-1900 text-xs'>
              Linked to{' '}
              <span className='font-medium'>{linkedEmployee.name}</span> ·{' '}
              {linkedEmployee.title}. The User and Employee remain distinct,
              associated records.
            </p>
          ) : (
            <p className='text-neutral-1000 text-xs'>
              No employee linkage in this company — the account operates on
              assigned roles alone (valid without a workforce record).
            </p>
          )}
          <p className='text-neutral-1000 mt-2 text-xs'>
            Only records and actions scoped to{' '}
            {companyName(session.activeCompanyId)} are available in this
            context.
          </p>
        </div>
      </div>
    </div>
  )
}
