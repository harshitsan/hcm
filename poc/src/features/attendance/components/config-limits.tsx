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
import { type OutTimeSettings } from '../data/config'
import { EMPLOYEE_CLASSES, type EmployeeClass } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

function ClassPicker({
  classSpecific,
  onClassSpecific,
  employeeClass,
  onEmployeeClass,
}: {
  classSpecific: boolean
  onClassSpecific: (v: boolean) => void
  employeeClass: string
  onEmployeeClass: (v: string) => void
}) {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <label className='mt-5 flex items-center gap-2 text-sm'>
        <Checkbox
          variant='blue'
          checked={classSpecific}
          onCheckedChange={(v) => onClassSpecific(!!v)}
        />
        Employee-class specific
      </label>
      <Field label='Employee class'>
        <Select value={employeeClass} onValueChange={onEmployeeClass} disabled={!classSpecific}>
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
  )
}

/**
 * Personal out-time request limits (TNA-35) and work-from-home settings
 * templates with monthly instance limits (TNA-37) — requests beyond these
 * limits are blocked or flagged as exceeding policy.
 */
export function ConfigLimits({
  config,
  onNext,
}: {
  config: AttendanceConfigStore
  onNext?: () => void
}) {
  const [otsOpen, setOtsOpen] = useState(false)
  const [editingOtsId, setEditingOtsId] = useState<string | null>(null)
  const [oName, setOName] = useState('')
  const [oClassSpecific, setOClassSpecific] = useState(false)
  const [oClass, setOClass] = useState<string>('Regular')
  const [oMaxRequests, setOMaxRequests] = useState('4')
  const [oMaxHoursReq, setOMaxHoursReq] = useState('3')
  const [oMaxHoursMonth, setOMaxHoursMonth] = useState('8')

  const [wfhOpen, setWfhOpen] = useState(false)
  const [wName, setWName] = useState('')
  const [wClassSpecific, setWClassSpecific] = useState(false)
  const [wClass, setWClass] = useState<string>('Regular')
  const [wMaxPerMonth, setWMaxPerMonth] = useState('4')

  const openNewOutTime = () => {
    setEditingOtsId(null)
    setOName('')
    setOClassSpecific(false)
    setOClass('Regular')
    setOMaxRequests('4')
    setOMaxHoursReq('3')
    setOMaxHoursMonth('8')
    setOtsOpen(true)
  }

  const openEditOutTime = (s: OutTimeSettings) => {
    setEditingOtsId(s.id)
    setOName(s.name)
    setOClassSpecific(s.classSpecific)
    setOClass(s.employeeClass === 'All' ? 'Regular' : s.employeeClass)
    setOMaxRequests(String(s.maxRequestsPerMonth))
    setOMaxHoursReq(String(s.maxHoursPerRequest))
    setOMaxHoursMonth(String(s.maxHoursPerMonth))
    setOtsOpen(true)
  }

  const saveOutTime = () => {
    const req = Number(oMaxRequests)
    const perReq = Number(oMaxHoursReq)
    const perMonth = Number(oMaxHoursMonth)
    if (!oName.trim() || !req || !perReq || !perMonth || perMonth < perReq) {
      toast.error('Name and positive limits are required (monthly hours ≥ per-request hours)')
      return
    }
    const payload = {
      name: oName,
      classSpecific: oClassSpecific,
      employeeClass: oClassSpecific ? (oClass as EmployeeClass) : ('All' as const),
      maxRequestsPerMonth: req,
      maxHoursPerRequest: perReq,
      maxHoursPerMonth: perMonth,
    }
    if (editingOtsId) {
      config.updateOutTimeSetting(editingOtsId, payload)
    } else {
      config.addOutTimeSetting(payload)
    }
    setOtsOpen(false)
    setOName('')
  }

  const saveWfh = () => {
    const max = Number(wMaxPerMonth)
    if (!wName.trim() || !max || max <= 0) {
      toast.error('Template name and a positive monthly limit are required')
      return
    }
    config.addWfhTemplate({
      name: wName,
      classSpecific: wClassSpecific,
      employeeClass: wClassSpecific ? wClass : 'All',
      maxPerMonth: max,
    })
    setWfhOpen(false)
    setWName('')
  }

  return (
    <div className='w-full space-y-5'>
      {/* Out-time limits (TNA-35) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Out Time Request Settings ({config.outTimeSettings.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              requests exceeding a limit are blocked or flagged as over-policy
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={openNewOutTime}>
            <Plus size={12} weight='bold' />
            Add Settings
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Settings</th>
                <th className='px-2 font-medium'>Class specific</th>
                <th className='px-2 font-medium'>Employee class</th>
                <th className='px-2 font-medium'>Max requests / month</th>
                <th className='px-2 font-medium'>Max hours / request</th>
                <th className='px-2 font-medium'>Max hours / month</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {config.outTimeSettings.map((s) => (
                <tr key={s.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{s.name}</td>
                  <td className='px-2'>{s.classSpecific ? 'Yes' : 'No'}</td>
                  <td className='px-2'>{s.employeeClass}</td>
                  <td className='px-2'>{s.maxRequestsPerMonth}</td>
                  <td className='px-2'>{s.maxHoursPerRequest}h</td>
                  <td className='px-2'>{s.maxHoursPerMonth}h</td>
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => openEditOutTime(s)}
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

      {/* WFH templates (TNA-37) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Work From Home Settings ({config.wfhTemplates.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              further requests beyond the monthly instance limit are blocked
            </span>
          </h3>
          <div className='flex items-center gap-3'>
            <label className='flex items-center gap-2 text-xs'>
              WFH enabled
              <Switch
                checked={config.wfhEnabled}
                onCheckedChange={(v) => {
                  config.setWfhEnabled(v)
                  toast.success(v ? 'Work from home enabled' : 'Work from home disabled')
                }}
              />
            </label>
            <Button
              variant='outline'
              className='h-7 gap-1'
              disabled={!config.wfhEnabled}
              onClick={() => setWfhOpen(true)}
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
                <th className='px-2 font-medium'>Max WFH instances / month</th>
              </tr>
            </thead>
            <tbody>
              {config.wfhTemplates.map((t) => (
                <tr key={t.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{t.name}</td>
                  <td className='px-2'>{t.classSpecific ? 'Yes' : 'No'}</td>
                  <td className='px-2'>{t.employeeClass}</td>
                  <td className='px-2'>{t.maxPerMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {onNext && (
        <div className='flex justify-end'>
          <Button
            className='h-7'
            onClick={() => {
              toast.success('Out-time and WFH limits saved')
              onNext()
            }}
          >
            Save & Next
          </Button>
        </div>
      )}

      <Dialog open={otsOpen} onOpenChange={setOtsOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editingOtsId ? 'Edit out-time settings' : 'Add out-time settings'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Settings name'>
              <Input value={oName} onChange={(e) => setOName(e.target.value)} placeholder='Contractor out-time' />
            </Field>
            <ClassPicker
              classSpecific={oClassSpecific}
              onClassSpecific={setOClassSpecific}
              employeeClass={oClass}
              onEmployeeClass={setOClass}
            />
            <div className='grid grid-cols-3 gap-3'>
              <Field label='Max requests / month'>
                <Input type='number' value={oMaxRequests} onChange={(e) => setOMaxRequests(e.target.value)} />
              </Field>
              <Field label='Max hours / request'>
                <Input type='number' value={oMaxHoursReq} onChange={(e) => setOMaxHoursReq(e.target.value)} />
              </Field>
              <Field label='Max hours / month'>
                <Input type='number' value={oMaxHoursMonth} onChange={(e) => setOMaxHoursMonth(e.target.value)} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOtsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOutTime}>
              {editingOtsId ? 'Save Changes' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wfhOpen} onOpenChange={setWfhOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add WFH template</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Template name'>
              <Input value={wName} onChange={(e) => setWName(e.target.value)} placeholder='Field team remote' />
            </Field>
            <ClassPicker
              classSpecific={wClassSpecific}
              onClassSpecific={setWClassSpecific}
              employeeClass={wClass}
              onEmployeeClass={setWClass}
            />
            <Field label='Max WFH instances per month'>
              <Input type='number' value={wMaxPerMonth} onChange={(e) => setWMaxPerMonth(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWfhOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveWfh}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
