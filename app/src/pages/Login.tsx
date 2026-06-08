/**
 * Login / persona picker — a centered, focused board (reference style).
 * Top: "Sign in as" quick personas (Platform + Portfolio managers).
 * Below: the company hierarchy as collapsible portfolio → group → company rows,
 * each home-company row expandable to its people. Uniform cards throughout.
 * Tap a person to log in · tap a company to enter it.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronDown, ChevronRight, Check, Layers, Users, LogIn } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies, groups, portfolios, type Company } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

const MANAGER_OF: Record<string, string> = { pf1: 'p2', pf2: 'p6' }
const PEOPLE_OF: Record<string, { id: string; tier: string }[]> = {
  c1: [
    { id: 'p3', tier: 'Company HR' },
    { id: 'p4', tier: 'Manager' },
    { id: 'p5', tier: 'Employee' },
    { id: 'p7', tier: 'Dual role' },
  ],
}
const byId = (id: string) => personas.find((p) => p.id === id)!
const statusTone = (s: Company['status']) => (s === 'Active' ? 'success' : s === 'Suspended' ? 'warning' : 'neutral')

/* uniform person card (top grid = md, nested people = sm + tier) */
function PersonCard({ id, onClick, tier, size = 'md' }: { id: string; onClick: () => void; tier?: string; size?: 'md' | 'sm' }) {
  const p = byId(id)
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface text-left shadow-card transition-colors hover:border-accent/50',
        size === 'md' ? 'px-3.5 py-3' : 'px-3 py-2.5',
      )}
    >
      <Avatar name={p.name} size={size} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-tight">{p.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{ROLE_LABELS[p.role]}</span>
      </span>
      {tier ? (
        <Badge tone="primary">{tier}</Badge>
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-fg opacity-0 transition-opacity group-hover:opacity-100">
          <LogIn className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  )
}

export default function Login() {
  const { loginAs, setCompanyId } = useApp()
  const navigate = useNavigate()
  const [openPf, setOpenPf] = useState<Record<string, boolean>>({ pf1: true, pf2: false })
  const [openCo, setOpenCo] = useState<Record<string, boolean>>({ c1: true })

  const loginPersona = (id: string) => { loginAs(id); navigate('/') }
  const enterCompany = (c: Company) => {
    loginAs(c.portfolioId ? MANAGER_OF[c.portfolioId] : 'p1')
    setCompanyId(c.id)
    navigate('/')
  }

  const companyRow = (c: Company) => {
    const people = PEOPLE_OF[c.id]
    const open = !!openCo[c.id]
    return (
      <div key={c.id}>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-accent/50">
          <button onClick={() => enterCompany(c)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-2xs font-bold text-white', c.color)}>{c.initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold leading-tight">{c.name}</span>
              <span className="tnum block truncate text-2xs text-muted-fg">{c.employees} employees · {c.jurisdiction}</span>
            </span>
          </button>
          <Badge tone={statusTone(c.status)} dot>{c.status}</Badge>
          {people && (
            <button
              onClick={() => setOpenCo((s) => ({ ...s, [c.id]: !open }))}
              aria-label={open ? 'Collapse people' : 'Expand people'}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-muted hover:text-fg"
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        {people && open && (
          <div className="ml-4 mt-1.5 space-y-1.5 border-l-2 border-border pl-3">
            <p className="flex items-center gap-1.5 pb-0.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">
              <Users className="h-3 w-3" /> People — log in as
            </p>
            {people.map((pp) => (
              <PersonCard key={pp.id} id={pp.id} tier={pp.tier} size="sm" onClick={() => loginPersona(pp.id)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* brand */}
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-card">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SatelliteHR</h1>
            <p className="text-sm text-muted-fg">Tap a person to log in · tap a company to enter it.</p>
          </div>
        </div>

        {/* sign in as */}
        <section className="mb-8">
          <h2 className="mb-2.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Sign in as</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <PersonCard id="p1" onClick={() => loginPersona('p1')} />
            <PersonCard id="p2" onClick={() => loginPersona('p2')} />
            <PersonCard id="p6" onClick={() => loginPersona('p6')} />
          </div>
        </section>

        {/* enter a company */}
        <section>
          <h2 className="mb-2.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Enter a company</h2>
          <div className="space-y-3">
            {portfolios.map((pf) => {
              const pfCos = companies.filter((c) => c.portfolioId === pf.id)
              const groupIds = [...new Set(pfCos.filter((c) => c.groupId).map((c) => c.groupId!))]
              const standalone = pfCos.filter((c) => !c.groupId)
              const open = !!openPf[pf.id]
              return (
                <div key={pf.id} className="rounded-3xl border border-border bg-surface2/40 p-3">
                  <button
                    onClick={() => setOpenPf((s) => ({ ...s, [pf.id]: !open }))}
                    className="flex w-full items-center gap-2 px-1 pb-1 text-left"
                  >
                    {open ? <ChevronDown className="h-4 w-4 text-muted-fg" /> : <ChevronRight className="h-4 w-4 text-muted-fg" />}
                    <span className="flex-1 text-[13px] font-extrabold tracking-tight">{pf.name}</span>
                    <Badge tone="neutral">Portfolio</Badge>
                    <span className="tnum text-2xs text-muted-fg">{pfCos.length} companies</span>
                  </button>

                  {open && (
                    <div className="space-y-3 pt-1.5">
                      {groupIds.map((gid) => {
                        const g = groups.find((x) => x.id === gid)!
                        return (
                          <div key={gid} className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 px-1">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12 text-accent"><Layers className="h-3.5 w-3.5" /></span>
                              <span className="text-[13px] font-bold">{g.name}</span>
                              <Badge tone="accent">Group · {g.type}</Badge>
                              {g.sharingEnabled && (
                                <span className="flex items-center gap-1 text-2xs font-semibold text-success"><Check className="h-3 w-3" /> Sharing on</span>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              {g.companyIds.filter((id) => pfCos.some((c) => c.id === id)).map((id) => companyRow(pfCos.find((c) => c.id === id)!))}
                            </div>
                          </div>
                        )
                      })}
                      {standalone.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="px-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Standalone</p>
                          <div className="space-y-1.5">{standalone.map(companyRow)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 px-1 text-2xs text-muted-fg">
            Platform → Portfolio → Group Company → Company → people. Group companies are opt-in (enabled + audited).
          </p>
        </section>
      </div>
    </div>
  )
}
