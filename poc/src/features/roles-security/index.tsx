import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
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
 * Which tabs each role sees — the first visible tab is the default. Admins
 * land on role governance; employees land on their own access surface.
 */
const TABS: TabDef[] = [
  { value: 'roles', label: 'Role Catalog', roles: ADMINS },
  { value: 'assignments', label: 'Assignments', roles: ADMINS },
  {
    value: 'screens',
    label: 'Screen Access',
    roles: ['Platform Admin', 'Company Admin'],
  },
  { value: 'scope', label: 'Scope Rules', roles: ADMINS },
  {
    value: 'context',
    label: 'Company Context',
    roles: ['Platform Admin', 'Portfolio Admin', 'Group Company Admin'],
  },
  {
    value: 'delegations',
    label: 'Delegations',
    roles: ['Company Admin', 'Employee (User)'],
  },
  {
    value: 'impersonation',
    label: 'Impersonation',
    roles: ['Platform Admin', 'Company Admin'],
  },
  { value: 'authentication', label: 'Authentication', roles: ['Company Admin'] },
  {
    value: 'jobs',
    label: 'Jobs & Support',
    roles: ['Platform Admin', 'Company Admin'],
  },
  { value: 'audit', label: 'Audit & Alerts', roles: ADMINS },
  {
    value: 'access',
    label: 'My Access',
    roles: ['Employee (User)', 'Employee (Non-User)'],
  },
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

          <Tabs defaultValue={visibleTabs[0]?.value} key={role}>
            <TabsList className='mb-2 flex-wrap'>
              {visibleTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='roles'>
              <RolesTab store={rolesStore} />
            </TabsContent>

            <TabsContent value='assignments'>
              <AssignmentsTab store={assignments} roles={rolesStore.roles} />
            </TabsContent>

            <TabsContent value='screens'>
              <PermissionsTab store={rolesStore} />
            </TabsContent>

            <TabsContent value='scope'>
              <ScopeTab store={scopeRules} />
            </TabsContent>

            <TabsContent value='context'>
              <ContextTab store={context} audit={audit} />
            </TabsContent>

            <TabsContent value='delegations'>
              <DelegationsTab store={delegations} />
            </TabsContent>

            <TabsContent value='impersonation'>
              <ImpersonationTab store={impersonation} />
            </TabsContent>

            <TabsContent value='authentication'>
              <AuthenticationTab store={config} />
            </TabsContent>

            <TabsContent value='jobs'>
              <JobsTab store={config} />
            </TabsContent>

            <TabsContent value='audit'>
              <AuditTab audit={audit} />
            </TabsContent>

            <TabsContent value='access'>
              <AccessTab
                assignments={assignments.assignments}
                roles={rolesStore.roles}
                scopeRules={scopeRules.rules}
                config={config}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
