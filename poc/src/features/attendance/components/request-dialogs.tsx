import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { OUT_TIME_TYPES, type OutTimeType } from '../data/requests'
import { CURRENT_EMPLOYEE_ID, EMPLOYEES } from '../data/shared'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

/** Overtime request for extra hours worked (TNA-31). */
export function OvertimeDialog({
  open,
  onOpenChange,
  requests,
}: DialogProps & { requests: RequestsStore }) {
  const [date, setDate] = useState('2026-07-01')
  const [hours, setHours] = useState('2')

  const submit = () => {
    const h = Number(hours)
    if (!date || Number.isNaN(h) || h <= 0 || h > 12) {
      toast.error('Enter the overtime date and hours between 0 and 12')
      return
    }
    requests.submitOvertime(CURRENT_EMPLOYEE_ID, date, h)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[380px]'>
        <DialogHeader>
          <DialogTitle>Overtime request</DialogTitle>
          <DialogDescription>
            Hours above the supervisor cap route automatically to a higher
            authority before being finalized for payroll.
          </DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Overtime date'>
            <Input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label='Recorded hours'>
            <Input
              type='number'
              step='0.5'
              min='0.5'
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Compensatory off request (TNA-33). */
export function CompOffDialog({
  open,
  onOpenChange,
  requests,
}: DialogProps & { requests: RequestsStore }) {
  const [date, setDate] = useState('2026-07-13')
  const [days, setDays] = useState('1')

  const submit = () => {
    const d = Number(days)
    if (!date || ![0.5, 1, 1.5, 2].includes(d)) {
      toast.error('Pick a comp off date and 0.5–2 days')
      return
    }
    requests.submitCompOff(CURRENT_EMPLOYEE_ID, date, d)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[380px]'>
        <DialogHeader>
          <DialogTitle>Comp off request</DialogTitle>
          <DialogDescription>
            Time off in lieu of eligible extra hours or holiday work. Your
            balance updates when the approver decides.
          </DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='Comp off date'>
            <Input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label='Days'>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['0.5', '1', '1.5', '2'].map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Out-time request during working hours (TNA-36). */
export function OutTimeDialog({
  open,
  onOpenChange,
  requests,
}: DialogProps & { requests: RequestsStore }) {
  const [type, setType] = useState<OutTimeType>('Personal')
  const [from, setFrom] = useState('2026-07-03T15:00')
  const [to, setTo] = useState('2026-07-03T17:00')

  const submit = () => {
    if (!from || !to || to <= from) {
      toast.error('To date-time must be after from date-time')
      return
    }
    requests.submitOutTime(CURRENT_EMPLOYEE_ID, type, from, to)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Out time request</DialogTitle>
          <DialogDescription>
            Duration is computed from the range; requests over the configured
            policy limits are blocked.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <Field label='Request type'>
            <Select value={type} onValueChange={(v) => setType(v as OutTimeType)}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUT_TIME_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className='grid grid-cols-2 gap-3'>
            <Field label='From'>
              <Input
                type='datetime-local'
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label='To'>
              <Input type='datetime-local' value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Work-from-home request for a date range (TNA-38). */
export function WfhDialog({
  open,
  onOpenChange,
  requests,
}: DialogProps & { requests: RequestsStore }) {
  const [from, setFrom] = useState('2026-07-09')
  const [to, setTo] = useState('2026-07-10')

  const submit = () => {
    if (!from || !to || to < from) {
      toast.error('To date must be on or after the from date')
      return
    }
    requests.submitWfh(CURRENT_EMPLOYEE_ID, from, to)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[380px]'>
        <DialogHeader>
          <DialogTitle>Work from home request</DialogTitle>
          <DialogDescription>
            Days and hours are computed from the range; requests beyond the
            monthly WFH limit are rejected as over-limit.
          </DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-3'>
          <Field label='From date'>
            <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label='To date'>
            <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Shift swap request with a colleague (TNA-06). */
export function SwapDialog({
  open,
  onOpenChange,
  shifts,
}: DialogProps & { shifts: ShiftsStore }) {
  const [counterparty, setCounterparty] = useState('')
  const [date, setDate] = useState('2026-07-14')
  const [reason, setReason] = useState('')

  const submit = () => {
    if (!counterparty || !date || reason.trim().length < 5) {
      toast.error('Pick a colleague, date and a short reason')
      return
    }
    shifts.requestSwap({
      requesterId: CURRENT_EMPLOYEE_ID,
      counterpartyId: counterparty,
      date,
      requesterShiftId: 'shift-01',
      counterpartyShiftId: 'shift-02',
      reason,
    })
    onOpenChange(false)
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Request shift swap</DialogTitle>
          <DialogDescription>
            The request routes through the approval workflow; your colleague is
            notified and the roster updates automatically on approval.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <Field label='Swap with'>
            <Select value={counterparty} onValueChange={setCounterparty}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select colleague' />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES.filter((e) => e.id !== CURRENT_EMPLOYEE_ID && e.selfService).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className='grid grid-cols-2 gap-3'>
            <Field label='Shift date'>
              <Input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label='Reason'>
              <Input
                placeholder='Why swap?'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
