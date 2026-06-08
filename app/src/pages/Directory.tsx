import { useMemo, useState, type ReactNode } from 'react'
import {
  Users, Search, MapPin, Building2, Mail, Phone, CalendarDays, Pencil,
  ChevronRight, UserCircle2, SearchX,
} from 'lucide-react'
import { useApp } from '../app/store'
import {
  type Employee,
} from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Card, Drawer, EmptyState, Input, PageHeader, Segmented,
  Select, Table, Td, Th, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type View = 'list' | 'cards'
type StatusTone = 'success' | 'warning' | 'info' | 'primary'

const statusTone: Record<Employee['status'], StatusTone> = {
  Active: 'success',
  'On Leave': 'warning',
  Probation: 'info',
  Onboarding: 'primary',
}

function formatJoin(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Directory() {
  const { employees, departments, getDepartment, getEmployee, reportsOf } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canEdit = role === 'provider_admin' || role === 'company_hr_admin' || role === 'people_manager'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesName = !q || e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
      const matchesDept = dept === 'all' || e.departmentId === dept
      return matchesName && matchesDept
    })
  }, [employees, query, dept])

  const selected = selectedId ? getEmployee(selectedId) : null
  const manager = selected ? getEmployee(selected.managerId) : null
  const reports = selected ? reportsOf(selected.id) : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="People Directory"
        subtitle={`Everyone at ${company.name} · ${employees.length} people`}
        icon={<Users className="h-5 w-5" />}
        actions={
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'List' },
              { value: 'cards', label: 'Cards' },
            ]}
          />
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or title…"
            className="pl-9"
            aria-label="Search people"
          />
        </div>
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-56" aria-label="Filter by department">
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <span className="text-sm text-muted-fg sm:ml-auto">
          <span className="font-bold text-fg tnum">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="No people match your filters"
          description="Try a different name or clear the department filter to see everyone."
          action={
            <Button variant="outline" size="sm" onClick={() => { setQuery(''); setDept('all') }}>
              Clear filters
            </Button>
          }
        />
      ) : view === 'list' ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Department</Th>
                <Th>Location</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <Tr key={e.id} className="cursor-pointer" onClick={() => setSelectedId(e.id)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{e.name}</p>
                        <p className="truncate text-xs text-muted-fg">{e.title}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted-fg">{getDepartment(e.departmentId)?.name ?? '—'}</Td>
                  <Td className="text-muted-fg">{e.location}</Td>
                  <Td>
                    <Badge tone={e.type === 'Contractor' ? 'accent' : 'neutral'}>{e.type}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={statusTone[e.status]} dot>{e.status}</Badge>
                  </Td>
                  <Td>
                    <ChevronRight className="h-4 w-4 text-muted-fg" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left',
                'shadow-card transition-colors hover:border-primary/40 hover:bg-muted/40 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <Avatar name={e.name} size="lg" />
                <Badge tone={statusTone[e.status]} dot>{e.status}</Badge>
              </div>
              <div className="min-w-0 w-full">
                <p className="truncate font-bold text-fg">{e.name}</p>
                <p className="truncate text-sm text-muted-fg">{e.title}</p>
              </div>
              <div className="mt-auto space-y-1 text-xs text-muted-fg">
                <p className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {getDepartment(e.departmentId)?.name ?? '—'}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {e.location}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Profile drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Profile"
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar name={selected.name} size="lg" className="h-14 w-14 text-lg" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-extrabold tracking-tight text-fg">{selected.name}</h3>
                <p className="truncate text-sm text-muted-fg">{selected.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone[selected.status]} dot>{selected.status}</Badge>
                  <Badge tone={selected.type === 'Contractor' ? 'accent' : 'neutral'}>{selected.type}</Badge>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface2/40 p-4 text-sm">
              <Row icon={<Building2 className="h-4 w-4" />} label="Department" value={getDepartment(selected.departmentId)?.name ?? '—'} />
              <Row icon={<MapPin className="h-4 w-4" />} label="Location" value={selected.location} />
              <Row icon={<CalendarDays className="h-4 w-4" />} label="Joined" value={formatJoin(selected.joinDate)} />
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={<span className="tnum">{selected.phone}</span>} />
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={selected.email} />
            </dl>

            <div>
              <h4 className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg">Reporting line</h4>
              {manager ? (
                <button
                  onClick={() => setSelectedId(manager.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <Avatar name={manager.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{manager.name}</p>
                    <p className="truncate text-xs text-muted-fg">Manager · {manager.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-fg" />
                </button>
              ) : (
                <p className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface2/40 p-3 text-sm text-muted-fg">
                  <UserCircle2 className="h-4 w-4" /> No manager — top of the org.
                </p>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-muted-fg">
                Direct reports {reports.length > 0 && <Badge tone="primary">{reports.length}</Badge>}
              </h4>
              {reports.length > 0 ? (
                <ul className="space-y-1.5">
                  {reports.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                      >
                        <Avatar name={r.name} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{r.name}</p>
                          <p className="truncate text-xs text-muted-fg">{r.title}</p>
                        </div>
                        <Badge tone={statusTone[r.status]} dot>{r.status}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-surface2/40 p-3 text-sm text-muted-fg">
                  No direct reports.
                </p>
              )}
            </div>

            {canEdit && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => push({ title: `Editing ${selected.name}`, tone: 'info' })}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-fg">
        {icon} {label}
      </span>
      <span className="min-w-0 truncate text-right font-medium text-fg">{value}</span>
    </div>
  )
}
