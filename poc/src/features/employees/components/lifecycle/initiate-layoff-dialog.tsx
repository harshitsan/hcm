import { useMemo, useState } from 'react'
import { Plus, Trash, Warning } from 'phosphor-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Textarea } from '@/components/ui/textarea'
import {
  LAYOFF_EMPLOYEE_DIRECTORY,
  type LayoffEmployee,
  type LayoffPickerEmployee,
} from '../../data/lifecycle'
import { type LayoffDraft } from '../../hooks/use-lifecycle'

/** Configured minimum headcount before a layoff can be initiated. */
const MIN_LAYOFF_EMPLOYEES = 5

interface InitiateLayoffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: LayoffDraft) => void
}

/**
 * EMP-50 — Initiate Layoff: name, reasons (no questionnaire for layoffs),
 * one suggested LWD for all affected, days-of-salary (plain number only),
 * cascading Location → Department → Position → multi-select employee picker
 * (employees can be added across multiple departments/positions), document
 * file-name entries and comments. Blocks submit below the configured minimum.
 */
export function InitiateLayoffDialog({
  open,
  onOpenChange,
  onSubmit,
}: InitiateLayoffDialogProps) {
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [lwd, setLwd] = useState('')
  const [salaryDays, setSalaryDays] = useState('')
  const [comments, setComments] = useState('')

  // Cascading picker state
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [selected, setSelected] = useState<LayoffPickerEmployee[]>([])

  // Documents
  const [docName, setDocName] = useState('')
  const [documents, setDocuments] = useState<string[]>([])

  const [showMinAlert, setShowMinAlert] = useState(false)

  const locations = useMemo(
    () => [...new Set(LAYOFF_EMPLOYEE_DIRECTORY.map((e) => e.location))],
    []
  )
  const departments = useMemo(
    () =>
      [
        ...new Set(
          LAYOFF_EMPLOYEE_DIRECTORY.filter(
            (e) => e.location === location
          ).map((e) => e.department)
        ),
      ],
    [location]
  )
  const positions = useMemo(
    () =>
      [
        ...new Set(
          LAYOFF_EMPLOYEE_DIRECTORY.filter(
            (e) => e.location === location && e.department === department
          ).map((e) => e.position)
        ),
      ],
    [location, department]
  )
  const pickable = useMemo(
    () =>
      LAYOFF_EMPLOYEE_DIRECTORY.filter(
        (e) =>
          e.location === location &&
          e.department === department &&
          e.position === position &&
          !selected.some((s) => s.id === e.id)
      ),
    [location, department, position, selected]
  )

  const toggleChecked = (id: string) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  /** Move the checked directory rows into the cross-department layoff list. */
  const addChecked = () => {
    const adding = pickable.filter((e) => checked.includes(e.id))
    if (adding.length === 0) return
    setSelected((prev) => [...prev, ...adding])
    setChecked([])
  }

  const removeSelected = (id: string) => {
    setSelected((prev) => prev.filter((e) => e.id !== id))
  }

  const addDocument = () => {
    const entry = docName.trim()
    if (!entry || documents.includes(entry)) return
    setDocuments((prev) => [...prev, entry])
    setDocName('')
  }

  const reset = () => {
    setName('')
    setReason('')
    setLwd('')
    setSalaryDays('')
    setComments('')
    setLocation('')
    setDepartment('')
    setPosition('')
    setChecked([])
    setSelected([])
    setDocName('')
    setDocuments([])
    setShowMinAlert(false)
  }

  const requiredFilled =
    name.trim() !== '' &&
    reason.trim() !== '' &&
    lwd !== '' &&
    salaryDays !== '' &&
    Number(salaryDays) >= 0

  const submit = () => {
    if (!requiredFilled) return
    if (selected.length < MIN_LAYOFF_EMPLOYEES) {
      setShowMinAlert(true)
      return
    }
    const employees: LayoffEmployee[] = selected.map((e) => ({
      id: e.id,
      name: e.name,
      department: e.department,
      position: e.position,
      location: e.location,
      lwd,
      status: 'Pending approval',
      exitTasks: [],
    }))
    onSubmit({
      name: name.trim(),
      reason: reason.trim(),
      lwd,
      salaryDays: Number(salaryDays),
      employees,
      employeesCount: employees.length,
      documents,
      comments: comments.trim(),
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[680px]'>
        <DialogHeader>
          <DialogTitle>Initiate layoff</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1 sm:col-span-2'>
              <Label>Layoff name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Depot consolidation — Phase 2'
              />
            </div>
            <div className='space-y-1 sm:col-span-2'>
              <Label>Reasons for Layoff</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Describe the business reasons for this layoff…'
                rows={3}
              />
              <p className='text-neutral-1000 text-xs'>
                Free-text reasons only — there is no questionnaire for
                layoffs.
              </p>
            </div>
            <div className='space-y-1'>
              <Label>Suggested last working day (all affected)</Label>
              <Input
                type='date'
                value={lwd}
                onChange={(e) => setLwd(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label>How many days salary need to be provided</Label>
              <Input
                type='number'
                min={0}
                value={salaryDays}
                onChange={(e) => setSalaryDays(e.target.value)}
                placeholder='e.g. 60'
              />
              <p className='text-neutral-1000 text-xs'>
                Number of days only — no amounts are computed.
              </p>
            </div>
          </div>

          {/* Employee picker */}
          <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white p-3'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              Affected employees ({selected.length} added)
            </p>
            <div className='grid gap-2 sm:grid-cols-3'>
              <div className='space-y-1'>
                <Label>Location</Label>
                <Select
                  value={location}
                  onValueChange={(v) => {
                    setLocation(v)
                    setDepartment('')
                    setPosition('')
                    setChecked([])
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select location' />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Department</Label>
                <Select
                  value={department}
                  onValueChange={(v) => {
                    setDepartment(v)
                    setPosition('')
                    setChecked([])
                  }}
                  disabled={!location}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select department' />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
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
                    setChecked([])
                  }}
                  disabled={!department}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select position' />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {position && (
              <div className='space-y-2'>
                <div className='max-h-36 space-y-1 overflow-y-auto rounded-md border border-gray-100 p-2'>
                  {pickable.length === 0 && (
                    <p className='text-neutral-1000 text-xs'>
                      No more employees to add for this selection.
                    </p>
                  )}
                  {pickable.map((e) => (
                    <label
                      key={e.id}
                      className='flex cursor-pointer items-center gap-2 text-sm'
                    >
                      <Checkbox
                        variant='blue'
                        checked={checked.includes(e.id)}
                        onCheckedChange={() => toggleChecked(e.id)}
                      />
                      <span className='font-medium'>{e.name}</span>
                      <span className='text-neutral-1000 text-xs'>
                        {e.position} · {e.department}
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addChecked}
                  disabled={checked.length === 0}
                >
                  <Plus size={12} weight='bold' />
                  Add {checked.length > 0 ? `${checked.length} ` : ''}selected
                  to layoff list
                </Button>
              </div>
            )}

            {selected.length > 0 && (
              <ul className='divide-y divide-gray-100 rounded-md border border-gray-100'>
                {selected.map((e) => (
                  <li
                    key={e.id}
                    className='flex items-center justify-between gap-2 px-2 py-1.5 text-sm'
                  >
                    <span>
                      <span className='font-medium'>{e.name}</span>{' '}
                      <span className='text-neutral-1000 text-xs'>
                        {e.position} · {e.department} · {e.location}
                      </span>
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeSelected(e.id)}
                      aria-label={`Remove ${e.name}`}
                    >
                      <Trash size={12} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className='text-neutral-1000 text-xs'>
              You can switch location / department / position and keep adding —
              one layoff can span multiple departments and positions.
            </p>
          </div>

          {/* Documents */}
          <div className='space-y-2'>
            <Label>Documents</Label>
            <div className='flex gap-2'>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder='e.g. consolidation-plan.pdf'
              />
              <Button
                type='button'
                variant='outline'
                onClick={addDocument}
                disabled={!docName.trim()}
              >
                Add
              </Button>
            </div>
            {documents.length > 0 && (
              <ul className='space-y-1'>
                {documents.map((d) => (
                  <li
                    key={d}
                    className='text-neutral-1600 flex items-center justify-between rounded-md border border-gray-100 px-2 py-1 text-xs'
                  >
                    {d}
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        setDocuments((prev) => prev.filter((x) => x !== d))
                      }
                      aria-label={`Remove ${d}`}
                    >
                      <Trash size={12} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='space-y-1'>
            <Label>Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder='Optional comments for the approver…'
              rows={2}
            />
          </div>

          {showMinAlert && selected.length < MIN_LAYOFF_EMPLOYEES && (
            <Alert variant='destructive'>
              <Warning size={16} />
              <AlertTitle>Minimum headcount not met</AlertTitle>
              <AlertDescription>
                A layoff requires at least {MIN_LAYOFF_EMPLOYEES} affected
                employees (configured minimum). You have added{' '}
                {selected.length}. Add{' '}
                {MIN_LAYOFF_EMPLOYEES - selected.length} more employee(s) to
                initiate.
              </AlertDescription>
            </Alert>
          )}

          <p className='text-neutral-1000 rounded-md bg-neutral-200 px-2 py-1.5 text-xs'>
            On initiation the reporting managers of the affected employees are
            notified (their approval is not required). The affected employees
            are NOT notified. A layoff cannot be edited after initiation.
          </p>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!requiredFilled}>
            Initiate — Pending approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
