import { useState } from 'react'
import { DownloadSimple, Printer } from 'phosphor-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  downloadLetterPdf,
  printLetter,
  type LetterPdfInput,
} from '@/features/hr-letters/data/letter-pdf'
import {
  effectiveStatusOf,
  notificationTimelineOf,
  signatoryFor,
  type Agreement,
} from '../data/agreements'
import { type AgreementsStore } from '../hooks/use-agreements'
import { AgreementStatusBadge } from './agreement-badges'
import { type AgreementRow } from './agreements-table-columns'

interface AgreementDetailSheetProps {
  agreement: AgreementRow | null
  onOpenChange: (open: boolean) => void
  /** Admins renew/terminate; the employee view acknowledges own records. */
  mode: 'admin' | 'employee'
  store: AgreementsStore
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtDate = (iso: string | undefined) =>
  iso ? dateFmt.format(new Date(`${iso}T00:00:00`)) : '—'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-4 py-1.5 text-sm'>
      <span className='text-neutral-1000 shrink-0'>{label}</span>
      <span className='text-neutral-1600 text-right font-medium'>{children}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-neutral-1000 mb-1 text-xs font-medium uppercase'>
      {children}
    </p>
  )
}

function pdfInputOf(agreement: Agreement): LetterPdfInput {
  return {
    refId: agreement.id,
    docType: agreement.type,
    employeeName: agreement.employeeName,
    dateIso: agreement.executedOn,
    body: agreement.renderedBody,
    letterhead: true,
    signedBy:
      agreement.status === 'Draft'
        ? null
        : signatoryFor(agreement.signingAuthority),
    signingAuthority: agreement.signingAuthority,
  }
}

/**
 * Row-click drill-down for an agreement (O10): rendered agreement preview,
 * validity timeline, acknowledgment state (W11), the expiry-notification
 * timeline (F7) and the full record history — plus role-gated actions
 * (acknowledge / renew / terminate) and PDF download or print (F8 helpers).
 */
export function AgreementDetailSheet({
  agreement,
  onOpenChange,
  mode,
  store,
}: AgreementDetailSheetProps) {
  const [confirmAcknowledge, setConfirmAcknowledge] = useState(false)
  const [confirmRenew, setConfirmRenew] = useState(false)
  const [confirmTerminate, setConfirmTerminate] = useState(false)

  const status = agreement ? effectiveStatusOf(agreement) : null
  const timeline = agreement ? notificationTimelineOf(agreement) : []

  const canAcknowledge =
    mode === 'employee' &&
    agreement !== null &&
    status === 'Sent for acknowledgment'
  const canRenew =
    mode === 'admin' &&
    agreement !== null &&
    (status === 'Expiring soon' || status === 'Expired') &&
    !agreement.renewedAs
  const canTerminate =
    mode === 'admin' &&
    agreement !== null &&
    (status === 'Active' ||
      status === 'Acknowledged' ||
      status === 'Expiring soon')

  return (
    <Sheet open={agreement !== null} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {agreement
              ? `${agreement.type} — ${agreement.employeeName}`
              : 'Agreement'}
          </SheetTitle>
        </SheetHeader>

        {agreement && status && (
          <>
            <div className='flex-1 overflow-y-auto px-5 py-4'>
              <div className='mb-3 flex flex-wrap items-center gap-1.5'>
                <AgreementStatusBadge status={status} />
                <Badge variant='open'>{agreement.type}</Badge>
                <Badge variant='pending'>
                  {agreement.acknowledgment.required
                    ? 'Acknowledgment required'
                    : 'No acknowledgment needed'}
                </Badge>
              </div>

              <SectionLabel>Record</SectionLabel>
              <Row label='Reference'>{agreement.id.toUpperCase()}</Row>
              <Row label='Employee'>
                {agreement.employeeName} ({agreement.employeeId})
              </Row>
              <Row label='Template (Templates & Letters)'>
                {agreement.templateName}
              </Row>
              <Row label='Signing authority'>{agreement.signingAuthority}</Row>
              <Row label='Executed on'>{fmtDate(agreement.executedOn)}</Row>
              <Row label='Created'>
                {fmtDate(agreement.createdOn)} by {agreement.createdBy}
              </Row>
              <Row label='Stored file'>{agreement.documentRef.fileName}</Row>
              <Row label='Storage'>{agreement.documentRef.storedIn}</Row>
              {agreement.renewalOf && (
                <Row label='Renewal of'>{agreement.renewalOf.toUpperCase()}</Row>
              )}
              {agreement.renewedAs && (
                <Row label='Renewed as'>{agreement.renewedAs.toUpperCase()}</Row>
              )}

              <Separator className='my-3' />
              <SectionLabel>Validity</SectionLabel>
              <Row label='Valid from'>{fmtDate(agreement.validFrom)}</Row>
              <Row label='Valid until'>
                {agreement.validUntil ? fmtDate(agreement.validUntil) : 'No expiry'}
              </Row>
              <Row label='Expiry rule'>{agreement.expiryRule}</Row>
              <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                {agreement.validUntil
                  ? status === 'Expired'
                    ? 'This agreement is past its valid-until date. Renew it to create a successor record with fresh validity.'
                    : status === 'Expiring soon'
                      ? 'This agreement is inside its notice window — expiry reminders have been raised via Notifications.'
                      : 'The agreement is within its validity period.'
                  : 'This agreement has no fixed end date, so no expiry reminders are scheduled.'}
              </p>

              <Separator className='my-3' />
              <SectionLabel>Expiry notifications ({timeline.length})</SectionLabel>
              {timeline.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No expiry notifications — this agreement has no expiry date or
                  is not being tracked for expiry.
                </p>
              ) : (
                <div className='space-y-2'>
                  {timeline.map((n) => (
                    <div
                      key={n.id}
                      className='rounded-[6px] border border-gray-200 bg-white p-3 text-sm'
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <p className='font-medium'>{n.label}</p>
                        <Badge
                          variant={n.state === 'Sent' ? 'completed' : 'pending'}
                        >
                          {n.state}
                        </Badge>
                      </div>
                      <p className='text-neutral-1000 pt-1 text-xs'>
                        {n.channel} · {fmtDate(n.scheduledFor)}
                      </p>
                      <p className='pt-1'>{n.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator className='my-3' />
              <SectionLabel>Acknowledgment</SectionLabel>
              {agreement.acknowledgment.required ? (
                agreement.acknowledgment.acknowledgedOn ? (
                  <p className='text-paragraph-sm text-neutral-1600'>
                    Acknowledged by {agreement.employeeName} on{' '}
                    {fmtDate(agreement.acknowledgment.acknowledgedOn)}
                    {agreement.acknowledgment.note &&
                      ` — ${agreement.acknowledgment.note}`}
                  </p>
                ) : (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Awaiting the employee's acknowledgment — the agreement is
                    available in their portal.
                  </p>
                )
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  This agreement does not require an employee acknowledgment.
                </p>
              )}

              <Separator className='my-3' />
              <SectionLabel>Agreement preview</SectionLabel>
              <div className='max-h-72 overflow-y-auto rounded-[6px] border border-gray-200 bg-white p-3 text-sm whitespace-pre-wrap'>
                {agreement.renderedBody}
              </div>

              <Separator className='my-3' />
              <SectionLabel>History ({agreement.history.length})</SectionLabel>
              <div className='space-y-2'>
                {agreement.history.map((entry, index) => (
                  <div key={index} className='text-sm'>
                    <p className='font-medium'>
                      {entry.action}{' '}
                      <span className='text-neutral-1000 font-normal'>
                        — {fmtDate(entry.on)} · {entry.actor}
                      </span>
                    </p>
                    <p className='text-neutral-1000 text-xs'>{entry.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='border-gray-200 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3'>
              <Button
                variant='outline'
                className='h-8 gap-1.5'
                onClick={() => downloadLetterPdf(pdfInputOf(agreement))}
              >
                <DownloadSimple size={14} weight='bold' />
                Download PDF
              </Button>
              <Button
                variant='outline'
                className='h-8 gap-1.5'
                onClick={() => printLetter(pdfInputOf(agreement))}
              >
                <Printer size={14} weight='bold' />
                Print
              </Button>
              {canAcknowledge && (
                <Button
                  className='h-8'
                  onClick={() => setConfirmAcknowledge(true)}
                >
                  Acknowledge
                </Button>
              )}
              {canRenew && (
                <Button className='h-8' onClick={() => setConfirmRenew(true)}>
                  Renew
                </Button>
              )}
              {canTerminate && (
                <Button
                  variant='destructive'
                  className='h-8'
                  onClick={() => setConfirmTerminate(true)}
                >
                  Terminate
                </Button>
              )}
            </div>
          </>
        )}

        <ConfirmDialog
          open={confirmAcknowledge}
          onOpenChange={setConfirmAcknowledge}
          title='Acknowledge this agreement?'
          desc={
            agreement
              ? `You confirm that you have read and accept the ${agreement.type} (${agreement.id.toUpperCase()}). Your acknowledgment is recorded with today's date and HR is notified.`
              : ''
          }
          confirmText='Acknowledge'
          handleConfirm={() => {
            if (agreement) store.acknowledgeAgreement(agreement.id)
            setConfirmAcknowledge(false)
          }}
        />

        <ConfirmDialog
          open={confirmRenew}
          onOpenChange={setConfirmRenew}
          title='Renew this agreement?'
          desc={
            agreement
              ? `A successor ${agreement.type} for ${agreement.employeeName} will be created, linked to ${agreement.id.toUpperCase()}, with validity starting today${agreement.validUntil ? ' for 12 months' : ''}${agreement.acknowledgment.required ? ' and a fresh acknowledgment cycle' : ''}.`
              : ''
          }
          confirmText='Renew'
          handleConfirm={() => {
            if (agreement) store.renewAgreement(agreement.id)
            setConfirmRenew(false)
            onOpenChange(false)
          }}
        />

        <ConfirmDialog
          open={confirmTerminate}
          onOpenChange={setConfirmTerminate}
          destructive
          title='Terminate this agreement?'
          desc={
            agreement
              ? `The ${agreement.type} for ${agreement.employeeName} will be marked Terminated. The record stays available for its retention period.`
              : ''
          }
          confirmText='Terminate'
          handleConfirm={() => {
            if (agreement)
              store.terminateAgreement(
                agreement.id,
                'Terminated early by the company'
              )
            setConfirmTerminate(false)
          }}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
