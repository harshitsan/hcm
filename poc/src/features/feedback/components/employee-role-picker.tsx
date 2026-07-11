import { useMemo, useState } from 'react'
import { UsersRound, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  employeesMatching,
  ORG_LOCATIONS,
  ORG_ROLES,
} from '../data/org'

export const ROLE_SUFFIX = ' (role)'

interface EmployeeRolePickerProps {
  label: string
  /** Employee names, and roles suffixed with " (role)". */
  value: string[]
  onChange: (value: string[]) => void
  hint?: string
  /** The anonymous public form only offers "Select/Deselect Employees". */
  employeesOnly?: boolean
}

/**
 * Kensium "Select/De-select Employees" picker: choose Employee to target
 * specific employees via the Applicable location → Roles → Employees cascade,
 * or Role to address every employee holding a specific role.
 */
export function EmployeeRolePicker({
  label,
  value,
  onChange,
  hint,
  employeesOnly = false,
}: EmployeeRolePickerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'Employee' | 'Role'>('Employee')
  const [location, setLocation] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const matchingEmployees = useMemo(
    () =>
      employeesMatching({
        locations: location === 'all' ? [] : [location],
        roles: roleFilter === 'all' ? [] : [roleFilter],
      }),
    [location, roleFilter]
  )

  const toggle = (item: string) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item]
    )
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>{label}</Label>
        <Button
          type='button'
          variant='outline'
          onClick={() => setOpen((o) => !o)}
          className='h-7 gap-1 rounded-[6px] px-2 text-xs'
        >
          <UsersRound className='size-3.5' />
          {open ? 'Done' : 'Select / De-select Employees'}
        </Button>
      </div>
      {hint && (
        <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>{hint}</p>
      )}

      {value.length > 0 ? (
        <div className='mt-1.5 flex flex-wrap gap-1.5'>
          {value.map((v) => (
            <Badge key={v} variant='open' className='gap-1 pr-1'>
              {v}
              <button
                type='button'
                aria-label={`Remove ${v}`}
                onClick={() => toggle(v)}
                className='hover:text-red-1400 rounded-full'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className='text-neutral-1000 mt-1.5 text-xs'>None selected</p>
      )}

      {open && (
        <div className='border-gray-200 mt-2 space-y-3 rounded-[6px] border bg-white p-3'>
          {!employeesOnly && (
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as 'Employee' | 'Role')}
              className='flex items-center gap-4'
            >
              {(['Employee', 'Role'] as const).map((m) => (
                <label key={m} className='flex items-center gap-2 text-sm'>
                  <RadioGroupItem value={m} />
                  {m}
                  <span className='text-neutral-1000 text-xs'>
                    {m === 'Employee'
                      ? '— send to specific employee(s)'
                      : '— address by a role in the organization'}
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}

          {(employeesOnly || mode === 'Employee') && (
            <>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-xs'>Applicable location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger variant='secondary' className='mt-1 w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All locations</SelectItem>
                      {ORG_LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className='text-xs'>Roles</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger variant='secondary' className='mt-1 w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All roles</SelectItem>
                      {ORG_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className='text-xs'>Employees</Label>
                <ul className='border-gray-200 mt-1 max-h-40 overflow-y-auto rounded-[6px] border p-1'>
                  {matchingEmployees.length === 0 && (
                    <li className='text-neutral-1000 px-2 py-1 text-sm'>
                      No employees match the selected criteria
                    </li>
                  )}
                  {matchingEmployees.map((e) => (
                    <li key={e.id}>
                      <label className='hover:bg-neutral-200 flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm'>
                        <Checkbox
                          variant='blue'
                          checked={value.includes(e.name)}
                          onCheckedChange={() => toggle(e.name)}
                        />
                        <span className='text-neutral-1900'>{e.name}</span>
                        <span className='text-neutral-1000 text-xs'>
                          {e.position} · {e.department} · {e.location}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!employeesOnly && mode === 'Role' && (
            <div>
              <Label className='text-xs'>
                Applicable roles (all employees holding the role)
              </Label>
              <ul className='border-gray-200 mt-1 max-h-40 overflow-y-auto rounded-[6px] border p-1'>
                {ORG_ROLES.map((r) => {
                  const item = `${r}${ROLE_SUFFIX}`
                  return (
                    <li key={r}>
                      <label className='hover:bg-neutral-200 flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm'>
                        <Checkbox
                          variant='blue'
                          checked={value.includes(item)}
                          onCheckedChange={() => toggle(item)}
                        />
                        {r}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
