import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  EMPLOYEES,
  renderBody,
  type Channel,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'
import { AckBadge, DeliveryBadge, DocStatusBadge } from './status-badges'

const CHANNELS: Channel[] = ['email', 'in-app', 'print']

interface DocumentDetailSheetProps {
  doc: HrDocument | null
  onOpenChange: (open: boolean) => void
  store: HrDocumentsStore
  templates: LetterTemplate[]
  /** Company Admin can approve/reject/distribute/reissue (HLC-06/08/10/14). */
  canAct: boolean
}

/**
 * Full document record (HLC-22 drill-in): rendered content, signing authority
 * (HLC-07), complete version history with the current version flagged
 * (HLC-10/17), per-channel distribution tracking with re-send on failure
 * (HLC-08/09/13), retention (HLC-11), and the immutable audit trail (HLC-17).
 */
export function DocumentDetailSheet({
  doc,
  onOpenChange,
  store,
  templates,
  canAct,
}: DocumentDetailSheetProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  if (!doc) return null

  const employee = EMPLOYEES.find((e) => e.id === doc.employeeId)
  const template = templates.find((t) => t.id === doc.templateId)
  const finalized = doc.status === 'approved' || doc.status === 'distributed'
  const rendered =
    template && employee
      ? renderBody(template.body, employee, template.missingValueBehavior)
      : 'Rendered from the template version recorded on this document.'

  return (
    <Sheet open={Boolean(doc)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {doc.docType} — {doc.employeeName}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='flex flex-wrap items-center gap-2'>
            <DocStatusBadge status={doc.status} />
            {doc.requiresAcknowledgment && (
              <AckBadge acknowledgedOn={doc.acknowledgedOn} />
            )}
            <Badge variant='pending'>
              v{doc.versions.length} · template v{doc.templateVersion}
            </Badge>
          </div>

          <div className='text-sm'>
            <p>
              <span className='text-neutral-1000'>Signing authority: </span>
              {doc.signingAuthority}
            </p>
            <p>
              <span className='text-neutral-1000'>Generated: </span>
              {doc.generatedOn} by {doc.generatedBy} ({doc.trigger} · {doc.event})
            </p>
            <p>
              <span className='text-neutral-1000'>Retention: </span>
              retained until {doc.retentionUntil} (7-year rule)
            </p>
            <p>
              <span className='text-neutral-1000'>Tenant scope: </span>
              {doc.company}
            </p>
            {doc.rejectReason && (
              <p className='text-red-1400'>
                Rejection reason: {doc.rejectReason}
              </p>
            )}
          </div>

          <div className='rounded-[6px] border border-gray-200 bg-white p-3'>
            <p className='text-paragraph-sm text-neutral-1000 mb-1 font-medium'>
              Document content (PDF preview)
            </p>
            <pre className='text-neutral-1900 font-sans text-sm whitespace-pre-wrap'>
              {rendered}
            </pre>
          </div>

          {canAct && (
            <>
              <Separator />
              <div className='space-y-2'>
                <p className='text-paragraph-sm font-medium'>Actions</p>
                {doc.status === 'pending-approval' && (
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      onClick={() => store.approve(doc.id, 'Lakshmi Rao (Company Admin)')}
                    >
                      Approve
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setShowReject((s) => !s)}
                    >
                      Reject…
                    </Button>
                  </div>
                )}
                {showReject && doc.status === 'pending-approval' && (
                  <div className='space-y-2'>
                    <Textarea
                      placeholder='Rejection reason (sent to the originator)'
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={rejectReason.trim().length < 5}
                      onClick={() => {
                        store.reject(doc.id, 'Lakshmi Rao (Company Admin)', rejectReason.trim())
                        setShowReject(false)
                        setRejectReason('')
                      }}
                    >
                      Confirm rejection
                    </Button>
                  </div>
                )}
                <div className='flex flex-wrap gap-2'>
                  {CHANNELS.map((channel) => {
                    const inAppBlocked =
                      channel === 'in-app' && !doc.employeeHasAppAccess
                    return (
                      <Button
                        key={channel}
                        size='sm'
                        variant='outline'
                        disabled={!finalized || inAppBlocked}
                        title={
                          !finalized
                            ? 'Only finalized documents can be dispatched'
                            : inAppBlocked
                              ? 'Employee has no app access — use email or print'
                              : undefined
                        }
                        onClick={() => store.distribute(doc.id, channel, employee)}
                      >
                        Send via {channel}
                      </Button>
                    )
                  })}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      store.reissue(
                        doc.id,
                        doc.status === 'rejected' ? 'corrected after rejection' : 'duplicate copy requested',
                        'Lakshmi Rao (Company Admin)'
                      )
                    }
                  >
                    Reissue (new version)
                  </Button>
                </div>
                {!doc.employeeHasAppAccess && (
                  <p className='text-neutral-1000 text-xs'>
                    {doc.employeeName} has no application login — email and
                    print channels keep them covered.
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />
          <div>
            <p className='text-paragraph-sm mb-1 font-medium'>
              Version history (all prior versions retained)
            </p>
            <ul className='space-y-1'>
              {doc.versions.map((ver) => (
                <li key={ver.version} className='flex items-center gap-2 text-sm'>
                  <Badge variant={ver.current ? 'badge_active' : 'pending'}>
                    v{ver.version}
                    {ver.current ? ' · current' : ''}
                  </Badge>
                  <span className='text-neutral-1900'>
                    {ver.generatedOn} — {ver.event} (template v{ver.templateVersion})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className='text-paragraph-sm mb-1 font-medium'>
              Distribution &amp; delivery tracking
            </p>
            {doc.distributions.length === 0 ? (
              <p className='text-neutral-1000 text-sm'>
                Not dispatched yet.
                {!finalized && ' The notification engine only dispatches finalized documents.'}
              </p>
            ) : (
              <ul className='space-y-1'>
                {doc.distributions.map((dist) => (
                  <li key={dist.id} className='flex items-center gap-2 text-sm'>
                    <DeliveryBadge outcome={dist.outcome} />
                    <span className='text-neutral-1900'>
                      {dist.channel} · {dist.sentOn} — {dist.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {doc.questionnaireAnswers.length > 0 && (
            <div>
              <p className='text-paragraph-sm mb-1 font-medium'>
                Certification questionnaire responses
              </p>
              <ul className='space-y-1 text-sm'>
                {doc.questionnaireAnswers.map((qa) => (
                  <li key={qa.question}>
                    <span className='text-neutral-1000'>{qa.question}</span>
                    <br />
                    {qa.answer || '—'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className='text-paragraph-sm mb-1 font-medium'>
              Audit trail (immutable, append-only)
            </p>
            <ul className='space-y-1'>
              {doc.audit.map((entry, i) => (
                <li key={`${entry.on}-${i}`} className='text-sm'>
                  <span className='text-neutral-1000'>{entry.on}</span>{' '}
                  <span className='font-medium'>{entry.action}</span> —{' '}
                  {entry.actor}: {entry.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
