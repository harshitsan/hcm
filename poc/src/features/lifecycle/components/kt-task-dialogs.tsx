import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  KT_TODAY,
  seedKtLeaves,
  type KtActionEntry,
  type KtTask,
} from '../data/knowledge-transfer'
import { fmtDate } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { StatusBadge } from './badges'

/** Statuses that still count as an open (pending) handover. */
const CLOSED_KT_STATUSES = ['Received', 'Pre Closed', 'Withdrawn']

/** Overdue = past the due date vs the fixed reference today (2026-07-09). */
export function isKtOverdue(t: KtTask) {
  return t.endDate < KT_TODAY && !CLOSED_KT_STATUSES.includes(t.status)
}

/** Open KT tasks a person is involved in (provider or receiver side). */
export function pendingKtFor(tasks: KtTask[], person: string) {
  return tasks.filter(
    (t) =>
      (t.provider === person || t.receiver === person) &&
      !CLOSED_KT_STATUSES.includes(t.status)
  )
}

/** Due date cell with overdue highlighting against today = 2026-07-09. */
export function KtDueDate({ task }: { task: KtTask }) {
  const overdue = isKtOverdue(task)
  return (
    <span className='flex items-center gap-1.5 text-sm'>
      <span className={overdue ? 'font-medium text-red-600' : undefined}>
        {fmtDate(task.endDate)}
      </span>
      {overdue && <Badge variant='overdue'>Overdue</Badge>}
    </span>
  )
}

/**
 * Context panel shown while assigning / actioning a KT task — the person's
 * pending KT tasks and their leave details (Kensium key features 2 & 3).
 */
export function KtPersonContext({
  label,
  person,
  tasks,
}: {
  label: string
  person: string
  tasks: KtTask[]
}) {
  const pending = pendingKtFor(tasks, person)
  const leaves = seedKtLeaves.filter((l) => l.employee === person)
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
      <p className='text-neutral-1600 mb-1 text-xs font-semibold'>
        {label} — {person || '—'}
      </p>
      <p className='text-neutral-1000 mb-0.5 text-[11px] font-medium uppercase'>
        Pending KT tasks
      </p>
      {person === '' || pending.length === 0 ? (
        <p className='text-neutral-1000 text-xs'>No pending KT tasks.</p>
      ) : (
        <ul className='space-y-0.5 text-xs'>
          {pending.map((t) => (
            <li key={t.id} className='flex items-center justify-between gap-2'>
              <span className='truncate'>{t.task}</span>
              <span className='text-neutral-1000 shrink-0'>
                due {fmtDate(t.endDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className='text-neutral-1000 mt-2 mb-0.5 text-[11px] font-medium uppercase'>
        Leave details
      </p>
      {person === '' || leaves.length === 0 ? (
        <p className='text-neutral-1000 text-xs'>No upcoming leaves.</p>
      ) : (
        <ul className='space-y-0.5 text-xs'>
          {leaves.map((l) => (
            <li key={`${l.employee}-${l.from}`} className='flex items-center justify-between gap-2'>
              <span>
                {fmtDate(l.from)} → {fmtDate(l.to)} · {l.type}
              </span>
              <Badge variant='outline' className='text-[10px]'>
                {l.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function historyOf(task: KtTask): KtActionEntry[] {
  if (task.history && task.history.length > 0) return task.history
  // Legacy seeds without an explicit trail still show the assignment.
  return [
    { actor: 'Anita Desai', action: 'Assigned', date: task.startDate, comment: null },
  ]
}

/** Chronological who / action / date / comment list for a task. */
export function KtActionHistory({ task }: { task: KtTask }) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white'>
      {historyOf(task).map((h, i) => (
        <div
          key={`${h.action}-${i}`}
          className='flex flex-col gap-0.5 border-b border-gray-100 px-3 py-2 text-xs last:border-b-0'
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='text-neutral-1600 font-medium'>{h.action}</span>
            <span className='text-neutral-1000'>{fmtDate(h.date)}</span>
          </div>
          <span className='text-neutral-1000'>by {h.actor}</span>
          {h.comment && <span className='italic'>“{h.comment}”</span>}
        </div>
      ))}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-neutral-1000 shrink-0'>{label}</span>
      <span className='text-right'>{value ?? '—'}</span>
    </div>
  )
}

interface KtDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: KtTask | null
}

/**
 * "View" action — the complete KT task record (exit details, notification
 * settings, documents, comments) plus the action history.
 */
export function KtDetailSheet({ open, onOpenChange, task }: KtDetailSheetProps) {
  if (!task) return null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {task.task}
            <StatusBadge status={task.status} />
            {isKtOverdue(task) && <Badge variant='overdue'>Overdue</Badge>}
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {task.id} · {task.department} ·{' '}
            {task.isExit ? `Exit KT (${task.exitType})` : 'Non-exit KT'}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          <section className='space-y-1.5'>
            <h3 className='text-sm font-semibold'>Task details</h3>
            <div className='space-y-1.5 rounded-[8px] border border-gray-200 bg-white p-3'>
              <DetailRow label='KT provider' value={task.provider} />
              <DetailRow label='KT receiver' value={task.receiver} />
              <DetailRow label='Project' value={task.project ?? '—'} />
              <DetailRow label='Start date' value={fmtDate(task.startDate)} />
              <DetailRow label='Due date' value={<KtDueDate task={task} />} />
              {task.description && (
                <p className='text-neutral-1000 pt-1 text-xs'>{task.description}</p>
              )}
            </div>
          </section>

          {task.isExit && (
            <section className='space-y-1.5'>
              <h3 className='text-sm font-semibold'>Exit details (read-only)</h3>
              <div className='space-y-1.5 rounded-[8px] border border-gray-200 bg-white p-3'>
                <DetailRow label='Exit type' value={task.exitType} />
                <DetailRow label='Date of joining' value={fmtDate(task.dateOfJoining)} />
                <DetailRow
                  label='Exit initiated date'
                  value={fmtDate(task.exitInitiatedDate)}
                />
                <DetailRow label='Tentative LWD' value={fmtDate(task.tentativeLwd)} />
              </div>
            </section>
          )}

          <section className='space-y-1.5'>
            <h3 className='text-sm font-semibold'>Notifications & documents</h3>
            <div className='space-y-1.5 rounded-[8px] border border-gray-200 bg-white p-3'>
              <DetailRow
                label='Notification required'
                value={task.notificationRequired ? 'Yes' : 'No'}
              />
              {task.notificationRequired && (
                <>
                  <DetailRow
                    label='Notify before due date'
                    value={`${task.notifyBeforeDays ?? 0} day(s)`}
                  />
                  <DetailRow
                    label='People to be notified'
                    value={(task.peopleToNotify ?? []).join(', ') || '—'}
                  />
                  <DetailRow
                    label='Notification frequency'
                    value={task.notificationFrequency ?? '—'}
                  />
                </>
              )}
              <DetailRow label='Uploaded document' value={task.documentName ?? '—'} />
              <DetailRow label='KT material' value={task.ktMaterial ?? '—'} />
              {task.comments && (
                <DetailRow label='Comments' value={task.comments} />
              )}
            </div>
          </section>

          <section className='space-y-1.5'>
            <h3 className='text-sm font-semibold'>Action history</h3>
            <KtActionHistory task={task} />
          </section>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}

interface KtActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: KtTask | null
  store: KnowledgeTransferStore
  /** Name of the person submitting the action (persona of the active role). */
  actor: string
  /** True when HR/manager acts on behalf of the employee (key feature 5). */
  onBehalfOf?: boolean
}

/**
 * Provider action "Initiate" — pick the action, optionally upload the KT
 * material, review the receiver's leave details, add a comment and submit.
 */
export function KtInitiateDialog({
  open,
  onOpenChange,
  task,
  store,
  actor,
  onBehalfOf = false,
}: KtActionDialogProps) {
  const [action, setAction] = useState('Initiate')
  const [comment, setComment] = useState('')
  const [materialName, setMaterialName] = useState<string | null>(null)

  if (!task) return null

  const submit = () => {
    store.initiateTask(task, { actor, comment, materialName, onBehalfOf })
    setComment('')
    setMaterialName(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Initiate KT · {task.task}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 text-sm'>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={task.status} />
            <span className='text-neutral-1000 text-xs'>
              {task.provider} → {task.receiver} · due {fmtDate(task.endDate)}
            </span>
          </div>
          {onBehalfOf && (
            <p className='rounded-[6px] border border-blue-600/30 bg-blue-50 p-2 text-xs text-blue-700'>
              You are updating this task on behalf of {task.provider}.
            </p>
          )}
          <KtPersonContext
            label='KT receiver'
            person={task.receiver}
            tasks={store.tasks}
          />
          <label className='flex items-center gap-3'>
            <span className='w-40 shrink-0'>Action</span>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Initiate'>Initiate</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className='flex items-center gap-3'>
            <span className='w-40 shrink-0'>Upload KT material</span>
            <Input
              type='file'
              className='h-8 flex-1'
              onChange={(e) => setMaterialName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          {materialName && (
            <p className='text-neutral-1000 text-xs'>
              Attached: {materialName} — submitting will move the task to
              “Pending for Receive”.
            </p>
          )}
          <label className='flex flex-col gap-1'>
            <span>Comment</span>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Sessions planned, material shared…'
              className='min-h-[64px]'
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={submit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Receiver action "Received" — full task details + action history are shown
 * before the acknowledgment is submitted.
 */
export function KtReceiveDialog({
  open,
  onOpenChange,
  task,
  store,
  actor,
  onBehalfOf = false,
}: KtActionDialogProps) {
  const [action, setAction] = useState('Received')
  const [comment, setComment] = useState('')

  if (!task) return null

  const submit = () => {
    store.receiveTask(task, { actor, comment, onBehalfOf })
    setComment('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Receive KT · {task.task}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 text-sm'>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={task.status} />
            <Badge variant='outline'>{task.department}</Badge>
            <span className='text-neutral-1000 text-xs'>
              {fmtDate(task.startDate)} → {fmtDate(task.endDate)}
            </span>
          </div>
          {onBehalfOf && (
            <p className='rounded-[6px] border border-blue-600/30 bg-blue-50 p-2 text-xs text-blue-700'>
              You are updating this task on behalf of {task.receiver}.
            </p>
          )}
          <div className='space-y-1.5 rounded-[8px] border border-gray-200 bg-white p-3'>
            <DetailRow label='KT provider' value={task.provider} />
            <DetailRow label='Project' value={task.project ?? '—'} />
            <DetailRow label='KT material' value={task.ktMaterial ?? '—'} />
            {task.description && (
              <p className='text-neutral-1000 pt-1 text-xs'>{task.description}</p>
            )}
          </div>
          <div>
            <p className='mb-1 text-xs font-semibold'>Action history</p>
            <KtActionHistory task={task} />
          </div>
          <label className='flex items-center gap-3'>
            <span className='w-40 shrink-0'>Action</span>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Received'>Received</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className='flex flex-col gap-1'>
            <span>Comment</span>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='All sessions completed, material reviewed…'
              className='min-h-[64px]'
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={submit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
