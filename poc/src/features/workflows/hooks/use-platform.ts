import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedTenants, type TenantRecord } from '../data/platform'
import { type AppendAudit } from './use-audit-trail'

/**
 * Platform-level tenant provisioning + engine health monitoring
 * (WFE-18, WFE-19).
 */
export function usePlatform({ append }: { append: AppendAudit }) {
  const [tenants, setTenants] = useState<TenantRecord[]>(seedTenants)

  const toggleEngine = useCallback(
    (id: string, enabled: boolean) => {
      const tenant = tenants.find((t) => t.id === id)
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, engineEnabled: enabled } : t))
      )
      append({
        actor: 'Platform Ops',
        actorRole: 'Platform Admin',
        company: 'Platform',
        category: 'config',
        summary: `Workflow engine ${enabled ? 'enabled' : 'disabled'} for ${tenant?.name ?? id}`,
        detail: enabled
          ? 'Tenant provisioned with the configurable workflow engine; tenant-scoped storage and RLS policies applied.'
          : 'Engine disabled — running instances complete, no new workflows start.',
        refId: id,
      })
      toast.success(
        `${tenant?.name ?? 'Tenant'}: engine ${enabled ? 'enabled' : 'disabled'}`
      )
    },
    [tenants, append]
  )

  return { tenants, toggleEngine }
}

export type PlatformStore = ReturnType<typeof usePlatform>
