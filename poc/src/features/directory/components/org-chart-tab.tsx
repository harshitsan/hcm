import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowsIn,
  ArrowsOut,
  CaretDown,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from 'phosphor-react'
import Tree, {
  type CustomNodeElementProps,
  type RawNodeDatum,
} from 'react-d3-tree'
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
const VIRTUAL_ROOT = '__root__'

interface OrgChartTabProps {
  store: DirectoryStore
  config: DirectoryConfigStore
}

/**
 * Org chart (DIR-03/04): an interactive react-d3-tree hierarchy (pan, scroll
 * zoom, collapsible nodes with elbow connectors) plus a department-grouped
 * view, effective-dated as-of rendering (DIR-17), PNG/PDF export (DIR-05/14)
 * and portfolio/group scopes (DIR-12). Reports of deactivated managers are
 * lifted per integrity rules (DIR-18).
 */
export function OrgChartTab({ store, config }: OrgChartTabProps) {
  const { role } = useRole()
  const companies = useMemo(() => scopedCompanies(role), [role])

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [view, setView] = useState<ChartView>('tree')
  const [asOf, setAsOf] = useState(TODAY)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [translate, setTranslate] = useState({ x: 400, y: 72 })
  const [fullscreen, setFullscreen] = useState(false)

  // Exit full screen on Escape.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const activeCompanyId = companies.some((c) => c.id === companyId)
    ? companyId
    : (companies[0]?.id ?? '')
  const activeCompany = companies.find((c) => c.id === activeCompanyId)

  // Center the tree horizontally once the container is laid out.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const { width } = node.getBoundingClientRect()
      setTranslate({ x: Math.max(width / 2, 200), y: 72 })
    }
  }, [])

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

  const childrenOf = useCallback(
    (id: string) => chartEmployees.filter((e) => parentOf.get(e.id) === id),
    [chartEmployees, parentOf]
  )

  const departments = useMemo(
    () => Array.from(new Set(chartEmployees.map((e) => e.department))).sort(),
    [chartEmployees]
  )

  const roots = useMemo(
    () => chartEmployees.filter((e) => parentOf.get(e.id) === null),
    [chartEmployees, parentOf]
  )

  // Build the react-d3-tree hierarchy (a virtual root joins multiple top-level
  // managers so the whole org renders as one tree). A visited guard prevents
  // any accidental reporting cycle from recursing forever.
  const treeData = useMemo<RawNodeDatum>(() => {
    const build = (emp: Employee, seen: Set<string>): RawNodeDatum => {
      const kids = seen.has(emp.id) ? [] : childrenOf(emp.id)
      const next = new Set(seen).add(emp.id)
      return {
        name: emp.name,
        attributes: {
          id: emp.id,
          position: emp.position,
          isUser: emp.isUser,
          reports: kids.length,
        },
        children: kids.map((k) => build(k, next)),
      }
    }
    const built = roots.map((r) => build(r, new Set()))
    if (built.length === 1) return built[0]
    return {
      name: activeCompany?.name ?? 'Organization',
      attributes: {
        id: VIRTUAL_ROOT,
        position: 'Company',
        isUser: true,
        reports: roots.length,
      },
      children: built,
    }
  }, [roots, childrenOf, activeCompany])

  const handleExport = (format: 'PNG' | 'PDF') => {
    const fileName = `org-chart-${view}${departmentFilter !== 'all' ? `-${departmentFilter.toLowerCase().replace(/\s+/g, '-')}` : ''}-asof-${asOf}.${format.toLowerCase()}`
    toast.success(
      `${fileName} exported — reflects the ${view === 'tree' ? 'hierarchy tree' : 'department'} view and only fields visible to ${role}`
    )
  }

  // Custom node: an HTML card inside the SVG, click to open the detail panel,
  // chevron to collapse/expand the sub-tree.
  const renderNode = ({ nodeDatum, toggleNode }: CustomNodeElementProps) => {
    const attrs = nodeDatum.attributes ?? {}
    const id = String(attrs.id ?? '')
    const isVirtual = id === VIRTUAL_ROOT
    const isSelected = id === selectedId
    const reports = Number(attrs.reports ?? 0)
    const collapsed = nodeDatum.__rd3t.collapsed
    const W = 208
    const H = 60
    return (
      <g>
        <foreignObject
          x={-W / 2}
          y={-H / 2}
          width={W}
          height={H}
          style={{ overflow: 'visible' }}
        >
          <div
            onClick={() => !isVirtual && setSelectedId(id)}
            className={`flex h-[60px] w-[208px] items-center gap-2 rounded-[8px] border bg-white px-3 shadow-sm transition-colors ${
              isVirtual
                ? 'border-blue-1200 bg-blue-1200 cursor-default text-white'
                : isSelected
                  ? 'border-blue-1200 ring-blue-1200/30 cursor-pointer ring-2'
                  : 'border-gray-200 hover:border-blue-1000 cursor-pointer'
            }`}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isVirtual
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-1200'
              }`}
            >
              {String(nodeDatum.name)
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className='min-w-0 flex-1'>
              <div
                className={`truncate text-xs font-semibold ${isVirtual ? 'text-white' : 'text-neutral-1600'}`}
              >
                {String(nodeDatum.name)}
              </div>
              <div
                className={`flex items-center gap-1 truncate text-[11px] ${isVirtual ? 'text-white/80' : 'text-neutral-1000'}`}
              >
                <span className='truncate'>{String(attrs.position ?? '')}</span>
                {attrs.isUser === false && <NonUserBadge />}
              </div>
            </div>
            {reports > 0 && (
              <button
                type='button'
                aria-label={collapsed ? 'Expand reports' : 'Collapse reports'}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode()
                }}
                className={`flex h-5 items-center gap-0.5 rounded-full px-1.5 text-[11px] ${
                  isVirtual
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-200 text-neutral-1200 hover:bg-neutral-300'
                }`}
              >
                {reports}
                <CaretDown
                  size={9}
                  weight='bold'
                  className={collapsed ? '-rotate-90' : ''}
                />
              </button>
            )}
          </div>
        </foreignObject>
      </g>
    )
  }

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

  // The react-d3-tree canvas, reused inline and in the full-screen overlay.
  // `keyName` forces a remount on toggle so the centering ref re-measures.
  const chartCanvas = (heightClass: string, keyName: string) => (
    <div
      key={keyName}
      ref={containerRef}
      className={`w-full overflow-hidden rounded-md border border-gray-200 bg-[radial-gradient(theme(colors.gray.200)_1px,transparent_1px)] [background-size:18px_18px] ${heightClass}`}
    >
      <Tree
        data={treeData}
        translate={translate}
        orientation='vertical'
        pathFunc='step'
        collapsible
        zoomable
        draggable
        zoom={0.8}
        scaleExtent={{ min: 0.3, max: 2 }}
        nodeSize={{ x: 240, y: 120 }}
        separation={{ siblings: 1.05, nonSiblings: 1.3 }}
        renderCustomNodeElement={renderNode}
        pathClassFunc={() => 'stroke-gray-300'}
      />
    </div>
  )

  const exportMenu = (
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
  )

  const selected = selectedId
    ? (chartEmployees.find((e) => e.id === selectedId) ?? null)
    : null
  const selectedManagerId = selected ? managerAsOf(selected, asOf) : null
  const selectedManager = selectedManagerId
    ? (store.employeeById.get(selectedManagerId) ?? null)
    : null
  const selectedReports = selected ? childrenOf(selected.id) : []

  return (
    <>
    <div className='grid gap-4 lg:grid-cols-[1.5fr_1fr]'>
      <Card className='border-gray-200'>
        <CardHeader className='space-y-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Organizational chart
            </CardTitle>
            <div className='flex items-center gap-2'>
              {view === 'department' && (
                <>
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
                </>
              )}
              {view === 'tree' && (
                <Button
                  variant='outline'
                  className='h-7 gap-1 px-2 text-xs'
                  onClick={() => setFullscreen(true)}
                >
                  <ArrowsOut size={13} weight='bold' />
                  Full screen
                </Button>
              )}
              {/* Export the chart as displayed (DIR-05 admins, DIR-14 employees). */}
              {exportMenu}
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
          {view === 'tree' ? (
            roots.length === 0 ? (
              <p className='text-neutral-1000 text-sm'>
                No employees to display.
              </p>
            ) : fullscreen ? (
              <div className='flex h-[200px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-200'>
                <span className='text-neutral-1000 text-sm'>
                  Chart is open in full screen.
                </span>
                <Button
                  variant='outline'
                  className='h-7 gap-1 px-2 text-xs'
                  onClick={() => setFullscreen(false)}
                >
                  <ArrowsIn size={13} weight='bold' />
                  Exit full screen
                </Button>
              </div>
            ) : (
              <>
                {chartCanvas('h-[560px]', 'inline')}
                <p className='text-neutral-1000 mt-2 text-center text-xs'>
                  Scroll to zoom · drag to pan · click a node for details ·
                  chevron to collapse
                </p>
              </>
            )
          ) : (
            <div
              className='origin-top-left'
              style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
            >
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
            </div>
          )}
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

      {fullscreen &&
        createPortal(
          <div className='fixed inset-0 z-[60] flex flex-col bg-white'>
            <div className='flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  Organizational chart
                </span>
                {activeCompany && (
                  <Badge variant='secondary'>{activeCompany.name}</Badge>
                )}
                {asOf !== TODAY && (
                  <Badge variant='outline'>as of {asOf}</Badge>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {exportMenu}
                <Button
                  variant='outline'
                  className='h-7 gap-1 px-2 text-xs'
                  onClick={() => setFullscreen(false)}
                >
                  <ArrowsIn size={13} weight='bold' />
                  Exit full screen
                </Button>
              </div>
            </div>
            <div className='flex-1 p-3'>{chartCanvas('h-full', 'fullscreen')}</div>
          </div>,
          document.body
        )}
    </>
  )
}
