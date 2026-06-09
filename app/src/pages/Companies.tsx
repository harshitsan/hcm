import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Plus, Search, Eye, Download, Ban, Users, CheckCircle2, AlertTriangle,
  MapPin, Layers, LogIn,
} from 'lucide-react'
import { useApp } from '../app/store'
import { portfolios, groups, type Company } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Input, PageHeader,
  Select, StatCard, Stepper, Table, Td, Th, Tr, Drawer, useToast,
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
  return 1
}

export default function Companies() {
  const { authorizedCompanies, enterCompany, company: current } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Company | null>(null)

  const filtered = useMemo(
    () =>
      authorizedCompanies.filter((c) => {
        const q = query.toLowerCase()
        const matchQ = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        const matchS = status === 'all' || c.status === status
        return matchQ && matchS
      }),
    [authorizedCompanies, query, status],
  )

  // group the (filtered) companies by portfolio, with a Standalone bucket
  const sections = useMemo(() => {
    const out = portfolios
      .map((pf) => ({ kind: 'portfolio' as const, pf, items: filtered.filter((c) => c.portfolioId === pf.id) }))
      .filter((s) => s.items.length > 0)
    const standalone = filtered.filter((c) => !c.portfolioId)
    return { out, standalone }
  }, [filtered])

  const totalEmployees = authorizedCompanies.reduce((a, c) => a + c.employees, 0)
  const activeCount = authorizedCompanies.filter((c) => c.status === 'Active').length
  const attentionCount = authorizedCompanies.filter((c) => c.status !== 'Active').length

  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name

  const openCompany = (c: Company) => {
    enterCompany(c.id)
    push({ title: `Opened ${c.name}`, tone: 'primary' })
    navigate('/')
  }

  const renderRow = (c: Company) => (
    <Tr key={c.id}>
      <Td>
        <div className="flex items-center gap-2.5">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-2xs font-bold text-white', c.color)}>
            {c.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {c.name}
              {c.id === current.id && <span className="ml-1.5 text-2xs font-bold text-primary">· current</span>}
            </p>
            <p className="tnum text-xs text-muted-fg">{c.code}</p>
          </div>
        </div>
      </Td>
      <Td className="text-muted-fg">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.jurisdiction}</span>
      </Td>
      <Td>{groupName(c.groupId) ? <Badge tone="accent">{groupName(c.groupId)}</Badge> : <span className="text-xs text-muted-fg">—</span>}</Td>
      <Td className="tnum text-muted-fg">{c.employees}</Td>
      <Td><Badge tone={tierTone[c.tier]}>{c.tier}</Badge></Td>
      <Td><Badge tone={statusTone[c.status]} dot>{c.status}</Badge></Td>
      <Td className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setSelected(c)}><Eye className="h-4 w-4" /> View</Button>
          <Button size="sm" variant="ghost" onClick={() => openCompany(c)} aria-label={`Open ${c.name}`}><LogIn className="h-4 w-4" /></Button>
        </div>
      </Td>
    </Tr>
  )

  const headRow = () => (
    <thead>
      <Tr className="border-t-0 hover:bg-transparent">
        <Th>Company</Th><Th>Jurisdiction</Th><Th>Group</Th><Th>Employees</Th><Th>Tier</Th><Th>Status</Th>
        <Th className="text-right">Actions</Th>
      </Tr>
    </thead>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Companies"
        subtitle="Every tenant you're authorized to manage, grouped by portfolio."
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <Button onClick={() => navigate('/admin/company-setup')}>
            <Plus className="h-4 w-4" /> Create company
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Companies" value={authorizedCompanies.length} delta={`${sections.out.length} portfolios`} deltaTone="primary" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Active" value={activeCount} deltaTone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Need attention" value={attentionCount} delta="suspended / draft" deltaTone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Total employees" value={totalEmployees.toLocaleString()} deltaTone="info" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or code…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="sm:w-44">
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Draft">Draft</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="No companies match" description="Try a different search or status filter." />
      ) : (
        <div className="space-y-6">
          {sections.out.map((s) => (
            <Card key={s.pf.id}>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" /></span>
                  <div>
                    <CardTitle>{s.pf.name}</CardTitle>
                    <p className="text-2xs text-muted-fg">{s.pf.code} · managed by {s.pf.manager}</p>
                  </div>
                </div>
                <Badge tone="neutral">{s.items.length} companies</Badge>
              </CardHeader>
              <CardBody className="p-0">
                <Table>{headRow()}<tbody>{s.items.map(renderRow)}</tbody></Table>
              </CardBody>
            </Card>
          ))}

          {sections.standalone.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-fg"><Building2 className="h-4 w-4" /></span>
                  <div>
                    <CardTitle>Standalone</CardTitle>
                    <p className="text-2xs text-muted-fg">Companies not in any portfolio</p>
                  </div>
                </div>
                <Badge tone="neutral">{sections.standalone.length} companies</Badge>
              </CardHeader>
              <CardBody className="p-0">
                <Table>{headRow()}<tbody>{sections.standalone.map(renderRow)}</tbody></Table>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Company detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width="max-w-md">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white', selected.color)}>
                {selected.initials}
              </span>
              <div>
                <p className="tnum text-sm font-semibold">{selected.code}</p>
                <p className="text-xs text-muted-fg">{selected.jurisdiction}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Employees</p>
                <p className="tnum mt-0.5 text-lg font-extrabold">{selected.employees}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Tier</p>
                <p className="mt-1"><Badge tone={tierTone[selected.tier]}>{selected.tier}</Badge></p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Portfolio</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{portfolios.find((p) => p.id === selected.portfolioId)?.name ?? 'Standalone'}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Group</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{groupName(selected.groupId) ?? '—'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg">Lifecycle</p>
              <Stepper steps={lifecycle} current={lifecycleStep(selected.status)} />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button size="sm" onClick={() => { openCompany(selected); setSelected(null) }}><LogIn className="h-4 w-4" /> Open company</Button>
              <Button size="sm" variant="outline" onClick={() => push({ title: 'Data export queued', tone: 'info' })}><Download className="h-4 w-4" /> Export data</Button>
              <Button size="sm" variant="ghost" onClick={() => push({ title: `${selected.name} suspended`, tone: 'warning' })}><Ban className="h-4 w-4" /> Suspend</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
