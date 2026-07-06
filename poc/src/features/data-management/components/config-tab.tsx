import { ShieldCheck } from 'lucide-react'
import { RoleGate } from '@/context/role-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { type DataConfigStore } from '../hooks/use-data-config'
import { ConfigCatalog } from './config-catalog'
import { ConfigGovernance } from './config-governance'
import { ConfigNotifications } from './config-notifications'

interface ConfigTabProps {
  store: DataConfigStore
}

/**
 * Platform Admin governance surface: versioned config, routing catalog,
 * notification templates, tenant overrides and the tenant-isolation
 * posture (DM-12 / DM-16 / DM-17 / DM-19 / DM-32).
 */
export function ConfigTab({ store }: ConfigTabProps) {
  return (
    <RoleGate
      roles={['Platform Admin']}
      fallback={
        <Alert>
          <ShieldCheck className='size-4' />
          <AlertTitle>Platform Admin only</AlertTitle>
          <AlertDescription>
            Import/export configuration is governed platform-wide. Switch the
            role to Platform Admin to manage formats, limits, tier
            classification, the routing catalog and notification templates.
          </AlertDescription>
        </Alert>
      }
    >
      <div className='space-y-4'>
        <EngineArtifactsPanel module='Data Management' />

        <Alert>
          <ShieldCheck className='size-4' />
          <AlertTitle className='flex items-center gap-2'>
            Tenant-scoped isolation (row-level security)
            <Badge variant='completed'>Enforced</Badge>
          </AlertTitle>
          <AlertDescription>
            Every import writes only within its tenant scope and every export
            returns only records the caller is authorized for — regardless of
            the file contents. Rows referencing an out-of-scope company id are
            rejected at record level rather than silently redirected; group and
            portfolio operations isolate each record to its owning company.
          </AlertDescription>
        </Alert>

        <ConfigGovernance store={store} />
        <ConfigCatalog store={store} />
        <ConfigNotifications store={store} />
      </div>
    </RoleGate>
  )
}
