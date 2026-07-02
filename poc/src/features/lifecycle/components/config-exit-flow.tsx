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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QUESTION_TYPES } from '../data/config'
import { LOCATIONS } from '../data/shared'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { CheckboxGroup, ChipList, SectionCard } from './config-widgets'

/** Exit approver groups, clearance chains, questionnaire and exit tasks. */
export function ConfigExitFlow({ config }: { config: LifecycleConfigStore }) {
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupExitType, setGroupExitType] = useState('')
  const [groupLocs, setGroupLocs] = useState<string[]>([])
  const [groupApprovers, setGroupApprovers] = useState('')

  const [chainEdit, setChainEdit] = useState<string | null>(null)
  const [chainValue, setChainValue] = useState('')

  const [questionOpen, setQuestionOpen] = useState(false)
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<(typeof QUESTION_TYPES)[number]>('Text')
  const [qResponder, setQResponder] = useState<'Employee' | 'Manager'>('Employee')
  const [qExitTypes, setQExitTypes] = useState<string[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskOwner, setTaskOwner] = useState('Reporting Manager')
  const [taskWhen, setTaskWhen] = useState<'Before LWD' | 'After LWD'>('Before LWD')
  const [taskDays, setTaskDays] = useState('0')
  const [taskExitTypes, setTaskExitTypes] = useState<string[]>([])

  const exitTypeNames = config.exitTypes.items.map((t) => t.name)

  return (
    <div>
      <SectionCard
        title='Exit approver groups'
        description='An exit routes to the group whose exit type, location and department scope match the employee. Edits apply to new exits; in-flight exits keep their original routing.'
        actions={
          <Button size='sm' onClick={() => setGroupOpen(true)}>
            Add group
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Exit type</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Approvers (ordered)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitApproverGroups.items.map((g) => (
              <TableRow key={g.id}>
                <TableCell className='font-medium'>{g.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{g.exitType}</Badge>
                </TableCell>
                <TableCell><ChipList items={g.locations} /></TableCell>
                <TableCell><ChipList items={g.departments} /></TableCell>
                <TableCell>{g.approvers.join(' → ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Exit clearance functions & approver hierarchy'
        description='Clearance tasks are generated per configured function; each sign-off routes through the configured chain.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Sign-off hierarchy</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.clearanceChains.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.functionName}</TableCell>
                <TableCell>{c.hierarchy.join(' → ')}</TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setChainEdit(c.id)
                      setChainValue(c.hierarchy.join(', '))
                    }}
                  >
                    Edit hierarchy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Exit questionnaire'
        description={
          config.settings.exitQuestionnaireEnabled
            ? 'Questions apply per exit type and responder; mandatory questions block submission until answered.'
            : 'Questionnaire process is disabled in Exit Management setup.'
        }
        actions={
          <>
            <Button size='sm' variant='outline' onClick={() => setPreviewOpen(true)}>
              Preview exit questionnaire
            </Button>
            <Button size='sm' onClick={() => setQuestionOpen(true)}>
              Add question
            </Button>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Exit types</TableHead>
              <TableHead>Responder</TableHead>
              <TableHead>Mandatory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitQuestions.items.map((q) => (
              <TableRow key={q.id}>
                <TableCell className='max-w-[280px]'>{q.text}</TableCell>
                <TableCell>{q.type}</TableCell>
                <TableCell><ChipList items={q.exitTypes} /></TableCell>
                <TableCell>{q.responder}</TableCell>
                <TableCell>
                  <Badge variant={q.mandatory ? 'badge_active' : 'badge_inactive'}>
                    {q.mandatory ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Exit tasks (offboarding checklist)'
        description='Each task has a responsible owner and a time frame relative to the last working day.'
        actions={
          <Button size='sm' onClick={() => setTaskOpen(true)}>
            Add task
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Exit types</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Time frame</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.exitTaskDefs.items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell><ChipList items={t.exitTypes} /></TableCell>
                <TableCell>{t.responsible}</TableCell>
                <TableCell>{t.timing}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {/* Add approver group */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exit approver group</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Group name</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Exit type</Label>
              <Select value={groupExitType} onValueChange={setGroupExitType}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select exit type' />
                </SelectTrigger>
                <SelectContent>
                  {exitTypeNames.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Locations</Label>
              <CheckboxGroup options={LOCATIONS} value={groupLocs} onChange={setGroupLocs} />
            </div>
            <div className='space-y-1'>
              <Label>Ordered approvers (comma separated)</Label>
              <Input
                value={groupApprovers}
                onChange={(e) => setGroupApprovers(e.target.value)}
                placeholder='Vikram Shah, Anita Desai'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const approvers = groupApprovers.split(',').map((a) => a.trim()).filter(Boolean)
                if (!groupName.trim() || !groupExitType || groupLocs.length === 0 || approvers.length === 0) {
                  toast.error('Name, exit type, locations and approvers are required')
                  return
                }
                config.exitApproverGroups.add(
                  {
                    name: groupName.trim(),
                    exitType: groupExitType,
                    locations: groupLocs,
                    departments: ['Engineering', 'Finance', 'Human Resources', 'Sales', 'Operations', 'IT Support'],
                    approvers,
                  },
                  'xg'
                )
                config.logConfigChange('Exit approver group added', groupName.trim())
                toast.success('Approver group added')
                setGroupOpen(false)
                setGroupName('')
                setGroupExitType('')
                setGroupLocs([])
                setGroupApprovers('')
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit clearance chain */}
      <Dialog open={chainEdit !== null} onOpenChange={(o) => !o && setChainEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit clearance sign-off hierarchy</DialogTitle>
          </DialogHeader>
          <div className='space-y-1'>
            <Label>Hierarchy (comma separated, in order)</Label>
            <Input value={chainValue} onChange={(e) => setChainValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setChainEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const hierarchy = chainValue.split(',').map((h) => h.trim()).filter(Boolean)
                if (hierarchy.length === 0) {
                  toast.error('At least one approver is required')
                  return
                }
                if (chainEdit) {
                  config.clearanceChains.update(chainEdit, { hierarchy })
                  config.logConfigChange('Clearance approver hierarchy updated', hierarchy.join(' → '))
                  toast.success('Updated chain applies to subsequent clearances')
                }
                setChainEdit(null)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add exit question */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exit question</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Question</Label>
              <Input value={qText} onChange={(e) => setQText(e.target.value)} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Type</Label>
                <Select value={qType} onValueChange={(v) => setQType(v as typeof qType)}>
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
                  value={qResponder}
                  onValueChange={(v) => setQResponder(v as 'Employee' | 'Manager')}
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
              <CheckboxGroup options={exitTypeNames} value={qExitTypes} onChange={setQExitTypes} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setQuestionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!qText.trim() || qExitTypes.length === 0) {
                  toast.error('Question text and at least one exit type are required')
                  return
                }
                config.exitQuestions.add(
                  {
                    text: qText.trim(),
                    type: qType,
                    exitTypes: qExitTypes,
                    responder: qResponder,
                    mandatory: true,
                  },
                  'xq'
                )
                config.logConfigChange('Exit question added', qText.trim())
                toast.success('Question added')
                setQuestionOpen(false)
                setQText('')
                setQExitTypes([])
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questionnaire preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
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

      {/* Add exit task */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exit task</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Task name</Label>
              <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Responsible (position level or reporting manager)</Label>
              <Select value={taskOwner} onValueChange={setTaskOwner}>
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
                  value={taskWhen}
                  onValueChange={(v) => setTaskWhen(v as 'Before LWD' | 'After LWD')}
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
                <Input type='number' value={taskDays} onChange={(e) => setTaskDays(e.target.value)} />
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Applies to exit types</Label>
              <CheckboxGroup
                options={exitTypeNames}
                value={taskExitTypes}
                onChange={setTaskExitTypes}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!taskName.trim() || taskExitTypes.length === 0) {
                  toast.error('Task name and at least one exit type are required')
                  return
                }
                config.exitTaskDefs.add(
                  {
                    name: taskName.trim(),
                    exitTypes: taskExitTypes,
                    responsible: taskOwner,
                    timing: `${taskWhen} - ${Number(taskDays) || 0} Day(s)`,
                  },
                  'xtk'
                )
                config.logConfigChange('Exit task added', taskName.trim())
                toast.success('Exit task added — future exits include it')
                setTaskOpen(false)
                setTaskName('')
                setTaskExitTypes([])
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
