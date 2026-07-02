import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EMPLOYEES,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'

/**
 * Issue an agreement letter to an employee (HLC-28): the generated document
 * is flagged as requiring acknowledgment and tracked as outstanding.
 */
export function IssueAgreementDialog({
  issuing,
  onOpenChange,
  onIssue,
}: {
  issuing: LetterTemplate | null
  onOpenChange: (open: boolean) => void
  onIssue: (employeeId: string) => void
}) {
  const [employeeId, setEmployeeId] = useState('')

  return (
    <Dialog
      open={Boolean(issuing)}
      onOpenChange={(open) => {
        if (!open) setEmployeeId('')
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue {issuing?.docType}</DialogTitle>
          <DialogDescription>
            The generated agreement is flagged as requiring
            acknowledgment/signature and tracked as outstanding until the
            employee responds.
          </DialogDescription>
        </DialogHeader>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select employee' />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEES.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} — {e.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!employeeId}
            onClick={() => {
              onIssue(employeeId)
              setEmployeeId('')
            }}
          >
            Issue agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Captured questionnaire responses on an acknowledged agreement (HLC-30). */
export function AgreementAnswersDialog({
  doc,
  onClose,
}: {
  doc: HrDocument | undefined
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(doc)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Questionnaire responses — {doc?.employeeName}</DialogTitle>
          <DialogDescription>
            Submitted with the {doc?.docType} on {doc?.acknowledgedOn}
          </DialogDescription>
        </DialogHeader>
        <ul className='space-y-2 text-sm'>
          {doc?.questionnaireAnswers.map((qa) => (
            <li key={qa.question}>
              <p className='text-neutral-1000'>{qa.question}</p>
              <p>{qa.answer || '—'}</p>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
