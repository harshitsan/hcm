import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { GovernanceTab } from './components/governance-tab'
import { LocationsTab } from './components/locations-tab'
import { MyLocationTab } from './components/my-location-tab'
import { SharingTab } from './components/sharing-tab'
import { useLocations } from './hooks/use-locations'
import { useOrganization } from './hooks/use-organization'

interface TabDef {
  value: string
  label: string
}

/**
 * Locations module: company-scoped physical sites tied to a single
 * jurisdiction, with explicit group-company sharing backed by a versioned
 * audit trail. Company profile + Regional settings now live under Companies →
 * Admin; the Locations Admin tab carries only Platform Admin data-quality
 * tooling. Visible tabs vary with the active role.
 */
export function Locations() {
  const { role } = useRole()
  const store = useLocations()
  const org = useOrganization()

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isGroupAdmin = role === 'Group Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'

  // Company profile + Regional settings moved to Companies → Admin; the
  // Locations Admin tab now only carries Platform Admin data-quality tooling.
  const adminSections = useMemo<TabDef[]>(() => {
    const list: TabDef[] = []
    if (isPlatformAdmin) {
      list.push({ value: 'governance', label: 'Data quality' })
    }
    return list
  }, [isPlatformAdmin])

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Location' }]
    const list: TabDef[] = [{ value: 'locations', label: 'Locations' }]
    if (isGroupAdmin || isPlatformAdmin) {
      list.push({ value: 'sharing', label: 'Sharing' })
    }
    if (adminSections.length > 0) {
      list.push({ value: 'admin', label: 'Admin' })
    }
    return list
  }, [isEmployee, isGroupAdmin, isPlatformAdmin, adminSections])

  return (
    <>
      <CommonHeader title='Locations' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue={takeRequestedTab('/locations') ?? tabs[0].value} className='w-full'>
            <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {isEmployee && (
              <TabsContent value='my'>
                <MyLocationTab store={store} org={org} />
              </TabsContent>
            )}
            {!isEmployee && (
              <TabsContent value='locations'>
                <LocationsTab store={store} org={org} />
              </TabsContent>
            )}
            {(isGroupAdmin || isPlatformAdmin) && (
              <TabsContent value='sharing'>
                <SharingTab store={store} org={org} />
              </TabsContent>
            )}
            {adminSections.length > 0 && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Locations' />
                <div className='flex flex-col gap-6'>
                  {isPlatformAdmin && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Data quality</h3>
                      <GovernanceTab store={store} />
                    </section>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
