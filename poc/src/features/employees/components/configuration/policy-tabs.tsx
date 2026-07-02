import { useState } from 'react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { RoleGate, useRole } from '@/context/role-context'
import {
  type LifecycleStageConfig,
  type NotificationTemplate,
  type TimelineEventConfig,
} from '../../data/configuration'
import { type ConfigurationStore } from '../../hooks/use-configuration'
import { SectionTitle } from '../shared'

/**
 * EMP-21 lifecycle stage parameters + EMP-54 timeline event configuration —
 * versioned company policy, no code deployment needed.
 */
export function LifecycleConfigTab({ store }: { store: ConfigurationStore }) {
  const [editing, setEditing] = useState<LifecycleStageConfig | null>(null)
  const [value, setValue] = useState('')
  const [eventOpen, setEventOpen] = useState(false)
  const [preview, setPreview] = useState<TimelineEventConfig | null>(null)
  const [evModule, setEvModule] = useState('Employees')
  const [evParent, setEvParent] = useState('')
  const [evName, setEvName] = useState('')
  const [evDescription, setEvDescription] = useState('')
  const [evColor, setEvColor] = useState('#2563eb')
  const [evDocument, setEvDocument] = useState('')

  const saveStage = () => {
    if (!editing || !value) return
    store.updateLifecycleValue(editing.id, value)
    setEditing(null)
  }

  const saveEvent = () => {
    if (!evParent || !evName) return
    store.saveTimelineEvent({
      module: evModule,
      parentEvent: evParent,
      event: evName,
      description: evDescription,
      color: evColor,
      document: evDocument || null,
    })
    setEventOpen(false)
    setEvParent('')
    setEvName('')
    setEvDescription('')
    setEvDocument('')
  }

  return (
    <div className='space-y-4'>
      <SectionTitle>
        Lifecycle stages & parameters (effective-dated, versioned)
      </SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Version</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.lifecycleConfig.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.stage}</TableCell>
                <TableCell>{c.parameter}</TableCell>
                <TableCell className='text-neutral-1000'>{c.value}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.effectiveFrom}
                </TableCell>
                <TableCell>
                  <Badge variant='pending'>v{c.version}</Badge>
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setEditing(c)
                        setValue(c.value)
                      }}
                    >
                      Edit
                    </Button>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        New records follow the updated config (e.g. probation uses the
        configured duration) while existing history is preserved.
      </p>

      <div className='flex items-center justify-between'>
        <SectionTitle>Employee timeline events</SectionTitle>
        <RoleGate roles={['Company Admin']}>
          <Button size='sm' onClick={() => setEventOpen(true)}>
            <Plus size={12} weight='bold' />
            Add timeline event
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Parent event</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Document</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.timelineEvents.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.module}</TableCell>
                <TableCell>{t.parentEvent}</TableCell>
                <TableCell className='font-medium'>{t.event}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {t.description}
                </TableCell>
                <TableCell>
                  <span
                    className='inline-block h-4 w-4 rounded-full align-middle'
                    style={{ backgroundColor: t.color }}
                    aria-label={t.color}
                  />
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {t.document ?? '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPreview(t)}
                  >
                    Preview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>
              {editing?.stage} — {editing?.parameter}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-1'>
            <Label>Value</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveStage}>Save (new version)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New timeline event</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Module</Label>
                <Input
                  value={evModule}
                  onChange={(e) => setEvModule(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>Parent event</Label>
                <Input
                  value={evParent}
                  onChange={(e) => setEvParent(e.target.value)}
                  placeholder='e.g. Lifecycle'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Event</Label>
              <Input
                value={evName}
                onChange={(e) => setEvName(e.target.value)}
                placeholder='e.g. Promotion'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Textarea
                value={evDescription}
                onChange={(e) => setEvDescription(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Timeline color</Label>
                <Input
                  type='color'
                  value={evColor}
                  onChange={(e) => setEvColor(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>Document (optional)</Label>
                <Input
                  value={evDocument}
                  onChange={(e) => setEvDocument(e.target.value)}
                  placeholder='e.g. Promotion letter'
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEvent} disabled={!evParent || !evName}>
              Add event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview !== null}
        onOpenChange={(o) => {
          if (!o) setPreview(null)
        }}
      >
        <DialogContent className='sm:max-w-[360px]'>
          <DialogHeader>
            <DialogTitle>Timeline preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className='flex items-start gap-3'>
              <div
                className='mt-1 h-3 w-3 shrink-0 rounded-full'
                style={{ backgroundColor: preview.color }}
              />
              <div>
                <p className='text-sm font-medium'>{preview.event}</p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {preview.parentEvent} · {preview.module}
                </p>
                <p className='text-paragraph-sm pt-1'>{preview.description}</p>
                {preview.document && (
                  <Badge variant='open' className='mt-1'>
                    {preview.document}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** EMP-26 — notification templates used by the Notification engine. */
export function NotificationsTab({ store }: { store: ConfigurationStore }) {
  const { hasRole } = useRole()
  const canEdit = hasRole('Company Admin', 'Platform Admin')
  const [editing, setEditing] = useState<NotificationTemplate | null>(null)
  const [body, setBody] = useState('')

  return (
    <div className='space-y-4'>
      <SectionTitle>
        Lifecycle & manager-change notification templates
      </SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.event}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {t.audience}
                </TableCell>
                <TableCell className='text-neutral-1000 max-w-[300px] truncate'>
                  {t.template}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={t.enabled}
                    disabled={!canEdit}
                    onCheckedChange={() => store.toggleTemplate(t.id)}
                    aria-label={`Toggle ${t.event}`}
                  />
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setEditing(t)
                        setBody(t.template)
                      }}
                    >
                      Edit template
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        When a lifecycle event or manager-assignment change is committed, the
        Notification engine renders these templates and notifies the employee
        and impacted managers automatically. Template updates apply on the
        next send — no code changes.
      </p>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>{editing?.event} template</DialogTitle>
          </DialogHeader>
          <div className='space-y-1'>
            <Label>
              Template body ({'{{name}}'}, {'{{date}}'}, {'{{manager}}'}…)
            </Label>
            <Textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editing) store.updateTemplateBody(editing.id, body)
                setEditing(null)
              }}
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
