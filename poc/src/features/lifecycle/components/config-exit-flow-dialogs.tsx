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
import { QUESTION_TYPES } from '../data/config'
import { DEPARTMENTS, LOCATIONS } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup } from './config-widgets'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: LifecycleConfigStore
}

/** Add a scoped exit approver group (exit type + locations + approvers). */
export function AddExitApproverGroupDialog({ open, onOpenChange, config }: DialogProps) {
  const [name, setName] = useState('')
  const [exitType, setExitType] = useState('')
  const [locs, setLocs] = useState<string[]>([])
  const [approvers, setApprovers] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setExitType('')
      setLocs([])
      setApprovers('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exit approver group</DialogTitle>
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
            <Label>Locations</Label>
            <CheckboxGroup options={LOCATIONS} value={locs} onChange={setLocs} />
          </div>
          <div className='space-y-1'>
            <Label>Ordered approvers (comma separated)</Label>
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
          <Button
            onClick={() => {
              const list = approvers.split(',').map((a) => a.trim()).filter(Boolean)
              if (!name.trim() || !exitType || locs.length === 0 || list.length === 0) {
                toast.error('Name, exit type, locations and approvers are required')
                return
              }
              config.exitApproverGroups.add(
                {
                  name: name.trim(),
                  exitType,
                  locations: locs,
                  departments: [...DEPARTMENTS],
                  approvers: list,
                },
                'xg'
              )
              config.logConfigChange('Exit approver group added', name.trim())
              toast.success('Approver group added')
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

/** Add a typed exit questionnaire question scoped to exit types. */
export function AddExitQuestionDialog({ open, onOpenChange, config }: DialogProps) {
  const [text, setText] = useState('')
  const [type, setType] = useState<(typeof QUESTION_TYPES)[number]>('Text')
  const [responder, setResponder] = useState<'Employee' | 'Manager'>('Employee')
  const [exitTypes, setExitTypes] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setText('')
      setExitTypes([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exit question</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Question</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Responder</Label>
              <Select
                value={responder}
                onValueChange={(v) => setResponder(v as 'Employee' | 'Manager')}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Employee'>Employee</SelectItem>
                  <SelectItem value='Manager'>Manager</SelectItem>
                </SelectContent>
              </Select>
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
          <Button
            onClick={() => {
              if (!text.trim() || exitTypes.length === 0) {
                toast.error('Question text and at least one exit type are required')
                return
              }
              config.exitQuestions.add(
                { text: text.trim(), type, exitTypes, responder, mandatory: true },
                'xq'
              )
              config.logConfigChange('Exit question added', text.trim())
              toast.success('Question added')
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

/** Preview the exit questionnaire as the responder will experience it. */
export function ExitQuestionnairePreviewDialog({ open, onOpenChange, config }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Exit questionnaire preview (as responder sees it)</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          {config.exitQuestions.items.map((q, i) => (
            <div key={q.id} className='rounded-[6px] border border-gray-200 px-3 py-2'>
              <p className='text-sm font-medium'>
                {i + 1}. {q.text}
                {q.mandatory && <span className='text-destructive'> *</span>}
              </p>
              <p className='text-neutral-1000 text-xs'>
                {q.type} · answered by {q.responder} · exit types:{' '}
                {q.exitTypes.join(', ')}
              </p>
              <Input className='mt-2' placeholder='Answer field (preview)' disabled />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Add an exit task with responsible owner and LWD-relative timing. */
export function AddExitTaskDialog({ open, onOpenChange, config }: DialogProps) {
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('Reporting Manager')
  const [when, setWhen] = useState<'Before LWD' | 'After LWD'>('Before LWD')
  const [days, setDays] = useState('0')
  const [exitTypes, setExitTypes] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setName('')
      setExitTypes([])
      setDays('0')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exit task</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Task name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label>Responsible (position level or reporting manager)</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Reporting Manager', 'HR', 'IT Support', 'Finance', 'Admin'].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button
            onClick={() => {
              if (!name.trim() || exitTypes.length === 0) {
                toast.error('Task name and at least one exit type are required')
                return
              }
              config.exitTaskDefs.add(
                {
                  name: name.trim(),
                  exitTypes,
                  responsible: owner,
                  timing: `${when} - ${Number(days) || 0} Day(s)`,
                },
                'xtk'
              )
              config.logConfigChange('Exit task added', name.trim())
              toast.success('Exit task added — future exits include it')
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
