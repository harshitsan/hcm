import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SubmissionStatus } from '../data/candidate-documents'
import { Badge } from '@/components/ui/badge'
import type {
  CandidateDocumentsStore,
  RequiredDocInput,
} from '../hooks/use-candidate-documents'

interface UploadCandidateDocDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  candidateName: string
  requiredDocuments: RequiredDocInput[]
  store: CandidateDocumentsStore
}

/** The PDF's four fulfilment modes for a required candidate document. */
const MODES: { value: SubmissionStatus; label: string }[] = [
  { value: 'submitted', label: 'Submit now' },
  { value: 'submit-later', label: 'Submit later' },
  { value: 'physical-copy', label: 'Have physical copy' },
  { value: 'not-needed', label: 'Not needed' },
]

interface RowDraft {
  status: SubmissionStatus | ''
  fileName: string
  submitLaterDate: string
  note: string
  custodian: string
  touched: boolean
}

/**
 * Capture candidate document submissions against the stage-based required
 * checklist — one row per required document with the four fulfilment modes:
 * submit now, submit later, physical copy, not needed (Kensium PDF —
 * Hiring → Documents, TA-54).
 */
export function UploadCandidateDocDialog({
  open,
  onOpenChange,
  applicationId,
  candidateName,
  requiredDocuments,
  store,
}: UploadCandidateDocDialogProps) {
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})

  // Seed drafts from existing submissions each time the dialog opens.
  useEffect(() => {
    if (!open) return
    const next: Record<string, RowDraft> = {}
    requiredDocuments.forEach((doc) => {
      const sub = store
        .submissionsFor(applicationId)
        .find((s) => s.docName === doc.name)
      next[doc.id] = {
        status: sub?.status ?? '',
        fileName: sub?.fileName ?? '',
        submitLaterDate: sub?.submitLaterDate ?? '',
        note: sub?.note ?? '',
        custodian: sub?.custodian ?? '',
        touched: false,
      }
    })
    setDrafts(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const patch = (docId: string, fn: (d: RowDraft) => RowDraft) =>
    setDrafts((prev) => ({
      ...prev,
      [docId]: { ...fn(prev[docId]), touched: true },
    }))

  const save = () => {
    let saved = 0
    requiredDocuments.forEach((doc) => {
      const d = drafts[doc.id]
      if (!d?.touched || !d.status) return
      store.upsert({
        applicationId,
        candidateName,
        docName: doc.name,
        docType: doc.docType,
        requiredAtStage: doc.requiredAtStage,
        status: d.status,
        fileName: d.status === 'submitted' ? d.fileName || undefined : undefined,
        submitLaterDate:
          d.status === 'submit-later' ? d.submitLaterDate || undefined : undefined,
        note:
          d.status === 'physical-copy' || d.status === 'not-needed'
            ? d.note || undefined
            : undefined,
        custodian:
          d.status === 'physical-copy' ? d.custodian || undefined : undefined,
        submittedOn:
          d.status === 'submitted' || d.status === 'physical-copy'
            ? '2026-07-09'
            : undefined,
      })
      saved += 1
    })
    if (saved > 0)
      toast.success(
        `${saved} document ${saved === 1 ? 'submission' : 'submissions'} saved for ${candidateName}`
      )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Candidate documents — {candidateName}</DialogTitle>
        </DialogHeader>

        <div className='max-h-[60vh] space-y-3 overflow-y-auto'>
          {requiredDocuments.map((doc) => {
            const d = drafts[doc.id]
            if (!d) return null
            return (
              <div
                key={doc.id}
                className='rounded-[8px] border border-gray-200 bg-white p-3'
              >
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm font-medium'>{doc.name}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {doc.docType} · required at {doc.requiredAtStage} stage
                    </p>
                  </div>
                  <Badge
                    variant={
                      d.status === 'submitted' || d.status === 'physical-copy'
                        ? 'completed'
                        : d.status === 'not-needed'
                          ? 'badge_inactive'
                          : d.status === 'submit-later'
                            ? 'overdue'
                            : 'pending'
                    }
                  >
                    {MODES.find((m) => m.value === d.status)?.label ??
                      'Pending'}
                  </Badge>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <Select
                    value={d.status || undefined}
                    onValueChange={(v) =>
                      patch(doc.id, (r) => ({
                        ...r,
                        status: v as SubmissionStatus,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Choose fulfilment mode' />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {d.status === 'submitted' && (
                    <Input
                      placeholder='File name (e.g. pan-card.pdf)'
                      value={d.fileName}
                      onChange={(e) =>
                        patch(doc.id, (r) => ({ ...r, fileName: e.target.value }))
                      }
                    />
                  )}
                  {d.status === 'submit-later' && (
                    <Input
                      type='date'
                      value={d.submitLaterDate}
                      onChange={(e) =>
                        patch(doc.id, (r) => ({
                          ...r,
                          submitLaterDate: e.target.value,
                        }))
                      }
                    />
                  )}
                  {d.status === 'physical-copy' && (
                    <>
                      <Input
                        placeholder='Custodian (who holds the copy)'
                        value={d.custodian}
                        onChange={(e) =>
                          patch(doc.id, (r) => ({
                            ...r,
                            custodian: e.target.value,
                          }))
                        }
                      />
                      <Input
                        className='col-span-2'
                        placeholder='Note (where the original was verified)'
                        value={d.note}
                        onChange={(e) =>
                          patch(doc.id, (r) => ({ ...r, note: e.target.value }))
                        }
                      />
                    </>
                  )}
                  {d.status === 'not-needed' && (
                    <Input
                      placeholder='Comments (why this is not needed)'
                      value={d.note}
                      onChange={(e) =>
                        patch(doc.id, (r) => ({ ...r, note: e.target.value }))
                      }
                    />
                  )}
                </div>
              </div>
            )
          })}
          {requiredDocuments.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000'>
              No documents are required for this candidate.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save submissions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
