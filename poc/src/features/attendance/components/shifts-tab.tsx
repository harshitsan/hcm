import { useState } from 'react'
import { Moon, Plus } from 'phosphor-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPLOYEES, employeeName, fmtDate } from '../data/shared'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Shift pattern definition (working hours, breaks, night flag) and roster
 * management with conflict detection (TNA-05); versions are effective-dated
 * (TNA-24).
 */
export function ShiftsTab({ shifts }: { shifts: ShiftsStore }) {
  const [patternOpen, setPatternOpen] = useState(false)
  const [pName, setPName] = useState('')
  const [pStart, setPStart] = useState('09:00')
  const [pEnd, setPEnd] = useState('18:00')
  const [pBreak, setPBreak] = useState('60')
  const [pNight, setPNight] = useState(false)
  const [pEffective, setPEffective] = useState('2026-08-01')

  const [assignOpen, setAssignOpen] = useState(false)
  const [aEmployee, setAEmployee] = useState('')
  const [aShift, setAShift] = useState('')
  const [aFrom, setAFrom] = useState('2026-08-01')
  const [aTo, setATo] = useState('2026-08-31')

  const savePattern = () => {
    if (!pName.trim()) {
      toast.error('Shift name is required')
      return
    }
    shifts.addPattern({
      name: pName,
      startTime: pStart,
      endTime: pEnd,
      breakMinutes: Number(pBreak) || 0,
      nightShift: pNight,
      effectiveFrom: pEffective,
    })
    setPatternOpen(false)
    setPName('')
  }

  const saveAssignment = () => {
    if (!aEmployee || !aShift || aTo < aFrom) {
      toast.error('Pick an employee, a shift and a valid date range')
      return
    }
    shifts.assignRoster({ employeeId: aEmployee, shiftId: aShift, fromDate: aFrom, toDate: aTo })
    setAssignOpen(false)
  }

  const activePatterns = shifts.patterns.filter((p) => p.status !== 'superseded')

  return (
    <div className='w-full space-y-5'>
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Shift Patterns ({shifts.patterns.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              reusable across rosters; new versions supersede from their effective date
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setPatternOpen(true)}>
            <Plus size={12} weight='bold' />
            New Pattern
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Shift</th>
                <th className='px-2 font-medium'>Hours</th>
                <th className='px-2 font-medium'>Break</th>
                <th className='px-2 font-medium'>Night</th>
                <th className='px-2 font-medium'>Version</th>
                <th className='px-2 font-medium'>Effective from</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {shifts.patterns.map((p) => (
                <tr key={p.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{p.name}</td>
                  <td className='px-2'>
                    {p.startTime} – {p.endTime}
                  </td>
                  <td className='px-2'>{p.breakMinutes}m</td>
                  <td className='px-2'>
                    {p.nightShift ? (
                      <Badge variant='completed'>
                        <Moon size={11} weight='fill' className='mr-1' />
                        Night
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className='px-2'>v{p.version}</td>
                  <td className='px-2'>{fmtDate(p.effectiveFrom)}</td>
                  <td className='px-2'>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Roster Assignments ({shifts.roster.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              overlapping assignments are detected and flagged on save
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setAssignOpen(true)}>
            <Plus size={12} weight='bold' />
            Assign Shift
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Shift</th>
                <th className='px-2 font-medium'>From → To</th>
                <th className='px-2 font-medium'>Assigned by / on</th>
                <th className='px-2 font-medium'>Conflict</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {shifts.roster.map((r) => (
                <tr key={r.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{employeeName(r.employeeId)}</td>
                  <td className='px-2'>{shifts.shiftName(r.shiftId)}</td>
                  <td className='px-2'>
                    {fmtDate(r.fromDate)} → {fmtDate(r.toDate)}
                  </td>
                  <td className='text-neutral-1000 px-2'>
                    {r.assignedBy} · {fmtDate(r.assignedOn)}
                  </td>
                  <td className='text-destructive px-2 text-xs'>{r.conflict ?? '—'}</td>
                  <td className='px-2'>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className='px-2 text-right'>
                    {r.status !== 'cancelled' && (
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => shifts.cancelAssignment(r.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={patternOpen} onOpenChange={setPatternOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New shift pattern</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Shift name'>
              <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder='Evening 2–11' />
            </Field>
            <div className='grid grid-cols-3 gap-3'>
              <Field label='Start'>
                <Input type='time' value={pStart} onChange={(e) => setPStart(e.target.value)} />
              </Field>
              <Field label='End'>
                <Input type='time' value={pEnd} onChange={(e) => setPEnd(e.target.value)} />
              </Field>
              <Field label='Break (min)'>
                <Input type='number' value={pBreak} onChange={(e) => setPBreak(e.target.value)} />
              </Field>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Effective from'>
                <Input type='date' value={pEffective} onChange={(e) => setPEffective(e.target.value)} />
              </Field>
              <label className='mt-5 flex items-center gap-2 text-sm'>
                <Checkbox variant='blue' checked={pNight} onCheckedChange={(v) => setPNight(!!v)} />
                Night shift
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPatternOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePattern}>Save Pattern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Assign shift to roster</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Employee'>
              <Select value={aEmployee} onValueChange={setAEmployee}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select employee' />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label='Shift pattern'>
              <Select value={aShift} onValueChange={setAShift}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select shift' />
                </SelectTrigger>
                <SelectContent>
                  {activePatterns.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.startTime}–{p.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='From'>
                <Input type='date' value={aFrom} onChange={(e) => setAFrom(e.target.value)} />
              </Field>
              <Field label='To'>
                <Input type='date' value={aTo} onChange={(e) => setATo(e.target.value)} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAssignment}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
