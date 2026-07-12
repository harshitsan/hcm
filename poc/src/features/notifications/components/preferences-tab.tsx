import { useState } from 'react'
import { Lock, MoonStar, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  type Channel,
} from '../data/notifications'
import {
  FREQUENCY_LABELS,
  SUBSCRIPTION_GROUPS,
  type Frequency,
  type GroupSubscription,
  type PreferenceVersion,
  type QuietHours,
} from '../data/settings'

interface PreferencesTabProps {
  current: PreferenceVersion
  versions: PreferenceVersion[]
  savePreferences: (
    channels: Channel[],
    groups: GroupSubscription[],
    quietHours: QuietHours
  ) => void
}

const FREQUENCIES: Frequency[] = ['immediate', 'daily', 'weekly']
const QUIET_START_OPTIONS = ['19:00', '20:00', '21:00', '22:00', '23:00']
const QUIET_END_OPTIONS = ['05:00', '06:00', '07:00', '08:00', '09:00']

/**
 * Personal notification settings (NTF-12): channel preferences (email locked
 * on for critical alerts), per-module event subscriptions with their own
 * delivery frequency, and quiet hours for non-critical alerts. Saves are
 * effective-dated and versioned with history retained (NTF-20).
 */
export function PreferencesTab({
  current,
  versions,
  savePreferences,
}: PreferencesTabProps) {
  const [channels, setChannels] = useState<Channel[]>(current.channels)
  const [groups, setGroups] = useState<GroupSubscription[]>(current.groups)
  const [quietHours, setQuietHours] = useState<QuietHours>(current.quietHours)

  const toggleChannel = (channel: Channel, on: boolean) => {
    setChannels((prev) =>
      on ? [...prev, channel] : prev.filter((c) => c !== channel)
    )
  }

  const patchGroup = (
    id: GroupSubscription['group'],
    patch: Partial<GroupSubscription>
  ) => {
    setGroups((prev) =>
      prev.map((g) => (g.group === id ? { ...g, ...patch } : g))
    )
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <SlidersHorizontal className='text-blue-1400 size-4' />
            My notification settings
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Future notifications respect these selections. Email stays locked
            on for critical communications even if other channels are off.
          </p>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div>
            <p className='mb-1 text-sm font-medium'>Channel preferences</p>
            <div className='space-y-2'>
              {CHANNELS.map((c) => (
                <div
                  key={c}
                  className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-1.5'
                >
                  <div className='flex items-center gap-2'>
                    <p className='text-neutral-1600 text-sm'>
                      {CHANNEL_LABELS[c]}
                    </p>
                    {c === 'email' && (
                      <Badge variant='dropped'>
                        <Lock className='size-3' />
                        Locked on for critical alerts
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
            <p className='text-paragraph-sm text-neutral-1000 mb-2'>
              Choose the areas you want to hear about and how often each one
              reaches you.
            </p>
            <div className='space-y-2'>
              {SUBSCRIPTION_GROUPS.map((g) => {
                const sub = groups.find((s) => s.group === g.id)
                if (!sub) return null
                return (
                  <div
                    key={g.id}
                    className='border-gray-200 flex items-center justify-between gap-3 rounded-[6px] border px-3 py-1.5'
                  >
                    <label className='flex cursor-pointer items-center gap-2'>
                      <Checkbox
                        variant='blue'
                        checked={g.critical ? true : sub.subscribed}
                        disabled={g.critical}
                        onCheckedChange={(on) =>
                          patchGroup(g.id, { subscribed: !!on })
                        }
                        aria-label={g.label}
                      />
                      <span className='text-neutral-1600 text-sm'>
                        {g.label}
                      </span>
                      {g.critical && (
                        <Badge variant='dropped'>
                          <Lock className='size-3' />
                          Always on, always immediate
                        </Badge>
                      )}
                    </label>
                    <Select
                      value={g.critical ? 'immediate' : sub.frequency}
                      onValueChange={(v) =>
                        patchGroup(g.id, { frequency: v as Frequency })
                      }
                      disabled={g.critical || !sub.subscribed}
                    >
                      <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {FREQUENCY_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className='mb-1 flex items-center gap-2'>
              <MoonStar className='text-blue-1400 size-4' />
              <p className='text-sm font-medium'>Quiet hours</p>
            </div>
            <div className='border-gray-200 space-y-2 rounded-[6px] border px-3 py-2'>
              <div className='flex items-center justify-between'>
                <p className='text-neutral-1600 text-sm'>
                  Pause alerts during quiet hours
                </p>
                <Switch
                  checked={quietHours.enabled}
                  onCheckedChange={(on) =>
                    setQuietHours((prev) => ({ ...prev, enabled: on }))
                  }
                  aria-label='Quiet hours'
                />
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-paragraph-sm text-neutral-1000'>From</span>
                <Select
                  value={quietHours.start}
                  onValueChange={(v) =>
                    setQuietHours((prev) => ({ ...prev, start: v }))
                  }
                  disabled={!quietHours.enabled}
                >
                  <SelectTrigger variant='secondary' className='h-7 w-[100px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIET_START_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className='text-paragraph-sm text-neutral-1000'>to</span>
                <Select
                  value={quietHours.end}
                  onValueChange={(v) =>
                    setQuietHours((prev) => ({ ...prev, end: v }))
                  }
                  disabled={!quietHours.enabled}
                >
                  <SelectTrigger variant='secondary' className='h-7 w-[100px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIET_END_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Quiet hours apply to non-critical alerts only. Critical alerts
                (approvals, escalations) are always delivered immediately.
              </p>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={() => savePreferences(channels, groups, quietHours)}
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Settings history (effective-dated)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Every save is recorded with its effective date and prior settings
            are preserved — an audit can determine exactly which settings were
            in effect when any past notification was sent.
          </p>
        </CardHeader>
        <CardContent className='px-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Quiet hours</TableHead>
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
                    {v.groups.filter((g) => g.subscribed).length} of{' '}
                    {SUBSCRIPTION_GROUPS.length} modules
                  </TableCell>
                  <TableCell className='text-sm'>
                    {v.quietHours.enabled
                      ? `${v.quietHours.start}–${v.quietHours.end}`
                      : 'Off'}
                  </TableCell>
                  <TableCell className='text-sm'>{v.effectiveFrom}</TableCell>
                  <TableCell className='text-sm'>{v.savedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Current subscriptions:{' '}
            {current.groups
              .filter((g) => g.subscribed)
              .map(
                (g) =>
                  `${SUBSCRIPTION_GROUPS.find((s) => s.id === g.group)?.label} (${FREQUENCY_LABELS[g.frequency]})`
              )
              .join(', ')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
