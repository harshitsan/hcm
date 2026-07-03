import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { ConfigTab } from './components/config-tab'
import { GovernanceTab } from './components/governance-tab'
import { IdentityTab } from './components/identity-tab'
import { OperationsTab } from './components/operations-tab'
import { SecurityTab } from './components/security-tab'
import { SummaryCards } from './components/shared'
import { TenantsTab } from './components/tenants-tab'
import { useGovernance } from './hooks/use-governance'
import { useGovernedConfig } from './hooks/use-governed-config'
import { useIdentity } from './hooks/use-identity'
import { useOperations } from './hooks/use-operations'
import { useSecurity } from './hooks/use-security'
import { useTenants } from './hooks/use-tenants'

const TAB_LABELS: Record<string, string> = {
  tenants: 'Tenants & companies',
  identity: 'Users & access',
  operations: 'Operations',
  settings: 'Settings',
}

const SETTINGS_TAB_LABELS: Record<string, string> = {
  config: 'Configuration',
  security: 'Security',
  governance: 'Data rules',
}

/**
 * Platform Administration (SYS-01..77 minus the org-model and workspace
 * sub-pages): multi-tenant provisioning, identity & access, governed
 * configuration, security/compliance, data governance and operations.
 */
export function PlatformAdmin() {
  const { role, hasRole } = useRole()
  const [tab, setTab] = useState(() =>
    hasRole('Employee (User)', 'Employee (Non-User)') ? 'identity' : 'tenants'
  )

  const tenants = useTenants()
  const identity = useIdentity()
  const config = useGovernedConfig()
  const security = useSecurity()
  const governance = useGovernance()
  const operations = useOperations()

  const summaryItems = useMemo(() => {
    const pendingApprovals =
      config.workflows.filter((w) => w.status === 'pending').length +
      tenants.sharingRequests.filter((r) => r.status === 'pending').length
    return [
      { label: 'Tenants', value: tenants.tenants.length },
      {
        label: 'Active tenants',
        value: tenants.tenants.filter((t) => t.status === 'active').length,
      },
      { label: 'System users', value: identity.systemUsers.length },
      { label: 'Pending approvals', value: pendingApprovals },
    ]
  }, [tenants.tenants, tenants.sharingRequests, identity.systemUsers, config.workflows])

  return (
    <>
      <CommonHeader
        title='Platform Administration'
        className='bg-blue-150'
        endComponent={
          <div className='flex items-center gap-2'>
            <span className='text-paragraph-sm text-neutral-1000 hidden md:inline'>
              Viewing as <b>{role}</b>
            </span>
            <Button asChild variant='outline' className='h-7 px-2 text-xs'>
              <Link to='/platform-admin/org-model'>Organization Model</Link>
            </Button>
            <Button asChild variant='outline' className='h-7 px-2 text-xs'>
              <Link to='/platform-admin/workspace'>My Workspace</Link>
            </Button>
          </div>
        }
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <SummaryCards title='Platform Summary' items={summaryItems} />

          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
              {Object.entries(TAB_LABELS).map(([value, label]) => (
                <TabsTrigger key={value} variant='primary' value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='tenants'>
              <TenantsTab store={tenants} />
            </TabsContent>
            <TabsContent value='identity'>
              <IdentityTab
                identity={identity}
                tenants={tenants.tenants}
                activeCompanyId={tenants.activeCompanyId}
              />
            </TabsContent>
            <TabsContent value='operations'>
              <OperationsTab store={operations} />
            </TabsContent>
            <TabsContent value='settings'>
              <Tabs defaultValue='config' className='w-full'>
                <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
                  {Object.entries(SETTINGS_TAB_LABELS).map(([value, label]) => (
                    <TabsTrigger key={value} variant='primary' value={value}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value='config'>
                  <ConfigTab store={config} />
                </TabsContent>
                <TabsContent value='security'>
                  <SecurityTab store={security} />
                </TabsContent>
                <TabsContent value='governance'>
                  <GovernanceTab store={governance} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
