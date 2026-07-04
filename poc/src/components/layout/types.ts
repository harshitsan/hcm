import { type LinkProps } from '@tanstack/react-router'

type User = {
  name: string
  email: string
  avatar: string
}

type Team = {
  name: string
  logo: React.ElementType
  plan: string
}

/** Tenant shown in the sidebar header with its environment (mock switch). */
type Tenant = {
  name: string
  logo: React.ElementType
  environment: 'Production' | 'Sandbox' | 'Staging'
}

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  user: User
  teams: Team[]
  tenants: Tenant[]
  navGroups: NavGroup[]
  /** Less-important modules pinned to the bottom of the sidebar. */
  bottomGroup: NavGroup
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink, Tenant }
