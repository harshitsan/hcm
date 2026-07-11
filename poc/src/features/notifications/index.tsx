import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { useRole } from '@/context/role-context'
import { ApprovalInbox } from '@/features/workflows/components/approval-inbox'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { ACTORS, companiesForRole } from '@/features/workflows/data/shared'
import { useAuditTrail } from '@/features/workflows/hooks/use-audit-trail'
import { useInstances } from '@/features/workflows/hooks/use-instances'
import { Main } from '@/components/layout/main'
import { AlertsTab } from './components/alerts-tab'
import { AssignedByMeTab } from './components/assigned-by-me-tab'
import { ChannelsTab } from './components/channels-tab'
import { DeliveryLogTab } from './components/delivery-log-tab'
import { InboxTab } from './components/inbox-tab'
import { MessagesTab } from './components/messages-tab'
import { NotificationsSummary } from './components/notifications-summary'
import { PreferencesTab } from './components/preferences-tab'
import { TasksTab } from './components/tasks-tab'
import { TemplatesTab } from './components/templates-tab'
import { useMessages } from './hooks/use-messages'
import { useNotificationSettings } from './hooks/use-notification-settings'
import { useNotifications } from './hooks/use-notifications'
import { useTasks } from './hooks/use-tasks'
import { useTemplates } from './hooks/use-templates'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'

/**
 * Tasks, Notifications & Messages (Kensium "General Features" —
 * Tasks/Messages/Notifications + FR 6.27):
 *
 * - Tasks: assignee view of system + manual tasks (Initiate, Mark Complete
 *   with comment, overdue in red, sort by date, Pending/Completed/Reassigned).
 * - Task Assigned by Me: manual task creation with the full Kensium field set
 *   (escalation, confidentiality, invoke-on, cascade, assignee context) plus
 *   Edit / Delete / Reassign / Reopen.
 * - Notifications: the system-generated notification center (dashboard +
 *   email delivery), search, bulk mark-read, reporting-manager team view.
 * - Messages: internal messaging with read/unread/archive/delete and bulk
 *   actions.
 * - My Preferences + Admin: existing channel/template/alert/delivery-history
 *   configuration, gated per role.
 */
export function Notifications() {
  const { role } = useRole()

  // Workflow approval inbox — shares the module-level engine + audit stores
  // with the Workflow Engine page, so decisions here reflect there instantly.
  const workflowAudit = useAuditTrail()
  const approvals = useInstances({
    append: workflowAudit.append,
    actor: ACTORS[role],
    actorRole: role,
  })

  const {
    notifications,
    teamNotifications,
    unreadCount,
    markRead,
    markAllRead,
    markReadMany,
    pushNotification,
    simulateEvent,
    runDigest,
    deliveries,
    retryDelivery,
    fallbackToEmail,
    resolveDeadLetter,
  } = useNotifications()

  // Task / message actions raise dashboard notifications (+ simulated email).
  const tasks = useTasks((title, body) =>
    pushNotification('task', title, body)
  )
  const messaging = useMessages((title, body) =>
    pushNotification('announcement', title, body)
  )

  const { templates, saveTemplate, restoreDefault, overrideAtCompany } =
    useTemplates()
  const settings = useNotificationSettings()

  const inAppEnabled =
    settings.channels.find((c) => c.channel === 'in-app')?.enabled ?? false

  // Controlled tabs so the templates screen can Cancel back to the page the
  // admin came from (AET-05/FIN-04/PET-06/RET-05). The sidebar link says
  // "Notifications", so the page lands on the Notifications inbox tab.
  const [activeTab, setActiveTab] = useState(
    () => takeRequestedTab('/notifications') ?? 'notifications'
  )
  const previousTabRef = useRef('notifications')
  const handleTabChange = (value: string) => {
    if (value !== activeTab) previousTabRef.current = activeTab
    setActiveTab(value)
  }
  const handleTemplatesCancel = () => {
    const target =
      previousTabRef.current === 'admin'
        ? 'notifications'
        : previousTabRef.current
    setActiveTab(target)
    previousTabRef.current = 'admin'
    toast.info('Left the templates screen without changes.')
  }

  return (
    <>
      <CommonHeader
        title='Tasks, Notifications & Messages'
        className='bg-blue-150'
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='w-full'
          >
            <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='tasks' variant='primary'>
                Tasks{tasks.pendingCount > 0 ? ` (${tasks.pendingCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value='assigned' variant='primary'>
                Task Assigned by Me
              </TabsTrigger>
              <TabsTrigger value='notifications' variant='primary'>
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value='messages' variant='primary'>
                Messages
                {messaging.unreadCount > 0 ? ` (${messaging.unreadCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value='preferences' variant='primary'>
                My Preferences
              </TabsTrigger>
              <TabsTrigger value='admin' variant='primary'>
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value='tasks'>
              <div className='mb-6'>
                <ApprovalInbox
                  store={approvals}
                  role={role}
                  events={workflowAudit.events}
                  companies={companiesForRole(role)}
                />
              </div>
              <TasksTab
                myTasks={tasks.myTasks}
                completeTask={tasks.completeTask}
                reopenTask={tasks.reopenTask}
              />
            </TabsContent>

            <TabsContent value='assigned'>
              <AssignedByMeTab
                assignedByMe={tasks.assignedByMe}
                pendingTasksOf={tasks.pendingTasksOf}
                addTask={tasks.addTask}
                editTask={tasks.editTask}
                deleteTask={tasks.deleteTask}
                reassignTask={tasks.reassignTask}
                reopenTask={tasks.reopenTask}
              />
            </TabsContent>

            <TabsContent value='notifications'>
              <NotificationsSummary
                notifications={notifications}
                deliveries={deliveries}
              />
              <InboxTab
                notifications={notifications}
                teamNotifications={teamNotifications}
                unreadCount={unreadCount}
                deliveries={deliveries}
                inAppEnabled={inAppEnabled}
                markRead={markRead}
                markAllRead={markAllRead}
                markReadMany={markReadMany}
                simulateEvent={simulateEvent}
                openTab={handleTabChange}
              />
            </TabsContent>

            <TabsContent value='messages'>
              <MessagesTab
                messages={messaging.messages}
                addMessage={messaging.addMessage}
                setState={messaging.setState}
                markReadQuiet={messaging.markReadQuiet}
                deleteMessages={messaging.deleteMessages}
              />
            </TabsContent>

            <TabsContent value='preferences'>
              <PreferencesTab
                current={settings.currentPreferences}
                versions={settings.preferenceVersions}
                savePreferences={settings.savePreferences}
              />
            </TabsContent>

            <TabsContent value='admin'>
              <EngineArtifactsPanel module='Notifications' />
              <div className='flex flex-col gap-6'>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Templates</h3>
                  <TemplatesTab
                    templates={templates}
                    saveTemplate={saveTemplate}
                    restoreDefault={restoreDefault}
                    overrideAtCompany={overrideAtCompany}
                    onCancel={handleTemplatesCancel}
                  />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Channels</h3>
                  <ChannelsTab settings={settings} runDigest={runDigest} />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Alerts</h3>
                  <AlertsTab
                    alerts={settings.alerts}
                    saveAlerts={settings.saveAlerts}
                  />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Delivery History</h3>
                  <DeliveryLogTab
                    deliveries={deliveries}
                    retryDelivery={retryDelivery}
                    fallbackToEmail={fallbackToEmail}
                    resolveDeadLetter={resolveDeadLetter}
                  />
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
