import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import { type MembershipRequest } from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { actorFor, canApproveRequests } from '../utils/permissions'
import { RequestStatusBadge } from './group-badges'

interface ApprovalsTabProps {
  store: OrgGroupsStore
}

/**
 * Approval queue for approval-controlled groups (GRP-42): pending membership
 * changes are held until a Group Company / Platform Admin approves or rejects
 * with a reason; requesters see their own request statuses read-only.
 */
export function ApprovalsTab({ store }: ApprovalsTabProps) {
  const { role } = useRole()
  const actor = actorFor(role)
  const isApprover = canApproveRequests(role)

  const [rejecting, setRejecting] = useState<MembershipRequest | null>(null)
  const [reason, setReason] = useState('')

  const groupName = (id: string) =>
    store.groups.find((g) => g.id === id)?.name ?? id
  const memberName = (id: string) =>
    store.members.find((m) => m.id === id)?.name ?? id

  const pending = store.requests.filter((r) => r.status === 'pending')
  const decided = store.requests.filter((r) => r.status !== 'pending')

  const requestCard = (r: MembershipRequest) => (
    <div
      key={r.id}
      className='border-grey-200 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border bg-white px-3 py-2'
    >
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 text-sm font-medium'>
          {r.action === 'add' ? 'Add' : 'Remove'} {memberName(r.memberId)}{' '}
          {r.action === 'add' ? 'to' : 'from'} {groupName(r.groupId)}
        </span>
        <span className='text-paragraph-sm text-neutral-1000'>
          Requested by {r.requestedBy} on {r.requestedAt}
          {r.decidedBy && ` · decided by ${r.decidedBy} on ${r.decidedAt}`}
          {r.reason && ` · reason: ${r.reason}`}
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <RequestStatusBadge status={r.status} />
        {isApprover && r.status === 'pending' && (
          <>
            <Button
              className='h-7'
              onClick={() => store.approveRequest(r.id, actor)}
            >
              Approve
            </Button>
            <Button
              variant='outline'
              className='h-7'
              onClick={() => {
                setRejecting(r)
                setReason('')
              }}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className='w-full space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000 border-grey-200 rounded-[6px] border bg-white px-3 py-2'>
        {isApprover
          ? 'Membership changes on approval-controlled groups (benefit and security cohorts) wait here. Approvals apply effective as of the approval date; rejections notify the requester with the reason.'
          : 'You can review the status of your submitted membership change requests here. Changes on groups that don’t require approval apply immediately without a pending state.'}
      </p>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Pending requests ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No pending membership change requests.
          </p>
        ) : (
          <div className='space-y-2'>{pending.map(requestCard)}</div>
        )}
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Decided requests ({decided.length})
        </h3>
        {decided.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No decided requests yet.
          </p>
        ) : (
          <div className='space-y-2'>{decided.map(requestCard)}</div>
        )}
      </div>

      <AlertDialog
        open={Boolean(rejecting)}
        onOpenChange={(o) => !o && setRejecting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject membership request?</AlertDialogTitle>
            <AlertDialogDescription>
              No membership change will be applied and the requester will be
              notified with your reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Reason for rejection (shared with the requester)'
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={() => {
                if (rejecting) store.rejectRequest(rejecting.id, actor, reason.trim())
                setRejecting(null)
              }}
            >
              Reject request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
