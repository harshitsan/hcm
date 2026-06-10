/**
 * People — directory cards + a clean org chart, with a profile drawer
 * showing the 6 facts people actually check (ux-research §5.1).
 * In the all-companies view every card says which company (and group) a
 * person belongs to, and a chip row narrows the list per company.
 */
import { useState } from 'react'
import { MapPin, Network, UserPlus, Users } from 'lucide-react'
import { Donut } from '../charts'
import { Avatar, Btn, Card, Drawer, EmptyState, Input, Pill, SectionTitle, Segmented, Stat, Timeline, statusTone } from '../ui'
import { MY_BALANCES, PEOPLE, type Person } from '../data'
import { useApp } from '../store'
import { cn } from '../lib'

const VIEWS = ['Cards', 'Org chart'] as const

/** org chart is per company — the tree here is always Acme's */
const reportsOf = (id: string) => PEOPLE.filter((p) => p.managerId === id && p.companyId === 'acme')

/* compact card used in the org chart */
function OrgCard({
  person,
  reports,
  active,
  onClick,
}: {
  person: Person
  reports: number
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border bg-card px-3.5 py-2.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift',
        active ? 'border-accent' : 'border-line/80',
      )}
    >
      <Avatar name={person.name} hue={person.hue} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-bold leading-tight tracking-tight">{person.name}</span>
        <span className="block truncate text-[11px] leading-tight text-muted">{person.role}</span>
      </span>
      {reports > 0 && (
        <Pill tone={active ? 'amber' : 'neutral'} className="ml-1 shrink-0">
          {reports} reports
        </Pill>
      )}
    </button>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1 text-[13px] font-semibold">{children}</div>
    </div>
  )
}

export default function People() {
  const { company, myCompanies, companies } = useApp()
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('Everyone')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [view, setView] = useState<(typeof VIEWS)[number]>('Cards')
  const [selected, setSelected] = useState<Person | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>('p2')

  const global = company.id === 'all'

  // everyone this persona can see — the single source for counts and filters
  const visible = global
    ? PEOPLE.filter((p) => myCompanies.some((c) => c.id === p.companyId))
    : PEOPLE.filter((p) => p.companyId === company.id)

  const scoped =
    global && companyFilter !== 'all' ? visible.filter((p) => p.companyId === companyFilter) : visible

  const deptOptions = ['Everyone', ...Array.from(new Set(scoped.map((p) => p.dept)))]
  const activeDept = deptOptions.includes(dept) ? dept : 'Everyone'

  const q = query.trim().toLowerCase()
  const filtered = scoped.filter(
    (p) =>
      (activeDept === 'Everyone' || p.dept === activeDept) &&
      (q === '' || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)),
  )

  const teamCount = new Set(visible.map((p) => p.dept)).size
  const joiningCount = visible.filter((p) => p.status === 'Joining soon').length

  const acme = companies.find((c) => c.id === 'acme')
  const root = PEOPLE.find((p) => p.id === 'p1')!
  const directs = reportsOf(root.id)
  const expanded = expandedId ? PEOPLE.find((p) => p.id === expandedId) : undefined
  const expandedKids = expandedId ? reportsOf(expandedId) : []
  const manager = selected?.managerId ? PEOPLE.find((p) => p.id === selected.managerId) : undefined
  const selectedCompany = selected ? companies.find((c) => c.id === selected.companyId) : undefined

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">People</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Everyone at {global ? 'your companies' : company.name}
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Find a teammate, see who reports to whom — click anyone for the full picture.
            </p>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Users />} value={company.employees} label="People" />
            <Stat icon={<Network />} value={teamCount} label="Teams" />
            <Stat icon={<UserPlus />} value={joiningCount} label="Joining" />
          </div>
        </div>
      </Card>

      {/* company chips — only in the all-companies view */}
      {global && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCompanyFilter('all')}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
              companyFilter === 'all'
                ? 'border-transparent bg-ink text-card shadow-sm'
                : 'border-line bg-card text-muted hover:text-ink',
            )}
          >
            All companies
          </button>
          {myCompanies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompanyFilter(c.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
                companyFilter === c.id
                  ? 'border-transparent bg-ink text-card shadow-sm'
                  : 'border-line bg-card text-muted hover:text-ink',
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.accent }} />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={global ? 'Search across your companies…' : 'Search by name or role…'}
          className="w-72"
        />
        <Segmented options={deptOptions} value={activeDept} onChange={setDept} />
        <Segmented options={VIEWS} value={view} onChange={setView} className="ml-auto" />
      </div>

      {view === 'Cards' ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No one matches"
            body="Try a different name, role, or team — everyone at the company is in here."
            action={
              <Btn
                variant="outline"
                size="sm"
                onClick={() => { setQuery(''); setDept('Everyone'); setCompanyFilter('all') }}
              >
                Clear search
              </Btn>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const pc = companies.find((c) => c.id === p.companyId)
              return (
                <Card key={p.id} className="p-5" onClick={() => setSelected(p)}>
                  <div className="flex items-center gap-3.5">
                    <Avatar name={p.name} hue={p.hue} size="lg" />
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-bold tracking-tight">{p.name}</div>
                      <div className="truncate text-[12.5px] text-muted">{p.role}</div>
                    </div>
                  </div>
                  {global && pc && (
                    <div className="mt-3.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pc.accent }} />
                      <span className="truncate">
                        {pc.name}
                        {pc.group ? ` · ${pc.group}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone="outline">{p.dept}</Pill>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted">
                      <MapPin className="h-3 w-3" />
                      {p.location}
                    </span>
                    {p.status !== 'Active' && (
                      <Pill tone={statusTone(p.status)} dot>
                        {p.status}
                      </Pill>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* org chart — no libraries, just connectors */
        <Card className="p-6">
          <SectionTitle hint="Click a manager to open their team, or anyone else for their profile">
            Reporting lines
          </SectionTitle>
          {global && (
            <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: acme?.accent }} />
              Org charts are per company — showing Acme Tech. Pick a company to see its own.
            </div>
          )}
          <div className="flex flex-col items-center pb-2">
            <OrgCard person={root} reports={directs.length} onClick={() => setSelected(root)} />
            <div className="h-6 w-px bg-line" />
            <div className="h-px w-3/4 bg-line" />
            <div className="grid w-full grid-cols-4 gap-3">
              {directs.map((d) => {
                const kids = reportsOf(d.id)
                const isOpen = expandedId === d.id
                return (
                  <div key={d.id} className="flex flex-col items-center">
                    <div className="h-4 w-px bg-line" />
                    <OrgCard
                      person={d}
                      reports={kids.length}
                      active={isOpen}
                      onClick={() =>
                        kids.length > 0 ? setExpandedId(isOpen ? null : d.id) : setSelected(d)
                      }
                    />
                    {isOpen && kids.length > 0 && <div className="h-5 w-px bg-line" />}
                  </div>
                )
              })}
            </div>
            {expanded && expandedKids.length > 0 && (
              <div className="w-full rounded-2xl border border-line/70 bg-card2/40 p-4">
                <div className="mb-3 text-center text-[12px] font-semibold text-muted">
                  {expanded.name.split(' ')[0]}'s team · {expandedKids.length} people
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {expandedKids.map((k) => (
                    <OrgCard key={k.id} person={k} reports={reportsOf(k.id).length} onClick={() => setSelected(k)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* profile drawer — the facts people check */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Profile">
        {selected && (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} hue={selected.hue} size="xl" />
              <div>
                <div className="text-[18px] font-bold tracking-tight">{selected.name}</div>
                <div className="text-[13px] text-muted">{selected.role}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
              <Fact label="Team">{selected.dept}</Fact>
              <Fact label="Manager">{manager ? manager.name : '—'}</Fact>
              <Fact label="Location">{selected.location}</Fact>
              <Fact label="Email">{selected.email}</Fact>
              <Fact label="Status">
                <Pill tone={statusTone(selected.status)} dot>
                  {selected.status}
                </Pill>
              </Fact>
              <Fact label="Company">
                {selectedCompany ? `${selectedCompany.name} · since Feb 2026` : '—'}
              </Fact>
              <Fact label="Part of">{selectedCompany?.group ?? 'Standalone'}</Fact>
            </div>

            <div className="mt-7">
              <div className="mb-3 text-[13px] font-bold tracking-tight">Time off</div>
              <div className="grid grid-cols-3 gap-3">
                {MY_BALANCES.map((b) => (
                  <div key={b.type} className="flex flex-col items-center rounded-2xl bg-card2/60 px-2 py-3.5">
                    <Donut
                      value={b.total - b.used}
                      max={b.total}
                      size={56}
                      stroke={7}
                      center={<span className="text-[13px] font-bold">{b.total - b.used}</span>}
                    />
                    <div className="mt-2 text-[11.5px] font-semibold">{b.type}</div>
                    <div className="text-[10.5px] text-muted">of {b.total} days</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 text-[13px] font-bold tracking-tight">Milestones</div>
              <Timeline
                steps={[
                  { label: 'Joined', at: 'Feb 2026', done: true },
                  { label: 'Confirmed', at: 'May 2026', done: true },
                  { label: 'Next review', at: 'Sep 2026', done: false },
                ]}
              />
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}
