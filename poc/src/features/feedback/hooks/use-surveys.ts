import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedSurveyApprovers,
  seedSurveySettings,
  seedSurveyTemplates,
  seedSurveys,
  type Survey,
  type SurveyApproverMapping,
  type SurveyEmailTemplate,
  type SurveySettings,
} from '../data/surveys'
import { CURRENT_ADMIN } from '../data/entries'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface SurveyDraft {
  title: string
  period: Survey['period']
  startDate: string
  endDate: string
  anonymous: boolean
  applicability: string
  status: Survey['status']
  description: string
}

export interface ApproverDraft {
  groupId: string
  location: string
  approvers: string[]
}

/**
 * In-memory Survey configuration store (Configuration → Surveys): module
 * Yes/No setup (SET-01/02), location→approver mappings (SAP-01..03), survey
 * email templates, and the survey catalog with add/edit/delete and refresh
 * (SVL-01, SVL-07) — all with sonner toasts, per the module idiom.
 */
export function useSurveys() {
  const [settings, setSettings] = useState<SurveySettings>(seedSurveySettings)
  const [approvers, setApprovers] = useState<SurveyApproverMapping[]>(seedSurveyApprovers)
  const [templates, setTemplates] = useState<SurveyEmailTemplate[]>(seedSurveyTemplates)
  const [surveys, setSurveys] = useState<Survey[]>(seedSurveys)
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

  /** Create a survey (SVL-01). */
  const addSurvey = useCallback((draft: SurveyDraft) => {
    setSurveys((prev) => [
      {
        id: `svy-${Date.now()}`,
        ...draft,
        createdBy: CURRENT_ADMIN,
        publishedOn: draft.status === 'Published' ? today() : null,
      },
      ...prev,
    ])
    toast.success('Survey created', {
      description:
        draft.status === 'Pending Approval'
          ? `"${draft.title}" was routed to the survey approvers for its locations.`
          : `"${draft.title}" saved as ${draft.status}.`,
    })
  }, [])

  const updateSurvey = useCallback((id: string, draft: SurveyDraft) => {
    setSurveys((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...draft,
              publishedOn:
                draft.status === 'Published' ? (s.publishedOn ?? today()) : s.publishedOn,
            }
          : s
      )
    )
    toast.success('Survey updated', { description: `"${draft.title}" saved.` })
  }, [])

  const deleteSurvey = useCallback(
    (id: string) => {
      const target = surveys.find((s) => s.id === id)
      setSurveys((prev) => prev.filter((s) => s.id !== id))
      if (target) {
        toast.success('Survey deleted', {
          description: `"${target.title}" was removed from the survey list.`,
        })
      }
    },
    [surveys]
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
    lastRefreshedAt,
    saveSettings,
    addApprover,
    updateApprover,
    removeApprover,
    saveTemplate,
    addSurvey,
    updateSurvey,
    deleteSurvey,
    refresh,
  }
}

export type SurveysStore = ReturnType<typeof useSurveys>
