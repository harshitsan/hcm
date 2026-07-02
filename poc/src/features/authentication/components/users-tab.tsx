import { useMemo, useState } from 'react'
import { PencilSimple, Plus, UsersThree } from 'phosphor-react'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { manageableCompanyIds, companyName } from '../data/companies'
import { type AuthUser } from '../data/auth-users'
import { type AuthUsersStore, type AuthUserDraft } from '../hooks/use-auth-users'
import { MembershipsOverlay } from './memberships-overlay'
import { UserOverlay } from './user-overlay'
import { userTableColumns } from './user-table-columns'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

interface UsersTabProps {
  store: AuthUsersStore
}

/**
 * User identity registry (AUTH-03/04/06/07/08/14/16/20): the User entity
 * table, membership management and the workforce-without-login panel.
 */
export function UsersTab({ store }: UsersTabProps) {
  const { role } = useRole()
  const { users, employees, emailTaken, addUser, updateUser } = store

  const [selectedRows, setSelectedRows] = useState<AuthUser[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
  const [membershipsUser, setMembershipsUser] = useState<AuthUser | null>(null)

  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
  const workforceOnly = useMemo(
    () => employees.filter((e) => e.linkedUserId === null),
    [employees]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: AuthUserDraft) => {
    if (editingUser) {
      updateUser(editingUser.id, {
        name: draft.name,
        email: draft.email,
        authMethod: draft.authMethod,
        status: draft.status,
      })
    } else {
      addUser(draft)
    }
    clearSelection()
  }

  /** Provision a login for a workforce-only employee (AUTH-08/20). */
  const provisionUser = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    const email = `${employee.name.toLowerCase().replace(/[^a-z]+/g, '.')}@satellitehr.example`
    if (emailTaken(email)) return
    addUser({
      name: employee.name,
      email,
      authMethod: 'password',
      status: 'invited',
      companyId: employee.companyId,
      roles: ['Employee'],
      employeeId: employee.id,
    })
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          User identities ({users.length}) — distinct from Employee &amp;
          Contractor records
        </h2>
        <div className='flex items-center gap-3'>
          <RoleGate roles={[...ADMIN_ROLES]}>
            <Button
              variant='icon2'
              onClick={() => {
                if (selectedRows.length !== 1) return
                setEditingUser(selectedRows[0])
                setOverlayOpen(true)
              }}
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1}
              aria-label='Edit user'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='outline'
              onClick={() => setMembershipsUser(selectedRows[0] ?? null)}
              className='h-7 gap-1 rounded-[6px] px-2 text-xs'
              disabled={selectedRows.length !== 1}
            >
              <UsersThree size={14} weight='bold' />
              Memberships
            </Button>
          </RoleGate>
          <RoleGate roles={['Platform Admin', 'Company Admin']}>
            <Button
              variant='red'
              onClick={() => {
                setEditingUser(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New User
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={userTableColumns}
        data={users}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <div className='mt-4 grid gap-3 lg:grid-cols-2'>
        <div className='rounded-[6px] border border-gray-200 bg-white p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Workforce records without a login ({workforceOnly.length})
            </h3>
            <Badge variant='pending'>Valid — no credentials required</Badge>
          </div>
          <div className='space-y-1.5'>
            {workforceOnly.map((e) => (
              <div
                key={e.id}
                className='flex items-center justify-between rounded border border-gray-100 px-2 py-1.5'
              >
                <span className='text-neutral-1900 text-sm'>
                  {e.name}{' '}
                  <span className='text-neutral-1000 text-xs'>
                    {e.title} · {companyName(e.companyId)}
                  </span>
                </span>
                {isAdmin &&
                  manageableCompanyIds(role).includes(e.companyId) && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-6 px-2 text-xs'
                      onClick={() => provisionUser(e.id)}
                    >
                      Create &amp; link user
                    </Button>
                  )}
              </div>
            ))}
            {workforceOnly.length === 0 && (
              <p className='text-neutral-1000 text-xs'>
                Every workforce record currently has a linked login.
              </p>
            )}
          </div>
        </div>

        <div className='rounded-[6px] border border-gray-200 bg-white p-3'>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Identity &amp; isolation guarantees
          </h3>
          <ul className='text-neutral-1900 list-disc space-y-1 pl-4 text-xs'>
            <li>
              Login email is a unique identity — duplicates are rejected at
              creation (row-level uniqueness constraint).
            </li>
            <li>
              Memberships, roles and audit rows are tenant-scoped: switching
              company context only ever surfaces the active company&apos;s
              data.
            </li>
            <li>
              Users may exist with no workforce record (e.g. platform
              administrators), and employees may exist with no user account.
            </li>
            <li>
              Revoked memberships and removed linkages are retained
              effective-dated — prior state is never overwritten.
            </li>
          </ul>
        </div>
      </div>

      <UserOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        employees={employees}
        emailTaken={emailTaken}
        onSubmit={handleSubmit}
      />

      <MembershipsOverlay
        open={membershipsUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMembershipsUser(null)
            clearSelection()
          }
        }}
        user={
          membershipsUser
            ? (users.find((u) => u.id === membershipsUser.id) ?? null)
            : null
        }
        employees={employees}
        store={store}
      />
    </div>
  )
}
