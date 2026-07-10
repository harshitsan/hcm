import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  KT_EMPLOYEES,
  KT_NOTIFICATION_FREQUENCIES,
  KT_TODAY,
  type KtExitContext,
  type KtNotificationFrequency,
} from '../data/knowledge-transfer'
import { DEPARTMENTS, addDays, fmtDate } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { CheckboxGroup } from './config-widgets'
import { KtPersonContext } from './kt-task-dialogs'

interface KtTaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: KnowledgeTransferStore
  /** Persona of the admin / manager assigning the task. */
  assignedBy: string
  /** When set, renders the Exit KT variant with read-only exit details. */
  exitContext?: KtExitContext | null
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className='flex items-center gap-3 text-sm'>
      <span className='w-40 shrink-0'>{label}</span>
      {children}
    </label>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3 text-sm'>
      <span className='text-neutral-1000'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  )
}

/**
 * "Add New KT Task" — Kensium KT assignment form. The exit variant shows the
 * read-only exit type / DOJ / exit initiated date / tentative LWD block and
 * pre-selects the exiting employee as the KT provider.
 */
export function KtTaskFormDialog({
  open,
  onOpenChange,
  store,
  assignedBy,
  exitContext = null,
}: KtTaskFormDialogProps) {
  const [task, setTask] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [provider, setProvider] = useState(exitContext?.employee ?? '')
  const [receiver, setReceiver] = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [startDate, setStartDate] = useState(KT_TODAY)
  const [dueDate, setDueDate] = useState(addDays(KT_TODAY, store.defaultHandoverDays))
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [notificationRequired, setNotificationRequired] = useState(false)
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('3')
  const [peopleToNotify, setPeopleToNotify] = useState<string[]>([])
  const [frequency, setFrequency] = useState<KtNotificationFrequency>('Once')
  const [comments, setComments] = useState('')

  const reset = () => {
    setTask('')
    setDescription('')
    setProject('')
    setProvider(exitContext?.employee ?? '')
    setReceiver('')
    setDepartment(DEPARTMENTS[0])
    setStartDate(KT_TODAY)
    setDueDate(addDays(KT_TODAY, store.defaultHandoverDays))
    setDocumentName(null)
    setNotificationRequired(false)
    setNotifyBeforeDays('3')
    setPeopleToNotify([])
    setFrequency('Once')
    setComments('')
  }

  const submit = () => {
    if (!task.trim()) {
      toast.error('Task name is required')
      return
    }
    if (!provider || !receiver) {
      toast.error('Both KT provider and KT receiver are required')
      return
    }
    if (provider === receiver) {
      toast.error('KT provider and KT receiver must be different employees')
      return
    }
    if (!startDate || !dueDate || dueDate < startDate) {
      toast.error('Due date must be on or after the start date')
      return
    }
    if (notificationRequired) {
      const days = Number(notifyBeforeDays)
      if (!Number.isFinite(days) || days < 0) {
        toast.error('Notify before due date must be 0 or more day(s)')
        return
      }
    }
    store.addTask({
      task: task.trim(),
      description: description.trim(),
      project: project.trim(),
      provider,
      receiver,
      department,
      startDate,
      dueDate,
      documentName,
      notificationRequired,
      notifyBeforeDays: Number(notifyBeforeDays),
      peopleToNotify,
      notificationFrequency: frequency,
      comments: comments.trim(),
      assignedBy,
      exit: exitContext
        ? {
            exitType: exitContext.exitType,
            dateOfJoining: exitContext.dateOfJoining,
            exitInitiatedDate: exitContext.exitInitiatedDate,
            tentativeLwd: exitContext.tentativeLwd,
          }
        : null,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>
            {exitContext
              ? `Add New KT Task — Exit (${exitContext.employee})`
              : 'Add New KT Task'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          {exitContext && (
            <div className='space-y-1.5 rounded-[8px] border border-gray-200 bg-white p-3'>
              <p className='text-neutral-1000 text-xs font-medium uppercase'>
                Exit details (read-only)
              </p>
              <ReadOnly label='Exit type' value={exitContext.exitType} />
              <ReadOnly
                label='Date of joining'
                value={fmtDate(exitContext.dateOfJoining)}
              />
              <ReadOnly
                label='Exit initiated date'
                value={fmtDate(exitContext.exitInitiatedDate)}
              />
              <ReadOnly
                label='Tentative LWD'
                value={fmtDate(exitContext.tentativeLwd)}
              />
            </div>
          )}

          <Field label='Task'>
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder='KT task name'
              className='h-8 flex-1'
            />
          </Field>
          <label className='flex flex-col gap-1 text-sm'>
            <span>Description</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Brief description of the task'
              className='min-h-[56px]'
            />
          </label>
          <Field label='Project'>
            <Input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder='Project name'
              className='h-8 flex-1'
            />
          </Field>
          <Field label='KT provider'>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger
                variant='secondary'
                className='h-8 flex-1'
                disabled={exitContext !== null}
              >
                <SelectValue placeholder='Select KT provider' />
              </SelectTrigger>
              <SelectContent>
                {KT_EMPLOYEES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='KT receiver'>
            <Select value={receiver} onValueChange={setReceiver}>
              <SelectTrigger variant='secondary' className='h-8 flex-1'>
                <SelectValue placeholder='Select KT receiver' />
              </SelectTrigger>
              <SelectContent>
                {KT_EMPLOYEES.filter((e) => e !== provider).map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Department'>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger variant='secondary' className='h-8 flex-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Start date'>
            <Input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='h-8 w-[170px]'
            />
          </Field>
          <Field label='Due date'>
            <Input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className='h-8 w-[170px]'
            />
          </Field>
          <Field label='Upload document'>
            <Input
              type='file'
              className='h-8 flex-1'
              onChange={(e) => setDocumentName(e.target.files?.[0]?.name ?? null)}
            />
          </Field>
          {documentName && (
            <p className='text-neutral-1000 text-xs'>Attached: {documentName}</p>
          )}

          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              variant='blue'
              checked={notificationRequired}
              onCheckedChange={(c) => setNotificationRequired(c === true)}
            />
            Notification required
          </label>
          {notificationRequired && (
            <div className='space-y-3 rounded-[8px] border border-gray-200 bg-white p-3'>
              <Field label='Notify before due date'>
                <span className='flex items-center gap-2'>
                  <Input
                    type='number'
                    min={0}
                    value={notifyBeforeDays}
                    onChange={(e) => setNotifyBeforeDays(e.target.value)}
                    className='h-8 w-[90px]'
                  />
                  <span className='text-neutral-1000 text-xs'>day(s)</span>
                </span>
              </Field>
              <div className='text-sm'>
                <p className='mb-1'>People to be notified</p>
                <CheckboxGroup
                  options={KT_EMPLOYEES}
                  value={peopleToNotify}
                  onChange={setPeopleToNotify}
                />
              </div>
              <Field label='Notification frequency'>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as KtNotificationFrequency)}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[170px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KT_NOTIFICATION_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {/* Kensium key features 2 & 3 — pending tasks + leave details. */}
          <div className='grid gap-3 sm:grid-cols-2'>
            <KtPersonContext
              label='KT provider'
              person={provider}
              tasks={store.tasks}
            />
            <KtPersonContext
              label='KT receiver'
              person={receiver}
              tasks={store.tasks}
            />
          </div>

          <label className='flex flex-col gap-1 text-sm'>
            <span>Comments</span>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder='Additional comments (if any)'
              className='min-h-[56px]'
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
