import { useMemo, useState } from 'react'
import { DownloadSimple, Eye, PenNib } from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
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
import { Input } from '@/components/ui/input'
import {
  CHANNEL_LABELS,
  EMPLOYEES,
  ME_NON_USER_ID,
  ME_USER_ID,
  renderBody,
  type HrDocument,
  type LetterTemplate,
} from '../data/hr-letters'
import { type QuestionnaireQuestion } from '../data/catalogs'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'
import { AckBadge, DeliveryBadge, DocStatusBadge } from './status-badges'

interface MyDocumentsTabProps {
  store: HrDocumentsStore
  templates: LetterTemplate[]
  questions: QuestionnaireQuestion[]
}

/**
 * Employee self-service (HLC-12/13/29): Employee (User) sees only finalized
 * documents addressed to them with view/download and agreement
 * acknowledgment (with the certification questionnaire, HLC-30).
 * Employee (Non-User) gets a read-only delivery record — email/print only.
 */
export function MyDocumentsTab({ store, templates, questions }: MyDocumentsTabProps) {
  const { role } = useRole()
  const isNonUser = role === 'Employee (Non-User)'
  const meId = isNonUser ? ME_NON_USER_ID : ME_USER_ID
  const me = EMPLOYEES.find((e) => e.id === meId)

  const [viewing, setViewing] = useState<HrDocument | null>(null)
  const [acknowledging, setAcknowledging] = useState<HrDocument | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Drafts/pending/rejected documents are never visible to the employee.
  const myDocs = useMemo(
    () =>
      store.documents.filter(
        (d) =>
          d.employeeId === meId &&
          (d.status === 'approved' || d.status === 'distributed')
      ),
    [store.documents, meId]
  )

  const renderedContent = (doc: HrDocument) => {
    const template = templates.find((t) => t.id === doc.templateId)
    return template && me
      ? renderBody(template.body, me, template.missingValueBehavior)
      : 'Document content'
  }

  const isCertification = (doc: HrDocument) =>
    doc.docType === 'Certification Agreement Letter'

  const submitAcknowledgment = () => {
    if (!acknowledging || !me) return
    const answered = isCertification(acknowledging)
      ? questions.map((q) => ({
          question: q.text,
          answer: answers[q.id] ?? '',
        }))
      : []
    store.acknowledge(acknowledging.id, me.name, answered)
    setAcknowledging(null)
    setAnswers({})
  }

  const missingRequired =
    acknowledging && isCertification(acknowledging)
      ? questions.some((q) => q.required && !(answers[q.id] ?? '').trim())
      : false

  return (
    <div className='w-full'>
      <div className='mb-3'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          My HR letters &amp; certificates ({myDocs.length})
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          {isNonUser
            ? `Viewing as ${me?.name} (no application login). Your documents are delivered by email or printed copy — HR tracks each delivery below.`
            : `Signed in as ${me?.name}. Only finalized documents are shown; download any of them as PDF anytime.`}
        </p>
      </div>

      {isNonUser && (
        <div className='border-vanilla-400 bg-vanilla-400/20 mb-3 rounded-[6px] border p-3 text-sm'>
          This is the delivery record HR maintains for employees without app
          access. If an email fails, HR re-sends your document or hands you a
          printed copy.
        </div>
      )}

      {myDocs.length === 0 ? (
        <div className='rounded-[6px] border border-gray-200 bg-white p-6 text-center'>
          <p className='text-neutral-1000 text-sm'>No documents issued yet.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {myDocs.map((doc) => (
            <div
              key={doc.id}
              className='rounded-[6px] border border-gray-200 bg-white p-4'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-neutral-1600 font-medium'>
                    {doc.docType}
                  </span>
                  <DocStatusBadge status={doc.status} />
                  {doc.requiresAcknowledgment && (
                    <AckBadge acknowledgedOn={doc.acknowledgedOn} />
                  )}
                  <Badge variant='pending'>
                    v{doc.versions.length}
                    {doc.versions.length > 1 ? ' (reissued)' : ''}
                  </Badge>
                </div>
                {!isNonUser && (
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setViewing(doc)}
                    >
                      <Eye size={14} weight='bold' /> View
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        toast.success(`${doc.docType} downloaded as PDF`)
                      }
                    >
                      <DownloadSimple size={14} weight='bold' /> Download PDF
                    </Button>
                    {doc.requiresAcknowledgment && !doc.acknowledgedOn && (
                      <Button size='sm' onClick={() => setAcknowledging(doc)}>
                        <PenNib size={14} weight='bold' /> Acknowledge &amp; sign
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className='text-neutral-1000 mt-1 text-xs'>
                Issued {doc.generatedOn} · Signed by {doc.signingAuthority}
                {doc.acknowledgedOn ? ` · Acknowledged ${doc.acknowledgedOn}` : ''}
              </p>
              {doc.versions.length > 1 && (
                <p className='text-neutral-1000 mt-1 text-xs'>
                  Versions available to you:{' '}
                  {doc.versions
                    .map((ver) => `v${ver.version}${ver.current ? ' (current)' : ''}`)
                    .join(', ')}
                </p>
              )}
              {doc.distributions.length > 0 && (
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  {doc.distributions.map((dist) => (
                    <span key={dist.id} className='flex items-center gap-1 text-xs'>
                      <span className='text-neutral-1000'>
                        {CHANNEL_LABELS[dist.channel]} · {dist.sentOn}
                      </span>
                      <DeliveryBadge outcome={dist.outcome} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Read-only viewer (HLC-12) */}
      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.docType}</DialogTitle>
            <DialogDescription>
              Current version (v{viewing?.versions.length}) — PDF preview
            </DialogDescription>
          </DialogHeader>
          <pre className='text-neutral-1900 max-h-72 overflow-y-auto rounded bg-neutral-100 p-3 font-sans text-sm whitespace-pre-wrap'>
            {viewing ? renderedContent(viewing) : ''}
          </pre>
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acknowledgment flow (HLC-29/30) */}
      <Dialog
        open={Boolean(acknowledging)}
        onOpenChange={(open) => !open && setAcknowledging(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review &amp; acknowledge — {acknowledging?.docType}</DialogTitle>
            <DialogDescription>
              Read the full agreement before signing. Your acknowledgment is
              timestamped and recorded against the document.
            </DialogDescription>
          </DialogHeader>
          <pre className='text-neutral-1900 max-h-48 overflow-y-auto rounded bg-neutral-100 p-3 font-sans text-sm whitespace-pre-wrap'>
            {acknowledging ? renderedContent(acknowledging) : ''}
          </pre>
          {acknowledging && isCertification(acknowledging) && (
            <div className='space-y-2'>
              <p className='text-paragraph-sm font-medium'>
                Certification questionnaire
              </p>
              {questions.map((q) => (
                <div key={q.id}>
                  <p className='text-neutral-1000 mb-1 text-xs'>
                    {q.text}
                    {q.required ? ' *' : ''}
                  </p>
                  <Input
                    value={answers[q.id] ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder='Your answer'
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setAcknowledging(null)}>
              Not now
            </Button>
            <Button disabled={Boolean(missingRequired)} onClick={submitAcknowledgment}>
              I have read this — acknowledge &amp; sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
