import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRole } from '@/context/role-context'
import type { Employee } from '../data/employees'
import type { Company, Department, Position } from '../data/positions'
import type { OrgConfigStore } from '../hooks/use-org-config'
import type { PositionsStore } from '../hooks/use-positions'
import { LevelBadge, StatusBadge } from './badges'

interface GovernanceTabProps {
  /** Companies inside the active role's tenant scope only (POS-09/16). */
  companies: Company[]
  departments: Department[]
  positions: Position[]
  employees: Employee[]
  orgConfig: OrgConfigStore
  store: PositionsStore
}

/**
 * Multi-tenant oversight (POS-06/09/15/16/33/45): group, portfolio and
 * platform admins see each company's positions scoped to that company —
 * never across scope boundaries — with group standardization seeding and the
 * platform-level bitemporal / row-level-security data architecture panel.
 */
export function GovernanceTab({
  companies,
  departments,
  positions,
  employees,
  orgConfig,
  store,
}: GovernanceTabProps) {
  const { role } = useRole()
  const isGroupAdmin = role === 'Group Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'

  const scopeLabel = useMemo(() => {
    switch (role) {
      case 'Platform Admin':
        return 'Platform scope: every tenant, with row-level security enforcing isolation per query.'
      case 'Portfolio Admin':
        return 'Portfolio scope: only companies inside your portfolio are returned — other portfolios never leak into results.'
      case 'Group Company Admin':
        return 'Group scope: only companies inside your group are shown; companies outside the group are not returned.'
      default:
        return 'Company scope: only your own company is visible.'
    }
  }, [role])

  return (
    <div className='w-full space-y-4'>
      <p className='text-paragraph-sm rounded-[6px] bg-blue-150 px-3 py-2 text-blue-1400'>
        {scopeLabel}
      </p>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {companies.map((company) => {
          const companyPositions = positions.filter(
            (p) => p.companyId === company.id
          )
          const companyDepts = departments.filter(
            (d) => d.companyId === company.id
          )
          const assigned = (positionId: string) =>
            employees.filter((e) => e.positionId === positionId).length
          const classes = orgConfig.employeeClasses.filter(
            (c) => c.companyId === company.id
          )
          const grades = orgConfig.payGrades.filter(
            (g) => g.companyId === company.id
          )

          return (
            <Card key={company.id} className='gap-2 border-gray-200 py-3'>
              <CardHeader className='px-4 pb-0'>
                <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center justify-between font-medium'>
                  <span>{company.name}</span>
                  <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                    {company.groupName} · {company.portfolioName}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 px-4'>
                {/* Each position stays scoped to its owning company (POS-16). */}
                <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
                  {companyPositions.length === 0 && (
                    <p className='text-paragraph-sm text-neutral-1000 px-3 py-2'>
                      No positions defined yet.
                    </p>
                  )}
                  {companyPositions.map((p) => (
                    <div
                      key={p.id}
                      className='flex items-center justify-between px-3 py-1.5'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='text-neutral-1900 text-sm'>{p.name}</span>
                        <LevelBadge level={p.level} />
                        <StatusBadge status={p.status} />
                      </div>
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {companyDepts.find((d) => d.id === p.departmentId)?.name}{' '}
                        · {assigned(p.id)} assigned
                      </span>
                    </div>
                  ))}
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='pending'>
                    {classes.length} employee class(es)
                  </Badge>
                  <Badge variant='pending'>
                    {grades.length} pay grade band(s)
                  </Badge>
                </div>

                {/* Group standardization seeds stay company-scoped (POS-33/45). */}
                {isGroupAdmin && (
                  <div className='flex flex-wrap items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-7'
                      onClick={() => orgConfig.seedStandardClasses(company.id)}
                    >
                      Seed standard classes
                    </Button>
                    <Button
                      variant='outline'
                      className='h-7'
                      onClick={() => orgConfig.seedStandardPayGrades(company.id)}
                    >
                      Seed standard pay bands
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Platform data-architecture panel (POS-15). */}
      {isPlatformAdmin && (
        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4 pb-0'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Bitemporal storage &amp; row-level security
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Position definitions and employee assignments are tenant-scoped,
              effective-dated, bitemporal rows: <b>valid time</b> (effective
              from/to) records when the fact was true, <b>transaction time</b>{' '}
              (recorded at) records when it was entered — so corrections keep
              both and any past state reconstructs for an as-of date. Row-level
              security restricts every query to the requesting tenant&apos;s
              scope.
            </p>
            <div className='divide-grey-200 border-gray-200 divide-y rounded-[6px] border'>
              {store.history.slice(0, 6).map((h) => (
                <div key={h.id} className='flex flex-col gap-0.5 px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-neutral-1900 font-mono text-xs'>
                      {h.positionId}
                    </span>
                    <span className='text-neutral-1600 text-sm'>{h.change}</span>
                  </div>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    valid: {h.effectiveFrom} → {h.effectiveTo ?? 'present'} ·
                    recorded (tx): {h.recordedAt} · tenant: {h.companyId}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
