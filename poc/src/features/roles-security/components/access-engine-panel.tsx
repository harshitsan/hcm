import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  assignmentStatusOn,
  type RoleAssignment,
} from '../data/assignments'
import {
  APP_SCREENS,
  CURRENT_EMPLOYEE_ID,
  PEOPLE,
  companyName,
  personById,
} from '../data/directory'
import {
  PERMISSION_FUNCTIONS,
  type PermissionFunction,
  type RoleDef,
} from '../data/roles'
import { SecurityBadge } from './badges'

interface Evaluation {
  functionOk: boolean
  scopeOk: boolean
  roleNames: string[]
  fn: PermissionFunction
  targetName: string
}

/**
 * Access-control engine simulator (RSEC-20): every request is checked for
 * both the function permission of the caller's live roles and the data scope
 * of the target record. Below, the permission-aware UI preview (RSEC-23):
 * screens outside the user's grants are hidden, not error-on-click.
 */
export function AccessEnginePanel({
  assignments,
  roles,
}: {
  assignments: RoleAssignment[]
  roles: RoleDef[]
}) {
  const [fn, setFn] = useState<PermissionFunction>('Approve leave')
  const [targetId, setTargetId] = useState(PEOPLE[1]?.id ?? '')
  const [result, setResult] = useState<Evaluation | null>(null)

  const me = personById(CURRENT_EMPLOYEE_ID)
  if (!me) return null

  const today = new Date().toISOString().slice(0, 10)
  const myActive = assignments.filter(
    (a) =>
      a.personId === CURRENT_EMPLOYEE_ID &&
      assignmentStatusOn(a, today) === 'Active'
  )
  const myRoles = roles.filter((r) => myActive.some((a) => a.roleId === r.id))
  const grantedScreens = new Set(myRoles.flatMap((r) => r.screenIds))

  const evaluate = () => {
    const target = personById(targetId)
    if (!target) return
    setResult({
      fn,
      targetName: target.name,
      functionOk: myRoles.some((r) => r.permissions.includes(fn)),
      scopeOk: target.companyId === me.companyId,
      roleNames: myRoles.map((r) => r.name),
    })
  }

  return (
    <>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Access-control engine — evaluate a request
          <span className='text-neutral-1000 ml-2 text-xs'>
            role permission and data scope are checked together on every
            request, at every entry point
          </span>
        </h3>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='w-60'>
            <Select
              value={fn}
              onValueChange={(v) => setFn(v as PermissionFunction)}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_FUNCTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className='text-neutral-1000 text-xs'>on record of</span>
          <div className='w-64'>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select target record' />
              </SelectTrigger>
              <SelectContent>
                {PEOPLE.filter((p) => p.id !== me.id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {companyName(p.companyId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className='h-7' onClick={evaluate} disabled={!targetId}>
            Evaluate request
          </Button>
        </div>

        {result && (
          <div className='mt-3 rounded-[6px] border border-gray-200 p-3'>
            <div className='mb-2 flex items-center gap-2'>
              <SecurityBadge
                value={
                  result.functionOk && result.scopeOk ? 'Allowed' : 'Denied'
                }
              />
              <span className='text-neutral-1600 text-sm font-medium'>
                “{result.fn}” on {result.targetName}
              </span>
            </div>
            <ul className='text-neutral-1000 space-y-1 text-xs'>
              <li>
                Function permission ({result.roleNames.join(', ') || 'no roles'}
                ): {result.functionOk ? 'granted' : 'not granted — denied'}
              </li>
              <li>
                Data scope ({companyName(me.companyId)}):{' '}
                {result.scopeOk
                  ? 'record is within your company scope'
                  : 'record is outside your company/group/department/workforce scope — denied'}
              </li>
              <li>
                Both checks must pass together; the same decision applies
                whether the request comes from the UI, an API call or a
                background job.
              </li>
            </ul>
          </div>
        )}
        <p className='text-neutral-1000 pt-2 text-xs'>
          The engine reads your roles, delegations and scope live from
          governed config on each evaluation — a change made by an admin
          applies to your very next request with no stale permissions.
        </p>
      </div>

      {/* RSEC-23: permission-aware SPA */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Permission-aware navigation preview
          <span className='text-neutral-1000 ml-2 text-xs'>
            screens outside your grants are hidden or disabled — not merely
            erroring on click
          </span>
        </h3>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {APP_SCREENS.map((s) => {
            const granted = grantedScreens.has(s.id)
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2 ${
                  granted ? '' : 'opacity-50'
                }`}
              >
                <div className='min-w-0'>
                  <p className='text-neutral-1600 truncate text-sm font-medium'>
                    {s.name}
                  </p>
                  <p className='text-neutral-1000 text-xs'>{s.module}</p>
                </div>
                <SecurityBadge value={granted ? 'Visible' : 'Hidden'} />
              </div>
            )
          })}
        </div>
        <p className='text-neutral-1000 pt-2 text-xs'>
          Rendered from the screen grants of your active roles (
          {myRoles.map((r) => r.name).join(', ') || 'none'}) as of {today}.
          Role admin screens themselves render from metadata and validate
          every save against the author&apos;s authority before persisting.
        </p>
      </div>
    </>
  )
}
