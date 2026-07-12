import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import type { EngineLogEntry } from '../data/config'
import {
  PIPELINE_STAGES,
  seedApplications,
  seedCandidates,
  type Application,
  type ApplicationStatus,
  type Candidate,
  type Interview,
  type PipelineStage,
  type ReferenceCheck,
  type Scorecard,
} from '../data/candidates'
import type { ReferenceAnswer } from '../data/reference-questions'

export type CandidateDraft = Omit<
  Candidate,
  'id' | 'addedAt' | 'reviewStatus'
>

export interface BulkFileResult {
  file: string
  ok: boolean
  reason?: string
}

/** Kensium candidate-shortlisting form — the 15-pointer resume-bank field set. */
export interface ShortlistForm {
  name: string
  email: string
  phone: string
  gender: Candidate['gender']
  referredBy: string
  /** Profile-image file name (demo — stored nowhere beyond the form). */
  image: string
  address: string
  experienceYears: number
  currentCtc: number
  expectedCtc: number
  qualification: string
  appliedForVacancy: boolean
  vacancyId: string | null
  /** Requisition backing the picked vacancy (when appliedForVacancy). */
  requisitionId: string | null
  requisitionTitle: string
  /** Position tag when parked in the pool instead of applied to a vacancy. */
  positionTitle: string
  noticePeriodDays: number
  resume: string
  channelSource: string
}

/** Extra reference-check capture from the questionnaire dialog. */
export interface ReferenceCheckExtras {
  contactEmail?: string
  contactPhone?: string
  answers?: ReferenceAnswer[]
  uploadedDocument?: string
}

/** Statuses that still count as "in an active hiring process". */
const ACTIVE_APP_STATUSES: ApplicationStatus[] = [
  ...PIPELINE_STAGES.filter((s) => s !== 'hired'),
  'on-hold',
]

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

  /**
   * Add with tenant-level uniqueness enforcement on email/phone (TA-05,
   * TA-24). Re-uploading a resume for an existing profile overwrites the
   * stored file instead of creating a duplicate (Kensium Resume Bank).
   */
  const addCandidate = useCallback(
    (draft: CandidateDraft): Candidate | null => {
      const duplicate = candidates.find(
        (c) =>
          c.email.toLowerCase() === draft.email.toLowerCase() ||
          c.phone.replace(/\s/g, '') === draft.phone.replace(/\s/g, '')
      )
      if (duplicate) {
        if (draft.resume && draft.resume !== duplicate.resume) {
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === duplicate.id ? { ...c, resume: draft.resume } : c
            )
          )
          toast.info(
            `${duplicate.name} already exists — resume overwritten with ${draft.resume}`
          )
          return null
        }
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

  /**
   * Bulk resume ingestion against a requisition (TA-33). A file matching an
   * existing profile's resume overwrites it instead of creating a duplicate.
   */
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
        if (candidates.some((c) => c.resume === f.name))
          return {
            file: f.name,
            ok: true,
            reason: 'Existing profile — resume overwritten',
          }
        return { file: f.name, ok: true }
      })
      const imported = results.filter((r) => r.ok && !r.reason)
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
          gender: '',
          referredBy: '',
          address: '',
          experienceYears: 0,
          currentCtc: 0,
          expectedCtc: 0,
          qualification: '',
          noticePeriodDays: 30,
          channelSource: 'Bulk Upload',
          appliedForVacancy: true,
          vacancyId: null,
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
    [actor, candidates, logEngine]
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
      gender: '',
      referredBy: '',
      address: '',
      experienceYears: 0,
      currentCtc: 0,
      expectedCtc: 0,
      qualification: '',
      noticePeriodDays: 30,
      channelSource: 'applications@ mailbox',
      appliedForVacancy: false,
      vacancyId: null,
    }
    setCandidates((prev) => [candidate, ...prev])
    toast.success(
      'Mailbox polled — 1 application imported with resume attached; message deleted per settings'
    )
  }, [])

  /**
   * Kensium candidate shortlisting — updates the resume-bank profile with the
   * full form and either opens a shortlisted application against the picked
   * vacancy or parks the profile in the pool tagged to a position. A candidate
   * already in an active hiring process cannot be shortlisted again.
   */
  const shortlistCandidate = useCallback(
    (candidateId: string, form: ShortlistForm): boolean => {
      const candidate = candidates.find((c) => c.id === candidateId)
      if (!candidate) return false
      if (form.appliedForVacancy) {
        const active = applications.find(
          (a) =>
            a.candidateId === candidateId &&
            ACTIVE_APP_STATUSES.includes(a.status)
        )
        if (active) {
          toast.error(
            `${candidate.name} is already in process for ${active.requisitionTitle} — cannot be shortlisted for another vacancy`
          )
          return false
        }
        if (!form.requisitionId) {
          toast.error('Pick a vacancy / requisition to shortlist against')
          return false
        }
      }
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                name: form.name,
                email: form.email,
                phone: form.phone,
                gender: form.gender,
                referredBy: form.referredBy,
                address: form.address,
                experienceYears: form.experienceYears,
                currentCtc: form.currentCtc,
                expectedCtc: form.expectedCtc,
                qualification: form.qualification,
                noticePeriodDays: form.noticePeriodDays,
                // Re-uploaded resume overwrites the stored file.
                resume: form.resume,
                channelSource: form.channelSource,
                appliedForVacancy: form.appliedForVacancy,
                vacancyId: form.appliedForVacancy ? form.vacancyId : null,
                linkedRequisitionId: form.appliedForVacancy
                  ? form.requisitionId
                  : c.linkedRequisitionId,
                reviewStatus: 'reviewed',
                folders:
                  !form.appliedForVacancy && form.positionTitle
                    ? [...new Set([...c.folders, form.positionTitle])]
                    : c.folders,
              }
            : c
        )
      )
      if (form.appliedForVacancy && form.requisitionId) {
        setApplications((prev) => [
          {
            id: newId('app'),
            candidateId,
            candidateName: form.name,
            candidateEmail: form.email,
            requisitionId: form.requisitionId as string,
            requisitionTitle: form.requisitionTitle,
            status: 'shortlisted',
            resume: form.resume,
            appliedAt: today(),
            preScreenScore: null,
            interviews: [],
            scorecards: [],
            referenceChecks: [],
            stageHistory: [
              { at: today(), actor, from: '—', to: 'applied' },
              {
                at: today(),
                actor,
                from: 'applied',
                to: 'shortlisted',
                note: 'Shortlisted from resume bank',
              },
            ],
            checklist: {},
          },
          ...prev,
        ])
        notify('You have been shortlisted', form.email)
        toast.success(
          `${form.name} shortlisted for ${form.requisitionTitle}`
        )
      } else {
        toast.success(
          `${form.name} kept in the talent pool${form.positionTitle ? ` tagged to ${form.positionTitle}` : ''}`
        )
      }
      return true
    },
    [actor, applications, candidates, notify]
  )

  /**
   * Mass delete from the resume bank — candidates in an active hiring
   * process are skipped and reported (Kensium Mass Delete).
   */
  const massDeleteCandidates = useCallback(
    (ids: string[]) => {
      const inProcess = candidates.filter(
        (c) =>
          ids.includes(c.id) &&
          applications.some(
            (a) =>
              a.candidateId === c.id && ACTIVE_APP_STATUSES.includes(a.status)
          )
      )
      const deletable = ids.filter(
        (id) => !inProcess.some((c) => c.id === id)
      )
      setCandidates((prev) => prev.filter((c) => !deletable.includes(c.id)))
      if (inProcess.length > 0)
        toast.warning(
          `Deleted ${deletable.length} — skipped ${inProcess.map((c) => c.name).join(', ')} (in an active hiring process)`
        )
      else
        toast.success(
          `${deletable.length} candidate${deletable.length === 1 ? '' : 's'} deleted from the resume bank`
        )
    },
    [applications, candidates]
  )

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
    (id: string, target: PipelineStage, note?: string): boolean => {
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
          !app.referenceChecks.some((r) => r.status === 'completed') ||
          app.referenceChecks.some((r) => r.status === 'pending')
        )
          failures.push('all reference checks resolved (at least one completed)')
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
          { at: today(), actor, from: current, to: target, note },
        ],
      }))
      logEngine(
        'rules',
        'Stage gate evaluated',
        `${id} → ${target}: entry conditions met — ALLOW`
      )
      publishAuditEvent({
        module: 'Recruitment',
        action: `Candidate advanced to ${target}`,
        actor,
        actionType: 'update',
        recordId: id,
        recordName: app.candidateName,
        changes: [
          { field: 'Hiring stage', previousValue: current, newValue: target },
          ...(note
            ? [{ field: 'Decision basis', previousValue: null, newValue: note }]
            : []),
        ],
      })
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
      if (app) {
        notify('Application closed', app.candidateEmail)
        publishAuditEvent({
          module: 'Recruitment',
          action: 'Candidate rejected',
          actor,
          actionType: 'update',
          recordId: id,
          recordName: app.candidateName,
          changes: [
            { field: 'Hiring stage', previousValue: String(app.status), newValue: 'rejected' },
            { field: 'Reason', previousValue: null, newValue: reason },
          ],
        })
      }
      toast.success('Candidate closed with reason recorded')
    },
    [applications, patchApp, notify, actor]
  )

  /** Pause / resume progression without losing history (TA-45). */
  const holdApplication = useCallback(
    (id: string, note?: string) => {
      const app = applications.find((a) => a.id === id)
      patchApp(id, (a) => ({
        ...a,
        heldFromStage: a.status as PipelineStage,
        status: 'on-hold',
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor, from: String(a.status), to: 'on-hold', note },
        ],
      }))
      if (app)
        publishAuditEvent({
          module: 'Recruitment',
          action: 'Candidate placed on hold',
          actor,
          actionType: 'update',
          recordId: id,
          recordName: app.candidateName,
          changes: [
            { field: 'Hiring stage', previousValue: String(app.status), newValue: 'on-hold' },
            ...(note
              ? [{ field: 'Decision basis', previousValue: null, newValue: note }]
              : []),
          ],
        })
      toast.success('Candidate placed on hold')
    },
    [applications, patchApp, actor]
  )

  /**
   * Revive an on-hold candidate into a different open vacancy — the original
   * application keeps its full history and the candidate re-enters the new
   * vacancy's pipeline at the review stage (PRD T3 edge case).
   */
  const reviveIntoVacancy = useCallback(
    (
      id: string,
      vacancy: { code: string; rrfId: string; position: string }
    ) => {
      const app = applications.find((a) => a.id === id)
      if (!app || app.status !== 'on-hold') return
      patchApp(id, (a) => ({
        ...a,
        status: 'cancelled',
        rejectionReason: `Revived into ${vacancy.position} (${vacancy.code})`,
        stageHistory: [
          ...a.stageHistory,
          {
            at: today(),
            actor,
            from: 'on-hold',
            to: 'cancelled',
            note: `Revived into ${vacancy.position} (${vacancy.code}) — full history retained here`,
          },
        ],
      }))
      setApplications((prev) => [
        {
          id: newId('app'),
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          candidateEmail: app.candidateEmail,
          requisitionId: vacancy.rrfId,
          requisitionTitle: vacancy.position,
          status: 'applied',
          resume: app.resume,
          appliedAt: today(),
          preScreenScore: app.preScreenScore,
          interviews: [],
          scorecards: [],
          referenceChecks: [],
          stageHistory: [
            {
              at: today(),
              actor,
              from: 'on-hold',
              to: 'applied',
              note: `Revived from on-hold — originally applied for ${app.requisitionTitle}`,
            },
          ],
          checklist: {},
        },
        ...prev,
      ])
      publishAuditEvent({
        module: 'Recruitment',
        action: 'On-hold candidate revived into vacancy',
        actor,
        actionType: 'update',
        recordId: id,
        recordName: app.candidateName,
        changes: [
          {
            field: 'Vacancy',
            previousValue: app.requisitionTitle,
            newValue: `${vacancy.position} (${vacancy.code})`,
          },
          { field: 'Hiring stage', previousValue: 'on-hold', newValue: 'applied' },
        ],
      })
      notify('Your application is being considered for a new opening', app.candidateEmail)
      toast.success(
        `${app.candidateName} revived into ${vacancy.position} — now in review`
      )
    },
    [applications, patchApp, actor, notify]
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
   * detection across the pipeline (TA-08, TA-42). Guards: a round skipped for
   * a candidate cannot be scheduled again, and a round with submitted
   * feedback (scorecard) cannot be rescheduled.
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
        comments?: string
        emailCandidate?: boolean
        emailSubject?: string
        emailBody?: string
      }
    ) => {
      // Round-level guards, evaluated per candidate.
      const skippedFor = applications.filter(
        (a) =>
          ids.includes(a.id) &&
          a.interviews.some((iv) => iv.round === details.round && iv.skipped)
      )
      const lockedFor = applications.filter(
        (a) =>
          ids.includes(a.id) &&
          a.scorecards.some((s) => s.round === details.round)
      )
      skippedFor.forEach((a) =>
        toast.error(
          `Round ${details.round} was skipped for ${a.candidateName} — it cannot be scheduled again`
        )
      )
      lockedFor.forEach((a) =>
        toast.error(
          `Feedback already submitted for round ${details.round} of ${a.candidateName} — it cannot be rescheduled`
        )
      )
      const eligible = ids.filter(
        (id) =>
          !skippedFor.some((a) => a.id === id) &&
          !lockedFor.some((a) => a.id === id)
      )
      if (eligible.length === 0) return

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
      eligible.forEach((id) => {
        patchApp(id, (a) => ({
          ...a,
          // Rescheduling a round replaces the previous booking for it.
          interviews: [
            ...a.interviews.filter(
              (iv) =>
                !(iv.round === details.round && iv.status === 'scheduled')
            ),
            {
              id: newId('iv'),
              round: details.round,
              roundName: details.roundName,
              panel: details.panel,
              date: details.date,
              time: details.time,
              mode: details.mode,
              status: 'scheduled',
              comments: details.comments || undefined,
              emailCandidate: details.emailCandidate,
              emailSubject: details.emailCandidate
                ? details.emailSubject
                : undefined,
              emailBody: details.emailCandidate ? details.emailBody : undefined,
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
        eligible.length > 1 ? 'Mass interviews scheduled' : 'Interview scheduled',
        `${eligible.length} candidate(s), round "${details.roundName}" on ${details.date} ${details.time}; calendar invites sent to ${details.panel.join(', ')}`
      )
      details.panel.forEach((m) => notify('Interview scheduled', m))
      if (details.emailCandidate)
        applications
          .filter((a) => eligible.includes(a.id))
          .forEach((a) =>
            notify(details.emailSubject ?? 'Interview scheduled', a.candidateEmail)
          )
      if (conflicted.length > 0)
        toast.warning(
          `Scheduled with conflicts — ${conflicted.join(', ')} already booked at ${details.time}`
        )
      else
        toast.success(
          eligible.length > 1
            ? `Interviews scheduled for ${eligible.length} candidates`
            : 'Interview scheduled — calendar entries created'
        )
    },
    [applications, patchApp, logEngine, notify]
  )

  /**
   * Skip an interview round for a candidate (Kensium Scheduling Interview).
   * A skipped round is recorded and can never be scheduled afterwards; a
   * round with submitted feedback cannot be skipped.
   */
  const skipRound = useCallback(
    (applicationId: string, round: number, roundName?: string) => {
      const app = applications.find((a) => a.id === applicationId)
      if (!app) return
      if (app.scorecards.some((s) => s.round === round)) {
        toast.error(
          `Feedback already submitted for round ${round} — it cannot be skipped`
        )
        return
      }
      if (app.interviews.some((iv) => iv.round === round && iv.skipped)) {
        toast.error(`Round ${round} is already skipped for ${app.candidateName}`)
        return
      }
      patchApp(applicationId, (a) => {
        const existing = a.interviews.find(
          (iv) => iv.round === round && iv.status === 'scheduled'
        )
        return {
          ...a,
          interviews: existing
            ? a.interviews.map((iv) =>
                iv.id === existing.id
                  ? { ...iv, status: 'cancelled', skipped: true }
                  : iv
              )
            : [
                ...a.interviews,
                {
                  id: newId('iv'),
                  round,
                  roundName: roundName ?? `Round ${round}`,
                  panel: [],
                  date: today(),
                  time: '—',
                  mode: 'Video',
                  status: 'cancelled',
                  skipped: true,
                },
              ],
        }
      })
      logEngine(
        'workflow',
        'Interview round skipped',
        `${applicationId}: round ${round}${roundName ? ` (${roundName})` : ''} skipped for ${app.candidateName}; further scheduling blocked`
      )
      toast.success(
        `Round ${round} skipped for ${app.candidateName} — it cannot be scheduled again`
      )
    },
    [applications, patchApp, logEngine]
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
      const isEmail = draft.mode === 'Email'
      patchApp(id, (a) => ({
        ...a,
        referenceChecks: [
          ...a.referenceChecks,
          {
            ...draft,
            id: newId('rf'),
            status: 'pending',
            requestSentAt: isEmail ? today() : undefined,
          },
        ],
      }))
      toast.success(
        isEmail
          ? `Reference request sent to ${draft.referee} — awaiting reply`
          : 'Reference added — record the call notes once completed'
      )
    },
    [patchApp]
  )

  /** Email reference never replied — resolved without an outcome. */
  const markReferenceNoResponse = useCallback(
    (id: string, refId: string) => {
      patchApp(id, (a) => ({
        ...a,
        referenceChecks: a.referenceChecks.map((r) =>
          r.id === refId ? { ...r, status: 'no-response' } : r
        ),
      }))
      toast.info('Reference marked as no response — it no longer blocks the offer')
    },
    [patchApp]
  )

  const completeReferenceCheck = useCallback(
    (
      id: string,
      refId: string,
      outcome: NonNullable<ReferenceCheck['outcome']>,
      notes: string,
      /** Contact details + questionnaire answers from the reference-check form. */
      extras?: ReferenceCheckExtras
    ) => {
      patchApp(id, (a) => ({
        ...a,
        referenceChecks: a.referenceChecks.map((r) =>
          r.id === refId
            ? { ...r, status: 'completed', outcome, notes, ...extras }
            : r
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
    shortlistCandidate,
    massDeleteCandidates,
    applyToRequisition,
    advanceStage,
    rejectApplication,
    holdApplication,
    resumeApplication,
    reviveIntoVacancy,
    cancelApplication,
    scheduleInterviews,
    skipRound,
    submitScorecard,
    addReferenceCheck,
    completeReferenceCheck,
    markReferenceNoResponse,
    saveChecklist,
    patchApp,
  }
}

export type CandidatesStore = ReturnType<typeof useCandidates>
