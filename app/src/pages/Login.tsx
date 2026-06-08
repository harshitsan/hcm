import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies, type Persona, type Company } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

function scopeLabel(p: Persona) {
  if (p.companyIds.length === 0) return 'All companies'
  if (p.companyIds.length === 1) return companies.find((c) => c.id === p.companyIds[0])?.name ?? '1 company'
  return `${p.companyIds.length} companies`
}

const CARD = 'w-56'
const handleTop = <span className="absolute -top-[3px] left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-accent" />
const handleBottom = <span className="absolute -bottom-[3px] left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-accent" />

/** A persona node — clicking logs you in as that person. */
function Node({
  personaId, tier, hasParent, hasChildren, onChoose,
}: {
  personaId: string
  tier: string
  hasParent?: boolean
  hasChildren?: boolean
  onChoose: (id: string) => void
}) {
  const p = personas.find((x) => x.id === personaId)!
  return (
    <button
      onClick={() => onChoose(p.id)}
      className={cn(
        'group relative rounded-xl border border-border bg-surface px-4 py-3 text-left shadow-card transition-all',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-pop cursor-pointer', CARD,
      )}
    >
      {hasParent && handleTop}
      {hasChildren && handleBottom}
      <div className="flex items-center gap-3">
        <Avatar name={p.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">{p.name}</p>
          <p className="truncate text-2xs text-muted-fg">{ROLE_LABELS[p.role]}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Badge tone="primary">{tier}</Badge>
        <span className="truncate text-2xs font-semibold text-muted-fg">{scopeLabel(p)}</span>
      </div>
      <span className="pointer-events-none absolute right-3 top-3 text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  )
}

/** A company (tenant) node — clicking enters it as that portfolio's manager. */
function CompanyNode({
  company, hasChildren, onEnter,
}: {
  company: Company
  hasChildren?: boolean
  onEnter: () => void
}) {
  const statusTone = company.status === 'Active' ? 'success' : company.status === 'Suspended' ? 'warning' : 'neutral'
  return (
    <button
      onClick={onEnter}
      className={cn(
        'group relative rounded-xl border border-border bg-surface px-4 py-3 text-left shadow-card transition-all',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-pop cursor-pointer', CARD,
      )}
    >
      {handleTop}
      {hasChildren && handleBottom}
      <div className="flex items-center gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white', company.color)}>
          {company.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">{company.name}</p>
          <p className="tnum truncate text-2xs text-muted-fg">{company.employees} employees</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Badge tone="neutral">Company</Badge>
        <Badge tone={statusTone} dot>{company.status}</Badge>
      </div>
      <span className="pointer-events-none absolute right-3 top-3 text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  )
}

function Trunk() {
  return <span className="h-6 w-px bg-muted-fg/30" />
}
function Branch2() {
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-9 w-full text-muted-fg/40" aria-hidden="true">
      <path d="M50 0 C 50 22, 25 16, 25 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M50 0 C 50 22, 75 16, 75 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
function Branch3() {
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-9 w-full text-muted-fg/40" aria-hidden="true">
      <path d="M50 0 C 50 22, 16.7 16, 16.7 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M50 0 L 50 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M50 0 C 50 22, 83.3 16, 83.3 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function PortfolioSubtree({
  managerPersonaId, portfolioId, withPeople, choose, enter,
}: {
  managerPersonaId: string
  portfolioId: string
  withPeople?: boolean
  choose: (id: string) => void
  enter: (personaId: string, companyId: string) => void
}) {
  const cos = companies.filter((c) => c.portfolioId === portfolioId)
  return (
    <div className="flex flex-col items-center">
      <Node personaId={managerPersonaId} tier="Portfolio" hasParent hasChildren onChoose={choose} />
      <Branch3 />
      <div className="grid w-full grid-cols-3 items-start gap-4">
        {cos.map((c, i) => {
          const drill = withPeople && i === 0
          return (
            <div key={c.id} className="flex flex-col items-center">
              <CompanyNode company={c} hasChildren={drill} onEnter={() => enter(managerPersonaId, c.id)} />
              {drill && (
                <>
                  <Trunk />
                  <p className="mb-1 text-center text-2xs font-semibold uppercase tracking-wide text-muted-fg/70">
                    Roles inside {c.name}
                  </p>
                  <Node personaId="p3" tier="Company" hasParent hasChildren onChoose={choose} />
                  <Trunk />
                  <Node personaId="p4" tier="Manager" hasParent hasChildren onChoose={choose} />
                  <Trunk />
                  <Node personaId="p5" tier="Employee" hasParent onChoose={choose} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Login() {
  const { loginAs, setCompanyId } = useApp()
  const navigate = useNavigate()
  const choose = (id: string) => {
    loginAs(id)
    navigate('/')
  }
  const enter = (personaId: string, companyId: string) => {
    loginAs(personaId)
    setCompanyId(companyId)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-pop">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">SatelliteHR</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-fg">
            One platform, many companies. Pick a persona to enter the product — each level of the
            hierarchy <span className="font-semibold text-fg">contains the ones below</span>. Tap any
            company to jump straight into it as its portfolio manager.
          </p>
        </div>

        {/* Platform > 2 portfolios > their companies (each its own node) > Acme's people */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-[1180px] flex-col items-center">
            <Node personaId="p1" tier="Platform" hasChildren onChoose={choose} />
            <div className="w-full"><Branch2 /></div>
            <div className="grid w-full grid-cols-2 items-start gap-8">
              <PortfolioSubtree managerPersonaId="p2" portfolioId="pf1" withPeople choose={choose} enter={enter} />
              <PortfolioSubtree managerPersonaId="p6" portfolioId="pf2" choose={choose} enter={enter} />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-2xs text-muted-fg">
          Prototype · no backend · mock data. Built following the SatelliteHR product roadmap.
        </p>
      </div>
    </div>
  )
}
