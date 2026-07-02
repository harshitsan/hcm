import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type NotificationTemplate } from '../data/config'
import { type Assignment } from '../data/distributions'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Merges assignment fields into the governed receipt template. */
function renderReceipt(
  assignment: Assignment,
  template: NotificationTemplate | undefined
): string {
  const ackDate = assignment.acknowledgedAt
    ? dateFmt.format(new Date(assignment.acknowledgedAt))
    : '—'
  const body =
    template?.body ??
    'This receipt confirms that {{employeeName}} acknowledged “{{policyTitle}}” on {{dueDate}}.'
  return body
    .replaceAll('{{employeeName}}', assignment.employeeName)
    .replaceAll('{{policyTitle}}', `${assignment.policyTitle} (${assignment.policyVersion})`)
    .replaceAll('{{dueDate}}', ackDate)
    .replaceAll('{{inboxLink}}', 'satellitehr.app/policy-distribution')
}

interface ReceiptDialogProps {
  assignment: Assignment | null
  receiptTemplate: NotificationTemplate | undefined
  onOpenChange: (open: boolean) => void
}

/**
 * Acknowledgment receipt — rendered from the governed, versioned receipt
 * template (not hard-coded text) and downloadable as compliance proof.
 */
export function ReceiptDialog({
  assignment,
  receiptTemplate,
  onOpenChange,
}: ReceiptDialogProps) {
  if (!assignment) return null
  const text = renderReceipt(assignment, receiptTemplate)

  const download = () => {
    const full = [
      `Receipt ID: ${assignment.receiptId ?? '—'}`,
      `Recorded by: ${assignment.acknowledgedBy ?? '—'}`,
      assignment.proxy ? `Proxy evidence: ${assignment.proxyEvidence ?? '—'}` : null,
      '',
      text,
    ]
      .filter((line): line is string => line !== null)
      .join('\n')
    const blob = new Blob([full], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${assignment.receiptId ?? 'receipt'}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Receipt downloaded')
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Acknowledgment receipt</DialogTitle>
          <DialogDescription>
            Receipt {assignment.receiptId ?? '—'} · retained for 7 years as
            audit evidence · template v{receiptTemplate?.version ?? 1}
          </DialogDescription>
        </DialogHeader>
        <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
          {text.split('\n\n').map((para, i) => (
            <p key={i} className='text-neutral-1600 mb-2 text-sm leading-6 last:mb-0'>
              {para}
            </p>
          ))}
          <p className='text-paragraph-sm text-neutral-1000 mt-3'>
            Confirmed by: {assignment.acknowledgedBy ?? '—'}
            {assignment.proxy && ' (proxy acknowledgment)'}
          </p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={download}>Download receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
