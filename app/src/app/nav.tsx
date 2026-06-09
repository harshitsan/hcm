/**
 * Role-scoped navigation — the calm IA from the product roadmap, expanded so every
 * BRD module has a home. Group = top pill; items = secondary sub-nav (see shell).
 * Each item declares which of the 5 runtime roles may see it.
 */
import {
  LayoutDashboard, Users, Network, IdCard, CalendarDays, Clock4,
  Briefcase, ClipboardCheck, ArrowLeftRight, FileText, FolderClosed,
  BarChart3, Building2, GitBranch, ShieldCheck, SlidersHorizontal,
  ScrollText, UserCircle, Bell, Megaphone, MessageSquare, Package,
  FileSignature, LayoutGrid, ClipboardList, Target, FolderTree, Database,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '../data/mock'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
}
export type NavGroup = {
  group: string
  items: NavItem[]
}

const ALL: Role[] = ['provider_admin', 'portfolio_manager', 'company_hr_admin', 'people_manager', 'employee']
const STAFFPLUS: Role[] = ['provider_admin', 'portfolio_manager', 'company_hr_admin', 'people_manager']
const HRPLUS: Role[] = ['provider_admin', 'portfolio_manager', 'company_hr_admin']
const ADMINS: Role[] = ['provider_admin', 'portfolio_manager', 'company_hr_admin']
const PORTFOLIO: Role[] = ['provider_admin', 'portfolio_manager']

export const navConfig: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Home', path: '/', icon: LayoutDashboard, roles: ALL },
      { label: 'Portfolio', path: '/portfolio', icon: LayoutGrid, roles: PORTFOLIO },
    ],
  },
  {
    group: 'My Space',
    items: [
      { label: 'My Profile', path: '/me/profile', icon: UserCircle, roles: ALL },
      { label: 'Notifications', path: '/me/notifications', icon: Bell, roles: ALL },
    ],
  },
  {
    group: 'People',
    items: [
      { label: 'Directory', path: '/people/directory', icon: Users, roles: ALL },
      { label: 'Org Chart', path: '/people/org-chart', icon: Network, roles: ALL },
      { label: 'Employee Records', path: '/people/employees', icon: IdCard, roles: HRPLUS },
      { label: 'Assets', path: '/people/assets', icon: Package, roles: ALL },
      { label: 'HR Letters', path: '/people/letters', icon: FileSignature, roles: ALL },
    ],
  },
  {
    group: 'Time & Leave',
    items: [
      { label: 'Leave', path: '/time/leave', icon: CalendarDays, roles: ALL },
      { label: 'Attendance', path: '/time/attendance', icon: Clock4, roles: ALL },
    ],
  },
  {
    group: 'Hiring & Lifecycle',
    items: [
      { label: 'Requisitions', path: '/hiring/requisitions', icon: Briefcase, roles: STAFFPLUS },
      { label: 'Candidates', path: '/hiring/candidates', icon: Users, roles: STAFFPLUS },
      { label: 'Interviews', path: '/hiring/interviews', icon: ClipboardList, roles: STAFFPLUS },
      { label: 'Onboarding', path: '/lifecycle/onboarding', icon: ClipboardCheck, roles: STAFFPLUS },
      { label: 'Performance', path: '/lifecycle/performance', icon: Target, roles: STAFFPLUS },
      { label: 'Transfers & Exit', path: '/lifecycle/transfers-exit', icon: ArrowLeftRight, roles: HRPLUS },
    ],
  },
  {
    group: 'Communication',
    items: [
      { label: 'Announcements', path: '/comms/announcements', icon: Megaphone, roles: ALL },
      { label: 'Feedback & Grievance', path: '/comms/feedback', icon: MessageSquare, roles: ALL },
    ],
  },
  {
    group: 'Policies & Documents',
    items: [
      { label: 'Policies', path: '/policies', icon: FileText, roles: ALL },
      { label: 'Documents', path: '/documents', icon: FolderClosed, roles: ALL },
    ],
  },
  {
    group: 'Insights',
    items: [{ label: 'Reports', path: '/reports', icon: BarChart3, roles: STAFFPLUS }],
  },
  {
    group: 'Admin & Setup',
    items: [
      { label: 'Companies', path: '/admin/companies', icon: Building2, roles: PORTFOLIO },
      // Company provisioning is a platform/provider function (CompanySetup.tsx blocks
      // company_hr_admin). Restrict the nav entry to PORTFOLIO to match the internal gate;
      // the company-level setup screens an HR admin owns have their own entries below.
      { label: 'Company Setup', path: '/admin/company-setup', icon: SlidersHorizontal, roles: PORTFOLIO },
      { label: 'Org & Master Data', path: '/admin/org-data', icon: FolderTree, roles: HRPLUS },
      { label: 'Workflow Builder', path: '/admin/workflow-builder', icon: GitBranch, roles: HRPLUS },
      { label: 'Roles & Security', path: '/admin/roles', icon: ShieldCheck, roles: HRPLUS },
      { label: 'Custom Fields', path: '/admin/custom-fields', icon: SlidersHorizontal, roles: HRPLUS },
      { label: 'Import / Export', path: '/admin/data', icon: Database, roles: ADMINS },
      { label: 'Audit Log', path: '/admin/audit', icon: ScrollText, roles: HRPLUS },
    ],
  },
]

export function navForRole(role: Role | null): NavGroup[] {
  if (!role) return []
  return navConfig
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0)
}

/* ---- Platform console nav (provider/portfolio at platform scope) ----
 * The provider/portfolio "landlord" surface: tenants, governance, account.
 * Company-operational screens (leave, hiring, ESS, …) are intentionally absent
 * here — they appear only after you OPEN a company (company scope). */
export const platformNav: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Platform Home', path: '/', icon: LayoutDashboard, roles: PORTFOLIO },
      { label: 'Portfolio', path: '/portfolio', icon: LayoutGrid, roles: PORTFOLIO },
      { label: 'Companies', path: '/admin/companies', icon: Building2, roles: PORTFOLIO },
      { label: 'Company Setup', path: '/admin/company-setup', icon: SlidersHorizontal, roles: PORTFOLIO },
    ],
  },
  {
    group: 'Governance',
    items: [
      { label: 'Shared Policies', path: '/admin/shared-policies', icon: FileText, roles: PORTFOLIO },
      { label: 'Org & Master Data', path: '/admin/org-data', icon: FolderTree, roles: PORTFOLIO },
      { label: 'Roles & Security', path: '/admin/roles', icon: ShieldCheck, roles: PORTFOLIO },
      { label: 'Import / Export', path: '/admin/data', icon: Database, roles: PORTFOLIO },
      { label: 'Audit Log', path: '/admin/audit', icon: ScrollText, roles: PORTFOLIO },
    ],
  },
  {
    // Account surface for the platform roles. Both provider_admin and
    // portfolio_manager keep My Profile + Notifications here (a platform admin's
    // profile shows an account/no-employee-record state rather than a tenant's PII).
    group: 'My Space',
    items: [
      { label: 'My Profile', path: '/me/profile', icon: UserCircle, roles: PORTFOLIO },
      { label: 'Notifications', path: '/me/notifications', icon: Bell, roles: PORTFOLIO },
    ],
  },
]

/* ---- Route-level authorization ----
 * The roles allowed for each path, unioned across the company nav and the
 * platform console. Used by the App route guard so URL access can't bypass the
 * role gating the sidebar already encodes. */
const routeRolesAcc: Record<string, Set<Role>> = {}
for (const g of [...navConfig, ...platformNav]) {
  for (const it of g.items) {
    const set = routeRolesAcc[it.path] ?? (routeRolesAcc[it.path] = new Set<Role>())
    it.roles.forEach((r) => set.add(r))
  }
}
export const routeRoles: Record<string, Role[]> = Object.fromEntries(
  Object.entries(routeRolesAcc).map(([p, s]) => [p, [...s]]),
)

/** May this role open this route at all? Unmapped paths are allowed (e.g. fallbacks). */
export function canAccessRoute(role: Role | null, path: string): boolean {
  if (!role) return false
  const roles = routeRoles[path]
  return roles ? roles.includes(role) : true
}

/** Scope-aware nav: platform console for provider/portfolio at platform scope,
 *  otherwise the company-operational nav for the role. */
export function navFor(role: Role | null, scope: 'platform' | 'company'): NavGroup[] {
  if (scope === 'platform' && (role === 'provider_admin' || role === 'portfolio_manager')) {
    return platformNav
      .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
      .filter((g) => g.items.length > 0)
  }
  return navForRole(role)
}
