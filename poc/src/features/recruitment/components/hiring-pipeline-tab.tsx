import { useMemo, useState } from 'react'
import { CalendarPlus, ChatText } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate, useRole } from '@/context/role-context'
import {
  PIPELINE_STAGES,
  type Application,
  type ApplicationStatus,
} from '../data/candidates'
import type {
  ChecklistQuestion,
  InterviewPanel,
  LetterTemplate,
  OfferApproverRule,
  RoundsConfig,
  ScorecardCriterion,
} from '../data/config'
import {
  seedReferenceQuestions,
  type ReferenceQuestion,
} from '../data/reference-questions'
import type { CandidatesStore } from '../hooks/use-candidates'
import type { OffersStore } from '../hooks/use-offers'
import { ApplicationDetailSheet } from './application-detail-sheet'
import { StatusBadge } from './badges'
import { GenerateOfferDialog } from './generate-offer-dialog'
import { ScheduleInterviewDialog } from './schedule-interview-dialog'
import { ScorecardDialog } from './scorecard-dialog'

interface HiringPipelineTabProps {
  store: CandidatesStore
  offersStore: OffersStore
  panels: InterviewPanel[]
  roundsConfigs: RoundsConfig[]
  checklistQuestions: ChecklistQuestion[]
  criteria: ScorecardCriterion[]
  criteriaVersion: number
  letterTemplates: LetterTemplate[]
  offerApproverRules: OfferApproverRule[]
  outOfBandApprover: string
  /** Configured reference-check questionnaire; falls back to the seed set. */
  referenceQuestions?: ReferenceQuestion[]
}

/** Kensium-style hiring stage views incl. On Hold and Cancelled (TA-45, TA-47). */
const STAGE_VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'in-review', label: 'In-Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'on-hold', label: 'On Hold' },
  { key: 'offer', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

type StageView = (typeof STAGE_VIEWS)[number]['key']

function inView(status: ApplicationStatus, view: StageView) {
  if (view === 'all') return true
  if (view === 'in-review')
    return ['applied', 'screening', 'shortlisted'].includes(status)
  if (view === 'interview')
    return ['interview', 'reference-check'].includes(status)
  return status === view
}

/** Stage-view filter a funnel card maps to (cards and chips stay in sync). */
function viewForStage(stage: (typeof PIPELINE_STAGES)[number]): StageView {
  if (stage === 'applied' || stage === 'screening' || stage === 'shortlisted')
    return 'in-review'
  if (stage === 'reference-check') return 'interview'
  return stage as StageView
}

/**
 * End-to-end hiring pipeline (TA-06, TA-13, TA-17, TA-32, TA-42, TA-44,
 * TA-45) — metadata-driven stage board, stage-view filters with counts,
 * name search, mass interview scheduling and per-round interviewer feedback.
 */
export function HiringPipelineTab({
  store,
  offersStore,
  panels,
  roundsConfigs,
  checklistQuestions,
  criteria,
  criteriaVersion,
  letterTemplates,
  offerApproverRules,
  outOfBandApprover,
  referenceQuestions = seedReferenceQuestions,
}: HiringPipelineTabProps) {
  const { role, hasRole } = useRole()
  const [view, setView] = useState<StageView>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<Application | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [feedbackApp, setFeedbackApp] = useState<Application | null>(null)
  const [offerApp, setOfferApp] = useState<Application | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    STAGE_VIEWS.forEach(({ key }) => {
      c[key] = store.applications.filter((a) => inView(a.status, key)).length
    })
    return c
  }, [store.applications])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return store.applications.filter(
      (a) =>
        inView(a.status, view) &&
        (!q || a.candidateName.toLowerCase().includes(q))
    )
  }, [store.applications, view, search])

  /** Live application backing the open sheet/dialogs so mutations re-render. */
  const liveDetail =
    store.applications.find((a) => a.id === detail?.id) ?? null

  const stageCounts = useMemo(
    () =>
      PIPELINE_STAGES.map((s) => ({
        stage: s,
        count: store.applications.filter((a) => a.status === s).length,
      })),
    [store.applications]
  )

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const canSchedule = hasRole('Company Admin', 'Group Company Admin')

  return (
    <div className='w-full'>
      {/* TA-32: pipeline board — stage cards double as table filters, kept
          in sync with the stage-view chip row below (active card highlighted) */}
      <div className='mb-4 grid grid-cols-4 gap-2 lg:grid-cols-7'>
        {stageCounts.map(({ stage, count }) => {
          const target = viewForStage(stage)
          const active = view === target
          return (
            <button
              key={stage}
              type='button'
              aria-pressed={active}
              title={`Filter the candidate table by ${target.replace('-', ' ')}`}
              className={[
                'cursor-pointer rounded-[6px] border px-2 py-1.5 text-left transition-colors',
                active
                  ? 'border-blue-1200 bg-blue-150'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
              onClick={() => setView(active ? 'all' : target)}
            >
              <p
                className={`text-paragraph-sm capitalize ${active ? 'text-blue-1200' : 'text-neutral-1000'}`}
              >
                {stage.replace('-', ' ')}
              </p>
              <p className='text-neutral-1600 text-lg font-medium'>{count}</p>
            </button>
          )
        })}
      </div>

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        {/* Stage-view filters with counts (TA-45, TA-47) */}
        <div className='flex flex-wrap items-center gap-1.5'>
          {STAGE_VIEWS.map(({ key, label }) => (
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

        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search by candidate name…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-7 w-[200px]'
          />
          {canSchedule && (
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              disabled={selected.length === 0}
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarPlus size={14} />
              Schedule {selected.length > 1 ? 'mass ' : ''}interviews (
              {selected.length})
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]' />
              <TableHead>Candidate</TableHead>
              <TableHead>Requisition</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Pre-screen</TableHead>
              <TableHead>Interviews</TableHead>
              <TableHead>Scorecards</TableHead>
              <TableHead>References</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const pendingRefs = a.referenceChecks.filter(
                (r) => r.status === 'pending'
              ).length
              const hasScheduled = a.interviews.some(
                (iv) => iv.status === 'scheduled'
              )
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <Checkbox
                      variant='blue'
                      checked={selected.includes(a.id)}
                      onCheckedChange={() => toggle(a.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='text-neutral-1600 font-medium'>
                        {a.candidateName}
                      </span>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {a.candidateEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {a.requisitionId} · {a.requisitionTitle}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <StatusBadge status={a.status} />
                      {a.status === 'on-hold' && a.heldFromStage && (
                        <span className='text-paragraph-sm text-neutral-1000'>
                          from {a.heldFromStage}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {a.preScreenScore !== null ? `${a.preScreenScore}/100` : '—'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {a.interviews.length}
                    {a.interviews.some((iv) => iv.conflict) && (
                      <Badge variant='overdue' className='ml-1'>
                        conflict
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>{a.scorecards.length}</TableCell>
                  <TableCell className='text-sm'>
                    {pendingRefs > 0 ? (
                      <Badge variant='overdue'>{pendingRefs} pending</Badge>
                    ) : (
                      a.referenceChecks.length
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>{a.appliedAt}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <RoleGate roles={['Employee (User)', 'Company Admin']}>
                        {hasScheduled && (
                          <Button
                            variant='outline'
                            className='h-6 gap-1 px-2 text-xs'
                            onClick={() => setFeedbackApp(a)}
                          >
                            <ChatText size={12} /> Feedback
                          </Button>
                        )}
                      </RoleGate>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setDetail(a)}
                      >
                        Open
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className='text-neutral-1000 text-center'>
                  No candidates in this stage view
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicationDetailSheet
        application={liveDetail}
        onOpenChange={(o) => !o && setDetail(null)}
        store={store}
        checklistQuestions={checklistQuestions}
        referenceQuestions={referenceQuestions}
        onGenerateOffer={(app) => setOfferApp(app)}
      />

      <ScheduleInterviewDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        candidateCount={selected.length}
        panels={panels}
        roundsConfigs={roundsConfigs}
        onSchedule={(details) => {
          store.scheduleInterviews(selected, details)
          setSelected([])
        }}
        onSkipRound={(round, roundName) => {
          // Kensium: skip the round for every selected candidate.
          selected.forEach((id) => store.skipRound(id, round, roundName))
          setSelected([])
        }}
      />

      <ScorecardDialog
        application={feedbackApp}
        onOpenChange={(o) => !o && setFeedbackApp(null)}
        criteria={criteria}
        criteriaVersion={criteriaVersion}
        interviewer={role}
        onSubmit={store.submitScorecard}
      />

      <GenerateOfferDialog
        application={offerApp}
        onOpenChange={(o) => !o && setOfferApp(null)}
        letterTemplates={letterTemplates}
        offerApproverRules={offerApproverRules}
        outOfBandApprover={outOfBandApprover}
        onGenerate={(app, draft) => offersStore.generateOffer(app, draft)}
      />
    </div>
  )
}
