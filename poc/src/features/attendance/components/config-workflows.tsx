import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { type WorkflowKind } from '../data/config'
import { LOCATIONS, fmtDate } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

const KIND_LABEL: Record<WorkflowKind, string> = {
  'attendance-correction': 'Attendance Change Requests',
  overtime: 'Overtime',
  'work-from-home': 'Work From Home',
  'shift-swap': 'Shift Swap',
}

/**
 * Approval flows and escalation rules for corrections, overtime, WFH and
 * swaps (TNA-16/39), change-request approvers with the payroll-aligned
 * second level (TNA-43), and recurring attendance audits (TNA-47).
 */
export function ConfigWorkflows({ config }: { config: AttendanceConfigStore }) {
  const [search, setSearch] = useState('')
  const [slaDrafts, setSlaDrafts] = useState<Record<string, string>>({})
  const [cutoffDrafts, setCutoffDrafts] = useState<Record<string, string>>({})

  const [auditOpen, setAuditOpen] = useState(false)
  const [aName, setAName] = useState('')
  const [aSchedule, setASchedule] = useState('Every Monday 06:00')
  const [aLocation, setALocation] = useState<string>('Hyderabad')
  const [aArea, setAArea] = useState('')

  const workflows = useMemo(
    () =>
      config.workflows.filter(
        (w) =>
          !search.trim() ||
          w.scope.toLowerCase().includes(search.toLowerCase()) ||
          KIND_LABEL[w.kind].toLowerCase().includes(search.toLowerCase())
      ),
    [config.workflows, search]
  )

  const saveSla = (id: string, current: number) => {
    const sla = Number(slaDrafts[id] ?? current)
    if (!sla || sla <= 0) {
      toast.error('SLA must be a positive number of hours')
      return
    }
    config.updateWorkflow(id, { slaHours: sla })
  }

  const saveCutoff = (id: string, current: number | null) => {
    const day = Number(cutoffDrafts[id] ?? current ?? 25)
    if (!day || day < 1 || day > 31) {
      toast.error('Payroll cut-off day must be between 1 and 31')
      return
    }
    config.updateWorkflow(id, { payrollCutoffDay: day })
  }

  const saveAudit = () => {
    if (!aName.trim() || !aArea.trim()) {
      toast.error('Pattern name and work area are required')
      return
    }
    config.addAuditPattern({
      name: aName,
      schedule: aSchedule,
      location: aLocation,
      workArea: aArea,
      nextRun: '2026-07-06',
    })
    setAuditOpen(false)
    setAName('')
    setAArea('')
  }

  return (
    <div className='w-full space-y-5'>
      <div>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Approval Flows & Escalation Rules ({workflows.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              requests advance level by level to final authorization; unactioned
              requests escalate after the SLA; edits apply to new requests only
            </span>
          </h3>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by scope or request type…'
            className='h-7 w-[240px]'
          />
        </div>
        <div className='space-y-3'>
          {workflows.map((w) => (
            <div key={w.id} className='rounded-[8px] border border-gray-200 bg-white p-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <p className='text-sm font-medium'>
                    {KIND_LABEL[w.kind]}
                    <Badge variant='open' className='ml-2'>
                      v{w.version} · effective {fmtDate(w.effectiveFrom)}
                    </Badge>
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                    Applicability: {w.scope}
                  </p>
                  <p className='text-paragraph-sm pt-1'>
                    Approver levels: <span className='font-medium'>{w.levels.join(' → ')}</span>
                    {' · '}escalates to <span className='font-medium'>{w.escalateTo}</span>
                    {w.supervisorCapHours !== null &&
                      ` · supervisor cap ${w.supervisorCapHours}h`}
                  </p>
                </div>
                <div className='flex flex-wrap items-end gap-3'>
                  <div className='flex flex-col gap-1'>
                    <Label className='text-xs'>SLA (hours)</Label>
                    <div className='flex items-center gap-1.5'>
                      <Input
                        type='number'
                        className='h-7 w-20'
                        value={slaDrafts[w.id] ?? String(w.slaHours)}
                        onChange={(e) =>
                          setSlaDrafts((prev) => ({ ...prev, [w.id]: e.target.value }))
                        }
                      />
                      <Button
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        onClick={() => saveSla(w.id, w.slaHours)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  {w.kind === 'attendance-correction' && (
                    <div className='flex flex-col gap-1'>
                      <Label className='text-xs'>
                        Payroll cut-off day (later requests need 2nd level)
                      </Label>
                      <div className='flex items-center gap-1.5'>
                        <Input
                          type='number'
                          className='h-7 w-20'
                          value={cutoffDrafts[w.id] ?? String(w.payrollCutoffDay ?? 25)}
                          onChange={(e) =>
                            setCutoffDrafts((prev) => ({ ...prev, [w.id]: e.target.value }))
                          }
                        />
                        <Button
                          variant='outline'
                          className='h-7 px-2 text-xs'
                          onClick={() => saveCutoff(w.id, w.payrollCutoffDay)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
              No approver configurations match “{search}”.
            </p>
          )}
        </div>
      </div>

      {/* Audit recurrence (TNA-47) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Audit Recurrence Patterns ({config.auditPatterns.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              attendance audits run automatically for the location and work area
              when the scheduled time is reached
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setAuditOpen(true)}>
            <Plus size={12} weight='bold' />
            Add Pattern
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Pattern</th>
                <th className='px-2 font-medium'>Recurrence</th>
                <th className='px-2 font-medium'>Location</th>
                <th className='px-2 font-medium'>Work area</th>
                <th className='px-2 font-medium'>Last run</th>
                <th className='px-2 font-medium'>Next run</th>
              </tr>
            </thead>
            <tbody>
              {config.auditPatterns.map((p) => (
                <tr key={p.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{p.name}</td>
                  <td className='px-2'>{p.schedule}</td>
                  <td className='px-2'>{p.location}</td>
                  <td className='px-2'>{p.workArea}</td>
                  <td className='px-2'>{p.lastRun ? fmtDate(p.lastRun) : 'Never'}</td>
                  <td className='px-2'>{fmtDate(p.nextRun)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Schedule recurring attendance audit</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Pattern name</Label>
              <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder='Tower A nightly audit' />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Recurrence schedule</Label>
              <Select value={aSchedule} onValueChange={setASchedule}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Every Monday 06:00'>Every Monday 06:00</SelectItem>
                  <SelectItem value='Daily 22:00'>Daily 22:00</SelectItem>
                  <SelectItem value='Last day of month 20:00'>Last day of month 20:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Location</Label>
                <Select value={aLocation} onValueChange={setALocation}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Work area</Label>
                <Input value={aArea} onChange={(e) => setAArea(e.target.value)} placeholder='Tower A' />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAuditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAudit}>Schedule Audit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
