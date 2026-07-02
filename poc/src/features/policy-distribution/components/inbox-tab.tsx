import { useMemo, useState } from 'react'
import { BellRinging, FileText, UserCircleMinus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CURRENT_EMPLOYEE_ID, seedEmployees } from '../data/employees'
import { type Assignment } from '../data/distributions'
import { type PolicyConfigStore } from '../hooks/use-policy-config'
import { type PolicyDistributionStore } from '../hooks/use-policy-distribution'
import { PolicyReviewDialog } from './policy-review-dialog'
import { ReceiptDialog } from './receipt-dialog'
import { AckTypeBadge, AssignmentStatusBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

interface InboxTabProps {
  store: PolicyDistributionStore
  config: PolicyConfigStore
}

function InboxRow({
  assignment,
  onReview,
  onReceipt,
}: {
  assignment: Assignment
  onReview: (a: Assignment) => void
  onReceipt: (a: Assignment) => void
}) {
  const a = assignment
  const acted = a.status === 'Acknowledged' || a.status === 'Delivered'
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[6px] border bg-white px-4 py-3 ${
        a.status === 'Overdue' ? 'border-red-1400/40' : 'border-grey-200'
      }`}
    >
      <div className='flex min-w-0 items-center gap-3'>
        <FileText size={20} className='text-blue-1400 shrink-0' />
        <div className='min-w-0'>
          <p className='text-neutral-1600 truncate text-sm font-medium'>
            {a.policyTitle} · {a.policyVersion}
          </p>
          <div className='mt-1 flex flex-wrap items-center gap-1.5'>
            <AckTypeBadge type={a.ackType} />
            <AssignmentStatusBadge status={a.status} superseded={a.superseded} />
            {a.dueDate && !acted && (
              <span
                className={`text-paragraph-sm ${
                  a.status === 'Overdue' ? 'text-red-1400' : 'text-neutral-1000'
                }`}
              >
                Due {dateFmt.format(new Date(a.dueDate))}
              </span>
            )}
            {a.remindersSent.length > 0 && !acted && (
              <span className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'>
                <BellRinging size={12} />
                Reminders at {a.remindersSent.join('%, ')}% SLA
              </span>
            )}
            {a.taskStatus !== 'None' && (
              <Badge variant={a.taskStatus === 'Completed' ? 'completed' : 'open'}>
                Checklist task {a.taskStatus.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        {acted && a.receiptId && (
          <Button size='sm' variant='outline' onClick={() => onReceipt(a)}>
            View receipt
          </Button>
        )}
        <Button size='sm' variant={acted ? 'outline' : 'default'} onClick={() => onReview(a)}>
          {acted ? 'Re-read' : a.ackType === 'Read-Only' ? 'Read' : 'Review'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Employee policy inbox: pending acknowledgments with type + due date,
 * the review interface, receipts, and clear required/overdue vs optional
 * separation. Non-user employees see the coverage explanation instead.
 */
export function InboxTab({ store, config }: InboxTabProps) {
  const { role } = useRole()
  const [reviewing, setReviewing] = useState<Assignment | null>(null)
  const [receiptFor, setReceiptFor] = useState<Assignment | null>(null)

  const me = seedEmployees.find((e) => e.id === CURRENT_EMPLOYEE_ID)
  const mine = useMemo(
    () =>
      store.assignments.filter(
        (a) => a.employeeId === CURRENT_EMPLOYEE_ID && !a.superseded
      ),
    [store.assignments]
  )

  if (role === 'Employee (Non-User)') {
    return (
      <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
        <UserCircleMinus size={32} className='text-neutral-1000' />
        <p className='text-neutral-1600 text-paragraph-md font-medium'>
          No self-service access
        </p>
        <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
          Policies assigned to you are distributed as read-only or reviewed
          offline. Your Company Admin records acknowledgments on your behalf
          with evidence, and your compliance status is reported exactly like
          self-service acknowledgments.
        </p>
      </div>
    )
  }

  const actionable = mine.filter(
    (a) => a.status === 'Pending' || a.status === 'Overdue'
  )
  const required = actionable.filter((a) => a.ackType === 'Required')
  const optional = actionable.filter((a) => a.ackType === 'Optional')
  const readOnly = mine.filter((a) => a.ackType === 'Read-Only')
  const completed = mine.filter((a) => a.status === 'Acknowledged')
  const receiptTemplate = config.activeTemplates.find((t) => t.kind === 'Receipt')

  return (
    <div className='space-y-5'>
      <div className='text-paragraph-sm text-neutral-1000'>
        Signed in as <span className='text-neutral-1600 font-medium'>{me?.name}</span>{' '}
        ({me?.company} · {me?.department}) — {actionable.length} item(s) awaiting
        action.
      </div>

      <section className='space-y-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Required{' '}
          {required.some((a) => a.status === 'Overdue') && (
            <span className='text-red-1400'>— overdue items need attention</span>
          )}
        </h3>
        {required.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            Nothing pending — you are fully compliant.
          </p>
        ) : (
          required.map((a) => (
            <InboxRow
              key={a.id}
              assignment={a}
              onReview={setReviewing}
              onReceipt={setReceiptFor}
            />
          ))
        )}
      </section>

      {optional.length > 0 && (
        <section className='space-y-2'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Optional — recommended reading
          </h3>
          {optional.map((a) => (
            <InboxRow
              key={a.id}
              assignment={a}
              onReview={setReviewing}
              onReceipt={setReceiptFor}
            />
          ))}
        </section>
      )}

      {readOnly.length > 0 && (
        <section className='space-y-2'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            For your information (read-only)
          </h3>
          {readOnly.map((a) => (
            <InboxRow
              key={a.id}
              assignment={a}
              onReview={setReviewing}
              onReceipt={setReceiptFor}
            />
          ))}
        </section>
      )}

      {completed.length > 0 && (
        <section className='space-y-2'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Acknowledged — receipts available
          </h3>
          {completed.map((a) => (
            <InboxRow
              key={a.id}
              assignment={a}
              onReview={setReviewing}
              onReceipt={setReceiptFor}
            />
          ))}
        </section>
      )}

      <PolicyReviewDialog
        assignment={reviewing}
        onOpenChange={(open) => {
          if (!open) setReviewing(null)
        }}
        onAcknowledge={(id) => store.acknowledge(id)}
      />

      <ReceiptDialog
        assignment={receiptFor}
        receiptTemplate={receiptTemplate}
        onOpenChange={(open) => {
          if (!open) setReceiptFor(null)
        }}
      />
    </div>
  )
}
