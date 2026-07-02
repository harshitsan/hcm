import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRole } from '@/context/role-context'
import { CURRENT_EMPLOYEE_ID } from '../data/employees'
import { LOCATIONS, SHIFTS } from '../data/org-config'
import { type DepartmentConfigStore } from '../hooks/use-department-config'
import { type DepartmentsStore } from '../hooks/use-departments'
import { resolveApprovalPath } from '../utils/approval'

interface MyDepartmentsTabProps {
  store: DepartmentsStore
  config: DepartmentConfigStore
}

/**
 * Employee self-service view: my department memberships and heads (DEPT-11),
 * my department's site and my assigned/default shift (DEPT-34), and the
 * approval path the workflow engine resolves for my requests (DEPT-16).
 */
export function MyDepartmentsTab({ store, config }: MyDepartmentsTabProps) {
  const { role } = useRole()
  const me = store.employeeById.get(CURRENT_EMPLOYEE_ID)

  const leaveGraph = config.approverGraphs[0]
  const resolution = useMemo(
    () => (me && leaveGraph ? resolveApprovalPath(store, leaveGraph, me) : null),
    [me, leaveGraph, store]
  )

  if (role === 'Employee (Non-User)') {
    return (
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            No portal access
          </CardTitle>
        </CardHeader>
        <CardContent className='text-neutral-1900 space-y-2 text-sm'>
          <p>
            Employee (Non-User) records have no login, yet they are still assigned to at
            least one department — exactly like portal users.
          </p>
          <p className='text-neutral-1000'>
            They appear on department rosters, are included in departmental reporting and
            approvals, and department-scoped policies apply to them. Admins manage their
            memberships from the Members tab.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!me) return null

  const myShift = me.shiftId ? SHIFTS.find((s) => s.id === me.shiftId) : null

  return (
    <div className='space-y-4'>
      <p className='text-neutral-1000 text-sm'>
        Signed in as <span className='text-neutral-1600 font-medium'>{me.name}</span> —{' '}
        {me.title}
      </p>

      <div className='grid gap-4 lg:grid-cols-2'>
        {me.departmentIds.map((deptId, index) => {
          const dept = store.deptById.get(deptId)
          if (!dept) return null
          const head = dept.headId ? store.employeeById.get(dept.headId) : undefined
          const chain = [...store.ancestorsOf(dept.id)].reverse()
          const defaultShift = dept.defaultShiftId
            ? SHIFTS.find((s) => s.id === dept.defaultShiftId)
            : null
          const effectiveShift = myShift ?? defaultShift
          return (
            <Card key={deptId} className='border-gray-200'>
              <CardHeader>
                <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
                  {dept.name}
                  {dept.acronym && <Badge variant='secondary'>{dept.acronym}</Badge>}
                  {index === 0 && <Badge variant='open'>Primary</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2 text-sm'>
                <Row label='Department head (my reporting line)' value={head?.name ?? 'Unassigned'} />
                <Row
                  label='Parent context'
                  value={
                    chain.length > 0
                      ? `${chain.map((c) => c.name).join(' › ')} › ${dept.name}`
                      : `${dept.name} (top-level)`
                  }
                />
                <Row
                  label='Office location(s)'
                  value={
                    dept.locationIds
                      .map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id)
                      .join(', ') || 'Not mapped'
                  }
                />
                <Row
                  label={myShift ? 'My shift (specific assignment)' : 'My shift (department default)'}
                  value={
                    effectiveShift
                      ? `${effectiveShift.name} · ${effectiveShift.startTime}–${effectiveShift.endTime} · Weekly off: ${effectiveShift.weeklyOffs.join(', ')}`
                      : 'No shift assigned'
                  }
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {resolution && (
        <Card className='border-gray-200'>
          <CardHeader>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Where my requests go — resolved by the workflow engine
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {resolution.steps.length === 0 ? (
              <p className='text-neutral-1000 text-sm'>No approvers resolved.</p>
            ) : (
              <ol className='space-y-1'>
                {resolution.steps.map((s, i) => (
                  <li key={`${s.approverName}-${i}`} className='flex items-center gap-2 text-sm'>
                    <Badge variant='open'>Step {i + 1}</Badge>
                    <span className='text-neutral-1600 font-medium'>{s.approverName}</span>
                    <span className='text-neutral-1000 text-xs'>({s.departmentName})</span>
                  </li>
                ))}
              </ol>
            )}
            <p className='text-neutral-1000 text-xs'>{resolution.note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <span className='text-neutral-1000'>{label}</span>
      <span className='text-neutral-1900 text-right font-medium'>{value}</span>
    </div>
  )
}
