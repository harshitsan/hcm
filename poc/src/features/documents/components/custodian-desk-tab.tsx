import { useMemo, useState } from 'react'
import { ArrowUUpLeft, BellRinging, Plus, Trash } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type DocumentType } from '../data/masters'
import {
  CUSTODIAN_TODAY,
  receiptReminders,
  type DocumentReceipt,
  type ReceiptStatus,
} from '../data/receipts'
import { type ReceiptsStore } from '../hooks/use-receipts'
import { RecordReceiptDialog } from './record-receipt-dialog'
import { ReturnReceiptDialog } from './return-receipt-dialog'
import { PhysicalCopyBadge, ReceiptStatusBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const fmtDate = (iso?: string) => (iso ? dateFmt.format(new Date(iso)) : '-')

const STATUS_FILTERS: { value: ReceiptStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All statuses' },
  { value: 'with-custodian', label: 'With custodian' },
  { value: 'returned-temporary', label: 'Returned (temporary)' },
  { value: 'returned-permanent', label: 'Returned (permanent)' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

interface CustodianDeskTabProps {
  receipts: ReceiptsStore
  documentTypes: DocumentType[]
}

/**
 * Custodian Desk — Receipts & Returns: register documents received from
 * employees (with expiry-notification rules and the physical-copy flag),
 * return them temporarily or permanently, and chase due returns/collections
 * via the reminders panel. Physical-copy receipts cannot be deleted.
 */
export function CustodianDeskTab({
  receipts,
  documentTypes,
}: CustodianDeskTabProps) {
  const [recordOpen, setRecordOpen] = useState(false)
  const [returning, setReturning] = useState<DocumentReceipt | null>(null)
  const [deleting, setDeleting] = useState<DocumentReceipt | null>(null)
  const [status, setStatus] = useState<ReceiptStatus | 'All'>('All')

  const rows = useMemo(
    () =>
      receipts.receipts.filter((r) => status === 'All' || r.status === status),
    [receipts.receipts, status]
  )

  const reminders = useMemo(
    () => receiptReminders(receipts.receipts, CUSTODIAN_TODAY),
    [receipts.receipts]
  )

  return (
    <div className='w-full'>
      <Card className='mb-4 gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <BellRinging size={16} weight='bold' />
            Reminders ({reminders.length})
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Returns due back to employees and temporary returns due back to
            custody, as of {fmtDate(CUSTODIAN_TODAY)}.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {reminders.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              Nothing to chase — no returns or collections are coming due.
            </p>
          ) : (
            reminders.map((reminder) => (
              <div
                key={`${reminder.receipt.id}-${reminder.kind}`}
                className='border-gray-200 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border px-3 py-2'
              >
                <div className='flex flex-col'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {reminder.receipt.documentName}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {reminder.receipt.employeeName} (
                    {reminder.receipt.employeeCode}) · due{' '}
                    {fmtDate(reminder.dueOn)}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant={
                      reminder.kind === 'return-to-employee' ? 'open' : 'open'
                    }
                  >
                    {reminder.kind === 'return-to-employee'
                      ? 'Return to employee'
                      : 'Collect from employee'}
                  </Badge>
                  {reminder.overdue && <Badge variant='dropped'>Overdue</Badge>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Document receipts ({rows.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Documents received into custody. Receipts holding a physical copy
            cannot be deleted until the original is returned.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ReceiptStatus | 'All')}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='red'
            onClick={() => setRecordOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Record Receipt
          </Button>
        </div>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Employee</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Copy</TableHead>
              <TableHead>Expected return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-neutral-1000 h-24 text-center'
                >
                  No receipts match the selected status.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {receipt.employeeName}
                      </span>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {receipt.employeeCode}
                      </span>
                    </div>
                  </TableCell>
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
                  <TableCell className='text-sm'>
                    {fmtDate(receipt.expiryDate)}
                  </TableCell>
                  <TableCell>
                    <PhysicalCopyBadge
                      hasPhysicalCopy={receipt.hasPhysicalCopy}
                    />
                  </TableCell>
                  <TableCell className='text-sm'>
                    {receipt.status === 'returned-temporary'
                      ? `Back by ${fmtDate(
                          receipt.returnDetails?.expectedDateOfSubmission
                        )}`
                      : fmtDate(receipt.expectedDateOfReturn)}
                  </TableCell>
                  <TableCell>
                    <ReceiptStatusBadge status={receipt.status} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end gap-2'>
                      {receipt.status === 'with-custodian' && (
                        <Button
                          variant='outline'
                          className='h-7 gap-1 rounded-[6px] px-2'
                          onClick={() => setReturning(receipt)}
                        >
                          <ArrowUUpLeft size={14} weight='bold' />
                          Return
                        </Button>
                      )}
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-7 w-7'
                        aria-label='Delete'
                        disabled={receipt.hasPhysicalCopy}
                        title={
                          receipt.hasPhysicalCopy
                            ? 'Physical-copy receipts cannot be deleted'
                            : 'Delete receipt'
                        }
                        onClick={() => setDeleting(receipt)}
                      >
                        <Trash size={16} weight='bold' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RecordReceiptDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        documentTypes={documentTypes}
        onSubmit={(draft) => receipts.addReceipt(draft)}
      />

      <ReturnReceiptDialog
        open={Boolean(returning)}
        onOpenChange={(open) => {
          if (!open) setReturning(null)
        }}
        receipt={returning}
        onSubmit={(details) => {
          if (returning) receipts.returnReceipt(returning.id, details)
          setReturning(null)
        }}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `The receipt for ${deleting.documentName} (${deleting.employeeName}) will be removed from the custodian register.`
                : ''}{' '}
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) receipts.deleteReceipt(deleting.id)
                setDeleting(null)
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
