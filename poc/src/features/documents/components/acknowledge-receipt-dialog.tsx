import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type DocumentReceipt } from '../data/receipts'

interface AcknowledgeReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: DocumentReceipt | null
  onSubmit: (comments: string) => void
}

/**
 * Employee acknowledgement of a returned document: confirms the physical /
 * digital copy was received back and records comments for the custodian.
 */
export function AcknowledgeReceiptDialog({
  open,
  onOpenChange,
  receipt,
  onSubmit,
}: AcknowledgeReceiptDialogProps) {
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setComments('')
    setError(null)
  }, [open])

  function handleConfirm() {
    if (comments.trim().length < 5) {
      setError('Add a short acknowledgement comment (min 5 characters)')
      return
    }
    onSubmit(comments.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Acknowledge return</DialogTitle>
          <DialogDescription>
            {receipt
              ? `Confirm you received ${receipt.documentName} back from the custodian (${receipt.returnDetails?.returnType.toLowerCase() ?? ''} return).`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-1.5'>
          <Label htmlFor='ack-comments'>Comments</Label>
          <Textarea
            id='ack-comments'
            rows={3}
            placeholder='e.g. Received the original in good condition'
            value={comments}
            onChange={(e) => {
              setComments(e.target.value)
              setError(null)
            }}
          />
          {error && (
            <p className='text-destructive text-sm font-medium'>{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type='button' onClick={handleConfirm}>
            Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
