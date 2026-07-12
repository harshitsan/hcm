import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  ACCESS_LABELS,
  FIELD_LABELS,
  PHASE1_EXCLUDED_FIELDS,
  seedCompanyPolicyVersions,
  seedCustomFields,
  seedPlatformRules,
  type CompanyPolicyVersion,
  type CustomFieldDef,
  type DirectoryFieldKey,
  type FieldAccess,
} from '../data/directory-config'
import { type PrivacyConfig } from '../utils/privacy'

/**
 * Governed configuration store: platform-default field policies (DIR-11),
 * versioned effective-dated company overrides (DIR-19) and the custom-field
 * schema (DIR-20). Changes take effect on the next render — no code deploy.
 */
export function useDirectoryConfig() {
  const [platformRules, setPlatformRules] =
    useState<Record<DirectoryFieldKey, FieldAccess>>(seedPlatformRules)
  const [companyVersions, setCompanyVersions] = useState<
    CompanyPolicyVersion[]
  >(seedCompanyPolicyVersions)
  const [customFields, setCustomFields] =
    useState<CustomFieldDef[]>(seedCustomFields)

  const activeVersion = companyVersions[companyVersions.length - 1]

  /** Resolved config consumed by the rules engine everywhere (DIR-21). */
  const privacyConfig = useMemo<PrivacyConfig>(
    () => ({ platformRules, companyOverrides: activeVersion.overrides }),
    [platformRules, activeVersion]
  )

  const setPlatformRule = useCallback(
    (key: DirectoryFieldKey, access: FieldAccess) => {
      // Structurally excluded fields cannot be re-enabled by configuration.
      if (PHASE1_EXCLUDED_FIELDS.includes(key)) {
        toast.error(
          `"${FIELD_LABELS[key]}" is never shown in Phase 1 — this cannot be changed by configuration.`
        )
        return
      }
      let previous: FieldAccess | undefined
      setPlatformRules((prev) => {
        previous = prev[key]
        return { ...prev, [key]: access }
      })
      publishAuditEvent({
        module: 'Directory & Org Chart',
        action: `Platform default for "${FIELD_LABELS[key]}" changed to ${ACCESS_LABELS[access]}`,
        actor: 'Platform Admin',
        actorRole: 'Platform Admin',
        entityType: 'Company',
        actionType: 'update',
        recordName: 'Directory field policy',
        changes: [
          {
            field: FIELD_LABELS[key],
            previousValue: previous ? ACCESS_LABELS[previous] : '—',
            newValue: ACCESS_LABELS[access],
          },
        ],
      })
      toast.success(
        `Platform default for "${FIELD_LABELS[key]}" set to ${ACCESS_LABELS[access]}`
      )
    },
    []
  )

  /** Publishes a new effective-dated override version (DIR-19 AC 2). */
  const saveCompanyOverrides = useCallback(
    (
      overrides: Partial<Record<DirectoryFieldKey, FieldAccess>>,
      note: string
    ) => {
      // Strip structurally excluded fields — overrides can never surface them.
      const safeOverrides = Object.fromEntries(
        Object.entries(overrides).filter(
          ([key]) =>
            !PHASE1_EXCLUDED_FIELDS.includes(key as DirectoryFieldKey)
        )
      ) as Partial<Record<DirectoryFieldKey, FieldAccess>>
      setCompanyVersions((prev) => {
        const version: CompanyPolicyVersion = {
          version: prev.length + 1,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          changedBy: 'You (Company Admin)',
          note: note || 'Company privacy override updated.',
          overrides: safeOverrides,
        }
        return [...prev, version]
      })
      publishAuditEvent({
        module: 'Directory & Org Chart',
        action: 'Company directory privacy override published as a new version',
        actor: 'Meera Iyer',
        actorRole: 'Company Admin',
        entityType: 'Company',
        actionType: 'update',
        recordName: 'Directory field policy',
        changes: Object.entries(safeOverrides).map(([key, access]) => ({
          field: FIELD_LABELS[key as DirectoryFieldKey],
          previousValue: 'Platform default',
          newValue: ACCESS_LABELS[access],
        })),
      })
      toast.success('Company override published as a new version')
    },
    []
  )

  const updateCustomField = useCallback(
    (
      id: string,
      patch: Partial<Omit<CustomFieldDef, 'id' | 'version' | 'effectiveFrom'>>
    ) => {
      setCustomFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                ...patch,
                version: f.version + 1,
                effectiveFrom: new Date().toISOString().slice(0, 10),
              }
            : f
        )
      )
      const label =
        customFields.find((f) => f.id === id)?.label ?? 'Custom field'
      toast.success(`"${label}" reconfigured — new version effective today`)
    },
    [customFields]
  )

  const addCustomField = useCallback(
    (def: Omit<CustomFieldDef, 'id' | 'version' | 'effectiveFrom'>) => {
      const field: CustomFieldDef = {
        ...def,
        id: `cf-${crypto.randomUUID().slice(0, 8)}`,
        version: 1,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      }
      setCustomFields((prev) => [...prev, field])
      toast.success(`Custom field "${def.label}" added to the directory schema`)
    },
    []
  )

  return {
    platformRules,
    setPlatformRule,
    companyVersions,
    activeVersion,
    saveCompanyOverrides,
    customFields,
    updateCustomField,
    addCustomField,
    privacyConfig,
  }
}

export type DirectoryConfigStore = ReturnType<typeof useDirectoryConfig>
