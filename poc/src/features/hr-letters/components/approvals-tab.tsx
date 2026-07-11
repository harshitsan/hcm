import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  EMPLOYEES,
  renderBody,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'

interface ApprovalsTabProps {
  store: HrDocumentsStore
  templates: LetterTemplate[]
}

/**
 * Approver queue (HLC-06/14): every document pending approval is listed with
 * its rendered content. Approving finalizes it per the workflow; rejecting
 * requires a reason, returns it to the originator, and blocks distribution.
 * Both outcomes land in the document's audit history.
 */
export function ApprovalsTab({ store, templates }: ApprovalsTabProps) {
  const [rejecting, setRejecting] = useState<HrDocument | null>(null)
  const [reason, setReason] = useState('')

  const pending = useMemo(
    () => store.documents.filter((d) => d.status === 'pending-approval'),
    [store.documents]
  )

  const contentFor = (doc: HrDocument) => {
    const template = templates.find((t) => t.id === doc.templateId)
    const employee = EMPLOYEES.find((e) => e.id === doc.employeeId)
    return template && employee
      ? renderBody(template.body, employee, template.missingValueBehavior)
      : 'Content rendered from the recorded template version.'
  }

  return (
    <div className='w-full'>
      <div className='mb-3'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Approval queue ({pending.length})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          Documents awaiting your review. Rejected documents are never
          distributed — the originator is notified to correct and regenerate.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className='rounded-[6px] border border-gray-200 bg-white p-6 text-center'>
          <p className='text-neutral-1000 text-sm'>
            Nothing awaits your approval right now.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {pending.map((doc) => (
            <div
              key={doc.id}
              className='rounded-[6px] border border-gray-200 bg-white p-4'
            >
              <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1600 font-medium'>
                    {doc.docType} — {doc.employeeName}
                  </span>
                  <Badge variant='overdue'>Pending approval</Badge>
                  <Badge variant='pending'>
                    Version {doc.versions.length} · template v{doc.templateVersion}
                  </Badge>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    onClick={() =>
                      store.approve(doc.id, 'Lakshmi Rao (Company Admin)')
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setRejecting(doc)
                      setReason('')
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
              <p className='text-neutral-1000 mb-2 text-xs'>
                Generated {doc.generatedOn} by {doc.generatedBy} ({doc.trigger} ·{' '}
                {doc.event}) · Signing authority: {doc.signingAuthority}
              </p>
              <pre className='text-neutral-1900 rounded bg-neutral-100 p-3 font-sans text-sm whitespace-pre-wrap'>
                {contentFor(doc)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document?</DialogTitle>
            <DialogDescription>
              {rejecting?.docType} for {rejecting?.employeeName} will be
              returned to the originator with your reason and will not be
              distributed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='Reason for rejection (required)'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              disabled={reason.trim().length < 5}
              onClick={() => {
                if (rejecting) {
                  store.reject(
                    rejecting.id,
                    'Lakshmi Rao (Company Admin)',
                    reason.trim()
                  )
                }
                setRejecting(null)
              }}
            >
              Reject &amp; notify originator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
