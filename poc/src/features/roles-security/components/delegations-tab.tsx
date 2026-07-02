import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRole } from '@/context/role-context'
import {
  CURRENT_EMPLOYEE_ID,
  HOME_COMPANY_ID,
  personName,
} from '../data/directory'
import { type DelegationsStore } from '../hooks/use-delegations'
import { SecurityBadge } from './badges'
import { DelegationOverlay } from './delegation-overlay'

/**
 * Delegations & approval routing. Employee (User): create/revoke own
 * delegations (RSEC-04) and act on approvals routed to them (RSEC-21).
 * Company Admin: oversight of delegated approvals in their company showing
 * both original owner and acting delegate (RSEC-05).
 */
export function DelegationsTab({ store }: { store: DelegationsStore }) {
  const { role } = useRole()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const isEmployee = role === 'Employee (User)'
  const me = CURRENT_EMPLOYEE_ID

  const myDelegations = store.delegations.filter((d) => d.ownerId === me)
  const routedToMe = store.approvals.filter(
    (a) => a.status === 'Pending' && store.routedApproverId(a) === me
  )
  const companyDelegations = store.delegations.filter(
    (d) => d.companyId === HOME_COMPANY_ID
  )
  const delegatedDecisions = store.approvals.filter(
    (a) =>
      a.companyId === HOME_COMPANY_ID &&
      a.decidedById !== null &&
      a.decidedById !== a.ownerId
  )

  return (
    <div className='w-full space-y-4'>
      {isEmployee && (
        <>
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-neutral-1600 text-sm font-medium'>
                My delegations
                <span className='text-neutral-1000 ml-2 text-xs'>
                  same-company only — delegates act on your behalf within the
                  scope you choose
                </span>
              </h3>
              <Button className='h-7' onClick={() => setOverlayOpen(true)}>
                New Delegation
              </Button>
            </div>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Delegate</th>
                  <th className='px-2 font-medium'>Activities</th>
                  <th className='px-2 font-medium'>Period</th>
                  <th className='px-2 font-medium'>Status</th>
                  <th className='px-2 font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myDelegations.map((d) => (
                  <tr key={d.id} className='border-b last:border-0'>
                    <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                      {personName(d.delegateId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.activities.join(', ')}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.startDate} → {d.endDate ?? 'open-ended'}
                    </td>
                    <td className='px-2'>
                      <SecurityBadge value={d.status} />
                    </td>
                    <td className='px-2'>
                      {d.status === 'Active' && (
                        <Button
                          variant='outline'
                          className='h-6 text-xs'
                          onClick={() => store.revokeDelegation(d.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {myDelegations.length === 0 && (
                  <tr>
                    <td colSpan={5} className='text-neutral-1000 py-4 text-center'>
                      No delegations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Approvals routed to me
              <span className='text-neutral-1000 ml-2 text-xs'>
                the workflow engine routes owners&apos; approvals here while
                their delegation to you is active
              </span>
            </h3>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Item</th>
                  <th className='px-2 font-medium'>Requester</th>
                  <th className='px-2 font-medium'>On behalf of</th>
                  <th className='px-2 font-medium'>Decision</th>
                </tr>
              </thead>
              <tbody>
                {routedToMe.map((a) => (
                  <tr key={a.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>
                      <div className='text-neutral-1600 font-medium'>{a.title}</div>
                      <div className='text-neutral-1000 text-xs'>{a.activity}</div>
                    </td>
                    <td className='text-neutral-1900 px-2'>{a.requester}</td>
                    <td className='text-neutral-1900 px-2'>
                      {a.ownerId === me ? (
                        'Myself (owner)'
                      ) : (
                        <span>
                          {personName(a.ownerId)}{' '}
                          <span className='text-neutral-1000 text-xs'>
                            (delegated to you)
                          </span>
                        </span>
                      )}
                    </td>
                    <td className='px-2'>
                      <div className='flex gap-1'>
                        <Button
                          className='h-6 text-xs'
                          onClick={() => store.decideApproval(a.id, 'Approved', me)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant='outline'
                          className='h-6 text-xs'
                          onClick={() => store.decideApproval(a.id, 'Rejected', me)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {routedToMe.length === 0 && (
                  <tr>
                    <td colSpan={4} className='text-neutral-1000 py-4 text-center'>
                      Nothing pending for you right now
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isEmployee && (
        <>
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Delegations in Aurora Software
              <span className='text-neutral-1000 ml-2 text-xs'>
                who delegated to whom — oversight within your scope only
              </span>
            </h3>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Owner</th>
                  <th className='px-2 font-medium'>Delegate</th>
                  <th className='px-2 font-medium'>Activities</th>
                  <th className='px-2 font-medium'>Period</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyDelegations.map((d) => (
                  <tr key={d.id} className='border-b last:border-0'>
                    <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                      {personName(d.ownerId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {personName(d.delegateId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.activities.join(', ')}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.startDate} → {d.endDate ?? 'open-ended'}
                    </td>
                    <td className='px-2'>
                      <SecurityBadge value={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Delegated approval trail
              <span className='text-neutral-1000 ml-2 text-xs'>
                every decision shows both the original owner and the acting
                delegate
              </span>
            </h3>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Item</th>
                  <th className='px-2 font-medium'>Original owner</th>
                  <th className='px-2 font-medium'>Acting delegate</th>
                  <th className='px-2 font-medium'>Decided on</th>
                  <th className='px-2 font-medium'>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {delegatedDecisions.map((a) => (
                  <tr key={a.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>
                      <div className='text-neutral-1600 font-medium'>{a.title}</div>
                      <div className='text-neutral-1000 text-xs'>{a.activity}</div>
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {personName(a.ownerId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {personName(a.decidedById)}
                    </td>
                    <td className='text-neutral-1900 px-2'>{a.decidedOn}</td>
                    <td className='px-2'>
                      <SecurityBadge value={a.status} />
                    </td>
                  </tr>
                ))}
                {delegatedDecisions.length === 0 && (
                  <tr>
                    <td colSpan={5} className='text-neutral-1000 py-4 text-center'>
                      No delegated decisions in your oversight scope yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DelegationOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        onSubmit={store.createDelegation}
      />
    </div>
  )
}
