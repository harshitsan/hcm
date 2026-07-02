import { useRole, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AuditTab } from './components/audit-tab'
import { DirectoryTab } from './components/directory-tab'
import { GroupsTab } from './components/groups-tab'
import { LifecycleTab } from './components/lifecycle-tab'
import { SubscriptionsTab } from './components/subscriptions-tab'
import { useCompanies } from './hooks/use-companies'
import { useGroups } from './hooks/use-groups'
import { useSubscriptions } from './hooks/use-subscriptions'

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

  return (
    <>
      <CommonHeader
        title='Companies'
        className='bg-blue-150'
        endComponent={<Badge variant='open'>Acting as {role}</Badge>}
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue='directory'>
            <TabsList className='mb-3'>
              <TabsTrigger value='directory' variant='primary'>
                Directory
              </TabsTrigger>
              <TabsTrigger value='groups' variant='primary'>
                Groups & Portfolios
              </TabsTrigger>
              <TabsTrigger value='subscriptions' variant='primary'>
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value='lifecycle' variant='primary'>
                Lifecycle & Retention
              </TabsTrigger>
              <TabsTrigger value='audit' variant='primary'>
                Audit & Isolation
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
            <TabsContent value='lifecycle'>
              <LifecycleTab store={store} />
            </TabsContent>
            <TabsContent value='audit'>
              <AuditTab store={store} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
