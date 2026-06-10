/**
 * Sidebar in the reference style: brand, search pill, a 2-column grid of
 * nav tiles (active = charcoal), quick links, and the persona card at the
 * bottom (doubles as the demo persona switcher).
 */
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronsUpDown,
  FileText,
  History,
  Home,
  Inbox,
  PieChart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PERSONAS, type NavKey } from '../data'
import { cn } from '../lib'
import { Avatar } from '../ui'
import { useApp } from '../store'

const NAV_META: Record<NavKey, { label: string; to: string; icon: React.ReactNode }> = {
  home: { label: 'Home', to: '/', icon: <Home /> },
  timeoff: { label: 'Time off', to: '/time-off', icon: <CalendarDays /> },
  inbox: { label: 'Inbox', to: '/inbox', icon: <Inbox /> },
  people: { label: 'People', to: '/people', icon: <Users /> },
  rules: { label: 'Rules & flows', to: '/rules', icon: <SlidersHorizontal /> },
  hiring: { label: 'Hiring', to: '/hiring', icon: <Briefcase /> },
  access: { label: 'Roles & access', to: '/access', icon: <ShieldCheck /> },
  activity: { label: 'Activity', to: '/activity', icon: <History /> },
  documents: { label: 'Documents', to: '/documents', icon: <FileText /> },
  companies: { label: 'Companies', to: '/companies', icon: <Building2 /> },
  reports: { label: 'Reports', to: '/reports', icon: <PieChart /> },
}

const QUICK_LINKS: Record<string, { label: string; to: string }[]> = {
  employee: [
    { label: 'Request time off', to: '/time-off' },
    { label: 'Documents to read', to: '/documents' },
  ],
  manager: [
    { label: 'Waiting on you', to: '/inbox' },
    { label: 'Team calendar', to: '/time-off' },
  ],
  hradmin: [
    { label: 'Rules waiting for approval', to: '/rules' },
    { label: 'This month’s report', to: '/reports' },
  ],
  portfolio: [
    { label: 'Across your companies', to: '/companies' },
    { label: 'Roll out a rule', to: '/rules' },
  ],
  operator: [
    { label: 'Add a company', to: '/companies/new' },
    { label: 'Platform health', to: '/reports' },
  ],
}

export function Sidebar() {
  const { persona, setPersonaId, setCmdOpen } = useApp()
  const [switcher, setSwitcher] = useState(false)
  const navigate = useNavigate()

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col gap-5 px-5 py-6">
      {/* brand */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink">
          <span className="block h-3 w-3 rounded-full border-[3px] border-accent" />
        </span>
        <span className="font-display text-[19px] font-semibold tracking-tight">SatelliteHR</span>
      </button>

      {/* search */}
      <button
        onClick={() => setCmdOpen(true)}
        className="flex items-center gap-2.5 rounded-full border border-line/80 bg-card px-4 py-2.5 text-left text-[13px] text-muted shadow-soft transition-colors hover:border-line"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <kbd className="rounded-md bg-card2 px-1.5 py-0.5 text-[10px] font-bold text-muted">⌘K</kbd>
      </button>

      {/* nav tiles */}
      <nav className="grid grid-cols-2 gap-2.5">
        {persona.nav.map((key) => {
          const m = NAV_META[key]
          return (
            <NavLink
              key={key}
              to={m.to}
              end={m.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex aspect-[1.18] flex-col items-start justify-between rounded-2xl border p-3.5 transition-all',
                  isActive
                    ? 'ink-card border-transparent text-card shadow-lift'
                    : 'border-line/80 bg-card text-ink shadow-soft hover:-translate-y-0.5 hover:shadow-lift',
                )
              }
            >
              <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{m.icon}</span>
              <span className="text-[12px] font-bold leading-tight">{m.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* quick links */}
      <div className="px-1">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">For you</div>
        <ul className="space-y-1">
          {(QUICK_LINKS[persona.id] ?? []).map((q) => (
            <li key={q.label}>
              <button
                onClick={() => navigate(q.to)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] font-medium text-ink-soft transition-colors hover:bg-card"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {q.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1" />

      {/* persona card + demo switcher */}
      <div className="relative">
        {switcher && (
          <div className="absolute bottom-full left-0 right-0 z-30 mb-2 animate-slide-up rounded-2xl border border-line bg-card p-1.5 shadow-pop">
            <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
              Demo · view as
            </div>
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPersonaId(p.id)
                  setSwitcher(false)
                  navigate('/')
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-card2',
                  p.id === persona.id && 'bg-card2',
                )}
              >
                <Avatar name={p.name} hue={p.hue} size="sm" />
                <span className="flex-1">
                  <span className="block text-[13px] font-bold leading-tight">{p.name}</span>
                  <span className="block text-[11px] text-muted">{p.title}</span>
                </span>
                {p.id === persona.id && <span className="h-2 w-2 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setSwitcher((s) => !s)}
          className="flex w-full items-center gap-2.5 rounded-2xl bg-ink p-2.5 text-left text-card shadow-lift transition-transform active:scale-[0.99]"
        >
          <Avatar name={persona.name} hue={persona.hue} size="sm" />
          <span className="flex-1">
            <span className="block text-[13px] font-bold leading-tight">{persona.name}</span>
            <span className="block text-[11px] text-card/60">{persona.title}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 text-card/60" />
        </button>
      </div>
    </aside>
  )
}
