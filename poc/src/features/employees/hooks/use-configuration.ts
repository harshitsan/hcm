import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCustodians,
  seedDedupRules,
  seedDependantTypes,
  seedFieldPermissions,
  seedGridColumns,
  seedLifecycleConfig,
  seedNotificationTemplates,
  seedRulePacks,
  seedSchemaFields,
  seedTimelineEvents,
  seedVerifications,
  type AccessActor,
  type DedupRule,
  type DedupScope,
  type DependantType,
  type DocumentCustodian,
  type FieldPermission,
  type GridColumnConfig,
  type LifecycleStageConfig,
  type NotificationTemplate,
  type RulePack,
  type SchemaField,
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
  }
}

export type ConfigurationStore = ReturnType<typeof useConfiguration>
