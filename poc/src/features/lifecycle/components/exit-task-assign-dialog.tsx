import { useEffect, useMemo, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  EXIT_EMPLOYEE_DIRECTORY,
  EXIT_REPORTING_MANAGER,
  EXIT_ROLE_DIRECTORY,
  type ExitTaskAssignMode,
  type ExitTaskTiming,
} from '../data/exits'
import { type AssignTaskInput } from '../hooks/use-exits'

const MODES: { value: ExitTaskAssignMode; label: string }[] = [
  { value: 'role', label: 'Role' },
  { value: 'reporting-manager', label: 'Reporting Manager' },
  { value: 'position-level', label: 'Position level' },
]

interface ExitTaskAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (input: AssignTaskInput) => void
}

/**
 * Assign an exit task via Role (role → employee), Reporting Manager, or
 * Position level (department → position → employee cascade), with
 * before-LWD / after-approval timing.
 */
export function ExitTaskAssignDialog({
  open,
  onOpenChange,
  onAssign,
}: ExitTaskAssignDialogProps) {
  const [mode, setMode] = useState<ExitTaskAssignMode>('role')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [assignee, setAssignee] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [timing, setTiming] = useState<ExitTaskTiming>('before-lwd')
  const [days, setDays] = useState('0')

  useEffect(() => {
    if (!open) return
    setMode('role')
    setRole('')
    setDepartment('')
    setPosition('')
    setAssignee('')
    setName('')
    setDescription('')
    setTiming('before-lwd')
    setDays('0')
  }, [open])

  const departments = useMemo(
    () => [...new Set(EXIT_EMPLOYEE_DIRECTORY.map((e) => e.department))],
    []
  )
  const positions = useMemo(
    () => [
      ...new Set(
        EXIT_EMPLOYEE_DIRECTORY.filter((e) => e.department === department).map(
          (e) => e.positionLevel
        )
      ),
    ],
    [department]
  )
  const positionEmployees = useMemo(
    () =>
      EXIT_EMPLOYEE_DIRECTORY.filter(
        (e) => e.department === department && e.positionLevel === position
      ).map((e) => e.name),
    [department, position]
  )

  const resolvedAssignee =
    mode === 'reporting-manager' ? EXIT_REPORTING_MANAGER : assignee

  const selectRow = (
    label: string,
    value: string,
    options: string[],
    onChange: (v: string) => void,
    placeholder: string
  ) => (
    <div className='space-y-1'>
      <Label className='text-xs'>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger variant='secondary' className='w-full'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Assign exit task</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          {selectRow(
            'Assign via',
            mode,
            MODES.map((m) => m.value),
            (v) => {
              setMode(v as ExitTaskAssignMode)
              setRole('')
              setDepartment('')
              setPosition('')
              setAssignee('')
            },
            'Assignment mode'
          )}

          {mode === 'role' && (
            <>
              {selectRow('Role', role, Object.keys(EXIT_ROLE_DIRECTORY), (v) => {
                setRole(v)
                setAssignee('')
              }, 'Select role')}
              {role &&
                selectRow(
                  'Employee',
                  assignee,
                  EXIT_ROLE_DIRECTORY[role] ?? [],
                  setAssignee,
                  'Select employee'
                )}
            </>
          )}

          {mode === 'reporting-manager' && (
            <p className='text-neutral-1000 rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-xs'>
              Task will be assigned to the employee’s reporting manager:{' '}
              <span className='text-neutral-1600 font-medium'>
                {EXIT_REPORTING_MANAGER}
              </span>
            </p>
          )}

          {mode === 'position-level' && (
            <>
              {selectRow('Department', department, departments, (v) => {
                setDepartment(v)
                setPosition('')
                setAssignee('')
              }, 'Select department')}
              {department &&
                selectRow('Position', position, positions, (v) => {
                  setPosition(v)
                  setAssignee('')
                }, 'Select position')}
              {position &&
                selectRow(
                  'Employee',
                  assignee,
                  positionEmployees,
                  setAssignee,
                  'Select employee'
                )}
            </>
          )}

          <div className='space-y-1'>
            <Label className='text-xs'>Task name</Label>
            <Input
              placeholder='e.g. Collect access card'
              value={name}
              onChange={(ev) => setName(ev.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Description</Label>
            <Textarea
              placeholder='What must the assignee do?'
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>Timing</Label>
              <Select value={timing} onValueChange={(v) => setTiming(v as ExitTaskTiming)}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='before-lwd'>Before LWD</SelectItem>
                  <SelectItem value='after-exit-approval'>After exit approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Days after approval</Label>
              <Input
                type='number'
                min={0}
                disabled={timing !== 'after-exit-approval'}
                value={days}
                onChange={(ev) => setDays(ev.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) {
                toast.error('Task name is required')
                return
              }
              if (!resolvedAssignee) {
                toast.error('Pick an assignee via the selected cascade')
                return
              }
              onAssign({
                name: name.trim(),
                description: description.trim(),
                assignee: resolvedAssignee,
                mode,
                timing,
                daysAfterApproval:
                  timing === 'after-exit-approval' ? Number(days) || 0 : null,
              })
              onOpenChange(false)
            }}
          >
            Assign task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
