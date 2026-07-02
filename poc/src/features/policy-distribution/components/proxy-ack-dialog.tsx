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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type Assignment } from '../data/distributions'

interface ProxyAckDialogProps {
  assignment: Assignment | null
  onOpenChange: (open: boolean) => void
  onConfirm: (assignmentId: string, evidence: string) => void
}

/**
 * Company Admin records acknowledgment on behalf of a non-user employee.
 * The confirming actor, date and evidence land in the audit trail so
 * reporting treats proxy acknowledgments like self-service ones.
 */
export function ProxyAckDialog({
  assignment,
  onOpenChange,
  onConfirm,
}: ProxyAckDialogProps) {
  const [evidence, setEvidence] = useState('')

  const handleConfirm = () => {
    if (!assignment || evidence.trim().length < 5) return
    onConfirm(assignment.id, evidence.trim())
    setEvidence('')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={Boolean(assignment)}
      onOpenChange={(open) => {
        if (!open) setEvidence('')
        onOpenChange(open)
      }}
    >
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Record proxy acknowledgment</DialogTitle>
          <DialogDescription>
            {assignment
              ? `${assignment.employeeName} has no portal access. Confirm they reviewed “${assignment.policyTitle}” (${assignment.policyVersion}) offline. Your name, the date and the evidence below are captured in the 7-year audit trail.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-1.5'>
          <Label htmlFor='proxy-evidence' className='text-sm font-medium'>
            Evidence of offline review
          </Label>
          <Textarea
            id='proxy-evidence'
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder='e.g. Signed paper acknowledgment filed at the plant HR desk'
            rows={3}
          />
          {evidence.trim().length > 0 && evidence.trim().length < 5 && (
            <p className='text-destructive text-paragraph-sm'>
              Describe the evidence (at least 5 characters).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={evidence.trim().length < 5}>
            Record acknowledgment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
