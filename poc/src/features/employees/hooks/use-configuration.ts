import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  getEmployeeCodeSeries,
  seedAccessQuestions,
  seedAcknowledgementConfigs,
  seedBenefitsSetup,
  seedClassChangeApprovers,
  seedClients,
  seedCompensationSettings,
  seedCustodians,
  seedDedupRules,
  seedDependantTypes,
  seedExpenseHeads,
  seedFieldPermissions,
  seedGridColumns,
  seedLifeEventTypes,
  seedLifecycleConfig,
  seedNotificationTemplates,
  seedRehireSettings,
  seedRulePacks,
  seedSalarySlabs,
  seedSchemaFields,
  seedSelfServiceSettings,
  seedTimelineEvents,
  seedVerifications,
  setEmployeeCodeSeries,
  type AccessActor,
  type AccessQuestion,
  type AcknowledgementConfig,
  type BenefitsSetup,
  type ClassChangeApproverMapping,
  type ClientRecord,
  type CompensationSettings,
  type DedupRule,
  type DedupScope,
  type DependantType,
  type DocumentCustodian,
  type EmployeeCodeSeries,
  type ExpenseHead,
  type FieldPermission,
  type GridColumnConfig,
  type LifeEventType,
  type LifecycleStageConfig,
  type NotificationTemplate,
  type RehireSettings,
  type RulePack,
  type SalarySlab,
  type SchemaField,
  type SelfServiceSettings,
  type TimelineEventConfig,
  type VerificationCheck,
} from '../data/configuration'

/**
 * In-memory store for governed configuration (L2) — jurisdiction rule-packs,
 * statutory field schemas, dedup rules, lifecycle config, notification
 * templates, dependant types, verifications, custodians, timeline events,
 * the field-level access matrix and directory grid metadata.
 */
export function useConfiguration() {
  const [rulePacks, setRulePacks] = useState<RulePack[]>(seedRulePacks)
  const [schemaFields, setSchemaFields] =
    useState<SchemaField[]>(seedSchemaFields)
  const [dedupRules, setDedupRules] = useState<DedupRule[]>(seedDedupRules)
  const [lifecycleConfig, setLifecycleConfig] =
    useState<LifecycleStageConfig[]>(seedLifecycleConfig)
  const [templates, setTemplates] = useState<NotificationTemplate[]>(
    seedNotificationTemplates
  )
  const [dependantTypes, setDependantTypes] =
    useState<DependantType[]>(seedDependantTypes)
  const [verifications, setVerifications] =
    useState<VerificationCheck[]>(seedVerifications)
  const [custodians, setCustodians] =
    useState<DocumentCustodian[]>(seedCustodians)
  const [timelineEvents, setTimelineEvents] =
    useState<TimelineEventConfig[]>(seedTimelineEvents)
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermission[]>(
    seedFieldPermissions
  )
  const [gridColumns, setGridColumns] =
    useState<GridColumnConfig[]>(seedGridColumns)
  const [lifeEventTypes, setLifeEventTypes] =
    useState<LifeEventType[]>(seedLifeEventTypes)
  const [accessQuestions, setAccessQuestions] =
    useState<AccessQuestion[]>(seedAccessQuestions)
  const [benefitsSetup, setBenefitsSetup] =
    useState<BenefitsSetup>(seedBenefitsSetup)
  const [salarySlabs, setSalarySlabs] =
    useState<SalarySlab[]>(seedSalarySlabs)
  const [compensationSettings, setCompensationSettings] =
    useState<CompensationSettings>(seedCompensationSettings)
  const [expenseHeads, setExpenseHeads] =
    useState<ExpenseHead[]>(seedExpenseHeads)
  const [rehireSettings, setRehireSettings] =
    useState<RehireSettings>(seedRehireSettings)
  const [clients, setClients] = useState<ClientRecord[]>(seedClients)
  const [acknowledgements, setAcknowledgements] = useState<
    AcknowledgementConfig[]
  >(seedAcknowledgementConfigs)
  const [classChangeApprovers, setClassChangeApprovers] = useState<
    ClassChangeApproverMapping[]
  >(seedClassChangeApprovers)
  // Seed from the module-level mirror so the tab reflects prior saves and
  // codes consumed by employee creation since the last mount.
  const [employeeCodeSeries, setEmployeeCodeSeriesState] =
    useState<EmployeeCodeSeries>(() => getEmployeeCodeSeries())
  const [selfServiceSettings, setSelfServiceSettings] =
    useState<SelfServiceSettings>(seedSelfServiceSettings)

  /** EMP-19 — publishing bumps the version with a new effective date. */
  const publishRulePack = useCallback(
    (id: string, changes: Partial<RulePack>, effectiveFrom: string) => {
      setRulePacks((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...changes,
                version: p.version + 1,
                effectiveFrom,
                status: 'Published',
              }
            : p
        )
      )
      toast.success(
        'Rule-pack published — new version is effective-dated; prior determinations stay reproducible. No code deployment needed.'
      )
    },
    []
  )

  const toggleSchemaFieldRequired = useCallback((id: string) => {
    setSchemaFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f))
    )
    toast.success('Field schema updated — capture form re-renders per config')
  }, [])

  const updateDedupRule = useCallback(
    (id: string, changes: Partial<Pick<DedupRule, 'enforceUnique'>> & { scope?: DedupScope }) => {
      setDedupRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
      )
      toast.success('Dedup config saved — engine applies it on next evaluation')
    },
    []
  )

  const updateLifecycleValue = useCallback((id: string, value: string) => {
    setLifecycleConfig((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, value, version: c.version + 1 } : c
      )
    )
    toast.success(
      'Lifecycle config versioned — new records follow it, history preserved'
    )
  }, [])

  const toggleTemplate = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    )
  }, [])

  const updateTemplateBody = useCallback((id: string, template: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, template } : t))
    )
    toast.success('Template saved — next sends use the new content')
  }, [])

  const saveDependantType = useCallback(
    (draft: Omit<DependantType, 'id'>, id?: string) => {
      if (id) {
        setDependantTypes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
        )
        toast.success(`Dependant type "${draft.name}" updated`)
      } else {
        setDependantTypes((prev) => [
          { ...draft, id: `dt-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Dependant type "${draft.name}" added`)
      }
    },
    []
  )

  const saveVerification = useCallback(
    (draft: Omit<VerificationCheck, 'id'>, id?: string) => {
      if (id) {
        setVerifications((prev) =>
          prev.map((v) => (v.id === id ? { ...v, ...draft } : v))
        )
        toast.success(`Verification "${draft.name}" updated`)
      } else {
        setVerifications((prev) => [
          { ...draft, id: `vc-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Verification "${draft.name}" added`)
      }
    },
    []
  )

  const saveCustodian = useCallback(
    (draft: Omit<DocumentCustodian, 'id'>, id?: string) => {
      if (id) {
        setCustodians((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
        )
        toast.success('Custodian mapping updated')
      } else {
        setCustodians((prev) => [
          { ...draft, id: `dc-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success('Custodian mapping added')
      }
    },
    []
  )

  const saveTimelineEvent = useCallback(
    (draft: Omit<TimelineEventConfig, 'id'>, id?: string) => {
      if (id) {
        setTimelineEvents((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
        )
        toast.success(`Timeline event "${draft.event}" updated`)
      } else {
        setTimelineEvents((prev) => [
          { ...draft, id: `te-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Timeline event "${draft.event}" added`)
      }
    },
    []
  )

  const togglePermission = useCallback(
    (field: string, actor: AccessActor, kind: 'view' | 'edit') => {
      setFieldPermissions((prev) =>
        prev.map((p) =>
          p.field === field
            ? {
                ...p,
                permissions: {
                  ...p.permissions,
                  [actor]: {
                    ...p.permissions[actor],
                    [kind]: !p.permissions[actor][kind],
                  },
                },
              }
            : p
        )
      )
    },
    []
  )

  const toggleGridColumn = useCallback(
    (id: string, kind: 'visible' | 'filterable') => {
      setGridColumns((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, [kind]: !c[kind] } : c
        )
      )
      toast.success('Directory grid metadata updated — no code change needed')
    },
    []
  )

  /** ELE-01/03 — add or edit an employee life event type. */
  const saveLifeEventType = useCallback(
    (draft: Omit<LifeEventType, 'id'>, id?: string) => {
      if (id) {
        setLifeEventTypes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
        )
        toast.success(`Life event type "${draft.name}" updated`)
      } else {
        setLifeEventTypes((prev) => [
          { ...draft, id: `le-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Life event type "${draft.name}" added`)
      }
    },
    []
  )

  const deleteLifeEventType = useCallback((id: string) => {
    setLifeEventTypes((prev) => prev.filter((t) => t.id !== id))
    toast.success('Life event type deleted')
  }, [])

  /** EAP-05 — answer bench-report / billable / Wrike configuration questions. */
  const toggleAccessQuestion = useCallback((id: string) => {
    setAccessQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer: !q.answer } : q))
    )
  }, [])

  /** BEN-02 — persist the benefit-management module selection. */
  const saveBenefitsSetup = useCallback((next: BenefitsSetup) => {
    setBenefitsSetup(next)
    toast.success(
      next.moduleEnabled
        ? 'Benefit management enabled — benefits functionality is now available'
        : 'Benefit management disabled — benefits functionality is hidden'
    )
  }, [])

  /** COMP-02/03 — add or edit a salary slab (compensation metric). */
  const saveSalarySlab = useCallback(
    (draft: Omit<SalarySlab, 'id'>, id?: string) => {
      if (id) {
        setSalarySlabs((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...draft } : s))
        )
        toast.success(`Salary slab "${draft.name}" updated`)
      } else {
        setSalarySlabs((prev) => [
          { ...draft, id: `sl-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Salary slab "${draft.name}" added`)
      }
    },
    []
  )

  const deleteSalarySlab = useCallback((id: string) => {
    setSalarySlabs((prev) => prev.filter((s) => s.id !== id))
    toast.success('Salary slab deleted')
  }, [])

  /** COMP-04/05 — persist accepted salary difference tolerance. */
  const saveCompensationSettings = useCallback(
    (next: CompensationSettings) => {
      setCompensationSettings(next)
      toast.success(
        `Compensation configuration saved — ±₹${next.acceptedSalaryDifference} tolerated between provided and calculated salary`
      )
    },
    []
  )

  const saveExpenseHead = useCallback(
    (draft: Omit<ExpenseHead, 'id'>, id?: string) => {
      if (id) {
        setExpenseHeads((prev) =>
          prev.map((h) => (h.id === id ? { ...h, ...draft } : h))
        )
        toast.success(`Expense head "${draft.name}" updated`)
      } else {
        setExpenseHeads((prev) => [
          { ...draft, id: `eh-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Expense head "${draft.name}" added`)
      }
    },
    []
  )

  const toggleExpenseHead = useCallback((id: string) => {
    setExpenseHeads((prev) =>
      prev.map((h) => (h.id === id ? { ...h, active: !h.active } : h))
    )
  }, [])

  const saveRehireSettings = useCallback((next: RehireSettings) => {
    setRehireSettings(next)
    toast.success('Rehire settings saved')
  }, [])

  /** CLM-01/02 — add or edit a client master record. */
  const saveClient = useCallback(
    (draft: Omit<ClientRecord, 'id'>, id?: string) => {
      if (id) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
        )
        toast.success(`Client "${draft.name}" updated`)
      } else {
        setClients((prev) => [
          { ...draft, id: `cl-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(
          `Client "${draft.name}" added — available for resource assignments`
        )
      }
    },
    []
  )

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    toast.success('Client deleted')
  }, [])

  /** ACK-01/03/04 — add or edit an acknowledgement terms configuration. */
  const saveAcknowledgement = useCallback(
    (draft: Omit<AcknowledgementConfig, 'id'>, id?: string) => {
      if (id) {
        setAcknowledgements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...draft } : a))
        )
        toast.success(
          `Acknowledgement for ${draft.templateType} updated`
        )
      } else {
        setAcknowledgements((prev) => [
          { ...draft, id: `ak-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(
          `Acknowledgement added — ${draft.templateType} now requires acknowledgement at ${draft.locations.length} location(s)`
        )
      }
    },
    []
  )

  const toggleAcknowledgement = useCallback((id: string) => {
    setAcknowledgements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    )
  }, [])

  const deleteAcknowledgement = useCallback((id: string) => {
    setAcknowledgements((prev) => prev.filter((a) => a.id !== id))
    toast.success('Acknowledgement configuration deleted')
  }, [])

  /** CCA-01/04 — add or edit a class-change approver mapping per location. */
  const saveClassChangeApprover = useCallback(
    (draft: Omit<ClassChangeApproverMapping, 'id'>, id?: string) => {
      if (id) {
        setClassChangeApprovers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...draft } : m))
        )
        toast.success(`Class change approvers for ${draft.location} updated`)
      } else {
        setClassChangeApprovers((prev) => [
          { ...draft, id: `cc-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(
          `Class change approvers added for ${draft.location} — class changes route to them for approval`
        )
      }
    },
    []
  )

  const deleteClassChangeApprover = useCallback((id: string) => {
    setClassChangeApprovers((prev) => prev.filter((m) => m.id !== id))
    toast.success('Class change approver mapping deleted')
  }, [])

  /** Employee code generation series — new employee codes derive from it. */
  const saveEmployeeCodeSeries = useCallback((next: EmployeeCodeSeries) => {
    setEmployeeCodeSeriesState(next)
    setEmployeeCodeSeries(next) // module mirror read by createEmployee
    toast.success(
      next.autoGenerate
        ? 'Code series saved — new employees receive auto-generated codes'
        : 'Auto-generation off — employee codes are entered manually on create'
    )
  }, [])

  /** Notify HR when employees edit their own profile. */
  const toggleNotifyHrOnSelfEdit = useCallback(() => {
    setSelfServiceSettings((prev) => {
      const next = { ...prev, notifyHrOnSelfEdit: !prev.notifyHrOnSelfEdit }
      toast.success(
        next.notifyHrOnSelfEdit
          ? 'HR will be notified when employees edit their own profile'
          : 'HR notifications for self-service edits turned off'
      )
      return next
    })
  }, [])

  return {
    rulePacks,
    schemaFields,
    dedupRules,
    lifecycleConfig,
    templates,
    dependantTypes,
    verifications,
    custodians,
    timelineEvents,
    fieldPermissions,
    gridColumns,
    publishRulePack,
    toggleSchemaFieldRequired,
    updateDedupRule,
    updateLifecycleValue,
    toggleTemplate,
    updateTemplateBody,
    saveDependantType,
    saveVerification,
    saveCustodian,
    saveTimelineEvent,
    togglePermission,
    toggleGridColumn,
    lifeEventTypes,
    saveLifeEventType,
    deleteLifeEventType,
    accessQuestions,
    toggleAccessQuestion,
    benefitsSetup,
    saveBenefitsSetup,
    salarySlabs,
    saveSalarySlab,
    deleteSalarySlab,
    compensationSettings,
    saveCompensationSettings,
    expenseHeads,
    saveExpenseHead,
    toggleExpenseHead,
    rehireSettings,
    saveRehireSettings,
    clients,
    saveClient,
    deleteClient,
    acknowledgements,
    saveAcknowledgement,
    toggleAcknowledgement,
    deleteAcknowledgement,
    classChangeApprovers,
    saveClassChangeApprover,
    deleteClassChangeApprover,
    employeeCodeSeries,
    saveEmployeeCodeSeries,
    selfServiceSettings,
    toggleNotifyHrOnSelfEdit,
  }
}

export type ConfigurationStore = ReturnType<typeof useConfiguration>
