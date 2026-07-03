import { useMemo } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { DirectorySummary } from './components/directory-summary'
import { DirectoryTab } from './components/directory-tab'
import { GovernanceTab } from './components/governance-tab'
import { OrgChartTab } from './components/org-chart-tab'
import { PrivacyConfigTab } from './components/privacy-config-tab'
import { useDirectory } from './hooks/use-directory'
import { useDirectoryConfig } from './hooks/use-directory-config'
import { scopedCompanies } from './utils/org'

interface TabDef {
  value: string
  label: string
}

/**
 * Directory & Org Chart module: privacy-governed employee directory with
 * multiple views and advanced search, an organizational chart viewable as of
 * a date, and a single Admin tab that groups privacy/field configuration and
 * platform data checks. Visible tabs vary with the active role.
 */
export function DirectoryOrgChart() {
  const { role } = useRole()
  const store = useDirectory()
  const config = useDirectoryConfig()

  const isCompanyAdmin = role === 'Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'
  const showAdmin = isCompanyAdmin || isPlatformAdmin

  const tabs = useMemo<TabDef[]>(() => {
    const list: TabDef[] = [
      { value: 'directory', label: 'Directory' },
      { value: 'org-chart', label: 'Org Chart' },
    ]
    if (showAdmin) {
      list.push({ value: 'admin', label: 'Admin' })
    }
    return list
  }, [showAdmin])

  const companies = useMemo(() => scopedCompanies(role), [role])
  const scopedEmployees = useMemo(() => {
    const ids = new Set(companies.map((c) => c.id))
    return store.employees.filter((e) => ids.has(e.companyId))
  }, [store.employees, companies])

  return (
    <>
      <CommonHeader title='Directory & Org Chart' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <DirectorySummary
            employees={scopedEmployees}
            companiesInScope={companies.length}
          />

          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue='directory' className='w-full'>
            <TabsList className='mb-2'>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  variant='primary'
                  value={tab.value}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='directory'>
              <DirectoryTab store={store} config={config} />
            </TabsContent>
            <TabsContent value='org-chart'>
              <OrgChartTab store={store} config={config} />
            </TabsContent>
            {showAdmin && (
              <TabsContent value='admin'>
                <Tabs defaultValue='privacy' className='w-full'>
                  <TabsList className='mb-2'>
                    <TabsTrigger value='privacy'>Privacy & fields</TabsTrigger>
                    {isPlatformAdmin && (
                      <TabsTrigger value='data-checks'>Data checks</TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value='privacy'>
                    <PrivacyConfigTab config={config} />
                  </TabsContent>
                  {isPlatformAdmin && (
                    <TabsContent value='data-checks'>
                      <GovernanceTab store={store} />
                    </TabsContent>
                  )}
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
