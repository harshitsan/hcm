import { useState } from 'react'
import { ArrowClockwise, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import { type AuditorsGroup, type SampleMethod } from '../data/config'
import { EMPLOYEES, LOCATIONS } from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'

const SAMPLE_METHODS: SampleMethod[] = ['Random', 'Stratified', 'Top violators first']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Attendance audit setup (Kensium ACS + AAG): org-wide audit configuration
 * settings (enable, sampling method, habitual-violator thresholds, reschedule
 * limits) and the auditors groups that audit attendance per location.
 */
export function ConfigAudit({
  config,
  onNext,
}: {
  config: AttendanceConfigStore
  onNext?: () => void
}) {
  // -------- Audit configuration settings draft (ACS-01..06)
  const [draft, setDraft] = useState(config.auditSettings)
  const [dirty, setDirty] = useState(false)

  const patch = (changes: Partial<typeof draft>) => {
    setDraft((prev) => ({ ...prev, ...changes }))
    setDirty(true)
  }

  const saveSettings = () => {
    if (
      draft.historyPeriodMonths <= 0 ||
      draft.minReprimands <= 0 ||
      draft.maxReschedules < 0 ||
      draft.employeeListLeadDays < 0
    ) {
      toast.error('Thresholds must be positive numbers')
      return
    }
    config.saveAuditSettings(draft)
    setDirty(false)
  }

  const cancelSettings = () => {
    setDraft(config.auditSettings)
    setDirty(false)
    toast.info('Changes discarded — audit configuration restored to the last saved values')
  }

  // -------- Auditors group dialog (AAG-01/03)
  const [groupOpen, setGroupOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [gPanel, setGPanel] = useState('')
  const [gDescription, setGDescription] = useState('')
  const [gLocation, setGLocation] = useState<string>('Hyderabad')
  const [gMembers, setGMembers] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AuditorsGroup | null>(null)

  const openNewGroup = () => {
    setEditingId(null)
    setGPanel('')
    setGDescription('')
    setGLocation('Hyderabad')
    setGMembers([])
    setGroupOpen(true)
  }

  const openEditGroup = (g: AuditorsGroup) => {
    setEditingId(g.id)
    setGPanel(g.panelName)
    setGDescription(g.description)
    setGLocation(g.location)
    setGMembers(g.members)
    setGroupOpen(true)
  }

  const saveGroup = () => {
    if (!gPanel.trim() || gMembers.length === 0) {
      toast.error('Panel name and at least one panel member are required')
      return
    }
    const payload = {
      panelName: gPanel,
      description: gDescription,
      location: gLocation,
      members: gMembers,
    }
    if (editingId) {
      config.updateAuditorsGroup(editingId, payload)
    } else {
      config.addAuditorsGroup(payload)
    }
    setGroupOpen(false)
  }

  const memberItems = EMPLOYEES.map((e) => ({ id: e.name, label: `${e.name} (${e.location})` }))

  return (
    <div className='w-full space-y-5'>
      {/* Audit Configuration Settings (ACS-01..06) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h3 className='text-sm font-medium'>Audit Configuration Settings</h3>
            <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
              Governs how periodic attendance audits draw their samples and how
              habitual violators are identified.
            </p>
          </div>
          <label className='flex items-center gap-2 text-xs'>
            Support attendance audit
            <Switch
              checked={draft.auditEnabled}
              onCheckedChange={(v) => patch({ auditEnabled: v })}
            />
          </label>
        </div>

        {draft.auditEnabled && (
          <div className='mt-3 grid gap-4 lg:grid-cols-3'>
            <Field label='Sample data selection method'>
              <Select
                value={draft.sampleMethod}
                onValueChange={(v) => patch({ sampleMethod: v as SampleMethod })}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <label className='mt-5 flex items-center gap-2 text-sm lg:col-span-2'>
              <Switch
                checked={draft.includeHabitualViolators}
                onCheckedChange={(v) => patch({ includeHabitualViolators: v })}
              />
              Automatically include habitual violators in each audit
            </label>
            <Field label='History period considered (months)'>
              <Input
                type='number'
                value={String(draft.historyPeriodMonths)}
                onChange={(e) => patch({ historyPeriodMonths: Number(e.target.value) })}
                disabled={!draft.includeHabitualViolators}
              />
            </Field>
            <Field label='Minimum reprimands to be habitual'>
              <Input
                type='number'
                value={String(draft.minReprimands)}
                onChange={(e) => patch({ minReprimands: Number(e.target.value) })}
                disabled={!draft.includeHabitualViolators}
              />
            </Field>
            <div />
            <Field label='Max times a user can reschedule an audit'>
              <Input
                type='number'
                value={String(draft.maxReschedules)}
                onChange={(e) => patch({ maxReschedules: Number(e.target.value) })}
              />
            </Field>
            <Field label='Employee list can be generated (days before audit)'>
              <Input
                type='number'
                value={String(draft.employeeListLeadDays)}
                onChange={(e) => patch({ employeeListLeadDays: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}

        <div className='mt-4 flex items-center justify-end gap-2'>
          <Button variant='outline' className='h-7' onClick={cancelSettings} disabled={!dirty}>
            Cancel
          </Button>
          <Button className='h-7' onClick={saveSettings}>
            Save Settings
          </Button>
          {onNext && (
            <Button
              variant='outline'
              className='h-7'
              onClick={() => {
                saveSettings()
                onNext()
              }}
            >
              Save & Next
            </Button>
          )}
        </div>
      </div>

      {/* Attendance Auditors Groups (AAG-01..04) */}
      <div>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Attendance Auditors Groups ({config.auditorsGroups.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              each panel audits attendance for its applicable location
            </span>
          </h3>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              className='h-7 gap-1'
              onClick={config.refreshAuditorsGroups}
            >
              <ArrowClockwise size={12} weight='bold' />
              Refresh
            </Button>
            <Button variant='outline' className='h-7 gap-1' onClick={openNewGroup}>
              <Plus size={12} weight='bold' />
              Add Group
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Panel name</th>
                <th className='px-2 font-medium'>Description</th>
                <th className='px-2 font-medium'>Applicable location</th>
                <th className='px-2 font-medium'>Panel members</th>
                <th className='px-2 text-right font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {config.auditorsGroups.map((g) => (
                <tr key={g.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{g.panelName}</td>
                  <td className='px-2'>{g.description || '—'}</td>
                  <td className='px-2'>{g.location}</td>
                  <td className='px-2'>{g.members.join(', ')}</td>
                  <td className='px-2 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openEditGroup(g)}
                      >
                        <PencilSimple size={12} />
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => setDeleteTarget(g)}
                      >
                        <Trash size={12} />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {config.auditorsGroups.length === 0 && (
                <tr>
                  <td colSpan={5} className='text-neutral-1000 py-3 text-center text-sm'>
                    No auditors groups configured yet — add a panel to start auditing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / edit auditors group */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit auditors group' : 'Add auditors group'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Field label='Panel name'>
              <Input
                value={gPanel}
                onChange={(e) => setGPanel(e.target.value)}
                placeholder='e.g. BLR Audit Panel'
              />
            </Field>
            <Field label='Description'>
              <Input
                value={gDescription}
                onChange={(e) => setGDescription(e.target.value)}
                placeholder='Audits attendance for the Bengaluru offices'
              />
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Applicable location'>
                <Select value={gLocation} onValueChange={setGLocation}>
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
              </Field>
              <Field label='Panel members'>
                <MultiSelectDropdown
                  items={memberItems}
                  selectedIds={gMembers}
                  onSelectionChange={setGMembers}
                  placeholder='Select auditors'
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGroup}>{editingId ? 'Save Changes' : 'Save Group'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Delete auditors group?</DialogTitle>
          </DialogHeader>
          <p className='text-paragraph-sm text-neutral-1000'>
            “{deleteTarget?.panelName}” will no longer audit attendance for{' '}
            {deleteTarget?.location}. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteTarget) config.deleteAuditorsGroup(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
