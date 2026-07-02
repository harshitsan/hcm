import { useState } from 'react'
import { Inbox, Mail, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import { type DeliveryRecord } from '../data/notifications'
import { deliveryLogColumns } from './delivery-log-columns'
import { DeliveryStatusBadge } from './notification-badges'

interface DeliveryLogTabProps {
  deliveries: DeliveryRecord[]
  retryDelivery: (id: string) => void
  fallbackToEmail: (id: string) => void
  resolveDeadLetter: (id: string) => void
}

/**
 * Auditable notification + per-channel delivery records (NTF-18) with the
 * engine's delivery guarantee controls — retry, email fallback and the
 * dead-letter store (NTF-08, NTF-22). Records are immutable; Platform Admin
 * only gets re-drive actions, never edits.
 */
export function DeliveryLogTab({
  deliveries,
  retryDelivery,
  fallbackToEmail,
  resolveDeadLetter,
}: DeliveryLogTabProps) {
  const { hasRole } = useRole()
  const [selectedRows, setSelectedRows] = useState<DeliveryRecord[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const selected = selectedRows[0]
  const canAct = hasRole('Platform Admin')
  const retryable =
    selected &&
    (selected.finalStatus === 'partially delivered' ||
      selected.finalStatus === 'in progress' ||
      selected.finalStatus === 'failed')

  const deadLetters = deliveries.filter((d) => d.finalStatus === 'dead-letter')

  return (
    <div className='w-full'>
      <Card className='mb-3 gap-2 border-none bg-white py-3'>
        <CardContent className='flex items-start gap-2 px-4'>
          <ShieldCheck className='text-blue-1400 mt-0.5 size-4 shrink-0' />
          <p className='text-paragraph-sm text-neutral-1000'>
            Every generated notification persists an immutable record with its
            per-channel attempts (channel, recipient, status, timestamp, error
            reason) — the full delivery history is retrievable for audit.
            Records are tenant-scoped under row-level security: this view only
            ever returns your tenant&apos;s data (Northwind Retail Co.), and
            hierarchy-scoped access never leaks peer-company records.
          </p>
        </CardContent>
      </Card>

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Delivery records ({deliveries.length})
        </h2>
        <RoleGate roles={['Platform Admin']}>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              className='h-7 gap-1 rounded-[6px] px-2'
              disabled={!canAct || !retryable}
              onClick={() => {
                if (selected) retryDelivery(selected.id)
                clearSelection()
              }}
            >
              <RefreshCcw className='size-3.5' />
              Retry failed channels
            </Button>
            <Button
              variant='outline'
              className='h-7 gap-1 rounded-[6px] px-2'
              disabled={!canAct || !retryable}
              onClick={() => {
                if (selected) fallbackToEmail(selected.id)
                clearSelection()
              }}
            >
              <Mail className='size-3.5' />
              Fall back to email
            </Button>
          </div>
        </RoleGate>
      </div>

      <DataTable
        columns={deliveryLogColumns}
        data={deliveries}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <Card className='mt-4 gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <Inbox className='text-red-1400 size-4' />
            Dead-letter store ({deadLetters.length})
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Notifications whose every delivery attempt failed after retries are
            parked here and flagged for admin review — nothing is silently
            lost, and one stuck notification never blocks the rest of the
            queue.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {deadLetters.length === 0 && (
            <p className='text-neutral-1000 text-sm'>
              The dead-letter store is empty.
            </p>
          )}
          {deadLetters.map((d) => (
            <div
              key={d.id}
              className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {d.id} — {d.subject}
                  </p>
                  <DeliveryStatusBadge status={d.finalStatus} />
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {d.recipient} · {d.attempts.length} attempts ·{' '}
                  {d.attempts[d.attempts.length - 1]?.error ?? 'exhausted'}
                </p>
              </div>
              <RoleGate roles={['Platform Admin']}>
                <Button
                  className='h-7 rounded-[6px] px-2'
                  onClick={() => resolveDeadLetter(d.id)}
                >
                  Re-drive via email
                </Button>
              </RoleGate>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
