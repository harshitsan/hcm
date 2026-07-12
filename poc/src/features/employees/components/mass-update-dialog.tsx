import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ListChecks, UploadSimple } from 'phosphor-react'
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
import { cn } from '@/utils/helpers'
import {
  EMPLOYEE_CLASSES,
  JURISDICTIONS,
  MASS_FUNCTION_LABELS,
  MASS_FUNCTIONS,
  MASS_UPDATE_FIELD_CATALOG,
  POSITIONS,
  type Employee,
  type MassFunction,
} from '../data/employees'
import {
  IMPORT_STEP_TITLES,
  type MappedImportInput,
} from '../data/mass-mapping'
import { MappingImportFlow } from './mapping-import-flow'

/** Legacy single-value functions patch one record attribute directly. */
const VALUE_OPTIONS: Partial<Record<MassFunction, readonly string[]>> = {
  position: POSITIONS,
  employeeClass: EMPLOYEE_CLASSES,
  jurisdiction: JURISDICTIONS,
}

interface TransferItem {
  id: string
  label: React.ReactNode
}

/** Two-column Available/Applicable transfer grid with move buttons. */
function TransferGrid({
  items,
  applicable,
  onChange,
  availableTitle,
  applicableTitle,
}: {
  items: TransferItem[]
  applicable: string[]
  onChange: (next: string[]) => void
  availableTitle: string
  applicableTitle: string
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const available = items.filter((i) => !applicable.includes(i.id))
  const applicableItems = items.filter((i) => applicable.includes(i.id))

  const moveRight = () => {
    if (highlighted && !applicable.includes(highlighted)) {
      onChange([...applicable, highlighted])
      setHighlighted(null)
    }
  }
  const moveLeft = () => {
    if (highlighted && applicable.includes(highlighted)) {
      onChange(applicable.filter((id) => id !== highlighted))
      setHighlighted(null)
    }
  }

  const listItem = (item: TransferItem) => (
    <button
      key={item.id}
      type='button'
      onClick={() =>
        setHighlighted(item.id === highlighted ? null : item.id)
      }
      className={cn(
        'w-full rounded px-2 py-1 text-left text-sm',
        highlighted === item.id
          ? 'bg-blue-150 text-blue-1400 font-medium'
          : 'hover:bg-neutral-100'
      )}
    >
      {item.label}
    </button>
  )

  return (
    <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
      <div className='rounded-md border border-gray-200'>
        <p className='text-paragraph-sm text-neutral-1000 border-b border-gray-100 px-2 py-1.5 font-medium'>
          {availableTitle} ({available.length})
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
          {applicableTitle} ({applicableItems.length})
        </p>
        <div className='max-h-52 space-y-0.5 overflow-y-auto p-1'>
          {applicableItems.map(listItem)}
        </div>
      </div>
    </div>
  )
}

interface MassUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onApply: (
    ids: string[],
    field: MassFunction,
    value: string,
    fields?: string[]
  ) => void
  /** W10 — apply a mapped bulk-file import (see MappingImportFlow). */
  onApplyMapped: (input: MappedImportInput) => void
}

/**
 * EMP-43 / W10 — bulk-apply data across many records, two ways:
 * - Guided update: select employees, pick the function, then configure —
 *   legacy functions take a single new value while category functions use an
 *   Available/Applicable field grid.
 * - File import with data mapping: pick a mock source file, map its columns
 *   onto employee target fields, preview per-cell validation, then apply.
 */
export function MassUpdateDialog({
  open,
  onOpenChange,
  employees,
  onApply,
  onApplyMapped,
}: MassUpdateDialogProps) {
  const [mode, setMode] = useState<'choose' | 'guided' | 'import'>('choose')
  // Remount key so re-entering the import flow always starts on step 1.
  const [importKey, setImportKey] = useState(0)
  const [importStepTitle, setImportStepTitle] = useState<string>(
    IMPORT_STEP_TITLES.source
  )
  const [step, setStep] = useState<'employees' | 'configure'>('employees')
  const [fn, setFn] = useState<MassFunction>('position')
  const [value, setValue] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [applicableFields, setApplicableFields] = useState<string[]>([])

  const isValueDriven = fn in VALUE_OPTIONS
  const fieldCatalog = MASS_UPDATE_FIELD_CATALOG[fn] ?? []

  const employeeItems: TransferItem[] = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        label: (
          <>
            {e.name} <span className='text-neutral-1000'>({e.code})</span>
          </>
        ),
      })),
    [employees]
  )
  const fieldItems: TransferItem[] = fieldCatalog.map((f) => ({
    id: f,
    label: f,
  }))

  const reset = () => {
    setMode('choose')
    setImportStepTitle(IMPORT_STEP_TITLES.source)
    setImportKey((k) => k + 1)
    setStep('employees')
    setSelectedEmployees([])
    setApplicableFields([])
    setValue('')
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const canApply =
    selectedEmployees.length > 0 &&
    value.trim() !== '' &&
    (isValueDriven || applicableFields.length > 0)

  const submit = () => {
    if (!canApply) return
    onApply(
      selectedEmployees,
      fn,
      value.trim(),
      isValueDriven ? undefined : applicableFields
    )
    close()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent
        className={cn(
          mode === 'import' ? 'sm:max-w-[860px]' : 'sm:max-w-[640px]'
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'choose' &&
              'Mass update of employee data — choose how to apply'}
            {mode === 'guided' &&
              `Mass update of employee data — ${
                step === 'employees'
                  ? 'Step 1: Select employees'
                  : 'Step 2: Configure'
              }`}
            {mode === 'import' &&
              `Bulk import with data mapping — ${importStepTitle}`}
          </DialogTitle>
        </DialogHeader>

        {mode === 'choose' && (
          <>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setMode('guided')}
                className='hover:border-blue-1400 rounded-md border border-gray-200 px-4 py-4 text-left transition-colors'
              >
                <ListChecks size={20} className='text-blue-1400 mb-2' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  Guided update
                </p>
                <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                  Pick the employees, a function and the applicable fields —
                  one value applied across the selection.
                </p>
              </button>
              <button
                type='button'
                onClick={() => setMode('import')}
                className='hover:border-blue-1400 rounded-md border border-gray-200 px-4 py-4 text-left transition-colors'
              >
                <UploadSimple size={20} className='text-blue-1400 mb-2' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  File import with data mapping
                </p>
                <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                  Pick a source file, map its columns onto employee fields,
                  validate the mapped rows, then apply.
                </p>
              </button>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={close}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === 'import' && (
          <MappingImportFlow
            key={importKey}
            employees={employees}
            onApply={onApplyMapped}
            onBack={() => setMode('choose')}
            onClose={close}
            onStepChange={setImportStepTitle}
          />
        )}

        {mode === 'guided' && (step === 'employees' ? (
          <div className='space-y-3'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Move the employees the update applies to into Applicable, then
              continue to configure the update.
            </p>
            <TransferGrid
              items={employeeItems}
              applicable={selectedEmployees}
              onChange={setSelectedEmployees}
              availableTitle='Available'
              applicableTitle='Applicable'
            />
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Function (category to update)</Label>
                <Select
                  value={fn}
                  onValueChange={(v) => {
                    setFn(v as MassFunction)
                    setValue('')
                    setApplicableFields([])
                  }}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MASS_FUNCTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {MASS_FUNCTION_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isValueDriven ? (
                <div className='space-y-1'>
                  <Label>New value</Label>
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue placeholder='Select value' />
                    </SelectTrigger>
                    <SelectContent>
                      {(VALUE_OPTIONS[fn] ?? []).map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className='space-y-1'>
                  <Label>New value (applied to applicable fields)</Label>
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder='e.g. updated value'
                  />
                </div>
              )}
            </div>

            {isValueDriven ? (
              <p className='text-paragraph-sm text-neutral-1000 rounded-md border border-gray-200 px-3 py-2'>
                {MASS_FUNCTION_LABELS[fn]} is applied as a single value to all{' '}
                {selectedEmployees.length} selected employee record(s).
              </p>
            ) : (
              <div className='space-y-1.5'>
                <Label>
                  {MASS_FUNCTION_LABELS[fn]} fields — move the ones to update
                  into Applicable
                </Label>
                <TransferGrid
                  items={fieldItems}
                  applicable={applicableFields}
                  onChange={setApplicableFields}
                  availableTitle='Available fields'
                  applicableTitle='Applicable fields'
                />
              </div>
            )}
          </div>
        ))}

        {mode === 'guided' && (
          <DialogFooter>
            {step === 'employees' ? (
              <>
                <Button variant='outline' onClick={() => setMode('choose')}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep('configure')}
                  disabled={selectedEmployees.length === 0}
                >
                  Next — configure ({selectedEmployees.length} selected)
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' onClick={() => setStep('employees')}>
                  Back
                </Button>
                <Button onClick={submit} disabled={!canApply}>
                  Apply to {selectedEmployees.length} employee(s)
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
