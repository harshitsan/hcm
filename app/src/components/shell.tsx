/**
 * App shell v2 — "Orbit" layout, modeled on the reference dashboard:
 *   • left CIRCULAR ICON RAIL (quick actions + theme + sign-out)
 *   • top bar: company switcher pill · black-pill GROUP nav · search · bell · avatar
 *   • secondary SUB-NAV of pills for the active group's items (role-scoped)
 * "One inbox, one switcher. Show your role, hide the rest."
 */
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Check, ChevronsUpDown, Menu, Moon, Sun, Search, Bell, LogOut, UserCog, X, Building2,
  Plus, Star, CalendarDays, LifeBuoy, LayoutDashboard, type LucideIcon,
} from 'lucide-react'
import { useApp } from '../app/store'
import { navForRole, type NavGroup } from '../app/nav'
import { ROLE_LABELS, portfolios, type Company } from '../data/mock'
import { Avatar, Badge, IconButton, Tooltip, useToast } from './ui'
import { cn } from '../lib/cn'

/* Short labels for the top group pills (full names live in the sub-nav). */
const SHORT: Record<string, string> = {
  'Overview': 'Home',
  'Time & Leave': 'Time',
  'Hiring & Lifecycle': 'Hiring',
  'Policies & Documents': 'Policies',
  'Admin & Setup': 'Admin',
}
const shortLabel = (g: string) => SHORT[g] ?? g

const isActive = (path: string, pathname: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')

/* --------------------------------------------------- Left icon rail */
function RailItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Tooltip label={label}>
      <IconButton variant="ghost" onClick={onClick} aria-label={label}>
        <Icon className="h-[18px] w-[18px]" />
      </IconButton>
    </Tooltip>
  )
}

function Rail() {
  const { theme, toggleTheme, logout, persona } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()
  const soon = (label: string) => push({ title: `${label} — prototype`, tone: 'neutral' })

  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface/70 py-4 backdrop-blur lg:flex">
      <button
        onClick={() => navigate('/')}
        aria-label="Home"
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-rail cursor-pointer"
      >
        <Building2 className="h-5 w-5" />
      </button>
      <RailItem icon={LayoutDashboard} label="Home" onClick={() => navigate('/')} />
      <RailItem icon={Plus} label="Create" onClick={() => soon('Create')} />
      <RailItem icon={Search} label="Search" onClick={() => soon('Search')} />
      <RailItem icon={Star} label="Saved" onClick={() => soon('Saved')} />
      <RailItem icon={CalendarDays} label="Calendar" onClick={() => soon('Calendar')} />
      <RailItem icon={LifeBuoy} label="Help" onClick={() => soon('Help')} />
      <div className="mt-auto flex flex-col items-center gap-1">
        <Tooltip label={theme === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton
            variant={theme === 'dark' ? 'solid' : 'soft'}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </IconButton>
        </Tooltip>
        <Tooltip label="Switch persona">
          <button
            onClick={logout}
            aria-label="Switch persona"
            className="mt-1 cursor-pointer rounded-full ring-2 ring-transparent transition hover:ring-border"
          >
            <Avatar name={persona?.name ?? '?'} size="sm" />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}

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
        if (c.id !== company.id) push({ title: `Switched to ${c.name}`, tone: 'accent' })
      }}
      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-2xs font-bold text-white', c.color)}>
        {c.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{c.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{c.jurisdiction}</span>
      </span>
      {c.id === company.id && <Check className="h-4 w-4 text-accent" />}
    </button>
  )

  const pfGroups = [
    ...portfolios.map((pf) => ({ name: pf.name, items: authorizedCompanies.filter((c) => c.portfolioId === pf.id) })),
    { name: 'Standalone', items: authorizedCompanies.filter((c) => !c.portfolioId) },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white', company.color)}>
          {company.initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[10rem] truncate text-[13px] font-bold leading-tight">{company.name}</span>
          <span className="block truncate text-2xs text-muted-fg">{company.code}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-fg" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1.5 w-72 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
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

/* --------------------------------------------------- User menu */
function UserMenu() {
  const { persona, logout } = useApp()
  const [open, setOpen] = useState(false)
  if (!persona) return null
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted cursor-pointer">
        <Avatar name={persona.name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-bold leading-tight">{persona.name}</span>
          <span className="block text-2xs text-muted-fg">{ROLE_LABELS[persona.role]}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <div className="px-2.5 py-2">
              <p className="text-sm font-bold">{persona.name}</p>
              <p className="text-2xs text-muted-fg">{persona.title}</p>
              <Badge tone="primary" className="mt-1.5">{ROLE_LABELS[persona.role]}</Badge>
              {persona.employeeId && (
                <p className="mt-1.5 flex items-center gap-1 text-2xs font-medium text-accent">
                  <UserCog className="h-3 w-3" /> Also an employee · Kensium Pvt Ltd
                </p>
              )}
            </div>
            <div className="my-1 h-px bg-border" />
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-muted-fg transition-colors hover:bg-muted hover:text-fg cursor-pointer">
              <UserCog className="h-4 w-4" /> Switch persona
            </button>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 cursor-pointer">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- Top bar (groups + sub-nav) */
function TopBar({ groups, onMenu }: { groups: NavGroup[]; onMenu: () => void }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const activeGroup =
    groups.find((g) => g.items.some((i) => isActive(i.path, loc.pathname))) ?? groups[0]
  const sub = activeGroup?.items ?? []

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        <IconButton variant="ghost" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </IconButton>
        <CompanySwitcher />

        {/* group pills */}
        <nav className="mx-auto hidden items-center gap-1 overflow-x-auto md:flex">
          {groups.map((g) => {
            const active = g === activeGroup
            return (
              <button
                key={g.group}
                onClick={() => navigate(g.items[0].path)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors cursor-pointer',
                  active ? 'bg-primary text-primary-fg' : 'text-muted-fg hover:bg-muted hover:text-fg',
                )}
              >
                {shortLabel(g.group)}
              </button>
            )
          })}
        </nav>

        <div className="relative ml-auto hidden max-w-[14rem] flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <input
            placeholder="Search…"
            className="h-9 w-full rounded-full border border-border bg-surface2 pl-9 pr-3 text-sm placeholder:text-muted-fg/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <Tooltip label="Notifications">
          <IconButton variant="outline" aria-label="Notifications" className="relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent2 ring-2 ring-surface" />
          </IconButton>
        </Tooltip>
        <UserMenu />
      </div>

      {/* secondary sub-nav: pills for the active group */}
      {sub.length > 1 && (
        <div className="hidden items-center gap-1 overflow-x-auto px-4 pb-2.5 md:flex">
          {sub.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive: a }) =>
                cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors',
                  a ? 'bg-accent/12 text-accent' : 'text-muted-fg hover:bg-muted hover:text-fg',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}

/* --------------------------------------------------- Mobile drawer (full grouped nav) */
function MobileDrawer({ groups, onClose }: { groups: NavGroup[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-surface p-3 animate-slide-up">
        <div className="mb-2 flex items-center justify-between px-1 py-2">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight">SatelliteHR</span>
          </span>
          <IconButton variant="ghost" onClick={onClose} aria-label="Close menu"><X className="h-5 w-5" /></IconButton>
        </div>
        <div className="px-1 pb-3"><CompanySwitcher /></div>
        <nav className="space-y-5">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="px-2.5 pb-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive: a }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors',
                        a ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg',
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
      </aside>
    </div>
  )
}

/* --------------------------------------------------- App shell */
export function AppShell() {
  const { role, company } = useApp()
  const groups = navForRole(role)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (mobileOpen) setMobileOpen(false)
  }

  return (
    <div className="flex min-h-dvh">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar groups={groups} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={company.id}>
            <Outlet />
          </div>
        </main>
      </div>
      {mobileOpen && <MobileDrawer groups={groups} onClose={() => setMobileOpen(false)} />}
    </div>
  )
}
