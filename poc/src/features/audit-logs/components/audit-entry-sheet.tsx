import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type AuditEntry } from '../data/audit-entries'
import {
  ActionBadge,
  TierBadge,
  ValueTransition,
  auditDateTimeFmt,
} from './audit-badges'

interface AuditEntrySheetProps {
  entry: AuditEntry | null
  onOpenChange: (open: boolean) => void
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-neutral-1000 text-xs font-medium'>{label}</span>
      <span className='text-neutral-1600 text-sm'>{value}</span>
    </div>
  )
}

/**
 * Read-only detail view of a single audit entry: full who/when/what plus the
 * per-field previous → new value pairs (FR 6.29.2).
 */
export function AuditEntrySheet({ entry, onOpenChange }: AuditEntrySheetProps) {
  return (
    <Sheet open={Boolean(entry)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Audit entry {entry?.id}
          </SheetTitle>
        </SheetHeader>

        {entry && (
          <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
            <div className='flex flex-wrap items-center gap-2'>
              <ActionBadge action={entry.actionType} />
              <TierBadge tier={entry.storageTier} />
              {entry.nonUserRecord && (
                <Badge variant='pending'>Non-user employee record</Badge>
              )}
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
              <MetaRow label='Entity type' value={entry.entityType} />
              <MetaRow label='Record identifier' value={entry.recordId} />
              <MetaRow label='Record' value={entry.recordName} />
              <MetaRow
                label='Timestamp'
                value={auditDateTimeFmt.format(new Date(entry.timestamp))}
              />
              <MetaRow
                label='Actor'
                value={
                  entry.actorType === 'system'
                    ? `${entry.actor} (system identity)`
                    : entry.actor
                }
              />
              <MetaRow label='Company' value={entry.companyName} />
              <MetaRow label='Tenant boundary' value={entry.tenant} />
            </div>

            <Separator />

            <div>
              <h4 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                Field changes ({entry.changes.length})
              </h4>
              <div className='space-y-3'>
                {entry.changes.map((change) => (
                  <div
                    key={change.field}
                    className='border-grey-200 rounded-[6px] border bg-white p-3'
                  >
                    <div className='text-neutral-1600 mb-1.5 text-sm font-medium'>
                      {change.field}
                    </div>
                    <ValueTransition
                      previousValue={change.previousValue}
                      newValue={change.newValue}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-blue-150 flex items-start gap-2 rounded-[6px] p-3'>
              <Lock className='text-blue-1400 mt-0.5 size-4 shrink-0' />
              <p className='text-neutral-1900 text-xs'>
                Audit entries are write-once and tamper-resistant. They cannot
                be edited or deleted by any role; modification attempts are
                blocked and recorded as security events. Protection applies
                uniformly across active and archival storage.
              </p>
            </div>
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
