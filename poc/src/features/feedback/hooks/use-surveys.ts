import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  seedSurveyApprovers,
  seedSurveyParticipation,
  seedSurveyResponses,
  seedSurveySettings,
  seedSurveyTemplates,
  seedSurveys,
  type Survey,
  type SurveyAnswerValue,
  type SurveyApproverMapping,
  type SurveyEmailTemplate,
  type SurveyParticipant,
  type SurveyQuestion,
  type SurveyResponseRecord,
  type SurveySettings,
} from '../data/surveys'
import {
  summarizeSurveyAudience,
  type Audience,
} from '../data/survey-audience'
import { CURRENT_ADMIN, CURRENT_EMPLOYEE } from '../data/entries'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface SurveyDraft {
  title: string
  period: Survey['period']
  startDate: string
  endDate: string
  anonymous: boolean
  audience: Audience
  questions: SurveyQuestion[]
  status: Survey['status']
  description: string
}

export interface ApproverDraft {
  groupId: string
  location: string
  approvers: string[]
}

/** Audit hook-in for survey lifecycle moments (publish / close). */
function auditSurvey(action: string, survey: { id: string; title: string }, detail: string) {
  publishAuditEvent({
    module: 'Feedback & Grievance',
    action,
    actor: CURRENT_ADMIN,
    actorRole: 'Company Admin',
    entityType: 'Company',
    actionType: 'status-change',
    recordId: survey.id,
    recordName: `Survey — ${survey.title}`,
    changes: [{ field: action, previousValue: null, newValue: detail }],
  })
}

/**
 * In-memory Survey store (Configuration → Surveys): module Yes/No setup
 * (SET-01/02), location→approver mappings (SAP-01..03), survey email
 * templates, the survey catalog with questionnaire authoring, audience
 * targeting and lifecycle (publish → close), plus collected responses with
 * participation tracked separately from answers — all with sonner toasts,
 * per the module idiom.
 */
export function useSurveys() {
  const [settings, setSettings] = useState<SurveySettings>(seedSurveySettings)
  const [approvers, setApprovers] = useState<SurveyApproverMapping[]>(seedSurveyApprovers)
  const [templates, setTemplates] = useState<SurveyEmailTemplate[]>(seedSurveyTemplates)
  const [surveys, setSurveys] = useState<Survey[]>(seedSurveys)
  const [responses, setResponses] = useState<SurveyResponseRecord[]>(seedSurveyResponses)
  const [participation, setParticipation] = useState<Record<string, SurveyParticipant[]>>(
    seedSurveyParticipation
  )
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toLocaleTimeString()
  )

  /** Setup step: persist the Survey Module Yes/No choice (SET-02). */
  const saveSettings = useCallback((moduleEnabled: boolean) => {
    setSettings({ moduleEnabled, savedOn: today(), savedBy: CURRENT_ADMIN })
    toast.success('Survey Module configuration saved', {
      description: `Survey features are now ${moduleEnabled ? 'enabled' : 'disabled'} for this company.`,
    })
    return true
  }, [])

  /** Add a location→approver mapping (SAP-01/03). */
  const addApprover = useCallback(
    (draft: ApproverDraft) => {
      if (approvers.some((a) => a.location === draft.location)) {
        toast.error('Location already mapped', {
          description: `${draft.location} already has an approver group. Edit the existing mapping instead.`,
        })
        return false
      }
      setApprovers((prev) => [...prev, { id: `sap-${Date.now()}`, ...draft }])
      toast.success('Survey approver added', {
        description: `${draft.approvers.join(', ')} will approve surveys for ${draft.location}.`,
      })
      return true
    },
    [approvers]
  )

  /** Edit an existing mapping (SAP-03). */
  const updateApprover = useCallback(
    (id: string, draft: ApproverDraft) => {
      if (approvers.some((a) => a.id !== id && a.location === draft.location)) {
        toast.error('Location already mapped', {
          description: `${draft.location} is covered by another approver group.`,
        })
        return false
      }
      setApprovers((prev) => prev.map((a) => (a.id === id ? { ...a, ...draft } : a)))
      toast.success('Survey approver updated', {
        description: `Mapping for ${draft.location} saved.`,
      })
      return true
    },
    [approvers]
  )

  const removeApprover = useCallback(
    (id: string) => {
      const target = approvers.find((a) => a.id === id)
      setApprovers((prev) => prev.filter((a) => a.id !== id))
      if (target) {
        toast.success('Survey approver removed', {
          description: `${target.location} (${target.groupId}) no longer routes survey approvals.`,
        })
      }
    },
    [approvers]
  )

  /** Survey email templates (SAP-04 navigation target). */
  const saveTemplate = useCallback((id: string, subject: string, body: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, subject, body, updatedOn: today() } : t))
    )
    toast.success('Survey template saved', {
      description: 'Subsequent survey notifications will use the updated wording.',
    })
  }, [])

  /** Create a survey (SVL-01) with its questionnaire and target audience. */
  const addSurvey = useCallback((draft: SurveyDraft) => {
    const survey: Survey = {
      id: `svy-${Date.now()}`,
      ...draft,
      applicability: summarizeSurveyAudience(draft.audience),
      createdBy: CURRENT_ADMIN,
      publishedOn: draft.status === 'Published' ? today() : null,
    }
    setSurveys((prev) => [survey, ...prev])
    if (draft.status === 'Published') {
      auditSurvey('Survey published', survey, 'Published and accepting responses')
    }
    toast.success('Survey created', {
      description:
        draft.status === 'Pending Approval'
          ? `"${draft.title}" was routed to the survey approvers for its locations.`
          : `"${draft.title}" saved as ${draft.status} with ${draft.questions.length} question(s).`,
    })
  }, [])

  const updateSurvey = useCallback((id: string, draft: SurveyDraft) => {
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const next: Survey = {
          ...s,
          ...draft,
          // Anonymity is locked once a survey has been published —
          // responses may already exist under that promise.
          anonymous: s.publishedOn ? s.anonymous : draft.anonymous,
          applicability: summarizeSurveyAudience(draft.audience),
          publishedOn:
            draft.status === 'Published' ? (s.publishedOn ?? today()) : s.publishedOn,
        }
        if (draft.status === 'Published' && s.status !== 'Published') {
          auditSurvey('Survey published', next, 'Published and accepting responses')
        }
        return next
      })
    )
    toast.success('Survey updated', { description: `"${draft.title}" saved.` })
  }, [])

  /** Lifecycle: release a survey to its audience (accepting responses). */
  const publishSurvey = useCallback(
    (id: string) => {
      const target = surveys.find((s) => s.id === id)
      if (!target) return
      setSurveys((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: 'Published', publishedOn: s.publishedOn ?? today() }
            : s
        )
      )
      auditSurvey('Survey published', target, 'Published and accepting responses')
      toast.success('Survey published', {
        description: `"${target.title}" is now open to its audience and accepting responses.`,
      })
    },
    [surveys]
  )

  /** Lifecycle: close a survey — results only, no new responses. */
  const closeSurvey = useCallback(
    (id: string) => {
      const target = surveys.find((s) => s.id === id)
      if (!target) return
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'Completed' } : s))
      )
      auditSurvey('Survey closed', target, 'Closed — results only, no new responses')
      toast.success('Survey closed', {
        description: `"${target.title}" no longer accepts responses. Results remain available.`,
      })
    },
    [surveys]
  )

  const deleteSurvey = useCallback(
    (id: string) => {
      const target = surveys.find((s) => s.id === id)
      setSurveys((prev) => prev.filter((s) => s.id !== id))
      setResponses((prev) => prev.filter((r) => r.surveyId !== id))
      setParticipation((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (target) {
        toast.success('Survey deleted', {
          description: `"${target.title}" was removed from the survey list.`,
        })
      }
    },
    [surveys]
  )

  /**
   * Record the signed-in employee's completed questionnaire. For anonymous
   * surveys the answers are stored without a name — only the separate
   * participation ledger records that the employee completed it.
   */
  const submitResponse = useCallback(
    (survey: Survey, answers: Record<string, SurveyAnswerValue>) => {
      const already = (participation[survey.id] ?? []).some(
        (p) => p.name === CURRENT_EMPLOYEE
      )
      if (already) {
        toast.error('Already responded', {
          description: `You have already completed "${survey.title}".`,
        })
        return false
      }
      setResponses((prev) => [
        ...prev,
        {
          id: `resp-${Date.now()}`,
          surveyId: survey.id,
          respondent: survey.anonymous ? null : CURRENT_EMPLOYEE,
          submittedOn: today(),
          answers,
        },
      ])
      setParticipation((prev) => ({
        ...prev,
        [survey.id]: [
          ...(prev[survey.id] ?? []),
          { name: CURRENT_EMPLOYEE, completedOn: today() },
        ],
      }))
      toast.success('Survey response submitted', {
        description: survey.anonymous
          ? `Your answers to "${survey.title}" were recorded anonymously — your name is kept separate from your answers.`
          : `Your response to "${survey.title}" was recorded for ${CURRENT_EMPLOYEE}.`,
      })
      return true
    },
    [participation]
  )

  /** Answer records collected for one survey. */
  const responsesFor = useCallback(
    (surveyId: string) => responses.filter((r) => r.surveyId === surveyId),
    [responses]
  )

  /** Completion ledger for one survey (chasing view). */
  const participantsFor = useCallback(
    (surveyId: string) => participation[surveyId] ?? [],
    [participation]
  )

  /** Re-pull the list (SVL-07) — in the POC this re-stamps the fetch time. */
  const refresh = useCallback(() => {
    const at = new Date().toLocaleTimeString()
    setLastRefreshedAt(at)
    toast.info('Survey list refreshed', {
      description: `Latest data as of ${at}.`,
    })
  }, [])

  return {
    settings,
    approvers,
    templates,
    surveys,
    responses,
    participation,
    lastRefreshedAt,
    saveSettings,
    addApprover,
    updateApprover,
    removeApprover,
    saveTemplate,
    addSurvey,
    updateSurvey,
    publishSurvey,
    closeSurvey,
    deleteSurvey,
    submitResponse,
    responsesFor,
    participantsFor,
    refresh,
  }
}

export type SurveysStore = ReturnType<typeof useSurveys>
