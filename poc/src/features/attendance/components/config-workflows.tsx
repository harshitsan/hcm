import { useMemo, useState } from 'react'
import { ArrowClockwise, LockSimple, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ApprovalWorkflow, type AuditRecurrence, type WorkflowKind } from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITIONS, fmtDate } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

const KIND_LABEL: Record<WorkflowKind, string> = {
  'attendance-correction': 'Attendance Change Requests',
  overtime: 'Overtime',
  'work-from-home': 'Work From Home',
  'shift-swap': 'Shift Swap',
  'comp-off': 'Comp Off',
}

const APPROVER_ROLES = [
  'Immediate Supervisor',
  'HR Manager',
  'Department Head',
  'Shift In-charge',
  'Plant Head',
  'Roster Owner',
]

const ANY = 'Any'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Approval flows and escalation rules for corrections, overtime, comp off,
 * WFH and swaps (TNA-16/39), change-request approvers with the payroll-aligned
 * second level (TNA-43), location/department/position filter search with
 * reset, add/edit/delete approver configurations, and recurring attendance
 * audits (TNA-47) with editable patterns.
 */
export function ConfigWorkflows({
  config,
  onNext,
}: {
  config: AttendanceConfigStore
  onNext?: () => void
}) {
  // Payroll lock date (W8) — freezes attendance corrections for the period
  const [lockDraft, setLockDraft] = useState(config.payrollLock.lockedThrough)

  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState(ANY)
  const [deptFilter, setDeptFilter] = useState(ANY)
  const [posFilter, setPosFilter] = useState(ANY)
  const [slaDrafts, setSlaDrafts] = useState<Record<string, string>>({})
  const [cutoffDrafts, setCutoffDrafts] = useState<Record<string, string>>({})

  // Add/edit approver configuration dialog (CRA-01 / COA-01/03 / OTA-01/04)
  const [wfOpen, setWfOpen] = useState(false)
  const [editingWfId, setEditingWfId] = useState<string | null>(null)
  const [wKind, setWKind] = useState<WorkflowKind>('attendance-correction')
  const [wLocations, setWLocations] = useState<string[]>([])
  const [wLevel1, setWLevel1] = useState('Immediate Supervisor')
  const [wLevel2, setWLevel2] = useState('None')
  const [wSla, setWSla] = useState('48')
  const [wEscalate, setWEscalate] = useState('HR Manager')
  const [wCap, setWCap] = useState('4')
  const [deleteTarget, setDeleteTarget] = useState<ApprovalWorkflow | null>(null)

  // Add/edit audit recurrence dialog (TNA-47 / ARP-03)
  const [auditOpen, setAuditOpen] = useState(false)
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null)
  const [aName, setAName] = useState('')
  const [aSchedule, setASchedule] = useState('Every Monday 06:00')
  const [aLocation, setALocation] = useState<string>('Hyderabad')
  const [aArea, setAArea] = useState('')

  const workflows = useMemo(
    () =>
      config.workflows.filter((w) => {
        const text = `${w.scope} ${w.levels.join(' ')} ${KIND_LABEL[w.kind]}`.toLowerCase()
        if (search.trim() && !text.includes(search.toLowerCase())) return false
        if (
          locFilter !== ANY &&
          !w.scope.includes(locFilter) &&
          w.scope !== 'Company-wide'
        )
          return false
        if (deptFilter !== ANY && !text.includes(deptFilter.toLowerCase())) return false
        if (posFilter !== ANY && !text.includes(posFilter.toLowerCase())) return false
        return true
      }),
    [config.workflows, search, locFilter, deptFilter, posFilter]
  )

  const filtersActive =
    search.trim() !== '' || locFilter !== ANY || deptFilter !== ANY || posFilter !== ANY

  const resetFilters = () => {
    setSearch('')
    setLocFilter(ANY)
    setDeptFilter(ANY)
    setPosFilter(ANY)
    toast.info('Filters reset — showing all approver configurations')
  }

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

  const openNewWorkflow = () => {
    setEditingWfId(null)
    setWKind('attendance-correction')
    setWLocations([])
    setWLevel1('Immediate Supervisor')
    setWLevel2('None')
    setWSla('48')
    setWEscalate('HR Manager')
    setWCap('4')
    setWfOpen(true)
  }

  const openEditWorkflow = (w: ApprovalWorkflow) => {
    setEditingWfId(w.id)
    setWKind(w.kind)
    setWLocations(
      w.scope === 'Company-wide'
        ? []
        : LOCATIONS.filter((l) => w.scope.includes(l))
    )
    setWLevel1(w.levels[0] ?? 'Immediate Supervisor')
    setWLevel2(w.levels[1] ?? 'None')
    setWSla(String(w.slaHours))
    setWEscalate(w.escalateTo)
    setWCap(String(w.supervisorCapHours ?? 4))
    setWfOpen(true)
  }

  const saveWorkflow = (continueNext = false) => {
    const sla = Number(wSla)
    const cap = Number(wCap)
    if (!sla || sla <= 0 || !wEscalate.trim()) {
      toast.error('A positive SLA and an escalation target are required')
      return
    }
    if (wKind === 'overtime' && (Number.isNaN(cap) || cap <= 0)) {
      toast.error('Supervisor cap must be a positive number of hours')
      return
    }
    const levels = wLevel2 === 'None' ? [wLevel1] : [wLevel1, wLevel2]
    const scope =
      wLocations.length === 0 ? 'Company-wide' : `Locations: ${wLocations.join(', ')}`
    const payload = {
      kind: wKind,
      scope,
      levels,
      slaHours: sla,
      escalateTo: wEscalate,
      supervisorCapHours: wKind === 'overtime' ? cap : null,
    }
    if (editingWfId) {
      config.updateWorkflow(editingWfId, payload)
    } else {
      config.addWorkflow({ ...payload, payrollCutoffDay: wKind === 'attendance-correction' ? 25 : null })
    }
    setWfOpen(false)
    if (continueNext) onNext?.()
  }

  const openNewAudit = () => {
    setEditingAuditId(null)
    setAName('')
    setASchedule('Every Monday 06:00')
    setALocation('Hyderabad')
    setAArea('')
    setAuditOpen(true)
  }

  const openEditAudit = (p: AuditRecurrence) => {
    setEditingAuditId(p.id)
    setAName(p.name)
    setASchedule(p.schedule)
    setALocation(p.location)
    setAArea(p.workArea)
    setAuditOpen(true)
  }

  const saveAudit = () => {
    if (!aName.trim() || !aArea.trim()) {
      toast.error('Pattern name and work area are required')
      return
    }
    if (editingAuditId) {
      config.updateAuditPattern(editingAuditId, {
        name: aName,
        schedule: aSchedule,
        location: aLocation,
        workArea: aArea,
      })
    } else {
      config.addAuditPattern({
        name: aName,
        schedule: aSchedule,
        location: aLocation,
        workArea: aArea,
        nextRun: '2026-07-13',
      })
    }
    setAuditOpen(false)
    setAName('')
    setAArea('')
  }

  return (
    <div className='w-full space-y-5'>
      {/* Payroll lock (W8): corrections on or before this date are frozen */}
      <div className='flex flex-wrap items-end justify-between gap-3 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div>
          <h3 className='flex items-center gap-1.5 text-sm font-medium'>
            <LockSimple size={14} weight='fill' />
            Payroll Lock
            <Badge variant='badge_inactive'>
              Locked through {fmtDate(config.payrollLock.lockedThrough)}
            </Badge>
          </h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
            Attendance corrections and overrides for any date on or before the
            lock date are frozen — the period is closed for payroll. Employees
            who try are told to contact HR to unlock. Every change to this date
            is recorded in the audit trail.
          </p>
          <p className='text-neutral-1000 pt-1 text-xs'>
            Last updated by {config.payrollLock.updatedBy} on{' '}
            {fmtDate(config.payrollLock.updatedOn)}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <Field label='Locked through (e.g. 30 Jun 2026)'>
            <Input
              type='date'
              className='h-7 w-[160px]'
              value={lockDraft}
              onChange={(e) => setLockDraft(e.target.value)}
            />
          </Field>
          <Button
            className='h-7'
            disabled={!lockDraft || lockDraft === config.payrollLock.lockedThrough}
            onClick={() => config.savePayrollLock(lockDraft)}
          >
            Save Lock Date
          </Button>
        </div>
      </div>

      <div>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Approval Flows & Escalation Rules ({workflows.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              requests advance level by level to final authorization; unactioned
              requests escalate after the SLA; edits apply to new requests only
            </span>
          </h3>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              className='h-7 gap-1'
              onClick={() =>
                toast.success('Approver configurations refreshed — showing the latest routing')
              }
            >
              <ArrowClockwise size={12} weight='bold' />
              Refresh
            </Button>
            <Button variant='outline' className='h-7 gap-1' onClick={openNewWorkflow}>
              <Plus size={12} weight='bold' />
              Add Approver Config
            </Button>
          </div>
        </div>

        {/* Location / department / position filter search (CRA-02/03) */}
        <div className='mb-3 flex flex-wrap items-end gap-2 rounded-[8px] border border-gray-200 bg-white p-3'>
          <Field label='Search'>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Scope, level or request type…'
              className='h-7 w-[200px]'
            />
          </Field>
          <Field label='Location'>
            <Select value={locFilter} onValueChange={setLocFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any location</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Department'>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any department</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Position'>
            <Select value={posFilter} onValueChange={setPosFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any position</SelectItem>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            variant='outline'
            className='h-7'
            onClick={resetFilters}
            disabled={!filtersActive}
          >
            Reset
          </Button>
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
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='outline'
                      className='h-7 gap-1 px-2 text-xs'
                      onClick={() => openEditWorkflow(w)}
                    >
                      <PencilSimple size={12} />
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      className='h-7 gap-1 px-2 text-xs'
                      onClick={() => setDeleteTarget(w)}
                    >
                      <Trash size={12} />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
              No approver configurations match the current filters.
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
          <Button variant='outline' className='h-7 gap-1' onClick={openNewAudit}>
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
                <th className='px-2 text-right font-medium'>Action</th>
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
                  <td className='px-2 text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => openEditAudit(p)}
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

      {onNext && (
        <div className='flex justify-end'>
          <Button
            className='h-7'
            onClick={() => {
              toast.success('Workflow and approver configuration saved')
              onNext()
            }}
          >
            Save & Next
          </Button>
        </div>
      )}

      {/* Add / edit approver configuration */}
      <Dialog open={wfOpen} onOpenChange={setWfOpen}>
        <DialogContent className='sm:max-w-[460px]'>
          <DialogHeader>
            <DialogTitle>
              {editingWfId ? 'Edit approver configuration' : 'Add approver configuration'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Request type'>
                <Select
                  value={wKind}
                  onValueChange={(v) => setWKind(v as WorkflowKind)}
                  disabled={editingWfId !== null}
                >
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABEL) as WorkflowKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {KIND_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label='Applicable locations (empty = company-wide)'>
                <MultiSelectDropdown
                  items={LOCATIONS.map((l) => ({ id: l, label: l }))}
                  selectedIds={wLocations}
                  onSelectionChange={setWLocations}
                  placeholder='Company-wide'
                />
              </Field>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Level 1 approver'>
                <Select value={wLevel1} onValueChange={setWLevel1}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label='Level 2 approver'>
                <Select value={wLevel2} onValueChange={setWLevel2}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='None'>None</SelectItem>
                    {APPROVER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='SLA (hours)'>
                <Input type='number' value={wSla} onChange={(e) => setWSla(e.target.value)} />
              </Field>
              <Field label='Escalate unactioned requests to'>
                <Input
                  value={wEscalate}
                  onChange={(e) => setWEscalate(e.target.value)}
                  placeholder='HR Manager'
                />
              </Field>
            </div>
            {wKind === 'overtime' && (
              <Field label='Max OT hours the immediate supervisor may approve'>
                <Input type='number' value={wCap} onChange={(e) => setWCap(e.target.value)} />
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWfOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveWorkflow()}>
              {editingWfId ? 'Save Changes' : 'Save Config'}
            </Button>
            {onNext && (
              <Button variant='outline' onClick={() => saveWorkflow(true)}>
                Save & Next
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete approver configuration */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete approver configuration?</DialogTitle>
          </DialogHeader>
          <p className='text-paragraph-sm text-neutral-1000'>
            The {deleteTarget ? KIND_LABEL[deleteTarget.kind] : ''} configuration for{' '}
            {deleteTarget?.scope} will be removed. In-flight requests keep their
            currently assigned approvers.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteTarget) config.deleteWorkflow(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit audit recurrence */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {editingAuditId
                ? 'Edit recurring attendance audit'
                : 'Schedule recurring attendance audit'}
            </DialogTitle>
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
            <Button onClick={saveAudit}>
              {editingAuditId ? 'Save Changes' : 'Schedule Audit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
