/**
 * Role-scoped navigation — the calm IA from the product roadmap.
 * Seven human buckets; each item declares which roles may see it.
 * (Employees see a tiny subset; admins see everything.)
 */
import {
  LayoutDashboard, Users, Network, IdCard, CalendarDays, Clock4,
  Briefcase, ClipboardCheck, ArrowLeftRight, FileText, FolderClosed,
  BarChart3, Building2, GitBranch, ShieldCheck, SlidersHorizontal,
  ScrollText, type LucideIcon,
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

export const navConfig: NavGroup[] = [
  {
    group: 'Overview',
    items: [{ label: 'Home', path: '/', icon: LayoutDashboard, roles: ALL }],
  },
  {
    group: 'People',
    items: [
      { label: 'Directory', path: '/people/directory', icon: Users, roles: ALL },
      { label: 'Org Chart', path: '/people/org-chart', icon: Network, roles: ALL },
      { label: 'Employee Records', path: '/people/employees', icon: IdCard, roles: HRPLUS },
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
      { label: 'Onboarding', path: '/lifecycle/onboarding', icon: ClipboardCheck, roles: STAFFPLUS },
      { label: 'Transfers & Exit', path: '/lifecycle/transfers-exit', icon: ArrowLeftRight, roles: HRPLUS },
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
      { label: 'Companies', path: '/admin/companies', icon: Building2, roles: ['provider_admin', 'portfolio_manager'] },
      { label: 'Company Setup', path: '/admin/company-setup', icon: SlidersHorizontal, roles: ADMINS },
      { label: 'Workflow Builder', path: '/admin/workflow-builder', icon: GitBranch, roles: HRPLUS },
      { label: 'Roles & Security', path: '/admin/roles', icon: ShieldCheck, roles: HRPLUS },
      { label: 'Custom Fields', path: '/admin/custom-fields', icon: SlidersHorizontal, roles: HRPLUS },
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
