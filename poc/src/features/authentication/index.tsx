import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const audit = useAuthAudit()
  const usersStore = useAuthUsers(audit.logEvent)
  const config = useAuthConfig(audit.logEvent)
  const sessionStore = useLoginSession(usersStore.users, audit.logEvent)

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

          <Tabs defaultValue='sign-in' className='w-full'>
            <TabsList className='mb-2'>
              <TabsTrigger value='sign-in' variant='primary'>
                Sign-in &amp; Session
              </TabsTrigger>
              <TabsTrigger value='users' variant='primary'>
                Users &amp; Access
              </TabsTrigger>
              <TabsTrigger value='config' variant='primary'>
                Configuration
              </TabsTrigger>
              <TabsTrigger value='audit' variant='primary'>
                Audit Log
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

            <TabsContent value='config'>
              <ConfigTab config={config} />
            </TabsContent>

            <TabsContent value='audit'>
              <AuditTab events={audit.events} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
