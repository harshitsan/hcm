import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
  EMPLOYEE_DIRECTORY,
  EXIT_QUESTION_STAGES,
  EXIT_QUESTION_VISIBILITY_NOTE,
  EXIT_TASK_RESPONSIBLE_TYPES,
  EXIT_TASK_ROLES,
  type ExitApproverGroup,
  type ExitQuestionDef,
  type ExitQuestionFormat,
  type ExitQuestionRespondedBy,
  type ExitQuestionStage,
  type ExitTaskCreatedOn,
  type ExitTaskDef,
  type ExitTaskResponsibleType,
} from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup } from './config-widgets'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: LifecycleConfigStore
}

const STAGE_LABELS: Record<ExitQuestionStage, string> = {
  'pre-exit': 'Pre-exit',
  'post-exit': 'Post-exit',
}

/**
 * Add/edit a scoped exit approver group. Approver-1 is always the Reporting
 * Manager hierarchy (from level → to level); further approvers are named.
 */
export function ExitApproverGroupDialog({
  open,
  onOpenChange,
  config,
  editing,
}: DialogProps & { editing?: ExitApproverGroup | null }) {
  const [name, setName] = useState('')
  const [exitType, setExitType] = useState('')
  const [locs, setLocs] = useState<string[]>([])
  const [depts, setDepts] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [fromLevel, setFromLevel] = useState('1')
  const [toLevel, setToLevel] = useState('1')
  const [approvers, setApprovers] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setExitType(editing?.exitType ?? '')
      setLocs(editing ? [...editing.locations] : [])
      setDepts(editing ? [...editing.departments] : [...DEPARTMENTS])
      setPositions(
        editing?.positionLevels ? [...editing.positionLevels] : [...POSITION_LEVELS]
      )
      setFromLevel(String(editing?.reportingManagerFromLevel ?? 1))
      setToLevel(String(editing?.reportingManagerToLevel ?? 1))
      setApprovers(editing ? editing.approvers.join(', ') : '')
    }
  }, [open, editing])

  const save = () => {
    const list = approvers.split(',').map((a) => a.trim()).filter(Boolean)
    if (!name.trim() || !exitType || locs.length === 0 || list.length === 0) {
      toast.error('Name, exit type, locations and approvers are required')
      return
    }
    const from = Math.max(1, Number(fromLevel) || 1)
    const to = Math.max(from, Number(toLevel) || from)
    const payload = {
      name: name.trim(),
      exitType,
      locations: locs,
      departments: depts.length > 0 ? depts : [...DEPARTMENTS],
      approvers: list,
      positionLevels: positions,
      reportingManagerFromLevel: from,
      reportingManagerToLevel: to,
    }
    if (editing) {
      config.exitApproverGroups.update(editing.id, payload)
      config.logConfigChange('Exit approver group updated', payload.name)
      toast.success('Approver group saved — applies to new exits')
    } else {
      config.exitApproverGroups.add(payload, 'xg')
      config.logConfigChange('Exit approver group added', payload.name)
      toast.success('Approver group added')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit exit approver group' : 'Add exit approver group'}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Group name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label>Exit type</Label>
            <Select value={exitType} onValueChange={setExitType}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select exit type' />
              </SelectTrigger>
              <SelectContent>
                {config.exitTypes.items.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Applicable locations</Label>
            <CheckboxGroup options={LOCATIONS} value={locs} onChange={setLocs} />
          </div>
          <div className='space-y-1'>
            <Label>Applicable departments</Label>
            <CheckboxGroup options={DEPARTMENTS} value={depts} onChange={setDepts} />
          </div>
          <div className='space-y-1'>
            <Label>Applicable position levels</Label>
            <CheckboxGroup
              options={POSITION_LEVELS}
              value={positions}
              onChange={setPositions}
            />
          </div>
          <div className='space-y-1 rounded-[6px] border border-gray-200 p-3'>
            <p className='text-sm font-medium'>Approver 1 — Reporting Manager</p>
            <p className='text-neutral-1000 text-xs'>
              The first approver is always the reporting manager hierarchy;
              level 1 is the immediate reporting manager.
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>From level</Label>
                <Input
                  type='number'
                  value={fromLevel}
                  onChange={(e) => setFromLevel(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>To level</Label>
                <Input
                  type='number'
                  value={toLevel}
                  onChange={(e) => setToLevel(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className='space-y-1'>
            <Label>Additional approvers (comma separated, in order)</Label>
            <Input
              value={approvers}
              onChange={(e) => setApprovers(e.target.value)}
              placeholder='Vikram Shah, Anita Desai'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Edit a clearance function's sign-off hierarchy. */
export function EditClearanceChainDialog({
  open,
  onOpenChange,
  config,
  chainId,
}: DialogProps & { chainId: string | null }) {
  const chain = config.clearanceChains.items.find((c) => c.id === chainId)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue(chain?.hierarchy.join(', ') ?? '')
  }, [open, chain])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit clearance sign-off hierarchy ({chain?.functionName})
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-1'>
          <Label>Hierarchy (comma separated, in order)</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const hierarchy = value.split(',').map((h) => h.trim()).filter(Boolean)
              if (hierarchy.length === 0) {
                toast.error('At least one approver is required')
                return
              }
              if (chainId) {
                config.clearanceChains.update(chainId, { hierarchy })
                config.logConfigChange(
                  'Clearance approver hierarchy updated',
                  hierarchy.join(' → ')
                )
                toast.success('Updated chain applies to subsequent clearances')
              }
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Add/edit an exit questionnaire question — objective/subjective format,
 * responder, stages and location/department/position scoping.
 */
export function ExitQuestionDialog({
  open,
  onOpenChange,
  config,
  editing,
}: DialogProps & { editing?: ExitQuestionDef | null }) {
  const [text, setText] = useState('')
  const [format, setFormat] = useState<ExitQuestionFormat>('subjective')
  const [options, setOptions] = useState('')
  const [respondedBy, setRespondedBy] =
    useState<ExitQuestionRespondedBy>('Employee')
  const [mandatory, setMandatory] = useState(true)
  const [exitTypes, setExitTypes] = useState<string[]>([])
  const [stages, setStages] = useState<ExitQuestionStage[]>(['pre-exit'])
  const [locs, setLocs] = useState<string[]>([])
  const [depts, setDepts] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setText(editing?.text ?? '')
      setFormat(
        editing?.questionFormat ??
          (editing && editing.type !== 'Text' ? 'objective' : 'subjective')
      )
      setOptions(editing?.options?.join(', ') ?? '')
      setRespondedBy(
        editing?.respondedBy ??
          (editing?.responder === 'Manager' ? 'Reporting Manager' : 'Employee')
      )
      setMandatory(editing?.mandatory ?? true)
      setExitTypes(editing ? [...editing.exitTypes] : [])
      setStages(editing?.applicableStages ? [...editing.applicableStages] : ['pre-exit'])
      setLocs(editing?.locations ? [...editing.locations] : [])
      setDepts(editing?.departments ? [...editing.departments] : [])
      setPositions(editing?.positionLevels ? [...editing.positionLevels] : [])
    }
  }, [open, editing])

  const save = () => {
    if (!text.trim() || exitTypes.length === 0) {
      toast.error('Question text and at least one exit type are required')
      return
    }
    const optionList = options.split(',').map((o) => o.trim()).filter(Boolean)
    if (format === 'objective' && optionList.length < 2) {
      toast.error('Objective questions need at least two options')
      return
    }
    if (stages.length === 0) {
      toast.error('Pick at least one questionnaire stage')
      return
    }
    // Legacy display fields stay in sync for consumers of `type`/`responder`.
    const legacyType =
      format === 'subjective'
        ? ('Text' as const)
        : optionList.length === 2 &&
            optionList.every((o) => o === 'Yes' || o === 'No')
          ? ('Yes/No' as const)
          : ('Multiple Choice' as const)
    const payload = {
      text: text.trim(),
      type: legacyType,
      exitTypes,
      responder:
        respondedBy === 'Employee' ? ('Employee' as const) : ('Manager' as const),
      mandatory,
      questionFormat: format,
      options: format === 'objective' ? optionList : [],
      respondedBy,
      applicableStages: stages,
      locations: locs,
      departments: depts,
      positionLevels: positions,
    }
    if (editing) {
      config.exitQuestions.update(editing.id, payload)
      config.logConfigChange('Exit question updated', payload.text)
      toast.success('Question updated — future questionnaires use it')
    } else {
      config.exitQuestions.add(payload, 'xq')
      config.logConfigChange('Exit question added', payload.text)
      toast.success('Question added')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit exit question' : 'Add exit question'}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Question</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Question type</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ExitQuestionFormat)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='objective'>Objective (options)</SelectItem>
                  <SelectItem value='subjective'>Subjective (free text)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Responded by</Label>
              <Select
                value={respondedBy}
                onValueChange={(v) => setRespondedBy(v as ExitQuestionRespondedBy)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Employee'>Employee</SelectItem>
                  <SelectItem value='HR'>HR</SelectItem>
                  <SelectItem value='Reporting Manager'>Reporting Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {format === 'objective' && (
            <div className='space-y-1'>
              <Label>Options (comma separated)</Label>
              <Input
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder='Yes, No'
              />
            </div>
          )}
          <div className='flex items-center justify-between'>
            <Label>Mandatory</Label>
            <Switch checked={mandatory} onCheckedChange={setMandatory} />
          </div>
          <div className='space-y-1'>
            <Label>Applies to exit types</Label>
            <CheckboxGroup
              options={config.exitTypes.items.map((t) => t.name)}
              value={exitTypes}
              onChange={setExitTypes}
            />
          </div>
          <div className='space-y-1'>
            <Label>Applicable stages</Label>
            <CheckboxGroup
              options={EXIT_QUESTION_STAGES.map((s) => STAGE_LABELS[s])}
              value={stages.map((s) => STAGE_LABELS[s])}
              onChange={(labels) =>
                setStages(
                  EXIT_QUESTION_STAGES.filter((s) =>
                    labels.includes(STAGE_LABELS[s])
                  )
                )
              }
            />
          </div>
          <div className='space-y-1'>
            <Label>Applicable locations (none = all)</Label>
            <CheckboxGroup options={LOCATIONS} value={locs} onChange={setLocs} />
          </div>
          <div className='space-y-1'>
            <Label>Applicable departments (none = all)</Label>
            <CheckboxGroup options={DEPARTMENTS} value={depts} onChange={setDepts} />
          </div>
          <div className='space-y-1'>
            <Label>Applicable position levels (none = all)</Label>
            <CheckboxGroup
              options={POSITION_LEVELS}
              value={positions}
              onChange={setPositions}
            />
          </div>
          <p className='text-neutral-1000 text-xs'>{EXIT_QUESTION_VISIBILITY_NOTE}</p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Preview the exit questionnaire as the responder will experience it. */
export function ExitQuestionnairePreviewDialog({ open, onOpenChange, config }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Exit questionnaire preview (as responder sees it)</DialogTitle>
        </DialogHeader>
        <p className='text-neutral-1000 text-xs'>{EXIT_QUESTION_VISIBILITY_NOTE}</p>
        <div className='space-y-3'>
          {config.exitQuestions.items.map((q, i) => (
            <div key={q.id} className='rounded-[6px] border border-gray-200 px-3 py-2'>
              <p className='text-sm font-medium'>
                {i + 1}. {q.text}
                {q.mandatory && <span className='text-destructive'> *</span>}
              </p>
              <p className='text-neutral-1000 text-xs'>
                {q.questionFormat === 'objective'
                  ? `Objective (${(q.options ?? []).join(' / ')})`
                  : 'Subjective'}{' '}
                · answered by {q.respondedBy ?? q.responder} · stages:{' '}
                {(q.applicableStages ?? ['pre-exit'])
                  .map((s) => STAGE_LABELS[s])
                  .join(', ')}{' '}
                · exit types: {q.exitTypes.join(', ')}
              </p>
              <Input className='mt-2' placeholder='Answer field (preview)' disabled />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Add/edit an exit task — responsible owner (role / employee / reporting
 * manager), creation trigger and LWD-relative timing.
 */
export function ExitTaskDialog({
  open,
  onOpenChange,
  config,
  editing,
}: DialogProps & { editing?: ExitTaskDef | null }) {
  const [name, setName] = useState('')
  const [responsibleType, setResponsibleType] =
    useState<ExitTaskResponsibleType>('Reporting Manager')
  const [role, setRole] = useState<string>('HR')
  const [dept, setDept] = useState('')
  const [position, setPosition] = useState('')
  const [employee, setEmployee] = useState('')
  const [createdOn, setCreatedOn] = useState<ExitTaskCreatedOn>('on-exit-approval')
  const [daysAllowed, setDaysAllowed] = useState('7')
  const [when, setWhen] = useState<'Before LWD' | 'After LWD'>('Before LWD')
  const [days, setDays] = useState('0')
  const [exitTypes, setExitTypes] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setResponsibleType(editing?.responsibleType ?? 'Reporting Manager')
      setRole(editing?.responsibleRole ?? 'HR')
      setDept(editing?.responsibleDepartment ?? '')
      setPosition(editing?.responsiblePosition ?? '')
      setEmployee(editing?.responsibleEmployee ?? '')
      setCreatedOn(editing?.taskCreatedOn ?? 'on-exit-approval')
      setDaysAllowed(String(editing?.daysAllowedAfterApproval ?? 7))
      setWhen(editing?.timing.startsWith('After') ? 'After LWD' : 'Before LWD')
      setDays(editing ? String(Number(editing.timing.match(/(\d+)/)?.[1] ?? 0)) : '0')
      setExitTypes(editing ? [...editing.exitTypes] : [])
    }
  }, [open, editing])

  const positionOptions = Array.from(
    new Set(
      EMPLOYEE_DIRECTORY.filter((e) => e.department === dept).map(
        (e) => e.positionLevel
      )
    )
  )
  const employeeOptions = EMPLOYEE_DIRECTORY.filter(
    (e) => e.department === dept && e.positionLevel === position
  ).map((e) => e.name)

  const save = () => {
    if (!name.trim() || exitTypes.length === 0) {
      toast.error('Task name and at least one exit type are required')
      return
    }
    if (responsibleType === 'Employee' && !employee) {
      toast.error('Pick a department, position and employee')
      return
    }
    const responsible =
      responsibleType === 'Reporting Manager'
        ? 'Reporting Manager'
        : responsibleType === 'Role'
          ? role
          : employee
    const payload = {
      name: name.trim(),
      exitTypes,
      responsible,
      timing: `${when} - ${Number(days) || 0} Day(s)`,
      responsibleType,
      responsibleRole: responsibleType === 'Role' ? role : undefined,
      responsibleDepartment: responsibleType === 'Employee' ? dept : undefined,
      responsiblePosition: responsibleType === 'Employee' ? position : undefined,
      responsibleEmployee: responsibleType === 'Employee' ? employee : undefined,
      taskCreatedOn: createdOn,
      daysAllowedAfterApproval: Math.max(0, Number(daysAllowed) || 0),
    }
    if (editing) {
      config.exitTaskDefs.update(editing.id, payload)
      config.logConfigChange('Exit task updated', payload.name)
      toast.success('Exit task saved — future exits use the updated checklist')
    } else {
      config.exitTaskDefs.add(payload, 'xtk')
      config.logConfigChange('Exit task added', payload.name)
      toast.success('Exit task added — future exits include it')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit exit task' : 'Add exit task'}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Task name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label>Responsible</Label>
            <Select
              value={responsibleType}
              onValueChange={(v) => {
                setResponsibleType(v as ExitTaskResponsibleType)
                setDept('')
                setPosition('')
                setEmployee('')
              }}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXIT_TASK_RESPONSIBLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {responsibleType === 'Role' && (
            <div className='space-y-1'>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TASK_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {responsibleType === 'Employee' && (
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label>Department</Label>
                <Select
                  value={dept}
                  onValueChange={(v) => {
                    setDept(v)
                    setPosition('')
                    setEmployee('')
                  }}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Pick' />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Position</Label>
                <Select
                  value={position}
                  onValueChange={(v) => {
                    setPosition(v)
                    setEmployee('')
                  }}
                  disabled={!dept}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Pick' />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Employee</Label>
                <Select value={employee} onValueChange={setEmployee} disabled={!position}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Pick' />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Task created on</Label>
              <Select
                value={createdOn}
                onValueChange={(v) => setCreatedOn(v as ExitTaskCreatedOn)}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='on-exit-approval'>On exit approval</SelectItem>
                  <SelectItem value='before-lwd'>Before LWD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Days allowed after approval</Label>
              <Input
                type='number'
                value={daysAllowed}
                onChange={(e) => setDaysAllowed(e.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Relative to LWD</Label>
              <Select
                value={when}
                onValueChange={(v) => setWhen(v as 'Before LWD' | 'After LWD')}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Before LWD'>Before LWD</SelectItem>
                  <SelectItem value='After LWD'>After LWD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Day(s)</Label>
              <Input type='number' value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
          <div className='space-y-1'>
            <Label>Applies to exit types</Label>
            <CheckboxGroup
              options={config.exitTypes.items.map((t) => t.name)}
              value={exitTypes}
              onChange={setExitTypes}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------------ */
/* Legacy add-only wrappers (kept for backward compatibility).               */
/* ------------------------------------------------------------------------ */

/** @deprecated Use ExitApproverGroupDialog. */
export function AddExitApproverGroupDialog(props: DialogProps) {
  return <ExitApproverGroupDialog {...props} editing={null} />
}

/** @deprecated Use ExitQuestionDialog. */
export function AddExitQuestionDialog(props: DialogProps) {
  return <ExitQuestionDialog {...props} editing={null} />
}

/** @deprecated Use ExitTaskDialog. */
export function AddExitTaskDialog(props: DialogProps) {
  return <ExitTaskDialog {...props} editing={null} />
}
