import { useState } from 'react'
import { UserSwitch } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoleGate, useRole } from '@/context/role-context'
import {
  CURRENT_SUPPORT_USER,
  SUPPORT_USERS,
  type SupportUser,
} from '../data/impersonation'
import {
  HOME_COMPANY_ID,
  PEOPLE,
  companyName,
  personName,
} from '../data/directory'
import { type ImpersonationStore } from '../hooks/use-impersonation'
import { SecurityBadge } from './badges'

/**
 * Impersonation ("login as user"). Platform Admin: start/end sessions
 * constrained to the target's permissions (RSEC-06) with every action
 * logged and flagged (RSEC-07). Company Admin: authorize or revoke which
 * support users may impersonate their company's users (RSEC-14).
 */
export function ImpersonationTab({ store }: { store: ImpersonationStore }) {
  const { hasRole } = useRole()
  const [targetId, setTargetId] = useState('')
  const [grantUser, setGrantUser] = useState<SupportUser>('Neha Support')

  const users = PEOPLE.filter((p) => p.isUser)
  const active = store.activeSession

  return (
    <div className='w-full space-y-4'>
      {/* Active session banner (RSEC-06) */}
      {active && (
        <div className='border-orange-1200 flex items-center gap-3 rounded-[8px] border bg-white p-4'>
          <UserSwitch size={22} weight='bold' className='text-orange-1200 shrink-0' />
          <div className='flex-1'>
            <p className='text-neutral-1600 text-sm font-medium'>
              Impersonating {personName(active.targetPersonId)} (
              {companyName(active.companyId)})
            </p>
            <p className='text-neutral-1000 text-xs'>
              You see what they see and are constrained to their permissions.
              Every action is audit-logged and flagged as performed under
              impersonation.
            </p>
          </div>
          <Button
            variant='outline'
            className='h-7'
            onClick={() => store.logAction('Viewed My Payslips screen')}
          >
            Simulate: view payslips
          </Button>
          <Button
            variant='outline'
            className='h-7'
            onClick={() => store.logAction('Re-submitted a failed timesheet')}
          >
            Simulate: fix timesheet
          </Button>
          <Button className='h-7' onClick={store.endSession}>
            End session
          </Button>
        </div>
      )}

      <RoleGate roles={['Platform Admin']}>
        {!active && (
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Login as user
              <span className='text-neutral-1000 ml-2 text-xs'>
                acting as {CURRENT_SUPPORT_USER} — allowed only for companies
                that authorized you
              </span>
            </h3>
            <div className='flex items-center gap-3'>
              <div className='w-72'>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select target user' />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {companyName(p.companyId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className='h-7'
                disabled={!targetId}
                onClick={() => {
                  if (store.startSession(targetId)) setTargetId('')
                }}
              >
                Login as user
              </Button>
            </div>
            <p className='text-neutral-1000 pt-2 text-xs'>
              Tip: pick a Cedar Retail or Harbor Logistics user to see the
              authorization denial — {CURRENT_SUPPORT_USER} is only authorized
              for Aurora Software and Northwind Analytics.
            </p>
          </div>
        )}
      </RoleGate>

      {/* RSEC-14: Company Admin authorizations */}
      <RoleGate roles={['Company Admin']}>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              Impersonation authorizations — {companyName(HOME_COMPANY_ID)}
              <span className='text-neutral-1000 ml-2 text-xs'>
                only the support users you designate may invoke login-as-user
                for your company
              </span>
            </h3>
            <div className='flex items-center gap-2'>
              <div className='w-44'>
                <Select
                  value={grantUser}
                  onValueChange={(v) => setGrantUser(v as SupportUser)}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_USERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className='h-7'
                onClick={() =>
                  store.grantAuth(grantUser, HOME_COMPANY_ID, 'Sunita Patil')
                }
              >
                Grant
              </Button>
            </div>
          </div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Support user</th>
                <th className='px-2 font-medium'>Company</th>
                <th className='px-2 font-medium'>Granted by</th>
                <th className='px-2 font-medium'>Granted on</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.auths.map((a) => (
                <tr key={a.id} className='border-b last:border-0'>
                  <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                    {a.supportUser}
                  </td>
                  <td className='text-neutral-1900 px-2'>
                    {companyName(a.companyId)}
                  </td>
                  <td className='text-neutral-1900 px-2'>{a.grantedBy}</td>
                  <td className='text-neutral-1900 px-2'>{a.grantedOn}</td>
                  <td className='px-2'>
                    <SecurityBadge value={a.status} />
                  </td>
                  <td className='px-2'>
                    {a.status === 'Active' && a.companyId === HOME_COMPANY_ID && (
                      <Button
                        variant='outline'
                        className='h-6 text-xs'
                        onClick={() => store.revokeAuth(a.id, 'Sunita Patil')}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RoleGate>

      {/* Session log (RSEC-07) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Impersonation sessions
          <span className='text-neutral-1000 ml-2 text-xs'>
            who impersonated whom, when, and exactly what was done — records
            cannot be altered or deleted
          </span>
        </h3>
        <div className='space-y-2'>
          {store.sessions
            .filter(
              (s) =>
                hasRole('Platform Admin') || s.companyId === HOME_COMPANY_ID
            )
            .map((s) => (
              <div
                key={s.id}
                className='rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div className='flex items-center justify-between'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {s.supportUser} → {personName(s.targetPersonId)}{' '}
                    <span className='text-neutral-1000 text-xs'>
                      ({companyName(s.companyId)})
                    </span>
                  </p>
                  <div className='flex items-center gap-2'>
                    <span className='text-neutral-1000 text-xs'>
                      {s.startedAt.replace('T', ' ').slice(0, 16)} →{' '}
                      {s.endedAt
                        ? s.endedAt.replace('T', ' ').slice(0, 16)
                        : 'in progress'}
                    </span>
                    <Badge variant={s.endedAt ? 'badge_inactive' : 'badge_active'}>
                      {s.endedAt ? 'Ended' : 'Live'}
                    </Badge>
                  </div>
                </div>
                {s.actions.length > 0 && (
                  <ul className='text-neutral-1000 mt-1 list-disc pl-5 text-xs'>
                    {s.actions.map((a) => (
                      <li key={a.at}>
                        {a.at.replace('T', ' ').slice(0, 16)} — {a.description}{' '}
                        <span className='text-orange-1200'>
                          [under impersonation]
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
