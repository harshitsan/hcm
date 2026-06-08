import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies, type Persona } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

function scopeLabel(p: Persona) {
  if (p.companyIds.length === 0) return 'All companies'
  if (p.companyIds.length === 1) return companies.find((c) => c.id === p.companyIds[0])?.name ?? '1 company'
  return `${p.companyIds.length} companies`
}

/** A node in the scope hierarchy. Edges mean "contains / sees a broader slice than". */
function Node({
  personaId,
  tier,
  hasParent,
  hasChildren,
  onChoose,
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
        'group relative w-60 rounded-xl border border-border bg-surface px-4 py-3 text-left shadow-card transition-all',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-pop cursor-pointer',
      )}
    >
      {hasParent && <span className="absolute -top-[3px] left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-accent" />}
      {hasChildren && <span className="absolute -bottom-[3px] left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-accent" />}

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

/** straight trunk connector between two stacked nodes */
function Trunk() {
  return <span className="h-7 w-px bg-muted-fg/30" />
}

/** curved branch from one parent into two children (centers at 25% / 75%) */
function Branch() {
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full text-muted-fg/40" aria-hidden="true">
      <path d="M50 0 C 50 24, 25 16, 25 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M50 0 C 50 24, 75 16, 75 40" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function Login() {
  const { loginAs } = useApp()
  const navigate = useNavigate()
  const choose = (id: string) => {
    loginAs(id)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-pop">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">SatelliteHR</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-fg">
            One platform, many companies. Pick a persona to enter the product — each level of the
            hierarchy <span className="font-semibold text-fg">contains the ones below</span> and sees a
            narrower slice. The interface adapts to the role.
          </p>
        </div>

        {/* Scope hierarchy: Platform > {two portfolios} > Company > Manager > Employee */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-[640px] max-w-2xl flex-col items-center">
            <Node personaId="p1" tier="Platform" hasChildren onChoose={choose} />
            <Branch />
            <div className="grid w-full grid-cols-2 gap-6">
              {/* Global Shared Services portfolio — drills down to a company and its people */}
              <div className="flex flex-col items-center">
                <Node personaId="p2" tier="Portfolio" hasParent hasChildren onChoose={choose} />
                <Trunk />
                <Node personaId="p3" tier="Company" hasParent hasChildren onChoose={choose} />
                <Trunk />
                <Node personaId="p4" tier="Manager" hasParent hasChildren onChoose={choose} />
                <Trunk />
                <Node personaId="p5" tier="Employee" hasParent onChoose={choose} />
              </div>
              {/* Asia-Pacific portfolio — a second portfolio under the platform */}
              <div className="flex flex-col items-center">
                <Node personaId="p6" tier="Portfolio" hasParent onChoose={choose} />
                <p className="mt-3 max-w-[15rem] text-center text-2xs text-muted-fg">
                  A second portfolio — Delta, Orbit &amp; Nimbus. Log in as Lim, then use the company
                  switcher to move between its companies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-2xs text-muted-fg">
          Prototype · no backend · mock data. Built following the SatelliteHR product roadmap.
        </p>
      </div>
    </div>
  )
}
