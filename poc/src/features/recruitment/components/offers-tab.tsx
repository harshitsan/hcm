import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import { requestModuleTab } from '@/features/workflows/data/module-nav'
import type { Application } from '../data/candidates'
import {
  seedRequiredDocuments,
  type ChecklistQuestion,
  type RequiredDocument,
} from '../data/config'
import { formatInr, type Offer, type OfferComponent } from '../data/offers'
import {
  useCandidateDocuments,
  type CandidateDocumentsStore,
} from '../hooks/use-candidate-documents'
import type { OffersStore } from '../hooks/use-offers'
import { OutOfBandBadge, StatusBadge } from './badges'
import { COMP_POLICY_NOTE, OfferDetailSheet } from './offer-detail-sheet'
import { UploadCandidateDocDialog } from './upload-candidate-doc-dialog'

interface OffersTabProps {
  store: OffersStore
  applications: Application[]
  checklistQuestions: ChecklistQuestion[]
  /** Candidate document submissions store — falls back to a local store. */
  documentsStore?: CandidateDocumentsStore
  /** Stage-based required documents — defaults to the config seeds. */
  requiredDocuments?: RequiredDocument[]
}

/** Kensium-style offer lifecycle views (TA-47, TA-49, TA-50). */
const OFFER_VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'pending-approval', label: 'Pending Approval' },
  { key: 'release', label: 'Release Offer' },
  { key: 'cancel', label: 'Cancel Offer' },
  { key: 'refuse', label: 'Refuse Offer' },
  { key: 'joining', label: 'Joining Letter' },
  { key: 'appointment', label: 'Appointment Letter' },
] as const

type OfferView = (typeof OFFER_VIEWS)[number]['key']

function inView(o: Offer, view: OfferView) {
  switch (view) {
    case 'all':
      return true
    case 'pending-approval':
      return ['pending-approval', 'needs-clarification'].includes(o.status)
    case 'release':
      return o.status === 'approved'
    case 'cancel':
      return ['released', 'accepted'].includes(o.status)
    case 'refuse':
      return ['released', 'refused'].includes(o.status)
    case 'joining':
      return o.status === 'accepted'
    case 'appointment':
      return o.status === 'accepted' && o.joined
  }
}

type Decision = 'approved' | 'rejected' | 'needs-clarification'

/** Compact breakup table shared by the approval / preview / cancel dialogs. */
function BreakupTable({ rows }: { rows: OfferComponent[] }) {
  if (rows.length === 0)
    return (
      <p className='text-paragraph-sm text-neutral-1000'>
        No slab-derived breakup on this offer.
      </p>
    )
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Component</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className='text-right'>Annual amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.name}-${i}`}>
            <TableCell className='text-sm'>{r.name}</TableCell>
            <TableCell className='text-paragraph-sm text-neutral-1000'>
              {r.type}
            </TableCell>
            <TableCell className='text-right text-sm'>
              {formatInr(r.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * Offer desk — template-generated offers routed through location + out-of-band
 * approval (with a needs-clarification loop and audit-logged breakup edits),
 * document-gated offer letters, release / cancel / refuse lifecycle views,
 * joining and appointment letters, expiry flags and conversion to employee
 * (TA-11, TA-12, TA-14, TA-18, TA-46, TA-47, TA-49, TA-50).
 */
export function OffersTab({
  store,
  applications,
  checklistQuestions,
  documentsStore,
  requiredDocuments = seedRequiredDocuments,
}: OffersTabProps) {
  const { role, hasRole } = useRole()
  // Local fallback keeps index.tsx compiling until the orchestrator wires
  // a shared store; hooks must be called unconditionally.
  const fallbackDocs = useCandidateDocuments()
  const docs = documentsStore ?? fallbackDocs

  const [view, setView] = useState<OfferView>('all')
  const [search, setSearch] = useState('')
  const [deciding, setDeciding] = useState<Offer | null>(null)
  const [decision, setDecision] = useState<Decision>('approved')
  const [comment, setComment] = useState('')
  const [clarifyAnswer, setClarifyAnswer] = useState('')
  const [editRows, setEditRows] = useState<OfferComponent[]>([])
  const [uploadingFor, setUploadingFor] = useState<Offer | null>(null)
  const [previewing, setPreviewing] = useState<Offer | null>(null)
  const [accepting, setAccepting] = useState<Offer | null>(null)
  const [ackFile, setAckFile] = useState('')
  const [refusing, setRefusing] = useState<Offer | null>(null)
  const [refuseComments, setRefuseComments] = useState('')
  const [cancelling, setCancelling] = useState<Offer | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [genCancelLetter, setGenCancelLetter] = useState(true)
  const [emailCandidate, setEmailCandidate] = useState(true)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [converting, setConverting] = useState<Offer | null>(null)
  const [createUser, setCreateUser] = useState(true)
  const [viewing, setViewing] = useState<Offer | null>(null)
  const navigate = useNavigate()

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isCandidate = hasRole('Employee (User)')
  const today = new Date().toISOString().slice(0, 10)

  /** Cross-module jump to Lifecycle → Onboarding for a converted hire. */
  const viewOnboarding = () => {
    requestModuleTab('/lifecycle', 'onboarding')
    navigate({ to: '/lifecycle' })
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    OFFER_VIEWS.forEach(({ key }) => {
      c[key] = store.offers.filter((o) => inView(o, key)).length
    })
    return c
  }, [store.offers])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return store.offers.filter(
      (o) => inView(o, view) && (!q || o.candidateName.toLowerCase().includes(q))
    )
  }, [store.offers, view, search])

  /** Required docs still outstanding at the offer stage (blocks the letter). */
  const missingDocs = (o: Offer) =>
    docs.missingRequiredFor(o.applicationId, requiredDocuments, 'offer')

  /** Approved offers in the current view blocked by outstanding documents. */
  const blocked = rows.filter(
    (o) =>
      o.status === 'approved' && !o.offerLetterGenerated && missingDocs(o).length > 0
  )

  /** Missing mandatory pre-onboarding data blocks conversion (TA-14). */
  const conversionGaps = (offer: Offer): string[] => {
    const app = applications.find((a) => a.id === offer.applicationId)
    return checklistQuestions
      .filter((q) => q.mandatory && !app?.checklist[q.id])
      .map((q) => q.question)
  }

  // The decide dialog reads the live offer so breakup edits render fresh.
  const decidingLive = deciding
    ? (store.offers.find((x) => x.id === deciding.id) ?? deciding)
    : null
  // The detail sheet reads the live offer so conversion updates render fresh.
  const viewingLive = viewing
    ? (store.offers.find((x) => x.id === viewing.id) ?? viewing)
    : null
  const openClarification = decidingLive?.clarifications.find((c) => !c.answer)

  const openDecide = (o: Offer) => {
    setDeciding(o)
    setDecision('approved')
    setComment('')
    setClarifyAnswer('')
    setEditRows(o.breakup.map((r) => ({ ...r })))
  }

  const decide = () => {
    if (!deciding) return
    store.decideOffer(deciding.id, decision, comment)
    setDeciding(null)
    setComment('')
  }

  /** Approver-side breakup save — changed amounts are audit-logged. */
  const saveComponentEdits = () => {
    if (!decidingLive) return
    store.updateOfferComponents(decidingLive.id, editRows, role)
  }

  const openCancel = (o: Offer) => {
    setCancelling(o)
    setCancelReason('')
    setGenCancelLetter(true)
    setEmailCandidate(true)
    setEmailSubject(`Cancellation of offer ${o.id} — ${o.requisitionTitle}`)
    setEmailBody(
      `Dear ${o.candidateName},\n\nWe regret to inform you that your offer ${o.id} for the position of ${o.requisitionTitle} (${o.location}) has been cancelled. We thank you for your time and interest, and will retain your profile for future opportunities.\n\nRegards,\nTalent Acquisition Team`
    )
  }

  const submitCancel = () => {
    if (!cancelling) return
    store.cancelOffer(cancelling.id, cancelReason, {
      generateLetter: genCancelLetter,
      emailCandidate,
    })
    setCancelling(null)
  }

  /** Merged offer-letter body for the preview dialog. */
  const letterPreview = (o: Offer) =>
    `Dear ${o.candidateName},\n\nWe are pleased to offer you the position of ${o.requisitionTitle} at our ${o.location} office, at an annual CTC of ${formatInr(o.annualCtc)}. Your expected date of joining is ${o.expectedDoj}. Please respond to this offer on or before ${o.responseDeadline}.\n\nYour detailed compensation breakup is enclosed below.`

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {OFFER_VIEWS.map(({ key, label }) => (
            <Button
              key={key}
              variant={view === key ? 'default' : 'outline'}
              className='h-7 px-2.5 text-xs'
              onClick={() => setView(key)}
            >
              {label} ({counts[key]})
            </Button>
          ))}
        </div>
        <Input
          placeholder='Search by candidate name…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-7 w-[200px]'
        />
      </div>

      {/* Document gating for the offer letter (Kensium PDF — Offer Letter) */}
      {blocked.length > 0 && (
        <div className='mb-3 rounded-[8px] border border-amber-300 bg-amber-50 px-3 py-2'>
          <p className='text-sm text-amber-800'>
            Offer letter cannot be generated until required documents are
            submitted —{' '}
            {blocked
              .map(
                (o) =>
                  `${o.candidateName} (${missingDocs(o)
                    .map((d) => d.name)
                    .join(', ')})`
              )
              .join('; ')}
            . Use “Upload documents” on the offer row.
          </p>
        </div>
      )}

      {/* Comp-dark policy — compensation is masked in the grid for everyone */}
      <p className='text-neutral-1000 text-paragraph-sm mb-2'>{COMP_POLICY_NOTE}</p>

      {/* overflow-x-auto keeps the wide table inside the card frame; the
          Actions cell is width-capped so buttons wrap instead of spilling
          into the page gutter */}
      <div className='overflow-x-auto rounded-[8px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Requisition</TableHead>
              <TableHead>CTC</TableHead>
              <TableHead>Expected DOJ</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[240px] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => {
              const overdue =
                o.status === 'released' && o.responseDeadline < today
              const missing = missingDocs(o)
              return (
                <TableRow key={o.id}>
                  <TableCell className='font-medium'>{o.id}</TableCell>
                  <TableCell className='text-sm'>{o.candidateName}</TableCell>
                  <TableCell className='text-sm'>
                    {o.requisitionId} · {o.location}
                  </TableCell>
                  <TableCell>
                    {/* Comp-dark: amounts never render in the general grid */}
                    <div className='flex items-center gap-1 text-sm'>
                      <span className='text-neutral-1000'>••• Restricted</span>
                      {o.outOfBand && <OutOfBandBadge />}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>{o.expectedDoj}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {o.approvals
                      .map((a) => `L${a.level} ${a.approver}: ${a.decision}`)
                      .join(' · ')}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {o.responseDeadline}
                    {overdue && (
                      <Badge variant='overdue' className='ml-1'>
                        Expired — follow up
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap items-center gap-1'>
                      <StatusBadge status={o.status} />
                      {o.offerLetterGenerated &&
                        !['cancelled', 'refused', 'expired'].includes(
                          o.status
                        ) && <Badge variant='completed'>Offer letter</Badge>}
                      {o.joiningLetterIssued && (
                        <Badge variant='completed'>Joining letter</Badge>
                      )}
                      {o.joined && <Badge variant='badge_active'>Joined</Badge>}
                      {o.appointmentLetterIssued && (
                        <Badge variant='completed'>Appointment letter</Badge>
                      )}
                      {o.convertedTo && (
                        <Badge variant='badge_active'>
                          {o.convertedTo === 'employee-user'
                            ? 'Converted (User)'
                            : 'Converted (Non-User)'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='max-w-[240px] text-right'>
                    <div className='ml-auto flex max-w-[240px] flex-wrap justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setViewing(o)}
                      >
                        View offer
                      </Button>
                      {o.convertedTo && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={viewOnboarding}
                        >
                          View onboarding
                        </Button>
                      )}
                      {isAdmin && o.status === 'pending-approval' && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => openDecide(o)}
                        >
                          Decide
                        </Button>
                      )}
                      {isAdmin && o.status === 'needs-clarification' && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => openDecide(o)}
                        >
                          Clarify
                        </Button>
                      )}
                      {/* Offer letter — gated on required documents (PDF) */}
                      {isAdmin && o.status === 'approved' && (
                        <>
                          {missing.length > 0 && !o.offerLetterGenerated ? (
                            <Button
                              variant='outline'
                              className='h-6 border-amber-400 px-2 text-xs text-amber-700'
                              onClick={() => setUploadingFor(o)}
                            >
                              Upload documents ({missing.length})
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant='outline'
                                className='h-6 px-2 text-xs'
                                onClick={() => setPreviewing(o)}
                              >
                                Preview letter
                              </Button>
                              {!o.offerLetterGenerated && (
                                <Button
                                  variant='outline'
                                  className='h-6 px-2 text-xs'
                                  onClick={() => store.generateOfferLetter(o.id)}
                                >
                                  Generate letter
                                </Button>
                              )}
                            </>
                          )}
                          {o.offerLetterGenerated && (
                            <Button
                              className='h-6 px-2 text-xs'
                              onClick={() => store.releaseOffer(o.id)}
                            >
                              Release
                            </Button>
                          )}
                        </>
                      )}
                      {(isCandidate || isAdmin) && o.status === 'released' && (
                        <>
                          <Button
                            className='h-6 px-2 text-xs'
                            onClick={() => {
                              setAccepting(o)
                              setAckFile('')
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => {
                              setRefusing(o)
                              setRefuseComments('')
                            }}
                          >
                            Refuse
                          </Button>
                        </>
                      )}
                      {isAdmin &&
                        ['released', 'accepted'].includes(o.status) &&
                        !o.convertedTo && (
                          <Button
                            variant='outline'
                            className='h-6 px-2 text-xs'
                            onClick={() => openCancel(o)}
                          >
                            Cancel offer
                          </Button>
                        )}
                      {isAdmin && o.status === 'accepted' && (
                        <>
                          {!o.joiningLetterIssued && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.issueJoiningLetter(o.id)}
                            >
                              Issue joining letter
                            </Button>
                          )}
                          {!o.joined && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.markJoined(o.id)}
                            >
                              Mark joined
                            </Button>
                          )}
                          {o.joined && !o.appointmentLetterIssued && (
                            <Button
                              variant='outline'
                              className='h-6 px-2 text-xs'
                              onClick={() => store.issueAppointmentLetter(o.id)}
                            >
                              Issue appointment letter
                            </Button>
                          )}
                          {!o.convertedTo && (
                            <Button
                              className='h-6 px-2 text-xs'
                              onClick={() => {
                                setCreateUser(true)
                                setConverting(o)
                              }}
                            >
                              Hand off to Onboarding
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className='text-neutral-1000 text-center'>
                  No offers in this view
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* TA-11: multi-level offer approval with clarification loop and
          audit-logged breakup edits */}
      <Dialog
        open={deciding !== null}
        onOpenChange={(o) => !o && setDeciding(null)}
      >
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Offer approval — {decidingLive?.id}</DialogTitle>
          </DialogHeader>
          <div className='max-h-[65vh] space-y-3 overflow-y-auto pr-1'>
            <div className='space-y-1 text-sm'>
              {decidingLive?.approvals.map((a) => (
                <div
                  key={a.level}
                  className='flex items-center justify-between rounded border border-gray-200 px-2 py-1.5'
                >
                  <span className='text-neutral-1900'>
                    L{a.level} · {a.approver} ({a.approverRole})
                  </span>
                  <StatusBadge status={a.decision} />
                </div>
              ))}
            </div>

            {/* Approvers see the breakup and can adjust amounts (audited) */}
            <div className='rounded-[8px] border border-gray-200 bg-white'>
              <p className='px-3 pt-2 text-sm font-medium'>
                Compensation breakup — CTC{' '}
                {decidingLive ? formatInr(decidingLive.annualCtc) : ''}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className='text-right'>Annual amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editRows.map((r, i) => (
                    <TableRow key={`${r.name}-${i}`}>
                      <TableCell className='text-sm'>{r.name}</TableCell>
                      <TableCell className='text-paragraph-sm text-neutral-1000'>
                        {r.type}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Input
                          type='number'
                          className='ml-auto h-6 w-[110px] text-right'
                          value={String(r.amount)}
                          onChange={(e) =>
                            setEditRows((prev) =>
                              prev.map((row, j) =>
                                j === i
                                  ? { ...row, amount: Number(e.target.value) || 0 }
                                  : row
                              )
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className='flex justify-end px-3 pb-2'>
                <Button
                  variant='outline'
                  className='h-6 px-2 text-xs'
                  onClick={saveComponentEdits}
                >
                  Save component edits
                </Button>
              </div>
            </div>

            {/* Audit trail of every manual component-amount change */}
            {decidingLive && decidingLive.componentChanges.length > 0 && (
              <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
                <p className='mb-1 text-sm font-medium'>
                  Component change history
                </p>
                {decidingLive.componentChanges.map((c, i) => (
                  <p key={i} className='text-paragraph-sm text-neutral-1000'>
                    {c.component}: {formatInr(c.from)} → {formatInr(c.to)} by{' '}
                    {c.by} on {c.at.slice(0, 10)}
                  </p>
                ))}
              </div>
            )}

            {/* Clarification thread — needs-clarification loop */}
            {decidingLive && decidingLive.clarifications.length > 0 && (
              <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
                <p className='mb-1 text-sm font-medium'>Clarifications</p>
                {decidingLive.clarifications.map((c, i) => (
                  <div key={i} className='mb-1'>
                    <p className='text-paragraph-sm text-neutral-1900'>
                      Q: {c.question}{' '}
                      <span className='text-neutral-1000'>
                        — {c.askedBy}, {c.askedAt.slice(0, 10)}
                      </span>
                    </p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      A: {c.answer ?? 'Awaiting answer'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {openClarification && decidingLive?.status === 'needs-clarification' ? (
              <div className='space-y-2'>
                <Textarea
                  placeholder='Answer the open clarification to resume approval'
                  value={clarifyAnswer}
                  onChange={(e) => setClarifyAnswer(e.target.value)}
                  rows={2}
                />
                <Button
                  className='h-7 px-3 text-xs'
                  disabled={!clarifyAnswer.trim()}
                  onClick={() => {
                    if (!decidingLive) return
                    store.clarifyOffer(decidingLive.id, clarifyAnswer.trim())
                    setDeciding(null)
                  }}
                >
                  Submit answer &amp; resume approval
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={decision}
                  onValueChange={(v) => setDecision(v as Decision)}
                  className='flex gap-4'
                >
                  <div className='flex items-center gap-1.5'>
                    <RadioGroupItem value='approved' id='ofr-approve' />
                    <Label htmlFor='ofr-approve'>Approve</Label>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <RadioGroupItem value='rejected' id='ofr-reject' />
                    <Label htmlFor='ofr-reject'>Reject</Label>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <RadioGroupItem
                      value='needs-clarification'
                      id='ofr-clarify'
                    />
                    <Label htmlFor='ofr-clarify'>Need clarification</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder={
                    decision === 'needs-clarification'
                      ? 'Question for the recruiter (pauses the approval)'
                      : 'Comment (recorded with approver and timestamp)'
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
              </>
            )}

            <p className='text-paragraph-sm text-neutral-1000'>
              Supervisors outside the approval workflow can view this offer and
              its breakup but cannot record a decision.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            {decidingLive?.status === 'pending-approval' && (
              <Button onClick={decide}>Record decision</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF — Offer Letter: preview with merged values + breakup */}
      <Dialog
        open={previewing !== null}
        onOpenChange={(o) => !o && setPreviewing(null)}
      >
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>
              Offer letter preview — {previewing?.candidateName}
            </DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
              <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
                <p className='whitespace-pre-line text-paragraph-sm text-neutral-1900'>
                  {letterPreview(previewing)}
                </p>
                <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                  Template {previewing.templateId} v{previewing.templateVersion}
                </p>
              </div>
              <div className='rounded-[8px] border border-gray-200 bg-white'>
                <BreakupTable rows={previewing.breakup} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreviewing(null)}>
              Close
            </Button>
            {previewing && !previewing.offerLetterGenerated && (
              <Button
                onClick={() => {
                  store.generateOfferLetter(previewing.id)
                  setPreviewing(null)
                }}
              >
                Generate letter
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TA-12, TA-47: accept with signed acknowledgment upload */}
      <Dialog
        open={accepting !== null}
        onOpenChange={(o) => !o && setAccepting(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Accept offer — {accepting?.id}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Upload the signed offer acknowledgment to record the acceptance.
            </p>
            <div>
              <p className='mb-1 text-sm font-medium'>
                Acknowledgment file name
              </p>
              <Input
                placeholder='e.g. offer-acknowledgment-signed.pdf'
                value={ackFile}
                onChange={(e) => setAckFile(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAccepting(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!accepting) return
                store.respondToOffer(
                  accepting.id,
                  'accepted',
                  ackFile.trim() || undefined
                )
                setAccepting(null)
              }}
            >
              Accept offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF — Refuse Offer: refusal with candidate comments */}
      <Dialog
        open={refusing !== null}
        onOpenChange={(o) => !o && setRefusing(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Refuse offer — {refusing?.id}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder='Comments (why the offer is being refused)'
            value={refuseComments}
            onChange={(e) => setRefuseComments(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRefusing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!refusing) return
                store.refuseOffer(refusing.id, refuseComments.trim())
                setRefusing(null)
              }}
            >
              Record refusal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF — Cancel Offer: breakup + reason + cancel letter + email */}
      <Dialog
        open={cancelling !== null}
        onOpenChange={(o) => !o && setCancelling(null)}
      >
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>
              Cancel offer — {cancelling?.id} ({cancelling?.candidateName})
            </DialogTitle>
          </DialogHeader>
          {cancelling && (
            <div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
              <div className='rounded-[8px] border border-gray-200 bg-white'>
                <BreakupTable rows={cancelling.breakup} />
              </div>
              <Textarea
                placeholder='Reason for cancellation (recorded on the offer)'
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='cancel-letter'
                  checked={genCancelLetter}
                  onCheckedChange={(v) => setGenCancelLetter(v === true)}
                />
                <Label htmlFor='cancel-letter'>
                  Generate cancel letter from the Cancel Offer template
                </Label>
              </div>
              {genCancelLetter && (
                <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
                  <p className='whitespace-pre-line text-paragraph-sm text-neutral-1000'>
                    {`Dear ${cancelling.candidateName},\n\nThis letter is to confirm that the offer ${cancelling.id} for the position of ${cancelling.requisitionTitle} (${cancelling.location}) dated ${cancelling.releasedAt ?? '—'} stands cancelled${cancelReason ? ` for the following reason: ${cancelReason}` : ''}.`}
                  </p>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='cancel-email'
                  checked={emailCandidate}
                  onCheckedChange={(v) => setEmailCandidate(v === true)}
                />
                <Label htmlFor='cancel-email'>Email the candidate</Label>
              </div>
              {emailCandidate && (
                <div className='space-y-2'>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={5}
                  />
                </div>
              )}
              <p className='text-paragraph-sm text-neutral-1000'>
                The candidate remains in the pipeline history and can be
                re-shortlisted for future openings.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setCancelling(null)}>
              Back
            </Button>
            <Button onClick={submitCancel}>Cancel offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF — Documents: four fulfilment modes per required document */}
      <UploadCandidateDocDialog
        open={uploadingFor !== null}
        onOpenChange={(o) => !o && setUploadingFor(null)}
        applicationId={uploadingFor?.applicationId ?? ''}
        candidateName={uploadingFor?.candidateName ?? ''}
        requiredDocuments={requiredDocuments}
        store={docs}
      />

      {/* TA-14, TA-18: onboarding handoff with gap check */}
      <ConfirmDialog
        open={converting !== null}
        onOpenChange={(o) => !o && setConverting(null)}
        title={`Hand off ${converting?.candidateName ?? ''} to Onboarding?`}
        confirmText='Hand off to Onboarding'
        desc={
          <div className='space-y-2'>
            <p>
              {createUser
                ? `An employee record will be created for ${converting?.candidateName ?? 'the candidate'} along with a user account, so they can sign in from day one. An onboarding case opens in Lifecycle → Onboarding.`
                : `An employee record will be created for ${converting?.candidateName ?? 'the candidate'} without a sign-in account — one can be added later. An onboarding case opens in Lifecycle → Onboarding.`}
            </p>
            {converting && conversionGaps(converting).length > 0 && (
              <p className='text-red-1400'>
                Pre-onboarding checklist items are still pending:{' '}
                {conversionGaps(converting).join('; ')}. Complete them before
                handing off.
              </p>
            )}
            <p>
              Captured personal, role, compensation and document details carry
              over without re-entry, and the source requisition is marked
              filled.
            </p>
          </div>
        }
        handleConfirm={() => {
          if (
            converting &&
            store.convertToEmployee(
              converting.id,
              createUser ? 'employee-user' : 'employee-non-user',
              conversionGaps(converting)
            )
          )
            setConverting(null)
        }}
      >
        <div className='flex items-center gap-2'>
          <Checkbox
            id='handoff-create-user'
            checked={createUser}
            onCheckedChange={(v) => setCreateUser(v === true)}
          />
          <Label htmlFor='handoff-create-user'>
            Create user account so the new joiner can sign in
          </Label>
        </div>
      </ConfirmDialog>

      {/* Individual offer detail — comp visible to admins + candidate view */}
      <OfferDetailSheet
        offer={viewingLive}
        onOpenChange={(o) => !o && setViewing(null)}
        onViewOnboarding={viewOnboarding}
      />
    </div>
  )
}
