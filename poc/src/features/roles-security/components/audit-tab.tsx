import { useState } from 'react'
import { PencilSimple, Trash } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AUDIT_CATEGORIES } from '../data/audit'
import { companyName } from '../data/directory'
import { type SecurityAuditStore } from '../hooks/use-security-audit'
import { SecurityBadge } from './badges'

const ALL = 'All categories'

/**
 * Immutable append-only audit store (RSEC-17): impersonation, context
 * switches, delegations, role changes and config events with actor, target,
 * timestamp and companies. Edit/delete attempts are rejected. Below, the
 * notification engine's feed for sensitive security events (RSEC-22).
 */
export function AuditTab({ audit }: { audit: SecurityAuditStore }) {
  const [category, setCategory] = useState<string>(ALL)

  const events =
    category === ALL
      ? audit.events
      : audit.events.filter((e) => e.category === category)

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Security audit store ({events.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              append-only and tamper-evident — records can never be edited or
              deleted, even by admins or the impersonating user
            </span>
          </h3>
          <div className='w-52'>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{ALL}</SelectItem>
                {AUDIT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>When</th>
              <th className='px-2 font-medium'>Category</th>
              <th className='px-2 font-medium'>Actor</th>
              <th className='px-2 font-medium'>Target</th>
              <th className='px-2 font-medium'>Companies</th>
              <th className='px-2 font-medium'>Detail</th>
              <th className='px-2 font-medium'>Tamper test</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className='border-b last:border-0'>
                <td className='text-neutral-1900 py-2 pr-3 whitespace-nowrap'>
                  {e.at.replace('T', ' ').slice(0, 16)}
                </td>
                <td className='px-2'>
                  <SecurityBadge value={e.category} />
                </td>
                <td className='text-neutral-1600 px-2 font-medium'>
                  {e.actor}
                  <span className='text-neutral-1000 ml-1 text-xs'>
                    ({e.actorRole})
                  </span>
                </td>
                <td className='text-neutral-1900 px-2'>{e.target}</td>
                <td className='text-neutral-1900 px-2'>
                  {e.sourceCompanyId || e.targetCompanyId
                    ? `${companyName(e.sourceCompanyId)} → ${companyName(e.targetCompanyId)}`
                    : '—'}
                </td>
                <td className='text-neutral-1000 px-2'>
                  {e.detail}
                  {e.underImpersonation && (
                    <span className='text-orange-1200 ml-1 text-xs'>
                      [under impersonation]
                    </span>
                  )}
                </td>
                <td className='px-2'>
                  <div className='flex gap-1'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label='Attempt edit (rejected)'
                      onClick={() => audit.attemptTamper(e)}
                    >
                      <PencilSimple size={12} weight='fill' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      aria-label='Attempt delete (rejected)'
                      onClick={() => audit.attemptTamper(e)}
                    >
                      <Trash size={12} weight='bold' />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className='text-neutral-1000 pt-2 text-xs'>
          Every security-relevant event — impersonation start/end, context
          switch, delegation grant/revoke, role change — is appended here with
          integrity, giving a complete chronological history for compliance
          review. Try the edit/delete actions to see the rejection.
        </p>
      </div>

      {/* RSEC-22: notification engine feed */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Security notifications ({audit.notifications.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            rendered from governed templates — recipients scoped to the
            affected company, no code changes
          </span>
        </h3>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>When</th>
              <th className='px-2 font-medium'>Event</th>
              <th className='px-2 font-medium'>Template</th>
              <th className='px-2 font-medium'>Recipients</th>
              <th className='px-2 font-medium'>Company</th>
            </tr>
          </thead>
          <tbody>
            {audit.notifications.map((n) => (
              <tr key={n.id} className='border-b last:border-0'>
                <td className='text-neutral-1900 py-2 pr-3 whitespace-nowrap'>
                  {n.at.replace('T', ' ').slice(0, 16)}
                </td>
                <td className='text-neutral-1600 px-2 font-medium'>
                  {n.event}
                </td>
                <td className='text-neutral-1000 px-2 font-mono text-xs'>
                  {n.template}
                </td>
                <td className='text-neutral-1900 px-2'>
                  {n.recipients.join(', ')}
                </td>
                <td className='text-neutral-1900 px-2'>
                  {companyName(n.companyId)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className='text-neutral-1000 pt-2 text-xs'>
          If no recipient configuration matches an event, the event is still
          recorded in the audit store above even though no notification is
          dispatched.
        </p>
      </div>
    </div>
  )
}
