import { useMemo, useState } from 'react'
import { CheckCircle, DownloadSimple, LockSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { expiryStatusOf } from '../data/documents'
import { type DocumentType } from '../data/masters'
import { CURRENT_EMPLOYEE } from '../data/org'
import { type DocumentReceipt } from '../data/receipts'
import { type DocumentsStore } from '../hooks/use-documents'
import { type DocumentSettingsStore } from '../hooks/use-document-settings'
import { type ReceiptsStore } from '../hooks/use-receipts'
import { AcknowledgeReceiptDialog } from './acknowledge-receipt-dialog'
import {
  ExpiryBadge,
  PhysicalCopyBadge,
  ReceiptStatusBadge,
} from './status-badges'
import { UploadOverlay } from './upload-overlay'

interface MyDocumentsTabProps {
  store: DocumentsStore
  settings: DocumentSettingsStore
  documentTypes: DocumentType[]
  receipts: ReceiptsStore
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const fmtDate = (iso: string | null) =>
  iso ? dateFmt.format(new Date(iso)) : '-'

/**
 * Employee self-service (DOC-11/12): documents on the signed-in employee's
 * own record, filtered by the role-based access matrix — restricted
 * categories are neither listed nor downloadable. Self-upload appears only
 * when at least one category grants the Employee (User) role upload rights.
 */
export function MyDocumentsTab({
  store,
  settings,
  documentTypes,
  receipts,
}: MyDocumentsTabProps) {
  const { role } = useRole()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [acknowledging, setAcknowledging] = useState<DocumentReceipt | null>(
    null
  )

  const ownReceipts = useMemo(
    () =>
      receipts.receipts.filter(
        (r) => r.employeeName === CURRENT_EMPLOYEE.name
      ),
    [receipts.receipts]
  )

  const ownDocuments = useMemo(
    () =>
      store.documents.filter(
        (d) =>
          d.entityType === 'Employee' &&
          d.entityName === CURRENT_EMPLOYEE.name &&
          d.company === CURRENT_EMPLOYEE.company
      ),
    [store.documents]
  )

  const visibleDocuments = useMemo(
    () => ownDocuments.filter((d) => settings.canView(role, d.category)),
    [ownDocuments, settings, role]
  )

  const hiddenCount = ownDocuments.length - visibleDocuments.length

  const selfUploadAllowed = settings.activeCategories.some((c) =>
    settings.canUpload(role, c)
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My documents ({visibleDocuments.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Files attached to your employee record at{' '}
            {CURRENT_EMPLOYEE.company}, limited to categories your role may
            view.
          </p>
        </div>
        {selfUploadAllowed && (
          <Button
            variant='red'
            onClick={() => setOverlayOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Upload Document
          </Button>
        )}
      </div>

      {hiddenCount > 0 && (
        <div className='border-grey-200 mb-3 flex items-center gap-2 rounded-[6px] border bg-white px-3 py-2'>
          <LockSimple size={16} className='text-neutral-1000' />
          <p className='text-paragraph-sm text-neutral-1000'>
            {hiddenCount} {hiddenCount === 1 ? 'document' : 'documents'} on
            your record {hiddenCount === 1 ? 'is' : 'are'} restricted by
            role-based access and not shown.
          </p>
        </div>
      )}

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className='text-right'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDocuments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-neutral-1000 h-24 text-center'
                >
                  No documents are visible on your record.
                </TableCell>
              </TableRow>
            ) : (
              visibleDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {doc.name}
                      </span>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {doc.fileName} · {doc.sizeKb} KB
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>{doc.category}</TableCell>
                  <TableCell className='text-sm'>
                    {fmtDate(doc.uploadDate)}
                  </TableCell>
                  <TableCell className='text-sm'>{doc.uploadedBy}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm'>{fmtDate(doc.expiryDate)}</span>
                      <ExpiryBadge
                        status={expiryStatusOf(
                          doc.expiryDate,
                          settings.leadTimeDays
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    {settings.canDownload(role, doc.category) ? (
                      <Button
                        variant='outline'
                        className='h-7 gap-1 rounded-[6px] px-2'
                        onClick={() =>
                          toast.success(`Downloading ${doc.fileName}`)
                        }
                      >
                        <DownloadSimple size={14} weight='bold' />
                        Download
                      </Button>
                    ) : (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        View only
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='mt-6 mb-3'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Submitted to custodian ({ownReceipts.length})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          Documents you handed over to the document custodian. Acknowledge a
          returned document once you receive it back.
        </p>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Document</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Copy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Returned on</TableHead>
              <TableHead className='text-right'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownReceipts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-neutral-1000 h-24 text-center'
                >
                  You have no documents with the custodian.
                </TableCell>
              </TableRow>
            ) : (
              ownReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {receipt.documentName}
                      </span>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {receipt.documentType} · {receipt.issueAuthority}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {fmtDate(receipt.dateOfIssuance)}
                  </TableCell>
                  <TableCell>
                    <PhysicalCopyBadge
                      hasPhysicalCopy={receipt.hasPhysicalCopy}
                    />
                  </TableCell>
                  <TableCell>
                    <ReceiptStatusBadge status={receipt.status} />
                  </TableCell>
                  <TableCell className='text-sm'>
                    <div className='flex flex-col'>
                      <span>
                        {fmtDate(receipt.returnDetails?.returnedOn ?? null)}
                      </span>
                      {receipt.status === 'returned-temporary' &&
                        receipt.returnDetails?.expectedDateOfSubmission && (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            Submit back by{' '}
                            {fmtDate(
                              receipt.returnDetails.expectedDateOfSubmission
                            )}
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    {receipt.status === 'returned-temporary' ||
                    receipt.status === 'returned-permanent' ? (
                      <Button
                        variant='outline'
                        className='h-7 gap-1 rounded-[6px] px-2'
                        onClick={() => setAcknowledging(receipt)}
                      >
                        <CheckCircle size={14} weight='bold' />
                        Acknowledge
                      </Button>
                    ) : receipt.status === 'acknowledged' ? (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        Acknowledged{' '}
                        {fmtDate(
                          receipt.acknowledgement?.acknowledgedOn ?? null
                        )}
                      </span>
                    ) : (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        With custodian
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AcknowledgeReceiptDialog
        open={Boolean(acknowledging)}
        onOpenChange={(open) => {
          if (!open) setAcknowledging(null)
        }}
        receipt={acknowledging}
        onSubmit={(comments) => {
          if (acknowledging)
            receipts.acknowledgeReceipt(acknowledging.id, comments)
          setAcknowledging(null)
        }}
      />

      <UploadOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        settings={settings}
        documentTypes={documentTypes}
        companies={[CURRENT_EMPLOYEE.company]}
        mode='self'
        onSubmit={(draft) => {
          store.addDocument(draft, CURRENT_EMPLOYEE.name)
          toast.success(
            `${draft.name} uploaded to your record (uploaded by: ${CURRENT_EMPLOYEE.name})`
          )
        }}
      />
    </div>
  )
}
