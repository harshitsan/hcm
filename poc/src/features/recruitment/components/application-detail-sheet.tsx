import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import {
  PIPELINE_STAGES,
  type Application,
  type PipelineStage,
  type ReferenceCheck,
} from '../data/candidates'
import type { ChecklistQuestion } from '../data/config'
import {
  seedReferenceQuestions,
  type ReferenceQuestion,
} from '../data/reference-questions'
import type { CandidatesStore } from '../hooks/use-candidates'
import { StatusBadge } from './badges'

interface ApplicationDetailSheetProps {
  application: Application | null
  onOpenChange: (open: boolean) => void
  store: CandidatesStore
  checklistQuestions: ChecklistQuestion[]
  /** Configured reference-check questionnaire; falls back to the seed set. */
  referenceQuestions?: ReferenceQuestion[]
  /** Opens the offer-generation dialog (Company Admin) or records the HM recommendation. */
  onGenerateOffer: (app: Application) => void
}

/**
 * Per-candidate drill-down — stage actions with rules-engine gating,
 * side-by-side scorecards, questionnaire-driven reference checks, hiring
 * history, hold/resume and the pre-onboarding checklist (TA-06, TA-10,
 * TA-13, TA-17, TA-28, TA-45, TA-51).
 */
export function ApplicationDetailSheet({
  application: app,
  onOpenChange,
  store,
  checklistQuestions,
  referenceQuestions = seedReferenceQuestions,
  onGenerateOffer,
}: ApplicationDetailSheetProps) {
  const { hasRole } = useRole()
  const [rejectReason, setRejectReason] = useState('')
  const [resumeStage, setResumeStage] = useState<PipelineStage>('screening')
  const [refName, setRefName] = useState('')
  const [refRelation, setRefRelation] = useState('Direct manager')
  const [refOutcome, setRefOutcome] = useState<NonNullable<ReferenceCheck['outcome']>>('positive')
  const [refNotes, setRefNotes] = useState('')
  const [checklist, setChecklist] = useState<Record<string, string>>({})
  // Complete-reference-check dialog (Kensium Reference Check questionnaire)
  const [refDialog, setRefDialog] = useState<ReferenceCheck | null>(null)
  const [refEmail, setRefEmail] = useState('')
  const [refPhone, setRefPhone] = useState('')
  const [refDoc, setRefDoc] = useState('')
  /** Subjective / radio answers keyed by question id. */
  const [refAnswers, setRefAnswers] = useState<Record<string, string>>({})
  /** Checkbox multi-answers keyed by question id. */
  const [refChoices, setRefChoices] = useState<Record<string, string[]>>({})

  if (!app) return null

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isHiringManager = hasRole('Employee (User)')
  const activeStage = (
    app.status === 'on-hold' ? app.heldFromStage : app.status
  ) as PipelineStage
  const nextStage =
    PIPELINE_STAGES[PIPELINE_STAGES.indexOf(activeStage) + 1] as
      | PipelineStage
      | undefined
  const terminal = ['rejected', 'cancelled', 'hired'].includes(app.status)
  const pendingRefs = app.referenceChecks.filter((r) => r.status === 'pending')
  const criteriaNames = [
    ...new Set(app.scorecards.flatMap((s) => s.ratings.map((r) => r.criterion))),
  ]
  // Configured questionnaire — active questions applicable to this position.
  const activeQuestions = referenceQuestions
    .filter(
      (q) =>
        q.active &&
        (q.applicablePositions === 'all' ||
          q.applicablePositions.includes(app.requisitionTitle))
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
  // Hiring history — other applications by the same candidate across requisitions.
  const otherApplications = store.applications.filter(
    (a) => a.candidateId === app.candidateId && a.id !== app.id
  )

  const openRefDialog = (r: ReferenceCheck) => {
    setRefDialog(r)
    setRefEmail(r.contactEmail ?? '')
    setRefPhone(r.contactPhone ?? '')
    setRefDoc(r.uploadedDocument ?? '')
    setRefAnswers({})
    setRefChoices({})
    setRefNotes(r.notes ?? '')
    setRefOutcome(r.outcome ?? 'positive')
  }

  const saveReference = () => {
    if (!refDialog) return
    store.completeReferenceCheck(app.id, refDialog.id, refOutcome, refNotes, {
      contactEmail: refEmail || undefined,
      contactPhone: refPhone || undefined,
      uploadedDocument: refDoc || undefined,
      answers: activeQuestions.map((q) => ({
        questionId: q.id,
        question: q.question,
        answer:
          q.fieldType === 'Checkbox'
            ? (refChoices[q.id] ?? []).join(', ')
            : (refAnswers[q.id] ?? ''),
      })),
    })
    setRefDialog(null)
    setRefNotes('')
  }

  const saveChecklist = () => {
    const missing = checklistQuestions.filter(
      (q) => q.mandatory && !(checklist[q.id] ?? app.checklist[q.id])
    )
    if (missing.length > 0) {
      toast.error(
        `Mandatory checklist items pending: ${missing.map((m) => m.question).join('; ')}`
      )
      return
    }
    store.saveChecklist(app.id, { ...app.checklist, ...checklist })
  }

  return (
    <Sheet open={Boolean(app)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[620px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {app.candidateName} — {app.requisitionTitle}
          </SheetTitle>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={app.status} />
            {app.status === 'on-hold' && app.heldFromStage && (
              <span className='text-paragraph-sm text-neutral-1000'>
                held from {app.heldFromStage}
              </span>
            )}
            <span className='text-paragraph-sm text-blue-1400'>{app.resume}</span>
            <Button variant='outline' className='h-6 px-2 text-xs'>
              View / download resume
            </Button>
            {pendingRefs.length > 0 && (
              <Badge variant='overdue'>{pendingRefs.length} reference(s) pending</Badge>
            )}
          </div>
        </SheetHeader>

        <div className='space-y-5 px-5 py-4'>
          {/* Stage actions (TA-13, TA-17, TA-28, TA-45) */}
          {!terminal && (isAdmin || isHiringManager) && (
            <section className='rounded-[8px] border border-gray-200 p-3'>
              <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                Stage actions
              </h3>
              <div className='flex flex-wrap items-center gap-2'>
                {app.status !== 'on-hold' && nextStage && (
                  <Button
                    className='h-7 text-xs'
                    onClick={() => store.advanceStage(app.id, nextStage)}
                  >
                    {nextStage === 'offer'
                      ? 'Recommend for offer'
                      : `Advance to ${nextStage}`}
                  </Button>
                )}
                {app.status === 'offer' && isAdmin && (
                  <Button className='h-7 text-xs' onClick={() => onGenerateOffer(app)}>
                    Generate offer
                  </Button>
                )}
                {app.status !== 'on-hold' ? (
                  <Button
                    variant='outline'
                    className='h-7 text-xs'
                    onClick={() => store.holdApplication(app.id)}
                  >
                    Place on hold
                  </Button>
                ) : (
                  <div className='flex items-center gap-1'>
                    <Select
                      value={resumeStage}
                      onValueChange={(v) => setResumeStage(v as PipelineStage)}
                    >
                      <SelectTrigger className='h-7 w-[150px] text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.filter((s) => s !== 'hired').map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant='outline'
                      className='h-7 text-xs'
                      onClick={() => store.resumeApplication(app.id, resumeStage)}
                    >
                      Resume into stage
                    </Button>
                  </div>
                )}
              </div>
              <div className='mt-2 flex items-center gap-2'>
                <Input
                  placeholder='Rejection / cancellation reason'
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className='h-7 flex-1'
                />
                <Button
                  variant='outline'
                  className='h-7 text-xs'
                  disabled={!rejectReason}
                  onClick={() => store.rejectApplication(app.id, rejectReason)}
                >
                  Reject
                </Button>
                {isAdmin && (
                  <Button
                    variant='outline'
                    className='h-7 text-xs'
                    disabled={!rejectReason}
                    onClick={() => store.cancelApplication(app.id, rejectReason)}
                  >
                    Cancel candidature
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Interviews (TA-08) */}
          <section>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Interviews ({app.interviews.length})
            </h3>
            <div className='space-y-1.5'>
              {app.interviews.length === 0 && (
                <p className='text-neutral-1000 text-sm'>None scheduled.</p>
              )}
              {app.interviews.map((iv) => (
                <div
                  key={iv.id}
                  className='rounded border border-gray-200 px-3 py-2 text-sm'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>
                      Round {iv.round} — {iv.roundName}
                    </span>
                    {iv.skipped ? (
                      <Badge variant='overdue'>skipped</Badge>
                    ) : (
                      <StatusBadge
                        status={iv.status === 'scheduled' ? 'pending' : iv.status}
                      />
                    )}
                  </div>
                  {!iv.skipped && (
                    <p className='text-neutral-1000 text-paragraph-sm'>
                      {iv.date} {iv.time} · {iv.mode} · Panel: {iv.panel.join(', ')}
                      {iv.emailCandidate ? ' · candidate emailed' : ''}
                    </p>
                  )}
                  {iv.comments && (
                    <p className='text-neutral-1000 text-paragraph-sm'>
                      Comments: {iv.comments}
                    </p>
                  )}
                  {iv.conflict && (
                    <p className='text-paragraph-sm text-red-1400'>{iv.conflict}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Scorecards side by side (TA-09, TA-17, TA-44) */}
          <section>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Panel scorecards — side by side
            </h3>
            {app.scorecards.length === 0 ? (
              <p className='text-neutral-1000 text-sm'>No evaluations submitted yet.</p>
            ) : (
              <div className='overflow-x-auto rounded border border-gray-200'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200 bg-neutral-100 text-left'>
                      <th className='px-3 py-1.5 font-medium'>Criterion</th>
                      {app.scorecards.map((s) => (
                        <th key={s.id} className='px-3 py-1.5 font-medium'>
                          {s.interviewer}
                          <span className='text-neutral-1000 block text-xs font-normal'>
                            R{s.round} · {s.recommendation}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaNames.map((cn) => (
                      <tr key={cn} className='border-b border-gray-100'>
                        <td className='px-3 py-1.5'>{cn}</td>
                        {app.scorecards.map((s) => (
                          <td key={s.id} className='px-3 py-1.5'>
                            {s.ratings.find((r) => r.criterion === cn)?.score ?? '—'}
                            /5
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className='px-3 py-1.5 font-medium'>Comments</td>
                      {app.scorecards.map((s) => (
                        <td key={s.id} className='text-neutral-1000 px-3 py-1.5 text-xs'>
                          {s.comments}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Reference checks (TA-10) */}
          <section>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Reference checks
            </h3>
            <div className='space-y-1.5'>
              {app.referenceChecks.map((r) => (
                <div
                  key={r.id}
                  className='rounded border border-gray-200 px-3 py-2 text-sm'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>{r.referee}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className='text-neutral-1000 text-paragraph-sm'>
                    {r.relationship}
                    {r.contactEmail ? ` · ${r.contactEmail}` : ''}
                    {r.contactPhone ? ` · ${r.contactPhone}` : ''}
                    {r.outcome ? ` · outcome: ${r.outcome}` : ''}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </p>
                  {/* Questionnaire responses captured on completion */}
                  {(r.answers ?? []).filter((a) => a.answer).length > 0 && (
                    <div className='mt-1 space-y-0.5'>
                      {(r.answers ?? [])
                        .filter((a) => a.answer)
                        .map((a) => (
                          <p
                            key={a.questionId}
                            className='text-neutral-1000 text-paragraph-sm'
                          >
                            {a.question}{' '}
                            <b className='text-neutral-1600 font-medium'>
                              {a.answer}
                            </b>
                          </p>
                        ))}
                    </div>
                  )}
                  {r.uploadedDocument && (
                    <p className='text-paragraph-sm text-blue-1400 mt-0.5'>
                      {r.uploadedDocument}
                    </p>
                  )}
                  {isAdmin && r.status === 'pending' && (
                    <Button
                      variant='outline'
                      className='mt-1.5 h-7 text-xs'
                      onClick={() => openRefDialog(r)}
                    >
                      Complete reference check
                    </Button>
                  )}
                </div>
              ))}
              {isAdmin && !terminal && (
                <div className='flex items-center gap-1.5'>
                  <Input
                    placeholder='Referee name & company'
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    className='h-7 flex-1 text-xs'
                  />
                  <Select value={refRelation} onValueChange={setRefRelation}>
                    <SelectTrigger className='h-7 w-[150px] text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Direct manager', 'Peer', 'Skip-level', 'HR'].map((x) => (
                        <SelectItem key={x} value={x}>
                          {x}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant='outline'
                    className='h-7 text-xs'
                    disabled={!refName}
                    onClick={() => {
                      store.addReferenceCheck(app.id, {
                        referee: refName,
                        relationship: refRelation,
                      })
                      setRefName('')
                    }}
                  >
                    Add reference
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Pre-onboarding checklist (TA-51) */}
          {['offer', 'hired'].includes(app.status) && isAdmin && (
            <section className='rounded-[8px] border border-gray-200 p-3'>
              <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                Pre-onboarding checklist (from checklist questionnaire config)
              </h3>
              <div className='space-y-2'>
                {checklistQuestions.map((q) => (
                  <div key={q.id} className='flex items-center gap-2 text-sm'>
                    <span className='min-w-0 flex-1'>
                      {q.question}
                      {q.mandatory && ' *'}
                      <span className='text-neutral-1000 text-paragraph-sm'>
                        {' '}
                        ({q.responseFrom})
                      </span>
                    </span>
                    {q.fieldType === 'Yes/No' ? (
                      <Select
                        value={checklist[q.id] ?? app.checklist[q.id] ?? ''}
                        onValueChange={(v) =>
                          setChecklist((prev) => ({ ...prev, [q.id]: v }))
                        }
                      >
                        <SelectTrigger className='h-7 w-[90px] text-xs'>
                          <SelectValue placeholder='—' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Yes'>Yes</SelectItem>
                          <SelectItem value='No'>No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={q.fieldType === 'Date' ? 'date' : 'text'}
                        value={checklist[q.id] ?? app.checklist[q.id] ?? ''}
                        onChange={(e) =>
                          setChecklist((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className='h-7 w-[180px] text-xs'
                      />
                    )}
                  </div>
                ))}
                <Button className='h-7 text-xs' onClick={saveChecklist}>
                  Save checklist
                </Button>
              </div>
            </section>
          )}

          {/* Hiring history — stage trail + previous applications (TA-06, TA-22) */}
          <section>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Hiring history
            </h3>
            <div className='space-y-1'>
              {app.stageHistory.map((h, i) => (
                <p key={i} className='text-neutral-1000 text-paragraph-sm'>
                  {h.at} · {h.from} → <b className='text-neutral-1600'>{h.to}</b> by{' '}
                  {h.actor}
                  {h.note ? ` — ${h.note}` : ''}
                </p>
              ))}
            </div>
            {otherApplications.length > 0 && (
              <div className='mt-3'>
                <p className='text-neutral-1600 mb-1.5 text-sm'>
                  Other applications by this candidate
                </p>
                <div className='space-y-1.5'>
                  {otherApplications.map((o) => (
                    <div
                      key={o.id}
                      className='flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm'
                    >
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {o.requisitionId} · {o.requisitionTitle}
                        </span>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          applied {o.appliedAt} · {o.interviews.length} interview(s)
                          {o.rejectionReason ? ` · ${o.rejectionReason}` : ''}
                        </span>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Complete reference check — configured questionnaire (Kensium Reference Check) */}
        <Dialog open={Boolean(refDialog)} onOpenChange={(o) => !o && setRefDialog(null)}>
          <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[480px]'>
            <DialogHeader>
              <DialogTitle>Complete reference check — {refDialog?.referee}</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <p className='text-neutral-1000 text-paragraph-sm'>
                Contact person: {refDialog?.referee} · {refDialog?.relationship}
              </p>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='mb-1 text-sm font-medium'>Contact email</p>
                  <Input
                    type='email'
                    placeholder='e.g. referee@company.com'
                    value={refEmail}
                    onChange={(e) => setRefEmail(e.target.value)}
                  />
                </div>
                <div>
                  <p className='mb-1 text-sm font-medium'>Contact phone</p>
                  <Input
                    placeholder='e.g. +91 98xxx xxxxx'
                    value={refPhone}
                    onChange={(e) => setRefPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Questionnaire — subjective → free text, Radio / Checkbox → options */}
              {activeQuestions.map((q) => (
                <div key={q.id}>
                  <p className='mb-1 text-sm font-medium'>{q.question}</p>
                  {q.questionType === 'Subjective' ? (
                    <Textarea
                      placeholder='Referee response…'
                      value={refAnswers[q.id] ?? ''}
                      onChange={(e) =>
                        setRefAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className='min-h-[56px]'
                    />
                  ) : q.fieldType === 'Radio' ? (
                    <RadioGroup
                      value={refAnswers[q.id] ?? ''}
                      onValueChange={(v) =>
                        setRefAnswers((prev) => ({ ...prev, [q.id]: v }))
                      }
                      className='gap-1.5'
                    >
                      {q.options.map((opt) => (
                        <label key={opt} className='flex items-center gap-2 text-sm'>
                          <RadioGroupItem value={opt} />
                          {opt}
                        </label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className='space-y-1.5'>
                      {q.options.map((opt) => {
                        const picked = refChoices[q.id] ?? []
                        return (
                          <label key={opt} className='flex items-center gap-2 text-sm'>
                            <Checkbox
                              variant='blue'
                              checked={picked.includes(opt)}
                              onCheckedChange={(v) =>
                                setRefChoices((prev) => ({
                                  ...prev,
                                  [q.id]:
                                    v === true
                                      ? [...picked, opt]
                                      : picked.filter((x) => x !== opt),
                                }))
                              }
                            />
                            {opt}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='mb-1 text-sm font-medium'>Overall outcome</p>
                  <Select
                    value={refOutcome}
                    onValueChange={(v) =>
                      setRefOutcome(v as NonNullable<ReferenceCheck['outcome']>)
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['positive', 'mixed', 'negative'] as const).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className='mb-1 text-sm font-medium'>Upload document</p>
                  <Input
                    placeholder='e.g. signed-reference.pdf'
                    value={refDoc}
                    onChange={(e) => setRefDoc(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>Notes</p>
                <Input
                  placeholder='Summary of the conversation'
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setRefDialog(null)}>
                Cancel
              </Button>
              <Button onClick={saveReference}>Save reference check</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FloatingSheetContent>
    </Sheet>
  )
}
