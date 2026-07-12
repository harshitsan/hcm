import { useState } from 'react'
import { ArrowsLeftRight, Moon, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { patternTimeLabel } from '../data/shifts'
import { EMPLOYEES, employeeName, fmtDate } from '../data/shared'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'
import { RosterGrid } from './roster-grid'
import { SummaryCards } from './summary-cards'
import { SwapQueue } from './swap-queue'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

type ShiftView = 'roster' | 'patterns' | 'swaps'

/**
 * Consolidated Shifts & Rosters surface (TNA-05/06/14/24): one place for
 * shift patterns (incl. night shifts crossing midnight), the week roster
 * grid with day-level assignment, range assignments with conflict detection,
 * and shift-swap requests. The swap approval queue is shared with
 * Approvals → Swaps & Overtime — one queue, two entry points.
 */
export function ShiftsTab({ shifts }: { shifts: ShiftsStore }) {
  const [view, setView] = useState<ShiftView>('roster')

  // New shift pattern dialog
  const [patternOpen, setPatternOpen] = useState(false)
  const [pName, setPName] = useState('')
  const [pStart, setPStart] = useState('09:00')
  const [pEnd, setPEnd] = useState('18:00')
  const [pBreak, setPBreak] = useState('60')
  const [pNight, setPNight] = useState(false)
  const [pEffective, setPEffective] = useState('2026-08-01')

  // Range assignment dialog
  const [assignOpen, setAssignOpen] = useState(false)
  const [aEmployee, setAEmployee] = useState('')
  const [aShift, setAShift] = useState('')
  const [aFrom, setAFrom] = useState('2026-08-01')
  const [aTo, setATo] = useState('2026-08-31')

  // Swap request dialog (raised on behalf of the two employees)
  const [swapOpen, setSwapOpen] = useState(false)
  const [sRequester, setSRequester] = useState('')
  const [sCounterparty, setSCounterparty] = useState('')
  const [sDate, setSDate] = useState('2026-07-14')
  const [sReason, setSReason] = useState('')

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

  const saveSwapRequest = () => {
    if (!sRequester || !sCounterparty || sRequester === sCounterparty) {
      toast.error('Pick two different employees for the swap')
      return
    }
    if (!sDate || sReason.trim().length < 5) {
      toast.error('Pick the shift date and give a short reason')
      return
    }
    const requesterShift = shifts.shiftForDay(sRequester, sDate)
    const counterpartyShift = shifts.shiftForDay(sCounterparty, sDate)
    shifts.requestSwap({
      requesterId: sRequester,
      counterpartyId: sCounterparty,
      date: sDate,
      requesterShiftId: requesterShift?.id ?? 'shift-01',
      counterpartyShiftId: counterpartyShift?.id ?? 'shift-02',
      reason: sReason,
    })
    setSwapOpen(false)
    setSReason('')
  }

  const activePatterns = shifts.patterns.filter((p) => p.status === 'active')
  const pendingSwaps = shifts.swaps.filter((s) => s.status === 'pending').length
  const liveAssignments = shifts.roster.filter((r) => r.status === 'approved').length
  const nightPatterns = activePatterns.filter((p) => p.nightShift).length

  const VIEWS: { v: ShiftView; l: string }[] = [
    { v: 'roster', l: 'Roster' },
    { v: 'patterns', l: 'Shift Patterns' },
    { v: 'swaps', l: `Swap Requests${pendingSwaps > 0 ? ` (${pendingSwaps})` : ''}` },
  ]

  return (
    <div className='w-full space-y-5'>
      <SummaryCards
        title='Shifts & Rosters — one place for patterns, the week roster and swaps'
        items={[
          { label: 'Active shift patterns', value: activePatterns.length },
          { label: 'Live roster assignments', value: liveAssignments },
          { label: 'Swaps awaiting approval', value: pendingSwaps },
          { label: 'Night shifts (cross midnight)', value: nightPatterns },
        ]}
      />

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 w-fit'>
          {VIEWS.map((s) => (
            <button
              key={s.v}
              onClick={() => setView(s.v)}
              className={
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' +
                (view === s.v
                  ? 'bg-white text-blue-1200 shadow-sm'
                  : 'text-neutral-1000 hover:text-neutral-1400')
              }
            >
              {s.l}
            </button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setSwapOpen(true)}>
            <ArrowsLeftRight size={12} weight='bold' />
            Request Swap
          </Button>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setAssignOpen(true)}>
            <Plus size={12} weight='bold' />
            Assign Shift
          </Button>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setPatternOpen(true)}>
            <Plus size={12} weight='bold' />
            New Pattern
          </Button>
        </div>
      </div>

      {view === 'roster' && (
        <>
          <RosterGrid shifts={shifts} />

          <div>
            <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
              Assignment Records ({shifts.roster.length})
              <span className='text-neutral-1000 ml-2 text-xs'>
                every roster change behind the grid — overlapping assignments
                are detected and flagged on save
              </span>
            </h3>
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
        </>
      )}

      {view === 'patterns' && (
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Shift Patterns ({shifts.patterns.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              reusable across rosters; new versions supersede from their
              effective date; night shifts cross midnight
            </span>
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Shift</th>
                  <th className='px-2 font-medium'>Timing</th>
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
                    <td className='px-2'>{patternTimeLabel(p)}</td>
                    <td className='px-2'>{p.breakMinutes}m</td>
                    <td className='px-2'>
                      {p.nightShift ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='inline-flex'>
                              <Badge variant='completed'>
                                <Moon size={11} weight='fill' className='mr-1' />
                                Night
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side='top' className='max-w-[240px]'>
                            Crosses midnight: starts at {p.startTime} and ends at{' '}
                            {p.endTime} on the next calendar day. Overtime worked
                            after 00:00 is attributed to the next day.
                          </TooltipContent>
                        </Tooltip>
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
      )}

      {view === 'swaps' && (
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Shift Swap Requests ({shifts.swaps.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              swaps are never applied directly — each one waits for approval;
              this is the same queue as Approvals → Swaps & Overtime
            </span>
          </h3>
          <SwapQueue shifts={shifts} />
        </div>
      )}

      {/* New shift pattern */}
      <Dialog open={patternOpen} onOpenChange={setPatternOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New shift pattern</DialogTitle>
            <DialogDescription>
              For a night shift crossing midnight, set the end time earlier
              than the start time (e.g. 22:00 – 06:00) and tick Night shift.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Shift name'>
              <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder='e.g. Evening 2–11' />
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

      {/* Assign a shift over a date range */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Assign shift to roster</DialogTitle>
            <DialogDescription>
              Covers the whole date range. To change a single day, click that
              day in the week roster instead.
            </DialogDescription>
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
                      {p.name} ({patternTimeLabel(p)})
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

      {/* Swap request raised on behalf of two employees */}
      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Request shift swap</DialogTitle>
            <DialogDescription>
              The swap is NOT applied now — it waits in the approval queue and
              the roster only flips for that day once approved.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Requesting employee'>
                <Select value={sRequester} onValueChange={setSRequester}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select employee' />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label='Swap with'>
                <Select value={sCounterparty} onValueChange={setSCounterparty}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue placeholder='Select colleague' />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEES.filter((e) => e.id !== sRequester).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Shift date'>
                <Input type='date' value={sDate} onChange={(e) => setSDate(e.target.value)} />
              </Field>
              <Field label='Reason'>
                <Input
                  placeholder='e.g. Medical appointment'
                  value={sReason}
                  onChange={(e) => setSReason(e.target.value)}
                />
              </Field>
            </div>
            {sRequester && sCounterparty && sDate && (
              <p className='text-neutral-1000 text-xs'>
                On {fmtDate(sDate)}: {employeeName(sRequester)} works{' '}
                {shifts.shiftForDay(sRequester, sDate)?.name ?? 'no assigned shift'} and{' '}
                {employeeName(sCounterparty)} works{' '}
                {shifts.shiftForDay(sCounterparty, sDate)?.name ?? 'no assigned shift'}.
                Approval swaps the two.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSwapOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSwapRequest}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
