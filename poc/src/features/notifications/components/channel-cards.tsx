import { useState } from 'react'
import { Lock, PlugZap, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { RoleGate, useRole } from '@/context/role-context'
import { CHANNEL_LABELS, type Channel } from '../data/notifications'
import { type ChannelSetting, type Connector } from '../data/settings'
import { type ConnectorDraft } from '../hooks/use-notification-settings'
import { ConnectorDialog } from './connector-dialog'

interface ChannelsCardProps {
  channels: ChannelSetting[]
  connectors: Connector[]
  toggleChannel: (channel: Channel, enabled: boolean) => void
}

/**
 * Company channel configuration (NTF-01/02/03): email is locked always-on;
 * in-app is optional; Teams/WhatsApp depend on a provisioned connector.
 */
export function ChannelsCard({
  channels,
  connectors,
  toggleChannel,
}: ChannelsCardProps) {
  const { hasRole } = useRole()
  const canToggle = hasRole('Company Admin', 'Group Company Admin')

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <Send className='text-blue-1400 size-4' />
          Notification channels
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Company Admins choose the optional channels; Group Company Admin
          settings apply group-wide. Email can never be disabled.
        </p>
      </CardHeader>
      <CardContent className='space-y-2 px-4'>
        {channels.map((c) => {
          const connector = connectors.find((k) => k.id === c.channel)
          const connectorBlocked =
            c.requiresConnector && (!connector || !connector.provisioned)
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
                    <Badge variant={connectorBlocked ? 'badge_inactive' : 'open'}>
                      {connectorBlocked ? 'No connector' : 'Connector ready'}
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
  saveConnector: (id: Connector['id'], draft: ConnectorDraft) => void
  testConnector: (id: Connector['id']) => void
}

/** Platform Admin connector provisioning + health (NTF-03, NTF-13). */
export function ConnectorsCard({
  connectors,
  saveConnector,
  testConnector,
}: ConnectorsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Connector | null>(null)

  const credentialBadge = (c: Connector) => {
    if (c.credentialStatus === 'valid')
      return <Badge variant='badge_active'>Credentials valid</Badge>
    if (c.credentialStatus === 'invalid')
      return <Badge variant='dropped'>Invalid credentials</Badge>
    return <Badge variant='badge_inactive'>Not provisioned</Badge>
  }

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <PlugZap className='text-blue-1400 size-4' />
          Third-party connectors (platform)
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Teams and WhatsApp route through connectors provisioned here. When a
          connector is unavailable or its credentials are invalid, delivery
          fails over to email so no notification is lost.
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
                {credentialBadge(c)}
                {c.lastTestResult && (
                  <Badge variant={c.lastTestResult === 'success' ? 'completed' : 'overdue'}>
                    Last test: {c.lastTestResult}
                  </Badge>
                )}
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                {c.provisioned
                  ? c.webhookUrl
                  : 'Channel remains unavailable to companies until provisioned.'}
              </p>
            </div>
            <RoleGate
              roles={['Platform Admin']}
              fallback={
                <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                  Managed by Platform Admin
                </span>
              }
            >
              <div className='flex shrink-0 items-center gap-2'>
                <Button
                  variant='outline'
                  className='h-7 rounded-[6px] px-2'
                  onClick={() => testConnector(c.id)}
                >
                  Test delivery
                </Button>
                <Button
                  className='h-7 rounded-[6px] px-2'
                  onClick={() => {
                    setEditing(c)
                    setDialogOpen(true)
                  }}
                >
                  {c.provisioned ? 'Update credentials' : 'Provision'}
                </Button>
              </div>
            </RoleGate>
          </div>
        ))}
      </CardContent>

      <ConnectorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        connector={editing}
        onSubmit={saveConnector}
      />
    </Card>
  )
}
