import { useState } from 'react'
import { LockSimple, UserSwitch } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RoleGate, useRole } from '@/context/role-context'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  CURRENT_SUPPORT_USER,
  IMPERSONATION_DURATIONS,
  VIEW_ONLY_ACTIONS,
  authEffectiveStatus,
  type ImpersonationDuration,
} from '../data/impersonation'
import {
  COMPANIES,
  HOME_COMPANY_ID,
  PEOPLE,
  companyName,
  personName,
} from '../data/directory'
import { type ImpersonationStore } from '../hooks/use-impersonation'
import { SecurityBadge } from './badges'

/** Edit/delete-style controls rendered but locked during impersonation. */
const BLOCKED_ACTIONS = ['Edit profile', 'Delete document'] as const

/**
 * Impersonation ("login as user"). Platform Admin: request authorization
 * from the Company Admin, then start/end strictly view-only sessions
 * (RSEC-06) with every viewed screen logged and flagged (RSEC-07).
 * Company Admin: approve or deny requests and revoke authorizations —
 * only support users they authorize may sign in as their company's users,
 * and every authorization expires automatically (RSEC-14).
 */
export function ImpersonationTab({ store }: { store: ImpersonationStore }) {
  const { hasRole } = useRole()
  const [targetId, setTargetId] = useState('')
  const [requestCompanyId, setRequestCompanyId] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestDuration, setRequestDuration] =
    useState<ImpersonationDuration>('24 hours')
  const [denyTargetId, setDenyTargetId] = useState<string | null>(null)
  const [denyReason, setDenyReason] = useState('')

  const users = PEOPLE.filter((p) => p.isUser)
  const active = store.activeSession
  const denyTarget = store.requests.find((r) => r.id === denyTargetId) ?? null

  const visibleRequests = store.requests.filter(
    (r) => hasRole('Platform Admin') || r.companyId === HOME_COMPANY_ID
  )
  const pendingRequests = visibleRequests.filter((r) => r.status === 'Pending')
  const decidedRequests = visibleRequests.filter((r) => r.status !== 'Pending')

  const submitRequest = () => {
    store.submitRequest(
      CURRENT_SUPPORT_USER,
      requestCompanyId,
      requestReason.trim(),
      requestDuration
    )
    setRequestCompanyId('')
    setRequestReason('')
    setRequestDuration('24 hours')
  }

  const confirmDeny = () => {
    if (!denyTarget) return
    store.denyRequest(denyTarget.id, denyReason.trim(), 'Sunita Patil')
    setDenyTargetId(null)
    setDenyReason('')
  }

  return (
    <div className='w-full space-y-4'>
      {/* Active session banner (RSEC-06, RSEC-07) — strictly view-only */}
      {active && (
        <div className='border-orange-1200 rounded-[8px] border bg-white p-4'>
          <div className='flex items-start gap-3'>
            <UserSwitch
              size={22}
              weight='bold'
              className='text-orange-1200 mt-0.5 shrink-0'
            />
            <div className='flex-1'>
              <p className='text-neutral-1600 text-sm font-medium'>
                Impersonating {personName(active.targetPersonId)} (
                {companyName(active.companyId)})
              </p>
              <p className='text-neutral-1600 text-xs font-medium'>
                View-only session — editing and deleting are disabled.
              </p>
              <p className='text-neutral-1000 text-xs'>
                You see what they see. Every screen you open is audit-logged
                and flagged as performed under impersonation.
              </p>
            </div>
            <Button className='h-7' onClick={store.endSession}>
              End session
            </Button>
          </div>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            {VIEW_ONLY_ACTIONS.map((action) => (
              <Button
                key={action}
                variant='outline'
                className='h-7'
                onClick={() => store.logAction(action)}
              >
                {action.replace('Viewed', 'View').replace('Opened', 'Open')}
              </Button>
            ))}
            {BLOCKED_ACTIONS.map((action) => (
              <Tooltip key={action}>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant='outline'
                      className='h-7 gap-1.5'
                      disabled
                    >
                      <LockSimple size={12} weight='bold' />
                      {action}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Not available while impersonating
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      <RoleGate roles={['Platform Admin']}>
        {!active && (
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Login as user
              <span className='text-neutral-1000 ml-2 text-xs'>
                acting as {CURRENT_SUPPORT_USER} — allowed only for companies
                with an approved, unexpired authorization
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
              Sessions are view-only: you can open the user's screens but
              cannot edit or delete anything on their behalf.
            </p>
          </div>
        )}

        {/* RSEC-14: support staff request authorization from the Company Admin */}
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Request authorization
            <span className='text-neutral-1000 ml-2 text-xs'>
              the Company Admin must approve before you can sign in as their
              users
            </span>
          </h3>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='w-56'>
              <Select
                value={requestCompanyId}
                onValueChange={setRequestCompanyId}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select company' />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              className='h-9 w-96'
              placeholder='e.g. Employee reports a blank payslip screen (ticket #4821)'
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
            <div className='w-36'>
              <Select
                value={requestDuration}
                onValueChange={(v) =>
                  setRequestDuration(v as ImpersonationDuration)
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPERSONATION_DURATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className='h-7'
              disabled={!requestCompanyId || !requestReason.trim()}
              onClick={submitRequest}
            >
              Submit request
            </Button>
          </div>
          <p className='text-neutral-1000 pt-2 text-xs'>
            Access ends automatically after the chosen duration — no cleanup
            step is needed.
          </p>
        </div>
      </RoleGate>

      {/* RSEC-14: Company Admin decides pending requests */}
      <RoleGate roles={['Company Admin']}>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-3 text-sm font-medium'>
            Pending requests — {companyName(HOME_COMPANY_ID)}
            <span className='text-neutral-1000 ml-2 text-xs'>
              support staff asking to sign in as your company's users
            </span>
          </h3>
          {pendingRequests.length === 0 ? (
            <p className='text-neutral-1000 text-sm'>
              No pending requests. New requests from support staff will appear
              here for your approval.
            </p>
          ) : (
            <div className='space-y-2'>
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className='flex items-center gap-3 rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='flex-1'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {r.supportUser}{' '}
                      <span className='text-neutral-1000 text-xs'>
                        requests access to {companyName(r.companyId)} for{' '}
                        {r.duration} · requested {r.requestedOn}
                      </span>
                    </p>
                    <p className='text-neutral-1000 text-xs'>
                      Reason: {r.reason}
                    </p>
                  </div>
                  <Button
                    className='h-7'
                    onClick={() => store.approveRequest(r.id, 'Sunita Patil')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant='outline'
                    className='text-red-1000 h-7'
                    onClick={() => {
                      setDenyReason('')
                      setDenyTargetId(r.id)
                    }}
                  >
                    Deny
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </RoleGate>

      {/* Deny dialog — a reason is required and stored on the request */}
      <ConfirmDialog
        open={denyTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDenyTargetId(null)
            setDenyReason('')
          }
        }}
        title='Deny impersonation request'
        destructive
        disabled={!denyReason.trim()}
        confirmText='Deny request'
        desc={
          denyTarget
            ? `${denyTarget.supportUser} asked to sign in as users of ${companyName(denyTarget.companyId)} for ${denyTarget.duration}. Please give a reason — it is recorded and shown to the requester.`
            : ''
        }
        handleConfirm={confirmDeny}
      >
        <Input
          placeholder='e.g. No open support ticket references this account'
          value={denyReason}
          onChange={(e) => setDenyReason(e.target.value)}
        />
      </ConfirmDialog>

      {/* Decided requests history */}
      {decidedRequests.length > 0 && (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-3 text-sm font-medium'>
            Request history
            <span className='text-neutral-1000 ml-2 text-xs'>
              every approval and denial is recorded with who decided and why
            </span>
          </h3>
          <div className='space-y-2'>
            {decidedRequests.map((r) => (
              <div
                key={r.id}
                className='flex items-start gap-3 rounded-[6px] border border-gray-200 px-3 py-2'
              >
                <div className='flex-1'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {r.supportUser} → {companyName(r.companyId)}{' '}
                    <span className='text-neutral-1000 text-xs'>
                      {r.duration} · requested {r.requestedOn}
                      {r.decidedBy
                        ? ` · decided by ${r.decidedBy} on ${r.decidedOn}`
                        : ''}
                    </span>
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    Reason: {r.reason}
                  </p>
                  {r.denialReason && (
                    <p className='text-red-1000 text-xs'>
                      Denied: {r.denialReason}
                    </p>
                  )}
                </div>
                <SecurityBadge value={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSEC-14: active authorizations with automatic expiry */}
      <RoleGate roles={['Company Admin', 'Platform Admin']}>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-3 text-sm font-medium'>
            Active authorizations
            <span className='text-neutral-1000 ml-2 text-xs'>
              who may sign in as users, until when — expired authorizations
              stop working on their own
            </span>
          </h3>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Support user</th>
                <th className='px-2 font-medium'>Company</th>
                <th className='px-2 font-medium'>Granted by</th>
                <th className='px-2 font-medium'>Granted on</th>
                <th className='px-2 font-medium'>Expires on</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.auths
                .filter(
                  (a) =>
                    hasRole('Platform Admin') || a.companyId === HOME_COMPANY_ID
                )
                .map((a) => {
                  const status = authEffectiveStatus(a)
                  return (
                    <tr key={a.id} className='border-b last:border-0'>
                      <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                        {a.supportUser}
                      </td>
                      <td className='text-neutral-1900 px-2'>
                        {companyName(a.companyId)}
                      </td>
                      <td className='text-neutral-1900 px-2'>{a.grantedBy}</td>
                      <td className='text-neutral-1900 px-2'>{a.grantedOn}</td>
                      <td className='text-neutral-1900 px-2'>
                        {a.expiresOn
                          ? a.expiresOn.replace('T', ' ').slice(0, 16)
                          : '—'}
                      </td>
                      <td className='px-2'>
                        <SecurityBadge value={status} />
                      </td>
                      <td className='px-2'>
                        {status === 'Active' &&
                          hasRole('Company Admin') &&
                          a.companyId === HOME_COMPANY_ID && (
                            <Button
                              variant='outline'
                              className='h-6 text-xs'
                              onClick={() =>
                                store.revokeAuth(a.id, 'Sunita Patil')
                              }
                            >
                              Revoke
                            </Button>
                          )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </RoleGate>

      {/* Session log (RSEC-07) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Impersonation sessions
          <span className='text-neutral-1000 ml-2 text-xs'>
            who impersonated whom, when, and exactly what was viewed — records
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
