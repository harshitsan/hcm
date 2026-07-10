import { useMemo } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { DirectorySummary } from './components/directory-summary'
import { DirectoryTab } from './components/directory-tab'
import { FeedbackWorklistTab } from './components/feedback-worklist-tab'
import { GovernanceTab } from './components/governance-tab'
import { OrgChartTab } from './components/org-chart-tab'
import { PrivacyConfigTab } from './components/privacy-config-tab'
import { TimelineSettingsCard } from './components/timeline-settings-card'
import { VacanciesTab } from './components/vacancies-tab'
import { useDirectory } from './hooks/use-directory'
import { useDirectoryConfig } from './hooks/use-directory-config'
import { useTimeline } from './hooks/use-timeline'
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
  const timeline = useTimeline()

  const isCompanyAdmin = role === 'Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'
  const showAdmin = isCompanyAdmin || isPlatformAdmin

  const tabs = useMemo<TabDef[]>(() => {
    const list: TabDef[] = [
      { value: 'directory', label: 'Directory' },
      { value: 'org-chart', label: 'Org Chart' },
      { value: 'vacancies', label: 'Vacancies' },
    ]
    if (showAdmin) {
      list.push({ value: 'feedback', label: 'Feedback & Grievance' })
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
            <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
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
              <DirectoryTab store={store} config={config} timeline={timeline} />
            </TabsContent>
            <TabsContent value='org-chart'>
              <OrgChartTab store={store} config={config} />
            </TabsContent>
            <TabsContent value='vacancies'>
              <VacanciesTab />
            </TabsContent>
            {showAdmin && (
              <TabsContent value='feedback'>
                <FeedbackWorklistTab store={store} />
              </TabsContent>
            )}
            {showAdmin && (
              <TabsContent value='admin'>
                <div className='flex flex-col gap-6'>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Privacy & fields</h3>
                    <PrivacyConfigTab config={config} />
                  </section>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Timeline settings</h3>
                    <TimelineSettingsCard timeline={timeline} />
                  </section>
                  {isPlatformAdmin && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Data checks</h3>
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
