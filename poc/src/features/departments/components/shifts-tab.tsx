import { useMemo, useState } from 'react'
import { Warning } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLES, useRole, type Role } from '@/context/role-context'
import { CURRENT_COMPANY_ID } from '../data/departments'
import { LOCATIONS, SHIFTS, WEEK_DAYS, WORK_AREAS, type WeekDay } from '../data/org-config'
import { type DepartmentsStore } from '../hooks/use-departments'
import { DefaultShiftBadge } from './department-badges'

interface ShiftsTabProps {
  store: DepartmentsStore
}

/**
 * Per-department scheduling & sites: assigned shifts + default shift
 * (DEPT-29), weekly offs (DEPT-30), role-restricted roster visibility
 * (DEPT-31) and work areas within mapped locations (DEPT-28/27).
 */
export function ShiftsTab({ store }: ShiftsTabProps) {
  const { role, hasRole } = useRole()
  const canManage = hasRole('Company Admin')

  const companyDepts = useMemo(
    () => store.departments.filter((d) => d.companyId === CURRENT_COMPANY_ID),
    [store.departments]
  )
  const [deptId, setDeptId] = useState(companyDepts[0]?.id ?? '')
  const dept = companyDepts.find((d) => d.id === deptId) ?? companyDepts[0]
  // Local demo override of each shift's weekly offs (per department view).
  const [offsOverride, setOffsOverride] = useState<Record<string, WeekDay[]>>({})

  if (!dept) return <p className='text-neutral-1000 text-sm'>No departments available.</p>

  const rosterVisible = dept.rosterVisibleTo.includes(role)
  const retiredLocations = dept.locationIds
    .map((id) => LOCATIONS.find((l) => l.id === id))
    .filter((l) => l?.retired)

  const toggleShift = (shiftId: string, checked: boolean) => {
    const shiftIds = checked
      ? [...dept.shiftIds, shiftId]
      : dept.shiftIds.filter((id) => id !== shiftId)
    const defaultShiftId =
      !checked && dept.defaultShiftId === shiftId ? (shiftIds[0] ?? null) : dept.defaultShiftId
    store.patchDepartment(
      dept.id,
      { shiftIds, defaultShiftId },
      'shifts updated',
      `${SHIFTS.find((s) => s.id === shiftId)?.name} ${checked ? 'assigned to' : 'removed from'} ${dept.name}.`
    )
  }

  const toggleWorkArea = (waId: string, checked: boolean) => {
    store.patchDepartment(
      dept.id,
      {
        workAreaIds: checked
          ? [...dept.workAreaIds, waId]
          : dept.workAreaIds.filter((id) => id !== waId),
      },
      'work areas updated',
      `Work-area mapping changed for ${dept.name}.`
    )
  }

  const toggleRosterRole = (r: Role, checked: boolean) => {
    store.patchDepartment(
      dept.id,
      {
        rosterVisibleTo: checked
          ? [...dept.rosterVisibleTo, r]
          : dept.rosterVisibleTo.filter((v) => v !== r),
      },
      'roster visibility updated',
      `Shift roster of ${dept.name} now visible to: ${(checked ? [...dept.rosterVisibleTo, r] : dept.rosterVisibleTo.filter((v) => v !== r)).join(', ') || 'no one'}.`
    )
  }

  const offsFor = (shiftId: string): WeekDay[] =>
    offsOverride[`${dept.id}:${shiftId}`] ??
    SHIFTS.find((s) => s.id === shiftId)?.weeklyOffs ??
    []

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <span className='text-neutral-1600 text-sm font-medium'>Department</span>
        <Select value={dept.id} onValueChange={setDeptId}>
          <SelectTrigger variant='secondary' className='w-[280px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {companyDepts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} ({d.acronym || d.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {retiredLocations.length > 0 && (
        <div className='bg-vanilla-400/40 text-vanilla-500 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm'>
          <Warning size={16} weight='bold' />
          {retiredLocations.map((l) => l?.name).join(', ')} has been retired — this
          department is flagged for site reassignment.
        </div>
      )}

      {!rosterVisible ? (
        <Card className='border-gray-200'>
          <CardContent className='py-6'>
            <p className='text-neutral-1000 text-sm'>
              The shift roster of {dept.name} is hidden for your role ({role}). Ask a
              Company Admin to grant your role visibility.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          <Card className='border-gray-200'>
            <CardHeader>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                Assigned shifts & weekly offs
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {SHIFTS.map((shift) => {
                const assigned = dept.shiftIds.includes(shift.id)
                return (
                  <div key={shift.id} className='rounded-md border border-gray-200 p-3'>
                    <div className='flex items-center gap-2'>
                      <Checkbox
                        variant='blue'
                        checked={assigned}
                        disabled={!canManage}
                        onCheckedChange={(checked) => toggleShift(shift.id, !!checked)}
                      />
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {shift.name}
                      </span>
                      <span className='text-neutral-1000 text-xs'>
                        {shift.startTime}–{shift.endTime} · {shift.durationHours}h
                      </span>
                      {dept.defaultShiftId === shift.id && <DefaultShiftBadge />}
                    </div>
                    {assigned && (
                      <div className='mt-2 flex flex-wrap items-center gap-1.5 pl-6'>
                        <span className='text-neutral-1000 text-xs'>Weekly offs:</span>
                        {WEEK_DAYS.map((day) => {
                          const active = offsFor(shift.id).includes(day)
                          return (
                            <button
                              key={day}
                              type='button'
                              disabled={!canManage}
                              onClick={() =>
                                setOffsOverride((prev) => {
                                  const key = `${dept.id}:${shift.id}`
                                  const current = offsFor(shift.id)
                                  return {
                                    ...prev,
                                    [key]: active
                                      ? current.filter((d) => d !== day)
                                      : [...current, day],
                                  }
                                })
                              }
                              className={`rounded-md border px-1.5 py-0.5 text-xs transition-colors ${
                                active
                                  ? 'bg-blue-1400 border-blue-1400 text-white'
                                  : 'text-neutral-1900 border-gray-200'
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                        <span className='text-neutral-1000 text-xs'>
                          (excluded from working-time calculations)
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div>
                <p className='text-neutral-1600 mb-1 text-sm font-medium'>Default shift</p>
                <p className='text-neutral-1000 mb-2 text-xs'>
                  Members without a specific shift inherit the department default.
                </p>
                <RadioGroup
                  value={dept.defaultShiftId ?? ''}
                  onValueChange={(value) =>
                    canManage &&
                    store.patchDepartment(
                      dept.id,
                      { defaultShiftId: value },
                      'default shift changed',
                      `${SHIFTS.find((s) => s.id === value)?.name} is now the default for ${dept.name}.`
                    )
                  }
                  className='space-y-1'
                >
                  {dept.shiftIds.map((id) => {
                    const shift = SHIFTS.find((s) => s.id === id)
                    if (!shift) return null
                    return (
                      <label key={id} className='flex items-center gap-2 text-sm'>
                        <RadioGroupItem value={id} disabled={!canManage} />
                        <span className='text-neutral-1900'>
                          {shift.name} ({shift.startTime}–{shift.endTime})
                        </span>
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-4'>
            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                  Work areas within mapped locations
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {dept.locationIds.length === 0 && (
                  <p className='text-neutral-1000 text-sm'>
                    Map this department to a location first (edit it in the Directory tab).
                  </p>
                )}
                {dept.locationIds.map((locId) => {
                  const loc = LOCATIONS.find((l) => l.id === locId)
                  const areas = WORK_AREAS.filter((wa) => wa.locationId === locId)
                  return (
                    <div key={locId} className='rounded-md border border-gray-200 p-3'>
                      <p className='text-neutral-1600 mb-1.5 text-sm font-medium'>
                        {loc?.name ?? locId}
                        {loc?.retired && (
                          <Badge variant='overdue' className='ml-2'>
                            Retired
                          </Badge>
                        )}
                      </p>
                      {areas.length === 0 ? (
                        <p className='text-neutral-1000 text-xs'>No work areas configured.</p>
                      ) : (
                        areas.map((wa) => (
                          <label key={wa.id} className='flex items-center gap-2 py-0.5 text-sm'>
                            <Checkbox
                              variant='blue'
                              checked={dept.workAreaIds.includes(wa.id)}
                              disabled={!canManage}
                              onCheckedChange={(checked) => toggleWorkArea(wa.id, !!checked)}
                            />
                            <span className='text-neutral-1900'>{wa.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                  Shift roster visible to
                </CardTitle>
                <p className='text-neutral-1000 text-xs'>
                  Only the selected roles can view this department's roster. Changes apply
                  immediately.
                </p>
              </CardHeader>
              <CardContent className='space-y-1.5'>
                {ROLES.map((r) => (
                  <label key={r} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      variant='blue'
                      checked={dept.rosterVisibleTo.includes(r)}
                      disabled={!canManage}
                      onCheckedChange={(checked) => toggleRosterRole(r, !!checked)}
                    />
                    <span className='text-neutral-1900'>{r}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
