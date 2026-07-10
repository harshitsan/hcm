import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { ApproverGroupsTab } from './components/approver-groups-tab'
import { AuditTab } from './components/audit-tab'
import { BusinessLogicTab } from './components/business-logic-tab'
import { ConfigurationHubTab } from './components/configuration-hub-tab'
import { DefinitionsTab } from './components/definitions-tab'
import {
  EngineSearch,
  type SearchEntry,
  type SearchTarget,
} from './components/engine-search'
import { InstancesTab } from './components/instances-tab'
import { PlatformTab } from './components/platform-tab'
import { RoutingTab } from './components/routing-tab'
import { SlaTab } from './components/sla-tab'
import { CATEGORY_LABELS } from './data/approver-groups'
import { ARTIFACT_TYPE_LABELS } from './data/business-logic'
import { ACTORS, companiesForRole } from './data/shared'
import { DesignerTab } from './designer/designer-tab'
import { useApproverGroups } from './hooks/use-approver-groups'
import { useAttendanceConfig } from './hooks/use-attendance-config'
import { useAuditTrail } from './hooks/use-audit-trail'
import { useBusinessLogic } from './hooks/use-business-logic'
import { useConfiguration } from './hooks/use-configuration'
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
 * One mental model, four tabs — no concept appears twice:
 *   Requests      RUN      — approver inbox + running requests
 *   Configure     GOVERN   — THE artifact catalog (every configuration lives
 *                            or is being absorbed here; scope matrix, versions)
 *   Build         AUTHOR   — the canvas designer; publishes into Configure
 *   Classic admin LEGACY   — the remaining pre-catalog screens, grouped and
 *                            explicitly marked as being absorbed
 * "Find any setting…" searches every surface and jumps to the right place.
 */
const TABS: TabDef[] = [
  {
    value: 'instances',
    label: 'Requests',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Employee (User)',
    ],
  },
  {
    value: 'business-logic',
    label: 'Configure',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'designer',
    label: 'Build',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'admin',
    label: 'Classic admin',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
]

/** Classic (pre-catalog) surfaces, grouped 5 → 3; sections inside each pane
    are individually role-gated so the old permissions still hold. */
const ADMIN_TABS: TabDef[] = [
  {
    value: 'configuration',
    label: 'Configuration hub',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'flows',
    label: 'Approval workflows & routing',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
  {
    value: 'approvers',
    label: 'Approver chains & SLAs',
    roles: ['Company Admin', 'Group Company Admin', 'Portfolio Admin'],
  },
  {
    value: 'settings',
    label: 'Settings & history',
    roles: [
      'Company Admin',
      'Group Company Admin',
      'Portfolio Admin',
      'Platform Admin',
    ],
  },
]

/** Heading + caption above a classic surface stacked inside a pane. */
function AdminSection({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className='text-neutral-1600 text-paragraph-md font-semibold'>
        {title}
      </h2>
      <p className='text-neutral-1000 mb-3 text-xs'>{caption}</p>
      {children}
    </section>
  )
}

/**
 * Workflow Engine — one business-logic engine, three layers: flows and
 * artifacts are AUTHORED in Build, GOVERNED (scoped, versioned, toggled) in
 * Configure, and CONSUMED by modules; Requests shows the engine running
 * (WFE-01 … WFE-49). Classic admin holds the remaining pre-catalog screens
 * (definitions, routing, approver chains, SLAs, platform toggles, audit)
 * while they are absorbed into the catalog.
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
  const businessLogic = useBusinessLogic({ actor })
  const configuration = useConfiguration({
    append: audit.append,
    actor,
    actorRole: role,
  })

  const canConfigure = hasRole('Company Admin', 'Group Company Admin')
  const canConfigureHub = hasRole(
    'Company Admin',
    'Group Company Admin',
    'Platform Admin'
  )
  const visibleAdminTabs = ADMIN_TABS.filter((t) => t.roles.includes(role))
  const visibleTabs = TABS.filter(
    (t) =>
      t.roles.includes(role) &&
      (t.value !== 'admin' || visibleAdminTabs.length > 0)
  )

  // Controlled tab state so search results can navigate anywhere directly.
  const [topTab, setTopTab] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')

  useEffect(() => {
    setTopTab(null)
    setCatalogSearch('')
  }, [role])

  const navigate = (target: SearchTarget) => {
    setTopTab(target.top)
    if (target.catalogQuery !== undefined) setCatalogSearch(target.catalogQuery)
  }

  /** Everything findable, across every surface the active role can open. */
  const searchEntries = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = []
    const adminVisible = (v: string) =>
      visibleAdminTabs.some((t) => t.value === v)

    if (visibleTabs.some((t) => t.value === 'business-logic')) {
      for (const a of businessLogic.artifacts) {
        entries.push({
          id: `art-${a.id}`,
          label: a.name,
          hint: `${ARTIFACT_TYPE_LABELS[a.type]} · ${a.targetModule} · v${a.version}`,
          group: 'Configure — workflow catalog',
          target: { top: 'business-logic', catalogQuery: a.name },
        })
      }
    }
    if (adminVisible('configuration')) {
      for (const a of configuration.areas) {
        entries.push({
          id: `cfg-area-${a.id}`,
          label: a.name,
          hint: `Setup area · ${a.group} · ${a.owner}`,
          group: 'Configuration hub',
          target: { top: 'admin', admin: 'configuration' },
        })
      }
      for (const l of configuration.localizations) {
        entries.push({
          id: `cfg-loc-${l.id}`,
          label: l.name,
          hint: `Localization · ${l.timezone} · ${l.currency}`,
          group: 'Configuration hub',
          target: { top: 'admin', admin: 'configuration' },
        })
      }
      for (const h of configuration.headOffices) {
        entries.push({
          id: `cfg-ho-${h.id}`,
          label: h.name,
          hint: `${h.type} · ${h.location}`,
          group: 'Configuration hub',
          target: { top: 'admin', admin: 'configuration' },
        })
      }
      for (const i of configuration.integrations) {
        entries.push({
          id: `cfg-int-${i.id}`,
          label: i.name,
          hint: `Integration · ${i.system} · ${i.syncFrequency}`,
          group: 'Configuration hub',
          target: { top: 'admin', admin: 'configuration' },
        })
      }
      for (const r of configuration.alertRules) {
        entries.push({
          id: `cfg-al-${r.id}`,
          label: r.name,
          hint: `Alert rule · ${r.channels.join(', ')}`,
          group: 'Configuration hub',
          target: { top: 'admin', admin: 'configuration' },
        })
      }
    }
    if (adminVisible('flows')) {
      for (const d of definitions.definitions) {
        entries.push({
          id: `def-${d.id}`,
          label: d.name,
          hint: `Approval workflow v${d.version} · ${d.company}`,
          group: 'Classic — workflows & routing',
          target: { top: 'admin', admin: 'flows' },
        })
      }
      for (const r of routing.rules) {
        entries.push({
          id: `rt-${r.id}`,
          label: `${r.transactionType} → ${r.routeTo}`,
          hint: `Routing rule · priority ${r.priority}`,
          group: 'Classic — workflows & routing',
          target: { top: 'admin', admin: 'flows' },
        })
      }
      for (const r of attendanceConfig.rules) {
        entries.push({
          id: `att-${r.id}`,
          label: r.name,
          hint: 'Attendance rule',
          group: 'Classic — workflows & routing',
          target: { top: 'admin', admin: 'flows' },
        })
      }
    }
    if (adminVisible('approvers')) {
      for (const g of approverGroups.groups) {
        entries.push({
          id: `ag-${g.id}`,
          label: g.name,
          hint: `${CATEGORY_LABELS[g.category]} · ${g.approvers.join(' → ')}`,
          group: 'Classic — approver chains & SLAs',
          target: { top: 'admin', admin: 'approvers' },
        })
      }
      for (const p of slaConfig.policies) {
        entries.push({
          id: `sla-${p.id}`,
          label: p.name,
          hint: 'SLA policy',
          group: 'Classic — approver chains & SLAs',
          target: { top: 'admin', admin: 'approvers' },
        })
      }
      for (const c of slaConfig.calendars) {
        entries.push({
          id: `cal-${c.id}`,
          label: c.name,
          hint: 'Business-hour calendar',
          group: 'Classic — approver chains & SLAs',
          target: { top: 'admin', admin: 'approvers' },
        })
      }
    }
    if (adminVisible('settings')) {
      if (hasRole('Platform Admin', 'Company Admin')) {
        for (const t of platform.tenants) {
          entries.push({
            id: `ten-${t.name}`,
            label: `${t.name} — module toggles`,
            hint: 'Platform settings',
            group: 'Classic — settings & history',
            target: { top: 'admin', admin: 'settings' },
          })
        }
      }
      entries.push({
        id: 'audit-trail',
        label: 'Audit trail / history',
        hint: 'Chronology of every engine event',
        group: 'Classic — settings & history',
        target: { top: 'admin', admin: 'settings' },
      })
    }
    return entries
  }, [
    visibleTabs,
    visibleAdminTabs,
    businessLogic.artifacts,
    configuration.areas,
    configuration.localizations,
    configuration.headOffices,
    configuration.integrations,
    configuration.alertRules,
    definitions.definitions,
    routing.rules,
    attendanceConfig.rules,
    approverGroups.groups,
    slaConfig.policies,
    slaConfig.calendars,
    platform.tenants,
    hasRole,
  ])

  return (
    <>
      <CommonHeader title='Workflows' className='bg-blue-150' />
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
            <Tabs
              value={topTab ?? visibleTabs[0]?.value}
              onValueChange={setTopTab}
              key={role}
            >
              <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
                <TabsList className='flex-wrap'>
                  {visibleTabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {searchEntries.length > 0 && (
                  <EngineSearch entries={searchEntries} onNavigate={navigate} />
                )}
              </div>

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

              <TabsContent value='business-logic'>
                <BusinessLogicTab
                  store={businessLogic}
                  role={role}
                  search={catalogSearch}
                  onSearchChange={setCatalogSearch}
                />
              </TabsContent>

              <TabsContent value='designer'>
                <DesignerTab
                  role={role}
                  flows={businessLogic.artifacts.filter(
                    (a) => a.type === 'flow'
                  )}
                  onPublish={businessLogic.createArtifact}
                  onUpdate={businessLogic.updateArtifact}
                />
              </TabsContent>

              <TabsContent value='admin'>
                <p className='text-neutral-1000 mb-3 text-sm'>
                  Classic configuration screens, kept while they are absorbed
                  into Configure — each screen here corresponds to artifacts in
                  the catalog. Use "Find any setting…" above to jump straight
                  to anything.
                </p>
                <div className='flex flex-col gap-6'>
                  {visibleAdminTabs.some((t) => t.value === 'configuration') && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Configuration hub
                      </h3>
                      <div className='space-y-6'>
                        <AdminSection
                          title='Configuration hub'
                          caption='Every HRMS setup area in one place (CFG-01), organization settings — localization & head office (CFG-02) — and integrations & alerts (CFG-08).'
                        >
                          <ConfigurationHubTab
                            store={configuration}
                            canConfigure={canConfigureHub}
                          />
                        </AdminSection>
                      </div>
                    </section>
                  )}

                  {visibleAdminTabs.some((t) => t.value === 'flows') && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Approval workflows &amp; routing
                      </h3>
                      <div className='space-y-6'>
                        <AdminSection
                          title='Approval workflows'
                          caption='Versioned, effective-dated definitions requests bind to (WFE-01 … WFE-26).'
                        >
                          <DefinitionsTab
                            store={definitions}
                            companies={companies}
                            calendars={slaConfig.calendars}
                            canConfigure={canConfigure}
                          />
                        </AdminSection>
                        <Separator />
                        <AdminSection
                          title='Routing & attendance rules'
                          caption='The decision table that picks a workflow per transaction, plus attendance event rules.'
                        >
                          <RoutingTab
                            routing={routing}
                            attendance={attendanceConfig}
                            definitions={definitions.definitions}
                            canConfigure={canConfigure}
                          />
                        </AdminSection>
                      </div>
                    </section>
                  )}

                  {visibleAdminTabs.some((t) => t.value === 'approvers') && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Approver chains &amp; SLAs
                      </h3>
                      <div className='space-y-6'>
                        {hasRole('Company Admin', 'Group Company Admin') && (
                          <>
                            <AdminSection
                              title='Approver chains'
                              caption='Per-process approver configurations (overtime, comp-off, exit, confirmation …).'
                            >
                              <ApproverGroupsTab store={approverGroups} />
                            </AdminSection>
                            <Separator />
                          </>
                        )}
                        <AdminSection
                          title='Deadlines & escalations'
                          caption='Business-hour calendars and SLA policies with 50/75/100% thresholds.'
                        >
                          <SlaTab store={slaConfig} canConfigure={canConfigure} />
                        </AdminSection>
                      </div>
                    </section>
                  )}

                  {visibleAdminTabs.some((t) => t.value === 'settings') && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Settings &amp; history
                      </h3>
                      <div className='space-y-6'>
                        {hasRole('Platform Admin', 'Company Admin') && (
                          <>
                            <AdminSection
                              title='Platform & module settings'
                              caption='Per-tenant module toggles and engine health.'
                            >
                              <PlatformTab
                                platform={platform}
                                attendance={attendanceConfig}
                              />
                            </AdminSection>
                            <Separator />
                          </>
                        )}
                        <AdminSection
                          title='History'
                          caption='The complete audit trail across every engine surface.'
                        >
                          <AuditTab
                            events={audit.events}
                            companies={companies}
                            showPlatformEvents={hasRole('Platform Admin')}
                          />
                        </AdminSection>
                      </div>
                    </section>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Main>
    </>
  )
}
