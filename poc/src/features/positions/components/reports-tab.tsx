import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AssignmentHistoryEntry, Employee } from '../data/employees'
import type { Department, Position } from '../data/positions'
import { EmployeeTypeBadge, LevelBadge } from './badges'

interface ReportsTabProps {
  companyId: string
  positions: Position[]
  departments: Department[]
  employees: Employee[]
  assignmentHistory: AssignmentHistoryEntry[]
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Organizational reporting by position (POS-05/12/15/17): headcount grouped
 * by position and rolled up by parent department, reconstructible for any
 * as-of date from the effective-dated assignment history. Non-user employees
 * are included and grouped like any other employee.
 */
export function ReportsTab({
  companyId,
  positions,
  departments,
  employees,
  assignmentHistory,
}: ReportsTabProps) {
  const [asOf, setAsOf] = useState(todayISO())
  const isToday = asOf === todayISO()

  const companyDepartments = useMemo(
    () => departments.filter((d) => d.companyId === companyId),
    [departments, companyId]
  )
  const companyEmployees = useMemo(
    () => employees.filter((e) => e.companyId === companyId),
    [employees, companyId]
  )

  /** Employee → position holding on the as-of date, replayed from history. */
  const asOfAssignments = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of assignmentHistory) {
      if (entry.companyId !== companyId) continue
      const started = entry.effectiveFrom <= asOf
      const stillOpen = entry.effectiveTo === null || entry.effectiveTo >= asOf
      if (started && stillOpen) map.set(entry.employeeId, entry.positionId)
    }
    return map
  }, [assignmentHistory, companyId, asOf])

  const rollup = useMemo(() => {
    return companyDepartments.map((dept) => {
      const deptPositions = positions.filter(
        (p) => p.companyId === companyId && p.departmentId === dept.id
      )
      const rows = deptPositions.map((position) => {
        const holders = companyEmployees.filter(
          (e) => asOfAssignments.get(e.id) === position.id
        )
        return { position, holders }
      })
      const headcount = rows.reduce((sum, r) => sum + r.holders.length, 0)
      return { dept, rows, headcount }
    })
  }, [companyDepartments, positions, companyId, companyEmployees, asOfAssignments])

  const totalAssigned = rollup.reduce((sum, d) => sum + d.headcount, 0)
  const unassigned = companyEmployees.filter((e) => !asOfAssignments.has(e.id))

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Org Report by Position
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Positions roll up under their parent department; assignments are
            effective-dated so past org states replay exactly as recorded.
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <div className='space-y-1'>
            <Label className='text-paragraph-sm'>Report as of</Label>
            <Input
              type='date'
              value={asOf}
              max={todayISO()}
              onChange={(e) => setAsOf(e.target.value || todayISO())}
              className='h-8 w-[170px]'
            />
          </div>
        </div>
      </div>

      {!isToday && (
        <p className='text-paragraph-sm rounded-[6px] bg-blue-150 px-3 py-2 text-blue-1400'>
          Historical view: showing the position assignments that were effective
          on {asOf}. Current records are untouched.
        </p>
      )}

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {rollup.map(({ dept, rows, headcount }) => (
          <Card key={dept.id} className='gap-2 border-gray-200 py-3'>
            <CardHeader className='px-4 pb-0'>
              <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center justify-between font-medium'>
                <span>{dept.name}</span>
                <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                  {rows.length} position(s) · {headcount} assigned
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4'>
              {rows.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No positions defined in this department.
                </p>
              ) : (
                <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
                  {rows.map(({ position, holders }) => (
                    <div key={position.id} className='px-3 py-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-neutral-1900 text-sm font-medium'>
                            {position.name}
                          </span>
                          <LevelBadge level={position.level} />
                        </div>
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {holders.length} employee(s)
                        </span>
                      </div>
                      {holders.length > 0 && (
                        <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1'>
                          {holders.map((e) => (
                            <span
                              key={e.id}
                              className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'
                            >
                              {e.name}
                              <EmployeeTypeBadge type={e.type} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4 pb-0'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Coverage on {asOf}
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <p className='text-paragraph-sm text-neutral-1000'>
            {totalAssigned} of {companyEmployees.length} employees held a
            position on this date (non-user employees included).
            {unassigned.length > 0 && (
              <>
                {' '}
                Without a position:{' '}
                {unassigned.map((e) => e.name).join(', ')}.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
