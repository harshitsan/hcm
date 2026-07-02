import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/helpers'
import {
  EMPLOYEE_CLASSES,
  JURISDICTIONS,
  POSITIONS,
  type Employee,
} from '../data/employees'

type MassFunction = 'position' | 'employeeClass' | 'jurisdiction'

const FUNCTION_OPTIONS: Record<MassFunction, { label: string; values: readonly string[] }> = {
  position: { label: 'Position', values: POSITIONS },
  employeeClass: { label: 'Employee class', values: EMPLOYEE_CLASSES },
  jurisdiction: { label: 'Jurisdiction', values: JURISDICTIONS },
}

interface MassUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onApply: (ids: string[], field: MassFunction, value: string) => void
}

/**
 * EMP-43 — bulk-apply one attribute across many records: pick the function,
 * move employees between Available and Applicable, then submit.
 */
export function MassUpdateDialog({
  open,
  onOpenChange,
  employees,
  onApply,
}: MassUpdateDialogProps) {
  const [fn, setFn] = useState<MassFunction>('position')
  const [value, setValue] = useState('')
  const [applicable, setApplicable] = useState<string[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const available = useMemo(
    () => employees.filter((e) => !applicable.includes(e.id)),
    [employees, applicable]
  )
  const applicableEmployees = useMemo(
    () => employees.filter((e) => applicable.includes(e.id)),
    [employees, applicable]
  )

  const moveRight = () => {
    if (highlighted && !applicable.includes(highlighted)) {
      setApplicable((prev) => [...prev, highlighted])
      setHighlighted(null)
    }
  }
  const moveLeft = () => {
    if (highlighted && applicable.includes(highlighted)) {
      setApplicable((prev) => prev.filter((id) => id !== highlighted))
      setHighlighted(null)
    }
  }

  const reset = () => {
    setApplicable([])
    setHighlighted(null)
    setValue('')
  }

  const submit = () => {
    if (!value || applicable.length === 0) return
    onApply(applicable, fn, value)
    reset()
    onOpenChange(false)
  }

  const listItem = (e: Employee) => (
    <button
      key={e.id}
      type='button'
      onClick={() => setHighlighted(e.id === highlighted ? null : e.id)}
      className={cn(
        'w-full rounded px-2 py-1 text-left text-sm',
        highlighted === e.id
          ? 'bg-blue-150 text-blue-1400 font-medium'
          : 'hover:bg-neutral-100'
      )}
    >
      {e.name} <span className='text-neutral-1000'>({e.code})</span>
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Mass update of employee data</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Function (attribute to update)</Label>
              <Select
                value={fn}
                onValueChange={(v) => {
                  setFn(v as MassFunction)
                  setValue('')
                }}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FUNCTION_OPTIONS) as MassFunction[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {FUNCTION_OPTIONS[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>New value</Label>
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select value' />
                </SelectTrigger>
                <SelectContent>
                  {FUNCTION_OPTIONS[fn].values.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
            <div className='rounded-md border border-gray-200'>
              <p className='text-paragraph-sm text-neutral-1000 border-b border-gray-100 px-2 py-1.5 font-medium'>
                Available ({available.length})
              </p>
              <div className='max-h-52 space-y-0.5 overflow-y-auto p-1'>
                {available.map(listItem)}
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={moveRight}
                disabled={!highlighted || applicable.includes(highlighted)}
                aria-label='Move to applicable'
              >
                <ArrowRight size={14} />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={moveLeft}
                disabled={!highlighted || !applicable.includes(highlighted)}
                aria-label='Move to available'
              >
                <ArrowLeft size={14} />
              </Button>
            </div>
            <div className='rounded-md border border-gray-200'>
              <p className='text-paragraph-sm text-neutral-1000 border-b border-gray-100 px-2 py-1.5 font-medium'>
                Applicable ({applicableEmployees.length})
              </p>
              <div className='max-h-52 space-y-0.5 overflow-y-auto p-1'>
                {applicableEmployees.map(listItem)}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            Back
          </Button>
          <Button onClick={submit} disabled={!value || applicable.length === 0}>
            Apply to {applicable.length} employee(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
