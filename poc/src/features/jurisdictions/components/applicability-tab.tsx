import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import { type Jurisdiction } from '../data/jurisdictions'
import { MY_EMPLOYEE_ID } from '../data/assignments'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { TypeBadge } from './jurisdiction-badges'

interface ApplicabilityTabProps {
  store: AssignmentsStore
  catalog: Jurisdiction[]
}

/**
 * Jurisdiction-driven applicability for employees (JUR-10, JUR-16).
 * Employee (User) sees their own resolution; for non-login employees the
 * same resolution is produced on their behalf, viewable by admins (and
 * demonstrated for the Employee (Non-User) persona).
 */
export function ApplicabilityTab({ store, catalog }: ApplicabilityTabProps) {
  const { role } = useRole()
  const isEmployeeUser = role === 'Employee (User)'
  const isEmployeeNonUser = role === 'Employee (Non-User)'

  const defaultId = isEmployeeUser
    ? MY_EMPLOYEE_ID
    : isEmployeeNonUser
      ? (store.employees.find((e) => !e.isUser)?.id ?? MY_EMPLOYEE_ID)
      : MY_EMPLOYEE_ID
  const [employeeId, setEmployeeId] = useState(defaultId)

  // Employee personas are pinned to their own context when the role changes.
  useEffect(() => {
    if (isEmployeeUser || isEmployeeNonUser) setEmployeeId(defaultId)
  }, [isEmployeeUser, isEmployeeNonUser, defaultId])

  const catalogById = useMemo(
    () => new Map(catalog.map((j) => [j.id, j])),
    [catalog]
  )
  const employee =
    store.employees.find((e) => e.id === employeeId) ?? store.employees[0]
  const company = store.companies.find((c) => c.id === employee.companyId)
  const jurisdiction = catalogById.get(employee.jurisdictionId)

  const applicablePolicies = store.policies.filter(
    (p) =>
      p.status === 'active' &&
      p.jurisdictionIds.includes(employee.jurisdictionId)
  )
  const excludedPolicies = store.policies.filter(
    (p) =>
      p.status === 'active' &&
      !p.jurisdictionIds.includes(employee.jurisdictionId)
  )

  return (
    <div className='w-full space-y-4'>
      {isEmployeeUser && (
        <p className='text-paragraph-sm text-neutral-1000'>
          The policies and tax/fee treatment below are resolved from the
          jurisdiction you operate under. If the catalog changes, the next
          evaluation uses the current effective rules.
        </p>
      )}
      {isEmployeeNonUser && (
        <div className='rounded-md border border-gray-200 bg-white px-3 py-2'>
          <p className='text-sm font-medium'>Resolved on your behalf</p>
          <p className='text-paragraph-sm text-neutral-1000'>
            Non-login employees never sign in — the system and admins resolve
            jurisdiction-driven policies and taxation for them exactly the
            same way. This preview shows that resolution for a non-login
            employee.
          </p>
        </div>
      )}
      {!isEmployeeUser && !isEmployeeNonUser && (
        <div className='max-w-[360px] space-y-1'>
          <Label>Resolve applicability for</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger variant='secondary' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {store.employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {e.isUser ? '' : ' (non-login employee)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-paragraph-sm text-neutral-1000'>
            Includes non-login employees — applicability resolves on their
            behalf without a sign-in.
          </p>
        </div>
      )}

      <Card className='gap-3 border-gray-200 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md flex items-center gap-2 font-medium'>
            {employee.name}
            {!employee.isUser && <Badge variant='pending'>Non-login</Badge>}
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {employee.designation} · {company?.name}
          </p>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Operating jurisdiction:</span>
            {jurisdiction ? (
              <>
                <Badge variant='open'>{jurisdiction.name}</Badge>
                <TypeBadge type={jurisdiction.type} />
              </>
            ) : (
              <span className='text-neutral-1000 text-sm'>Not assigned</span>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='rounded-md border border-gray-200 p-3'>
              <p className='mb-1 text-sm font-medium'>
                Policies that apply to {isEmployeeUser ? 'me' : 'this employee'}
              </p>
              {applicablePolicies.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No policy's jurisdiction criteria match — none apply.
                </p>
              ) : (
                <ul className='space-y-1'>
                  {applicablePolicies.map((p) => (
                    <li key={p.id} className='text-paragraph-sm'>
                      {p.name}{' '}
                      <Badge variant='pending'>{p.module}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {excludedPolicies.length > 0 && (
                <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                  {excludedPolicies.length} other active{' '}
                  {excludedPolicies.length === 1 ? 'policy' : 'policies'} do
                  not apply — their jurisdiction criteria fall outside{' '}
                  {jurisdiction?.name ?? 'this region'}.
                </p>
              )}
            </div>

            <div className='rounded-md border border-gray-200 p-3'>
              <p className='mb-1 text-sm font-medium'>Tax & fee treatment</p>
              {!jurisdiction || jurisdiction.taxFees.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No tax/fee applicability is configured for this jurisdiction
                  — treated as not configured.
                </p>
              ) : (
                <ul className='space-y-1'>
                  {jurisdiction.taxFees.map((t) => (
                    <li key={t.id} className='text-paragraph-sm'>
                      {t.name} · {t.rate}{' '}
                      <span className='text-neutral-1000'>
                        ({t.kind}, {t.appliesTo})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
