import { Prohibit } from 'phosphor-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { AuditTab } from './components/audit-tab'
import { CompanyCalendarTab } from './components/company-calendar-tab'
import { ConfigTab } from './components/config-tab'
import { EnginesTab } from './components/engines-tab'
import { HolidaysTab } from './components/holidays-tab'
import { MyLeaveTab } from './components/my-leave-tab'
import { NonUserTab } from './components/non-user-tab'
import { PlatformTab } from './components/platform-tab'
import { ReportsTab } from './components/reports-tab'
import { RequestsTab } from './components/requests-tab'
import { TeamTab } from './components/team-tab'
import { CURRENT_EMPLOYEE_ID } from './data/shared'
import { useBalances } from './hooks/use-balances'
import { useLeaveAudit } from './hooks/use-leave-audit'
import { useLeaveConfig } from './hooks/use-leave-config'
import { useLeaveRequests } from './hooks/use-leave-requests'
import { useLeaveSettings } from './hooks/use-leave-settings'

/** Named persona acting for each canonical role (used on audit entries). */
const ACTORS: Record<Role, string> = {
  'Platform Admin': 'Platform Ops',
  'Portfolio Admin': 'Devika Rao',
  'Group Company Admin': 'Arjun Mehta',
  'Company Admin': 'Sunita Patil',
  'Employee (User)': 'Ananya Sharma',
  'Employee (Non-User)': 'Ravi Naik',
}

interface TabDef {
  value: string
  label: string
  roles: Role[]
}

/**
 * Which tabs each role sees. The first visible tab becomes the default —
 * self-service for employees, the request desk for Company Admins,
 * configuration for group admins, reports for portfolio oversight and the
 * platform/engines surfaces for Platform Admins.
 */
const TABS: TabDef[] = [
  { value: 'my-leave', label: 'My Leave', roles: ['Employee (User)'] },
  { value: 'holidays', label: 'Holiday List', roles: ['Employee (User)'] },
  { value: 'team', label: 'Team Functions', roles: ['Employee (User)'] },
  { value: 'records', label: 'My Records', roles: ['Employee (Non-User)'] },
  { value: 'requests', label: 'Requests', roles: ['Company Admin'] },
  {
    value: 'calendar',
    label: 'Company Calendar',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  {
    value: 'config',
    label: 'Configuration',
    roles: ['Company Admin', 'Group Company Admin', 'Portfolio Admin'],
  },
  {
    value: 'reports',
    label: 'Reports',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'audit',
    label: 'Audit & Notifications',
    roles: ['Company Admin', 'Platform Admin'],
  },
  { value: 'platform', label: 'Platform', roles: ['Platform Admin'] },
  { value: 'engines', label: 'Shared Engines', roles: ['Platform Admin'] },
]

/**
 * Leave Management — differentiated policies, leave types, requests with
 * sequential/parallel workflows, delegation, SLA escalation, overrides with
 * an immutable audit trail, calendars, holiday lists, reports and the
 * platform-level engine/tenancy surfaces (LVE-01 … LVE-49).
 */
export function LeaveManagement() {
  const { role, hasRole } = useRole()
  const actor = ACTORS[role]

  // Store wiring: every override and workflow event funnels into the
  // append-only audit store; notifications render through the template feed.
  const audit = useLeaveAudit()
  const balances = useBalances({
    append: audit.append,
    notify: audit.notify,
    actor,
    actorRole: role,
  })
  const config = useLeaveConfig({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const settings = useLeaveSettings({ notify: audit.notify })
  const requests = useLeaveRequests({
    balances,
    leaveTypes: config.leaveTypes,
    delegations: config.delegations,
    fmlaApprovers: settings.fmlaApprovers,
    classRules: settings.classRules,
    notify: audit.notify,
    actor,
  })

  const visibleTabs = TABS.filter((t) => t.roles.includes(role))
  const isEmployee = hasRole('Employee (User)', 'Employee (Non-User)')

  return (
    <>
      <CommonHeader title='Leave Management' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {/* LVE-47: with the module disabled, employee-facing leave features
              are unavailable until a Company Admin re-enables it in Setup. */}
          {!settings.moduleEnabled && isEmployee ? (
            <div className='flex items-start gap-3 rounded-[8px] border border-gray-200 bg-white p-5'>
              <Prohibit
                size={20}
                weight='bold'
                className='text-neutral-1000 mt-0.5 shrink-0'
              />
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  Time-off management is currently disabled
                </p>
                <p className='text-paragraph-sm text-neutral-1000 pt-1'>
                  Your organization has switched off the leave module. Leave
                  requests, balances and holiday lists will be available again
                  once a Company Admin re-enables it under Configuration →
                  Setup & Rules.
                </p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue={visibleTabs[0]?.value} key={role}>
              <TabsList className='mb-2 flex-wrap'>
                {visibleTabs.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value='my-leave'>
                <MyLeaveTab
                  employeeId={CURRENT_EMPLOYEE_ID}
                  requests={requests}
                  balances={balances}
                  leaveTypes={config.orderedTypes}
                  fmlaReasons={settings.fmlaReasons}
                />
              </TabsContent>

              <TabsContent value='holidays'>
                <HolidaysTab settings={settings} />
              </TabsContent>

              <TabsContent value='team'>
                <TeamTab
                  requests={requests}
                  balances={balances}
                  settings={settings}
                  leaveTypes={config.orderedTypes}
                  fmlaReasons={settings.fmlaReasons}
                />
              </TabsContent>

              <TabsContent value='records'>
                <NonUserTab
                  requests={requests}
                  balances={balances}
                  leaveTypes={config.orderedTypes}
                  fmlaReasons={settings.fmlaReasons}
                />
              </TabsContent>

              <TabsContent value='requests'>
                <RequestsTab
                  requests={requests}
                  balances={balances}
                  leaveTypes={config.orderedTypes}
                  fmlaReasons={settings.fmlaReasons}
                  actor={actor}
                />
              </TabsContent>

              <TabsContent value='calendar'>
                <CompanyCalendarTab requests={requests} settings={settings} />
              </TabsContent>

              <TabsContent value='config'>
                <ConfigTab config={config} settings={settings} />
              </TabsContent>

              <TabsContent value='reports'>
                <ReportsTab
                  balances={balances}
                  config={config}
                  portfolio={hasRole('Portfolio Admin', 'Platform Admin')}
                />
              </TabsContent>

              <TabsContent value='audit'>
                <AuditTab audit={audit} />
              </TabsContent>

              <TabsContent value='platform'>
                <PlatformTab settings={settings} />
              </TabsContent>

              <TabsContent value='engines'>
                <EnginesTab config={config} balances={balances} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Main>
    </>
  )
}
