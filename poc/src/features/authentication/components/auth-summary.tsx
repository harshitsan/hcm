import { useMemo } from 'react'
import { type EmployeeRecord } from '../data/companies'
import { activeMemberships, type AuthUser } from '../data/auth-users'
import { type AuthAuditEvent } from '../data/auth-audit'
import { SummaryCards } from '@/components/module-page'

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

  return <SummaryCards title='Authentication Summary' items={summaryItems} />
}
