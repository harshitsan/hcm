import { useMemo, useState } from 'react'
import { UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { ROLE_TYPES } from '../data/config'
import {
  departmentsForLocations,
  employeesMatching,
  ORG_LOCATIONS,
  positionsForDepartments,
} from '../data/org'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'

function toItems(values: string[]) {
  return values.map((v) => ({ id: v, label: v }))
}

/**
 * Feedback Coordinator role (Kensium: Configuration > Organization > Role):
 * role name, type, description, and the applicable location → department →
 * position cascade plus the employee assigned the role. The coordinator can
 * mark feedback/grievances received or closed on behalf of any employee and
 * views/manages anonymous submissions.
 */
export function CoordinatorRoleCard({ store }: { store: FeedbackConfigStore }) {
  const def = store.config.coordinatorRole
  const [roleName, setRoleName] = useState(def.roleName)
  const [roleType, setRoleType] = useState(def.roleType)
  const [description, setDescription] = useState(def.description)
  const [locations, setLocations] = useState(def.applicableLocations)
  const [departments, setDepartments] = useState(def.applicableDepartments)
  const [positions, setPositions] = useState(def.applicablePositions)
  const [employee, setEmployee] = useState(def.applicableEmployee ?? '')

  /** Cascade: departments populate from locations, positions from departments. */
  const departmentOptions = useMemo(
    () => departmentsForLocations(locations),
    [locations]
  )
  const positionOptions = useMemo(
    () => positionsForDepartments(departments),
    [departments]
  )
  const employeeOptions = useMemo(
    () =>
      employeesMatching({
        locations,
        departments,
        positions,
      }),
    [locations, departments, positions]
  )

  const setLocationsCascade = (next: string[]) => {
    setLocations(next)
    const deps = departmentsForLocations(next)
    const keptDeps = departments.filter((d) => deps.includes(d))
    setDepartments(keptDeps)
    setPositions(positions.filter((p) => positionsForDepartments(keptDeps).includes(p)))
  }

  const setDepartmentsCascade = (next: string[]) => {
    setDepartments(next)
    setPositions(positions.filter((p) => positionsForDepartments(next).includes(p)))
  }

  const save = () => {
    store.saveCoordinatorRole({
      roleName,
      roleType,
      description,
      applicableLocations: locations,
      applicableDepartments: departments,
      applicablePositions: positions,
      applicableEmployee: employee || null,
    })
  }

  const cancel = () => {
    setRoleName(def.roleName)
    setRoleType(def.roleType)
    setDescription(def.description)
    setLocations(def.applicableLocations)
    setDepartments(def.applicableDepartments)
    setPositions(def.applicablePositions)
    setEmployee(def.applicableEmployee ?? '')
    toast.info('Unsaved Coordinator Role changes discarded')
  }

  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <UserCog className='size-4' />
          Feedback Coordinator Role (Organization &gt; Role)
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          The Feedback/Grievance Coordinator can (1) mark entries as received
          or closed on behalf of any employee, and (2) view and manage
          anonymous feedback/grievances.
        </p>
      </CardHeader>
      <CardContent className='space-y-3 px-4'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          <div>
            <Label className='text-sm'>Role name</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder='Enter the required role name'
              className='mt-1'
            />
          </div>
          <div>
            <Label className='text-sm'>Role type</Label>
            <Select value={roleType} onValueChange={setRoleType}>
              <SelectTrigger variant='secondary' className='mt-1 w-full'>
                <SelectValue placeholder='Select the role type' />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              The same role type can be assigned to different role names.
            </p>
          </div>
        </div>

        <div>
          <Label className='text-sm'>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder='Enter the description of the role'
            className='mt-1'
          />
        </div>

        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div>
            <Label className='text-sm'>Applicable location</Label>
            <MultiSelectDropdown
              items={toItems([...ORG_LOCATIONS])}
              selectedIds={locations}
              onSelectionChange={setLocationsCascade}
              placeholder='Select location(s)'
              className='mt-1 w-full'
            />
          </div>
          <div>
            <Label className='text-sm'>Applicable department</Label>
            <MultiSelectDropdown
              items={toItems(departmentOptions)}
              selectedIds={departments}
              onSelectionChange={setDepartmentsCascade}
              placeholder='Select department(s)'
              className='mt-1 w-full'
            />
          </div>
          <div>
            <Label className='text-sm'>Applicable position</Label>
            <MultiSelectDropdown
              items={toItems(positionOptions)}
              selectedIds={positions}
              onSelectionChange={setPositions}
              placeholder='Select position(s)'
              className='mt-1 w-full'
            />
          </div>
        </div>

        <div>
          <Label className='text-sm'>Applicable employee</Label>
          <Select value={employee} onValueChange={setEmployee}>
            <SelectTrigger variant='secondary' className='mt-1 w-full'>
              <SelectValue placeholder='Select the employee to assign as coordinator' />
            </SelectTrigger>
            <SelectContent>
              {(employeeOptions.length > 0
                ? employeeOptions
                : employeesMatching({})
              ).map((e) => (
                <SelectItem key={e.id} value={e.name}>
                  {e.name} — {e.position}, {e.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-paragraph-sm text-neutral-1000 mt-1'>
            The employee for whom the Feedback Coordinator role is assigned.
          </p>
        </div>

        <div className='flex items-center justify-end gap-3'>
          <Button variant='outline' onClick={cancel}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}
