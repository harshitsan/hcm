import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type DocumentReceipt } from '../data/receipts'
import {
  type DocumentSettingsStore,
  type PermissionKind,
} from '../hooks/use-document-settings'
import { type DocumentRow } from './documents-table-columns'
import {
  ExpiryBadge,
  PhysicalCopyBadge,
  ReceiptStatusBadge,
} from './status-badges'

interface DocumentDetailSheetProps {
  document: DocumentRow | null
  onOpenChange: (open: boolean) => void
  settings: DocumentSettingsStore
  /** Custodian receipts — matched to this document for its custody history. */
  receipts: DocumentReceipt[]
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtDate = (iso: string | null | undefined) =>
  iso ? dateFmt.format(new Date(iso)) : '—'

const PERMISSION_LABELS: Record<PermissionKind, string> = {
  view: 'View',
  download: 'Download',
  upload: 'Upload',
}

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

/** Custodian receipts that concern this document (by file or by subject). */
function custodyFor(doc: DocumentRow, receipts: DocumentReceipt[]) {
  return receipts.filter(
    (r) =>
      r.uploadedFileName === doc.fileName ||
      (r.employeeName === doc.entityName && r.documentType === doc.documentType)
  )
}

/**
 * Row-click drill-down on the documents grid: full metadata provenance,
 * expiry tracking (DOC-07), the governed access matrix for the document's
 * category (DOC-09/18), and the custodian custody history where the physical
 * original has passed through the custodian desk.
 */
export function DocumentDetailSheet({
  document,
  onOpenChange,
  settings,
  receipts,
}: DocumentDetailSheetProps) {
  const perms = document ? settings.permsFor(document.category) : null
  const custody = document ? custodyFor(document, receipts) : []

  return (
    <Sheet open={document !== null} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {document?.name ?? 'Document'}
          </SheetTitle>
        </SheetHeader>

        {document && perms && (
          <div className='flex-1 overflow-y-auto px-5 py-4'>
            <div className='mb-3 flex flex-wrap items-center gap-1.5'>
              <ExpiryBadge status={document.expiryStatus} />
              <Badge variant='open'>{document.category}</Badge>
              <Badge variant='pending'>{document.entityType}</Badge>
            </div>

            <SectionLabel>Metadata</SectionLabel>
            <Row label='File'>{document.fileName}</Row>
            <Row label='Format · size'>
              {document.format} · {document.sizeKb} KB
            </Row>
            <Row label='Entity'>
              {document.entityName} ({document.entityType})
            </Row>
            <Row label='Company'>{document.company}</Row>
            <Row label='Document type'>{document.documentType}</Row>
            <Row label='Uploaded'>
              {fmtDate(document.uploadDate)} by {document.uploadedBy}
            </Row>

            <Separator className='my-3' />
            <SectionLabel>Expiry tracking</SectionLabel>
            <Row label='Expiry date'>{fmtDate(document.expiryDate)}</Row>
            <Row label='Status'>
              <ExpiryBadge status={document.expiryStatus} />
            </Row>
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              {document.expiryDate
                ? `The scheduler engine flags this document "Expiring soon" ${settings.leadTimeDays} days before its expiry date (governed lead time).`
                : 'This document has no expiry date, so no renewal alerts are scheduled.'}
            </p>

            <Separator className='my-3' />
            <SectionLabel>
              Access — “{document.category}” category (governed matrix)
            </SectionLabel>
            {(Object.keys(PERMISSION_LABELS) as PermissionKind[]).map(
              (kind) => (
                <Row key={kind} label={PERMISSION_LABELS[kind]}>
                  {perms[kind].length > 0 ? perms[kind].join(', ') : 'No roles'}
                </Row>
              )
            )}

            <Separator className='my-3' />
            <SectionLabel>Custody history ({custody.length})</SectionLabel>
            {custody.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No custodian receipts reference this document — the physical
                original has not passed through the custodian desk.
              </p>
            ) : (
              <div className='space-y-3'>
                {custody.map((receipt) => (
                  <div
                    key={receipt.id}
                    className='rounded-[6px] border border-gray-200 bg-white p-3 text-sm'
                  >
                    <p className='font-medium'>{receipt.documentName}</p>
                    <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                      <ReceiptStatusBadge status={receipt.status} />
                      <PhysicalCopyBadge
                        hasPhysicalCopy={receipt.hasPhysicalCopy}
                      />
                    </div>
                    <p className='text-neutral-1000 pt-1.5 text-xs'>
                      Issued {fmtDate(receipt.dateOfIssuance)} by{' '}
                      {receipt.issueAuthority}
                      {receipt.expectedDateOfReturn &&
                        ` · due back to employee ${fmtDate(receipt.expectedDateOfReturn)}`}
                    </p>
                    {receipt.custodianComments && (
                      <p className='pt-1'>
                        Custodian: {receipt.custodianComments}
                      </p>
                    )}
                    {receipt.returnDetails && (
                      <p className='pt-1'>
                        Returned ({receipt.returnDetails.returnType.toLowerCase()}
                        ) on {fmtDate(receipt.returnDetails.returnedOn)}
                        {receipt.returnDetails.expectedDateOfSubmission &&
                          ` — due back from employee ${fmtDate(receipt.returnDetails.expectedDateOfSubmission)}`}
                        {receipt.returnDetails.comments &&
                          `. ${receipt.returnDetails.comments}`}
                      </p>
                    )}
                    {receipt.acknowledgement && (
                      <p className='pt-1'>
                        Acknowledged by the employee on{' '}
                        {fmtDate(receipt.acknowledgement.acknowledgedOn)}:{' '}
                        {receipt.acknowledgement.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
