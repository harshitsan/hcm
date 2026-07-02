import { useEffect, useMemo, useState } from 'react'
import { Package } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { ConfigTab } from './components/config-tab'
import { InventoryTab } from './components/inventory-tab'
import { MovementsTab } from './components/movements-tab'
import { MyAssetsTab } from './components/my-assets-tab'
import { ReportsTab } from './components/reports-tab'
import { RequisitionsTab } from './components/requisitions-tab'
import { WorkflowsTab } from './components/workflows-tab'
import { useAssetConfig } from './hooks/use-asset-config'
import { useAssets } from './hooks/use-assets'
import { useMovements } from './hooks/use-movements'
import { useRequisitions } from './hooks/use-requisitions'

/**
 * Asset Management module: inventory + lifecycle transactions, requisition
 * approval/issuance, inbound/outbound movements, workflow-driven issuance &
 * recovery, oversight reporting and governed configuration — all against
 * in-memory stores, with surfaces varying by the active role.
 */
export function Assets() {
  const { role } = useRole()
  const config = useAssetConfig()
  const store = useAssets(config.ackRules, config.currentQuestionnaire.version)
  const reqStore = useRequisitions()
  const movements = useMovements()

  const isCompanyAdmin = role === 'Company Admin'
  const isOversight =
    role === 'Group Company Admin' || role === 'Portfolio Admin' || role === 'Platform Admin'
  const isEmployeeUser = role === 'Employee (User)'
  const isNonUser = role === 'Employee (Non-User)'
  const isPlatformAdmin = role === 'Platform Admin'

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isCompanyAdmin || isOversight) tabs.push('inventory')
    if (isEmployeeUser) tabs.push('my-assets')
    if (isCompanyAdmin || isEmployeeUser) tabs.push('requisitions')
    if (isCompanyAdmin) tabs.push('movements', 'workflows')
    if (isCompanyAdmin || isOversight) tabs.push('reports')
    if (isCompanyAdmin || isPlatformAdmin) tabs.push('config')
    return tabs
  }, [isCompanyAdmin, isOversight, isEmployeeUser, isPlatformAdmin])

  const [tab, setTab] = useState('inventory')

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  const moduleDisabled = !config.moduleEnabled

  return (
    <>
      <CommonHeader title='Asset Management' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isNonUser ? (
            <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
              <Package size={32} className='text-neutral-1000' />
              <p className='text-neutral-1600 text-paragraph-md font-medium'>
                No system access for this workforce type
              </p>
              <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
                Employee (Non-User) members don't sign in. Their asset requisitions and
                receipt/return acknowledgements are raised and recorded on their behalf by
                a Company Admin.
              </p>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className='w-full'>
              <TabsList className='mb-3 bg-transparent p-0'>
                {(isCompanyAdmin || isOversight) && (
                  <TabsTrigger variant='primary' value='inventory'>
                    Inventory
                  </TabsTrigger>
                )}
                {isEmployeeUser && (
                  <TabsTrigger variant='primary' value='my-assets'>
                    My Assets
                  </TabsTrigger>
                )}
                {(isCompanyAdmin || isEmployeeUser) && (
                  <TabsTrigger variant='primary' value='requisitions'>
                    Requisitions
                  </TabsTrigger>
                )}
                {isCompanyAdmin && (
                  <>
                    <TabsTrigger variant='primary' value='movements'>
                      Arrivals & Outbound
                    </TabsTrigger>
                    <TabsTrigger variant='primary' value='workflows'>
                      Workflows
                    </TabsTrigger>
                  </>
                )}
                {(isCompanyAdmin || isOversight) && (
                  <TabsTrigger variant='primary' value='reports'>
                    Reports
                  </TabsTrigger>
                )}
                {(isCompanyAdmin || isPlatformAdmin) && (
                  <TabsTrigger variant='primary' value='config'>
                    Configuration
                  </TabsTrigger>
                )}
              </TabsList>

              {moduleDisabled && tab !== 'config' ? (
                <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
                  <Package size={32} className='text-neutral-1000' />
                  <p className='text-neutral-1600 text-paragraph-md font-medium'>
                    Asset tracking is disabled for this company
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
                    The enable-asset-module setting is No, so requisition, issuance,
                    arrival and outbound screens are hidden.
                    {isCompanyAdmin
                      ? ' Re-enable it from the Configuration tab.'
                      : ' Contact your Company Admin to enable it.'}
                  </p>
                </div>
              ) : (
                <>
                  {(isCompanyAdmin || isOversight) && (
                    <TabsContent value='inventory'>
                      <InventoryTab store={store} config={config} />
                    </TabsContent>
                  )}
                  {isEmployeeUser && (
                    <TabsContent value='my-assets'>
                      <MyAssetsTab store={store} config={config} />
                    </TabsContent>
                  )}
                  {(isCompanyAdmin || isEmployeeUser) && (
                    <TabsContent value='requisitions'>
                      <RequisitionsTab
                        reqStore={reqStore}
                        assetsStore={store}
                        config={config}
                      />
                    </TabsContent>
                  )}
                  {isCompanyAdmin && (
                    <>
                      <TabsContent value='movements'>
                        <MovementsTab
                          movements={movements}
                          assetsStore={store}
                          config={config}
                        />
                      </TabsContent>
                      <TabsContent value='workflows'>
                        <WorkflowsTab store={store} />
                      </TabsContent>
                    </>
                  )}
                  {(isCompanyAdmin || isOversight) && (
                    <TabsContent value='reports'>
                      <ReportsTab assetsStore={store} reqStore={reqStore} config={config} />
                    </TabsContent>
                  )}
                  {(isCompanyAdmin || isPlatformAdmin) && (
                    <TabsContent value='config'>
                      <ConfigTab config={config} assets={store.assets} />
                    </TabsContent>
                  )}
                </>
              )}
            </Tabs>
          )}
        </div>
      </Main>
    </>
  )
}
