import { useMemo, useState } from 'react'
import {
  CaretDown,
  CaretRight,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from 'phosphor-react'
import { toast } from 'sonner'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Employee } from '../data/directory'
import { type DirectoryStore } from '../hooks/use-directory'
import { type DirectoryConfigStore } from '../hooks/use-directory-config'
import { managerAsOf, renderManagerId, scopedCompanies } from '../utils/org'
import { NonUserBadge } from './directory-badges'
import { OrgNodeDetail } from './org-node-detail'

type ChartView = 'tree' | 'department'

const TODAY = new Date().toISOString().slice(0, 10)

interface OrgChartTabProps {
  store: DirectoryStore
  config: DirectoryConfigStore
}

/**
 * Org chart (DIR-03/04): interactive top-down tree and department-grouped
 * views with expand/collapse and zoom, effective-dated as-of rendering
 * (DIR-17), PNG/PDF export (DIR-05/14) and portfolio/group scopes (DIR-12).
 * Reports of deactivated managers are lifted per integrity rules (DIR-18).
 */
export function OrgChartTab({ store, config }: OrgChartTabProps) {
  const { role } = useRole()
  const companies = useMemo(() => scopedCompanies(role), [role])

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [view, setView] = useState<ChartView>('tree')
  const [asOf, setAsOf] = useState(TODAY)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const activeCompanyId = companies.some((c) => c.id === companyId)
    ? companyId
    : (companies[0]?.id ?? '')

  // Chart population: active company members; deactivated records drop out
  // and their reports are re-parented by the integrity rules (DIR-18).
  const chartEmployees = useMemo(
    () =>
      store.employees.filter(
        (e) =>
          e.companyId === activeCompanyId && e.employmentStatus !== 'inactive'
      ),
    [store.employees, activeCompanyId]
  )

  const parentOf = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const e of chartEmployees) {
      const managerId = renderManagerId(e, asOf, store.employeeById)
      map.set(
        e.id,
        managerId && chartEmployees.some((c) => c.id === managerId)
          ? managerId
          : null
      )
    }
    return map
  }, [chartEmployees, asOf, store.employeeById])

  const childrenOf = (id: string) =>
    chartEmployees.filter((e) => parentOf.get(e.id) === id)

  const departments = useMemo(
    () => Array.from(new Set(chartEmployees.map((e) => e.department))).sort(),
    [chartEmployees]
  )

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExport = (format: 'PNG' | 'PDF') => {
    const fileName = `org-chart-${view}${departmentFilter !== 'all' ? `-${departmentFilter.toLowerCase().replace(/\s+/g, '-')}` : ''}-asof-${asOf}.${format.toLowerCase()}`
    toast.success(
      `${fileName} exported — reflects the ${view === 'tree' ? 'tree' : 'department'} view, current expand/collapse state (${collapsed.size} collapsed) and only fields visible to ${role}`
    )
  }

  const renderNode = (employee: Employee, depth: number): React.ReactNode => {
    const children = childrenOf(employee.id)
    const isCollapsed = collapsed.has(employee.id)
    return (
      <div key={employee.id}>
        <button
          type='button'
          onClick={() => setSelectedId(employee.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            selectedId === employee.id
              ? 'bg-blue-150 text-blue-1400'
              : 'hover:bg-neutral-200'
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {children.length > 0 ? (
            <span
              role='button'
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(employee.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') toggleCollapse(employee.id)
              }}
              className='text-neutral-1000'
            >
              {isCollapsed ? (
                <CaretRight size={12} weight='bold' />
              ) : (
                <CaretDown size={12} weight='bold' />
              )}
            </span>
          ) : (
            <span className='w-3' />
          )}
          <span className='text-neutral-1600 font-medium'>{employee.name}</span>
          <span className='text-neutral-1000 text-xs'>{employee.position}</span>
          {!employee.isUser && <NonUserBadge />}
          {children.length > 0 && (
            <Badge variant='secondary'>{children.length}</Badge>
          )}
        </button>
        {!isCollapsed && children.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  const roots = chartEmployees.filter((e) => parentOf.get(e.id) === null)

  const departmentGroups = (
    departmentFilter === 'all' ? departments : [departmentFilter]
  ).map((dept) => {
    const members = chartEmployees.filter((e) => e.department === dept)
    const memberIds = new Set(members.map((m) => m.id))
    const deptRoots = members.filter((m) => {
      const p = parentOf.get(m.id)
      return p == null || !memberIds.has(p)
    })
    const renderDeptNode = (
      employee: Employee,
      depth: number
    ): React.ReactNode => {
      const children = childrenOf(employee.id).filter((c) =>
        memberIds.has(c.id)
      )
      return (
        <div key={employee.id}>
          <button
            type='button'
            onClick={() => setSelectedId(employee.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm ${
              selectedId === employee.id
                ? 'bg-blue-150 text-blue-1400'
                : 'hover:bg-neutral-200'
            }`}
            style={{ paddingLeft: `${depth * 18 + 6}px` }}
          >
            <span className='text-neutral-1600 font-medium'>
              {employee.name}
            </span>
            <span className='text-neutral-1000 text-xs'>
              {employee.position}
            </span>
            {!employee.isUser && <NonUserBadge />}
          </button>
          {children.map((c) => renderDeptNode(c, depth + 1))}
        </div>
      )
    }
    return { dept, members, deptRoots, renderDeptNode }
  })

  const selected = selectedId
    ? (chartEmployees.find((e) => e.id === selectedId) ?? null)
    : null
  const selectedManagerId = selected ? managerAsOf(selected, asOf) : null
  const selectedManager = selectedManagerId
    ? (store.employeeById.get(selectedManagerId) ?? null)
    : null
  const selectedReports = selected ? childrenOf(selected.id) : []

  return (
    <div className='grid gap-4 lg:grid-cols-[1.5fr_1fr]'>
      <Card className='border-gray-200'>
        <CardHeader className='space-y-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Organizational chart
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='icon2'
                className='h-7 w-7'
                aria-label='Zoom out'
                onClick={() =>
                  setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))
                }
              >
                <MagnifyingGlassMinus size={14} />
              </Button>
              <span className='text-neutral-1000 w-9 text-center text-xs'>
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant='icon2'
                className='h-7 w-7'
                aria-label='Zoom in'
                onClick={() =>
                  setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))
                }
              >
                <MagnifyingGlassPlus size={14} />
              </Button>
              {/* Export the chart as displayed (DIR-05 admins, DIR-14 employees). */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='h-7 gap-1 px-2 text-xs'>
                    <DownloadSimple size={13} weight='bold' />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='min-w-[160px]'>
                  <DropdownMenuItem onClick={() => handleExport('PNG')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('PDF')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {companies.length > 1 && (
              <Select value={activeCompanyId} onValueChange={setCompanyId}>
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[220px] text-xs'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className='flex items-center gap-1 rounded-[6px] border border-gray-200 bg-white p-0.5'>
              <Button
                variant={view === 'tree' ? 'default' : 'ghost'}
                className='h-6 px-2 text-xs'
                onClick={() => setView('tree')}
              >
                Hierarchy tree
              </Button>
              <Button
                variant={view === 'department' ? 'default' : 'ghost'}
                className='h-6 px-2 text-xs'
                onClick={() => setView('department')}
              >
                By department
              </Button>
            </div>
            {view === 'department' && (
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger
                  variant='secondary'
                  className='h-8 w-[180px] text-xs'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Effective-dated as-of rendering (DIR-17). */}
            <RoleGate roles={['Company Admin', 'Platform Admin']}>
              <div className='flex items-center gap-1.5'>
                <span className='text-neutral-1000 text-xs'>As of</span>
                <Input
                  type='date'
                  value={asOf}
                  max={TODAY}
                  onChange={(e) => setAsOf(e.target.value || TODAY)}
                  className='h-8 w-[150px] text-xs'
                />
                {asOf !== TODAY && (
                  <Button
                    variant='ghost'
                    className='h-7 px-2 text-xs'
                    onClick={() => setAsOf(TODAY)}
                  >
                    Today
                  </Button>
                )}
              </div>
            </RoleGate>
          </div>
          {asOf !== TODAY && (
            <p className='text-vanilla-500 bg-vanilla-400/30 rounded-md px-2 py-1 text-xs'>
              Historical view: reporting lines reconstructed from
              effective-dated records as of {asOf}. Manager changes reposition
              employees accordingly.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div
            className='origin-top-left'
            style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
          >
            {view === 'tree' ? (
              roots.length === 0 ? (
                <p className='text-neutral-1000 text-sm'>
                  No employees to display.
                </p>
              ) : (
                <div className='space-y-0.5'>
                  {roots.map((r) => renderNode(r, 0))}
                </div>
              )
            ) : (
              <div className='space-y-4'>
                {departmentGroups.map(
                  ({ dept, members, deptRoots, renderDeptNode }) => (
                    <div
                      key={dept}
                      className='rounded-md border border-gray-200 p-2'
                    >
                      <div className='mb-1 flex items-center gap-2'>
                        <span className='text-neutral-1600 text-sm font-semibold'>
                          {dept}
                        </span>
                        <Badge variant='secondary'>
                          {members.length} members
                        </Badge>
                      </div>
                      {deptRoots.map((r) => renderDeptNode(r, 0))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <OrgNodeDetail
        employee={selected}
        manager={selectedManager}
        reports={selectedReports}
        role={role}
        config={config.privacyConfig}
        customFields={config.customFields}
        asOf={asOf}
        onClose={() => setSelectedId(null)}
        onSelect={setSelectedId}
      />
    </div>
  )
}
