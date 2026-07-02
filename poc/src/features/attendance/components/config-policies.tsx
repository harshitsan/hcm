import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { type FlexiBasis } from '../data/config'
import { DEPARTMENTS, EMPLOYEE_CLASSES, LOCATIONS, POSITIONS } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

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
 * department / position (TNA-34).
 */
export function ConfigPolicies({ config }: { config: AttendanceConfigStore }) {
  const [breakOpen, setBreakOpen] = useState(false)
  const [bName, setBName] = useState('')
  const [bMinutes, setBMinutes] = useState('30')
  const [bApplies, setBApplies] = useState('Company-wide')
  const [bPaid, setBPaid] = useState(true)

  const [cotOpen, setCotOpen] = useState(false)
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

  const saveBreak = () => {
    const mins = Number(bMinutes)
    if (!bName.trim() || !mins || mins <= 0) {
      toast.error('Break name and a positive allowable duration are required')
      return
    }
    config.addBreak({ name: bName, allowableMinutes: mins, applicability: bApplies, paid: bPaid })
    setBreakOpen(false)
    setBName('')
  }

  const saveCompOff = () => {
    const hours = Number(cMinHours)
    if (!cName.trim() || !hours || hours <= 0) {
      toast.error('Template name and a positive minimum-hours threshold are required')
      return
    }
    config.addCompOffTemplate({
      name: cName,
      classSpecific: cClassSpecific,
      employeeClass: cClassSpecific ? cClass : 'All',
      minHoursBeyond: hours,
    })
    setCotOpen(false)
    setCName('')
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
          <Button variant='outline' className='h-7 gap-1' onClick={() => setBreakOpen(true)}>
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
              </tr>
            </thead>
            <tbody>
              {config.breaks.map((b) => (
                <tr key={b.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{b.name}</td>
                  <td className='px-2'>{b.allowableMinutes} min</td>
                  <td className='px-2'>{b.applicability}</td>
                  <td className='px-2'>{b.paid ? 'Paid' : 'Unpaid'}</td>
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
              onClick={() => setCotOpen(true)}
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
              </tr>
            </thead>
            <tbody>
              {config.compOffTemplates.map((t) => (
                <tr key={t.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{t.name}</td>
                  <td className='px-2'>{t.classSpecific ? 'Yes' : 'No'}</td>
                  <td className='px-2'>{t.employeeClass}</td>
                  <td className='px-2'>{t.minHoursBeyond}h</td>
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
                Assigned {config.flexi.basis}s (only these groups follow flexi rules)
              </Label>
              <div className='flex flex-wrap gap-3 pt-1'>
                {flexiOptions.map((opt) => (
                  <label key={opt} className='flex items-center gap-1.5 text-sm'>
                    <Checkbox
                      variant='blue'
                      checked={config.flexi.assigned.includes(opt)}
                      onCheckedChange={(v) =>
                        config.saveFlexi({
                          ...config.flexi,
                          assigned: v
                            ? [...config.flexi.assigned, opt]
                            : config.flexi.assigned.filter((a) => a !== opt),
                        })
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={breakOpen} onOpenChange={setBreakOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add break</DialogTitle>
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
            <Button onClick={saveBreak}>Save Break</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cotOpen} onOpenChange={setCotOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add comp off template</DialogTitle>
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
            <Button onClick={saveCompOff}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
