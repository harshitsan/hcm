import { type NotificationSettingsStore } from '../hooks/use-notification-settings'
import { ChannelsCard, ConnectorsCard } from './channel-cards'
import {
  DeliveryModelsCard,
  EnginePanels,
  HierarchyCard,
} from './delivery-cards'

interface ChannelsTabProps {
  settings: NotificationSettingsStore
  runDigest: () => void
}

/**
 * Channels & delivery configuration surface: company channel toggles with
 * mandatory email (NTF-01/02/03), Platform Admin connectors (NTF-13),
 * event-driven vs digest models (NTF-08/09/17), hierarchy defaults
 * (NTF-15/16) and the shared engine guarantees (NTF-19/21/22).
 */
export function ChannelsTab({ settings, runDigest }: ChannelsTabProps) {
  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <ChannelsCard
        channels={settings.channels}
        connectors={settings.connectors}
        toggleChannel={settings.toggleChannel}
      />
      <ConnectorsCard
        connectors={settings.connectors}
        connectConnector={settings.connectConnector}
        disconnectConnector={settings.disconnectConnector}
        testConnector={settings.testConnector}
      />
      <DeliveryModelsCard
        eventDelivery={settings.eventDelivery}
        setEventModel={settings.setEventModel}
        digestSchedule={settings.digestSchedule}
        updateDigestSchedule={settings.updateDigestSchedule}
        runDigest={runDigest}
      />
      <HierarchyCard />
      <div className='xl:col-span-2'>
        <EnginePanels />
      </div>
    </div>
  )
}
