import { useState } from 'react'
import {
  Calculator,
  Copy,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  APPLICABLE_STATES,
  COMPONENT_MODES,
  COMPONENT_TYPES,
  PAY_PERIODS,
  computeBreakup,
  type BreakupRow,
  type ComponentMode,
  type ComponentType,
  type CompensationSlab,
  type PayPeriod,
  type SalaryComponent,
} from '../data/compensation'
import { formatInr } from '../data/offers'
import { DEPARTMENTS } from '../data/requisitions'
import type { CompensationStore } from '../hooks/use-compensation'

function newCompId() {
  return `comp-${crypto.randomUUID().slice(0, 6)}`
}

const emptySlabDraft = {
  name: '',
  ctcFrom: '',
  ctcTo: '',
  states: [] as string[],
  departments: [] as string[],
  components: [] as SalaryComponent[],
}

const emptyCompDraft = {
  name: '',
  type: 'Earning' as ComponentType,
  mode: 'percent-of-gross' as ComponentMode,
  value: '',
  payPeriod: 'Monthly' as PayPeriod,
  notes: '',
  remarks: '',
  considerForLeaveEncashment: false,
}

function modeLabel(c: Pick<SalaryComponent, 'mode' | 'value'>) {
  return c.mode === 'percent-of-gross'
    ? `${c.value}% of gross`
    : formatInr(c.value)
}

/** Multi-pick as a checkbox list — matches the simple pickers used across
 * the configuration screens. */
function MultiPick({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (option: string) => void
}) {
  return (
    <div className='grid grid-cols-2 gap-1.5 rounded-[8px] border border-gray-200 p-2'>
      {options.map((o) => (
        <label key={o} className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={selected.includes(o)}
            onCheckedChange={() => onToggle(o)}
          />
          {o}
        </label>
      ))}
    </div>
  )
}

/**
 * Compensation configuration (Kensium PDF — Configuration → Compensation):
 * CTC slabs with their salary components, copy-from-existing, and a CTC
 * calculator that validates the PDF breakup rules (earnings = Gross;
 * Gross + employer contribution + variable pay = CTC).
 */
export function ConfigCompensation({ store }: { store: CompensationStore }) {
  // Slab add/edit dialog
  const [slabOpen, setSlabOpen] = useState(false)
  const [editingSlab, setEditingSlab] = useState<CompensationSlab | null>(null)
  const [slabDraft, setSlabDraft] = useState(emptySlabDraft)
  const [copyFromId, setCopyFromId] = useState('')
  const [deleteSlab, setDeleteSlab] = useState<CompensationSlab | null>(null)

  // Component add/edit sub-dialog (indexes into slabDraft.components)
  const [compOpen, setCompOpen] = useState(false)
  const [editingCompIdx, setEditingCompIdx] = useState<number | null>(null)
  const [compSource, setCompSource] = useState<'new' | 'existing'>('new')
  const [existingCompKey, setExistingCompKey] = useState('')
  const [compDraft, setCompDraft] = useState(emptyCompDraft)

  // CTC calculator
  const [calcSlabId, setCalcSlabId] = useState(store.slabs[0]?.id ?? '')
  const [testCtc, setTestCtc] = useState('1200000')
  const [breakup, setBreakup] = useState<{
    slabName: string
    ctc: number
    rows: BreakupRow[]
  } | null>(null)

  // Every component across all slabs, for the select-existing picker.
  const allComponents = store.slabs.flatMap((s) =>
    s.components.map((c) => ({ key: `${s.id}:${c.id}`, slab: s, component: c }))
  )

  const openSlabForm = (s: CompensationSlab | null) => {
    setEditingSlab(s)
    setCopyFromId('')
    setSlabDraft(
      s
        ? {
            name: s.name,
            ctcFrom: String(s.ctcFrom),
            ctcTo: String(s.ctcTo),
            states: [...s.applicableStates],
            departments: [...s.applicableDepartments],
            components: s.components.map((c) => ({ ...c })),
          }
        : { ...emptySlabDraft, states: [], departments: [], components: [] }
    )
    setSlabOpen(true)
  }

  const openCompForm = (idx: number | null) => {
    setEditingCompIdx(idx)
    setCompSource('new')
    setExistingCompKey('')
    const c = idx !== null ? slabDraft.components[idx] : null
    setCompDraft(
      c
        ? {
            name: c.name,
            type: c.type,
            mode: c.mode,
            value: String(c.value),
            payPeriod: c.payPeriod,
            notes: c.notes,
            remarks: c.remarks,
            considerForLeaveEncashment: c.considerForLeaveEncashment,
          }
        : { ...emptyCompDraft }
    )
    setCompOpen(true)
  }

  const saveComponent = () => {
    if (compSource === 'existing') {
      const found = allComponents.find((e) => e.key === existingCompKey)
      if (!found) return
      setSlabDraft((d) => ({
        ...d,
        components: [
          ...d.components,
          { ...found.component, id: newCompId() },
        ],
      }))
      toast.success(
        `"${found.component.name}" copied from ${found.slab.name}`
      )
    } else {
      const next: SalaryComponent = {
        id:
          editingCompIdx !== null
            ? slabDraft.components[editingCompIdx].id
            : newCompId(),
        name: compDraft.name,
        type: compDraft.type,
        mode: compDraft.mode,
        value: Number(compDraft.value) || 0,
        payPeriod: compDraft.payPeriod,
        notes: compDraft.notes,
        remarks: compDraft.remarks,
        considerForLeaveEncashment: compDraft.considerForLeaveEncashment,
        balancing:
          editingCompIdx !== null
            ? slabDraft.components[editingCompIdx].balancing
            : undefined,
      }
      setSlabDraft((d) => ({
        ...d,
        components:
          editingCompIdx !== null
            ? d.components.map((c, i) => (i === editingCompIdx ? next : c))
            : [...d.components, next],
      }))
    }
    setCompOpen(false)
  }

  const saveSlab = () => {
    const payload = {
      name: slabDraft.name,
      ctcFrom: Number(slabDraft.ctcFrom) || 0,
      ctcTo: Number(slabDraft.ctcTo) || 0,
      applicableStates: slabDraft.states,
      applicableDepartments: slabDraft.departments,
      components: slabDraft.components,
    }
    if (payload.ctcFrom >= payload.ctcTo) {
      toast.error('Amount range: "from" must be less than "to"')
      return
    }
    if (editingSlab) store.updateSlab(editingSlab.id, payload)
    else store.addSlab(payload)
    setSlabOpen(false)
  }

  const showBreakup = () => {
    const slab = store.slabs.find((s) => s.id === calcSlabId)
    const ctc = Number(testCtc)
    if (!slab || !ctc || ctc <= 0) {
      toast.error('Pick a slab and enter a valid test CTC')
      return
    }
    setBreakup({ slabName: slab.name, ctc, rows: computeBreakup(slab, ctc) })
  }

  // Calculator summary numbers + PDF validation rules
  const earningsTotal =
    breakup?.rows
      .filter((r) => r.type === 'Earning')
      .reduce((s, r) => s + r.amount, 0) ?? 0
  const employerTotal =
    breakup?.rows
      .filter((r) => r.type === 'Employer Contribution')
      .reduce((s, r) => s + r.amount, 0) ?? 0
  const variableTotal =
    breakup?.rows
      .filter((r) => r.type === 'Variable Pay')
      .reduce((s, r) => s + r.amount, 0) ?? 0
  const gross = breakup ? breakup.ctc - employerTotal - variableTotal : 0
  const rule1Ok = breakup !== null && earningsTotal === gross
  const rule2Ok =
    breakup !== null && gross + employerTotal + variableTotal === breakup.ctc

  const RuleMark = ({ ok }: { ok: boolean }) => (
    <span
      className={`font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}
    >
      {ok ? '✓' : '✗'}
    </span>
  )

  return (
    <div className='w-full space-y-5'>
      {/* Compensation slabs */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Compensation slabs ({store.slabs.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => openSlabForm(null)}
          >
            <Plus size={12} /> Add slab
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slab name</TableHead>
                <TableHead>CTC range</TableHead>
                <TableHead>Applicable states</TableHead>
                <TableHead>Applicable departments</TableHead>
                <TableHead>Components</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.slabs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className='font-medium'>{s.name}</TableCell>
                  <TableCell className='text-sm'>
                    {formatInr(s.ctcFrom)} – {formatInr(s.ctcTo)}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {s.applicableStates.length > 0
                      ? s.applicableStates.join(', ')
                      : 'All states'}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {s.applicableDepartments.length > 0
                      ? s.applicableDepartments.join(', ')
                      : 'All departments'}
                  </TableCell>
                  <TableCell>
                    <Badge variant='pending'>
                      {s.components.length} components
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() =>
                          store.copySlab(s.id, `${s.name} (copy)`)
                        }
                      >
                        <Copy size={12} /> Copy
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openSlabForm(s)}
                      >
                        <PencilSimple size={12} /> Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs text-red-600'
                        onClick={() => setDeleteSlab(s)}
                      >
                        <Trash size={12} /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Offers are matched to the first slab whose CTC range, state and
          department fit the vacancy; the slab's components derive the salary
          breakup on the offer.
        </p>
      </section>

      {/* CTC calculator */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          CTC calculator
        </h3>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={calcSlabId} onValueChange={setCalcSlabId}>
            <SelectTrigger className='w-[280px]'>
              <SelectValue placeholder='Select slab' />
            </SelectTrigger>
            <SelectContent>
              {store.slabs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type='number'
            className='w-[160px]'
            placeholder='Test CTC (annual ₹)'
            value={testCtc}
            onChange={(e) => setTestCtc(e.target.value)}
          />
          <Button className='h-8 gap-1 text-xs' onClick={showBreakup}>
            <Calculator size={14} /> Show CTC Breakup
          </Button>
        </div>

        {breakup && (
          <div className='mt-3 space-y-2'>
            <p className='text-paragraph-sm text-neutral-1000'>
              {breakup.slabName} · annual CTC {formatInr(breakup.ctc)}
            </p>
            <div className='rounded-[8px] border border-gray-200'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Basis</TableHead>
                    <TableHead>Pay period</TableHead>
                    <TableHead>Leave encashment</TableHead>
                    <TableHead className='text-right'>
                      Annual amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakup.rows.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className='font-medium'>{r.name}</TableCell>
                      <TableCell className='text-sm'>{r.type}</TableCell>
                      <TableCell className='text-sm'>{modeLabel(r)}</TableCell>
                      <TableCell className='text-sm'>{r.payPeriod}</TableCell>
                      <TableCell className='text-sm'>
                        {r.considerForLeaveEncashment ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell className='text-right text-sm'>
                        {formatInr(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3 text-sm'>
              <div className='grid gap-1 md:grid-cols-2'>
                <p>
                  Earnings total:{' '}
                  <span className='font-medium'>
                    {formatInr(earningsTotal)}
                  </span>
                </p>
                <p>
                  Gross (CTC − employer contribution − variable pay):{' '}
                  <span className='font-medium'>{formatInr(gross)}</span>
                </p>
                <p>
                  Employer contribution:{' '}
                  <span className='font-medium'>
                    {formatInr(employerTotal)}
                  </span>
                </p>
                <p>
                  Variable pay:{' '}
                  <span className='font-medium'>
                    {formatInr(variableTotal)}
                  </span>
                </p>
              </div>
              <div className='mt-2 space-y-0.5 border-t border-gray-200 pt-2'>
                <p>
                  <RuleMark ok={rule1Ok} /> Earnings total equals Gross (
                  {formatInr(earningsTotal)} vs {formatInr(gross)})
                </p>
                <p>
                  <RuleMark ok={rule2Ok} /> Gross + employer contribution +
                  variable pay equals CTC (
                  {formatInr(gross + employerTotal + variableTotal)} vs{' '}
                  {formatInr(breakup.ctc)})
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Add / edit slab */}
      <Dialog open={slabOpen} onOpenChange={setSlabOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[680px]'>
          <DialogHeader>
            <DialogTitle>
              {editingSlab
                ? 'Edit compensation slab'
                : 'Add compensation slab'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Slab name'
              value={slabDraft.name}
              onChange={(e) =>
                setSlabDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Input
                type='number'
                placeholder='Amount range from (annual ₹)'
                value={slabDraft.ctcFrom}
                onChange={(e) =>
                  setSlabDraft((d) => ({ ...d, ctcFrom: e.target.value }))
                }
              />
              <Input
                type='number'
                placeholder='Amount range to (annual ₹)'
                value={slabDraft.ctcTo}
                onChange={(e) =>
                  setSlabDraft((d) => ({ ...d, ctcTo: e.target.value }))
                }
              />
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <div>
                <p className='mb-1 text-sm font-medium'>Applicable states</p>
                <MultiPick
                  options={APPLICABLE_STATES}
                  selected={slabDraft.states}
                  onToggle={(o) =>
                    setSlabDraft((d) => ({
                      ...d,
                      states: d.states.includes(o)
                        ? d.states.filter((x) => x !== o)
                        : [...d.states, o],
                    }))
                  }
                />
              </div>
              <div>
                <p className='mb-1 text-sm font-medium'>
                  Applicable departments
                </p>
                <MultiPick
                  options={DEPARTMENTS}
                  selected={slabDraft.departments}
                  onToggle={(o) =>
                    setSlabDraft((d) => ({
                      ...d,
                      departments: d.departments.includes(o)
                        ? d.departments.filter((x) => x !== o)
                        : [...d.departments, o],
                    }))
                  }
                />
              </div>
            </div>

            {/* Copy components from an existing slab */}
            <div className='flex items-center gap-2'>
              <Select
                value={copyFromId}
                onValueChange={(v) => {
                  setCopyFromId(v)
                  const src = store.slabs.find((s) => s.id === v)
                  if (src) {
                    setSlabDraft((d) => ({
                      ...d,
                      components: src.components.map((c) => ({
                        ...c,
                        id: newCompId(),
                      })),
                    }))
                    toast.success(
                      `Components copied from "${src.name}" — adjust as needed`
                    )
                  }
                }}
              >
                <SelectTrigger className='w-[300px]'>
                  <SelectValue placeholder='Copy from existing slab…' />
                </SelectTrigger>
                <SelectContent>
                  {store.slabs
                    .filter((s) => s.id !== editingSlab?.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <span className='text-paragraph-sm text-neutral-1000'>
                Prefills the components grid below
              </span>
            </div>

            {/* Components grid */}
            <div>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-sm font-medium'>
                  Salary components ({slabDraft.components.length})
                </p>
                <Button
                  variant='outline'
                  className='h-7 gap-1 text-xs'
                  onClick={() => openCompForm(null)}
                >
                  <Plus size={12} /> Add component
                </Button>
              </div>
              <div className='rounded-[8px] border border-gray-200'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Pay period</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slabDraft.components.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='text-paragraph-sm text-neutral-1000 text-center'
                        >
                          No components yet — add one or copy from an existing
                          slab
                        </TableCell>
                      </TableRow>
                    )}
                    {slabDraft.components.map((c, i) => (
                      <TableRow key={c.id}>
                        <TableCell className='text-sm font-medium'>
                          {c.name}
                          {c.balancing ? ' (balancing)' : ''}
                        </TableCell>
                        <TableCell className='text-sm'>{c.type}</TableCell>
                        <TableCell className='text-sm'>
                          {modeLabel(c)}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {c.payPeriod}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-1'>
                            <Button
                              variant='outline'
                              className='h-6 gap-1 px-2 text-xs'
                              onClick={() => openCompForm(i)}
                            >
                              <PencilSimple size={12} /> Edit
                            </Button>
                            <Button
                              variant='outline'
                              className='h-6 gap-1 px-2 text-xs text-red-600'
                              onClick={() =>
                                setSlabDraft((d) => ({
                                  ...d,
                                  components: d.components.filter(
                                    (_, j) => j !== i
                                  ),
                                }))
                              }
                            >
                              <Trash size={12} /> Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSlabOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !slabDraft.name || !slabDraft.ctcFrom || !slabDraft.ctcTo
              }
              onClick={saveSlab}
            >
              {editingSlab ? 'Save changes' : 'Save slab'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit component (sub-dialog) */}
      <Dialog open={compOpen} onOpenChange={setCompOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingCompIdx !== null
                ? 'Edit salary component'
                : 'Add salary component'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            {editingCompIdx === null && (
              <div className='grid grid-cols-2 gap-3'>
                <Select
                  value={compSource}
                  onValueChange={(v) =>
                    setCompSource(v as 'new' | 'existing')
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='new'>Create new component</SelectItem>
                    <SelectItem value='existing'>
                      Select existing component
                    </SelectItem>
                  </SelectContent>
                </Select>
                {compSource === 'existing' && (
                  <Select
                    value={existingCompKey}
                    onValueChange={setExistingCompKey}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Pick component…' />
                    </SelectTrigger>
                    <SelectContent>
                      {allComponents.map((e) => (
                        <SelectItem key={e.key} value={e.key}>
                          {e.component.name} · {e.slab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            {compSource === 'new' && (
              <>
                <div className='grid grid-cols-2 gap-3'>
                  <Input
                    placeholder='Component name'
                    value={compDraft.name}
                    onChange={(e) =>
                      setCompDraft((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                  <Select
                    value={compDraft.type}
                    onValueChange={(v) =>
                      setCompDraft((d) => ({
                        ...d,
                        type: v as ComponentType,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid grid-cols-3 gap-3'>
                  <Select
                    value={compDraft.mode}
                    onValueChange={(v) =>
                      setCompDraft((d) => ({
                        ...d,
                        mode: v as ComponentMode,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m === 'percent-of-gross'
                            ? '% of gross'
                            : 'Fixed amount'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type='number'
                    placeholder={
                      compDraft.mode === 'percent-of-gross'
                        ? 'Percent'
                        : 'Annual ₹'
                    }
                    value={compDraft.value}
                    onChange={(e) =>
                      setCompDraft((d) => ({ ...d, value: e.target.value }))
                    }
                  />
                  <Select
                    value={compDraft.payPeriod}
                    onValueChange={(v) =>
                      setCompDraft((d) => ({
                        ...d,
                        payPeriod: v as PayPeriod,
                      }))
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_PERIODS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder='Notes'
                  rows={2}
                  value={compDraft.notes}
                  onChange={(e) =>
                    setCompDraft((d) => ({ ...d, notes: e.target.value }))
                  }
                />
                <Textarea
                  placeholder='Remarks'
                  rows={2}
                  value={compDraft.remarks}
                  onChange={(e) =>
                    setCompDraft((d) => ({ ...d, remarks: e.target.value }))
                  }
                />
                <label className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    checked={compDraft.considerForLeaveEncashment}
                    onCheckedChange={(v) =>
                      setCompDraft((d) => ({
                        ...d,
                        considerForLeaveEncashment: v === true,
                      }))
                    }
                  />
                  Consider for leave encashment
                </label>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCompOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                compSource === 'existing'
                  ? !existingCompKey
                  : !compDraft.name || compDraft.value === ''
              }
              onClick={saveComponent}
            >
              {editingCompIdx !== null ? 'Save changes' : 'Add component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete slab confirm */}
      <Dialog
        open={deleteSlab !== null}
        onOpenChange={(o) => !o && setDeleteSlab(null)}
      >
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete compensation slab?</DialogTitle>
          </DialogHeader>
          <p className='text-sm'>
            "{deleteSlab?.name}" will be removed. Offers already generated keep
            the breakup captured at offer time.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteSlab(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteSlab) store.removeSlab(deleteSlab.id)
                setDeleteSlab(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
