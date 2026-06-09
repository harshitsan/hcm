/**
 * Login / persona picker — a NESTED hierarchy tree (reference style), so the tiers
 * read clearly: Platform → Portfolio → Group Company → Company → people.
 * Each level is indented under its parent with a connector line. Personas are the
 * nodes (tap to log in); companies are tappable to enter. Collapsible throughout.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronDown, ChevronRight, Check, Layers, LogIn } from 'lucide-react'
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

/* an indented child group with a connector line (shows nesting under a parent) */
function Branch({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="ml-3.5 space-y-2 border-l border-border pl-4 sm:ml-5 sm:pl-5">
      {label && <p className="pt-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{label}</p>}
      {children}
    </div>
  )
}

/* uniform person node (tap to log in). tone/size vary by tier. */
function PersonNode({ id, tierBadge, size = 'md', onClick }: { id: string; tierBadge?: string; size?: 'md' | 'sm'; onClick: () => void }) {
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
      {tierBadge && <Badge tone="primary">{tierBadge}</Badge>}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-fg opacity-0 transition-opacity group-hover:opacity-100">
        <LogIn className="h-3.5 w-3.5" />
      </span>
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

  /* company node + collapsible people (deepest tiers) */
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
          <Branch label="People — log in as">
            {people.map((pp) => <PersonNode key={pp.id} id={pp.id} tierBadge={pp.tier} size="sm" onClick={() => loginPersona(pp.id)} />)}
          </Branch>
        )}
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh w-full"
      style={{ background: 'linear-gradient(150deg, #15302d 0%, #16463b 48%, #2c8f72 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-white/10 bg-surface/95 p-5 shadow-pop backdrop-blur sm:p-7">
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

        {/* the hierarchy, nested by tier */}
        <div className="space-y-2">
          <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Platform</p>
          <PersonNode id="p1" tierBadge="Platform" onClick={() => loginPersona('p1')} />

          {/* portfolios are children of the platform */}
          <Branch label="Portfolios">
            {portfolios.map((pf) => {
              const pfCos = companies.filter((c) => c.portfolioId === pf.id)
              const groupIds = [...new Set(pfCos.filter((c) => c.groupId).map((c) => c.groupId!))]
              const standalone = pfCos.filter((c) => !c.groupId)
              const open = !!openPf[pf.id]
              const mgr = MANAGER_OF[pf.id]
              return (
                <div key={pf.id} className="space-y-2">
                  {/* portfolio node = its manager (login) + expand */}
                  <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-accent/50">
                    <button onClick={() => loginPersona(mgr)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <Avatar name={byId(mgr).name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold leading-tight">{pf.name}</span>
                        <span className="block truncate text-2xs text-muted-fg">{byId(mgr).name} · Portfolio Manager</span>
                      </span>
                    </button>
                    <Badge tone="neutral">Portfolio</Badge>
                    <span className="tnum hidden text-2xs text-muted-fg sm:inline">{pfCos.length} cos</span>
                    <button
                      onClick={() => setOpenPf((s) => ({ ...s, [pf.id]: !open }))}
                      aria-label={open ? 'Collapse portfolio' : 'Expand portfolio'}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                    >
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* companies are children of the portfolio */}
                  {open && (
                    <Branch>
                      {groupIds.map((gid) => {
                        const g = groups.find((x) => x.id === gid)!
                        return (
                          <div key={gid} className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
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
                          <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Standalone companies</p>
                          <div className="space-y-1.5">{standalone.map(companyRow)}</div>
                        </div>
                      )}
                    </Branch>
                  )}
                </div>
              )
            })}
          </Branch>
        </div>

        <p className="mt-6 text-2xs text-muted-fg">
          Platform → Portfolio → Group Company → Company → people. Group companies are opt-in (enabled + audited).
        </p>
        </div>
      </div>
    </div>
  )
}
