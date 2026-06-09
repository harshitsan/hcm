/**
 * App shell v2 — "Orbit" layout, modeled on the reference dashboard:
 *   • left CIRCULAR ICON RAIL (working quick actions + theme + sign-out)
 *   • top bar: company switcher pill · black-pill GROUP nav · search · bell · avatar
 *   • secondary SUB-NAV of pills for the active group's items (role-scoped)
 * Every control does something (mock): menus, a search palette, a notifications
 * dropdown that clears, and a help dialog.
 */
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Check, CheckCheck, ChevronsUpDown, Menu, Moon, Sun, Search, Bell, LogOut, UserCog, X,
  Building2, Plus, Star, CalendarDays, LifeBuoy, LayoutDashboard, UserCircle, CalendarPlus,
  MessageSquare, Megaphone, Briefcase, FileSignature, BarChart3, UserPlus, type LucideIcon,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useNotifications } from '../app/notifications'
import { navForRole, type NavGroup } from '../app/nav'
import { ROLE_LABELS, portfolios, type Company } from '../data/mock'
import { Avatar, Badge, Button, IconButton, Input, Modal, Tooltip, useToast } from './ui'
import { cn } from '../lib/cn'

const SHORT: Record<string, string> = {
  'Overview': 'Overview', 'My Space': 'Me', 'Time & Leave': 'Time',
  'Hiring & Lifecycle': 'Hiring', 'Communication': 'Comms',
  'Policies & Documents': 'Policies', 'Admin & Setup': 'Admin',
}
const shortLabel = (g: string) => SHORT[g] ?? g
const isActive = (path: string, pathname: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')

type MenuItem = { label: string; icon?: LucideIcon; onClick: () => void }

/* --------------------------------------------------- rail building blocks */
function RailItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Tooltip label={label}>
      <IconButton variant="ghost" onClick={onClick} aria-label={label}>
        <Icon className="h-[18px] w-[18px]" />
      </IconButton>
    </Tooltip>
  )
}

function RailMenu({ icon: Icon, label, items }: { icon: LucideIcon; label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Tooltip label={label}>
        <IconButton variant={open ? 'soft' : 'ghost'} onClick={() => setOpen((o) => !o)} aria-label={label}>
          <Icon className="h-[18px] w-[18px]" />
        </IconButton>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-12 top-0 z-40 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <p className="px-2.5 pb-1 pt-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{label}</p>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { it.onClick(); setOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-fg transition-colors hover:bg-muted cursor-pointer"
              >
                {it.icon && <it.icon className="h-4 w-4 text-muted-fg" />}
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Rail({ onSearch, onHelp }: { onSearch: () => void; onHelp: () => void }) {
  const { theme, toggleTheme, logout, persona, role } = useApp()
  const navigate = useNavigate()

  const createItems: MenuItem[] = role === 'employee'
    ? [
        { label: 'Request leave', icon: CalendarPlus, onClick: () => navigate('/time/leave') },
        { label: 'Raise feedback', icon: MessageSquare, onClick: () => navigate('/comms/feedback') },
        { label: 'My profile', icon: UserCircle, onClick: () => navigate('/me/profile') },
      ]
    : [
        { label: 'Add employee', icon: UserPlus, onClick: () => navigate('/people/employees') },
        { label: 'New requisition', icon: Briefcase, onClick: () => navigate('/hiring/requisitions') },
        { label: 'New announcement', icon: Megaphone, onClick: () => navigate('/comms/announcements') },
        { label: 'Generate letter', icon: FileSignature, onClick: () => navigate('/people/letters') },
        { label: 'New report', icon: BarChart3, onClick: () => navigate('/reports') },
      ]
  const savedItems: MenuItem[] = role === 'employee'
    ? [
        { label: 'My leave calendar', onClick: () => navigate('/time/leave') },
        { label: 'My documents', onClick: () => navigate('/documents') },
      ]
    : [
        { label: 'Headcount by dept', onClick: () => navigate('/reports') },
        { label: 'Pending approvals', onClick: () => navigate('/') },
        { label: 'My team', onClick: () => navigate('/people/org-chart') },
        { label: 'Open requisitions', onClick: () => navigate('/hiring/requisitions') },
      ]

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
      <RailMenu icon={Plus} label="Create" items={createItems} />
      <RailItem icon={Search} label="Search" onClick={onSearch} />
      <RailMenu icon={Star} label="Saved views" items={savedItems} />
      <RailItem icon={CalendarDays} label="Calendar" onClick={() => navigate('/time/leave')} />
      <RailItem icon={LifeBuoy} label="Help" onClick={onHelp} />
      <div className="mt-auto flex flex-col items-center gap-1">
        <Tooltip label={theme === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton variant={theme === 'dark' ? 'solid' : 'soft'} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </IconButton>
        </Tooltip>
        <Tooltip label="Switch persona">
          <button onClick={logout} aria-label="Switch persona" className="mt-1 cursor-pointer rounded-full ring-2 ring-transparent transition hover:ring-border">
            <Avatar name={persona?.name ?? '?'} size="sm" />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}

/* --------------------------------------------------- command palette (search) */
function CommandPalette({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: NavGroup[] }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const dests = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
  const ql = q.trim().toLowerCase()
  const filtered = ql ? dests.filter((d) => d.label.toLowerCase().includes(ql) || d.group.toLowerCase().includes(ql)) : dests
  return (
    <Modal open={open} onClose={onClose} size="md" title="Search & jump to" description="Find any screen you can access.">
      <Input autoFocus placeholder="Type a page name…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-fg">No matches for “{q}”.</p>
        ) : (
          filtered.map((d) => (
            <button
              key={d.path}
              onClick={() => { onClose(); navigate(d.path) }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
            >
              <d.icon className="h-4 w-4 shrink-0 text-muted-fg" />
              <span className="flex-1 text-sm font-semibold">{d.label}</span>
              <span className="text-2xs text-muted-fg">{shortLabel(d.group)}</span>
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}

/* --------------------------------------------------- help dialog */
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { push } = useToast()
  return (
    <Modal open={open} onClose={onClose} title="Help & shortcuts" description="SatelliteHR prototype — a quick orientation.">
      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-1.5 font-bold">Getting around</p>
          <ul className="space-y-1 text-muted-fg">
            <li>• Switch <b className="text-fg">company</b> from the pill in the top-left.</li>
            <li>• Switch <b className="text-fg">persona</b> from the avatar at the bottom of the rail.</li>
            <li>• Use <b className="text-fg">Search</b> on the rail to jump to any screen.</li>
            <li>• Your menu and data change with the selected persona &amp; company.</li>
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-bold">Sample shortcuts</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Search', '/'], ['Toggle theme', 'T'], ['Go home', 'G H'], ['Notifications', 'N']].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-surface2/60 px-2.5 py-1.5">
                <span className="text-muted-fg">{k}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-2xs font-bold">{v}</kbd>
              </div>
            ))}
          </div>
        </div>
        <Button variant="outline" onClick={() => { push({ title: 'Support request sent', tone: 'success' }); onClose() }}>
          <LifeBuoy className="h-4 w-4" /> Contact support
        </Button>
      </div>
    </Modal>
  )
}

/* --------------------------------------------------- notifications bell (clears) */
function BellMenu() {
  const { feed, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const recent = feed.slice(0, 6)
  return (
    <div className="relative">
      <Tooltip label="Notifications">
        <IconButton variant="outline" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative" onClick={() => setOpen((o) => !o)}>
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent2 ring-2 ring-surface" />}
        </IconButton>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-80 rounded-2xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-sm font-bold">Notifications</span>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 text-2xs font-semibold text-accent transition-colors hover:text-accent/80 disabled:opacity-40 disabled:hover:text-accent cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-80 space-y-0.5 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn('flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer', !n.read && 'bg-surface2/60')}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent2')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-2xs font-semibold text-muted-fg">{n.module}</span>
                      <span className="shrink-0 text-2xs text-muted-fg">{n.time}</span>
                    </span>
                    <span className={cn('block truncate text-[13px]', n.read ? 'font-semibold' : 'font-bold')}>{n.title}</span>
                    <span className="block truncate text-2xs text-muted-fg">{n.body}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/me/notifications') }}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 cursor-pointer"
            >
              See all notifications
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- company context switcher */
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
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-2xs font-bold text-white', c.color)}>{c.initials}</span>
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
        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white', company.color)}>{company.initials}</span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[10rem] truncate text-[13px] font-bold leading-tight">{company.name}</span>
          <span className="block truncate text-2xs text-muted-fg">{company.code}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-fg" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1.5 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            {pfGroups.map((g) => (
              <div key={g.name} className="mb-1 last:mb-0">
                <p className="px-2.5 pb-1 pt-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{g.name}</p>
                {g.items.map(renderCompany)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- user menu */
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

/* --------------------------------------------------- top bar */
function TopBar({ groups, onMenu, onSearch }: { groups: NavGroup[]; onMenu: () => void; onSearch: () => void }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i.path, loc.pathname))) ?? groups[0]
  const sub = activeGroup?.items ?? []

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        <IconButton variant="ghost" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </IconButton>
        <CompanySwitcher />

        <nav className="mx-auto hidden items-center gap-1 overflow-x-auto md:flex">
          {groups.map((g) => {
            const active = g === activeGroup
            return (
              <button
                key={g.group}
                onClick={() => navigate(g.items[0].path)}
                className={cn('rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors cursor-pointer', active ? 'bg-primary text-primary-fg' : 'text-muted-fg hover:bg-muted hover:text-fg')}
              >
                {shortLabel(g.group)}
              </button>
            )
          })}
        </nav>

        <button
          onClick={onSearch}
          className="relative ml-auto hidden h-9 max-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-border bg-surface2 pl-9 pr-3 text-left text-sm text-muted-fg/80 transition-colors hover:border-muted-fg/30 lg:flex cursor-pointer"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          Search…
        </button>
        <BellMenu />
        <UserMenu />
      </div>

      {sub.length > 1 && (
        <div className="hidden items-center gap-1 overflow-x-auto px-4 pb-2.5 md:flex">
          {sub.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive: a }) =>
                cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors', a ? 'bg-accent/12 text-accent' : 'text-muted-fg hover:bg-muted hover:text-fg')
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

/* --------------------------------------------------- mobile drawer */
function MobileDrawer({ groups, onClose, onSearch }: { groups: NavGroup[]; onClose: () => void; onSearch: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-surface p-3 animate-slide-up">
        <div className="mb-2 flex items-center justify-between px-1 py-2">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg"><Building2 className="h-4 w-4" /></span>
            <span className="text-[15px] font-extrabold tracking-tight">SatelliteHR</span>
          </span>
          <IconButton variant="ghost" onClick={onClose} aria-label="Close menu"><X className="h-5 w-5" /></IconButton>
        </div>
        <div className="px-1 pb-3"><CompanySwitcher /></div>
        <button
          onClick={() => { onClose(); onSearch() }}
          className="mb-3 flex w-full items-center gap-2 rounded-full border border-border bg-surface2 px-3 py-2 text-sm text-muted-fg cursor-pointer"
        >
          <Search className="h-4 w-4" /> Search…
        </button>
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
                      cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors', a ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg')
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

/* --------------------------------------------------- app shell */
export function AppShell() {
  const { role, company } = useApp()
  const groups = navForRole(role)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (mobileOpen) setMobileOpen(false)
  }

  return (
    <div className="flex min-h-dvh">
      <Rail onSearch={() => setSearchOpen(true)} onHelp={() => setHelpOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar groups={groups} onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={company.id}><Outlet /></div>
        </main>
      </div>
      {mobileOpen && <MobileDrawer groups={groups} onClose={() => setMobileOpen(false)} onSearch={() => setSearchOpen(true)} />}
      <CommandPalette key={String(searchOpen)} open={searchOpen} onClose={() => setSearchOpen(false)} groups={groups} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
