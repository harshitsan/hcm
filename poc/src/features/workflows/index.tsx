import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { ApproverGroupsTab } from './components/approver-groups-tab'
import { AuditTab } from './components/audit-tab'
import { DefinitionsTab } from './components/definitions-tab'
import { InstancesTab } from './components/instances-tab'
import { PlatformTab } from './components/platform-tab'
import { RoutingTab } from './components/routing-tab'
import { SlaTab } from './components/sla-tab'
import { ACTORS, companiesForRole } from './data/shared'
import { useApproverGroups } from './hooks/use-approver-groups'
import { useAttendanceConfig } from './hooks/use-attendance-config'
import { useAuditTrail } from './hooks/use-audit-trail'
import { useDefinitions } from './hooks/use-definitions'
import { useInstances } from './hooks/use-instances'
import { usePlatform } from './hooks/use-platform'
import { useRouting } from './hooks/use-routing'
import { useSlaConfig } from './hooks/use-sla-config'

interface TabDef {
  value: string
  label: string
  roles: Role[]
}

/**
 * Which tabs each role sees; the first visible tab is the default.
 * Configuration surfaces belong to Company/Group admins (WFE-01, WFE-16);
 * Portfolio Admins get cross-company monitoring (WFE-17); Platform Admins
 * get tenant provisioning + engine health (WFE-18, WFE-19); Employee (User)
 * gets the approver inbox (WFE-13, WFE-26).
 */
const TABS: TabDef[] = [
  {
    value: 'definitions',
    label: 'Definitions',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'instances',
    label: 'Instances',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Employee (User)',
    ],
  },
  {
    value: 'approvers',
    label: 'Approver Groups',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  {
    value: 'routing',
    label: 'Routing & Rules',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  {
    value: 'sla',
    label: 'SLA & Escalations',
    roles: ['Company Admin', 'Group Company Admin', 'Portfolio Admin'],
  },
  {
    value: 'platform',
    label: 'Platform & Configuration',
    roles: ['Platform Admin', 'Company Admin'],
  },
  {
    value: 'audit',
    label: 'Audit Trail',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
]

/**
 * Workflow Engine — configurable multi-level approval workflows: versioned,
 * effective-dated definitions with a metadata-driven designer; running
 * instances with sequential / parallel-any / parallel-all semantics and an
 * approver inbox; per-process approver chains; a governed routing decision
 * table; business-hour SLAs with 50/75/100 thresholds and escalation
 * strategies; per-module toggles and platform tenant health; and a complete
 * audit trail (WFE-01 … WFE-42).
 */
export function Workflows() {
  const { role, hasRole } = useRole()
  const actor = ACTORS[role]
  const companies = companiesForRole(role)

  const audit = useAuditTrail()
  const definitions = useDefinitions({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const instances = useInstances({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const approverGroups = useApproverGroups({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const routing = useRouting({ append: audit.append, actor, actorRole: role })
  const slaConfig = useSlaConfig({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const attendanceConfig = useAttendanceConfig({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const platform = usePlatform({ append: audit.append })

  const canConfigure = hasRole('Company Admin', 'Group Company Admin')
  const visibleTabs = TABS.filter((t) => t.roles.includes(role))

  return (
    <>
      <CommonHeader title='Workflow Engine' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {visibleTabs.length === 0 ? (
            <Card className='border-gray-200'>
              <CardContent className='py-10 text-center'>
                <p className='text-neutral-1600 text-paragraph-md font-medium'>
                  No workflow surfaces for this role
                </p>
                <p className='text-neutral-1000 mt-1 text-sm'>
                  Approvals for non-user employees are raised and tracked by
                  their manager or HR on their behalf.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={visibleTabs[0]?.value} key={role}>
              <TabsList className='mb-2 flex-wrap'>
                {visibleTabs.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value='instances'>
                <InstancesTab
                  store={instances}
                  rules={routing.rules}
                  definitions={definitions.definitions}
                  events={audit.events}
                  companies={companies}
                  role={role}
                />
              </TabsContent>

              <TabsContent value='definitions'>
                <DefinitionsTab
                  store={definitions}
                  companies={companies}
                  calendars={slaConfig.calendars}
                  canConfigure={canConfigure}
                />
              </TabsContent>

              <TabsContent value='approvers'>
                <ApproverGroupsTab store={approverGroups} />
              </TabsContent>

              <TabsContent value='routing'>
                <RoutingTab
                  routing={routing}
                  attendance={attendanceConfig}
                  definitions={definitions.definitions}
                  canConfigure={canConfigure}
                />
              </TabsContent>

              <TabsContent value='sla'>
                <SlaTab store={slaConfig} canConfigure={canConfigure} />
              </TabsContent>

              <TabsContent value='platform'>
                <PlatformTab platform={platform} attendance={attendanceConfig} />
              </TabsContent>

              <TabsContent value='audit'>
                <AuditTab
                  events={audit.events}
                  companies={companies}
                  showPlatformEvents={hasRole('Platform Admin')}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Main>
    </>
  )
}
