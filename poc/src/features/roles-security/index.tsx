import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { AccessTab } from './components/access-tab'
import { AssignmentsTab } from './components/assignments-tab'
import { AuditTab } from './components/audit-tab'
import { AuthenticationTab } from './components/authentication-tab'
import { ContextTab } from './components/context-tab'
import { DelegationsTab } from './components/delegations-tab'
import { ImpersonationTab } from './components/impersonation-tab'
import { JobsTab } from './components/jobs-tab'
import { PermissionsTab } from './components/permissions-tab'
import { RolesTab } from './components/roles-tab'
import { ScopeTab } from './components/scope-tab'
import { SecuritySummary } from './components/security-summary'
import { assignmentStatusOn } from './data/assignments'
import { companyName } from './data/directory'
import { useAssignments } from './hooks/use-assignments'
import { useCompanyContext } from './hooks/use-company-context'
import { useDelegations } from './hooks/use-delegations'
import { useImpersonation } from './hooks/use-impersonation'
import { useRoles } from './hooks/use-roles'
import { useScopeRules } from './hooks/use-scope-rules'
import { useSecurityAudit } from './hooks/use-security-audit'
import { useSecurityConfig } from './hooks/use-security-config'

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

const ADMINS: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/**
 * Top-level tabs, ordered task-first: everyday self-service surfaces come
 * before the operational lists; all admin/config surfaces live under Admin.
 */
const TABS: TabDef[] = [
  {
    value: 'access',
    label: 'My Access',
    roles: ['Employee (User)', 'Employee (Non-User)'],
  },
  {
    value: 'delegations',
    label: 'Delegations',
    roles: ['Company Admin', 'Employee (User)'],
  },
  { value: 'roles', label: 'Roles', roles: ADMINS },
  { value: 'assignments', label: 'Assignments', roles: ADMINS },
  { value: 'admin', label: 'Admin', roles: ADMINS },
]

/**
 * Admin sub-tabs — each keeps the same role gate it had as a top-level tab.
 * The Admin tab itself is only shown to admin roles (see TABS above).
 */
const ADMIN_TABS: TabDef[] = [
  {
    value: 'screens',
    label: 'Screen Access',
    roles: ['Platform Admin', 'Company Admin'],
  },
  { value: 'scope', label: 'Data Access', roles: ADMINS },
  {
    value: 'context',
    label: 'Company Switching',
    roles: ['Platform Admin', 'Portfolio Admin', 'Group Company Admin'],
  },
  {
    value: 'impersonation',
    label: 'Act as User',
    roles: ['Platform Admin', 'Company Admin'],
  },
  {
    value: 'authentication',
    label: 'Sign-in Settings',
    roles: ['Company Admin'],
  },
  {
    value: 'jobs',
    label: 'Jobs & Support',
    roles: ['Platform Admin', 'Company Admin'],
  },
  { value: 'audit', label: 'Activity & Alerts', roles: ADMINS },
]

/**
 * Roles & Security — hierarchical RBAC with versioned governed config,
 * effective-dated assignments, scope rules with row-level security,
 * delegation with approval routing, audited impersonation and context
 * switching, company-scoped authentication policy, scheduled jobs and
 * support teams (RSEC-01 … RSEC-39).
 */
export function RolesSecurity() {
  const { role } = useRole()
  const actor = ACTORS[role]

  // Store wiring: every security-relevant action funnels into the
  // append-only audit store; sensitive events also raise notifications.
  const audit = useSecurityAudit()
  const rolesStore = useRoles({ append: audit.append, actor, actorRole: role })
  const assignments = useAssignments({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const scopeRules = useScopeRules({
    append: audit.append,
    actor,
    actorRole: role,
  })
  const delegations = useDelegations({
    append: audit.append,
    notify: audit.notify,
    actor,
    actorRole: role,
  })
  const impersonation = useImpersonation({
    append: audit.append,
    notify: audit.notify,
    actorRole: role,
  })
  const context = useCompanyContext({
    append: audit.append,
    notify: audit.notify,
    actor,
    actorRole: role,
  })
  const config = useSecurityConfig({
    append: audit.append,
    actor,
    actorRole: role,
  })

  const today = new Date().toISOString().slice(0, 10)
  const summaryItems = [
    { label: 'Roles defined', value: rolesStore.roles.length },
    {
      label: 'Active assignments',
      value: assignments.assignments.filter(
        (a) => assignmentStatusOn(a, today) === 'Active'
      ).length,
    },
    {
      label: 'Active delegations',
      value: delegations.delegations.filter((d) => d.status === 'Active')
        .length,
    },
    { label: 'Security events', value: audit.events.length },
  ]

  const visibleTabs = TABS.filter((t) => t.roles.includes(role))
  const visibleAdminTabs = ADMIN_TABS.filter((t) => t.roles.includes(role))

  // AD-07 / PWD-07: the admin sub-tabs are controlled so the "Save & Next"
  // flow in Sign-in Settings can advance to the next configuration step
  // (Jobs & Support). Falls back to the first visible sub-tab per role.
  const [adminTab, setAdminTab] = useState<string | undefined>(undefined)
  const activeAdminTab =
    adminTab && visibleAdminTabs.some((t) => t.value === adminTab)
      ? adminTab
      : visibleAdminTabs[0]?.value

  // Role-relevant landing tab: employees start on their own access surface,
  // admins start on the roles list.
  const defaultTab = ADMINS.includes(role) ? 'roles' : 'access'

  return (
    <>
      <CommonHeader title='Roles & Security' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <SecuritySummary items={summaryItems} />

          {/* RSEC-09 / RSEC-23: the active company is clearly indicated. */}
          <div className='mb-3 flex items-center justify-between rounded-[8px] border border-gray-200 bg-white px-4 py-2'>
            <p className='text-neutral-1900 text-sm'>
              Acting as{' '}
              <span className='text-neutral-1600 font-medium'>{actor}</span>{' '}
              <span className='text-neutral-1000 text-xs'>({role})</span>
            </p>
            <Badge variant='badge_active'>
              Active company: {companyName(context.activeCompanyId)}
            </Badge>
          </div>

          <Tabs defaultValue={defaultTab} key={role}>
            <TabsList className='mb-2 flex-wrap'>
              {visibleTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='access'>
              <AccessTab
                assignments={assignments.assignments}
                roles={rolesStore.roles}
                scopeRules={scopeRules.rules}
                config={config}
              />
            </TabsContent>

            <TabsContent value='delegations'>
              <DelegationsTab store={delegations} />
            </TabsContent>

            <TabsContent value='roles'>
              <RolesTab store={rolesStore} />
            </TabsContent>

            <TabsContent value='assignments'>
              <AssignmentsTab store={assignments} roles={rolesStore.roles} />
            </TabsContent>

            <TabsContent value='admin'>
              <EngineArtifactsPanel module='Roles & Security' />

              {/* Option B: segmented selector — required so AuthenticationTab's
                  onFinish={() => setAdminTab('jobs')} can target a specific
                  section; an always-visible layout would make that prop
                  meaningless. */}
              <div className='mb-4 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1'>
                {visibleAdminTabs.map((t) => (
                  <button
                    key={t.value}
                    type='button'
                    onClick={() => setAdminTab(t.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeAdminTab === t.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeAdminTab === 'screens' && (
                <PermissionsTab store={rolesStore} />
              )}
              {activeAdminTab === 'scope' && (
                <ScopeTab store={scopeRules} />
              )}
              {activeAdminTab === 'context' && (
                <ContextTab store={context} audit={audit} />
              )}
              {activeAdminTab === 'impersonation' && (
                <ImpersonationTab store={impersonation} />
              )}
              {activeAdminTab === 'authentication' && (
                <AuthenticationTab
                  store={config}
                  onFinish={() => setAdminTab('jobs')}
                />
              )}
              {activeAdminTab === 'jobs' && <JobsTab store={config} />}
              {activeAdminTab === 'audit' && <AuditTab audit={audit} />}
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
