import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { GovernanceTab } from './components/governance-tab'
import { LocalizationTab } from './components/localization-tab'
import { LocationsTab } from './components/locations-tab'
import { MyLocationTab } from './components/my-location-tab'
import { OrganizationTab } from './components/organization-tab'
import { SharingTab } from './components/sharing-tab'
import { useLocations } from './hooks/use-locations'
import { useOrganization } from './hooks/use-organization'

interface TabDef {
  value: string
  label: string
}

/**
 * Locations module: company-scoped physical sites tied to a single
 * jurisdiction, explicit group-company sharing with a versioned audit trail,
 * head-office organization setup and localization settings. Visible tabs vary
 * with the active role.
 */
export function Locations() {
  const { role } = useRole()
  const store = useLocations()
  const org = useOrganization()

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isCompanyAdmin = role === 'Company Admin'
  const isGroupAdmin = role === 'Group Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Location' }]
    const list: TabDef[] = [{ value: 'locations', label: 'Locations' }]
    if (isGroupAdmin || isPlatformAdmin) {
      list.push({ value: 'sharing', label: 'Sharing & Audit' })
    }
    if (isPlatformAdmin) {
      list.push({ value: 'governance', label: 'Data Governance' })
    }
    if (isCompanyAdmin) {
      list.push(
        { value: 'organization', label: 'Organization' },
        { value: 'localization', label: 'Localization' }
      )
    }
    return list
  }, [isEmployee, isCompanyAdmin, isGroupAdmin, isPlatformAdmin])

  return (
    <>
      <CommonHeader title='Locations' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue={tabs[0].value} className='w-full'>
            <TabsList className='mb-2'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

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
            {isPlatformAdmin && (
              <TabsContent value='governance'>
                <GovernanceTab store={store} />
              </TabsContent>
            )}
            {isCompanyAdmin && (
              <>
                <TabsContent value='organization'>
                  <OrganizationTab org={org} store={store} />
                </TabsContent>
                <TabsContent value='localization'>
                  <LocalizationTab org={org} />
                </TabsContent>
              </>
            )}
            {isEmployee && (
              <TabsContent value='my'>
                <MyLocationTab store={store} org={org} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
