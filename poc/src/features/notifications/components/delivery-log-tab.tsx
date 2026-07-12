import { useState } from 'react'
import { CalendarClock, Inbox, Mail, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate, useRole } from '@/context/role-context'
import { seedDigestQueue, type DeliveryRecord } from '../data/notifications'
import { deliveryLogColumns } from './delivery-log-columns'
import { DeliveryStatusBadge } from './notification-badges'
import { OutboxDetailSheet } from './outbox-detail-sheet'

interface DeliveryLogTabProps {
  deliveries: DeliveryRecord[]
  retryDelivery: (id: string) => void
  fallbackToEmail: (id: string) => void
  resolveDeadLetter: (id: string) => void
}

/**
 * Outbox — auditable sent messages with per-channel delivery records (NTF-18)
 * and the engine's delivery guarantee controls: retry, email fallback, the
 * digest queue and the dead-letter store (NTF-08, NTF-22). Rows open a detail
 * sheet with the delivery timeline and message preview. Records are
 * immutable; Platform Admin only gets re-drive actions, never edits.
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
  const [detailId, setDetailId] = useState<string | null>(null)

  // Resolve from the live list so retries/fallbacks reflect in the open sheet.
  const detailRecord = deliveries.find((d) => d.id === detailId) ?? null

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
      selected.finalStatus === 'retrying' ||
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
          Sent messages ({deliveries.length})
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
        onRowClick={(row) => setDetailId(row.id)}
      />

      {detailRecord && (
        <OutboxDetailSheet
          record={detailRecord}
          onOpenChange={(open) => {
            if (!open) setDetailId(null)
          }}
        />
      )}

      <Card className='mt-4 gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <CalendarClock className='text-blue-1400 size-4' />
            Digest queue ({seedDigestQueue.length})
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Scheduler-driven digests and summaries waiting for their next run.
            Each run consolidates the period&apos;s non-critical updates into
            one message per recipient; empty periods are skipped.
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Digest</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Contents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seedDigestQueue.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className='text-sm font-medium'>{d.name}</TableCell>
                  <TableCell className='text-sm'>{d.cadence}</TableCell>
                  <TableCell className='text-sm'>
                    {new Intl.DateTimeFormat('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(d.nextRunAt))}
                  </TableCell>
                  <TableCell className='text-sm'>{d.recipients}</TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {d.contents}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'
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
