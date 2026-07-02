import { Badge } from '@/components/ui/badge'
import { type LeaveAuditStore } from '../hooks/use-leave-audit'

/**
 * Immutable audit trail for overrides and workflow events (LVE-08) and the
 * template-rendered notification feed (LVE-27). Entries are append-only —
 * there is no edit or delete anywhere in the UI or store.
 */
export function AuditTab({ audit }: { audit: LeaveAuditStore }) {
  return (
    <div className='w-full space-y-5'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Audit Trail ({audit.entries.length})
        </h2>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Immutable and tamper-evident: every override records the actor,
          mandatory reason, timestamp and before/after values. Entries can be
          appended but never altered or removed.
        </p>
        <div className='space-y-2'>
          {audit.entries.map((e) => (
            <div key={e.id} className='rounded-[8px] border border-gray-200 bg-white p-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>
                  {e.action} — {e.target}
                </span>
                <span className='text-neutral-1000 text-xs'>
                  {new Date(e.at).toLocaleString('en-GB')}
                </span>
              </div>
              <div className='text-neutral-1000 text-xs'>
                by {e.actor} ({e.actorRole})
              </div>
              <div className='mt-1 grid grid-cols-2 gap-2 text-xs'>
                <div className='rounded bg-red-50 px-2 py-1'>
                  <span className='text-neutral-1000'>Before:</span> {e.before}
                </div>
                <div className='rounded bg-green-50 px-2 py-1'>
                  <span className='text-neutral-1000'>After:</span> {e.after}
                </div>
              </div>
              <div className='mt-1 text-xs'>
                <span className='text-neutral-1000'>Reason:</span> {e.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Notification Log ({audit.notifications.length})
        </h2>
        <p className='text-neutral-1000 mb-3 text-xs'>
          Rendered from the configured templates by the shared notification
          engine on every state transition.
        </p>
        <div className='space-y-2'>
          {audit.notifications.map((n) => (
            <div key={n.id} className='rounded-[8px] border border-gray-200 bg-white p-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <Badge variant='open'>{n.event}</Badge>
                  <span className='text-neutral-1000 text-xs'>{n.channel}</span>
                </span>
                <span className='text-neutral-1000 text-xs'>
                  {new Date(n.at).toLocaleString('en-GB')}
                </span>
              </div>
              <div className='mt-1'>{n.message}</div>
              <div className='text-neutral-1000 text-xs'>To: {n.recipients}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
