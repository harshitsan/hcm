import { useState } from 'react'
import { toast } from 'sonner'
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
import { type OnboardingTaskDef } from '../data/config'
import { fmtDate } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { StatusBadge } from './badges'
import { SectionCard } from './config-widgets'

const ASSIGNEE_ROLES = ['Employee', 'HR', 'IT Support', 'Reporting Manager']

/** Onboarding checklist template — versioned, effective-dated metadata. */
export function ConfigOnboarding({ config }: { config: LifecycleConfigStore }) {
  const [editing, setEditing] = useState<OnboardingTaskDef | null>(null)
  const [name, setName] = useState('')
  const [assigneeRole, setAssigneeRole] = useState('Employee')
  const [mandatory, setMandatory] = useState(true)
  const [docs, setDocs] = useState('')
  const [criteria, setCriteria] = useState('')

  const openEdit = (task: OnboardingTaskDef) => {
    setEditing(task)
    setName(task.name)
    setAssigneeRole(task.assigneeRole)
    setMandatory(task.mandatory)
    setDocs(task.requiredDocs.join(', '))
    setCriteria(task.completionCriteria)
  }

  const publish = () => {
    if (!editing) return
    if (!name.trim() || !criteria.trim()) {
      toast.error('Task name and completion criteria are required')
      return
    }
    config.publishTemplateTask(editing.id, {
      name: name.trim(),
      assigneeRole,
      mandatory,
      requiredDocs: docs
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      completionCriteria: criteria.trim(),
    })
    setEditing(null)
  }

  return (
    <div>
      <SectionCard
        title='Template versions'
        description='The workflow engine reads the published version at initiation; in-flight onboardings keep the version they started with.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.version}</TableCell>
                <TableCell>{fmtDate(t.effectiveFrom)}</TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title={`Stages & task checklist (published ${config.publishedTemplate.version})`}
        description='Mandatory stages run in order: Offer Acceptance → Document Submission → Document Verification → Asset Assignment → Induction Completion. Editing a task publishes a new effective-dated version — no code deployment.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Assignee role</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Required documents</TableHead>
              <TableHead>Completion criteria</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.publishedTemplate.stages.flatMap((s) =>
              s.tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className='font-medium'>{s.stage}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.assigneeRole}</TableCell>
                  <TableCell>
                    <Badge variant={t.mandatory ? 'badge_active' : 'badge_inactive'}>
                      {t.mandatory ? 'Mandatory' : 'Optional'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>
                    {t.requiredDocs.length > 0 ? t.requiredDocs.join(', ') : '—'}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-xs'>
                    {t.completionCriteria}
                  </TableCell>
                  <TableCell>
                    <Button size='sm' variant='outline' onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task → publish new template version</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Task name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Assignee role</Label>
              <Select value={assigneeRole} onValueChange={setAssigneeRole}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNEE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Mandatory task</Label>
              <Switch checked={mandatory} onCheckedChange={setMandatory} />
            </div>
            <div className='space-y-1'>
              <Label>Required documents (comma separated)</Label>
              <Input value={docs} onChange={(e) => setDocs(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Completion criteria</Label>
              <Input value={criteria} onChange={(e) => setCriteria(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={publish}>Publish new version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
