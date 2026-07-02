import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  defaultMailboxSettings,
  defaultRehireSelections,
  seedApproverGraphVersions,
  seedChecklistQuestions,
  seedCustomFields,
  seedEngineLog,
  seedGroupStandards,
  seedLetterTemplates,
  seedOfferApproverRules,
  seedPanels,
  seedPostingApproverRules,
  seedPostingChannels,
  seedPreInterviewQuestions,
  seedRecruiterStrengths,
  seedRequiredDocuments,
  seedRequisitionApproverRules,
  seedRoundsConfigs,
  seedScorecardCriteria,
  seedTenants,
  type ApproverGraphVersion,
  type AssignmentMethod,
  type ChecklistQuestion,
  type CustomFieldDef,
  type EngineLogEntry,
  type InterviewPanel,
  type LetterTemplate,
  type MailboxSettings,
  type OfferApproverRule,
  type PostingApproverRule,
  type PostingChannel,
  type PreInterviewQuestion,
  type RecruiterStrength,
  type RequiredDocument,
  type RequisitionApproverRule,
  type RoundsConfig,
  type ScorecardCriterion,
  type Tenant,
} from '../data/config'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 6)}`
}

/**
 * In-memory recruitment configuration store — governed metadata read by the
 * shared workflow / rules / notification / forms engines (TA-25…TA-30) plus
 * every Kensium-style configuration screen (TA-35…TA-56). Also owns the
 * append-only engine log so domain hooks can record engine activity.
 */
export function useRecruitmentConfig() {
  const [engineLog, setEngineLog] = useState<EngineLogEntry[]>(seedEngineLog)
  const [letterTemplates, setLetterTemplates] =
    useState<LetterTemplate[]>(seedLetterTemplates)
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>(
    seedScorecardCriteria
  )
  const [criteriaVersion, setCriteriaVersion] = useState(2)
  const [panels, setPanels] = useState<InterviewPanel[]>(seedPanels)
  const [roundsConfigs, setRoundsConfigs] =
    useState<RoundsConfig[]>(seedRoundsConfigs)
  const [preInterviewQuestions, setPreInterviewQuestions] = useState<
    PreInterviewQuestion[]
  >(seedPreInterviewQuestions)
  const [postingChannels, setPostingChannels] =
    useState<PostingChannel[]>(seedPostingChannels)
  const [postingApproverRules, setPostingApproverRules] = useState<
    PostingApproverRule[]
  >(seedPostingApproverRules)
  const [assignmentMethod, setAssignmentMethodState] =
    useState<AssignmentMethod>('manual')
  const [offerApproverRules, setOfferApproverRules] = useState<
    OfferApproverRule[]
  >(seedOfferApproverRules)
  const [outOfBandApprover, setOutOfBandApprover] = useState('Rohit Bansal')
  const [requisitionApproverRules, setRequisitionApproverRules] = useState<
    RequisitionApproverRule[]
  >(seedRequisitionApproverRules)
  const [nonBudgetedApprover, setNonBudgetedApprover] =
    useState('Priya Deshmukh')
  const [preJoiningHrApprovers, setPreJoiningHrApprovers] = useState<string[]>([
    'Sunita Patil',
  ])
  const [preJoiningNetworkApprovers, setPreJoiningNetworkApprovers] = useState<
    string[]
  >(['Farhan Ali'])
  const [requiredDocsEnabled, setRequiredDocsEnabled] = useState(true)
  const [requiredDocuments, setRequiredDocuments] = useState<
    RequiredDocument[]
  >(seedRequiredDocuments)
  const [rehireSelections, setRehireSelections] = useState<
    Record<string, string[]>
  >(defaultRehireSelections)
  const [recruiterStrengths, setRecruiterStrengths] = useState<
    RecruiterStrength[]
  >(seedRecruiterStrengths)
  const [mailbox, setMailbox] = useState<MailboxSettings>(
    defaultMailboxSettings
  )
  const [checklistQuestions, setChecklistQuestions] = useState<
    ChecklistQuestion[]
  >(seedChecklistQuestions)
  const [customFields, setCustomFields] =
    useState<CustomFieldDef[]>(seedCustomFields)
  const [approverGraphVersions, setApproverGraphVersions] = useState<
    ApproverGraphVersion[]
  >(seedApproverGraphVersions)
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants)
  const [groupStandards] = useState(seedGroupStandards)

  /** Append an entry to the shared engine log (TA-27…TA-30). */
  const logEngine = useCallback(
    (engine: EngineLogEntry['engine'], event: string, detail: string) => {
      setEngineLog((prev) => [
        {
          id: newId('el'),
          at: new Date().toISOString(),
          engine,
          event,
          detail,
          actor: `${engine[0].toUpperCase()}${engine.slice(1)} Engine`,
        },
        ...prev,
      ])
    },
    []
  )

  /** Render + dispatch a templated notification (TA-29). */
  const notify = useCallback(
    (event: string, recipient: string, channel: 'Email' | 'In-app' = 'Email') => {
      logEngine(
        'notification',
        event,
        `Template "${event}" rendered and dispatched to ${recipient} (${channel})`
      )
    },
    [logEngine]
  )

  const addLetterTemplate = useCallback(
    (draft: Omit<LetterTemplate, 'id' | 'version'>) => {
      setLetterTemplates((prev) => [
        { ...draft, id: newId('tpl'), version: 1 },
        ...prev,
      ])
      toast.success(`Template "${draft.name}" saved`)
    },
    []
  )

  const toggleLetterTemplate = useCallback((id: string) => {
    setLetterTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    )
  }, [])

  const updateLetterTemplate = useCallback(
    (id: string, content: string) => {
      setLetterTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, content, version: t.version + 1 } : t
        )
      )
      toast.success(
        'Template updated — existing generated offers retain their prior version'
      )
    },
    []
  )

  const saveCriteria = useCallback(
    (next: ScorecardCriterion[]) => {
      setCriteria(next)
      setCriteriaVersion((v) => v + 1)
      logEngine(
        'forms',
        'Scorecard criteria republished',
        'Subsequent interviews use the new criteria; completed scorecards retain the version in effect when submitted'
      )
      toast.success('Scorecard criteria saved as a new version')
    },
    [logEngine]
  )

  const addPanel = useCallback((name: string, members: string[]) => {
    setPanels((prev) => [{ id: newId('pn'), name, members }, ...prev])
    toast.success(`Panel "${name}" defined`)
  }, [])

  const updatePanelMembers = useCallback((id: string, members: string[]) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, members } : p)))
    toast.success('Panel membership updated — reflected in scheduling')
  }, [])

  const addRoundsConfig = useCallback((draft: Omit<RoundsConfig, 'id'>) => {
    setRoundsConfigs((prev) => [{ ...draft, id: newId('rc') }, ...prev])
    toast.success(`Interview rounds "${draft.name}" saved`)
  }, [])

  const addPreInterviewQuestion = useCallback(
    (draft: Omit<PreInterviewQuestion, 'id'>) => {
      setPreInterviewQuestions((prev) => [
        { ...draft, id: newId('pq') },
        ...prev,
      ])
      toast.success('Pre-interview question added')
    },
    []
  )

  const addPostingChannel = useCallback(
    (draft: Omit<PostingChannel, 'id' | 'active'>) => {
      setPostingChannels((prev) => [
        { ...draft, id: newId('ch'), active: true },
        ...prev,
      ])
      toast.success(`Posting channel "${draft.name}" added`)
    },
    []
  )

  const togglePostingChannel = useCallback((id: string) => {
    setPostingChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    )
  }, [])

  const addPostingApproverRule = useCallback(
    (draft: Omit<PostingApproverRule, 'id'>) => {
      setPostingApproverRules((prev) => [
        { ...draft, id: newId('pa') },
        ...prev,
      ])
      toast.success('Posting-source approver rule saved')
    },
    []
  )

  const setAssignmentMethod = useCallback(
    (method: AssignmentMethod) => {
      setAssignmentMethodState(method)
      logEngine(
        'rules',
        'Vacancy assignment method changed',
        `Subsequent vacancy assignments follow "${method}"; existing assignments unaffected`
      )
      toast.success(`Vacancy assignment method set to ${method}`)
    },
    [logEngine]
  )

  const addOfferApproverRule = useCallback(
    (draft: Omit<OfferApproverRule, 'id'>) => {
      setOfferApproverRules((prev) => [{ ...draft, id: newId('oa') }, ...prev])
      toast.success('Offer approver rule saved')
    },
    []
  )

  const addRequisitionApproverRule = useCallback(
    (draft: Omit<RequisitionApproverRule, 'id'>) => {
      setRequisitionApproverRules((prev) => [
        { ...draft, id: newId('ra') },
        ...prev,
      ])
      toast.success('Resource-requisition approver rule saved')
    },
    []
  )

  const addRequiredDocument = useCallback(
    (draft: Omit<RequiredDocument, 'id'>) => {
      setRequiredDocuments((prev) => [{ ...draft, id: newId('doc') }, ...prev])
      toast.success(`Required document "${draft.name}" saved`)
    },
    []
  )

  const saveRehireTab = useCallback((tab: string, fields: string[]) => {
    setRehireSelections((prev) => ({ ...prev, [tab]: fields }))
    toast.success(`Rehire settings saved for ${tab}`)
  }, [])

  const addRecruiterStrength = useCallback(
    (draft: Omit<RecruiterStrength, 'id'>) => {
      setRecruiterStrengths((prev) => [{ ...draft, id: newId('rs') }, ...prev])
      toast.success('Recruiter strengths recorded')
    },
    []
  )

  const saveMailbox = useCallback((next: MailboxSettings) => {
    setMailbox(next)
    toast.success(
      `Mailbox settings saved — polling every ${next.checkingIntervalMins} minutes`
    )
  }, [])

  const addChecklistQuestion = useCallback(
    (draft: Omit<ChecklistQuestion, 'id'>) => {
      setChecklistQuestions((prev) => [{ ...draft, id: newId('cq') }, ...prev])
      toast.success('Checklist question added')
    },
    []
  )

  const addCustomField = useCallback(
    (draft: Omit<CustomFieldDef, 'id' | 'version' | 'active' | 'effectiveFrom'>) => {
      setCustomFields((prev) => [
        {
          ...draft,
          id: newId('cf'),
          version: 1,
          active: true,
          effectiveFrom: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      logEngine(
        'forms',
        `Custom field "${draft.label}" published`,
        `Renders on ${draft.entity} forms without a code change; change is effective-dated and auditable`
      )
      toast.success(`Custom field "${draft.label}" added`)
    },
    [logEngine]
  )

  const retireCustomField = useCallback((id: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: false } : f))
    )
    toast.success(
      'Field retired — new records omit it; historical records keep captured values'
    )
  }, [])

  const publishApproverGraph = useCallback(
    (summary: string, author: string) => {
      setApproverGraphVersions((prev) => {
        const nextVersion = Math.max(...prev.map((v) => v.version)) + 1
        return [
          ...prev.map((v) =>
            v.status === 'active'
              ? { ...v, status: 'superseded' as const }
              : v
          ),
          {
            version: nextVersion,
            author,
            effectiveFrom: new Date().toISOString().slice(0, 10),
            summary,
            status: 'active' as const,
          },
        ]
      })
      logEngine(
        'workflow',
        'Approver graph published',
        'Subsequent submissions follow the new routing; in-flight approvals retain the version they started under'
      )
      toast.success('Approver graph published as a new version')
    },
    [logEngine]
  )

  const updateTenant = useCallback(
    (id: string, patch: Partial<Omit<Tenant, 'id' | 'name'>>) => {
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
      logEngine(
        'workflow',
        'Platform configuration changed',
        `Tenant ${id} updated (${Object.keys(patch).join(', ')}) — captured in the audit log`
      )
      toast.success('Tenant configuration saved')
    },
    [logEngine]
  )

  return {
    engineLog,
    logEngine,
    notify,
    letterTemplates,
    addLetterTemplate,
    toggleLetterTemplate,
    updateLetterTemplate,
    criteria,
    criteriaVersion,
    saveCriteria,
    panels,
    addPanel,
    updatePanelMembers,
    roundsConfigs,
    addRoundsConfig,
    preInterviewQuestions,
    addPreInterviewQuestion,
    postingChannels,
    addPostingChannel,
    togglePostingChannel,
    postingApproverRules,
    addPostingApproverRule,
    assignmentMethod,
    setAssignmentMethod,
    offerApproverRules,
    addOfferApproverRule,
    outOfBandApprover,
    setOutOfBandApprover,
    requisitionApproverRules,
    addRequisitionApproverRule,
    nonBudgetedApprover,
    setNonBudgetedApprover,
    preJoiningHrApprovers,
    setPreJoiningHrApprovers,
    preJoiningNetworkApprovers,
    setPreJoiningNetworkApprovers,
    requiredDocsEnabled,
    setRequiredDocsEnabled,
    requiredDocuments,
    addRequiredDocument,
    rehireSelections,
    saveRehireTab,
    recruiterStrengths,
    addRecruiterStrength,
    mailbox,
    saveMailbox,
    checklistQuestions,
    addChecklistQuestion,
    customFields,
    addCustomField,
    retireCustomField,
    approverGraphVersions,
    publishApproverGraph,
    tenants,
    updateTenant,
    groupStandards,
  }
}

export type RecruitmentConfigStore = ReturnType<typeof useRecruitmentConfig>
