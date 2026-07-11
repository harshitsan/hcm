import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { type EncashmentRequest } from '../data/encashment'
import { fmtDate } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { StatusBadge } from './badges'

/**
 * Admin decision queue for leave encashment (payout) requests — the
 * counterpart to the employee EncashmentRequestDialog. Approval deducts the
 * encashed units from the balance and records the payout in the audit trail.
 */
export function EncashmentPanel({ balances }: { balances: BalancesStore }) {
  const [decision, setDecision] = useState<{
    request: EncashmentRequest
    approve: boolean
  } | null>(null)
  const [note, setNote] = useState('')

  const pending = balances.encashments.filter((e) => e.status === 'pending')
  const decided = balances.encashments.filter((e) => e.status !== 'pending')

  const openDecision = (request: EncashmentRequest, approve: boolean) => {
    setNote('')
    setDecision({ request, approve })
  }

  const row = (e: EncashmentRequest) => (
    <div
      key={e.id}
      className='flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
    >
      <div className='min-w-0'>
        <div className='font-medium'>
          {e.employeeName} · {e.units} {e.unit} of {e.typeName}
        </div>
        <div className='text-neutral-1000 text-xs'>
          Requested {fmtDate(e.requestedOn)} — {e.reason}
          {e.decidedBy &&
            ` · decided by ${e.decidedBy} on ${fmtDate(e.decidedOn)}`}
          {e.decisionNote && ` · “${e.decisionNote}”`}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        {e.status === 'pending' ? (
          <>
            <Button
              variant='outline'
              className='h-7'
              onClick={() => openDecision(e, true)}
            >
              Approve
            </Button>
            <Button
              variant='outline'
              className='text-red-1400 h-7'
              onClick={() => openDecision(e, false)}
            >
              Reject
            </Button>
          </>
        ) : (
          <StatusBadge status={e.status} />
        )}
      </div>
    </div>
  )

  return (
    <div className='mt-4 rounded-[8px] border border-gray-200 bg-white p-4'>
      <h2 className='text-neutral-1600 text-paragraph-md mb-2 font-medium'>
        Encashment Requests ({pending.length} pending)
      </h2>
      <div className='space-y-2'>
        {balances.encashments.length === 0 && (
          <p className='text-neutral-1000 text-sm'>
            No encashment requests raised yet.
          </p>
        )}
        {pending.map(row)}
        {decided.map(row)}
      </div>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(o) => {
          if (!o) setDecision(null)
        }}
        title={
          decision?.approve ? 'Approve encashment?' : 'Reject encashment?'
        }
        destructive={decision ? !decision.approve : false}
        desc={
          decision
            ? `${decision.request.employeeName} — ${decision.request.units} ${decision.request.unit} of ${decision.request.typeName}. ${
                decision.approve
                  ? 'The units are deducted from the balance and the payout is recorded in the audit trail.'
                  : 'The balance stays unchanged and the applicant is notified.'
              }`
            : ''
        }
        confirmText={decision?.approve ? 'Approve payout' : 'Reject request'}
        handleConfirm={() => {
          if (decision) {
            balances.decideEncashment(
              decision.request.id,
              decision.approve,
              note.trim()
            )
          }
          setDecision(null)
        }}
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='Decision note (optional, shown to the applicant)'
          rows={2}
        />
      </ConfirmDialog>
    </div>
  )
}
