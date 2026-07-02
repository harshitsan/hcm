import { useState } from 'react'
import { Lock, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CHANNELS,
  CHANNEL_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type Channel,
  type EventTypeId,
} from '../data/notifications'
import { type Frequency, type PreferenceVersion } from '../data/settings'

interface PreferencesTabProps {
  current: PreferenceVersion
  versions: PreferenceVersion[]
  savePreferences: (
    channels: Channel[],
    subscriptions: EventTypeId[],
    frequency: Frequency
  ) => void
}

const FREQUENCIES: { value: Frequency; label: string; hint: string }[] = [
  { value: 'immediate', label: 'Immediate', hint: 'Deliver each notification as it fires' },
  { value: 'daily', label: 'Daily digest', hint: 'Consolidate into one daily summary' },
  { value: 'weekly', label: 'Weekly digest', hint: 'Consolidate into one weekly summary' },
]

/**
 * Personal notification preferences (NTF-12): channels (email enforced),
 * event subscriptions (critical events locked on) and delivery frequency.
 * Saves are effective-dated and versioned with history retained (NTF-20).
 */
export function PreferencesTab({
  current,
  versions,
  savePreferences,
}: PreferencesTabProps) {
  const [channels, setChannels] = useState<Channel[]>(current.channels)
  const [subscriptions, setSubscriptions] = useState<EventTypeId[]>(
    current.subscriptions
  )
  const [frequency, setFrequency] = useState<Frequency>(current.frequency)

  const toggleChannel = (channel: Channel, on: boolean) => {
    setChannels((prev) =>
      on ? [...prev, channel] : prev.filter((c) => c !== channel)
    )
  }

  const toggleSubscription = (eventType: EventTypeId, on: boolean) => {
    setSubscriptions((prev) =>
      on ? [...prev, eventType] : prev.filter((e) => e !== eventType)
    )
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <SlidersHorizontal className='text-blue-1400 size-4' />
            My delivery preferences
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Future notifications respect these selections. Email stays enforced
            for mandatory and critical communications even if deselected.
          </p>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div>
            <p className='mb-1 text-sm font-medium'>Preferred channels</p>
            <div className='space-y-2'>
              {CHANNELS.map((c) => (
                <div
                  key={c}
                  className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-1.5'
                >
                  <div className='flex items-center gap-2'>
                    <p className='text-neutral-1600 text-sm'>
                      {CHANNEL_LABELS[c]}
                    </p>
                    {c === 'email' && (
                      <Badge variant='dropped'>
                        <Lock className='size-3' />
                        Enforced
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={c === 'email' ? true : channels.includes(c)}
                    disabled={c === 'email'}
                    onCheckedChange={(on) => toggleChannel(c, on)}
                    aria-label={CHANNEL_LABELS[c]}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className='mb-1 text-sm font-medium'>Event subscriptions</p>
            <div className='space-y-2'>
              {EVENT_TYPES.filter((e) => e.id !== 'digest').map((e) => (
                <div
                  key={e.id}
                  className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-1.5'
                >
                  <div className='flex items-center gap-2'>
                    <p className='text-neutral-1600 text-sm'>{e.label}</p>
                    {e.critical && (
                      <Badge variant='dropped'>
                        <Lock className='size-3' />
                        Mandatory
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={e.critical ? true : subscriptions.includes(e.id)}
                    disabled={e.critical}
                    onCheckedChange={(on) => toggleSubscription(e.id, on)}
                    aria-label={e.label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className='mb-1 text-sm font-medium'>Delivery frequency</p>
            <RadioGroup
              value={frequency}
              onValueChange={(v) => setFrequency(v as Frequency)}
              className='space-y-1'
            >
              {FREQUENCIES.map((f) => (
                <label
                  key={f.value}
                  className='border-grey-200 flex cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-1.5'
                >
                  <RadioGroupItem value={f.value} id={`freq-${f.value}`} />
                  <div>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {f.label}
                    </p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {f.hint}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={() => savePreferences(channels, subscriptions, frequency)}
            >
              Save preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Preference history (effective-dated)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Every save is recorded with its effective date and prior settings
            are preserved — an audit can determine exactly which preferences
            were in effect when any past notification was sent.
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Saved by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...versions].reverse().map((v) => (
                <TableRow key={v.version}>
                  <TableCell className='text-sm font-medium'>
                    v{v.version}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {v.channels.map((c) => CHANNEL_LABELS[c]).join(', ')}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {v.subscriptions.length} of{' '}
                    {EVENT_TYPES.filter((e) => e.id !== 'digest').length} event
                    types
                  </TableCell>
                  <TableCell className='text-sm capitalize'>
                    {v.frequency}
                  </TableCell>
                  <TableCell className='text-sm'>{v.effectiveFrom}</TableCell>
                  <TableCell className='text-sm'>{v.savedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Subscribed events for the current version:{' '}
            {current.subscriptions
              .map((s) => EVENT_TYPE_LABELS[s])
              .join(', ')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
