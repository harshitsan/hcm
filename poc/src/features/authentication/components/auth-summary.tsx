import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type EmployeeRecord } from '../data/companies'
import { activeMemberships, type AuthUser } from '../data/auth-users'
import { type AuthAuditEvent } from '../data/auth-audit'

interface AuthSummaryProps {
  users: AuthUser[]
  employees: EmployeeRecord[]
  events: AuthAuditEvent[]
  enabledMethodCount: number
}

/** Count cards shown above the tabs — identity + audit posture at a glance. */
export function AuthSummary({
  users,
  employees,
  events,
  enabledMethodCount,
}: AuthSummaryProps) {
  const summaryItems = useMemo(() => {
    const multiCompany = users.filter(
      (u) => activeMemberships(u).length > 1
    ).length
    const workforceOnly = employees.filter((e) => e.linkedUserId === null).length
    const failures = events.filter((e) => e.outcome === 'failure').length
    return [
      { label: 'User identities', value: users.length },
      { label: 'Multi-company users', value: multiCompany },
      { label: 'Employees without login', value: workforceOnly },
      { label: 'Enabled auth methods', value: enabledMethodCount },
      { label: 'Failed auth events', value: failures },
    ]
  }, [users, employees, events, enabledMethodCount])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Authentication Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex w-full items-center gap-3'>
                <div className='flex flex-col gap-4'>
                  <span className='text-paragraph-sm font-medium text-black'>
                    {item.label}
                  </span>
                  <span className='text-3xl font-medium text-black'>
                    {item.value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
