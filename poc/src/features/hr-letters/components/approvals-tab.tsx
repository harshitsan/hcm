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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  SIGNATORIES,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { resolveMergeFields } from '../data/merge-engine'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'

interface ApprovalsTabProps {
  store: HrDocumentsStore
  templates: LetterTemplate[]
}

/**
 * Approver queue (HLC-06/14): every letter pending approval is listed with
 * its rendered content. Approving records the chosen signatory (name + title)
 * on the letter — it appears in the signature block; rejecting requires a
 * reason, returns it to the originator, and blocks issue. Both outcomes land
 * in the letter's audit history.
 */
export function ApprovalsTab({ store, templates }: ApprovalsTabProps) {
  const [rejecting, setRejecting] = useState<HrDocument | null>(null)
  const [reason, setReason] = useState('')
  const [signatoryByDoc, setSignatoryByDoc] = useState<Record<string, string>>(
    {}
  )

  const pending = useMemo(
    () => store.documents.filter((d) => d.status === 'pending-approval'),
    [store.documents]
  )

  const contentFor = (doc: HrDocument) => {
    const template = templates.find((t) => t.id === doc.templateId)
    return template
      ? resolveMergeFields(template.body, doc.employeeId).rendered
      : 'Content rendered from the recorded template version.'
  }

  const signatoryFor = (docId: string) =>
    SIGNATORIES.find((s) => s.name === signatoryByDoc[docId]) ?? SIGNATORIES[0]

  return (
    <div className='w-full'>
      <div className='mb-3'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Approval queue ({pending.length})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          Letters awaiting your review. Pick who signs, then approve — the
          signatory appears on the letter. Rejected letters are never issued;
          the originator is notified to correct and regenerate.
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
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-neutral-1600 font-medium'>
                    {doc.docType} — {doc.employeeName}
                  </span>
                  <Badge variant='overdue'>Pending approval</Badge>
                  {doc.reissueOf && (
                    <Badge variant='overdue'>Reissue of {doc.reissueOf}</Badge>
                  )}
                  <Badge variant='pending'>
                    Version {doc.versions.length} · template v{doc.templateVersion}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Select
                    value={signatoryFor(doc.id).name}
                    onValueChange={(name) =>
                      setSignatoryByDoc((prev) => ({ ...prev, [doc.id]: name }))
                    }
                  >
                    <SelectTrigger variant='secondary' className='h-8 w-[230px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNATORIES.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name} — {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size='sm'
                    onClick={() =>
                      store.approve(
                        doc.id,
                        'Lakshmi Rao (Company Admin)',
                        signatoryFor(doc.id)
                      )
                    }
                  >
                    Approve &amp; sign
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
            <DialogTitle>Reject letter?</DialogTitle>
            <DialogDescription>
              {rejecting?.docType} for {rejecting?.employeeName} will be
              returned to the originator with your reason and will not be
              issued.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='e.g. Grade shown is out of date — correct and regenerate'
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
