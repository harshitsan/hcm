import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AssignmentHistoryEntry, Employee } from '../data/employees'
import type { EmployeeClass } from '../data/org-config'
import type { Department, Position } from '../data/positions'

// eslint-disable-next-line react-refresh/only-export-components
export function positionLabel(
  position: Position,
  departments: Department[]
): string {
  const dept = departments.find((d) => d.id === position.departmentId)?.name ?? '—'
  return `${position.name} · ${dept}${position.level != null ? ` · L${position.level}` : ''}`
}

interface AssignPositionDialogProps {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
  /** Only the company's own positions are offered (POS-03/06). */
  positions: Position[]
  departments: Department[]
  onAssign: (positionId: string, label: string) => void
}

/**
 * Assign exactly one position; any prior assignment is replaced and
 * historized (POS-03/08/11/17). Inactive positions are not selectable.
 */
export function AssignPositionDialog({
  employee,
  onOpenChange,
  positions,
  departments,
  onAssign,
}: AssignPositionDialogProps) {
  const [positionId, setPositionId] = useState('')
  useEffect(() => setPositionId(employee?.positionId ?? ''), [employee])

  const selectable = positions.filter((p) => p.status === 'active')
  const selected = positions.find((p) => p.id === positionId)

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Assign position — {employee?.name}</DialogTitle>
          <DialogDescription>
            Each employee holds exactly one position at a time. Assigning a new
            one replaces the previous assignment and keeps it as effective-dated
            history. Deactivated positions are not selectable.
          </DialogDescription>
        </DialogHeader>
        <Select value={positionId} onValueChange={setPositionId}>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select a position' />
          </SelectTrigger>
          <SelectContent>
            {selectable.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {positionLabel(p, departments)} ({p.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected || selected.id === employee?.positionId}
            onClick={() => {
              if (selected) {
                onAssign(selected.id, positionLabel(selected, departments))
                onOpenChange(false)
              }
            }}
          >
            Assign position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AssignClassDialogProps {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
  /** Only the company's active classes are selectable (POS-32). */
  classes: EmployeeClass[]
  onAssign: (classId: string) => void
}

/** Classification drives payroll cadence and wage basis (POS-31/32/38/39). */
export function AssignClassDialog({
  employee,
  onOpenChange,
  classes,
  onAssign,
}: AssignClassDialogProps) {
  const [classId, setClassId] = useState('')
  useEffect(() => setClassId(employee?.classId ?? ''), [employee])

  const selectable = classes.filter((c) => c.status === 'active')
  const selected = classes.find((c) => c.id === classId)

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Assign classification — {employee?.name}</DialogTitle>
          <DialogDescription>
            The class determines the pay run cadence and wage basis. Only your
            company's active classes are selectable; non-user employees are
            classified the same way as portal users.
          </DialogDescription>
        </DialogHeader>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select an employee class' />
          </SelectTrigger>
          <SelectContent>
            {selectable.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.payrollFrequency} · {c.wageType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <p className='text-paragraph-sm text-neutral-1000'>
            Members of {selected.name} are included in the{' '}
            <b>{selected.payrollFrequency}</b> pay run and treated as{' '}
            <b>
              {selected.wageType === 'Hourly'
                ? 'Hourly (overtime-eligible)'
                : 'Salaried (exempt)'}
            </b>
            .
          </p>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected || selected.id === employee?.classId}
            onClick={() => {
              if (selected) {
                onAssign(selected.id)
                onOpenChange(false)
              }
            }}
          >
            Assign class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EmployeeHistoryDialogProps {
  employee: Employee | null
  onOpenChange: (open: boolean) => void
  assignmentHistory: AssignmentHistoryEntry[]
}

/** Effective-dated position history for one employee (POS-12/15). */
export function EmployeeHistoryDialog({
  employee,
  onOpenChange,
  assignmentHistory,
}: EmployeeHistoryDialogProps) {
  const rows = employee
    ? assignmentHistory.filter((h) => h.employeeId === employee.id)
    : []
  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Position history — {employee?.name}</DialogTitle>
          <DialogDescription>
            Current and past positions with their effective periods. Prior
            states are retained, never overwritten.
          </DialogDescription>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No position assignments recorded yet.
          </p>
        ) : (
          <div className='divide-grey-200 border-grey-200 max-h-[320px] divide-y overflow-y-auto rounded-[6px] border'>
            {rows.map((h) => (
              <div key={h.id} className='flex flex-col gap-1 px-3 py-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {h.positionLabel}
                </span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  Effective {h.effectiveFrom} → {h.effectiveTo ?? 'present'} ·
                  recorded at {h.recordedAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
