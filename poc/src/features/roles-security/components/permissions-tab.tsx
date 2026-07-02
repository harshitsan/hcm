import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APP_MODULES, APP_SCREENS } from '../data/directory'
import { type RolesStore } from '../hooks/use-roles'

const ALL_MODULES = 'All modules'

/**
 * Assign Roles — screen-level permissions (RSEC-33) with a module filter to
 * locate screens efficiently across modules (RSEC-34). "Save & Continue"
 * persists the current assignment and readies the next role.
 */
export function PermissionsTab({ store }: { store: RolesStore }) {
  const [roleId, setRoleId] = useState(store.roles[0]?.id ?? '')
  const [moduleFilter, setModuleFilter] = useState<string>(ALL_MODULES)
  const [checked, setChecked] = useState<string[]>(
    store.roles[0]?.screenIds ?? []
  )

  const role = store.roles.find((r) => r.id === roleId)
  const screens =
    moduleFilter === ALL_MODULES
      ? APP_SCREENS
      : APP_SCREENS.filter((s) => s.module === moduleFilter)

  const selectRole = (id: string) => {
    setRoleId(id)
    setChecked(store.roles.find((r) => r.id === id)?.screenIds ?? [])
  }

  const toggleScreen = (screenId: string, value: boolean) => {
    setChecked((prev) =>
      value ? [...prev, screenId] : prev.filter((id) => id !== screenId)
    )
  }

  const save = () => {
    if (!role) return
    store.setRoleScreens(role.id, checked)
  }

  const saveAndContinue = () => {
    if (!role) return
    store.setRoleScreens(role.id, checked)
    const idx = store.roles.findIndex((r) => r.id === role.id)
    const next = store.roles[(idx + 1) % store.roles.length]
    if (next) {
      selectRole(next.id)
      toast.info(`Ready to assign screens for ${next.name}`)
    }
  }

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-3 text-sm font-medium'>
          Assign Screens to Role
          <span className='text-neutral-1000 ml-2 text-xs'>
            users holding the role can reach only the granted screens — others
            are denied
          </span>
        </h3>
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <div className='w-64'>
            <Select value={roleId} onValueChange={selectRole}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                {store.roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='w-56'>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MODULES}>{ALL_MODULES}</SelectItem>
                {APP_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {moduleFilter !== ALL_MODULES && (
            <Button
              variant='outline'
              className='h-7'
              onClick={() => setModuleFilter(ALL_MODULES)}
            >
              Clear filter
            </Button>
          )}
          <Badge variant='outline'>
            {checked.length} screen{checked.length === 1 ? '' : 's'} granted
            across all modules
          </Badge>
        </div>

        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {screens.map((s) => (
            <label
              key={s.id}
              className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
            >
              <span className='flex items-center gap-2'>
                <Checkbox
                  variant='blue'
                  checked={checked.includes(s.id)}
                  onCheckedChange={(v) => toggleScreen(s.id, !!v)}
                />
                {s.name}
              </span>
              <span className='text-neutral-1000 text-xs'>{s.module}</span>
            </label>
          ))}
        </div>

        <div className='mt-4 flex gap-2'>
          <Button className='h-7' onClick={save} disabled={!role}>
            Save
          </Button>
          <Button
            variant='outline'
            className='h-7'
            onClick={saveAndContinue}
            disabled={!role}
          >
            Save & Continue to next role
          </Button>
        </div>
      </div>

      {role && (
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            Access preview — {role.name}
          </h3>
          <p className='text-neutral-1000 mb-2 text-xs'>
            A user holding this role can open only these screens; attempting
            any other screen is denied. Grants picked from several modules
            combine for the user (RSEC-34).
          </p>
          <div className='flex flex-wrap gap-1'>
            {checked.length > 0 ? (
              APP_SCREENS.filter((s) => checked.includes(s.id)).map((s) => (
                <Badge key={s.id} variant='open'>
                  {s.name}
                </Badge>
              ))
            ) : (
              <span className='text-neutral-1000 text-sm'>
                No screens granted — every screen is denied for this role
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
