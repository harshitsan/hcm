import { CircleAlert, CircleCheck, Clock } from 'lucide-react'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  CHANNEL_LABELS,
  EVENT_TYPE_LABELS,
  OUTBOX_MODEL_LABELS,
  type DeliveryRecord,
} from '../data/notifications'
import { DeliveryStatusBadge, ModelBadge } from './notification-badges'

interface OutboxDetailSheetProps {
  record: DeliveryRecord | null
  onOpenChange: (open: boolean) => void
}

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function fmt(ts: string) {
  return dateTimeFmt.format(new Date(ts))
}

/** Icon for a derived timeline step based on the attempt outcome. */
function stepTone(text: string): 'ok' | 'bad' | 'wait' {
  const t = text.toLowerCase()
  if (t.includes('fail')) return 'bad'
  if (t.includes('delivered')) return 'ok'
  return 'wait'
}

/**
 * Outbox row detail: the full delivery timeline (attempts, retries, fallback
 * and quiet-hours holds) plus the rendered message preview.
 */
export function OutboxDetailSheet({
  record: r,
  onOpenChange,
}: OutboxDetailSheetProps) {
  if (!r) return null

  // Prefer the engine's explicit timeline; otherwise derive one per attempt.
  const steps =
    r.timeline ??
    r.attempts.map(
      (a) =>
        `${CHANNEL_LABELS[a.channel]} — ${a.status}${a.error ? ` (${a.error})` : ''} · ${fmt(a.timestamp)}`
    )

  const meta: { label: string; value: React.ReactNode }[] = [
    { label: 'Recipient', value: r.recipient },
    { label: 'Event', value: EVENT_TYPE_LABELS[r.eventType] },
    { label: 'Template', value: r.templateVersion },
    { label: 'Delivery model', value: OUTBOX_MODEL_LABELS[r.model] },
    { label: 'Company', value: r.tenant },
    { label: 'Generated', value: fmt(r.createdAt) },
  ]

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex flex-wrap items-center gap-2 font-semibold'>
            {r.subject}
            <DeliveryStatusBadge status={r.finalStatus} />
            <ModelBadge model={r.model} />
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {r.id} · Outbox record
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
            {meta.map((m) => (
              <div key={m.label}>
                <p className='text-paragraph-sm text-neutral-1000'>{m.label}</p>
                <p className='text-neutral-1600 text-sm'>{m.value}</p>
              </div>
            ))}
          </div>

          {r.note && (
            <div className='border-gray-200 bg-blue-150 rounded-[6px] border px-3 py-2'>
              <p className='text-neutral-1600 text-sm'>{r.note}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Delivery timeline
            </p>
            <ol className='space-y-2'>
              {steps.map((step, i) => {
                const tone = stepTone(step)
                return (
                  <li key={i} className='flex items-start gap-2'>
                    {tone === 'ok' && (
                      <CircleCheck className='text-green-1300 mt-0.5 size-4 shrink-0' />
                    )}
                    {tone === 'bad' && (
                      <CircleAlert className='text-red-1400 mt-0.5 size-4 shrink-0' />
                    )}
                    {tone === 'wait' && (
                      <Clock className='text-neutral-1000 mt-0.5 size-4 shrink-0' />
                    )}
                    <span className='text-neutral-1600 text-sm'>{step}</span>
                  </li>
                )
              })}
            </ol>
          </div>

          <Separator />

          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Message preview
            </p>
            <div className='border-gray-200 rounded-[6px] border px-3 py-2'>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                {r.subject}
              </p>
              <p className='text-paragraph-sm text-neutral-1000'>
                {r.preview ?? 'No preview stored for this message.'}
              </p>
            </div>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
