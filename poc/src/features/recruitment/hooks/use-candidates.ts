import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { EngineLogEntry } from '../data/config'
import {
  PIPELINE_STAGES,
  seedApplications,
  seedCandidates,
  type Application,
  type Candidate,
  type Interview,
  type PipelineStage,
  type ReferenceCheck,
  type Scorecard,
} from '../data/candidates'

export type CandidateDraft = Omit<
  Candidate,
  'id' | 'addedAt' | 'reviewStatus'
>

export interface BulkFileResult {
  file: string
  ok: boolean
  reason?: string
}

interface UseCandidatesArgs {
  actor: string
  logEngine: (
    engine: EngineLogEntry['engine'],
    event: string,
    detail: string
  ) => void
  notify: (event: string, recipient: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)
const newId = (p: string) => `${p}-${crypto.randomUUID().slice(0, 6)}`

/**
 * Talent pool + application pipeline store (TA-05, TA-06, TA-08…TA-10,
 * TA-13, TA-24, TA-28, TA-33, TA-39, TA-40, TA-42, TA-44, TA-45).
 */
export function useCandidates({ actor, logEngine, notify }: UseCandidatesArgs) {
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates)
  const [applications, setApplications] =
    useState<Application[]>(seedApplications)

  // ---- Talent pool -------------------------------------------------------

  /** Add with tenant-level uniqueness enforcement on email/phone (TA-05, TA-24). */
  const addCandidate = useCallback(
    (draft: CandidateDraft): Candidate | null => {
      const duplicate = candidates.find(
        (c) =>
          c.email.toLowerCase() === draft.email.toLowerCase() ||
          c.phone.replace(/\s/g, '') === draft.phone.replace(/\s/g, '')
      )
      if (duplicate) {
        toast.error(
          `Potential duplicate — ${duplicate.name} already exists with matching email/phone`
        )
        return null
      }
      const candidate: Candidate = {
        ...draft,
        id: newId('c'),
        reviewStatus: 'not-reviewed',
        addedAt: today(),
      }
      setCandidates((prev) => [candidate, ...prev])
      toast.success(`${candidate.name} added to the talent pool`)
      return candidate
    },
    [candidates]
  )

  const assignFolders = useCallback((ids: string[], folders: string[]) => {
    setCandidates((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, folders: [...new Set([...c.folders, ...folders])] }
          : c
      )
    )
    toast.success(
      `${ids.length} candidate${ids.length === 1 ? '' : 's'} added to ${folders.join(', ')}`
    )
  }, [])

  const setReviewStatus = useCallback(
    (id: string, reviewStatus: Candidate['reviewStatus']) => {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, reviewStatus } : c))
      )
    },
    []
  )

  /** Bulk resume ingestion against a requisition (TA-33). */
  const bulkImport = useCallback(
    (
      files: Array<{ name: string; size: number }>,
      requisitionId: string,
      requisitionTitle: string
    ): BulkFileResult[] => {
      const results: BulkFileResult[] = files.map((f) => {
        const supported = /\.(pdf|docx?|rtf)$/i.test(f.name)
        if (!supported)
          return { file: f.name, ok: false, reason: 'Unsupported file type' }
        if (f.size > 5 * 1024 * 1024)
          return { file: f.name, ok: false, reason: 'File exceeds 5 MB limit' }
        return { file: f.name, ok: true }
      })
      const imported = results.filter((r) => r.ok)
      imported.forEach((r, i) => {
        const base = r.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        const name = base
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
        const candidate: Candidate = {
          id: newId('c'),
          name,
          email: `${base.replace(/\s/g, '.')}.${i}@import.satellitehr.in`,
          phone: `+91 90000 ${String(10000 + Math.floor(Math.random() * 89999)).slice(0, 5)}`,
          currentRole: 'Parsed from resume',
          skills: [],
          source: 'Bulk Upload',
          folders: [],
          reviewStatus: 'not-reviewed',
          resume: r.file,
          linkedRequisitionId: requisitionId,
          addedAt: today(),
        }
        setCandidates((prev) => [candidate, ...prev])
        setApplications((prev) => [
          {
            id: newId('app'),
            candidateId: candidate.id,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            requisitionId,
            requisitionTitle,
            status: 'applied',
            resume: r.file,
            appliedAt: today(),
            preScreenScore: null,
            interviews: [],
            scorecards: [],
            referenceChecks: [],
            stageHistory: [{ at: today(), actor, from: '—', to: 'applied' }],
            checklist: {},
          },
          ...prev,
        ])
      })
      logEngine(
        'forms',
        'Bulk resume upload processed',
        `${imported.length}/${files.length} files parsed and linked to ${requisitionId}; failures flagged with reasons`
      )
      return results
    },
    [actor, logEngine]
  )

  /** Simulated mailbox poll importing an emailed application (TA-40). */
  const runMailboxImport = useCallback(() => {
    const candidate: Candidate = {
      id: newId('c'),
      name: 'Tanvi Deshpande',
      email: `tanvi.deshpande+${Math.floor(Math.random() * 999)}@gmail.com`,
      phone: `+91 91111 ${String(10000 + Math.floor(Math.random() * 89999)).slice(0, 5)}`,
      currentRole: 'Imported from applications@ mailbox',
      skills: ['Parsed from attachment'],
      source: 'Mailbox Import',
      folders: [],
      reviewStatus: 'not-reviewed',
      resume: 'tanvi-deshpande-resume.pdf',
      linkedRequisitionId: null,
      addedAt: today(),
    }
    setCandidates((prev) => [candidate, ...prev])
    toast.success(
      'Mailbox polled — 1 application imported with resume attached; message deleted per settings'
    )
  }, [])

  // ---- Applications ------------------------------------------------------

  const patchApp = useCallback(
    (id: string, fn: (a: Application) => Application) => {
      setApplications((prev) => prev.map((a) => (a.id === id ? fn(a) : a)))
    },
    []
  )

  /** Candidate self-service apply (TA-31). */
  const applyToRequisition = useCallback(
    (
      candidate: Pick<Candidate, 'id' | 'name' | 'email'>,
      requisitionId: string,
      requisitionTitle: string,
      resume: string
    ) => {
      setApplications((prev) => [
        {
          id: newId('app'),
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          requisitionId,
          requisitionTitle,
          status: 'applied',
          resume,
          appliedAt: today(),
          preScreenScore: null,
          interviews: [],
          scorecards: [],
          referenceChecks: [],
          stageHistory: [
            { at: today(), actor: candidate.name, from: '—', to: 'applied' },
          ],
          checklist: {},
        },
        ...prev,
      ])
      notify('Application received', candidate.email)
      toast.success(`Application submitted for ${requisitionTitle}`)
    },
    [notify]
  )

  /**
   * Rules-engine stage gate (TA-13, TA-28): transitions must be sequential;
   * offer entry requires completed scorecards and reference checks.
   */
  const advanceStage = useCallback(
    (id: string, target: PipelineStage): boolean => {
      const app = applications.find((a) => a.id === id)
      if (!app) return false
      const current = (app.status === 'on-hold'
        ? app.heldFromStage
        : app.status) as PipelineStage
      const fromIdx = PIPELINE_STAGES.indexOf(current)
      const toIdx = PIPELINE_STAGES.indexOf(target)
      if (toIdx !== fromIdx + 1) {
        logEngine(
          'rules',
          'Stage gate evaluated',
          `${id} → ${target}: sequential-entry rule failed (current: ${current}) — BLOCK`
        )
        toast.error(
          `Cannot skip ahead — ${app.candidateName} must complete "${PIPELINE_STAGES[fromIdx + 1]}" first`
        )
        return false
      }
      if (target === 'offer') {
        const failures: string[] = []
        if (app.scorecards.length === 0)
          failures.push('at least one submitted scorecard')
        if (
          app.referenceChecks.length === 0 ||
          app.referenceChecks.some((r) => r.status !== 'completed')
        )
          failures.push('all reference checks completed')
        if (failures.length > 0) {
          logEngine(
            'rules',
            'Offer eligibility evaluated',
            `${id}: failing conditions — ${failures.join('; ')} — BLOCK`
          )
          toast.error(`Not offer-eligible: requires ${failures.join(' and ')}`)
          return false
        }
      }
      patchApp(id, (a) => ({
        ...a,
        status: target,
        heldFromStage: undefined,
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: current, to: target },
        ],
      }))
      logEngine(
        'rules',
        'Stage gate evaluated',
        `${id} → ${target}: entry conditions met — ALLOW`
      )
      notify(`Candidate moved to ${target}`, app.candidateEmail)
      toast.success(`${app.candidateName} moved to ${target}`)
      return true
    },
    [applications, patchApp, logEngine, notify, actor]
  )

  const rejectApplication = useCallback(
    (id: string, reason: string) => {
      patchApp(id, (a) => ({
        ...a,
        status: 'rejected',
        rejectionReason: reason,
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: String(a.status), to: 'rejected', note: reason },
        ],
      }))
      const app = applications.find((a) => a.id === id)
      if (app) notify('Application closed', app.candidateEmail)
      toast.success('Candidate closed with reason recorded')
    },
    [applications, patchApp, notify, actor]
  )

  /** Pause / resume progression without losing history (TA-45). */
  const holdApplication = useCallback(
    (id: string) => {
      patchApp(id, (a) => ({
        ...a,
        heldFromStage: a.status as PipelineStage,
        status: 'on-hold',
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: String(a.status), to: 'on-hold' },
        ],
      }))
      toast.success('Candidate placed on hold')
    },
    [patchApp, actor]
  )

  const resumeApplication = useCallback(
    (id: string, stage: PipelineStage) => {
      patchApp(id, (a) => ({
        ...a,
        status: stage,
        heldFromStage: undefined,
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: 'on-hold', to: stage },
        ],
      }))
      toast.success(`Candidate resumed into ${stage}`)
    },
    [patchApp, actor]
  )

  const cancelApplication = useCallback(
    (id: string, reason: string) => {
      patchApp(id, (a) => ({
        ...a,
        status: 'cancelled',
        rejectionReason: reason,
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: String(a.status), to: 'cancelled', note: reason },
        ],
      }))
      toast.success('Candidature cancelled — retained in the Cancelled view')
    },
    [patchApp, actor]
  )

  /**
   * Schedule interviews for one or many candidates with calendar-conflict
   * detection across the pipeline (TA-08, TA-42).
   */
  const scheduleInterviews = useCallback(
    (
      ids: string[],
      details: {
        roundName: string
        round: number
        panel: string[]
        date: string
        time: string
        mode: Interview['mode']
      }
    ) => {
      const busy = applications
        .flatMap((a) => a.interviews)
        .filter(
          (iv) =>
            iv.status === 'scheduled' &&
            iv.date === details.date &&
            iv.time === details.time
        )
        .flatMap((iv) => iv.panel)
      const conflicted = details.panel.filter((m) => busy.includes(m))
      ids.forEach((id) => {
        patchApp(id, (a) => ({
          ...a,
          interviews: [
            ...a.interviews,
            {
              id: newId('iv'),
              round: details.round,
              roundName: details.roundName,
              panel: details.panel,
              date: details.date,
              time: details.time,
              mode: details.mode,
              status: 'scheduled',
              conflict:
                conflicted.length > 0
                  ? `Calendar conflict: ${conflicted.join(', ')} already booked at ${details.time}`
                  : undefined,
            },
          ],
        }))
      })
      logEngine(
        'workflow',
        ids.length > 1 ? 'Mass interviews scheduled' : 'Interview scheduled',
        `${ids.length} candidate(s), round "${details.roundName}" on ${details.date} ${details.time}; calendar invites sent to ${details.panel.join(', ')}`
      )
      details.panel.forEach((m) => notify('Interview scheduled', m))
      if (conflicted.length > 0)
        toast.warning(
          `Scheduled with conflicts — ${conflicted.join(', ')} already booked at ${details.time}`
        )
      else
        toast.success(
          ids.length > 1
            ? `Interviews scheduled for ${ids.length} candidates`
            : 'Interview scheduled — calendar entries created'
        )
    },
    [applications, patchApp, logEngine, notify]
  )

  /** Structured scorecard submission, attributed + timestamped (TA-09, TA-44). */
  const submitScorecard = useCallback(
    (id: string, scorecard: Omit<Scorecard, 'id' | 'submittedAt'>) => {
      patchApp(id, (a) => ({
        ...a,
        scorecards: [
          ...a.scorecards,
          { ...scorecard, id: newId('sc'), submittedAt: new Date().toISOString() },
        ],
        interviews: a.interviews.map((iv) =>
          iv.round === scorecard.round && iv.status === 'scheduled'
            ? { ...iv, status: 'completed' }
            : iv
        ),
      }))
      toast.success(
        `Scorecard submitted for round ${scorecard.round} — visible to the hiring manager`
      )
    },
    [patchApp]
  )

  const addReferenceCheck = useCallback(
    (id: string, draft: Omit<ReferenceCheck, 'id' | 'status'>) => {
      patchApp(id, (a) => ({
        ...a,
        referenceChecks: [
          ...a.referenceChecks,
          { ...draft, id: newId('rf'), status: 'pending' },
        ],
      }))
      toast.success('Reference added — flagged pending until completed')
    },
    [patchApp]
  )

  const completeReferenceCheck = useCallback(
    (
      id: string,
      refId: string,
      outcome: NonNullable<ReferenceCheck['outcome']>,
      notes: string
    ) => {
      patchApp(id, (a) => ({
        ...a,
        referenceChecks: a.referenceChecks.map((r) =>
          r.id === refId ? { ...r, status: 'completed', outcome, notes } : r
        ),
      }))
      toast.success('Reference feedback documented')
    },
    [patchApp]
  )

  /** Record pre-onboarding checklist responses (TA-51). */
  const saveChecklist = useCallback(
    (id: string, checklist: Record<string, string>) => {
      patchApp(id, (a) => ({ ...a, checklist }))
      toast.success('Pre-onboarding checklist saved')
    },
    [patchApp]
  )

  return {
    candidates,
    applications,
    addCandidate,
    assignFolders,
    setReviewStatus,
    bulkImport,
    runMailboxImport,
    applyToRequisition,
    advanceStage,
    rejectApplication,
    holdApplication,
    resumeApplication,
    cancelApplication,
    scheduleInterviews,
    submitScorecard,
    addReferenceCheck,
    completeReferenceCheck,
    saveChecklist,
    patchApp,
  }
}

export type CandidatesStore = ReturnType<typeof useCandidates>
