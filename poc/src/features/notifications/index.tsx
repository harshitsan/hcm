import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AlertsTab } from './components/alerts-tab'
import { ChannelsTab } from './components/channels-tab'
import { DeliveryLogTab } from './components/delivery-log-tab'
import { InboxTab } from './components/inbox-tab'
import { NotificationsSummary } from './components/notifications-summary'
import { PreferencesTab } from './components/preferences-tab'
import { TemplatesTab } from './components/templates-tab'
import { useNotificationSettings } from './hooks/use-notification-settings'
import { useNotifications } from './hooks/use-notifications'
import { useTemplates } from './hooks/use-templates'

/**
 * Notifications & Communications (FR 6.27): the in-app notification center,
 * the persisted delivery log with retry/fallback/dead-letter handling, the
 * HR-domain template library with branded editor, channel/connector and
 * delivery-model configuration, Kensium alert toggles and personal
 * preferences — with actions gated per role.
 */
export function Notifications() {
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    simulateEvent,
    runDigest,
    deliveries,
    retryDelivery,
    fallbackToEmail,
    resolveDeadLetter,
  } = useNotifications()
  const { templates, saveTemplate, restoreDefault, overrideAtCompany } =
    useTemplates()
  const settings = useNotificationSettings()

  const inAppEnabled =
    settings.channels.find((c) => c.channel === 'in-app')?.enabled ?? false

  return (
    <>
      <CommonHeader title='Notifications' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <NotificationsSummary
            notifications={notifications}
            deliveries={deliveries}
          />

          <Tabs defaultValue='inbox' className='w-full'>
            <TabsList className='mb-2'>
              <TabsTrigger value='inbox' variant='primary'>
                Inbox{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value='templates' variant='primary'>
                Templates
              </TabsTrigger>
              <TabsTrigger value='channels' variant='primary'>
                Channels &amp; Delivery
              </TabsTrigger>
              <TabsTrigger value='alerts' variant='primary'>
                Alerts
              </TabsTrigger>
              <TabsTrigger value='log' variant='primary'>
                Delivery Log
              </TabsTrigger>
              <TabsTrigger value='preferences' variant='primary'>
                My Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value='inbox'>
              <InboxTab
                notifications={notifications}
                unreadCount={unreadCount}
                deliveries={deliveries}
                inAppEnabled={inAppEnabled}
                markRead={markRead}
                markAllRead={markAllRead}
                simulateEvent={simulateEvent}
              />
            </TabsContent>

            <TabsContent value='templates'>
              <TemplatesTab
                templates={templates}
                saveTemplate={saveTemplate}
                restoreDefault={restoreDefault}
                overrideAtCompany={overrideAtCompany}
              />
            </TabsContent>

            <TabsContent value='channels'>
              <ChannelsTab settings={settings} runDigest={runDigest} />
            </TabsContent>

            <TabsContent value='alerts'>
              <AlertsTab
                alerts={settings.alerts}
                saveAlerts={settings.saveAlerts}
              />
            </TabsContent>

            <TabsContent value='log'>
              <DeliveryLogTab
                deliveries={deliveries}
                retryDelivery={retryDelivery}
                fallbackToEmail={fallbackToEmail}
                resolveDeadLetter={resolveDeadLetter}
              />
            </TabsContent>

            <TabsContent value='preferences'>
              <PreferencesTab
                current={settings.currentPreferences}
                versions={settings.preferenceVersions}
                savePreferences={settings.savePreferences}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
