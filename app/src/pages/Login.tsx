import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { useApp } from '../app/store'
import { personas, ROLE_LABELS, companies } from '../data/mock'
import { Avatar, Badge } from '../components/ui'
import { cn } from '../lib/cn'

export default function Login() {
  const { loginAs } = useApp()
  const navigate = useNavigate()

  const choose = (id: string) => {
    loginAs(id)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-pop">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">SatelliteHR</h1>
          <p className="mt-2 max-w-md text-sm text-muted-fg">
            One platform, many companies. This is a clickable prototype — pick a persona to see the
            product through their eyes. The interface adapts to each role.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => {
            const scope =
              p.companyIds.length === 0
                ? 'All companies'
                : p.companyIds.length === 1
                  ? companies.find((c) => c.id === p.companyIds[0])?.name
                  : `${p.companyIds.length} companies`
            return (
              <button
                key={p.id}
                onClick={() => choose(p.id)}
                className={cn(
                  'group flex flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop cursor-pointer',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">{p.name}</p>
                    <p className="truncate text-xs text-muted-fg">{p.title}</p>
                  </div>
                </div>
                <Badge tone="primary" className="mt-3 w-fit">{ROLE_LABELS[p.role]}</Badge>
                <p className="mt-3 flex-1 text-sm text-muted-fg">{p.blurb}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">{scope}</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Continue <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-2xs text-muted-fg">
          Prototype · no backend · mock data. Built following the SatelliteHR product roadmap.
        </p>
      </div>
    </div>
  )
}
