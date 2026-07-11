import { CalendarClock, Database, GitBranch, Send, ShieldCheck, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CURRENT_ADMIN, DIMENSION_LABELS, DIMENSIONS } from '../data/org'
import { type AnnouncementSettingsStore } from '../hooks/use-announcement-settings'

interface ConfigTabProps {
  settings: AnnouncementSettingsStore
  onRunSchedulingEngine: () => void
}

const ENGINE_PANELS = [
  {
    icon: Workflow,
    title: 'Rules & matching engine',
    body: 'Audience resolution applies AND across the six targeting dimensions and OR within a dimension, evaluated against each employee’s current attributes. The same generic evaluator powers every module.',
  },
  {
    icon: Send,
    title: 'Notification & template engine',
    body: 'Published announcements render through the shared template mechanism for each resolved recipient. Recipients without system access are excluded from in-system delivery.',
  },
  {
    icon: Database,
    title: 'Canonical data model',
    body: 'Each announcement persists content, author, six structured targeting selectors linked to canonical org entities (not free text), and first-class scheduled-publish and expiry timestamps.',
  },
  {
    icon: ShieldCheck,
    title: 'Tenant isolation (row-level security)',
    body: 'Records are tenant-scoped: queries return only the caller’s authorized companies regardless of code path — a Company Admin can never read another tenant’s announcements.',
  },
  {
    icon: GitBranch,
    title: 'Effective-dated visibility with bitemporal history',
    body: 'Schedule and expiry define the effective visibility window. Every edit retains prior values as history, so who-could-see-what-when is reconstructable for any past date.',
  },
] as const

/**
 * Platform Admin governance (ANN-14..21): versioned effective-dated module
 * toggle, governed targeting value deprecation, and the shared engine panels
 * including a manually triggerable scheduling engine run.
 */
export function ConfigTab({ settings, onRunSchedulingEngine }: ConfigTabProps) {
  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Module governance (per-tenant, effective-dated)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
            <div>
              <Label htmlFor='module-toggle' className='text-sm font-medium'>
                Announcements module enabled
              </Label>
              <p className='text-paragraph-sm text-neutral-1000'>
                When off, no compose or view surfaces are available for this
                tenant. Every change is versioned below.
              </p>
            </div>
            <Switch
              id='module-toggle'
              checked={settings.moduleEnabled}
              onCheckedChange={(enabled) =>
                settings.setModuleEnabled(enabled, CURRENT_ADMIN)
              }
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...settings.configVersions].reverse().map((v) => (
                <TableRow key={v.version}>
                  <TableCell className='text-sm font-medium'>v{v.version}</TableCell>
                  <TableCell>
                    <Badge variant={v.enabled ? 'badge_active' : 'badge_inactive'}>
                      {v.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm'>{v.effectiveFrom}</TableCell>
                  <TableCell className='text-sm'>{v.changedBy}</TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>{v.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Governed targeting configuration
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Audience picker values resolve from this per-tenant config — no
            code changes needed. Deprecated values stop being offered for new
            announcements.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          {DIMENSIONS.map((dimension) => (
            <div key={dimension}>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                {DIMENSION_LABELS[dimension]}
              </p>
              <div className='flex flex-wrap gap-2'>
                {settings.orgConfig[dimension].map((value) => (
                  <button
                    key={value.value}
                    type='button'
                    onClick={() => settings.toggleDeprecated(dimension, value.value)}
                    title={
                      value.deprecated
                        ? 'Deprecated — click to restore'
                        : 'Active — click to deprecate'
                    }
                  >
                    <Badge variant={value.deprecated ? 'badge_inactive' : 'open'}>
                      {value.value}
                      {value.deprecated ? ' (deprecated)' : ''}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
        <CardHeader className='flex items-center justify-between px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Shared platform engines
          </CardTitle>
          <Button
            onClick={onRunSchedulingEngine}
            className='h-7 gap-1 rounded-[6px] px-2'
          >
            <CalendarClock className='size-3.5' />
            Run scheduling engine
          </Button>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
            <div className='border-gray-200 rounded-[6px] border px-3 py-2'>
              <div className='mb-1 flex items-center gap-2'>
                <CalendarClock className='text-blue-1400 size-4' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  Scheduling engine
                </p>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Drives publish and expiry transitions automatically: Scheduled
                → Published at the start date, Published → Recently Completed
                past expiry, then → Completed. Runs are idempotent — delayed
                runs process all due transitions without duplicating delivery.
              </p>
            </div>
            {ENGINE_PANELS.map((panel) => (
              <div
                key={panel.title}
                className='border-gray-200 rounded-[6px] border px-3 py-2'
              >
                <div className='mb-1 flex items-center gap-2'>
                  <panel.icon className='text-blue-1400 size-4' />
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {panel.title}
                  </p>
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>{panel.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
