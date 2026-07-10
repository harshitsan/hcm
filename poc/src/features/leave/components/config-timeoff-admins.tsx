import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ROLE_TYPES,
  type TimeOffAdminAssignment,
} from '../data/global-settings'
import {
  DEPARTMENTS,
  EMPLOYEES,
  LOCATIONS,
  POSITION_LEVELS,
} from '../data/shared'
import { type GlobalSettingsStore } from '../hooks/use-global-settings'
import { RefreshButton } from './list-controls'

/** Multi-pick pill buttons for applicable locations/departments/positions. */
function PillPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(
      selected.includes(opt)
        ? selected.filter((x) => x !== opt)
        : [...selected, opt]
    )
  return (
    <div>
      <Label className='mb-1 block'>{label}</Label>
      <div className='flex flex-wrap gap-1'>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type='button'
              onClick={() => toggle(opt)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'text-neutral-1600 border-gray-200 bg-white hover:border-blue-600'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const EMPTY_DRAFT: Omit<TimeOffAdminAssignment, 'id'> = {
  roleName: '',
  roleType: 'Time Off Admin',
  description: '',
  applicableLocations: [],
  applicableDepartments: [],
  applicablePositions: [],
  assignedEmployee: '',
}

/**
 * Configuration → Organization → Role: Time Off Admin role assignments.
 * Lists who holds each time-off role (with the locations/departments/
 * positions the role applies to) and lets the admin add, edit or remove
 * assignments via a dialog mirroring the PDF's 7-field Role form.
 */
export function ConfigTimeOffAdmins({ store }: { store: GlobalSettingsStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TimeOffAdminAssignment | null>(null)
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const openForm = (a: TimeOffAdminAssignment | null) => {
    setEditing(a)
    setDraft(a ? { ...a } : EMPTY_DRAFT)
    setOpen(true)
  }

  const save = () => {
    if (!draft.roleName.trim()) {
      toast.error('Enter the role name')
      return
    }
    if (!draft.assignedEmployee) {
      toast.error('Select the employee to assign the role to')
      return
    }
    if (
      draft.applicableLocations.length === 0 ||
      draft.applicableDepartments.length === 0
    ) {
      toast.error('Pick at least one applicable location and department')
      return
    }
    if (editing) store.updateAdmin(editing.id, draft)
    else store.addAdmin(draft)
    setOpen(false)
    setEditing(null)
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className='w-full space-y-5'>
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Time Off Admin Roles
            <span className='text-neutral-1000 ml-2 text-xs'>
              admins are notified of all time-off requests and can approve,
              reject or assign time off for any employee
            </span>
          </h3>
          <span className='flex items-center gap-2'>
            <RefreshButton label='Time off admin roles' />
            <Button
              variant='outline'
              className='h-7 gap-1'
              onClick={() => openForm(null)}
            >
              <Plus size={12} weight='bold' />
              Add role assignment
            </Button>
          </span>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          {store.admins.length === 0 ? (
            <p className='text-neutral-1000 py-4 text-center text-sm'>
              No time-off roles assigned — employee requests cannot be
              administered. Add a role assignment to complete configuration.
            </p>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Role name</th>
                  <th className='px-2 font-medium'>Type</th>
                  <th className='px-2 font-medium'>Locations</th>
                  <th className='px-2 font-medium'>Departments</th>
                  <th className='px-2 font-medium'>Positions</th>
                  <th className='px-2 font-medium'>Employee</th>
                  <th className='px-2 text-right font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {store.admins.map((a) => (
                  <tr key={a.id} className='border-b align-top last:border-0'>
                    <td className='py-2 pr-3'>
                      <p className='font-medium'>{a.roleName}</p>
                      <p className='text-paragraph-sm text-neutral-1000 max-w-[260px]'>
                        {a.description}
                      </p>
                    </td>
                    <td className='px-2'>{a.roleType}</td>
                    <td className='px-2'>{a.applicableLocations.join(', ')}</td>
                    <td className='px-2'>
                      {a.applicableDepartments.join(', ')}
                    </td>
                    <td className='px-2'>
                      {a.applicablePositions.join(', ') || '—'}
                    </td>
                    <td className='px-2 font-medium'>{a.assignedEmployee}</td>
                    <td className='px-2 text-right'>
                      <span className='inline-flex gap-1'>
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => openForm(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          className='text-destructive h-6 px-2 text-xs'
                          onClick={() => store.removeAdmin(a.id)}
                        >
                          Remove
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit role assignment' : 'Add role assignment'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Role name</Label>
              <Input
                value={draft.roleName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, roleName: e.target.value }))
                }
                placeholder='e.g. India Time Off Admin'
              />
            </div>
            <div className='space-y-1'>
              <Label>Role type</Label>
              <Select
                value={draft.roleType}
                onValueChange={(v) =>
                  setDraft((prev) => ({
                    ...prev,
                    roleType: v as (typeof ROLE_TYPES)[number],
                  }))
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-paragraph-sm text-neutral-1000'>
                The same role type can be assigned to different role names as
                per the need of the organization.
              </p>
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                placeholder='Describe the responsibilities of this role'
              />
            </div>
            <PillPicker
              label='Applicable locations'
              options={LOCATIONS}
              selected={draft.applicableLocations}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, applicableLocations: next }))
              }
            />
            <PillPicker
              label='Applicable departments'
              options={DEPARTMENTS}
              selected={draft.applicableDepartments}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, applicableDepartments: next }))
              }
            />
            <PillPicker
              label='Applicable positions'
              options={POSITION_LEVELS}
              selected={draft.applicablePositions}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, applicablePositions: next }))
              }
            />
            <div className='space-y-1'>
              <Label>Applicable employee</Label>
              <Select
                value={draft.assignedEmployee || undefined}
                onValueChange={(v) =>
                  setDraft((prev) => ({ ...prev, assignedEmployee: v }))
                }
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select the employee to assign' />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.filter((e) => e.active).map((e) => (
                    <SelectItem key={e.id} value={e.name}>
                      {e.name} — {e.department}, {e.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>
              {editing ? 'Save changes' : 'Save role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
