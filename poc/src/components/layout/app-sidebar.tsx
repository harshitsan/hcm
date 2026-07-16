import { BookOpen, Bell, LifeBuoy, Settings } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { RoleSwitcher } from './role-switcher'
import { TenantSwitcher } from './tenant-switcher'
import { type NavGroup as NavGroupType } from './types'

/** Modules surfaced through the fixed utility tray, hidden from the main list. */
const UTILITY_ROUTES = new Set([
  '/notifications',
  '/platform-admin',
  '/documents',
  '/feedback',
])

/** Fixed system tray pinned above the user footer. */
const utilityNav: NavGroupType = {
  title: '',
  items: [
    { title: 'Notifications', url: '/notifications', icon: Bell, badge: '16' },
    { title: 'Settings', url: '/platform-admin', icon: Settings },
    { title: 'Documentation', url: '/documents', icon: BookOpen },
    { title: 'Help & Support', url: '/feedback', icon: LifeBuoy },
  ],
}

/** Drop utility-tray modules from a group so they don't appear twice. */
function withoutUtility(group: NavGroupType): NavGroupType {
  return {
    ...group,
    items: group.items.filter(
      (it) => !('url' in it && it.url && UTILITY_ROUTES.has(String(it.url)))
    ),
  }
}

/**
 * App sidebar — SatelliteHR mission rail: compact tenant row, prominent role
 * (environment) card, collapsible module category groups, a fixed utility
 * tray, and the signed-in user card. All modules are shown; inaccessible
 * ones render disabled (see nav-group).
 */
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { navGroups, bottomGroup, tenants } = sidebarData

  return (
    // Deep-space rail — bg/ink come from the --sidebar tokens (theme.css).
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader className='gap-2 pb-2'>
        <TenantSwitcher tenants={tenants} />
        <RoleSwitcher />
      </SidebarHeader>

      <SidebarContent className='border-sidebar-border gap-0 border-t pt-1'>
        {navGroups.map((group) => (
          <NavGroup key={group.title || 'home'} {...withoutUtility(group)} />
        ))}
        <NavGroup {...withoutUtility(bottomGroup)} />
        <div className='border-sidebar-border mt-auto border-t pt-1'>
          <NavGroup {...utilityNav} />
        </div>
      </SidebarContent>

      <SidebarFooter className='border-sidebar-border border-t'>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
