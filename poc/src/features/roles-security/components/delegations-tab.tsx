import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TreeStructure } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRole } from '@/context/role-context'
import { companyById } from '@/features/directory/data/directory'
import { requestOrgChartFocus } from '@/features/directory/data/org-focus'
import { requestModuleTab } from '@/features/workflows/data/module-nav'
import {
  CURRENT_DELEGATION_USER_ID,
  DELEGATION_COMPANY_ID,
  daysUntilExpiry,
  delegationEffectiveStatus,
  delegationPersonName,
  todayIso,
  type Delegation,
} from '../data/delegations'
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
  const navigate = useNavigate()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const isEmployee = role === 'Employee (User)'
  const me = CURRENT_DELEGATION_USER_ID
  const today = todayIso()

  const myDelegations = store.delegations.filter((d) => d.ownerId === me)
  const routedToMe = store.approvals.filter(
    (a) => a.status === 'Pending' && store.routedApproverId(a) === me
  )
  const companyDelegations = store.delegations.filter(
    (d) => d.companyId === DELEGATION_COMPANY_ID
  )
  const delegatedDecisions = store.approvals.filter(
    (a) =>
      a.companyId === DELEGATION_COMPANY_ID &&
      a.decidedById !== null &&
      a.decidedById !== a.ownerId
  )

  /** Open the Directory module on the Org Chart tab, focused on a person. */
  const viewInOrgChart = (employeeId: string) => {
    requestOrgChartFocus(employeeId)
    requestModuleTab('/directory', 'org-chart')
    navigate({ to: '/directory' })
  }

  const expiryChip = (d: Delegation) => {
    if (delegationEffectiveStatus(d, today) !== 'Active') return null
    const days = daysUntilExpiry(d, today)
    if (days === null || days > 7) return null
    return (
      <Badge variant='overdue' className='ml-1'>
        {days <= 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
      </Badge>
    )
  }

  const orgChartButton = (employeeId: string) => (
    <Button
      variant='ghost'
      className='h-6 gap-1 px-1.5 text-xs'
      onClick={() => viewInOrgChart(employeeId)}
    >
      <TreeStructure size={12} weight='bold' />
      View in org chart
    </Button>
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
                {myDelegations.map((d) => {
                  const status = delegationEffectiveStatus(d, today)
                  return (
                    <tr key={d.id} className='border-b last:border-0'>
                      <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                        {delegationPersonName(d.delegateId)}
                      </td>
                      <td className='text-neutral-1900 px-2'>
                        {d.activities.join(', ')}
                      </td>
                      <td className='text-neutral-1900 px-2'>
                        {d.startDate} → {d.endDate ?? 'open-ended'}
                        {expiryChip(d)}
                      </td>
                      <td className='px-2'>
                        <SecurityBadge value={status} />
                      </td>
                      <td className='px-2'>
                        <div className='flex items-center gap-1'>
                          {status === 'Active' && (
                            <Button
                              variant='outline'
                              className='h-6 text-xs'
                              onClick={() => store.revokeDelegation(d.id)}
                            >
                              Revoke
                            </Button>
                          )}
                          {orgChartButton(d.delegateId)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {myDelegations.length === 0 && (
                  <tr>
                    <td colSpan={5} className='text-neutral-1000 py-4 text-center'>
                      No delegations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className='text-neutral-1000 mt-2 text-xs'>
              When a delegation reaches its end date it expires on its own and
              your approval rights return to you automatically — no action is
              needed.
            </p>
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
                          {delegationPersonName(a.ownerId)}{' '}
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
              Delegations in {companyById(DELEGATION_COMPANY_ID)?.name ?? 'your company'}
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
                  <th className='px-2 font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyDelegations.map((d) => (
                  <tr key={d.id} className='border-b last:border-0'>
                    <td className='text-neutral-1600 py-2 pr-3 font-medium'>
                      {delegationPersonName(d.ownerId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {delegationPersonName(d.delegateId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.activities.join(', ')}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {d.startDate} → {d.endDate ?? 'open-ended'}
                      {expiryChip(d)}
                    </td>
                    <td className='px-2'>
                      <SecurityBadge value={delegationEffectiveStatus(d, today)} />
                    </td>
                    <td className='px-2'>{orgChartButton(d.ownerId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className='text-neutral-1000 mt-2 text-xs'>
              Expired delegations end on their own — approval rights return to
              the owner automatically on the day after the end date.
            </p>
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
                      {delegationPersonName(a.ownerId)}
                    </td>
                    <td className='text-neutral-1900 px-2'>
                      {delegationPersonName(a.decidedById)}
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
