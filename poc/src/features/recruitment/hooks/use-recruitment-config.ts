import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  defaultMailboxSettings,
  defaultReferenceCheckSettings,
  defaultRehireSelections,
  seedApproverGraphVersions,
  seedChecklistQuestions,
  seedCustomFields,
  seedEmailTemplates,
  seedEngineLog,
  seedExpenseHeads,
  seedGroupStandards,
  seedJoiningFormalities,
  seedLetterTemplates,
  seedOfferApproverRules,
  seedPanels,
  seedPaygradeMappings,
  seedPostingApproverRules,
  seedPostingChannels,
  seedPreInterviewQuestions,
  seedRecruiterStrengths,
  seedRequiredDocuments,
  seedRequisitionApproverRules,
  seedRoleAssignments,
  seedRoundsConfigs,
  seedScorecardCriteria,
  seedTenants,
  type ApproverGraphVersion,
  type AssignmentMethod,
  type ChecklistQuestion,
  type CustomFieldDef,
  type EngineLogEntry,
  type ExpenseHead,
  type InterviewPanel,
  type JoiningFormality,
  type LetterTemplate,
  type MailboxSettings,
  type OfferApproverRule,
  type PositionLevelPaygrade,
  type PostingApproverRule,
  type PostingChannel,
  type PreInterviewQuestion,
  type RecruiterStrength,
  type RecruitmentEmailTemplate,
  type RecruitmentRoleAssignment,
  type ReferenceCheckSettings,
  type RequiredDocument,
  type RequisitionApproverRule,
  type RoundsConfig,
  type ScorecardCriterion,
  type Tenant,
} from '../data/config'
import {
  seedReferenceQuestions,
  type ReferenceQuestion,
} from '../data/reference-questions'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 6)}`
}

/** Swap an item's displayOrder with its up/down neighbour (no-op at edges). */
function swapOrdered<T extends { id: string; displayOrder: number }>(
  list: T[],
  id: string,
  direction: 'up' | 'down'
): T[] {
  const sorted = [...list].sort((a, b) => a.displayOrder - b.displayOrder)
  const i = sorted.findIndex((x) => x.id === id)
  const j = direction === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= sorted.length) return list
  const a = sorted[i]
  const b = sorted[j]
  return list.map((x) =>
    x.id === a.id
      ? { ...x, displayOrder: b.displayOrder }
      : x.id === b.id
        ? { ...x, displayOrder: a.displayOrder }
        : x
  )
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
  // Kensium setup screens (SET-01, IPN-01, RFC-01…03, PLP-01/02, EMT, EXH)
  const [moduleEnabled, setModuleEnabledState] = useState(true)
  const [panelSupportEnabled, setPanelSupportEnabledState] = useState(true)
  const [referenceCheck, setReferenceCheck] = useState<ReferenceCheckSettings>(
    defaultReferenceCheckSettings
  )
  const [paygradeEnabled, setPaygradeEnabledState] = useState(true)
  const [paygradeMappings, setPaygradeMappings] = useState<
    PositionLevelPaygrade[]
  >(seedPaygradeMappings)
  const [emailTemplates, setEmailTemplates] =
    useState<RecruitmentEmailTemplate[]>(seedEmailTemplates)
  const [expenseHeads, setExpenseHeads] =
    useState<ExpenseHead[]>(seedExpenseHeads)
  // Kensium configuration gaps — recruiter/HR roles, reference questionnaire,
  // joining formalities checklist
  const [roleAssignments, setRoleAssignments] = useState<
    RecruitmentRoleAssignment[]
  >(seedRoleAssignments)
  const [refQuestions, setRefQuestions] = useState<ReferenceQuestion[]>(
    seedReferenceQuestions
  )
  const [joiningFormalities, setJoiningFormalities] = useState<
    JoiningFormality[]
  >(seedJoiningFormalities)

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
    (
      id: string,
      content: string,
      extras?: Partial<Pick<LetterTemplate, 'header' | 'footer'>>
    ) => {
      setLetterTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, content, ...extras, version: t.version + 1 }
            : t
        )
      )
      toast.success(
        'Template updated — existing generated offers retain their prior version'
      )
    },
    []
  )

  /** LTT: clone an existing letter template as a v1 copy. */
  const cloneLetterTemplate = useCallback((id: string) => {
    setLetterTemplates((prev) => {
      const source = prev.find((t) => t.id === id)
      if (!source) return prev
      toast.success(`Template cloned from "${source.name}"`)
      return [
        { ...source, id: newId('tpl'), name: `${source.name} (Copy)`, version: 1 },
        ...prev,
      ]
    })
  }, [])

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

  const addPanel = useCallback(
    (
      name: string,
      members: string[],
      extras?: Partial<Omit<InterviewPanel, 'id' | 'name' | 'members'>>
    ) => {
      setPanels((prev) => [{ id: newId('pn'), name, members, ...extras }, ...prev])
      toast.success(`Panel "${name}" defined`)
    },
    []
  )

  const updatePanelMembers = useCallback((id: string, members: string[]) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, members } : p)))
    toast.success('Panel membership updated — reflected in scheduling')
  }, [])

  /** IPN: full panel edit — description, applicability and members. */
  const updatePanel = useCallback(
    (id: string, patch: Partial<Omit<InterviewPanel, 'id'>>) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      )
      toast.success('Panel updated — reflected in scheduling')
    },
    []
  )

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

  const updateRoundsConfig = useCallback(
    (id: string, patch: Partial<Omit<RoundsConfig, 'id'>>) => {
      setRoundsConfigs((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success(
        'Interview rounds updated — subsequent scheduling uses the new mapping'
      )
    },
    []
  )

  const updateOfferApproverRule = useCallback(
    (id: string, patch: Partial<Omit<OfferApproverRule, 'id'>>) => {
      setOfferApproverRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success('Offer approver rule updated')
    },
    []
  )

  const updateRequisitionApproverRule = useCallback(
    (id: string, patch: Partial<Omit<RequisitionApproverRule, 'id'>>) => {
      setRequisitionApproverRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success('Resource-requisition approver rule updated')
    },
    []
  )

  const updatePostingChannel = useCallback(
    (id: string, patch: Partial<Omit<PostingChannel, 'id'>>) => {
      setPostingChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      )
      toast.success('Posting channel updated')
    },
    []
  )

  const updatePostingApproverRule = useCallback(
    (id: string, patch: Partial<Omit<PostingApproverRule, 'id'>>) => {
      setPostingApproverRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success('Posting-source approver rule updated')
    },
    []
  )

  const updateRequiredDocument = useCallback(
    (id: string, patch: Partial<Omit<RequiredDocument, 'id'>>) => {
      setRequiredDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      )
      toast.success('Required document updated')
    },
    []
  )

  // SET-01: recruitment module master switch
  const setModuleEnabled = useCallback(
    (enabled: boolean) => {
      setModuleEnabledState(enabled)
      logEngine(
        'workflow',
        `Recruitment module ${enabled ? 'enabled' : 'disabled'}`,
        enabled
          ? 'Recruitment features are available to the organisation'
          : 'Recruitment features are hidden until the module is re-enabled'
      )
      toast.success(`Recruitment module ${enabled ? 'enabled' : 'disabled'}`)
    },
    [logEngine]
  )

  // IPN-01: interview panel support switch
  const setPanelSupportEnabled = useCallback((enabled: boolean) => {
    setPanelSupportEnabledState(enabled)
    toast.success(
      enabled
        ? 'Interview panel support enabled — panels can be used in scheduling'
        : 'Interview panel support disabled — panel management is unavailable'
    )
  }, [])

  // RFC-01…RFC-03: reference check policy
  const saveReferenceCheck = useCallback((next: ReferenceCheckSettings) => {
    setReferenceCheck(next)
    toast.success('Reference check settings saved')
  }, [])

  // PLP-01: paygrade support switch
  const setPaygradeEnabled = useCallback((enabled: boolean) => {
    setPaygradeEnabledState(enabled)
    toast.success(
      enabled
        ? 'Position level paygrade support enabled'
        : 'Position level paygrade support disabled'
    )
  }, [])

  const addPaygradeMapping = useCallback(
    (draft: Omit<PositionLevelPaygrade, 'id'>) => {
      setPaygradeMappings((prev) => [{ ...draft, id: newId('plp') }, ...prev])
      toast.success(
        `Pay grade ${draft.payGrade} mapped to ${draft.positionLevel}`
      )
    },
    []
  )

  const updatePaygradeMapping = useCallback(
    (id: string, patch: Partial<Omit<PositionLevelPaygrade, 'id'>>) => {
      setPaygradeMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      )
      toast.success('Pay grade mapping updated')
    },
    []
  )

  const deletePaygradeMapping = useCallback((id: string) => {
    setPaygradeMappings((prev) => prev.filter((m) => m.id !== id))
    toast.success('Pay grade mapping removed')
  }, [])

  // EMT-01…EMT-03: recruitment email templates
  const addEmailTemplate = useCallback(
    (draft: Omit<RecruitmentEmailTemplate, 'id' | 'active'>) => {
      setEmailTemplates((prev) => [
        { ...draft, id: newId('emt'), active: true },
        ...prev,
      ])
      toast.success(`Email template "${draft.name}" saved`)
    },
    []
  )

  const updateEmailTemplate = useCallback(
    (id: string, patch: Partial<Omit<RecruitmentEmailTemplate, 'id'>>) => {
      setEmailTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
      toast.success('Email template updated')
    },
    []
  )

  const toggleEmailTemplate = useCallback((id: string) => {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    )
  }, [])

  const deleteEmailTemplate = useCallback((id: string) => {
    setEmailTemplates((prev) => prev.filter((t) => t.id !== id))
    toast.success('Email template deleted')
  }, [])

  // EXH-01…EXH-03: recruitment expense heads
  const addExpenseHead = useCallback((draft: Omit<ExpenseHead, 'id'>) => {
    setExpenseHeads((prev) => [{ ...draft, id: newId('exh') }, ...prev])
    toast.success(`Expense head "${draft.name}" saved`)
  }, [])

  const updateExpenseHead = useCallback(
    (id: string, patch: Partial<Omit<ExpenseHead, 'id'>>) => {
      setExpenseHeads((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h))
      )
      toast.success('Expense head updated')
    },
    []
  )

  const deleteExpenseHead = useCallback((id: string) => {
    setExpenseHeads((prev) => prev.filter((h) => h.id !== id))
    toast.success('Expense head deleted')
  }, [])

  // Recruiter Role & HR Role assignments (Kensium: Configuration → Roles)
  const addRoleAssignment = useCallback(
    (draft: Omit<RecruitmentRoleAssignment, 'id'>) => {
      setRoleAssignments((prev) => [{ ...draft, id: newId('role') }, ...prev])
      toast.success(
        `${draft.roleType} role "${draft.roleName}" assigned to ${draft.assignedEmployee}`
      )
    },
    []
  )

  const updateRoleAssignment = useCallback(
    (id: string, patch: Partial<Omit<RecruitmentRoleAssignment, 'id'>>) => {
      setRoleAssignments((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success('Role assignment updated')
    },
    []
  )

  const removeRoleAssignment = useCallback((id: string) => {
    setRoleAssignments((prev) => prev.filter((r) => r.id !== id))
    toast.success('Role assignment removed')
  }, [])

  // Reference-check questionnaire (Kensium: Configuration → Reference Check)
  const addRefQuestion = useCallback(
    (draft: Omit<ReferenceQuestion, 'id' | 'displayOrder'>) => {
      setRefQuestions((prev) => [
        ...prev,
        {
          ...draft,
          id: newId('refq'),
          displayOrder: Math.max(0, ...prev.map((q) => q.displayOrder)) + 1,
        },
      ])
      toast.success('Reference question added')
    },
    []
  )

  const updateRefQuestion = useCallback(
    (id: string, patch: Partial<Omit<ReferenceQuestion, 'id'>>) => {
      setRefQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
      )
      toast.success('Reference question updated')
    },
    []
  )

  const removeRefQuestion = useCallback((id: string) => {
    setRefQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success('Reference question removed')
  }, [])

  const moveRefQuestion = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setRefQuestions((prev) => swapOrdered(prev, id, direction))
    },
    []
  )

  // Joining formalities checklist (Kensium: Configuration → Joining Formalities)
  const addJoiningFormality = useCallback(
    (draft: Omit<JoiningFormality, 'id' | 'displayOrder'>) => {
      setJoiningFormalities((prev) => [
        ...prev,
        {
          ...draft,
          id: newId('jf'),
          displayOrder: Math.max(0, ...prev.map((f) => f.displayOrder)) + 1,
        },
      ])
      toast.success(
        `Joining formality "${draft.item}" added — ${draft.responsibleDepartment} will be notified`
      )
    },
    []
  )

  const updateJoiningFormality = useCallback(
    (id: string, patch: Partial<Omit<JoiningFormality, 'id'>>) => {
      setJoiningFormalities((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
      )
      toast.success('Joining formality updated')
    },
    []
  )

  const removeJoiningFormality = useCallback((id: string) => {
    setJoiningFormalities((prev) => prev.filter((f) => f.id !== id))
    toast.success('Joining formality removed')
  }, [])

  const moveJoiningFormality = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setJoiningFormalities((prev) => swapOrdered(prev, id, direction))
    },
    []
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
    cloneLetterTemplate,
    criteria,
    criteriaVersion,
    saveCriteria,
    panels,
    addPanel,
    updatePanelMembers,
    updatePanel,
    roundsConfigs,
    addRoundsConfig,
    updateRoundsConfig,
    preInterviewQuestions,
    addPreInterviewQuestion,
    postingChannels,
    addPostingChannel,
    updatePostingChannel,
    togglePostingChannel,
    postingApproverRules,
    addPostingApproverRule,
    updatePostingApproverRule,
    assignmentMethod,
    setAssignmentMethod,
    offerApproverRules,
    addOfferApproverRule,
    updateOfferApproverRule,
    outOfBandApprover,
    setOutOfBandApprover,
    requisitionApproverRules,
    addRequisitionApproverRule,
    updateRequisitionApproverRule,
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
    updateRequiredDocument,
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
    moduleEnabled,
    setModuleEnabled,
    panelSupportEnabled,
    setPanelSupportEnabled,
    referenceCheck,
    saveReferenceCheck,
    paygradeEnabled,
    setPaygradeEnabled,
    paygradeMappings,
    addPaygradeMapping,
    updatePaygradeMapping,
    deletePaygradeMapping,
    emailTemplates,
    addEmailTemplate,
    updateEmailTemplate,
    toggleEmailTemplate,
    deleteEmailTemplate,
    expenseHeads,
    addExpenseHead,
    updateExpenseHead,
    deleteExpenseHead,
    roleAssignments,
    addRoleAssignment,
    updateRoleAssignment,
    removeRoleAssignment,
    refQuestions,
    addRefQuestion,
    updateRefQuestion,
    removeRefQuestion,
    moveRefQuestion,
    joiningFormalities,
    addJoiningFormality,
    updateJoiningFormality,
    removeJoiningFormality,
    moveJoiningFormality,
  }
}

export type RecruitmentConfigStore = ReturnType<typeof useRecruitmentConfig>
