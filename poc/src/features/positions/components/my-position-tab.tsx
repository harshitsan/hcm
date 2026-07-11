import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRole } from '@/context/role-context'
import { CURRENT_EMPLOYEE_ID, type Employee } from '../data/employees'
import type { Department, Position } from '../data/positions'
import type { EmployeesStore } from '../hooks/use-employees'
import type { OrgConfigStore } from '../hooks/use-org-config'
import { EmployeeTypeBadge, LevelBadge, WageTypeBadge } from './badges'

interface MyPositionTabProps {
  positions: Position[]
  departments: Department[]
  employees: EmployeesStore
  orgConfig: OrgConfigStore
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-paragraph-sm text-neutral-1000'>{label}</span>
      <span className='text-neutral-1600 text-sm font-medium'>{value}</span>
    </div>
  )
}

/**
 * Employee self-service view (POS-10/46): the single current position and
 * department, the classification with its pay cadence and wage basis — all
 * strictly read-only — plus the effective-dated position history. When the
 * active role is Employee (Non-User) it explains org representation without
 * portal access (POS-17).
 */
export function MyPositionTab({
  positions,
  departments,
  employees,
  orgConfig,
}: MyPositionTabProps) {
  const { role } = useRole()

  if (role === 'Employee (Non-User)') {
    const nonUsers = employees.employees.filter((e) => e.type === 'non-user')
    return (
      <div className='w-full space-y-4'>
        <p className='text-paragraph-sm rounded-[6px] bg-blue-150 px-3 py-2 text-blue-1400'>
          Employee (Non-User) records have no portal login, yet each still
          holds exactly one position and appears in org charts, directories and
          reports like any other employee. If a login is later provisioned, the
          existing position assignment is preserved without duplication.
        </p>
        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Non-user employees represented in the org ({nonUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
              {nonUsers.map((e) => {
                const position = positions.find((p) => p.id === e.positionId)
                const dept = departments.find(
                  (d) => d.id === position?.departmentId
                )
                return (
                  <div
                    key={e.id}
                    className='flex items-center justify-between px-3 py-2'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {e.name}
                      </span>
                      <EmployeeTypeBadge type={e.type} />
                    </div>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      {position
                        ? `${position.name} · ${dept?.name ?? '—'}`
                        : 'Position unassigned'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const me: Employee | undefined = employees.employees.find(
    (e) => e.id === CURRENT_EMPLOYEE_ID
  )
  const position = positions.find((p) => p.id === me?.positionId)
  const department = departments.find((d) => d.id === position?.departmentId)
  const cls = orgConfig.employeeClasses.find((c) => c.id === me?.classId)
  const history = employees.assignmentHistory.filter(
    (h) => h.employeeId === CURRENT_EMPLOYEE_ID
  )

  return (
    <div className='w-full space-y-4'>
      <p className='text-paragraph-sm rounded-[6px] bg-blue-150 px-3 py-2 text-blue-1400'>
        Read-only view: you can see your own assignment but cannot create or
        modify positions or classifications.
      </p>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              My position
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            {position ? (
              <div className='grid grid-cols-2 gap-3'>
                <Field label='Position' value={position.name} />
                <Field label='Department' value={department?.name ?? '—'} />
                <Field
                  label='Level'
                  value={<LevelBadge level={position.level} />}
                />
                <Field
                  label='Position ID'
                  value={<span className='font-mono text-xs'>{position.id}</span>}
                />
              </div>
            ) : (
              <p className='text-paragraph-sm text-neutral-1000'>
                No position assigned yet — the field stays empty until your
                admin assigns one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              My classification &amp; pay cadence
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            {cls ? (
              <div className='grid grid-cols-2 gap-3'>
                <Field label='Employee class' value={cls.name} />
                <Field label='Class type' value={cls.classType} />
                <Field label='Payroll frequency' value={cls.payrollFrequency} />
                <Field
                  label='Wage basis'
                  value={<WageTypeBadge wageType={cls.wageType} />}
                />
              </div>
            ) : (
              <p className='text-paragraph-sm text-neutral-1000'>
                No classification assigned — the field stays empty until your
                admin assigns one.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='gap-2 border-gray-200 py-3'>
        <CardHeader className='px-4 pb-0'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            My position history
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          {history.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              No assignments recorded yet.
            </p>
          ) : (
            <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
              {history.map((h) => (
                <div key={h.id} className='flex flex-col gap-0.5 px-3 py-2'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {h.positionLabel}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    Effective {h.effectiveFrom} → {h.effectiveTo ?? 'present'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
