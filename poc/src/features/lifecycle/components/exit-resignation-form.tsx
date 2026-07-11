import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { fmtDate } from '../data/shared'
import { type ExitCase } from '../data/exits'
import { type ResignationFormInput } from '../hooks/use-exits'

interface ExitResignationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exitCase: ExitCase
  onSubmit: (input: ResignationFormInput) => boolean
}

/**
 * Employee formal resignation form for an exit-enabled case — requested LWD
 * (modifiable), reason, HR-only message, supporting documents and the
 * position/exit-type questionnaire with mandatory questions enforced.
 * Submission moves the case to pending approval.
 */
export function ExitResignationForm({
  open,
  onOpenChange,
  exitCase: e,
  onSubmit,
}: ExitResignationFormProps) {
  const [requestedLwd, setRequestedLwd] = useState('')
  const [reason, setReason] = useState('')
  const [messageToHr, setMessageToHr] = useState('')
  const [docDraft, setDocDraft] = useState('')
  const [documents, setDocuments] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) return
    setRequestedLwd(e.requestedLwd ?? e.defaultLwd ?? e.lastWorkingDay)
    setReason(e.reason)
    setMessageToHr('')
    setDocDraft('')
    setDocuments([])
    setAnswers({})
    setComment('')
  }, [open, e])

  const employeeQuestions = e.questionnaire.filter(
    (q) => q.responder === 'Employee'
  )

  const submit = () => {
    if (!requestedLwd) {
      toast.error('Set your requested last working day')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('A reason is required')
      return
    }
    const ok = onSubmit({
      requestedLwd,
      reason: reason.trim(),
      messageToHr,
      documents,
      answers,
      comment,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Formal resignation · {e.employeeName}
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {e.exitType} · resignation date {fmtDate(e.resignationDate)} · LWD
            as per policy {fmtDate(e.policyLwd)}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
          <div className='space-y-1'>
            <Label className='text-xs'>Requested last working day (modifiable)</Label>
            <Input
              type='date'
              value={requestedLwd}
              onChange={(ev) => setRequestedLwd(ev.target.value)}
            />
            <p className='text-neutral-1000 text-xs'>
              Default per policy: {fmtDate(e.defaultLwd ?? e.lastWorkingDay)} —
              approvers may recommend a different LWD; the final approver's
              decision applies.
            </p>
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>Reason</Label>
            <Textarea
              placeholder='Why are you resigning?'
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
            />
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>Message to HR (visible to HR only)</Label>
            <Textarea
              placeholder='Anything you want HR to know — not shown to other participants'
              value={messageToHr}
              onChange={(ev) => setMessageToHr(ev.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs'>Supporting documents</Label>
            <div className='flex gap-2'>
              <Input
                placeholder='File name, e.g. resignation-letter.pdf'
                value={docDraft}
                onChange={(ev) => setDocDraft(ev.target.value)}
              />
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={!docDraft.trim()}
                onClick={() => {
                  setDocuments((prev) => [...prev, docDraft.trim()])
                  setDocDraft('')
                }}
              >
                Add
              </Button>
            </div>
            {documents.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {documents.map((d) => (
                  <Badge key={d} variant='outline'>
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {employeeQuestions.length > 0 && (
            <div className='space-y-2'>
              <p className='text-xs font-medium'>
                Exit questionnaire (position/exit-type specific)
              </p>
              {employeeQuestions.map((q) => (
                <div key={q.questionId} className='space-y-1'>
                  <p className='text-sm'>
                    {q.question}
                    {q.mandatory && <span className='text-destructive'> *</span>}
                  </p>
                  <Input
                    placeholder='Your answer'
                    value={answers[q.questionId] ?? q.answer ?? ''}
                    onChange={(ev) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.questionId]: ev.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className='space-y-1'>
            <Label className='text-xs'>Comments (visible to everyone)</Label>
            <Textarea
              placeholder='Optional comment for the case'
              value={comment}
              onChange={(ev) => setComment(ev.target.value)}
            />
          </div>
        </div>

        <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={submit}>
            Submit resignation
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
