import { useState } from 'react'
import { PencilSimple, Plus } from 'phosphor-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type BreakRule, type CompOffTemplate, type FlexiBasis } from '../data/config'
import { DEPARTMENTS, EMPLOYEE_CLASSES, LOCATIONS, POSITIONS } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { DualListTransfer } from './dual-list-transfer'

const BREAK_APPLICABILITY = [
  'Company-wide',
  ...LOCATIONS.map((l) => `Location: ${l}`),
  ...EMPLOYEE_CLASSES.map((c) => `Class: ${c}`),
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Break allowances (TNA-29), comp-off settings templates with the
 * minimum-hours threshold (TNA-32) and flexi-schedule scoping by location /
 * department / position (TNA-34) — with edit/view of existing breaks and
 * templates, dual-list flexi assignment and Save & Next step navigation.
 */
export function ConfigPolicies({
  config,
  onNext,
}: {
  config: AttendanceConfigStore
  onNext?: () => void
}) {
  const [breakOpen, setBreakOpen] = useState(false)
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null)
  const [bName, setBName] = useState('')
  const [bMinutes, setBMinutes] = useState('30')
  const [bApplies, setBApplies] = useState('Company-wide')
  const [bPaid, setBPaid] = useState(true)

  const [cotOpen, setCotOpen] = useState(false)
  const [editingCotId, setEditingCotId] = useState<string | null>(null)
  const [cName, setCName] = useState('')
  const [cClassSpecific, setCClassSpecific] = useState(false)
  const [cClass, setCClass] = useState<string>('Regular')
  const [cMinHours, setCMinHours] = useState('4')

  const flexiOptions: readonly string[] =
    config.flexi.basis === 'location'
      ? LOCATIONS
      : config.flexi.basis === 'department'
        ? DEPARTMENTS
        : POSITIONS

  const openNewBreak = () => {
    setEditingBreakId(null)
    setBName('')
    setBMinutes('30')
    setBApplies('Company-wide')
    setBPaid(true)
    setBreakOpen(true)
  }

  const openEditBreak = (b: BreakRule) => {
    setEditingBreakId(b.id)
    setBName(b.name)
    setBMinutes(String(b.allowableMinutes))
    setBApplies(b.applicability)
    setBPaid(b.paid)
    setBreakOpen(true)
  }

  const saveBreak = () => {
    const mins = Number(bMinutes)
    if (!bName.trim() || !mins || mins <= 0) {
      toast.error('Break name and a positive allowable duration are required')
      return
    }
    const payload = { name: bName, allowableMinutes: mins, applicability: bApplies, paid: bPaid }
    if (editingBreakId) {
      config.updateBreak(editingBreakId, payload)
    } else {
      config.addBreak(payload)
    }
    setBreakOpen(false)
    setBName('')
  }

  const openNewCompOff = () => {
    setEditingCotId(null)
    setCName('')
    setCClassSpecific(false)
    setCClass('Regular')
    setCMinHours('4')
    setCotOpen(true)
  }

  const openEditCompOff = (t: CompOffTemplate) => {
    setEditingCotId(t.id)
    setCName(t.name)
    setCClassSpecific(t.classSpecific)
    setCClass(t.employeeClass === 'All' ? 'Regular' : t.employeeClass)
    setCMinHours(String(t.minHoursBeyond))
    setCotOpen(true)
  }

  const saveCompOff = (continueNext = false) => {
    const hours = Number(cMinHours)
    if (!cName.trim() || !hours || hours <= 0) {
      toast.error('Template name and a positive minimum-hours threshold are required')
      return
    }
    const payload = {
      name: cName,
      classSpecific: cClassSpecific,
      employeeClass: cClassSpecific ? cClass : 'All',
      minHoursBeyond: hours,
    }
    if (editingCotId) {
      config.updateCompOffTemplate(editingCotId, payload)
    } else {
      config.addCompOffTemplate(payload)
    }
    setCotOpen(false)
    setCName('')
    if (continueNext) onNext?.()
  }

  return (
    <div className='w-full space-y-5'>
      {/* Breaks (TNA-29) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Breaks ({config.breaks.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              break time beyond the allowance is flagged and deducted from
              effective worked hours
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={openNewBreak}>
            <Plus size={12} weight='bold' />
            Add Break
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Break</th>
                <th className='px-2 font-medium'>Allowable duration</th>
                <th className='px-2 font-medium'>Applicability</th>
                <th className='px-2 font-medium'>Paid</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {config.breaks.map((b) => (
                <tr key={b.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{b.name}</td>
                  <td className='px-2'>{b.allowableMinutes} min</td>
                  <td className='px-2'>{b.applicability}</td>
                  <td className='px-2'>{b.paid ? 'Paid' : 'Unpaid'}</td>
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => openEditBreak(b)}
                    >
                      <PencilSimple size={12} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comp off (TNA-32) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Comp Off Settings ({config.compOffTemplates.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              accrued when eligible employees work beyond the threshold
            </span>
          </h3>
          <div className='flex items-center gap-3'>
            <label className='flex items-center gap-2 text-xs'>
              Comp off enabled
              <Switch
                checked={config.compOffEnabled}
                onCheckedChange={(v) => {
                  config.setCompOffEnabled(v)
                  toast.success(v ? 'Comp off enabled' : 'Comp off disabled')
                }}
              />
            </label>
            <Button
              variant='outline'
              className='h-7 gap-1'
              disabled={!config.compOffEnabled}
              onClick={openNewCompOff}
            >
              <Plus size={12} weight='bold' />
              Add Template
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Template</th>
                <th className='px-2 font-medium'>Class specific</th>
                <th className='px-2 font-medium'>Employee class</th>
                <th className='px-2 font-medium'>Min hours beyond business hours</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {config.compOffTemplates.map((t) => (
                <tr key={t.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{t.name}</td>
                  <td className='px-2'>{t.classSpecific ? 'Yes' : 'No'}</td>
                  <td className='px-2'>{t.employeeClass}</td>
                  <td className='px-2'>{t.minHoursBeyond}h</td>
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      disabled={!config.compOffEnabled}
                      onClick={() => openEditCompOff(t)}
                    >
                      <PencilSimple size={12} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flexi schedule (TNA-34) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-medium'>Flexi Schedule Settings</h3>
            <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
              Flexi-eligible employees are evaluated on flexible start and end
              times instead of a fixed shift.
            </p>
          </div>
          <label className='flex items-center gap-2 text-xs'>
            Flexi scheduling enabled
            <Switch
              checked={config.flexi.enabled}
              onCheckedChange={(v) => config.saveFlexi({ ...config.flexi, enabled: v })}
            />
          </label>
        </div>
        {config.flexi.enabled && (
          <div className='mt-3 grid gap-4 lg:grid-cols-2'>
            <Field label='Scope basis'>
              <Select
                value={config.flexi.basis}
                onValueChange={(v) =>
                  config.saveFlexi({ ...config.flexi, basis: v as FlexiBasis, assigned: [] })
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='location'>Location-based</SelectItem>
                  <SelectItem value='department'>Department-based</SelectItem>
                  <SelectItem value='position'>Position-based</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>
                Assigned {config.flexi.basis}s (move groups right to make them
                follow flexi rules)
              </Label>
              <DualListTransfer
                options={flexiOptions}
                assigned={config.flexi.assigned}
                onChange={(assigned) => config.saveFlexi({ ...config.flexi, assigned })}
                availableTitle={`Available ${config.flexi.basis}s`}
                assignedTitle={`Flexi ${config.flexi.basis}s`}
              />
            </div>
          </div>
        )}
      </div>

      {onNext && (
        <div className='flex justify-end'>
          <Button
            className='h-7'
            onClick={() => {
              toast.success('Break, comp off and flexi policies saved')
              onNext()
            }}
          >
            Save & Next
          </Button>
        </div>
      )}

      <Dialog open={breakOpen} onOpenChange={setBreakOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>{editingBreakId ? 'Edit break' : 'Add break'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Break name'>
              <Input value={bName} onChange={(e) => setBName(e.target.value)} placeholder='Coffee break' />
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Allowable duration (min)'>
                <Input type='number' value={bMinutes} onChange={(e) => setBMinutes(e.target.value)} />
              </Field>
              <Field label='Applicability'>
                <Select value={bApplies} onValueChange={setBApplies}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BREAK_APPLICABILITY.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={bPaid} onCheckedChange={setBPaid} />
              Paid break
            </label>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setBreakOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBreak}>
              {editingBreakId ? 'Save Changes' : 'Save Break'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cotOpen} onOpenChange={setCotOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>
              {editingCotId ? 'Edit comp off template' : 'Add comp off template'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Template name'>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder='Weekend support comp off' />
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <label className='mt-5 flex items-center gap-2 text-sm'>
                <Checkbox
                  variant='blue'
                  checked={cClassSpecific}
                  onCheckedChange={(v) => setCClassSpecific(!!v)}
                />
                Employee-class specific
              </label>
              <Field label='Employee class'>
                <Select value={cClass} onValueChange={setCClass} disabled={!cClassSpecific}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label='Min hours worked beyond business hours to earn comp off'>
              <Input type='number' value={cMinHours} onChange={(e) => setCMinHours(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCotOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveCompOff()}>
              {editingCotId ? 'Save Changes' : 'Save Template'}
            </Button>
            {onNext && (
              <Button variant='outline' onClick={() => saveCompOff(true)}>
                Save & Next
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
