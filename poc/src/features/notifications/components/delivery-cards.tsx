import { CalendarClock, Cpu, Network, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRole } from '@/context/role-context'
import { EVENT_TYPE_LABELS, type EventTypeId } from '../data/notifications'
import {
  hierarchyRows,
  type DeliveryModel,
  type DigestSchedule,
  type EventDeliverySetting,
} from '../data/settings'

interface DeliveryModelsCardProps {
  eventDelivery: EventDeliverySetting[]
  setEventModel: (eventType: EventTypeId, model: DeliveryModel) => void
  digestSchedule: DigestSchedule
  updateDigestSchedule: (patch: Partial<DigestSchedule>) => void
  runDigest: () => void
}

/**
 * Event-driven vs scheduler-driven configuration (NTF-08/09/17): each event
 * type is immediate or batched into the digest; critical events stay locked
 * to event-driven; the digest schedule is configurable and manually runnable.
 */
export function DeliveryModelsCard({
  eventDelivery,
  setEventModel,
  digestSchedule,
  updateDigestSchedule,
  runDigest,
}: DeliveryModelsCardProps) {
  const { hasRole } = useRole()
  const canConfigure = hasRole('Company Admin', 'Group Company Admin')

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <CalendarClock className='text-blue-1400 size-4' />
          Delivery models & digest schedule
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Event-driven notifications dispatch immediately as events fire.
          Digest-batched events are consolidated by the scheduler; empty
          periods send no digest. User frequency preferences are honored within
          these options.
        </p>
      </CardHeader>
      <CardContent className='space-y-3 px-4'>
        <div className='space-y-2'>
          {eventDelivery.map((e) => (
            <div
              key={e.eventType}
              className='border-grey-200 flex items-center justify-between gap-3 rounded-[6px] border px-3 py-1.5'
            >
              <div className='flex items-center gap-2'>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {EVENT_TYPE_LABELS[e.eventType]}
                </p>
                {e.locked && <Badge variant='dropped'>Critical — always immediate</Badge>}
              </div>
              <Select
                value={e.model}
                onValueChange={(v) => setEventModel(e.eventType, v as DeliveryModel)}
                disabled={e.locked || !canConfigure}
              >
                <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='event-driven'>Event-driven (immediate)</SelectItem>
                  <SelectItem value='digest'>Scheduler-driven digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-neutral-1600 text-sm font-medium'>
              Digest schedule
            </p>
            <Button
              variant='outline'
              className='h-7 gap-1 rounded-[6px] px-2'
              onClick={runDigest}
            >
              <CalendarClock className='size-3.5' />
              Run scheduler now
            </Button>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Select
              value={digestSchedule.frequency}
              onValueChange={(v) =>
                updateDigestSchedule({ frequency: v as DigestSchedule['frequency'] })
              }
              disabled={!canConfigure}
            >
              <SelectTrigger variant='secondary' className='h-7 w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='daily'>Daily</SelectItem>
                <SelectItem value='weekly'>Weekly</SelectItem>
              </SelectContent>
            </Select>
            {digestSchedule.frequency === 'weekly' && (
              <Select
                value={digestSchedule.weekday}
                onValueChange={(v) => updateDigestSchedule({ weekday: v })}
                disabled={!canConfigure}
              >
                <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
                    (d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
            <Select
              value={digestSchedule.time}
              onValueChange={(v) => updateDigestSchedule({ time: v })}
              disabled={!canConfigure}
            >
              <SelectTrigger variant='secondary' className='h-7 w-[110px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['06:00', '07:00', '08:00', '12:00', '17:00'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-paragraph-sm text-neutral-1000'>
              Last run: {digestSchedule.lastRunAt ?? 'never'} · empty digests
              are skipped
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Portfolio → group → company oversight of effective config (NTF-15, NTF-16). */
export function HierarchyCard() {
  const { hasRole } = useRole()
  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <Network className='text-blue-1400 size-4' />
          Portfolio & group defaults in effect
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          Portfolio defaults cascade to groups and companies; the most specific
          configuration wins at dispatch. Email is mandatory at every level and
          cannot be disabled anywhere in the hierarchy.
          {hasRole('Portfolio Admin') &&
            ' As Portfolio Admin you set the defaults the rows below inherit.'}
          {hasRole('Group Company Admin') &&
            ' As Group Company Admin your group-level templates and channels serve as defaults for your companies.'}
        </p>
      </CardHeader>
      <CardContent className='px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Channels in effect</TableHead>
              <TableHead>Template source</TableHead>
              <TableHead>Overrides</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hierarchyRows.map((r) => (
              <TableRow key={r.scope}>
                <TableCell className='text-sm font-medium'>{r.scope}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.level === 'Portfolio'
                        ? 'open'
                        : r.level === 'Group'
                          ? 'pending'
                          : 'completed'
                    }
                  >
                    {r.level}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm'>{r.channelsInEffect}</TableCell>
                <TableCell className='text-sm'>{r.templateSource}</TableCell>
                <TableCell className='text-neutral-1000 text-sm'>
                  {r.overrides}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const ENGINE_PANELS = [
  {
    icon: Cpu,
    title: 'Shared Notification/Template engine',
    body: 'Any module raises an event; the engine reads the tenant’s channel config, effective template version and recipient rules at dispatch, renders channel-appropriate output and routes to every enabled channel with email enforced.',
  },
  {
    icon: CalendarClock,
    title: 'Delivery guarantee',
    body: 'Failed channels retry per a backoff policy, then fail over to email. Exhausted deliveries land in the dead-letter store for admin review — a failure on one notification never blocks the queue.',
  },
  {
    icon: ShieldCheck,
    title: 'Tenant-scoped isolation (RLS)',
    body: 'Notification records, templates and preferences are tagged with their owning tenant and protected by row-level security. Connectors and background jobs can never read another tenant’s configuration or logs.',
  },
] as const

/** Platform engine info panels (NTF-19, NTF-21, NTF-22). */
export function EnginePanels() {
  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
      {ENGINE_PANELS.map((panel) => (
        <div
          key={panel.title}
          className='border-grey-200 rounded-[6px] border bg-white px-3 py-2'
        >
          <div className='mb-1 flex items-center gap-2'>
            <panel.icon className='text-blue-1400 size-4' />
            <p className='text-neutral-1600 text-sm font-medium'>{panel.title}</p>
          </div>
          <p className='text-paragraph-sm text-neutral-1000'>{panel.body}</p>
        </div>
      ))}
    </div>
  )
}
