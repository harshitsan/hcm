import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, Layers } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies, groups, type Company } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

const CARD = 'flex w-72 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left shadow-card transition-all'
const CLICKABLE = 'group cursor-pointer hover:-translate-y-px hover:border-primary/50 hover:shadow-pop'

/* ---- node cards ---- */
function PersonaCard({ personaId, tier, onChoose }: { personaId: string; tier: string; onChoose: (id: string) => void }) {
  const p = personas.find((x) => x.id === personaId)!
  return (
    <button onClick={() => onChoose(p.id)} className={cn(CARD, CLICKABLE, 'border-border bg-surface')}>
      <Avatar name={p.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight">{p.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{ROLE_LABELS[p.role]}</span>
      </span>
      <Badge tone="primary">{tier}</Badge>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-fg opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

function GroupCard({ groupId }: { groupId: string }) {
  const g = groups.find((x) => x.id === groupId)!
  return (
    <div className={cn(CARD, 'border-dashed border-border bg-surface2/60')}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Layers className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight">{g.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{g.type} · {g.companyIds.length} companies</span>
      </span>
      <Badge tone="accent">Group</Badge>
    </div>
  )
}

function CompanyCard({ company, onEnter }: { company: Company; onEnter: () => void }) {
  const tone = company.status === 'Active' ? 'success' : company.status === 'Suspended' ? 'warning' : 'neutral'
  return (
    <button onClick={onEnter} className={cn(CARD, CLICKABLE, 'border-border bg-surface')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-2xs font-bold text-white', company.color)}>
        {company.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight">{company.name}</span>
        <span className="tnum block truncate text-2xs text-muted-fg">{company.employees} employees</span>
      </span>
      <Badge tone={tone} dot>{company.status}</Badge>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-fg opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

/* ---- indented-tree scaffolding (elbow connectors) ---- */
function Item({ children }: { children: ReactNode }) {
  return (
    <li className="relative">
      <span className="absolute -left-6 top-[26px] h-px w-6 bg-border" aria-hidden="true" />
      {children}
    </li>
  )
}
function Branch({ children }: { children: ReactNode }) {
  return <ul className="ml-3 mt-3 space-y-3 border-l border-border pl-6">{children}</ul>
}

const MANAGER_OF: Record<string, string> = { pf1: 'p2', pf2: 'p6' }

export default function Login() {
  const { loginAs, setCompanyId } = useApp()
  const navigate = useNavigate()
  const choose = (id: string) => {
    loginAs(id)
    navigate('/')
  }
  const enter = (company: Company) => {
    const mgr = company.portfolioId ? MANAGER_OF[company.portfolioId] : 'p1'
    loginAs(mgr)
    setCompanyId(company.id)
    navigate('/')
  }

  // company node, with Acme drilling into its three roles
  const companyItem = (c: Company) => (
    <Item key={c.id}>
      <CompanyCard company={c} onEnter={() => enter(c)} />
      {c.id === 'c1' && (
        <Branch>
          <Item><PersonaCard personaId="p3" tier="Company HR" onChoose={choose} /></Item>
          <Item><PersonaCard personaId="p4" tier="Manager" onChoose={choose} /></Item>
          <Item><PersonaCard personaId="p5" tier="Employee" onChoose={choose} /></Item>
        </Branch>
      )}
    </Item>
  )

  // a portfolio's children = its group-companies (each with their companies) + standalone companies
  const portfolioChildren = (portfolioId: string) => {
    const cos = companies.filter((c) => c.portfolioId === portfolioId)
    const groupIds = [...new Set(cos.filter((c) => c.groupId).map((c) => c.groupId!))]
    const standalone = cos.filter((c) => !c.groupId)
    return (
      <Branch>
        {groupIds.map((gid) => (
          <Item key={gid}>
            <GroupCard groupId={gid} />
            <Branch>{cos.filter((c) => c.groupId === gid).map(companyItem)}</Branch>
          </Item>
        ))}
        {standalone.map(companyItem)}
      </Branch>
    )
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-start px-4 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-pop">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">SatelliteHR</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-fg">
            One platform, many companies. The full hierarchy is{' '}
            <span className="font-semibold text-fg">Platform → Portfolio → Group Company → Company → people</span>.
            Pick a persona to enter as them, or tap a company to jump straight in.
          </p>
        </div>

        {/* Indented hierarchy tree */}
        <div className="w-full overflow-x-auto">
          <ul className="min-w-[460px] space-y-3">
            {/* Platform (root) */}
            <li>
              <PersonaCard personaId="p1" tier="Platform" onChoose={choose} />
              <Branch>
                {/* Portfolio: Global Shared Services */}
                <Item>
                  <PersonaCard personaId="p2" tier="Portfolio" onChoose={choose} />
                  {portfolioChildren('pf1')}
                </Item>
                {/* Portfolio: Asia-Pacific Operations */}
                <Item>
                  <PersonaCard personaId="p6" tier="Portfolio" onChoose={choose} />
                  {portfolioChildren('pf2')}
                </Item>
              </Branch>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-2xs text-muted-fg">
          Prototype · no backend · mock data. Built following the SatelliteHR product roadmap.
        </p>
      </div>
    </div>
  )
}
