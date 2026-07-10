import { useRole } from '@/context/role-context'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { AuditTab } from './components/audit-tab'
import { AuthSummary } from './components/auth-summary'
import { ConfigTab } from './components/config-tab'
import { SignInTab } from './components/sign-in-tab'
import { UsersTab } from './components/users-tab'
import { useAuthAudit } from './hooks/use-auth-audit'
import { useAuthConfig } from './hooks/use-auth-config'
import { useAuthUsers } from './hooks/use-auth-users'
import { useLoginSession } from './hooks/use-login-session'

/**
 * Authentication module (FR 6.1): user identities distinct from workforce
 * records, per-company memberships with context switching, governed sign-in
 * configuration and the append-only authentication audit log.
 */
export function Authentication() {
  const { role } = useRole()
  const audit = useAuthAudit()
  const usersStore = useAuthUsers(audit.logEvent)
  const config = useAuthConfig(audit.logEvent)
  const sessionStore = useLoginSession(usersStore.users, audit.logEvent)

  // Employees land on their own sign-in & session view; admins land on the
  // operational user list.
  const isEmployee = role === 'Employee (User)' || role === 'Employee (Non-User)'
  const defaultTab = isEmployee ? 'sign-in' : 'users'

  return (
    <>
      <CommonHeader title='Authentication' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <AuthSummary
            users={usersStore.users}
            employees={usersStore.employees}
            events={audit.events}
            enabledMethodCount={config.enabledMethods.length}
          />

          <Tabs defaultValue={defaultTab} className='w-full'>
            <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='sign-in' variant='primary'>
                Sign in &amp; sessions
              </TabsTrigger>
              <TabsTrigger value='users' variant='primary'>
                Users &amp; access
              </TabsTrigger>
              <TabsTrigger value='admin' variant='primary'>
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value='sign-in'>
              <SignInTab
                users={usersStore.users}
                employees={usersStore.employees}
                enabledMethods={config.enabledMethods}
                sessionStore={sessionStore}
                policy={config.currentPolicy}
                logEvent={audit.logEvent}
              />
            </TabsContent>

            <TabsContent value='users'>
              <UsersTab store={usersStore} />
            </TabsContent>

            <TabsContent value='admin'>
              <EngineArtifactsPanel module='Authentication' />
              <div className='flex flex-col gap-6'>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Sign-in settings</h3>
                  <ConfigTab config={config} />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Audit log</h3>
                  <AuditTab events={audit.events} />
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
