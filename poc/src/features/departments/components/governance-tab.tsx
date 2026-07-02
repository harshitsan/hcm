import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { COMPANIES, CURRENT_COMPANY_ID } from '../data/departments'
import { LOCATIONS } from '../data/org-config'
import { type DepartmentConfigStore } from '../hooks/use-department-config'
import { type DepartmentsStore } from '../hooks/use-departments'
import { evaluatePolicy, resolveApprovalPath } from '../utils/approval'

interface GovernanceTabProps {
  store: DepartmentsStore
  config: DepartmentConfigStore
}

/**
 * Reporting rolled up through the hierarchy (DEPT-08), workflow-routing
 * preview (DEPT-16), rules-engine applicability evaluation (DEPT-17) and —
 * for Platform Admins — the tenant-scoped bitemporal audit log (DEPT-13).
 */
export function GovernanceTab({ store, config }: GovernanceTabProps) {
  const [reportLocation, setReportLocation] = useState('all')
  const [routeEmployeeId, setRouteEmployeeId] = useState('emp-09')
  const [routeGraphId, setRouteGraphId] = useState(config.approverGraphs[0]?.id ?? '')
  const [policyEmployeeId, setPolicyEmployeeId] = useState('emp-10')
  const [policyRuleId, setPolicyRuleId] = useState(
    config.scopeRules.find((r) => r.kind === 'policy')?.id ?? ''
  )
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10))
  const [tenantScope, setTenantScope] = useState(CURRENT_COMPANY_ID)

  const companyDepts = useMemo(
    () => store.departments.filter((d) => d.companyId === CURRENT_COMPANY_ID),
    [store.departments]
  )
  const companyEmployees = useMemo(
    () => store.employees.filter((e) => e.companyId === CURRENT_COMPANY_ID),
    [store.employees]
  )

  const reportRows = useMemo(
    () =>
      companyDepts
        .filter(
          (d) => reportLocation === 'all' || d.locationIds.includes(reportLocation)
        )
        .map((d) => ({
          dept: d,
          direct: store.directMembersOf(d.id).length,
          rolledUp: store.rolledUpMembersOf(d.id).length,
        })),
    [companyDepts, reportLocation, store]
  )

  const routeEmployee = companyEmployees.find((e) => e.id === routeEmployeeId)
  const routeGraph = config.approverGraphs.find((g) => g.id === routeGraphId)
  const resolution =
    routeEmployee && routeGraph ? resolveApprovalPath(store, routeGraph, routeEmployee) : null

  const policyEmployee = companyEmployees.find((e) => e.id === policyEmployeeId)
  const policyRule = config.scopeRules.find((r) => r.id === policyRuleId)
  const verdict =
    policyEmployee && policyRule ? evaluatePolicy(store, policyRule, policyEmployee) : null

  const historyRows = useMemo(
    () =>
      store.history.filter(
        (h) => h.companyId === tenantScope && h.effectiveFrom <= asOfDate
      ),
    [store.history, tenantScope, asOfDate]
  )

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='border-gray-200'>
          <CardHeader>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Headcount report by department
            </CardTitle>
            <div className='flex items-center gap-2'>
              <span className='text-neutral-1000 text-xs'>Filter by mapped location:</span>
              <Select value={reportLocation} onValueChange={setReportLocation}>
                <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All locations</SelectItem>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Direct members</TableHead>
                  <TableHead>Incl. child departments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map(({ dept, direct, rolledUp }) => (
                  <TableRow key={dept.id}>
                    <TableCell className='text-neutral-1600 text-sm font-medium'>
                      {dept.name}
                      {dept.parentId && (
                        <span className='text-neutral-1000 ml-1 text-xs'>
                          (child of {store.deptById.get(dept.parentId)?.name})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-neutral-1900 text-sm'>{direct}</TableCell>
                    <TableCell className='text-neutral-1900 text-sm'>{rolledUp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card className='border-gray-200'>
            <CardHeader>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                Approval routing preview (workflow engine)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Select value={routeEmployeeId} onValueChange={setRouteEmployeeId}>
                  <SelectTrigger variant='secondary' className='w-[200px]'>
                    <SelectValue placeholder='Employee' />
                  </SelectTrigger>
                  <SelectContent>
                    {companyEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={routeGraphId} onValueChange={setRouteGraphId}>
                  <SelectTrigger variant='secondary' className='w-[190px]'>
                    <SelectValue placeholder='Approver graph' />
                  </SelectTrigger>
                  <SelectContent>
                    {config.approverGraphs.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} (v{g.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {resolution && (
                <div className='space-y-2'>
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-gray-200'>
            <CardHeader>
              <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
                Policy applicability check (rules engine)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Select value={policyEmployeeId} onValueChange={setPolicyEmployeeId}>
                  <SelectTrigger variant='secondary' className='w-[200px]'>
                    <SelectValue placeholder='Employee' />
                  </SelectTrigger>
                  <SelectContent>
                    {companyEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={policyRuleId} onValueChange={setPolicyRuleId}>
                  <SelectTrigger variant='secondary' className='w-[190px]'>
                    <SelectValue placeholder='Rule' />
                  </SelectTrigger>
                  <SelectContent>
                    {config.scopeRules.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {verdict && (
                <div className='flex items-start gap-2'>
                  <Badge variant={verdict.applies ? 'badge_active' : 'badge_inactive'}>
                    {verdict.applies ? 'Applies' : 'Does not apply'}
                  </Badge>
                  <p className='text-neutral-1000 text-xs'>{verdict.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RoleGate roles={['Platform Admin']}>
        <Card className='border-gray-200'>
          <CardHeader>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Bitemporal department history (Platform Admin)
            </CardTitle>
            <div className='flex flex-wrap items-center gap-3'>
              <label className='flex items-center gap-2 text-xs'>
                <span className='text-neutral-1000'>As-of (effective) date</span>
                <Input
                  type='date'
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className='h-7 w-[150px]'
                />
              </label>
              <label className='flex items-center gap-2 text-xs'>
                <span className='text-neutral-1000'>Tenant scope (row-level security)</span>
                <Select value={tenantScope} onValueChange={setTenantScope}>
                  <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <p className='text-neutral-1000 text-xs'>
              Prior states are retained with valid-from/valid-to rather than overwritten.
              Transaction time (recorded) and effective time are kept separately, so
              backdated corrections stay auditable. Queries never return another tenant's
              rows.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recorded at (transaction)</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-neutral-1000 text-sm'>
                      No records effective on or before {asOfDate} in this tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyRows.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className='text-neutral-1900 font-mono text-xs'>
                        {h.recordedAt.replace('T', ' ').slice(0, 16)}
                      </TableCell>
                      <TableCell className='text-neutral-1900 font-mono text-xs'>
                        {h.effectiveFrom}
                      </TableCell>
                      <TableCell className='text-neutral-1600 text-sm font-medium'>
                        {h.entity}
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{h.action}</Badge>
                      </TableCell>
                      <TableCell className='text-neutral-1000 text-sm'>{h.detail}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  )
}
