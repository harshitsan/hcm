import { seedTimelineEvents as timelineEventConfigs } from '@/features/employees/data/configuration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  TIMELINE_AUDIENCES,
  eventTypeColor,
  type TimelineAudience,
} from '../data/timeline'
import { type TimelineStore } from '../hooks/use-timeline'

/**
 * Admin control over the Employee Timeline feed: enable/disable each of the
 * eight configured event types and choose who can view them. Disabled types
 * are filtered out of every feed; restricted types stay visible to admin/HR
 * roles and on an employee's own timeline.
 */
export function TimelineSettingsCard({ timeline }: { timeline: TimelineStore }) {
  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Timeline settings
        </CardTitle>
        <p className='text-neutral-1000 text-xs'>
          Event types and colors are configured in the Employees module; here
          you control which types appear on employee timelines and who can view
          them.
        </p>
      </CardHeader>
      <CardContent className='space-y-1'>
        {timeline.settings.map((setting, index) => {
          const config = timelineEventConfigs.find(
            (c) => c.event === setting.event
          )
          return (
            <div
              key={setting.event}
              className={`flex flex-wrap items-center gap-3 py-2 ${
                index > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <span
                className='h-3 w-3 shrink-0 rounded-full'
                style={{ backgroundColor: eventTypeColor(setting.event) }}
                aria-hidden
              />
              <div className='min-w-0 flex-1'>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {setting.event}
                </p>
                {config && (
                  <p className='text-neutral-1000 truncate text-xs'>
                    {config.description}
                  </p>
                )}
              </div>
              <Select
                value={setting.audience}
                onValueChange={(v) =>
                  timeline.setEventAudience(
                    setting.event,
                    v as TimelineAudience
                  )
                }
              >
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[180px] text-xs'
                  disabled={!setting.enabled}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_AUDIENCES.map((audience) => (
                    <SelectItem key={audience} value={audience}>
                      {audience}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                checked={setting.enabled}
                onCheckedChange={(v) =>
                  timeline.setEventEnabled(setting.event, v)
                }
                aria-label={`Toggle ${setting.event} events`}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
