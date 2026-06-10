/**
 * People — directory cards, a real table, and a per-company org chart, with a
 * profile drawer showing the 6 facts people actually check (ux-research §5.1).
 * In the all-companies view every card says which company (and group) a
 * person belongs to, and a chip row narrows the list per company.
 */
import { useState } from 'react'
import { MapPin, MessagesSquare, Network, UserPlus, Users } from 'lucide-react'
import { Donut } from '../charts'
import { Avatar, Btn, Card, Drawer, EmptyState, Field, Input, Pill, Select, Stat, Segmented, Timeline, Toggle, statusTone } from '../ui'
import { MY_BALANCES, type Person } from '../data'
import { useApp } from '../store'
import { cn } from '../lib'

const VIEWS = ['Cards', 'Table', 'Org chart'] as const
type View = (typeof VIEWS)[number]

const STATUS_OPTIONS = ['Anyone', 'Active', 'On leave', 'Joining soon'] as const

const TEAM_CHOICES = ['Engineering', 'Design', 'People', 'Sales', 'Finance', 'Operations', 'Leadership'] as const

/* ── org helpers: reporting lines never cross company walls ── */

const reportsIn = (people: Person[], companyId: string, managerId: string) =>
  people.filter((p) => p.managerId === managerId && p.companyId === companyId)

const rootOf = (people: Person[], companyId: string) =>
  people.find((p) => p.companyId === companyId && !p.managerId)

/** the first direct with their own reports — the team worth opening first */
const defaultExpandedFor = (people: Person[], companyId: string): string | null => {
  const root = rootOf(people, companyId)
  if (!root) return null
  return reportsIn(people, companyId, root.id).find((d) => reportsIn(people, companyId, d.id).length > 0)?.id ?? null
}

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
  const { persona, company, myCompanies, companies, people, addPerson, policies, observations, addObservation, toast } = useApp()
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('Everyone')
  const [location, setLocation] = useState('All places')
  const [status, setStatus] = useState('Anyone')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [view, setView] = useState<View>('Cards')
  const [selected, setSelected] = useState<Person | null>(null)

  /* ── report something — humans are the sensor (Policy Studio) ── */
  const [reportOpen, setReportOpen] = useState(false)
  const [reportClauseKey, setReportClauseKey] = useState('')
  const [reportPolarity, setReportPolarity] = useState<'a concern' | 'something good'>('a concern')
  const [reportNote, setReportNote] = useState('')
  const [reportAnon, setReportAnon] = useState(false)
  const [orgCompanyId, setOrgCompanyId] = useState('acme')
  const [expandedId, setExpandedId] = useState<string | null>(() => defaultExpandedFor(people, 'acme'))

  /* ── add someone (the "Add and edit people" permission, made real) ── */
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState('')
  const [addDept, setAddDept] = useState<string>('Engineering')
  const [addLocation, setAddLocation] = useState('')
  const [addCompanyId, setAddCompanyId] = useState('acme')

  const canAdd = persona.id === 'hradmin' || persona.id === 'portfolio' || persona.id === 'operator'

  const global = company.id === 'all'

  const openAdd = () => {
    setAddCompanyId(global ? (myCompanies[0]?.id ?? 'acme') : company.id)
    setAddOpen(true)
  }

  const submitAdd = () => {
    const name = addName.trim() || 'New teammate'
    const role = addRole.trim() || 'New joiner'
    const where = addLocation.trim() || 'Bengaluru'
    const cid = persona.multiCompany ? addCompanyId : company.id
    addPerson({
      id: 'p' + (people.length + 1),
      name,
      role,
      dept: addDept as Person['dept'],
      location: where,
      email: name.split(' ')[0].toLowerCase() + '@' + cid + '.in',
      status: 'Joining soon',
      managerId: cid === 'acme' ? 'p2' : undefined,
      hue: people.length % 6,
      companyId: cid,
    })
    toast(`${name} added — their day-one checklist just started`)
    setAddOpen(false)
    setAddName('')
    setAddRole('')
    setAddDept('Engineering')
    setAddLocation('')
  }

  // everyone this persona can see — the single source for counts and filters
  const visible = global
    ? people.filter((p) => myCompanies.some((c) => c.id === p.companyId))
    : people.filter((p) => p.companyId === company.id)

  const scoped =
    global && companyFilter !== 'all' ? visible.filter((p) => p.companyId === companyFilter) : visible

  const deptOptions = ['Everyone', ...Array.from(new Set(scoped.map((p) => p.dept)))]
  const activeDept = deptOptions.includes(dept) ? dept : 'Everyone'

  const locationOptions = ['All places', ...Array.from(new Set(scoped.map((p) => p.location)))]
  const activeLocation = locationOptions.includes(location) ? location : 'All places'

  const q = query.trim().toLowerCase()
  const filtered = scoped.filter(
    (p) =>
      (activeDept === 'Everyone' || p.dept === activeDept) &&
      (activeLocation === 'All places' || p.location === activeLocation) &&
      (status === 'Anyone' || p.status === status) &&
      (q === '' || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)),
  )

  const clearFilters = () => {
    setQuery('')
    setDept('Everyone')
    setLocation('All places')
    setStatus('Anyone')
    setCompanyFilter('all')
  }

  const teamCount = new Set(visible.map((p) => p.dept)).size
  const joiningCount = visible.filter((p) => p.status === 'Joining soon').length

  /* ── org chart: always one named company's tree ── */
  const pickOrgCompany = (id: string) => {
    setOrgCompanyId(id)
    setExpandedId(defaultExpandedFor(people, id))
  }

  const switchView = (v: View) => {
    setView(v)
    // arriving at the org chart already narrowed to a company? show that one
    if (v === 'Org chart' && global && companyFilter !== 'all') pickOrgCompany(companyFilter)
  }

  const orgCo = global ? (companies.find((c) => c.id === orgCompanyId) ?? companies[0]) : company
  const orgRoot = rootOf(people, orgCo.id)
  const orgDirects = orgRoot ? reportsIn(people, orgCo.id, orgRoot.id) : []
  const expanded = expandedId ? people.find((p) => p.id === expandedId) : undefined
  const expandedKids = expandedId ? reportsIn(people, orgCo.id, expandedId) : []
  const manager = selected?.managerId ? people.find((p) => p.id === selected.managerId) : undefined
  const selectedCompany = selected ? companies.find((c) => c.id === selected.companyId) : undefined

  /* report-bound clauses across published policies — the "Related to" options */
  const reportClauses = policies
    .filter((pol) => pol.status === 'Published')
    .flatMap((pol) =>
      pol.clauses
        .filter((c) => c.binding?.kind === 'report')
        .map((clause) => ({ key: pol.id + '|' + clause.id, policy: pol, clause })),
    )
  const chosenReport = reportClauses.find((rc) => rc.key === reportClauseKey) ?? reportClauses[0]
  const forcedAnon = chosenReport?.clause.binding?.report?.anonymous === true

  const openReport = () => {
    const camera = reportClauses.find((rc) => rc.clause.title.toLowerCase().includes('camera')) ?? reportClauses[0]
    setReportClauseKey(camera?.key ?? '')
    setReportPolarity('a concern')
    setReportNote('')
    setReportAnon(false)
    setReportOpen(true)
  }

  const submitReport = () => {
    if (!selected || !chosenReport) return
    addObservation({
      id: 'ob' + (observations.length + 1),
      about: selected.name,
      aboutHue: selected.hue,
      clause: chosenReport.clause.title,
      policy: chosenReport.policy.name,
      polarity: reportPolarity === 'a concern' ? 'concern' : 'kudos',
      note: reportNote.trim() || 'No details given',
      by: persona.name,
      anonymous: forcedAnon || reportAnon,
      status: 'open',
      when: 'just now',
    })
    toast(
      reportPolarity === 'a concern'
        ? `On the record — it routes via ${chosenReport.clause.binding?.flow ?? "the clause's flow"} and lands in the right inbox`
        : 'Nice — their manager just heard about it',
    )
    setReportOpen(false)
  }

  const emptyState = (
    <EmptyState
      icon={<Users />}
      title="No one matches"
      body="Try a different name, role, team, place, or status — everyone at the company is in here."
      action={
        <Btn variant="outline" size="sm" onClick={clearFilters}>
          Clear search
        </Btn>
      }
    />
  )

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
          <div className="flex flex-wrap items-center gap-6 pb-1">
            <Stat icon={<Users />} value={company.employees} label="People" />
            <Stat icon={<Network />} value={teamCount} label="Teams" />
            <Stat icon={<UserPlus />} value={joiningCount} label="Joining" />
            {canAdd && (
              <Btn variant="dark" onClick={openAdd}>
                <UserPlus className="h-4 w-4" />
                Add someone
              </Btn>
            )}
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
        <Select
          value={activeLocation}
          onChange={(e) => setLocation(e.target.value)}
          className="!w-auto min-w-[150px]"
          aria-label="Filter by place"
        >
          {locationOptions.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="!w-auto min-w-[150px]"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Segmented options={VIEWS} value={view} onChange={switchView} className="ml-auto" />
      </div>

      {view === 'Cards' ? (
        filtered.length === 0 ? (
          emptyState
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
      ) : view === 'Table' ? (
        filtered.length === 0 ? (
          emptyState
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line/70">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Person</th>
                  {global && (
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Company</th>
                  )}
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Team</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Location</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pc = companies.find((c) => c.id === p.companyId)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="cursor-pointer border-b border-line/40 transition-colors last:border-0 hover:bg-card2/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} hue={p.hue} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-bold tracking-tight">{p.name}</div>
                            <div className="truncate text-[11.5px] text-muted">{p.role}</div>
                          </div>
                        </div>
                      </td>
                      {global && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pc?.accent }} />
                            {pc?.name ?? '—'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Pill tone="outline">{p.dept}</Pill>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted">
                          <MapPin className="h-3 w-3" />
                          {p.location}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={statusTone(p.status)} dot>
                          {p.status}
                        </Pill>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        /* org chart — no libraries, just connectors; always one named company */
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: orgCo.accent }} />
                <h3 className="text-[14px] font-bold tracking-tight">{orgCo.name} — org chart</h3>
              </div>
              <p className="mt-0.5 text-[12.5px] text-muted">
                Click a manager to open their team, or anyone else for their profile.
              </p>
            </div>
            {global && (
              <div className="flex flex-wrap items-center gap-2">
                {myCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickOrgCompany(c.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
                      orgCo.id === c.id
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
          </div>
          {orgRoot ? (
            <div className="flex flex-col items-center pb-2">
              <OrgCard person={orgRoot} reports={orgDirects.length} onClick={() => setSelected(orgRoot)} />
              {orgDirects.length > 0 && (
                <>
                  <div className="h-6 w-px bg-line" />
                  <div className="h-px w-3/4 bg-line" />
                  <div className="flex w-full flex-wrap items-start justify-center gap-3">
                    {orgDirects.map((d) => {
                      const kids = reportsIn(people, orgCo.id, d.id)
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
                </>
              )}
              {expanded && expandedKids.length > 0 && (
                <div className="w-full rounded-2xl border border-line/70 bg-card2/40 p-4">
                  <div className="mb-3 text-center text-[12px] font-semibold text-muted">
                    {expanded.name.split(' ')[0]}'s team · {expandedKids.length} people
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {expandedKids.map((k) => (
                      <OrgCard
                        key={k.id}
                        person={k}
                        reports={reportsIn(people, orgCo.id, k.id).length}
                        onClick={() => setSelected(k)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Network />}
              title="No reporting lines yet"
              body={`${orgCo.name} hasn't brought its people in yet — the chart will draw itself as they join.`}
            />
          )}
        </Card>
      )}

      {/* add-someone drawer — HR's "Add and edit people" permission, made real */}
      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add someone"
        footer={
          <Btn variant="dark" className="w-full" onClick={submitAdd}>
            <UserPlus className="h-4 w-4" />
            Add them
          </Btn>
        }
      >
        <div className="space-y-5">
          <Field label="Full name">
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Asha Verma" />
          </Field>
          <Field label="What will they do?">
            <Input value={addRole} onChange={(e) => setAddRole(e.target.value)} placeholder="e.g. Payroll Specialist" />
          </Field>
          <Field label="Team">
            <Select value={addDept} onChange={(e) => setAddDept(e.target.value)}>
              {TEAM_CHOICES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Where">
            <Input value={addLocation} onChange={(e) => setAddLocation(e.target.value)} placeholder="e.g. Bengaluru" />
          </Field>
          {persona.multiCompany ? (
            <Field label="Company">
              <Select value={addCompanyId} onChange={(e) => setAddCompanyId(e.target.value)}>
                {myCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-[12.5px] text-muted">Joins {company.name}</p>
          )}
        </div>
      </Drawer>

      {/* profile drawer — the facts people check */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Profile"
        footer={
          <Btn variant="outline" size="sm" onClick={openReport}>
            <MessagesSquare className="h-4 w-4" /> Report something
          </Btn>
        }
      >
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

      {/* report-something drawer — a concern or something good, routed by the clause's flow */}
      <Drawer
        open={reportOpen && !!selected}
        onClose={() => setReportOpen(false)}
        title="Report something"
        footer={
          <Btn variant="dark" className="w-full" onClick={submitReport}>
            <MessagesSquare className="h-4 w-4" /> Send it
          </Btn>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">About</span>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-card2/60 px-3.5 py-2.5">
                <Avatar name={selected.name} hue={selected.hue} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold tracking-tight">{selected.name}</div>
                  <div className="truncate text-[11.5px] text-muted">{selected.role}</div>
                </div>
              </div>
            </div>
            <Field label="Related to" hint="Only clauses people can report under show up here.">
              <Select value={chosenReport?.key ?? ''} onChange={(e) => setReportClauseKey(e.target.value)}>
                {reportClauses.map((rc) => (
                  <option key={rc.key} value={rc.key}>
                    {rc.clause.title} — {rc.policy.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="This is">
              <Segmented
                options={['a concern', 'something good'] as const}
                value={reportPolarity}
                onChange={setReportPolarity}
              />
            </Field>
            <Field label="What happened">
              <textarea
                rows={3}
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="A line or two of what you saw…"
                className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </Field>
            <div>
              <div className={forcedAnon ? 'pointer-events-none opacity-60' : undefined}>
                <Toggle on={forcedAnon || reportAnon} onChange={setReportAnon} label="Keep me anonymous" />
              </div>
              {forcedAnon && <p className="mt-1 text-[11.5px] text-muted">always anonymous for this clause</p>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
