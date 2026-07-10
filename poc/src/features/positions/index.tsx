import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { AssignmentsTab } from './components/assignments-tab'
import { CatalogueTab } from './components/catalogue-tab'
import { ConfigTab } from './components/config-tab'
import { GovernanceTab } from './components/governance-tab'
import { MyPositionTab } from './components/my-position-tab'
import { PositionsSummary } from './components/positions-summary'
import { RecruitmentTab } from './components/recruitment-tab'
import { ReportsTab } from './components/reports-tab'
import {
  COMPANIES,
  CURRENT_COMPANY_ID,
  CURRENT_GROUP_ID,
  CURRENT_PORTFOLIO_ID,
  DEPARTMENTS,
} from './data/positions'
import { useEmployees } from './hooks/use-employees'
import { useOrgConfig } from './hooks/use-org-config'
import { usePositions } from './hooks/use-positions'
import { useRecruitment } from './hooks/use-recruitment'

interface TabDef {
  value: string
  label: string
}

/**
 * Positions module: the company-scoped position catalogue (department +
 * level + status + custom fields), employee/classification/project-role
 * assignments, recruitment consumption, org reporting, guided organization
 * configuration and multi-tenant governance. Visible tabs vary with the
 * active role.
 */
export function Positions() {
  const { role } = useRole()
  const store = usePositions()
  const employees = useEmployees()
  const orgConfig = useOrgConfig()
  const recruitment = useRecruitment()
  const [companyId, setCompanyId] = useState(CURRENT_COMPANY_ID)

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isCompanyAdmin = role === 'Company Admin'
  const isGroupAdmin = role === 'Group Company Admin'
  const isOversight =
    isGroupAdmin || role === 'Portfolio Admin' || role === 'Platform Admin'

  /** Tenant scope: which companies the active role may even see (POS-06/09/16). */
  const scopedCompanies = useMemo(() => {
    switch (role) {
      case 'Platform Admin':
        return COMPANIES
      case 'Portfolio Admin':
        return COMPANIES.filter((c) => c.portfolioId === CURRENT_PORTFOLIO_ID)
      case 'Group Company Admin':
        return COMPANIES.filter((c) => c.groupId === CURRENT_GROUP_ID)
      default:
        return COMPANIES.filter((c) => c.id === CURRENT_COMPANY_ID)
    }
  }, [role])

  // Keep the selected company inside the active scope after role switches.
  const activeCompanyId = scopedCompanies.some((c) => c.id === companyId)
    ? companyId
    : scopedCompanies[0].id

  // Group admins manage positions within their group; portfolio/platform
  // admins govern read-only (POS-09/16/22).
  const canManage = isCompanyAdmin || isGroupAdmin

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Position' }]
    const list: TabDef[] = [{ value: 'catalogue', label: 'All Positions' }]
    if (isCompanyAdmin) {
      list.push(
        { value: 'assignments', label: 'Assignments' },
        { value: 'recruitment', label: 'Hiring' },
        { value: 'reports', label: 'Reports' }
      )
    }
    // Configuration + Governance fold into a single Admin tab; the same
    // role gates apply inside it, so it only appears for roles with content.
    if (isCompanyAdmin || isOversight) {
      list.push({ value: 'admin', label: 'Admin' })
    }
    return list
  }, [isEmployee, isCompanyAdmin, isOversight])

  const scopedPositions = store.positions.filter(
    (p) => p.companyId === activeCompanyId
  )
  const scopedEmployees = employees.employees.filter(
    (e) => e.companyId === activeCompanyId
  )

  return (
    <>
      <CommonHeader title='Positions' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {!isEmployee && (
            <PositionsSummary
              positions={scopedPositions}
              employees={scopedEmployees}
            />
          )}

          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue={tabs[0].value} className='w-full'>
            <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {!isEmployee && (
              <TabsContent value='catalogue'>
                <CatalogueTab
                  companies={scopedCompanies}
                  companyId={activeCompanyId}
                  onCompanyChange={setCompanyId}
                  departments={DEPARTMENTS}
                  store={store}
                  employees={employees}
                  orgConfig={orgConfig}
                  canManage={canManage}
                />
              </TabsContent>
            )}

            {isCompanyAdmin && (
              <>
                <TabsContent value='assignments'>
                  <AssignmentsTab
                    companyId={activeCompanyId}
                    departments={DEPARTMENTS}
                    store={store}
                    employees={employees}
                    orgConfig={orgConfig}
                  />
                </TabsContent>
                <TabsContent value='recruitment'>
                  <RecruitmentTab
                    companyId={activeCompanyId}
                    departments={DEPARTMENTS}
                    store={store}
                    employees={employees}
                    orgConfig={orgConfig}
                    recruitment={recruitment}
                  />
                </TabsContent>
                <TabsContent value='reports'>
                  <ReportsTab
                    companyId={activeCompanyId}
                    positions={store.positions}
                    departments={DEPARTMENTS}
                    employees={employees.employees}
                    assignmentHistory={employees.assignmentHistory}
                  />
                </TabsContent>
              </>
            )}

            {(isCompanyAdmin || isOversight) && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Positions' />
                <div className='flex flex-col gap-6'>
                  {isCompanyAdmin && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Settings</h3>
                      <ConfigTab
                        companyId={activeCompanyId}
                        store={store}
                        orgConfig={orgConfig}
                      />
                    </section>
                  )}
                  {isOversight && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Company Oversight</h3>
                      <GovernanceTab
                        companies={scopedCompanies}
                        departments={DEPARTMENTS}
                        positions={store.positions}
                        employees={employees.employees}
                        orgConfig={orgConfig}
                        store={store}
                      />
                    </section>
                  )}
                </div>
              </TabsContent>
            )}

            {isEmployee && (
              <TabsContent value='my'>
                <MyPositionTab
                  positions={store.positions}
                  departments={DEPARTMENTS}
                  employees={employees}
                  orgConfig={orgConfig}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
