import { useMemo, useState, type ReactNode } from 'react'
import {
  Network, Plus, ChevronRight, Building2, Briefcase, MapPin, Scale, Boxes,
  Search, Lock, ShieldCheck, Share2, Globe2, CornerDownRight, History,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import type { Department, Employee } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field,
  IconButton, Input, Modal, PageHeader, Select, StatCard, Switch, Table, Tabs,
  Td, Th, Tr, Tooltip, AvatarStack, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ types */
type TabKey = 'departments' | 'positions' | 'locations' | 'jurisdictions' | 'groups'

type DeptNode = {
  id: string
  name: string
  head: string
  headcount: number
  children?: DeptNode[]
}
type Position = {
  id: string
  title: string
  dept: string
  grade: string
  band: string
  filled: number
  open: number
}
type Location = {
  id: string
  name: string
  city: string
  jurisdiction: string
  headcount: number
  shared: boolean
  type: 'HQ' | 'Office' | 'Hub' | 'Remote'
}
type Jurisdiction = {
  id: string
  name: string
  region: string
  employees: number
  statutory: string[]
  assigned: boolean
}
type GroupNode = {
  id: string
  name: string
  scope: 'Global' | 'Company'
  members: number
  children?: GroupNode[]
}

const TONE_FOR_BAND: Record<string, 'info' | 'accent' | 'accent2' | 'success' | 'warning' | 'neutral'> = {
  Leadership: 'accent2',
  Senior: 'accent',
  Mid: 'info',
  Junior: 'success',
  Entry: 'neutral',
}

/* ---------------------------------------------------- deterministic mock data (Kensium Pvt Ltd / c1) */
// Departments — n-level tree (BRD 6.7) with head + headcount.
const C1_DEPARTMENTS: DeptNode[] = [
  {
    id: 'd1', name: 'Executive', head: 'Vikram Nair', headcount: 6,
    children: [
      {
        id: 'd2', name: 'Engineering', head: 'Rahul Verma', headcount: 84,
        children: [
          { id: 'd7', name: 'Platform', head: 'Divya Menon', headcount: 22 },
          { id: 'd8', name: 'Data', head: 'Imran Khan', headcount: 18 },
          { id: 'd9', name: 'Quality', head: 'Sanjay Gupta', headcount: 11 },
        ],
      },
      {
        id: 'd3', name: 'Sales', head: 'Sneha Kapoor', headcount: 52,
        children: [
          { id: 'd10', name: 'Enterprise', head: 'Fatima Sheikh', headcount: 19 },
          { id: 'd11', name: 'SMB', head: 'Mohan Das', headcount: 14 },
        ],
      },
      { id: 'd4', name: 'Finance', head: 'Arjun Desai', headcount: 23 },
      { id: 'd5', name: 'Human Resources', head: 'Priya Sharma', headcount: 14 },
      { id: 'd6', name: 'Operations', head: 'Karan Mehta', headcount: 61 },
    ],
  },
]

// Positions — grades / titles, each belongs to exactly one department (BRD 6.8).
const C1_POSITIONS: Position[] = [
  { id: 'p1', title: 'Chief Executive Officer', dept: 'Executive', grade: 'E1', band: 'Leadership', filled: 1, open: 0 },
  { id: 'p2', title: 'Engineering Lead', dept: 'Engineering', grade: 'M3', band: 'Senior', filled: 4, open: 1 },
  { id: 'p3', title: 'Backend Engineer', dept: 'Platform', grade: 'IC4', band: 'Mid', filled: 18, open: 2 },
  { id: 'p4', title: 'Data Engineer', dept: 'Data', grade: 'IC4', band: 'Mid', filled: 12, open: 1 },
  { id: 'p5', title: 'QA Engineer', dept: 'Quality', grade: 'IC3', band: 'Junior', filled: 9, open: 0 },
  { id: 'p6', title: 'Sales Director', dept: 'Sales', grade: 'M4', band: 'Senior', filled: 1, open: 0 },
  { id: 'p7', title: 'Account Executive', dept: 'Enterprise', grade: 'IC3', band: 'Mid', filled: 14, open: 3 },
  { id: 'p8', title: 'Finance Controller', dept: 'Finance', grade: 'M3', band: 'Senior', filled: 1, open: 0 },
  { id: 'p9', title: 'HR Business Partner', dept: 'Human Resources', grade: 'IC4', band: 'Mid', filled: 3, open: 1 },
  { id: 'p10', title: 'Ops Associate', dept: 'Operations', grade: 'IC2', band: 'Entry', filled: 22, open: 0 },
]

// Locations tied to a jurisdiction, with "shared across group" flag (BRD 6.5).
const C1_LOCATIONS: Location[] = [
  { id: 'loc1', name: 'Hyderabad HQ', city: 'Hyderabad', jurisdiction: 'India · Telangana', headcount: 184, shared: true, type: 'HQ' },
  { id: 'loc2', name: 'Mumbai Office', city: 'Mumbai', jurisdiction: 'India · Maharashtra', headcount: 46, shared: false, type: 'Office' },
  { id: 'loc3', name: 'Pune Office', city: 'Pune', jurisdiction: 'India · Maharashtra', headcount: 38, shared: false, type: 'Office' },
  { id: 'loc4', name: 'Chennai Hub', city: 'Chennai', jurisdiction: 'India · Tamil Nadu', headcount: 21, shared: true, type: 'Hub' },
  { id: 'loc5', name: 'Delhi Office', city: 'New Delhi', jurisdiction: 'India · Delhi', headcount: 18, shared: false, type: 'Office' },
  { id: 'loc6', name: 'Remote — India', city: 'Distributed', jurisdiction: 'India · Telangana', headcount: 5, shared: false, type: 'Remote' },
]

// Jurisdictions catalog with statutory targeting (BRD 6.4). `assigned` = operating in.
const C1_JURISDICTIONS: Jurisdiction[] = [
  { id: 'j1', name: 'India · Telangana', region: 'South Asia', employees: 189, statutory: ['PF', 'ESIC', 'PT', 'LWF'], assigned: true },
  { id: 'j2', name: 'India · Maharashtra', region: 'South Asia', employees: 84, statutory: ['PF', 'ESIC', 'PT'], assigned: true },
  { id: 'j3', name: 'India · Tamil Nadu', region: 'South Asia', employees: 21, statutory: ['PF', 'ESIC', 'PT', 'LWF'], assigned: true },
  { id: 'j4', name: 'India · Delhi', region: 'South Asia', employees: 18, statutory: ['PF', 'ESIC'], assigned: true },
  { id: 'j5', name: 'India · Karnataka', region: 'South Asia', employees: 0, statutory: ['PF', 'ESIC', 'PT'], assigned: false },
  { id: 'j6', name: 'United States · Delaware', region: 'North America', employees: 0, statutory: ['FICA', 'SUTA'], assigned: false },
]

// Groups — global + company-specific, n-level nesting (BRD 6.6).
const C1_GROUPS: GroupNode[] = [
  {
    id: 'g1', name: 'All Employees', scope: 'Global', members: 312,
    children: [
      { id: 'g2', name: 'Full-time', scope: 'Global', members: 286 },
      { id: 'g3', name: 'Contractors', scope: 'Global', members: 26 },
    ],
  },
  {
    id: 'g4', name: 'Leadership Council', scope: 'Company', members: 11,
    children: [
      { id: 'g5', name: 'Department Heads', scope: 'Company', members: 6 },
    ],
  },
  {
    id: 'g6', name: 'Engineering Guild', scope: 'Company', members: 84,
    children: [
      { id: 'g7', name: 'On-call Rotation', scope: 'Company', members: 14 },
      { id: 'g8', name: 'Architecture Review', scope: 'Company', members: 8 },
    ],
  },
  { id: 'g9', name: 'Wellness Champions', scope: 'Company', members: 19 },
]

const C1_PEOPLE_SAMPLE = [
  'Vikram Nair', 'Rahul Verma', 'Priya Sharma', 'Sneha Kapoor', 'Arjun Desai',
  'Karan Mehta', 'Divya Menon', 'Imran Khan', 'Sanjay Gupta', 'Fatima Sheikh',
]

const GRADE_DONUT_COLORS: Record<string, string> = {
  Leadership: 'rgb(var(--accent2))',
  Senior: 'rgb(var(--accent))',
  Mid: 'rgb(var(--info))',
  Junior: 'rgb(var(--success))',
  Entry: 'rgb(var(--muted-fg))',
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}

/* ------------------------------------------------------------ helpers (module scope) */
function flattenDepts(nodes: DeptNode[]): DeptNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenDepts(n.children) : [])])
}
function flattenGroups(nodes: GroupNode[]): GroupNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenGroups(n.children) : [])])
}

/* ----------------------------------------------------------- per-company derivation
 * Companies other than Kensium Pvt Ltd (c1) don't have a hand-authored org-structure
 * dataset. Deriving the org tree, positions, locations, jurisdictions & groups from the
 * company's REAL departments + employees keeps every screen scoped to the active tenant,
 * so a portfolio manager who switches companies never sees c1's chart attributed to
 * another company. */
const BAND_BY_TITLE = (title: string): string => {
  const t = title.toLowerCase()
  if (t.includes('chief') || t.includes('head') || t.includes('director')) return 'Leadership'
  if (t.includes('lead') || t.includes('principal') || t.includes('manager') || t.includes('controller') || t.includes('partner')) return 'Senior'
  if (t.includes('senior') || t.includes('business')) return 'Mid'
  if (t.includes('new hire') || t.includes('associate') || t.includes('intern')) return 'Entry'
  return 'Junior'
}

function buildDeptTree(departments: Department[]): DeptNode[] {
  const byParent = new Map<string | null, Department[]>()
  departments.forEach((d) => {
    const k = d.parentId
    byParent.set(k, [...(byParent.get(k) ?? []), d])
  })
  const build = (d: Department): DeptNode => {
    const kids = byParent.get(d.id) ?? []
    const node: DeptNode = { id: d.id, name: d.name, head: d.head, headcount: d.headcount }
    if (kids.length) node.children = kids.map(build)
    return node
  }
  const roots = byParent.get(null) ?? departments
  return roots.map(build)
}

function buildPositions(departments: Department[], employees: Employee[]): Position[] {
  const deptName = new Map(departments.map((d) => [d.id, d.name]))
  const byTitle = new Map<string, { title: string; dept: string; filled: number }>()
  employees.forEach((e) => {
    const key = `${e.title}__${e.departmentId}`
    const prev = byTitle.get(key)
    if (prev) prev.filled += 1
    else byTitle.set(key, { title: e.title, dept: deptName.get(e.departmentId) ?? '—', filled: 1 })
  })
  return [...byTitle.values()].map((p, i) => ({
    id: `pos${i + 1}`,
    title: p.title,
    dept: p.dept,
    grade: '—',
    band: BAND_BY_TITLE(p.title),
    filled: p.filled,
    open: 0,
  }))
}

function buildLocations(employees: Employee[], jurisdiction: string): Location[] {
  const counts = new Map<string, number>()
  employees.forEach((e) => counts.set(e.location, (counts.get(e.location) ?? 0) + 1))
  return [...counts.entries()].map(([name, headcount], i) => ({
    id: `loc${i + 1}`,
    name,
    city: name.replace(/\s+(HQ|Office|Hub)$/i, '').trim() || name,
    jurisdiction,
    headcount,
    shared: false,
    type: /HQ/i.test(name) ? 'HQ' : /Hub/i.test(name) ? 'Hub' : /Remote/i.test(name) ? 'Remote' : 'Office',
  }))
}

function buildJurisdictions(jurisdiction: string, total: number): Jurisdiction[] {
  const statutory = /United States|Delaware/i.test(jurisdiction)
    ? ['FICA', 'SUTA']
    : /Sri Lanka/i.test(jurisdiction)
      ? ['EPF', 'ETF']
      : ['PF', 'ESIC', 'PT']
  const region = /United States/i.test(jurisdiction)
    ? 'North America'
    : /Europe|United Kingdom/i.test(jurisdiction)
      ? 'Europe'
      : 'South Asia'
  return [{ id: 'jur1', name: jurisdiction, region, employees: total, statutory, assigned: true }]
}

function buildGroups(companyName: string, total: number): GroupNode[] {
  return [
    {
      id: 'grp1', name: 'All Employees', scope: 'Company', members: total,
      children: [
        { id: 'grp2', name: 'Full-time', scope: 'Company', members: Math.round(total * 0.9) },
        { id: 'grp3', name: 'Contractors', scope: 'Company', members: Math.max(0, total - Math.round(total * 0.9)) },
      ],
    },
    { id: 'grp4', name: `${companyName} Leadership`, scope: 'Company', members: Math.max(1, Math.round(total * 0.04)) },
  ]
}

/* ----------------------------------------------------------------- Dept tree row */
function DeptRow({
  node, depth, onAdd, canEdit,
}: {
  node: DeptNode
  depth: number
  onAdd: (parent: string) => void
  canEdit: boolean
}) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = !!node.children?.length
  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 10}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && setOpen((o) => !o)}
          aria-label={hasChildren ? (open ? 'Collapse' : 'Expand') : 'Department'}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
            hasChildren ? 'text-muted-fg hover:bg-muted hover:text-fg cursor-pointer' : 'text-transparent',
          )}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        </button>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{node.name}</p>
          <p className="truncate text-xs text-muted-fg">
            Head · {node.head}
          </p>
        </div>
        <Badge tone="neutral" className="tnum">{node.headcount}</Badge>
        {canEdit && (
          <Tooltip label="Add sub-department">
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={`Add sub-department under ${node.name}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onAdd(node.name)}
            >
              <Plus className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {hasChildren && open && (
        <ul>
          {node.children!.map((c) => (
            <DeptRow key={c.id} node={c} depth={depth + 1} onAdd={onAdd} canEdit={canEdit} />
          ))}
        </ul>
      )}
    </li>
  )
}

/* ----------------------------------------------------------------- Group tree row */
function GroupRow({ node, depth }: { node: GroupNode; depth: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = !!node.children?.length
  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 10}px` }}
      >
        {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-fg/60" />}
        <button
          type="button"
          onClick={() => hasChildren && setOpen((o) => !o)}
          aria-label={hasChildren ? (open ? 'Collapse' : 'Expand') : 'Group'}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
            hasChildren ? 'text-muted-fg hover:bg-muted hover:text-fg cursor-pointer' : 'text-transparent',
          )}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        </button>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            node.scope === 'Global' ? 'bg-accent/12 text-accent' : 'bg-accent2/15 text-accent2',
          )}
        >
          {node.scope === 'Global' ? <Globe2 className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{node.name}</p>
        </div>
        <Badge tone={node.scope === 'Global' ? 'accent' : 'accent2'}>{node.scope}</Badge>
        <Badge tone="neutral" className="tnum">{node.members}</Badge>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children!.map((c) => (
            <GroupRow key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

/* ----------------------------------------------------------------- Section card shell */
function SectionCard({
  title, subtitle, action, children,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <p className="mt-0.5 truncate text-xs text-muted-fg">{subtitle}</p>
        </div>
        {action}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  )
}

const TABS: { value: TabKey; label: string }[] = [
  { value: 'departments', label: 'Departments' },
  { value: 'positions', label: 'Positions' },
  { value: 'locations', label: 'Locations' },
  { value: 'jurisdictions', label: 'Jurisdictions' },
  { value: 'groups', label: 'Groups' },
]

const ADD_LABEL: Record<TabKey, string> = {
  departments: 'department',
  positions: 'position',
  locations: 'location',
  jurisdictions: 'jurisdiction',
  groups: 'group',
}

/* ================================================================ Page */
export default function OrgData() {
  const { role, company, companyId } = useApp()
  const { employees, departments } = useCompanyData()
  const { push } = useToast()

  // Resolve the org-structure dataset for the ACTIVE company. c1 keeps its rich
  // hand-authored tree; every other tenant gets data derived from its own
  // departments + employees so nothing is attributed to the wrong company.
  const org = useMemo(() => {
    if (companyId === 'c1') {
      return {
        depts: C1_DEPARTMENTS,
        positions: C1_POSITIONS,
        locations: C1_LOCATIONS,
        jurisdictions: C1_JURISDICTIONS,
        groups: C1_GROUPS,
        people: C1_PEOPLE_SAMPLE,
      }
    }
    return {
      depts: buildDeptTree(departments),
      positions: buildPositions(departments, employees),
      locations: buildLocations(employees, company.jurisdiction),
      jurisdictions: buildJurisdictions(company.jurisdiction, company.employees),
      groups: buildGroups(company.name, company.employees),
      people: employees.slice(0, 10).map((e) => e.name),
    }
  }, [companyId, departments, employees, company.jurisdiction, company.name, company.employees])

  const canEdit = role === 'company_hr_admin' || role === 'provider_admin' || role === 'portfolio_manager'

  const [tab, setTab] = useState<TabKey>('departments')
  const [query, setQuery] = useState('')

  // Add modal stub (deterministic — no real persistence).
  const [modalParent, setModalParent] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftMeta, setDraftMeta] = useState('')

  const openAdd = (parent?: string) => {
    setModalParent(parent ?? null)
    setDraftName('')
    setDraftMeta('')
    setOpen(true)
  }
  const submitAdd = () => {
    if (!draftName.trim()) {
      push({ title: `Give the ${ADD_LABEL[tab]} a name`, tone: 'warning' })
      return
    }
    push({ title: `${draftName.trim()} added · written to audit trail`, tone: 'success' })
    setOpen(false)
  }

  // Top-line stats (counts derived from the active company's org data).
  const stats = useMemo(() => {
    const deptCount = flattenDepts(org.depts).length
    const openSeats = org.positions.reduce((a, p) => a + p.open, 0)
    const sharedLocs = org.locations.filter((l) => l.shared).length
    const activeJur = org.jurisdictions.filter((j) => j.assigned).length
    return { deptCount, openSeats, sharedLocs, activeJur }
  }, [org])

  // Grade-band distribution donut (from the active company's positions).
  const bandData = useMemo(() => {
    const order = ['Leadership', 'Senior', 'Mid', 'Junior', 'Entry']
    return order
      .map((band) => ({
        name: band,
        value: org.positions.filter((p) => p.band === band).reduce((a, p) => a + p.filled, 0),
      }))
      .filter((d) => d.value > 0)
  }, [org])

  const filteredPositions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return org.positions
    return org.positions.filter(
      (p) => p.title.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q),
    )
  }, [query, org.positions])

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return org.locations
    return org.locations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.jurisdiction.toLowerCase().includes(q),
    )
  }, [query, org.locations])

  const showSearch = tab === 'positions' || tab === 'locations'

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Org structure & master data"
        subtitle={`Departments, positions, locations, jurisdictions & groups for ${company.name}.`}
        icon={<Network className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label="Record history">
              <IconButton variant="outline" aria-label="Record history">
                <History className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Tooltip label={`Add ${ADD_LABEL[tab]}`}>
                <IconButton variant="solid" aria-label={`Add ${ADD_LABEL[tab]}`} onClick={() => openAdd()}>
                  <Plus className="h-[18px] w-[18px]" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Departments" value={stats.deptCount} delta="n-level" deltaTone="accent" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Open positions" value={stats.openSeats} delta="hiring" deltaTone="accent2" icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Shared locations" value={stats.sharedLocs} delta="group" deltaTone="info" icon={<Share2 className="h-4 w-4" />} />
        <StatCard label="Active jurisdictions" value={stats.activeJur} delta="statutory" deltaTone="success" icon={<Scale className="h-4 w-4" />} />
      </div>

      {/* Tabs + optional search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs tabs={TABS} value={tab} onChange={(v) => setTab(v as TabKey)} />
        {showSearch && (
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'positions' ? 'Search title, dept or grade…' : 'Search location or jurisdiction…'}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* -------------------------------------------------- Departments tab */}
      {tab === 'departments' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="Department hierarchy"
              subtitle="N-level tree · each node carries a department head and live headcount (BRD §6.7)."
              action={
                canEdit && (
                  <Tooltip label="Add top-level department">
                    <IconButton variant="outline" size="sm" aria-label="Add top-level department" onClick={() => openAdd()}>
                      <Plus className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ul className="-mx-1">
                {org.depts.map((d) => (
                  <DeptRow key={d.id} node={d} depth={0} onAdd={(p) => openAdd(p)} canEdit={canEdit} />
                ))}
              </ul>
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Department heads" subtitle="Approvals & reporting route to these owners.">
              <ul className="space-y-3">
                {flattenDepts(org.depts)
                  .filter((d) => d.name !== 'Executive')
                  .slice(0, 6)
                  .map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">{d.head}</p>
                        <p className="truncate text-xs text-muted-fg">{d.name}</p>
                      </div>
                      <Badge tone="info" className="tnum">{d.headcount}</Badge>
                    </li>
                  ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <AvatarStack names={org.people} max={5} size="sm" />
                <span className="text-xs text-muted-fg">{employees.length} people mapped to this tree</span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- Positions tab */}
      {tab === 'positions' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="Positions"
              subtitle="Grades & titles · each position belongs to exactly one department (BRD §6.8)."
              action={
                canEdit && (
                  <Tooltip label="Add position">
                    <IconButton variant="outline" size="sm" aria-label="Add position" onClick={() => openAdd()}>
                      <Plus className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              {filteredPositions.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="No positions found"
                  description="Try a different title, department or grade."
                  action={<Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <thead>
                      <Tr className="border-t-0 hover:bg-transparent">
                        <Th>Title</Th>
                        <Th>Department</Th>
                        <Th>Grade</Th>
                        <Th>Band</Th>
                        <Th className="text-right">Filled</Th>
                        <Th className="text-right">Open</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {filteredPositions.map((p) => (
                        <Tr key={p.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                                <Briefcase className="h-4 w-4" />
                              </span>
                              <span className="font-semibold text-fg">{p.title}</span>
                            </div>
                          </Td>
                          <Td className="text-muted-fg">{p.dept}</Td>
                          <Td><Badge tone="neutral" className="tnum">{p.grade}</Badge></Td>
                          <Td><Badge tone={TONE_FOR_BAND[p.band]}>{p.band}</Badge></Td>
                          <Td className="text-right tnum text-muted-fg">{p.filled}</Td>
                          <Td className="text-right">
                            {p.open > 0
                              ? <Badge tone="accent2" className="tnum">{p.open}</Badge>
                              : <span className="tnum text-muted-fg">0</span>}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Filled headcount by band" subtitle="Distribution across grade bands.">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bandData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                      {bandData.map((d) => (
                        <Cell key={d.name} fill={GRADE_DONUT_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {bandData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: GRADE_DONUT_COLORS[d.name] }} />
                      <span className="text-muted-fg">{d.name}</span>
                    </span>
                    <span className="tnum font-semibold text-fg">{d.value}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- Locations tab */}
      {tab === 'locations' && (
        <SectionCard
          title="Locations"
          subtitle='Each tied to a jurisdiction · "shared across group" flag controls cross-company reuse (BRD §6.5).'
          action={
            canEdit && (
              <Tooltip label="Add location">
                <IconButton variant="outline" size="sm" aria-label="Add location" onClick={() => openAdd()}>
                  <Plus className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          {filteredLocations.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No locations found"
              description="Try a different location or jurisdiction."
              action={<Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLocations.map((l) => (
                <div key={l.id} className="rounded-xl border border-border bg-surface2/40 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                      <MapPin className="h-4 w-4" />
                    </span>
                    {l.shared
                      ? <Badge tone="info"><Share2 className="h-3 w-3" /> Shared</Badge>
                      : <Badge tone="neutral">{l.type}</Badge>}
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-fg" title={l.name}>{l.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-fg">{l.jurisdiction}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-fg">Headcount</span>
                    <span className="tnum text-sm font-semibold text-fg">{l.headcount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* -------------------------------------------------- Jurisdictions tab */}
      {tab === 'jurisdictions' && (
        <SectionCard
          title="Jurisdictions"
          subtitle="Catalog with statutory targeting · assigned jurisdictions drive policy & compliance scope (BRD §6.4)."
          action={
            canEdit && (
              <Tooltip label="Assign jurisdiction">
                <IconButton variant="outline" size="sm" aria-label="Assign jurisdiction" onClick={() => openAdd()}>
                  <Plus className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Jurisdiction</Th>
                  <Th>Region</Th>
                  <Th>Statutory targets</Th>
                  <Th className="text-right">Employees</Th>
                  <Th>Status</Th>
                </Tr>
              </thead>
              <tbody>
                {org.jurisdictions.map((j) => (
                  <Tr key={j.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                          <Scale className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-fg">{j.name}</span>
                      </div>
                    </Td>
                    <Td className="text-muted-fg">{j.region}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {j.statutory.map((s) => (
                          <Badge key={s} tone="accent">{s}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td className="text-right tnum text-muted-fg">{j.employees}</Td>
                    <Td>
                      {j.assigned
                        ? <Badge tone="success" dot>Operating</Badge>
                        : <Badge tone="neutral" dot>In catalog</Badge>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-fg">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            A jurisdiction with assigned employees cannot be removed — the system blocks removal until staff are reassigned (FS COMP-FR-008).
          </p>
        </SectionCard>
      )}

      {/* -------------------------------------------------- Groups tab */}
      {tab === 'groups' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="Groups"
              subtitle="Global + company-specific groups with n-level nesting for policy & access targeting (BRD §6.6)."
              action={
                canEdit && (
                  <Tooltip label="Add group">
                    <IconButton variant="outline" size="sm" aria-label="Add group" onClick={() => openAdd()}>
                      <Plus className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ul className="-mx-1">
                {org.groups.map((g) => (
                  <GroupRow key={g.id} node={g} depth={0} />
                ))}
              </ul>
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Targeting" subtitle="What groups drive across the platform.">
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Policy eligibility', icon: <ShieldCheck className="h-4 w-4" />, tone: 'accent' as const },
                  { label: 'Access control', icon: <Lock className="h-4 w-4" />, tone: 'accent2' as const },
                  { label: 'Reporting segments', icon: <Boxes className="h-4 w-4" />, tone: 'info' as const },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-fg">{row.icon}</span>
                    <span className="flex-1 font-semibold text-fg">{row.label}</span>
                    <Badge tone={row.tone}>active</Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <Globe2 className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-fg">
                  {flattenGroups(org.groups).filter((g) => g.scope === 'Global').length} global · {flattenGroups(org.groups).filter((g) => g.scope === 'Company').length} company groups
                </span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {!canEdit && (
        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-fg">
          <Lock className="h-3.5 w-3.5" />
          Read-only view — org structure and master data are maintained by your company's HR administrator.
        </p>
      )}

      {/* -------------------------------------------------- Add modal stub */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add ${ADD_LABEL[tab]}`}
        description={
          modalParent
            ? `New ${ADD_LABEL[tab]} under "${modalParent}". Changes are written to the company audit trail.`
            : `Create a new ${ADD_LABEL[tab]} for ${company.name}. Changes are written to the company audit trail.`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitAdd}>
              <Plus className="h-4 w-4" /> Add {ADD_LABEL[tab]}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={
                tab === 'departments' ? 'e.g. Customer Success'
                  : tab === 'positions' ? 'e.g. Staff Engineer'
                    : tab === 'locations' ? 'e.g. Bengaluru Office'
                      : tab === 'jurisdictions' ? 'e.g. India · Karnataka'
                        : 'e.g. Hybrid Workers'
              }
              autoFocus
            />
          </Field>

          {tab === 'departments' && (
            <Field label="Department head">
              <Select value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} aria-label="Department head">
                <option value="">Select a head…</option>
                {org.people.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </Field>
          )}

          {tab === 'positions' && (
            <Field label="Parent department" required hint="A position belongs to exactly one department (BRD §6.8.1).">
              <Select value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} aria-label="Parent department">
                <option value="">Select a department…</option>
                {flattenDepts(org.depts).map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </Select>
            </Field>
          )}

          {tab === 'locations' && (
            <>
              <Field label="Jurisdiction" required>
                <Select value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} aria-label="Jurisdiction">
                  <option value="">Select a jurisdiction…</option>
                  {org.jurisdictions.map((j) => (
                    <option key={j.id} value={j.name}>{j.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-fg">Shared across group</p>
                  <p className="text-xs text-muted-fg">Allow other group companies to reuse this site.</p>
                </div>
                <Switch checked={draftMeta === 'shared'} onChange={(v) => setDraftMeta(v ? 'shared' : '')} label="" />
              </div>
            </>
          )}

          {tab === 'jurisdictions' && (
            <Field label="Region" hint="Selected from the supported jurisdiction catalog.">
              <Select value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} aria-label="Region">
                <option value="">Select a region…</option>
                <option value="South Asia">South Asia</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
              </Select>
            </Field>
          )}

          {tab === 'groups' && (
            <Field label="Scope">
              <Select value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} aria-label="Scope">
                <option value="Company">Company</option>
                <option value="Global">Global</option>
              </Select>
            </Field>
          )}

          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ShieldCheck className="h-3 w-3" /> Prototype — saving is mocked. Real changes are audited with actor & timestamp (BRD §6.29).
          </p>
        </div>
      </Modal>
    </div>
  )
}
