import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { ConfigTab } from './components/config-tab'
import { DepartmentsSummary } from './components/departments-summary'
import { DirectoryTab } from './components/directory-tab'
import { GovernanceTab } from './components/governance-tab'
import { MembersTab } from './components/members-tab'
import { MyDepartmentsTab } from './components/my-departments-tab'
import { OrgTreeTab } from './components/org-tree-tab'
import { ShiftsTab } from './components/shifts-tab'
import { CURRENT_COMPANY_ID } from './data/departments'
import { useDepartmentConfig } from './hooks/use-department-config'
import { useDepartments } from './hooks/use-departments'

interface TabDef {
  value: string
  label: string
}

/**
 * Departments module: company org structure (n-level hierarchy, heads,
 * membership), scheduling & sites, governed configuration and multi-tenant
 * oversight. Visible tabs vary with the active role.
 */
export function Departments() {
  const { role } = useRole()
  const store = useDepartments()
  const config = useDepartmentConfig(store.logEvent)

  const isEmployee = role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isCompanyAdmin = role === 'Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Departments' }]
    const list: TabDef[] = [
      { value: 'directory', label: 'Directory' },
      { value: 'tree', label: 'Org Chart' },
    ]
    if (isCompanyAdmin) {
      list.push(
        { value: 'members', label: 'Members' },
        { value: 'shifts', label: 'Shifts & Sites' }
      )
    }
    if (isCompanyAdmin || isPlatformAdmin) {
      list.push({ value: 'admin', label: 'Admin' })
    }
    return list
  }, [isEmployee, isCompanyAdmin, isPlatformAdmin])

  const companyDepartments = store.departments.filter(
    (d) => d.companyId === CURRENT_COMPANY_ID
  )
  const companyEmployees = store.employees.filter(
    (e) => e.companyId === CURRENT_COMPANY_ID
  )

  return (
    <>
      <CommonHeader title='Departments' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {!isEmployee && (
            <DepartmentsSummary
              departments={companyDepartments}
              employees={companyEmployees}
            />
          )}

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
              <>
                <TabsContent value='directory'>
                  <DirectoryTab store={store} config={config} />
                </TabsContent>
                <TabsContent value='tree'>
                  <OrgTreeTab store={store} customFields={config.customFields} />
                </TabsContent>
              </>
            )}
            {isCompanyAdmin && (
              <>
                <TabsContent value='members'>
                  <MembersTab store={store} />
                </TabsContent>
                <TabsContent value='shifts'>
                  <ShiftsTab store={store} />
                </TabsContent>
              </>
            )}
            {(isCompanyAdmin || isPlatformAdmin) && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Departments' />
                {isCompanyAdmin ? (
                  <Tabs defaultValue='settings' className='w-full'>
                    <TabsList className='bg-transparent p-0'>
                      <TabsTrigger variant='ghost' value='settings'>
                        Settings
                      </TabsTrigger>
                      <TabsTrigger variant='ghost' value='reports'>
                        Reports & audit
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value='settings'>
                      <ConfigTab store={store} config={config} />
                    </TabsContent>
                    <TabsContent value='reports'>
                      <GovernanceTab store={store} config={config} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <GovernanceTab store={store} config={config} />
                )}
              </TabsContent>
            )}
            {isEmployee && (
              <TabsContent value='my'>
                <MyDepartmentsTab store={store} config={config} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
