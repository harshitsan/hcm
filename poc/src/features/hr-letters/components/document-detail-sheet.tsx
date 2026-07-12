import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  EMPLOYEES,
  SIGNATORIES,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { downloadLetterPdf, printLetter } from '../data/letter-pdf'
import { resolveMergeFields } from '../data/merge-engine'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'
import { DistributeDialog } from './distribute-dialog'
import { LetterSheet } from './letter-sheet'
import {
  AckBadge,
  ChannelBadge,
  DeliveryBadge,
  DocStatusBadge,
} from './status-badges'

interface DocumentDetailSheetProps {
  doc: HrDocument | null
  onOpenChange: (open: boolean) => void
  store: HrDocumentsStore
  templates: LetterTemplate[]
  /** Company Admin can approve/reject/issue/reissue (HLC-06/08/10/14). */
  canAct: boolean
}

/**
 * Full document record (HLC-22 drill-in): print-styled letter preview with
 * letterhead and signature block, PDF download/print, the approval trail with
 * the recorded signatory (HLC-07), version + reissue links (HLC-10/17),
 * per-channel distribution tracking with re-send on failure (HLC-08/09/13),
 * 7-year retention (HLC-11), and the immutable audit trail.
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
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [reissueOpen, setReissueOpen] = useState(false)
  const [signatoryName, setSignatoryName] = useState(SIGNATORIES[0].name)

  if (!doc) return null

  const employee = EMPLOYEES.find((e) => e.id === doc.employeeId)
  const template = templates.find((t) => t.id === doc.templateId)
  const canIssue = doc.status === 'approved' || doc.status === 'issued'
  const merge = template
    ? resolveMergeFields(template.body, doc.employeeId)
    : {
        rendered: 'Rendered from the template version recorded on this letter.',
        gaps: [],
      }
  const letterheadOn = template?.letterhead ?? true

  const pdfInput = {
    refId: doc.id,
    docType: doc.docType,
    employeeName: doc.employeeName,
    dateIso: doc.generatedOn,
    body: merge.rendered,
    letterhead: letterheadOn,
    signedBy: doc.signedBy,
    signingAuthority: doc.signingAuthority,
  }

  const selectedSignatory =
    SIGNATORIES.find((s) => s.name === signatoryName) ?? SIGNATORIES[0]

  const handleApprove = () => {
    store.approve(doc.id, 'Lakshmi Rao (Company Admin)', selectedSignatory)
  }

  return (
    <Sheet open={Boolean(doc)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {doc.docType} — {doc.employeeName}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='flex flex-wrap items-center gap-2'>
            <DocStatusBadge status={doc.status} />
            {doc.trigger === 'auto' && (
              <Badge variant='pending'>
                Generated automatically — {doc.event}
              </Badge>
            )}
            {doc.reissueOf && (
              <Badge variant='overdue'>Reissue of {doc.reissueOf}</Badge>
            )}
            {doc.reissuedAs && (
              <Badge variant='pending'>Reissued as {doc.reissuedAs}</Badge>
            )}
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
              Retained until {doc.retentionUntil}
            </p>
            <p className='text-neutral-1000 text-xs'>
              Issued letters are retained for 7 years from the date of
              generation, per company document policy.
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

          <div className='space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-paragraph-sm font-medium'>
                Letter preview (PDF)
              </p>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => downloadLetterPdf(pdfInput)}
                >
                  Download PDF
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => printLetter(pdfInput)}
                >
                  Print
                </Button>
              </div>
            </div>
            {merge.gaps.length > 0 && (
              <div className='border-red-1400/40 rounded-[6px] border bg-red-50 p-3'>
                <p className='text-red-1400 text-paragraph-sm mb-1 font-medium'>
                  Missing information
                </p>
                <ul className='text-red-1400 list-disc space-y-0.5 pl-4 text-sm'>
                  {merge.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
            <LetterSheet
              refId={doc.id}
              docType={doc.docType}
              dateIso={doc.generatedOn}
              body={merge.rendered}
              letterhead={letterheadOn}
              signedBy={doc.signedBy}
              signingAuthority={doc.signingAuthority}
            />
          </div>

          {canAct && (
            <>
              <Separator />
              <div className='space-y-2'>
                <p className='text-paragraph-sm font-medium'>Actions</p>
                {doc.status === 'draft' && (
                  <Button
                    size='sm'
                    onClick={() =>
                      store.sendForApproval(doc.id, 'Lakshmi Rao (Company Admin)')
                    }
                  >
                    Send for approval
                  </Button>
                )}
                {doc.status === 'pending-approval' && (
                  <div className='space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Select
                        value={signatoryName}
                        onValueChange={setSignatoryName}
                      >
                        <SelectTrigger
                          variant='secondary'
                          className='h-8 w-[240px]'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNATORIES.map((s) => (
                            <SelectItem key={s.name} value={s.name}>
                              {s.name} — {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size='sm' onClick={handleApprove}>
                        Approve &amp; sign
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setShowReject((s) => !s)}
                      >
                        Reject…
                      </Button>
                    </div>
                    <p className='text-neutral-1000 text-xs'>
                      The selected signatory is recorded on the letter and
                      appears in the signature block.
                    </p>
                  </div>
                )}
                {showReject && doc.status === 'pending-approval' && (
                  <div className='space-y-2'>
                    <Textarea
                      placeholder='e.g. Position title is out of date — correct and regenerate'
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={rejectReason.trim().length < 5}
                      onClick={() => {
                        store.reject(
                          doc.id,
                          'Lakshmi Rao (Company Admin)',
                          rejectReason.trim()
                        )
                        setShowReject(false)
                        setRejectReason('')
                      }}
                    >
                      Confirm rejection
                    </Button>
                  </div>
                )}
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={!canIssue}
                    title={
                      !canIssue
                        ? 'Only approved letters can be issued'
                        : undefined
                    }
                    onClick={() => setDistributeOpen(true)}
                  >
                    Issue / distribute…
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={
                      (doc.status !== 'issued' && doc.status !== 'rejected') ||
                      Boolean(doc.reissuedAs)
                    }
                    title={
                      doc.reissuedAs
                        ? `Already reissued as ${doc.reissuedAs}`
                        : doc.status !== 'issued' && doc.status !== 'rejected'
                          ? 'Only issued or rejected letters can be reissued'
                          : undefined
                    }
                    onClick={() => setReissueOpen(true)}
                  >
                    Reissue…
                  </Button>
                </div>
                {!doc.employeeHasAppAccess && (
                  <p className='text-neutral-1000 text-xs'>
                    {doc.employeeName} has no application login — email, print,
                    and handover channels keep them covered.
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />
          <div>
            <p className='text-paragraph-sm mb-1 font-medium'>Approval trail</p>
            <ul className='space-y-1 text-sm'>
              <li>
                <span className='text-neutral-1000'>Generated: </span>
                {doc.generatedOn} by {doc.generatedBy}
              </li>
              {doc.approvedBy ? (
                <li>
                  <span className='text-neutral-1000'>Approved: </span>
                  {doc.approvedOn} by {doc.approvedBy}
                </li>
              ) : (
                <li className='text-neutral-1000'>
                  {doc.status === 'rejected'
                    ? 'Rejected — see reason above'
                    : 'Approval pending'}
                </li>
              )}
              {doc.signedBy && (
                <li>
                  <span className='text-neutral-1000'>Signed by: </span>
                  {doc.signedBy.name}, {doc.signedBy.title}
                </li>
              )}
            </ul>
          </div>

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
            {(doc.reissueOf || doc.reissuedAs) && (
              <p className='text-neutral-1000 mt-1 text-xs'>
                {doc.reissueOf && `This letter is a reissue of ${doc.reissueOf}. `}
                {doc.reissuedAs &&
                  `A replacement letter (${doc.reissuedAs}) has been created with a fresh approval cycle.`}
              </p>
            )}
          </div>

          <div>
            <p className='text-paragraph-sm mb-1 font-medium'>
              Distribution &amp; delivery tracking
            </p>
            {doc.distributions.length === 0 ? (
              <p className='text-neutral-1000 text-sm'>
                Not dispatched yet.
                {!canIssue && ' Only approved letters are dispatched.'}
              </p>
            ) : (
              <ul className='space-y-1.5'>
                {doc.distributions.map((dist) => (
                  <li key={dist.id} className='text-sm'>
                    <span className='flex flex-wrap items-center gap-2'>
                      <ChannelBadge channel={dist.channel} />
                      <DeliveryBadge outcome={dist.outcome} />
                      <span className='text-neutral-1900'>
                        {dist.sentOn} — {dist.detail}
                      </span>
                    </span>
                    {dist.channel === 'handover' && dist.handedOverBy && (
                      <span className='text-neutral-1000 block text-xs'>
                        Handed over by {dist.handedOverBy}
                        {dist.handoverDate ? ` on ${dist.handoverDate}` : ''}
                      </span>
                    )}
                    {dist.ccRecipients && dist.ccRecipients.length > 0 && (
                      <span className='text-neutral-1000 block text-xs'>
                        CC: {dist.ccRecipients.join(', ')}
                      </span>
                    )}
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

        {canAct && (
          <DistributeDialog
            open={distributeOpen}
            onOpenChange={setDistributeOpen}
            doc={doc}
            onDistribute={(channel, options) =>
              store.distribute(doc.id, channel, employee, options)
            }
          />
        )}

        <ConfirmDialog
          open={reissueOpen}
          onOpenChange={setReissueOpen}
          title={`Reissue ${doc.docType}?`}
          desc={`A new letter linked to ${doc.id} will be created ("Reissue of ${doc.id}") and will go through a fresh approval cycle. The original stays retained.`}
          confirmText='Create reissue'
          handleConfirm={() => {
            store.reissue(
              doc.id,
              doc.status === 'rejected'
                ? 'corrected after rejection'
                : 'duplicate copy requested',
              'Lakshmi Rao (Company Admin)'
            )
            setReissueOpen(false)
            toast.info('Find the new letter at the top of the documents list')
          }}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
