import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ACCESS_LABELS,
  FIELD_LABELS,
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
      setPlatformRules((prev) => ({ ...prev, [key]: access }))
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
      setCompanyVersions((prev) => {
        const version: CompanyPolicyVersion = {
          version: prev.length + 1,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          changedBy: 'You (Company Admin)',
          note: note || 'Company privacy override updated.',
          overrides,
        }
        return [...prev, version]
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
