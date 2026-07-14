import { useState, type ReactNode } from 'react'
import {
  Building2,
  Building,
  Briefcase,
  Globe,
  MapPin,
  Network,
  Users,
  CalendarDays,
  Clock,
  Package,
  Settings,
  Plug,
  List,
  Layers,
  CreditCard,
  ShieldCheck,
  Upload,
  Plus,
  Filter,
} from 'lucide-react'
import {
  Button,
  StatusPill,
  TypePill,
  Avatar,
  AvatarStack,
  ProgressCell,
  DateRange,
  SearchInput,
  Tabs,
  Sidebar,
  WorkspaceCard,
  NavGroup,
  NavItem,
  TopBar,
  AppShell,
  DataTable,
  TableGroup,
  type TabItem,
  type StatusPillProps,
} from '../src'
import { companies, companyStats, type CompanyStatus } from './fixtures'

const statusTone: Record<CompanyStatus, StatusPillProps['tone']> = {
  Active: 'success',
  Draft: 'info',
  Suspended: 'high',
  Inactive: 'neutral',
}

const companyTabs: TabItem[] = [
  { id: 'directory', label: 'Directory', icon: List },
  { id: 'groups', label: 'Groups & Portfolios', icon: Layers },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

function CompaniesSidebar() {
  return (
    <Sidebar>
      <WorkspaceCard name='SatelliteHR' org='Aurora Group' />
      <SearchInput placeholder='Search' kbd='⌘F' />
      <NavGroup label='Organization'>
        <NavItem icon={Building2} label='Companies' active />
        <NavItem icon={Building} label='Group Companies' />
        <NavItem icon={Briefcase} label='Portfolios' />
        <NavItem icon={Globe} label='Jurisdictions' />
        <NavItem icon={MapPin} label='Locations' />
        <NavItem icon={Network} label='Departments' />
      </NavGroup>
      <NavGroup label='Workforce'>
        <NavItem icon={Users} label='Employees' />
        <NavItem icon={CalendarDays} label='Leave' />
        <NavItem icon={Clock} label='Time & Attendance' />
        <NavItem icon={Package} label='Assets' />
      </NavGroup>
      <NavGroup label='Platform'>
        <NavItem icon={Settings} label='Settings' />
        <NavItem icon={Plug} label='Integrations' />
      </NavGroup>
    </Sidebar>
  )
}

function CompaniesView() {
  const [tab, setTab] = useState('directory')

  return (
    <AppShell sidebar={<CompaniesSidebar />}>
      <TopBar
        breadcrumb='Organization'
        title='Companies'
        actions={
          <>
            <Button variant='secondary'>
              <Upload />
              Import
            </Button>
            <Button variant='primary'>
              <Plus />
              New Company
            </Button>
          </>
        }
      />
      <Tabs tabs={companyTabs} value={tab} onChange={setTab} />

      <div className='grid grid-cols-4 gap-4'>
        {companyStats.map((stat) => (
          <div
            key={stat.label}
            className='rounded-[var(--radius-ds-lg)] border border-border p-4'
          >
            <div className='text-2xl font-bold text-ink'>{stat.value}</div>
            <div className='mt-1 text-xs text-ink-muted'>{stat.label}</div>
          </div>
        ))}
      </div>

      <TableGroup
        title='All companies'
        count={companies.length}
        action={
          <Button variant='secondary' size='sm'>
            <Filter />
            Filter
          </Button>
        }
      >
        <DataTable
          getRowKey={(row) => row.id}
          data={companies}
          columns={[
            {
              id: 'company',
              header: 'Company',
              cell: (row) => (
                <div>
                  <div className='font-medium text-ink'>{row.name}</div>
                  <div className='text-xs text-ink-muted'>{row.code}</div>
                </div>
              ),
            },
            {
              id: 'jurisdiction',
              header: 'Jurisdiction',
              cell: (row) => row.jurisdiction,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusPill tone={statusTone[row.status]}>{row.status}</StatusPill>
              ),
            },
            {
              id: 'employees',
              header: 'Employees',
              cell: (row) => <AvatarStack names={row.people} max={4} />,
            },
            {
              id: 'usage',
              header: 'Usage',
              cell: (row) => (
                <ProgressCell
                  value={Math.round((row.employeesUsed / row.employeeLimit) * 100)}
                />
              ),
            },
            {
              id: 'subscription',
              header: 'Subscription',
              cell: (row) => <TypePill icon={Layers}>{row.subscription}</TypePill>,
            },
          ]}
        />
      </TableGroup>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-sm font-semibold text-ink'>{title}</h2>
      <div className='rounded-[var(--radius-ds-lg)] border border-border bg-ground p-5'>
        {children}
      </div>
    </section>
  )
}

function ComponentsView() {
  const [galleryTab, setGalleryTab] = useState('one')
  const [search, setSearch] = useState('')

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-8 px-8 py-10'>
      <div>
        <h1 className='text-2xl font-bold text-ink'>SatelliteHR UI</h1>
        <p className='mt-1 text-sm text-ink-muted'>
          Design system v2 — component gallery
        </p>
      </div>

      <Section title='Buttons'>
        <div className='flex items-center gap-3'>
          <Button variant='primary'>New Member</Button>
          <Button variant='secondary'>New Project</Button>
          <Button variant='ghost'>Ghost</Button>
        </div>
      </Section>

      <Section title='Status pills'>
        <div className='flex flex-wrap items-center gap-2'>
          <StatusPill tone='high'>High</StatusPill>
          <StatusPill tone='medium'>Medium</StatusPill>
          <StatusPill tone='low'>Low</StatusPill>
          <StatusPill tone='success'>Active</StatusPill>
          <StatusPill tone='info'>Draft</StatusPill>
          <StatusPill tone='neutral'>Inactive</StatusPill>
        </div>
      </Section>

      <Section title='Type pills'>
        <div className='flex flex-wrap items-center gap-2'>
          <TypePill icon={Layers}>Basic</TypePill>
          <TypePill icon={Layers}>Standard</TypePill>
          <TypePill icon={Layers}>Enterprise</TypePill>
        </div>
      </Section>

      <Section title='Avatars'>
        <div className='flex items-center gap-6'>
          <Avatar name='Aarav Shah' />
          <AvatarStack names={['Aarav Shah', 'Neha Kapoor', 'Rohan Mehta', 'Ishita Rao', 'Sara Ali']} max={4} />
        </div>
      </Section>

      <Section title='Progress'>
        <div className='flex flex-col gap-2'>
          <ProgressCell value={20} />
          <ProgressCell value={50} />
          <ProgressCell value={90} />
        </div>
      </Section>

      <Section title='Date range'>
        <DateRange from='2024-01-08' to='2024-01-22' />
      </Section>

      <Section title='Search input'>
        <div className='max-w-xs'>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search'
            kbd='⌘F'
          />
        </div>
      </Section>

      <Section title='Tabs'>
        <Tabs
          tabs={[
            { id: 'one', label: 'Directory', icon: List },
            { id: 'two', label: 'Groups', icon: Layers },
            { id: 'three', label: 'Admin', icon: ShieldCheck },
          ]}
          value={galleryTab}
          onChange={setGalleryTab}
        />
      </Section>

      <Section title='Sidebar nav items'>
        <div className='max-w-56 rounded-[var(--radius-ds)] border border-border bg-surface p-2'>
          <NavItem icon={Building2} label='Companies' active />
          <NavItem icon={Users} label='Employees' />
          <NavItem icon={CalendarDays} label='Leave' />
        </div>
      </Section>

      <Section title='Data table'>
        <DataTable
          getRowKey={(row) => row.id}
          data={companies.slice(0, 3)}
          columns={[
            { id: 'name', header: 'Company', cell: (row) => row.name },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusPill tone={statusTone[row.status]}>{row.status}</StatusPill>
              ),
            },
          ]}
        />
      </Section>
    </div>
  )
}

export function App() {
  const [view, setView] = useState<'components' | 'companies'>('companies')

  return (
    <div className='min-h-screen bg-ground'>
      <div className='flex items-center gap-1 border-b border-border bg-ground px-4 py-2'>
        <button
          type='button'
          onClick={() => setView('components')}
          className={
            view === 'components'
              ? 'rounded-[var(--radius-ds)] bg-muted px-3 py-1.5 text-sm font-medium text-ink'
              : 'rounded-[var(--radius-ds)] px-3 py-1.5 text-sm text-ink-muted hover:bg-muted'
          }
        >
          Components
        </button>
        <button
          type='button'
          onClick={() => setView('companies')}
          className={
            view === 'companies'
              ? 'rounded-[var(--radius-ds)] bg-muted px-3 py-1.5 text-sm font-medium text-ink'
              : 'rounded-[var(--radius-ds)] px-3 py-1.5 text-sm text-ink-muted hover:bg-muted'
          }
        >
          Companies
        </button>
      </div>
      {view === 'components' ? <ComponentsView /> : <CompaniesView />}
    </div>
  )
}
