import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { downloadLetterPdf } from '@/features/hr-letters/data/letter-pdf'
import { EMPLOYEES, ME_USER_ID } from '@/features/hr-letters/data/hr-letters'
import { effectiveStatusOf, signatoryFor } from '../data/agreements'
import { useAgreements } from '../hooks/use-agreements'
import { AgreementDetailSheet } from './agreement-detail-sheet'
import { AgreementStatusBadge } from './agreement-badges'
import { type AgreementRow } from './agreements-table-columns'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtDate = (iso: string | undefined) =>
  iso ? dateFmt.format(new Date(`${iso}T00:00:00`)) : '—'

/**
 * Employee self-service view (O10 + W11): only the signed-in employee's own
 * agreements, with an Acknowledge action for anything awaiting their
 * acceptance, PDF download via the Template Engine helpers, and the same
 * detail drill-down the admin grid uses.
 */
export function MyAgreementsTab() {
  const me = EMPLOYEES.find((e) => e.id === ME_USER_ID)
  const store = useAgreements({ actor: me?.name ?? 'Employee' })
  const [detailId, setDetailId] = useState<string | null>(null)
  const [acknowledgeId, setAcknowledgeId] = useState<string | null>(null)

  const mine = useMemo<AgreementRow[]>(
    () =>
      store.agreements
        .filter((a) => a.employeeId === ME_USER_ID)
        .map((a) => ({ ...a, effectiveStatus: effectiveStatusOf(a) })),
    [store.agreements]
  )

  const pending = mine.filter(
    (a) => a.effectiveStatus === 'Sent for acknowledgment'
  )
  const detail = detailId ? (mine.find((a) => a.id === detailId) ?? null) : null
  const acknowledging = acknowledgeId
    ? (mine.find((a) => a.id === acknowledgeId) ?? null)
    : null

  return (
    <div className='w-full'>
      {pending.length > 0 && (
        <Card className='border-orange-1200/30 bg-white mb-4 w-full gap-2 border py-3'>
          <CardContent className='px-4'>
            <p className='text-paragraph-md text-neutral-1600 font-semibold'>
              Awaiting your acknowledgment ({pending.length})
            </p>
            <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
              These agreements stay "Sent for acknowledgment" until you accept
              them. Open one to read the full text before acknowledging.
            </p>
            <div className='mt-3 space-y-2'>
              {pending.map((a) => (
                <div
                  key={a.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div>
                    <p className='text-sm font-medium'>{a.type}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {a.id.toUpperCase()} · valid from {fmtDate(a.validFrom)}
                      {a.validUntil && ` until ${fmtDate(a.validUntil)}`}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-7'
                      onClick={() => setDetailId(a.id)}
                    >
                      Read
                    </Button>
                    <Button
                      className='h-7'
                      onClick={() => setAcknowledgeId(a.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          My agreements ({mine.length})
        </h2>
      </div>

      {mine.length === 0 ? (
        <p className='text-paragraph-sm text-neutral-1000'>
          No agreements are on record for you.
        </p>
      ) : (
        <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
          {mine.map((a) => (
            <button
              key={a.id}
              type='button'
              onClick={() => setDetailId(a.id)}
              className='rounded-[6px] border border-gray-200 bg-white p-4 text-left hover:border-gray-300'
            >
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='text-neutral-1600 font-medium'>{a.type}</p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {a.id.toUpperCase()} · {a.templateName}
                  </p>
                </div>
                <AgreementStatusBadge status={a.effectiveStatus} />
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                <Badge variant='pending'>
                  {a.validUntil
                    ? `Valid until ${fmtDate(a.validUntil)}`
                    : 'No expiry'}
                </Badge>
                <Badge variant='open'>{a.expiryRule}</Badge>
              </div>
              <div className='mt-3 flex items-center justify-between'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {a.acknowledgment.required
                    ? a.acknowledgment.acknowledgedOn
                      ? `Acknowledged ${fmtDate(a.acknowledgment.acknowledgedOn)}`
                      : 'Awaiting your acknowledgment'
                    : 'No acknowledgment needed'}
                </span>
                <Button
                  variant='outline'
                  className='h-7 gap-1.5'
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadLetterPdf({
                      refId: a.id,
                      docType: a.type,
                      employeeName: a.employeeName,
                      dateIso: a.executedOn,
                      body: a.renderedBody,
                      letterhead: true,
                      signedBy:
                        a.status === 'Draft'
                          ? null
                          : signatoryFor(a.signingAuthority),
                      signingAuthority: a.signingAuthority,
                    })
                  }}
                >
                  <DownloadSimple size={14} weight='bold' />
                  PDF
                </Button>
              </div>
            </button>
          ))}
        </div>
      )}

      <AgreementDetailSheet
        agreement={detail}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        mode='employee'
        store={store}
      />

      <ConfirmDialog
        open={acknowledging !== null}
        onOpenChange={(open) => {
          if (!open) setAcknowledgeId(null)
        }}
        title='Acknowledge this agreement?'
        desc={
          acknowledging
            ? `You confirm that you have read and accept the ${acknowledging.type} (${acknowledging.id.toUpperCase()}). Your acknowledgment is recorded with today's date and HR is notified.`
            : ''
        }
        confirmText='Acknowledge'
        handleConfirm={() => {
          if (acknowledging) store.acknowledgeAgreement(acknowledging.id)
          setAcknowledgeId(null)
        }}
      />
    </div>
  )
}
