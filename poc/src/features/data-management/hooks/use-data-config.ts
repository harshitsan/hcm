import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type FileFormat, type Tier } from '../data/catalog'
import {
  seedConfigVersions,
  seedFunctionToggles,
  seedOverrides,
  seedTemplates,
  seedTierMap,
  type ConfigVersion,
  type FunctionToggle,
  type NotificationEvent,
  type NotificationTemplate,
  type TenantOverride,
} from '../data/config'

export interface ConfigDraft {
  formats: FileFormat[]
  maxFileSizeMb: number
  maxBatchRecords: number
  note: string
  publishedBy: string
}

/**
 * In-memory store for the governed import/export configuration:
 * versioned effective-dated defaults, entity tier classification,
 * the module/function routing catalog, tenant overrides, and
 * notification templates (DM-17 / DM-19 / DM-32).
 */
export function useDataConfig() {
  const [versions, setVersions] = useState<ConfigVersion[]>(seedConfigVersions)
  const [tierMap, setTierMap] = useState<Record<string, Tier>>(seedTierMap)
  const [functionToggles, setFunctionToggles] =
    useState<FunctionToggle[]>(seedFunctionToggles)
  const [overrides, setOverrides] = useState<TenantOverride[]>(seedOverrides)
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(seedTemplates)

  const currentConfig = versions[0]

  const publishVersion = useCallback((draft: ConfigDraft) => {
    setVersions((prev) => {
      const version: ConfigVersion = {
        ...draft,
        version: (prev[0]?.version ?? 0) + 1,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      }
      toast.success(
        `Config v${version.version} published — effective ${version.effectiveFrom}, no code release needed`
      )
      return [version, ...prev]
    })
  }, [])

  const setEntityTier = useCallback((entityId: string, tier: Tier) => {
    setTierMap((prev) => ({ ...prev, [entityId]: tier }))
    toast.success('Tier classification updated — sequencing engine reordered')
  }, [])

  const toggleFunction = useCallback((functionId: string, enabled: boolean) => {
    setFunctionToggles((prev) =>
      prev.map((t) => (t.functionId === functionId ? { ...t, enabled } : t))
    )
    toast.success(
      enabled
        ? 'Function enabled for import across tenants'
        : 'Function disabled — it will no longer be offered in Select function'
    )
  }, [])

  const setFunctionHiddenForTenant = useCallback(
    (functionId: string, companyId: string, hidden: boolean) => {
      setFunctionToggles((prev) =>
        prev.map((t) => {
          if (t.functionId !== functionId) return t
          const rest = t.hiddenForCompanyIds.filter((id) => id !== companyId)
          return {
            ...t,
            hiddenForCompanyIds: hidden ? [...rest, companyId] : rest,
          }
        })
      )
      toast.success('Tenant-level catalog override applied')
    },
    []
  )

  const addOverride = useCallback((draft: Omit<TenantOverride, 'id'>) => {
    const override: TenantOverride = {
      ...draft,
      id: `ovr-${crypto.randomUUID().slice(0, 8)}`,
    }
    setOverrides((prev) => [
      override,
      ...prev.filter((o) => o.companyId !== draft.companyId),
    ])
    toast.success(
      `Override for ${draft.companyName} applied within that tenant only`
    )
  }, [])

  const removeOverride = useCallback((id: string) => {
    setOverrides((prev) => prev.filter((o) => o.id !== id))
    toast.success('Override removed — platform defaults now govern')
  }, [])

  const updateTemplate = useCallback(
    (event: NotificationEvent, subject: string, body: string) => {
      setTemplates((prev) =>
        prev.map((t) => (t.event === event ? { ...t, subject, body } : t))
      )
      toast.success(
        `"${event}" template updated — subsequent job notifications use it immediately`
      )
    },
    []
  )

  return {
    versions,
    currentConfig,
    publishVersion,
    tierMap,
    setEntityTier,
    functionToggles,
    toggleFunction,
    setFunctionHiddenForTenant,
    overrides,
    addOverride,
    removeOverride,
    templates,
    updateTemplate,
  }
}

export type DataConfigStore = ReturnType<typeof useDataConfig>
