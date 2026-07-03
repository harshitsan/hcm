import { useState } from 'react'
import { useRole, type Role } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { BuilderTab } from './components/builder-tab'
import { CatalogTab } from './components/catalog-tab'
import { ComplianceTab } from './components/compliance-tab'
import { DashboardsTab } from './components/dashboards-tab'
import { GovernanceTab } from './components/governance-tab'
import { MyReportsTab } from './components/my-reports-tab'
import { NonUserPanel } from './components/non-user-panel'
import { ReportsSummary } from './components/reports-summary'
import { ScheduleOverlay } from './components/schedule-overlay'
import { SchedulesTab } from './components/schedules-tab'
import { ROLE_COMPANY_ACCESS } from './data/governance'
import { useCompliance } from './hooks/use-compliance'
import { useReportConfig } from './hooks/use-report-config'
import { useSavedViews } from './hooks/use-saved-views'
import { useSchedules } from './hooks/use-schedules'

/** Named persona acting for each canonical role. */
const ACTORS: Record<Role, string> = {
  'Platform Admin': 'Platform Ops',
  'Portfolio Admin': 'Devika Rao',
  'Group Company Admin': 'Arjun Mehta',
  'Company Admin': 'Sunita Patil',
  'Employee (User)': 'Ananya Rao',
  'Employee (Non-User)': 'Ravi Naik',
}

interface TabDef {
  value: string
  label: string
  roles: Role[]
}

/**
 * Which tabs each role sees, ordered task-first: employees land on their
 * self-service surface, admins on their role-based default dashboard
 * (RPT-05). Admin-only desks (schedules, compliance registers, governance)
 * are folded into a single "Admin" tab with the same role gates.
 */
const TABS: TabDef[] = [
  { value: 'my-reports', label: 'My Reports', roles: ['Employee (User)'] },
  { value: 'my-data', label: 'My Data', roles: ['Employee (Non-User)'] },
  {
    value: 'dashboards',
    label: 'Dashboards',
    roles: [
      'Platform Admin',
      'Portfolio Admin',
      'Group Company Admin',
      'Company Admin',
      'Employee (User)',
    ],
  },
  {
    value: 'catalog',
    label: 'All Reports',
    roles: [
      'Platform Admin',
      'Portfolio Admin',
      'Group Company Admin',
      'Company Admin',
    ],
  },
  {
    value: 'builder',
    label: 'Build a Report',
    roles: ['Portfolio Admin', 'Group Company Admin', 'Company Admin'],
  },
  {
    value: 'admin',
    label: 'Admin',
    roles: ['Company Admin', 'Platform Admin'],
  },
]

/** Admin-only surfaces nested under the "Admin" tab; same gates as before. */
const ADMIN_TABS: TabDef[] = [
  {
    value: 'schedules',
    label: 'Scheduled Emails',
    roles: ['Company Admin', 'Platform Admin'],
  },
  {
    value: 'compliance',
    label: 'Compliance',
    roles: ['Company Admin', 'Platform Admin'],
  },
  {
    value: 'governance',
    label: 'Access & Settings',
    roles: ['Platform Admin'],
  },
]

/**
 * Reports & Analytics — standard report catalog, role-based dashboards,
 * ad hoc builder with saved views, scheduled email delivery, statutory
 * compliance registers and platform governance (RPT-01 … RPT-46).
 */
export function ReportsAnalytics() {
  const { role, hasRole } = useRole()

  const config = useReportConfig()
  const schedules = useSchedules()
  const compliance = useCompliance()
  const views = useSavedViews()

  // RLS-style scoping: every tab reports over these companies only
  // (RPT-12, RPT-17, RPT-18, RPT-20).
  const companies = ROLE_COMPANY_ACCESS[role]
  const scopeLabel =
    companies.length === 0 ? 'No direct access' : companies.join(', ')
  const actor = ACTORS[role]

  const layout =
    config.roleDashboards.find((m) => m.role === role)?.layout ??
    'Operations Overview'

  // "Schedule delivery" launched from a catalog report run (RPT-09).
  const [presetReport, setPresetReport] = useState<string | null>(null)

  const visibleAdminTabs = ADMIN_TABS.filter((t) => t.roles.includes(role))
  const visibleTabs = TABS.filter(
    (t) =>
      t.roles.includes(role) &&
      (t.value !== 'admin' || visibleAdminTabs.length > 0)
  )
  const isAdmin = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )

  const summaryItems = [
    {
      label: 'Catalog reports',
      value: String(config.reports.filter((r) => r.enabled).length),
    },
    {
      label: 'Active schedules',
      value: String(
        schedules.schedules.filter((s) => s.status === 'active').length
      ),
    },
    {
      label: 'Completeness gaps',
      value: String(
        compliance.flagged.filter(({ emp }) => companies.includes(emp.company))
          .length
      ),
    },
    { label: 'Saved views', value: String(views.views.length) },
  ]

  return (
    <>
      <CommonHeader title='Reports & Analytics' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isAdmin && <ReportsSummary items={summaryItems} />}

          <Tabs defaultValue={visibleTabs[0]?.value} key={role}>
            <TabsList className='mb-2 flex-wrap'>
              {visibleTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='dashboards'>
              <DashboardsTab
                role={role}
                layout={layout}
                companies={companies}
              />
            </TabsContent>

            <TabsContent value='catalog'>
              <CatalogTab
                reports={config.reports}
                companies={companies}
                allowCompanyGrouping={companies.length > 1}
                onSchedule={(reportName) => setPresetReport(reportName)}
              />
            </TabsContent>

            <TabsContent value='my-reports'>
              <MyReportsTab reports={config.reports} companies={companies} />
            </TabsContent>

            <TabsContent value='builder'>
              <BuilderTab
                fields={config.fields}
                companies={companies}
                views={views}
              />
            </TabsContent>

            <TabsContent value='admin'>
              <Tabs defaultValue={visibleAdminTabs[0]?.value} key={role}>
                <TabsList className='mb-2 flex-wrap'>
                  {visibleAdminTabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value='schedules'>
                  <SchedulesTab
                    store={schedules}
                    reports={config.reports}
                    actor={actor}
                    scope={scopeLabel}
                  />
                </TabsContent>

                <TabsContent value='compliance'>
                  <ComplianceTab
                    store={compliance}
                    templates={config.templates}
                    companies={companies}
                  />
                </TabsContent>

                <TabsContent value='governance'>
                  <GovernanceTab config={config} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value='my-data'>
              <NonUserPanel />
            </TabsContent>
          </Tabs>
        </div>
      </Main>

      <ScheduleOverlay
        open={presetReport !== null}
        onOpenChange={(open) => {
          if (!open) setPresetReport(null)
        }}
        presetReport={presetReport}
        reports={config.reports}
        createdBy={actor}
        scope={scopeLabel}
        onSubmit={(draft) => schedules.addSchedule(draft)}
      />
    </>
  )
}
