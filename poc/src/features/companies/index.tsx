import { useState } from 'react'
import { useRole, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { AuditTab } from './components/audit-tab'
import { BudgetSetupTab } from './components/budget-setup-tab'
import { DirectoryTab } from './components/directory-tab'
import { GroupsTab } from './components/groups-tab'
import { LifecycleTab } from './components/lifecycle-tab'
import { LoginImagesTab } from './components/login-images-tab'
import { SubscriptionsTab } from './components/subscriptions-tab'
import { ThoughtsTab } from './components/thoughts-tab'
import { VendorsTab } from './components/vendors-tab'
import { useCompanies } from './hooks/use-companies'
import { useGroups } from './hooks/use-groups'
import { useOrgConfig } from './hooks/use-org-config'
import { useSubscriptions } from './hooks/use-subscriptions'
// Company-scoped org setup lives with the Locations feature's org/format
// infrastructure, but is surfaced here under Companies → Admin (Company Admin).
import { OrganizationTab } from '@/features/locations/components/organization-tab'
import { LocalizationTab } from '@/features/locations/components/localization-tab'
import { useOrganization } from '@/features/locations/hooks/use-organization'
import { useLocations } from '@/features/locations/hooks/use-locations'

/** Persona emails recorded as the acting user in audit/history entries. */
const ACTORS: Record<Role, string> = {
  'Platform Admin': 'priya.platform@satellitehr.com',
  'Portfolio Admin': 'omar.portfolio@astrashared.com',
  'Group Company Admin': 'grace.group@meridiantech.in',
  'Company Admin': 'admin@bluegrainfoods.in',
  'Employee (User)': 'employee@bluegrainfoods.in',
  'Employee (Non-User)': 'kiosk@bluegrainfoods.in',
}

/**
 * SatelliteHR POC — Companies module (FR 6.2 / COMP-FR-001…016).
 * Tenant directory + creation wizard, group/portfolio structures,
 * subscription packaging & entitlements, lifecycle & retention, audit &
 * isolation. All data lives in in-memory stores.
 */
export function Companies() {
  const { role } = useRole()
  const store = useCompanies(ACTORS[role])
  const subscriptions = useSubscriptions(ACTORS[role])
  const groups = useGroups()
  const orgConfig = useOrgConfig(ACTORS[role])
  const org = useOrganization()
  const locations = useLocations()
  const isCompanyAdmin = role === 'Company Admin'
  // Controlled so "Save & Continue" can advance to the next setup step.
  // Company Admins land on their own company profile setup first.
  const [adminTab, setAdminTab] = useState(
    isCompanyAdmin ? 'company-profile' : 'lifecycle'
  )

  return (
    <>
      <CommonHeader
        title='Companies'
        className='bg-blue-150'
        endComponent={<Badge variant='open'>Acting as {role}</Badge>}
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue={takeRequestedTab('/companies') ?? 'directory'}>
            <TabsList className='mb-3 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='directory' variant='primary'>
                Directory
              </TabsTrigger>
              <TabsTrigger value='groups' variant='primary'>
                Groups & Portfolios
              </TabsTrigger>
              <TabsTrigger value='subscriptions' variant='primary'>
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value='admin' variant='primary'>
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value='directory'>
              <DirectoryTab
                store={store}
                subscriptions={subscriptions}
                packages={subscriptions.packages}
              />
            </TabsContent>
            <TabsContent value='groups'>
              <GroupsTab store={store} groups={groups} />
            </TabsContent>
            <TabsContent value='subscriptions'>
              <SubscriptionsTab store={store} subscriptions={subscriptions} />
            </TabsContent>
            <TabsContent value='admin'>
              <EngineArtifactsPanel module='Companies' />
              <div className='mb-4 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 w-fit'>
                {[
                  ...(isCompanyAdmin
                    ? [
                        { v: 'company-profile', l: 'Company profile' },
                        { v: 'regional-settings', l: 'Regional settings' },
                      ]
                    : []),
                  { v: 'lifecycle', l: 'Lifecycle' },
                  { v: 'audit', l: 'Audit log' },
                  { v: 'budget-setup', l: 'HR budget setup' },
                  { v: 'login-images', l: 'Login images' },
                  { v: 'thoughts', l: 'Thought of the day' },
                  { v: 'vendors', l: 'Vendors' },
                ].map(s => (
                  <button
                    key={s.v}
                    onClick={() => setAdminTab(s.v)}
                    className={'rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' + (adminTab === s.v ? 'bg-white text-blue-1200 shadow-sm' : 'text-neutral-1000 hover:text-neutral-1400')}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
              {isCompanyAdmin && adminTab === 'company-profile' && (
                <OrganizationTab org={org} store={locations} />
              )}
              {isCompanyAdmin && adminTab === 'regional-settings' && (
                <LocalizationTab org={org} />
              )}
              {adminTab === 'lifecycle' && <LifecycleTab store={store} />}
              {adminTab === 'audit' && <AuditTab store={store} />}
              {adminTab === 'budget-setup' && <BudgetSetupTab store={orgConfig} />}
              {adminTab === 'login-images' && (
                <LoginImagesTab
                  store={orgConfig}
                  onContinue={() => setAdminTab('thoughts')}
                />
              )}
              {adminTab === 'thoughts' && <ThoughtsTab store={orgConfig} />}
              {adminTab === 'vendors' && <VendorsTab store={orgConfig} />}
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
