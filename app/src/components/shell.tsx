/**
 * App shell v3 — Stripe-style dashboard:
 *   • slim top banner (prototype notice)
 *   • LEFT SIDEBAR: company switcher + grouped text nav + theme/persona footer
 *   • top bar: search · create · help · notifications
 * Teal-green primary, monospace type. Mock data; every control does something.
 */
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Check, CheckCheck, ChevronsUpDown, ChevronLeft, Menu, Moon, Sun, Search, Bell, LogOut, X,
  Building2, Plus, LifeBuoy, CalendarPlus, MessageSquare, Megaphone, Briefcase, FileSignature,
  BarChart3, UserPlus, UserCircle, LayoutGrid, FolderTree, Database, type LucideIcon,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useNotifications } from '../app/notifications'
import { navFor, type NavGroup } from '../app/nav'
import { ROLE_LABELS, portfolios, type Company } from '../data/mock'
import { Avatar, Badge, Button, IconButton, Input, Modal, Tooltip, useToast } from './ui'
import { cn } from '../lib/cn'

type MenuItem = { label: string; icon?: LucideIcon; onClick: () => void }

/* --------------------------------------------------- company switcher (sidebar head) */
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
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md text-2xs font-bold text-white', c.color)}>{c.initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{c.name}</span>
        <span className="block truncate text-2xs text-muted-fg">{c.jurisdiction}</span>
      </span>
      {c.id === company.id && <Check className="h-4 w-4 text-primary" />}
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
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-2xs font-bold text-white', company.color)}>{company.initials}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold leading-tight">{company.name}</span>
          <span className="block truncate text-2xs text-muted-fg">{company.code}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-fg" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-40 mt-1.5 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
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

/* --------------------------------------------------- sidebar */
function SidebarContent({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const { theme, toggleTheme, logout, persona, role, scope, exitToPlatform } = useApp()
  const navigate = useNavigate()
  const platformRole = role === 'provider_admin' || role === 'portfolio_manager'
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-fg"><Building2 className="h-4 w-4" /></span>
        <span className="text-[15px] font-extrabold tracking-tight">SatelliteHR</span>
      </div>
      <div className="px-3 pb-3">
        {scope === 'platform' ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface2/60 px-2.5 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary"><LayoutGrid className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight">Platform console</span>
              <span className="block truncate text-2xs text-muted-fg">{role ? ROLE_LABELS[role] : ''}</span>
            </span>
          </div>
        ) : (
          <>
            {platformRole && (
              <button
                onClick={() => { exitToPlatform(); onNavigate?.(); navigate('/') }}
                className="mb-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-2xs font-bold uppercase tracking-wide text-accent transition-colors hover:bg-accent/10 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Platform console
              </button>
            )}
            <CompanySwitcher />
          </>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-2.5 pb-1 text-2xs font-bold uppercase tracking-wide text-muted-fg/60">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg',
                    )
                  }
                >
                  <item.icon className="h-[17px] w-[17px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-1 border-t border-border p-3">
        <button
          onClick={() => { logout(); onNavigate?.() }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted cursor-pointer"
        >
          <Avatar name={persona?.name ?? '?'} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-tight">{persona?.name}</span>
            <span className="block truncate text-2xs text-muted-fg">Switch persona</span>
          </span>
          <LogOut className="h-4 w-4 shrink-0 text-muted-fg" />
        </button>
        <Tooltip label={theme === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}

/* --------------------------------------------------- command palette */
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
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer"
            >
              <d.icon className="h-4 w-4 shrink-0 text-muted-fg" />
              <span className="flex-1 text-sm font-semibold">{d.label}</span>
              <span className="text-2xs text-muted-fg">{d.group}</span>
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
            <li>• Switch <b className="text-fg">company</b> from the switcher at the top of the sidebar.</li>
            <li>• Switch <b className="text-fg">persona</b> from the account row at the bottom of the sidebar.</li>
            <li>• Use <b className="text-fg">Search</b> in the top bar to jump to any screen.</li>
            <li>• Menu and data change with the selected persona &amp; company.</li>
          </ul>
        </div>
        <Button variant="outline" onClick={() => { push({ title: 'Support request sent', tone: 'success' }); onClose() }}>
          <LifeBuoy className="h-4 w-4" /> Contact support
        </Button>
      </div>
    </Modal>
  )
}

/* --------------------------------------------------- create menu (top bar) */
function CreateMenu() {
  const { role, scope } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const items: MenuItem[] = scope === 'platform'
    ? [
        { label: 'Create company', icon: Building2, onClick: () => navigate('/admin/companies') },
        { label: 'Company setup', icon: FolderTree, onClick: () => navigate('/admin/company-setup') },
        { label: 'Import data', icon: Database, onClick: () => navigate('/admin/data') },
      ]
    : role === 'employee'
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
  return (
    <div className="relative">
      <Tooltip label="Create">
        <IconButton variant={open ? 'soft' : 'outline'} aria-label="Create" onClick={() => setOpen((o) => !o)}>
          <Plus className="h-[18px] w-[18px]" />
        </IconButton>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <p className="px-2.5 pb-1 pt-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Create</p>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { it.onClick(); setOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-muted cursor-pointer"
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

/* --------------------------------------------------- notifications bell */
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
          <div className="absolute right-0 z-40 mt-1.5 w-80 rounded-xl border border-border bg-surface p-1.5 shadow-pop animate-scale-in">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-sm font-bold">Notifications</span>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 text-2xs font-semibold text-accent transition-colors hover:text-accent/80 disabled:opacity-40 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
            <div className="max-h-80 space-y-0.5 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer', !n.read && 'bg-surface2/60')}
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
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 cursor-pointer"
            >
              See all notifications
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- top bar */
function TopBar({ onMenu, onSearch, onHelp }: { onMenu: () => void; onSearch: () => void; onHelp: () => void }) {
  const { persona } = useApp()
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
      <IconButton variant="ghost" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </IconButton>
      <button
        onClick={onSearch}
        className="relative flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-surface2 pl-9 pr-3 text-left text-sm text-muted-fg/80 transition-colors hover:border-muted-fg/30 cursor-pointer"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        Search…
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <CreateMenu />
        <Tooltip label="Help">
          <IconButton variant="outline" aria-label="Help" onClick={onHelp}><LifeBuoy className="h-[18px] w-[18px]" /></IconButton>
        </Tooltip>
        <BellMenu />
        {persona && (
          <span className="ml-1 hidden items-center gap-2 rounded-lg px-1.5 py-1 sm:flex">
            <Avatar name={persona.name} size="sm" />
            <span className="hidden text-left md:block">
              <span className="block text-[13px] font-bold leading-tight">{persona.name}</span>
              <span className="block text-2xs text-muted-fg">{ROLE_LABELS[persona.role]}</span>
            </span>
          </span>
        )}
      </div>
    </header>
  )
}

/* --------------------------------------------------- app shell */
export function AppShell() {
  const { role, company, scope } = useApp()
  const groups = navFor(role, scope)
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
    <div className="min-h-dvh">
      {/* slim prototype banner */}
      <div className="flex h-8 items-center justify-center gap-2 bg-primary px-4 text-center text-2xs font-semibold text-primary-fg">
        <Badge tone="neutral" className="hidden bg-white/15 text-primary-fg sm:inline-flex">Prototype</Badge>
        Sample data · no backend — explore freely.
      </div>

      <div className="flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border bg-surface lg:block">
          <SidebarContent groups={groups} />
        </aside>

        {/* mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface animate-slide-up">
              <IconButton variant="ghost" className="absolute right-2 top-3" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></IconButton>
              <SidebarContent groups={groups} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} onHelp={() => setHelpOpen(true)} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div key={company.id}><Outlet /></div>
          </main>
        </div>
      </div>

      <CommandPalette key={String(searchOpen)} open={searchOpen} onClose={() => setSearchOpen(false)} groups={groups} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
