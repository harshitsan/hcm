import { useState } from 'react'
import { PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { type ApprovalWorkflow } from '../data/config'
import { LOCATIONS, employeeById, employeeName, fmtDate, fmtHours } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { OtBadge, StatusBadge } from './badges'
import { DualListTransfer } from './dual-list-transfer'
import { SummaryCards } from './summary-cards'

const OT_APPROVER_ROLES = [
  'Immediate Supervisor',
  'Department Head',
  'Shift In-charge',
  'Plant Head',
  'HR Manager',
]

/**
 * Overtime management (TNA-09/10/25/26/30): the Time engine's accrued OT,
 * the Rules engine decision table + worker-category eligibility, and
 * location-routed approver configurations with the supervisor cap.
 */
export function OvertimeTab({
  attendance,
  config,
}: {
  attendance: AttendanceStore
  config: AttendanceConfigStore
}) {
  const [capDrafts, setCapDrafts] = useState<Record<string, string>>({})
  const [scopeDraft, setScopeDraft] = useState<string[]>(config.otScopeLocations)

  // Add/edit OT approver dialog (OTA-01/02/04)
  const [otaOpen, setOtaOpen] = useState(false)
  const [editingOtaId, setEditingOtaId] = useState<string | null>(null)
  const [oLocations, setOLocations] = useState<string[]>([])
  const [oLevel1, setOLevel1] = useState('Immediate Supervisor')
  const [oLevel2, setOLevel2] = useState('Department Head')
  const [oCap, setOCap] = useState('4')
  const [oEscalate, setOEscalate] = useState('HR Manager')

  const otRecords = attendance.records.filter(
    (r) => r.overtimeHours > 0 && !r.duplicateOfId && r.employeeId !== null
  )
  const byCategory = (cat: string) =>
    Math.round(
      otRecords
        .filter((r) => r.overtimeCategory === cat)
        .reduce((sum, r) => sum + r.overtimeHours, 0) * 100
    ) / 100

  const otWorkflows = config.workflows.filter((w) => w.kind === 'overtime')

  const openNewOta = () => {
    setEditingOtaId(null)
    setOLocations([])
    setOLevel1('Immediate Supervisor')
    setOLevel2('Department Head')
    setOCap('4')
    setOEscalate('HR Manager')
    setOtaOpen(true)
  }

  const openEditOta = (w: ApprovalWorkflow) => {
    setEditingOtaId(w.id)
    setOLocations(
      w.scope === 'Company-wide' ? [] : LOCATIONS.filter((l) => w.scope.includes(l))
    )
    setOLevel1(w.levels[0] ?? 'Immediate Supervisor')
    setOLevel2(w.levels[1] ?? 'None')
    setOCap(String(w.supervisorCapHours ?? 4))
    setOEscalate(w.escalateTo)
    setOtaOpen(true)
  }

  /** OTA-04 — save the approver; Save & Next opens the next OT approver. */
  const saveOta = (continueNext = false) => {
    const cap = Number(oCap)
    if (Number.isNaN(cap) || cap <= 0) {
      toast.error('Supervisor cap must be a positive number of hours')
      return
    }
    const payload = {
      scope:
        oLocations.length === 0 ? 'Company-wide' : `Locations: ${oLocations.join(', ')}`,
      levels: oLevel2 === 'None' ? [oLevel1] : [oLevel1, oLevel2],
      supervisorCapHours: cap,
      escalateTo: oEscalate,
    }
    if (editingOtaId) {
      config.updateWorkflow(editingOtaId, payload)
      if (continueNext) {
        const idx = otWorkflows.findIndex((w) => w.id === editingOtaId)
        const next = otWorkflows[idx + 1]
        if (next) {
          openEditOta(next)
          toast.info(`Next approver configuration: ${next.scope}`)
          return
        }
      }
    } else {
      config.addWorkflow({
        kind: 'overtime',
        slaHours: 48,
        payrollCutoffDay: null,
        ...payload,
      })
    }
    setOtaOpen(false)
  }

  return (
    <div className='w-full space-y-5'>
      {/* Enable overtime (Kensium OT-01) */}
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div>
          <h3 className='text-sm font-medium'>Over Time</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
            When enabled, employees in the assigned scope can log overtime and
            route it for approval; when disabled, no new overtime accrues.
          </p>
        </div>
        <label className='flex items-center gap-2 text-xs'>
          Enable over time
          <Switch
            checked={config.overtimeEnabled}
            onCheckedChange={config.toggleOvertimeEnabled}
          />
        </label>
      </div>

      {/* OT scope transfer list (Kensium OT-03/04) */}
      {config.overtimeEnabled && (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>Overtime Applies To</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-0.5 pb-2'>
            Move locations between the lists to define the scope over time
            applies to.
          </p>
          <DualListTransfer
            options={LOCATIONS}
            assigned={scopeDraft}
            onChange={setScopeDraft}
            availableTitle='Available locations'
            assignedTitle='Overtime-enabled locations'
          />
          <div className='mt-3 flex justify-end gap-2'>
            <Button className='h-7' onClick={() => config.saveOtScopeLocations(scopeDraft)}>
              Save
            </Button>
            <Button
              variant='outline'
              className='h-7'
              onClick={() => {
                config.saveOtScopeLocations(scopeDraft)
                document
                  .getElementById('ot-approvers')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Save & Next — Approvers
            </Button>
          </div>
        </div>
      )}

      <SummaryCards
        title='Overtime — calculated and categorized by the shared engines'
        items={[
          { label: 'Total OT hours', value: fmtHours(attendance.summary.overtimeHours) },
          { label: 'Normal OT', value: fmtHours(byCategory('normal')) },
          { label: 'Holiday OT', value: fmtHours(byCategory('holiday')) },
          { label: 'Night-shift OT', value: fmtHours(byCategory('night-shift')) },
        ]}
      />

      {/* Accrued OT register (TNA-09/25) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Accrued Overtime ({otRecords.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            worked hours beyond standard, categorized by day type and shift;
            finalized OT flows to payroll
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Worker category</th>
                <th className='px-2 font-medium'>Date</th>
                <th className='px-2 font-medium'>Day type</th>
                <th className='px-2 font-medium'>OT hours</th>
                <th className='px-2 font-medium'>Category</th>
                <th className='px-2 font-medium'>Eligible</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {otRecords.map((r) => {
                const emp = employeeById(r.employeeId)
                const eligible = config.otEligibility.find(
                  (e) => e.category === emp?.workerCategory
                )?.eligible
                return (
                  <tr key={r.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{employeeName(r.employeeId)}</td>
                    <td className='px-2'>{emp?.workerCategory ?? '—'}</td>
                    <td className='px-2'>{fmtDate(r.date)}</td>
                    <td className='px-2 capitalize'>{r.dayType}</td>
                    <td className='px-2 font-medium'>{fmtHours(r.overtimeHours)}</td>
                    <td className='px-2'>
                      <OtBadge category={r.overtimeCategory} />
                    </td>
                    <td className='px-2'>
                      {eligible ? (
                        'Yes'
                      ) : (
                        <span className='text-neutral-1000'>No — accrues none</span>
                      )}
                    </td>
                    <td className='px-2'>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Rules engine decision table (TNA-26) */}
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Rules Engine — Decision Table
            <span className='text-neutral-1000 ml-2 text-xs'>
              config-driven categorization, no code changes
            </span>
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Condition</th>
                  <th className='px-2 font-medium'>Category</th>
                  <th className='px-2 font-medium'>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {config.overtimeRules.map((rule) => (
                  <tr key={rule.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>{rule.condition}</td>
                    <td className='px-2'>
                      <OtBadge category={rule.category} />
                    </td>
                    <td className='px-2'>{rule.multiplier}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worker-category eligibility (TNA-10) */}
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Eligibility by Worker Category
            <span className='text-neutral-1000 ml-2 text-xs'>
              ineligible categories are excluded from OT accrual
            </span>
          </h3>
          <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white p-3'>
            {config.otEligibility.map((e) => (
              <div
                key={e.category}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
              >
                <span className='font-medium'>{e.category}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-neutral-1000 text-xs'>
                    {e.eligible ? 'Eligible for overtime' : 'Not eligible'}
                  </span>
                  <Switch
                    checked={e.eligible}
                    onCheckedChange={() => config.toggleOtEligibility(e.category)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OT approvers with location routing + supervisor cap (TNA-30 / OTA-01..04) */}
      <div id='ot-approvers'>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Overtime Approvers ({otWorkflows.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              requests above the supervisor cap require higher authorization;
              edits apply to subsequently submitted requests
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={openNewOta}>
            <Plus size={12} weight='bold' />
            Add Approver
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Applicable locations</th>
                <th className='px-2 font-medium'>Approver hierarchy</th>
                <th className='px-2 font-medium'>Supervisor cap (h)</th>
                <th className='px-2 font-medium'>Version</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {otWorkflows.map((w) => (
                <tr key={w.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{w.scope}</td>
                  <td className='px-2'>{w.levels.join(' → ')}</td>
                  <td className='px-2'>
                    <Input
                      type='number'
                      className='h-7 w-20'
                      value={capDrafts[w.id] ?? String(w.supervisorCapHours ?? 0)}
                      onChange={(e) =>
                        setCapDrafts((prev) => ({ ...prev, [w.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className='px-2'>v{w.version}</td>
                  <td className='px-2 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => {
                          const cap = Number(capDrafts[w.id] ?? w.supervisorCapHours)
                          if (Number.isNaN(cap) || cap <= 0) {
                            toast.error('Cap must be a positive number of hours')
                            return
                          }
                          config.updateWorkflow(w.id, { supervisorCapHours: cap })
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openEditOta(w)}
                      >
                        <PencilSimple size={12} />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / edit over time approver (OTA-01/02/04) */}
      <Dialog open={otaOpen} onOpenChange={setOtaOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editingOtaId ? 'Edit over time approver' : 'Add over time approver'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Applicable locations (empty = company-wide)</Label>
              <MultiSelectDropdown
                items={LOCATIONS.map((l) => ({ id: l, label: l }))}
                selectedIds={oLocations}
                onSelectionChange={setOLocations}
                placeholder='Company-wide'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Level 1 approver</Label>
                <Select value={oLevel1} onValueChange={setOLevel1}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OT_APPROVER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Level 2 approver</Label>
                <Select value={oLevel2} onValueChange={setOLevel2}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='None'>None</SelectItem>
                    {OT_APPROVER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>
                  Max OT hours the immediate supervisor may approve
                </Label>
                <Input
                  type='number'
                  value={oCap}
                  onChange={(e) => setOCap(e.target.value)}
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Escalate unactioned requests to</Label>
                <Input
                  value={oEscalate}
                  onChange={(e) => setOEscalate(e.target.value)}
                  placeholder='HR Manager'
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOtaOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveOta()}>
              {editingOtaId ? 'Save Changes' : 'Save Approver'}
            </Button>
            <Button variant='outline' onClick={() => saveOta(true)}>
              Save & Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
