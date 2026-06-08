import { useMemo, useState } from 'react'
import {
  Network, ChevronRight, ChevronDown, Users, MapPin, Search,
  ChevronsDownUp, ChevronsUpDown, Building2, UserCog,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  type Employee,
} from '../data/mock'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  Input, PageHeader, Segmented, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type View = 'people' | 'departments'

const statusTone: Record<Employee['status'], 'success' | 'info' | 'warning' | 'accent'> = {
  Active: 'success',
  'On Leave': 'info',
  Probation: 'warning',
  Onboarding: 'accent',
}

function OrgNode({
  emp,
  depth,
  collapsed,
  toggle,
  query,
  onSelect,
}: {
  emp: Employee
  depth: number
  collapsed: Set<string>
  toggle: (id: string) => void
  query: string
  onSelect: (id: string) => void
}) {
  const { reportsOf, getDepartment } = useCompanyData()
  const children = reportsOf(emp.id)
  const dept = getDepartment(emp.departmentId)
  // While searching, force every branch open so matches deeper in the tree are visible.
  const isCollapsed = collapsed.has(emp.id) && query.length === 0
  const hasReports = children.length > 0
  const match =
    query.length > 0 &&
    (emp.name.toLowerCase().includes(query) || emp.title.toLowerCase().includes(query))

  return (
    <div className={cn(depth > 0 && 'ml-4 border-l border-border pl-4')}>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/50',
          match && 'bg-primary/5 ring-1 ring-primary/30',
        )}
      >
        <button
          type="button"
          onClick={() => hasReports && toggle(emp.id)}
          aria-label={hasReports ? (isCollapsed ? 'Expand' : 'Collapse') : 'No reports'}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-fg transition-colors',
            hasReports ? 'cursor-pointer hover:bg-muted hover:text-fg' : 'invisible',
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <Avatar name={emp.name} size="sm" />

        <button
          type="button"
          onClick={() => onSelect(emp.id)}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-fg">{emp.name}</span>
            <Badge tone={statusTone[emp.status]} className="hidden sm:inline-flex">
              {emp.status}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-fg">
            {emp.title}
            {dept && <span> · {dept.name}</span>}
          </p>
        </button>

        <span className="hidden items-center gap-1 text-2xs font-medium text-muted-fg sm:flex">
          <MapPin className="h-3 w-3" /> {emp.location}
        </span>

        {hasReports && (
          <Badge tone="neutral" className="tnum shrink-0">
            <Users className="h-3 w-3" /> {children.length}
          </Badge>
        )}
      </div>

      {hasReports && !isCollapsed && (
        <div className="mt-0.5">
          {children.map((c) => (
            <OrgNode
              key={c.id}
              emp={c}
              depth={depth + 1}
              collapsed={collapsed}
              toggle={toggle}
              query={query}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgChart() {
  const { employees, departments, getDepartment, getEmployee, reportsOf } = useCompanyData()
  const { company, role } = useApp()
  const { push } = useToast()
  const [view, setView] = useState<View>('people')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const isEmployee = role === 'employee'

  const root = useMemo(() => employees.find((e) => e.managerId === null) ?? null, [employees])
  const managerCount = useMemo(
    () => employees.filter((e) => reportsOf(e.id).length > 0).length,
    [employees, reportsOf],
  )
  const allManagerIds = useMemo(
    () => employees.filter((e) => reportsOf(e.id).length > 0).map((e) => e.id),
    [employees, reportsOf],
  )

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const onSelect = (id: string) => {
    const emp = getEmployee(id)
    if (emp) push({ title: `${emp.name} · ${emp.title}`, tone: 'info' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Org Chart"
        subtitle={`Reporting structure across ${company.name}.`}
        icon={<Network className="h-5 w-5" />}
        actions={
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'people', label: 'People' },
              { value: 'departments', label: 'Departments' },
            ]}
          />
        }
      />

      {view === 'people' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Reporting tree</CardTitle>
              <Badge tone="primary" className="tnum">
                {employees.length} people
              </Badge>
              <Badge tone="neutral" className="tnum hidden sm:inline-flex">
                {managerCount} managers
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-fg" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toLowerCase())}
                  placeholder="Find a person…"
                  className="h-8 w-40 pl-8 text-[13px] sm:w-52"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsed(new Set(allManagerIds))}
                title="Collapse all"
              >
                <ChevronsDownUp className="h-4 w-4" />
                <span className="hidden sm:inline">Collapse</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsed(new Set())}
                title="Expand all"
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Expand</span>
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-3">
            {root ? (
              <OrgNode
                emp={root}
                depth={0}
                collapsed={collapsed}
                toggle={toggle}
                query={query}
                onSelect={onSelect}
              />
            ) : (
              <EmptyState
                icon={<UserCog className="h-5 w-5" />}
                title="No root found"
                description="No employee without a manager could be located."
              />
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const parent = d.parentId ? getDepartment(d.parentId) : null
            return (
              <Card key={d.id} className="transition-colors hover:border-primary/40">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold tracking-tight">{d.name}</p>
                        <p className="text-2xs text-muted-fg">
                          {parent ? `Under ${parent.name}` : 'Top level'}
                        </p>
                      </div>
                    </div>
                    <Badge tone="info" className="tnum shrink-0">
                      <Users className="h-3 w-3" /> {d.headcount}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-surface2/60 px-3 py-2">
                    <Avatar name={d.head} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{d.head}</p>
                      <p className="text-2xs text-muted-fg">Department head</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {isEmployee && view === 'people' && (
        <p className="mt-4 text-center text-2xs text-muted-fg">
          Read-only view · contact HR to request a reporting change.
        </p>
      )}
    </div>
  )
}
