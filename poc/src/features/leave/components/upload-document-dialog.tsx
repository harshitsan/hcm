import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { type LeaveDocumentStatus } from '../data/leave-documents'
import { type LeaveDocumentsStore } from '../hooks/use-leave-documents'

const MODES: { value: LeaveDocumentStatus; label: string; hint: string }[] = [
  {
    value: 'submitted',
    label: 'Submit now',
    hint: 'Upload the supporting document against this request.',
  },
  {
    value: 'submit-later',
    label: 'Submit later',
    hint: 'Pick the date you will submit by — reminders are sent before it.',
  },
  {
    value: 'physical-copy',
    label: 'I have a physical copy',
    hint: 'Hand the original to your HR partner; note the details here.',
  },
  {
    value: 'not-needed',
    label: 'Document not needed',
    hint: 'Explain why no document applies to this time off.',
  },
]

interface UploadDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  leaveType: string
  store: LeaveDocumentsStore
}

/**
 * Post-submission document dialog (PTO #29–#31): the four Kensium modes —
 * submit now, submit later (dated), physical copy, or not needed.
 */
export function UploadDocumentDialog({
  open,
  onOpenChange,
  requestId,
  leaveType,
  store,
}: UploadDocumentDialogProps) {
  const [status, setStatus] = useState<LeaveDocumentStatus>('submitted')
  const [fileName, setFileName] = useState('')
  const [submitLaterDate, setSubmitLaterDate] = useState('')
  const [note, setNote] = useState('')

  // Pre-fill from the existing submission (upsert replaces it on save).
  useEffect(() => {
    if (!open) return
    const existing = store.submissionsFor(requestId)[0]
    setStatus(existing?.status ?? 'submitted')
    setFileName(existing?.fileName ?? '')
    setSubmitLaterDate(existing?.submitLaterDate ?? '')
    setNote(existing?.note ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId])

  const save = () => {
    if (status === 'submitted' && !fileName.trim()) {
      toast.error('Enter the file name of the document to upload')
      return
    }
    if (status === 'submit-later' && !submitLaterDate) {
      toast.error('Pick the date you will submit the document by')
      return
    }
    if (status === 'not-needed' && !note.trim()) {
      toast.error('Add a comment explaining why no document is needed')
      return
    }
    store.upsert({
      requestId,
      leaveType,
      status,
      fileName: status === 'submitted' ? fileName.trim() : undefined,
      submitLaterDate: status === 'submit-later' ? submitLaterDate : undefined,
      note: status !== 'submitted' ? note.trim() || undefined : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Submit document</DialogTitle>
          <DialogDescription>
            {leaveType} requires supporting documents — choose how you want to
            provide them for this request.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={status}
          onValueChange={(v) => setStatus(v as LeaveDocumentStatus)}
          className='gap-2'
        >
          {MODES.map((m) => (
            <div key={m.value} className='rounded-[6px] border border-gray-200 p-3'>
              <label className='flex items-center gap-2 text-sm font-medium'>
                <RadioGroupItem value={m.value} />
                {m.label}
              </label>
              <p className='text-neutral-1000 mt-1 pl-6 text-xs'>{m.hint}</p>
              {status === m.value && (
                <div className='mt-2 pl-6'>
                  {m.value === 'submitted' && (
                    <Input
                      placeholder='e.g. medical-certificate.pdf'
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  )}
                  {m.value === 'submit-later' && (
                    <Input
                      type='date'
                      value={submitLaterDate}
                      onChange={(e) => setSubmitLaterDate(e.target.value)}
                    />
                  )}
                  {m.value === 'physical-copy' && (
                    <Input
                      placeholder='e.g. handing the original to HR on Monday'
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  )}
                  {m.value === 'not-needed' && (
                    <Textarea
                      placeholder='Why is no document needed?'
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
