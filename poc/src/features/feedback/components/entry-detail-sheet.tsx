import { useEffect, useState } from 'react'
import { ArrowUpRight, Lock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { type FormFieldDef } from '../data/config'
import {
  ENTRY_STATUSES,
  type EntryStatus,
  type FeedbackEntry,
} from '../data/entries'
import { EntryStatusBadge, EntryTypeBadge } from './status-badges'

interface EntryDetailSheetProps {
  entry: FeedbackEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  formFields: FormFieldDef[]
  /** Role-based review: status updates only for authorized reviewers (FBG-05). */
  canReview: boolean
  /** Full audit trail only for authorized personnel (FBG-06). */
  canViewAudit: boolean
  coordinator: string | null
  onUpdateStatus: (status: EntryStatus, note: string) => void
  onEscalate: () => void
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-neutral-1000 text-xs font-medium'>{label}</p>
      <p className='text-neutral-1600 text-sm'>{value}</p>
    </div>
  )
}

/**
 * Entry detail: confidential grievance banner, captured details under the
 * submission-time schema, reviewer status actions, and the audit trail
 * (status timeline only for the submitter).
 */
export function EntryDetailSheet({
  entry,
  open,
  onOpenChange,
  formFields,
  canReview,
  canViewAudit,
  coordinator,
  onUpdateStatus,
  onEscalate,
}: EntryDetailSheetProps) {
  const [nextStatus, setNextStatus] = useState<EntryStatus>('Under Review')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open && entry) {
      setNextStatus(entry.status)
      setNote('')
    }
  }, [open, entry])

  if (!entry) return null

  const fieldLabel = (id: string) =>
    formFields.find((f) => f.id === id)?.label ?? id

  const submitterLabel = entry.anonymous
    ? `Anonymous (${entry.anonymousRef}) — identity withheld`
    : entry.onBehalfOf
      ? `${entry.onBehalfOf} — filed on their behalf`
      : (entry.submittedBy ?? '—')

  const visibleAudit = canViewAudit
    ? entry.audit
    : entry.audit.filter(
        (a) => a.action.startsWith('Status changed') || a.action.startsWith('Submitted')
      )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {entry.id} · {entry.subject}
          </SheetTitle>
          <div className='flex items-center gap-2'>
            <EntryTypeBadge type={entry.type} />
            <EntryStatusBadge status={entry.status} />
            {entry.anonymous && (
              <span className='text-neutral-1000 flex items-center gap-1 text-xs'>
                <ShieldAlert className='size-3.5' /> Anonymous
              </span>
            )}
          </div>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          {entry.type === 'Grievance' && (
            <div className='bg-blue-150 text-blue-1400 flex items-start gap-2 rounded-[6px] px-3 py-2 text-sm'>
              <Lock className='mt-0.5 size-4 shrink-0' />
              Confidential — grievance information is restricted to authorized
              personnel within scope. Access attempts outside scope are denied
              and logged.
            </div>
          )}

          <div className='grid grid-cols-2 gap-3'>
            <Meta label='Submitter' value={submitterLabel} />
            <Meta label='Company' value={entry.company} />
            <Meta label='Category' value={entry.category} />
            <Meta label='Assigned to' value={entry.assignedTo} />
            <Meta label='Submitted on' value={entry.submittedOn} />
            <Meta label='Captured under schema' value={`v${entry.schemaVersion}`} />
          </div>

          <Separator />

          <div className='space-y-2'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              Captured details
            </p>
            {Object.entries(entry.details).map(([id, value]) =>
              value ? <Meta key={id} label={fieldLabel(id)} value={value} /> : null
            )}
          </div>

          {canReview && (
            <>
              <Separator />
              <div className='space-y-2'>
                <p className='text-neutral-1600 text-sm font-semibold'>
                  Review actions (role-based)
                </p>
                <div className='flex items-end gap-2'>
                  <div className='flex-1'>
                    <Label className='text-xs'>New status</Label>
                    <Select
                      value={nextStatus}
                      onValueChange={(v) => setNextStatus(v as EntryStatus)}
                    >
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTRY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => onUpdateStatus(nextStatus, note)}
                    disabled={nextStatus === entry.status}
                  >
                    Update status
                  </Button>
                </div>
                <div>
                  <Label className='text-xs'>Reviewer note (audited)</Label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Recorded in the audit trail and the submitter notification'
                  />
                </div>
                {coordinator && entry.status !== 'Escalated' && (
                  <Button variant='outline' onClick={onEscalate} className='gap-1'>
                    <ArrowUpRight className='size-4' />
                    Escalate to coordinator ({coordinator})
                  </Button>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className='space-y-2 pb-2'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              {canViewAudit ? 'Audit trail' : 'Status timeline'}
            </p>
            {!canViewAudit && (
              <p className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'>
                <Lock className='size-3.5' />
                The full audit trail is available to authorized reviewers only.
              </p>
            )}
            <ol className='space-y-2'>
              {[...visibleAudit].reverse().map((event) => (
                <li
                  key={event.id}
                  className='border-grey-200 rounded-[6px] border px-3 py-2'
                >
                  <div className='flex items-center justify-between'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {event.action}
                    </p>
                    <span className='text-neutral-1000 text-xs'>{event.at}</span>
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {event.actor} — {event.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
