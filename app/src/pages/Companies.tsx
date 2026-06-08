import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Plus, Search, Eye, Download, Ban, Users, CheckCircle2, PauseCircle, MapPin,
} from 'lucide-react'
import { useApp } from '../app/store'
import { companies as allCompanies, type Company } from '../data/mock'
import {
  Badge, Button, Card, EmptyState, Input, PageHeader, Select, StatCard, Stepper,
  Table, Td, Th, Tr, Drawer, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type StatusFilter = 'all' | Company['status']

const statusTone: Record<Company['status'], 'success' | 'warning' | 'neutral'> = {
  Active: 'success',
  Suspended: 'warning',
  Draft: 'neutral',
}
const tierTone: Record<Company['tier'], 'primary' | 'info' | 'neutral'> = {
  Enterprise: 'primary',
  Standard: 'info',
  Basic: 'neutral',
}

const lifecycle = ['Draft', 'Active', 'Suspended', 'Inactive', 'Archived']
function lifecycleStep(status: Company['status']): number {
  if (status === 'Draft') return 0
  if (status === 'Suspended') return 2
  return 1 // Active
}

export default function Companies() {
  const { role, authorizedCompanies } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()

  const canManage = role === 'provider_admin' || role === 'portfolio_manager'
  const scope = canManage ? allCompanies : authorizedCompanies

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Company | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scope.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.jurisdiction.toLowerCase().includes(q)
      const matchS = status === 'all' || c.status === status
      return matchQ && matchS
    })
  }, [scope, query, status])

  const stats = useMemo(() => {
    const total = scope.length
    const active = scope.filter((c) => c.status === 'Active').length
    const suspended = scope.filter((c) => c.status === 'Suspended').length
    const people = scope.reduce((sum, c) => sum + c.employees, 0)
    return { total, active, suspended, people }
  }, [scope])

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Building2 className="h-5 w-5" />}
        title="Companies"
        subtitle={
          canManage
            ? 'Portfolio of tenant companies you administer across the platform.'
            : 'Companies you have access to.'
        }
        actions={
          canManage ? (
            <Button onClick={() => navigate('/admin/company-setup')}>
              <Plus className="h-4 w-4" /> Create company
            </Button>
          ) : undefined
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total companies" value={stats.total} delta="in portfolio" deltaTone="primary" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Active" value={stats.active} delta="live tenants" deltaTone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Suspended" value={stats.suspended} delta="needs review" deltaTone="warning" icon={<PauseCircle className="h-4 w-4" />} />
        <StatCard label="Employees" value={stats.people.toLocaleString()} delta="across all" deltaTone="info" icon={<Users className="h-4 w-4" />} />
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, code, jurisdiction…"
              className="pl-8"
              aria-label="Search companies"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-40"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Draft">Draft</option>
            </Select>
            <span className="hidden text-xs font-semibold text-muted-fg tnum sm:inline">
              {filtered.length} of {scope.length}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No companies match"
              description="Try a different search term or clear the status filter."
            />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Jurisdiction</Th>
                <Th className="text-right">Employees</Th>
                <Th>Tier</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white', c.color)}>
                        {c.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{c.name}</p>
                        <p className="truncate text-2xs text-muted-fg">
                          {c.code}{c.group ? ` · ${c.group}` : ''}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-muted-fg">
                      <MapPin className="h-3.5 w-3.5" /> {c.jurisdiction}
                    </span>
                  </Td>
                  <Td className="text-right font-semibold tnum">{c.employees}</Td>
                  <Td><Badge tone={tierTone[c.tier]}>{c.tier}</Badge></Td>
                  <Td><Badge tone={statusTone[c.status]} dot>{c.status}</Badge></Td>
                  <Td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(c)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Company details" width="max-w-lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white', selected.color)}>
                {selected.initials}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold tracking-tight">{selected.name}</h3>
                <p className="truncate text-xs text-muted-fg">{selected.code}</p>
              </div>
              <Badge tone={statusTone[selected.status]} dot className="ml-auto">{selected.status}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Jurisdiction</dt>
                <dd className="mt-0.5 text-sm font-semibold text-fg">{selected.jurisdiction}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Tier</dt>
                <dd className="mt-0.5"><Badge tone={tierTone[selected.tier]}>{selected.tier}</Badge></dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Employees</dt>
                <dd className="mt-0.5 text-sm font-semibold text-fg tnum">{selected.employees}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Group</dt>
                <dd className="mt-0.5 text-sm font-semibold text-fg">{selected.group ?? '—'}</dd>
              </div>
            </dl>

            <div>
              <p className="mb-3 text-2xs font-bold uppercase tracking-wide text-muted-fg">Lifecycle</p>
              <Stepper steps={lifecycle} current={lifecycleStep(selected.status)} />
            </div>

            {canManage && (
              <div className="flex items-center gap-2 border-t border-border pt-5">
                <Button
                  variant="ghost"
                  onClick={() => push({ title: `Export queued for ${selected.name}`, tone: 'info' })}
                >
                  <Download className="h-4 w-4" /> Export data
                </Button>
                <Button
                  variant="ghost"
                  disabled={selected.status === 'Suspended'}
                  onClick={() => push({ title: `${selected.name} suspended`, tone: 'warning' })}
                >
                  <Ban className="h-4 w-4" /> Suspend
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
