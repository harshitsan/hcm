import { Fragment, useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  CaretDown,
  CaretLeft,
  CaretRight,
  Plus,
} from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/context/role-context'
import { cn } from '@/utils/helpers'
import { DEPARTMENTS, LOCATIONS, POSITIONS } from '../../data/employees'
import {
  CHECKLIST_ROLES,
  PERFORMER_KINDS,
  TIMING_RELATIONS,
  formatTiming,
  getEscalation,
  type JoiningTask,
  type PerformerKind,
  type TimingRelation,
} from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, MultiToggle, StatusBadge } from '../shared'
import { JoineeTaskPanel } from './joinee-task-panel'

const JOINEE_STATUSES = ['Pending initiation', 'In Progress', 'Completed']

const TASK_PAGE_SIZE = 4

/**
 * EMP-31 — new-joinee joining-formalities tracking. Each row expands into
 * the per-joinee checklist with granular task actions (complete / reassign /
 * complete on behalf) and overdue/escalation indicators.
 */
export function NewJoineesTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      store.joinees.filter(
        (j) =>
          (statusFilter === 'all' || j.status === statusFilter) &&
          (departmentFilter === 'all' || j.department === departmentFilter)
      ),
    [store.joinees, statusFilter, departmentFilter]
  )

  const escalatedCount = (joineeId: string) =>
    store.joineeTasks.filter(
      (t) => t.joineeId === joineeId && getEscalation(t).state === 'escalated'
    ).length

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={JOINEE_STATUSES}
        />
        <FilterSelect
          label='Department'
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={DEPARTMENTS}
        />
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-8' />
              <TableHead>Candidate name</TableHead>
              <TableHead>Employee code</TableHead>
              <TableHead>Date of joining</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reporting manager</TableHead>
              <TableHead>Formalities</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((j) => {
              const expanded = expandedId === j.id
              const escalated = escalatedCount(j.id)
              return (
                <Fragment key={j.id}>
                  <TableRow
                    className='cursor-pointer'
                    onClick={() => setExpandedId(expanded ? null : j.id)}
                  >
                    <TableCell>
                      <Button
                        variant='icon2'
                        className='text-neutral-1900 h-6 w-6'
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} tasks for ${j.candidateName}`}
                        aria-expanded={expanded}
                      >
                        <CaretDown
                          size={14}
                          weight='bold'
                          className={cn(
                            'transition-transform',
                            expanded ? 'rotate-180' : ''
                          )}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {j.candidateName}
                    </TableCell>
                    <TableCell>{j.employeeCode}</TableCell>
                    <TableCell className='text-neutral-1000'>
                      {j.dateOfJoining}
                    </TableCell>
                    <TableCell>{j.department}</TableCell>
                    <TableCell>{j.location}</TableCell>
                    <TableCell>{j.reportingManager}</TableCell>
                    <TableCell className='text-neutral-1000'>
                      {j.tasksDone}/{j.tasksTotal} tasks
                      {escalated > 0 && (
                        <Badge variant='dropped' className='ml-1.5'>
                          {escalated} escalated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={j.status} />
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={9} className='bg-neutral-200/40 p-3'>
                        <JoineeTaskPanel joinee={j} store={store} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/* ── Joining checklist configuration ─────────────────────────────────── */

interface TaskDraft {
  name: string
  description: string
  locations: string[]
  kind: PerformerKind
  value: string
  relation: TimingRelation
  days: string
  escalationDays: string
  visibleOnly: boolean
}

const EMPTY_DRAFT: TaskDraft = {
  name: '',
  description: '',
  locations: [],
  kind: 'Role',
  value: '',
  relation: 'On',
  days: '0',
  escalationDays: '2',
  visibleOnly: false,
}

/** EMP-30 — configurable onboarding/joining checklist task definitions. */
export function JoiningChecklistTab({ store }: { store: LifecycleStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<JoiningTask | null>(null)
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT)
  const [page, setPage] = useState(0)

  const patch = (partial: Partial<TaskDraft>) =>
    setDraft((d) => ({ ...d, ...partial }))

  const pageCount = Math.max(
    1,
    Math.ceil(store.joiningTasks.length / TASK_PAGE_SIZE)
  )
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () =>
      store.joiningTasks.slice(
        safePage * TASK_PAGE_SIZE,
        safePage * TASK_PAGE_SIZE + TASK_PAGE_SIZE
      ),
    [store.joiningTasks, safePage]
  )

  const openFor = (task: JoiningTask | null) => {
    setEditing(task)
    setDraft(
      task
        ? {
            name: task.name,
            description: task.description,
            locations: task.applicableLocations,
            kind: task.performedBy.kind,
            value: task.performedBy.value ?? '',
            relation: task.timing.relation,
            days: String(task.timing.days),
            escalationDays: String(task.escalationDays),
            visibleOnly: task.visibleOnlyToAssignee,
          }
        : EMPTY_DRAFT
    )
    setOpen(true)
  }

  const valid =
    draft.name.trim() &&
    draft.locations.length > 0 &&
    (draft.kind === 'Reporting Manager' || draft.value) &&
    (draft.relation === 'On' || Number(draft.days) > 0) &&
    Number(draft.escalationDays) >= 0

  const submit = () => {
    if (!valid) return
    store.saveJoiningTask(
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        applicableLocations: draft.locations,
        performedBy: {
          kind: draft.kind,
          value: draft.kind === 'Reporting Manager' ? undefined : draft.value,
        },
        timing: {
          relation: draft.relation,
          days: draft.relation === 'On' ? 0 : Number(draft.days),
        },
        escalationDays: Number(draft.escalationDays),
        visibleOnlyToAssignee: draft.visibleOnly,
      },
      editing?.id
    )
    setOpen(false)
  }

  const valueOptions =
    draft.kind === 'Role' ? CHECKLIST_ROLES : [...POSITIONS]

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Configured tasks are instantiated per joinee — start/due dates derive
          from the Date of Joining, and the performer rule resolves the
          assignee.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh joining tasks'
            onClick={() => {
              setPage(0)
              toast.success(
                'Joining tasks refreshed — showing the latest data'
              )
            }}
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <RoleGate roles={['Company Admin']}>
            <Button size='sm' onClick={() => openFor(null)}>
              <Plus size={12} weight='bold' />
              Add joining task
            </Button>
          </RoleGate>
        </div>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Performed by</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Escalation</TableHead>
              <TableHead>Applicable locations</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <p className='font-medium'>{t.name}</p>
                  <p className='text-neutral-1000 max-w-[260px] truncate text-xs'>
                    {t.description}
                  </p>
                </TableCell>
                <TableCell>
                  {t.performedBy.kind === 'Reporting Manager'
                    ? 'Reporting Manager'
                    : `${t.performedBy.kind}: ${t.performedBy.value}`}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {formatTiming(t.timing)}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  After {t.escalationDays} day
                  {t.escalationDays === 1 ? '' : 's'} past due
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {t.applicableLocations.length === LOCATIONS.length
                    ? 'All locations'
                    : t.applicableLocations.join(', ')}
                </TableCell>
                <TableCell>
                  {t.visibleOnlyToAssignee ? (
                    <Badge variant='badge_inactive'>Assignee only</Badge>
                  ) : (
                    <span className='text-neutral-1000'>Everyone</span>
                  )}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openFor(t)}
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
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Displaying items {safePage * TASK_PAGE_SIZE + 1} -{' '}
          {Math.min(
            safePage * TASK_PAGE_SIZE + TASK_PAGE_SIZE,
            store.joiningTasks.length
          )}{' '}
          of {store.joiningTasks.length}
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <CaretLeft size={12} weight='bold' />
            Prev
          </Button>
          <span className='text-paragraph-sm text-neutral-1000'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
            <CaretRight size={12} weight='bold' />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit joining task' : 'New joining task'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Task name</Label>
              <Input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder='e.g. Issue ID card'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder='What needs to be done and how'
              />
            </div>
            <div className='space-y-1'>
              <Label>Applicable locations</Label>
              <MultiToggle
                options={LOCATIONS}
                value={draft.locations}
                onChange={(locations) => patch({ locations })}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Performed by</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(kind) =>
                    patch({ kind: kind as PerformerKind, value: '' })
                  }
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFORMER_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {draft.kind !== 'Reporting Manager' ? (
                <div className='space-y-1'>
                  <Label>
                    {draft.kind === 'Role' ? 'Role' : 'Position level'}
                  </Label>
                  <Select
                    value={draft.value}
                    onValueChange={(value) => patch({ value })}
                  >
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue
                        placeholder={
                          draft.kind === 'Role'
                            ? 'Select role'
                            : 'Select position'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {valueOptions.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className='space-y-1'>
                  <Label>Resolved as</Label>
                  <p className='text-neutral-1000 pt-1.5 text-sm'>
                    The joinee’s reporting manager
                  </p>
                </div>
              )}
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label>Timing</Label>
                <Select
                  value={draft.relation}
                  onValueChange={(relation) =>
                    patch({ relation: relation as TimingRelation })
                  }
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMING_RELATIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === 'On' ? 'On DOJ' : `${r} DOJ`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Days</Label>
                <Input
                  type='number'
                  min={0}
                  value={draft.relation === 'On' ? '0' : draft.days}
                  disabled={draft.relation === 'On'}
                  onChange={(e) => patch({ days: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Escalate after (days)</Label>
                <Input
                  type='number'
                  min={0}
                  value={draft.escalationDays}
                  onChange={(e) => patch({ escalationDays: e.target.value })}
                />
              </div>
            </div>
            <div className='flex items-center gap-2 pt-1'>
              <Checkbox
                id='visible-only'
                checked={draft.visibleOnly}
                onCheckedChange={(c) => patch({ visibleOnly: c === true })}
              />
              <Label htmlFor='visible-only' className='cursor-pointer'>
                Visible only to the assignee
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {editing ? 'Save' : 'Add task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
