import { useMemo, useState } from 'react'
import { CheckCircle, ShieldCheck, Warning } from 'phosphor-react'
import { toast } from 'sonner'
import { ROLES, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMPANIES, CURRENT_COMPANY_ID } from '../data/directory'
import { type DirectoryStore } from '../hooks/use-directory'
import {
  runIntegrityChecks,
  scopedCompanies,
  wouldCreateCycle,
} from '../utils/org'

/**
 * Platform-Admin data governance: tenant-scoped row-level security (DIR-16)
 * and reporting-relationship integrity rules with a live validator (DIR-18).
 */
export function GovernanceTab({ store }: { store: DirectoryStore }) {
  const [probeRole, setProbeRole] = useState<Role>('Group Company Admin')
  const [candidateId, setCandidateId] = useState('')
  const [newManagerId, setNewManagerId] = useState('')

  const checks = useMemo(
    () => runIntegrityChecks(store.employees),
    [store.employees]
  )

  const grantedIds = new Set(scopedCompanies(probeRole).map((c) => c.id))

  const companyEmployees = store.employees.filter(
    (e) =>
      e.companyId === CURRENT_COMPANY_ID && e.employmentStatus !== 'inactive'
  )

  const validateRelationship = () => {
    if (!candidateId || !newManagerId) {
      toast.info('Pick both an employee and a proposed manager')
      return
    }
    const employee = store.employeeById.get(candidateId)
    const manager = store.employeeById.get(newManagerId)
    if (!employee || !manager) {
      toast.error(
        'Rejected — both sides must resolve to valid employee records'
      )
      return
    }
    if (wouldCreateCycle(store.employees, candidateId, newManagerId)) {
      toast.error(
        `Rejected — placing ${employee.name} under ${manager.name} would create a reporting cycle`
      )
      return
    }
    if (manager.employmentStatus === 'inactive') {
      toast.warning(
        `Flagged — ${manager.name} is deactivated; reports would be lifted to the next active manager`
      )
      return
    }
    toast.success(
      `Valid — ${employee.name} → ${manager.name}: both records resolve, no cycle introduced`
    )
  }

  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      {/* Tenant-scoped, row-level-secured reads (DIR-16). */}
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
            <ShieldCheck size={16} weight='bold' />
            Tenant scoping & row-level security
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Every directory and org-chart query is constrained to the caller's
            authorized tenants. Cross-company reads retrieve each company's rows
            only through its own tenant scope — nothing leaks outside the grant.
          </p>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='rounded-md border border-gray-200 p-2'>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>
              Scope matrix
            </p>
            {ROLES.map((r) => {
              const granted = scopedCompanies(r)
              return (
                <div
                  key={r}
                  className='flex items-start justify-between gap-3 py-1 text-xs'
                >
                  <span className='text-neutral-1000'>{r}</span>
                  <span className='text-neutral-1900 text-right font-medium'>
                    {granted.map((c) => c.code).join(', ')}
                  </span>
                </div>
              )
            })}
          </div>

          <div className='rounded-md border border-gray-200 p-2'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <p className='text-neutral-1600 text-sm font-medium'>
                Simulate a scoped query
              </p>
              <Select
                value={probeRole}
                onValueChange={(v) => setProbeRole(v as Role)}
              >
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[200px] text-xs'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {COMPANIES.map((c) => {
              const rows = store.employees.filter(
                (e) => e.companyId === c.id
              ).length
              const granted = grantedIds.has(c.id)
              return (
                <div
                  key={c.id}
                  className='flex items-center justify-between gap-2 py-1 text-xs'
                >
                  <span className='text-neutral-1900'>
                    {c.name}{' '}
                    <span className='text-neutral-1000'>({c.group})</span>
                  </span>
                  {granted ? (
                    <Badge variant='badge_active'>{rows} rows returned</Badge>
                  ) : (
                    <Badge variant='badge_inactive'>withheld (0 rows)</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reporting-relationship integrity (DIR-18). */}
      <Card className='border-gray-200'>
        <CardHeader>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Reporting-relationship integrity
          </CardTitle>
          <p className='text-neutral-1000 text-xs'>
            Structural checks over the effective-dated reporting graph. The org
            chart is always renderable: no cycles, valid roots, no dangling
            links.
          </p>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-1.5'>
            {checks.map((check) => (
              <div
                key={check.id}
                className='flex items-start gap-2 rounded-md border border-gray-200 px-3 py-2'
              >
                {check.status === 'pass' ? (
                  <CheckCircle
                    size={16}
                    weight='bold'
                    className='text-green-1300 mt-0.5 shrink-0'
                  />
                ) : (
                  <Warning
                    size={16}
                    weight='bold'
                    className='text-vanilla-500 mt-0.5 shrink-0'
                  />
                )}
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {check.label}
                  </p>
                  <p className='text-neutral-1000 text-xs'>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className='rounded-md border border-gray-200 p-2'>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Validate a proposed reporting change
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <Select value={candidateId} onValueChange={setCandidateId}>
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[180px] text-xs'
                >
                  <SelectValue placeholder='Employee…' />
                </SelectTrigger>
                <SelectContent>
                  {companyEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className='text-neutral-1000 text-xs'>reports to</span>
              <Select value={newManagerId} onValueChange={setNewManagerId}>
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[180px] text-xs'
                >
                  <SelectValue placeholder='Proposed manager…' />
                </SelectTrigger>
                <SelectContent>
                  {companyEmployees
                    .filter((e) => e.id !== candidateId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                className='h-8 px-3 text-xs'
                onClick={validateRelationship}
              >
                Validate
              </Button>
            </div>
            <p className='text-neutral-1000 mt-2 text-xs'>
              Try placing a VP under one of their indirect reports — the data
              model rejects the cycle before the chart could loop.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
