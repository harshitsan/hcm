import { useState } from 'react'
import { Lock, PlugZap, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { RoleGate, useRole } from '@/context/role-context'
import { CHANNEL_LABELS, type Channel } from '../data/notifications'
import { type ChannelSetting, type Connector } from '../data/settings'
import { ConnectorDialog } from './connector-dialog'

interface ChannelsCardProps {
  channels: ChannelSetting[]
  connectors: Connector[]
  toggleChannel: (channel: Channel, enabled: boolean) => void
}

/**
 * Company channel configuration (NTF-01/02/03): email is locked always-on;
 * in-app is optional; Teams/WhatsApp depend on a connected connector.
 */
export function ChannelsCard({
  channels,
  connectors,
  toggleChannel,
}: ChannelsCardProps) {
  const { hasRole } = useRole()
  const canToggle = hasRole('Company Admin', 'Group Company Admin', 'Platform Admin')

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <Send className='text-blue-1400 size-4' />
          Notification channels
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Admins choose the optional channels; Group Company Admin settings
          apply group-wide. Email can never be disabled.
        </p>
      </CardHeader>
      <CardContent className='space-y-2 px-4'>
        {channels.map((c) => {
          const connector = connectors.find((k) => k.id === c.channel)
          const connectorBlocked =
            c.requiresConnector && (!connector || !connector.connected)
          return (
            <div
              key={c.channel}
              className='border-gray-200 flex items-center justify-between gap-3 rounded-[6px] border px-3 py-2'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {CHANNEL_LABELS[c.channel]}
                  </p>
                  {c.mandatory && (
                    <Badge variant='dropped'>
                      <Lock className='size-3' />
                      Mandatory
                    </Badge>
                  )}
                  {c.requiresConnector && (
                    <Badge
                      variant={connectorBlocked ? 'badge_inactive' : 'badge_active'}
                    >
                      {connectorBlocked ? 'Not connected' : 'Connected'}
                    </Badge>
                  )}
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {c.description}
                </p>
              </div>
              <Switch
                checked={c.enabled}
                disabled={c.mandatory || !canToggle}
                onCheckedChange={(enabled) => toggleChannel(c.channel, enabled)}
                aria-label={`Toggle ${CHANNEL_LABELS[c.channel]}`}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

interface ConnectorsCardProps {
  connectors: Connector[]
  connectConnector: (id: Connector['id'], target: string) => void
  disconnectConnector: (id: Connector['id']) => void
  testConnector: (id: Connector['id']) => void
}

/** Teams / WhatsApp connector management (NTF-03, NTF-13). */
export function ConnectorsCard({
  connectors,
  connectConnector,
  disconnectConnector,
  testConnector,
}: ConnectorsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [connecting, setConnecting] = useState<Connector | null>(null)
  const [disconnecting, setDisconnecting] = useState<Connector | null>(null)

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <PlugZap className='text-blue-1400 size-4' />
          Third-party connectors
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Microsoft Teams and WhatsApp route through connectors managed here.
          When a connector is unavailable, delivery fails over to email so no
          notification is lost.
        </p>
      </CardHeader>
      <CardContent className='space-y-2 px-4'>
        {connectors.map((c) => (
          <div
            key={c.id}
            className='border-gray-200 flex items-center justify-between gap-3 rounded-[6px] border px-3 py-2'
          >
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-neutral-1600 text-sm font-medium'>{c.name}</p>
                <Badge variant={c.connected ? 'badge_active' : 'badge_inactive'}>
                  {c.connected ? 'Connected' : 'Not connected'}
                </Badge>
                {c.lastTestResult && (
                  <Badge
                    variant={c.lastTestResult === 'success' ? 'completed' : 'overdue'}
                  >
                    Last test: {c.lastTestResult}
                  </Badge>
                )}
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                {c.connected
                  ? `${c.targetLabel}: ${c.target}`
                  : 'The channel stays unavailable until this connector is set up.'}
              </p>
            </div>
            <RoleGate
              roles={['Platform Admin', 'Company Admin']}
              fallback={
                <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                  Managed by your admin
                </span>
              }
            >
              <div className='flex shrink-0 items-center gap-2'>
                {c.connected ? (
                  <>
                    <Button
                      variant='outline'
                      className='h-7 rounded-[6px] px-2'
                      onClick={() => testConnector(c.id)}
                    >
                      Test delivery
                    </Button>
                    <Button
                      variant='outline'
                      className='text-red-1400 h-7 rounded-[6px] px-2'
                      onClick={() => setDisconnecting(c)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    className='h-7 rounded-[6px] px-2'
                    onClick={() => {
                      setConnecting(c)
                      setDialogOpen(true)
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </RoleGate>
          </div>
        ))}
      </CardContent>

      <ConnectorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setConnecting(null)
        }}
        connector={connecting}
        onConnect={connectConnector}
      />

      <ConfirmDialog
        open={disconnecting !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnecting(null)
        }}
        title={`Disconnect ${disconnecting?.name ?? ''}?`}
        desc={`Messages will stop going out on ${disconnecting?.name ?? 'this channel'} and the channel will be switched off. Anything already queued falls back to email, so nothing is lost.`}
        confirmText='Disconnect'
        destructive
        handleConfirm={() => {
          if (disconnecting) disconnectConnector(disconnecting.id)
          setDisconnecting(null)
        }}
      />
    </Card>
  )
}
