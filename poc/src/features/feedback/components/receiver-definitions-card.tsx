import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RECEIVER_ROLE_CATALOG } from '../data/config'
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

function joinOrDash(values: string[]) {
  return values.length > 0 ? values.join(', ') : '—'
}

/**
 * Configured Feedback/Grievance receivers plus the Kensium "Add New
 * Feedback/Grievance Receivers" form: cascading Applicable locations →
 * departments → positions → employees, and Applicable roles.
 */
export function ReceiverDefinitionsCard({
  store,
}: {
  store: FeedbackConfigStore
}) {
  const { config } = store
  const [adding, setAdding] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [employees, setEmployees] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])

  /** Departments populate from locations; positions from departments. */
  const departmentOptions = useMemo(
    () => departmentsForLocations(locations),
    [locations]
  )
  const positionOptions = useMemo(
    () => positionsForDepartments(departments),
    [departments]
  )
  const employeeOptions = useMemo(
    () => employeesMatching({ locations, departments, positions }),
    [locations, departments, positions]
  )

  const setLocationsCascade = (next: string[]) => {
    setLocations(next)
    const deps = departmentsForLocations(next)
    const keptDeps = departments.filter((d) => deps.includes(d))
    setDepartments(keptDeps)
    const pos = positionsForDepartments(keptDeps)
    const keptPos = positions.filter((p) => pos.includes(p))
    setPositions(keptPos)
    setEmployees(
      employees.filter((name) =>
        employeesMatching({ locations: next, departments: keptDeps, positions: keptPos }).some(
          (e) => e.name === name
        )
      )
    )
  }

  const setDepartmentsCascade = (next: string[]) => {
    setDepartments(next)
    const pos = positionsForDepartments(next)
    const keptPos = positions.filter((p) => pos.includes(p))
    setPositions(keptPos)
    setEmployees(
      employees.filter((name) =>
        employeesMatching({ locations, departments: next, positions: keptPos }).some(
          (e) => e.name === name
        )
      )
    )
  }

  const resetForm = () => {
    setLocations([])
    setDepartments([])
    setPositions([])
    setEmployees([])
    setRoles([])
  }

  const save = () => {
    const ok = store.addReceiverDef({
      applicableLocations: locations,
      applicableDepartments: departments,
      applicablePositions: positions,
      applicableEmployees: employees,
      applicableRoles: roles,
    })
    if (ok) {
      resetForm()
      setAdding(false)
    }
  }

  return (
    <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
      <CardHeader className='flex-row items-start justify-between px-4'>
        <div>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Configured Feedback/Grievance Receivers
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Receivers can respond to submitted feedback/grievances. Configure
            specific employees, or employees with a specific role, per
            location / department / position scope.
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() => setAdding((a) => !a)}
          className='h-7 gap-1 rounded-[6px] px-2'
        >
          <Plus className='size-3.5' />
          Add New Feedback/Grievance Receivers
        </Button>
      </CardHeader>
      <CardContent className='space-y-4 px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicable locations</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Receiver employees</TableHead>
              <TableHead>Applicable roles</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.receiverDefs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-neutral-1000 text-sm'>
                  No receivers configured — submissions fall back to the
                  receiver role routing below.
                </TableCell>
              </TableRow>
            )}
            {config.receiverDefs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='text-sm'>{joinOrDash(r.applicableLocations)}</TableCell>
                <TableCell className='text-sm'>{joinOrDash(r.applicableDepartments)}</TableCell>
                <TableCell className='text-sm'>{joinOrDash(r.applicablePositions)}</TableCell>
                <TableCell className='text-sm font-medium'>{joinOrDash(r.applicableEmployees)}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {r.applicableRoles.length === 0 && (
                      <span className='text-neutral-1000 text-sm'>—</span>
                    )}
                    {r.applicableRoles.map((role) => (
                      <Badge key={role} variant='open'>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-neutral-1000 text-sm'>
                  {r.addedOn} · {r.addedBy}
                </TableCell>
                <TableCell>
                  <Button
                    variant='icon2'
                    aria-label='Remove receiver'
                    onClick={() => store.removeReceiverDef(r.id)}
                    className='text-neutral-1900 h-7 w-7'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {adding && (
          <div className='border-gray-200 space-y-3 rounded-[8px] border bg-white p-3'>
            <p className='text-neutral-1600 text-sm font-semibold'>
              Add New Feedback/Grievance Receivers
            </p>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <Label className='text-sm'>Applicable locations</Label>
                <MultiSelectDropdown
                  items={toItems([...ORG_LOCATIONS])}
                  selectedIds={locations}
                  onSelectionChange={setLocationsCascade}
                  placeholder='Select location(s)'
                  className='mt-1 w-full'
                />
              </div>
              <div>
                <Label className='text-sm'>Applicable departments</Label>
                <MultiSelectDropdown
                  items={toItems(departmentOptions)}
                  selectedIds={departments}
                  onSelectionChange={setDepartmentsCascade}
                  placeholder='Populated from locations'
                  className='mt-1 w-full'
                />
              </div>
              <div>
                <Label className='text-sm'>Applicable positions</Label>
                <MultiSelectDropdown
                  items={toItems(positionOptions)}
                  selectedIds={positions}
                  onSelectionChange={setPositions}
                  placeholder='Populated from departments'
                  className='mt-1 w-full'
                />
              </div>
              <div>
                <Label className='text-sm'>Applicable employees</Label>
                <MultiSelectDropdown
                  items={employeeOptions.map((e) => ({
                    id: e.name,
                    label: `${e.name} — ${e.position}`,
                  }))}
                  selectedIds={employees}
                  onSelectionChange={setEmployees}
                  placeholder='Select receiver employee(s)'
                  className='mt-1 w-full'
                />
              </div>
              <div>
                <Label className='text-sm'>Applicable roles</Label>
                <MultiSelectDropdown
                  items={toItems([...RECEIVER_ROLE_CATALOG])}
                  selectedIds={roles}
                  onSelectionChange={setRoles}
                  placeholder='Who receives the feedback'
                  className='mt-1 w-full'
                />
              </div>
            </div>
            <div className='flex items-center justify-end gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  resetForm()
                  setAdding(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
