/**
 * App shell: role-scoped sidebar + topbar + company context switcher.
 * "One inbox, one switcher. Show your role, hide the rest." — the north star.
 */
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Check, ChevronsUpDown, Menu, Moon, Sun, Search, Bell, LogOut, UserCog, X, Building2,
} from 'lucide-react'
import { useApp } from '../app/store'
import { navForRole } from '../app/nav'
import { ROLE_LABELS, portfolios, type Company } from '../data/mock'
import { Avatar, Badge, Button, Tooltip, useToast } from './ui'
import { cn } from '../lib/cn'

/* --------------------------------------------------- Company context switcher */
function CompanySwitcher() {
  const { company, authorizedCompanies, setCompanyId } = useApp()
  const { push } = useToast()
  const [open, setOpen] = useState(false)

  const renderCompany = (c: Company) => (
    <button
      key={c.id}
      onClick={() => {
        setCompanyId(c.id)
        setOpen(false)
        if (c.id !== company.id) push({ title: `Switched to ${c.name}`, tone: 'primary' })
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md text-2xs font-bold text-white', c.color)}>
        {c.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{c.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{c.jurisdiction}</span>
      </span>
      {c.id === company.id && <Check className="h-4 w-4 text-primary" />}
    </button>
  )

  // group the authorized companies by portfolio (and a Standalone bucket)
  const pfGroups = [
    ...portfolios.map((pf) => ({ name: pf.name, items: authorizedCompanies.filter((c) => c.portfolioId === pf.id) })),
    { name: 'Standalone', items: authorizedCompanies.filter((c) => !c.portfolioId) },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white', company.color)}>
          {company.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight">{company.name}</span>
          <span className="block truncate text-2xs text-muted-fg">{company.code}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-fg" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            {pfGroups.map((g) => (
              <div key={g.name} className="mb-1 last:mb-0">
                <p className="px-2.5 pt-1.5 pb-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{g.name}</p>
                {g.items.map(renderCompany)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- Sidebar */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, persona, logout } = useApp()
  const groups = navForRole(role)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-fg">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="text-[15px] font-extrabold tracking-tight">SatelliteHR</span>
      </div>
      <div className="px-3 pb-3">
        <CompanySwitcher />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-2.5 pb-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-fg hover:bg-muted hover:text-fg',
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={() => {
            logout()
            onNavigate?.()
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
        >
          <Avatar name={persona?.name ?? '?'} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-fg">{persona?.name}</span>
            <span className="block truncate text-2xs text-muted-fg">Switch persona</span>
          </span>
          <UserCog className="h-4 w-4 text-muted-fg" />
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------- User menu */
function UserMenu() {
  const { persona, logout } = useApp()
  const [open, setOpen] = useState(false)
  if (!persona) return null
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted cursor-pointer">
        <Avatar name={persona.name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-bold leading-tight">{persona.name}</span>
          <span className="block text-2xs text-muted-fg">{ROLE_LABELS[persona.role]}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <div className="px-2.5 py-2">
              <p className="text-sm font-bold">{persona.name}</p>
              <p className="text-2xs text-muted-fg">{persona.title}</p>
              <Badge tone="primary" className="mt-1.5">{ROLE_LABELS[persona.role]}</Badge>
            </div>
            <div className="my-1 h-px bg-border" />
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-fg transition-colors hover:bg-muted hover:text-fg cursor-pointer">
              <UserCog className="h-4 w-4" /> Switch persona
            </button>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 cursor-pointer">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- Topbar */
function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggleTheme, company } = useApp()
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden items-center gap-2 md:flex">
        <Badge tone="neutral" dot>
          <span className="text-muted-fg">Viewing</span>&nbsp;{company.name}
        </Badge>
      </div>
      <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        <input
          placeholder="Search people, policies…"
          className="h-9 w-full rounded-lg border border-border bg-surface2 pl-9 pr-3 text-sm placeholder:text-muted-fg/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <Tooltip label={theme === 'light' ? 'Dark mode' : 'Light mode'}>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </Button>
      </Tooltip>
      <Tooltip label="Notifications">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </Button>
      </Tooltip>
      <UserMenu />
    </header>
  )
}

/* --------------------------------------------------- App shell */
export function AppShell() {
  const { company } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  // close mobile drawer on route change
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (mobileOpen) setMobileOpen(false)
  }

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface animate-slide-up">
            <Button variant="ghost" size="icon" className="absolute right-2 top-3" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Remount the page on company switch so per-company state & seeds refresh */}
          <div key={company.id}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
