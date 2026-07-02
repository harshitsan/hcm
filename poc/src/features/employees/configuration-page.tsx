import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AccessMatrixTab } from './components/configuration/access-tab'
import { CatalogTab } from './components/configuration/catalog-tabs'
import { DedupTab } from './components/configuration/dedup-tab'
import {
  LifecycleConfigTab,
  NotificationsTab,
} from './components/configuration/policy-tabs'
import { RulePacksTab } from './components/configuration/rule-packs-tab'
import { useConfiguration } from './hooks/use-configuration'

/**
 * Employees — Configuration: governed L2 config + L3 engine surfaces —
 * jurisdiction rule-packs & statutory field schema, duplicate detection,
 * lifecycle stages & timeline events, notification templates, field-level
 * access matrix, and the types/verification/custodian/grid catalog.
 */
export function EmployeesConfiguration() {
  const store = useConfiguration()

  return (
    <>
      <CommonHeader
        title='Employees — Configuration'
        className='bg-blue-150'
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue='rule-packs'>
            <TabsList className='mb-3'>
              <TabsTrigger value='rule-packs'>Rule-Packs & Schema</TabsTrigger>
              <TabsTrigger value='dedup'>Duplicate Detection</TabsTrigger>
              <TabsTrigger value='lifecycle'>Lifecycle & Timeline</TabsTrigger>
              <TabsTrigger value='notifications'>Notifications</TabsTrigger>
              <TabsTrigger value='access'>Access Matrix</TabsTrigger>
              <TabsTrigger value='catalog'>Types & Directory</TabsTrigger>
            </TabsList>

            <TabsContent value='rule-packs'>
              <RulePacksTab store={store} />
            </TabsContent>
            <TabsContent value='dedup'>
              <DedupTab store={store} />
            </TabsContent>
            <TabsContent value='lifecycle'>
              <LifecycleConfigTab store={store} />
            </TabsContent>
            <TabsContent value='notifications'>
              <NotificationsTab store={store} />
            </TabsContent>
            <TabsContent value='access'>
              <AccessMatrixTab store={store} />
            </TabsContent>
            <TabsContent value='catalog'>
              <CatalogTab store={store} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
