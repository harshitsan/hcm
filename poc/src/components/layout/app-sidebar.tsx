import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { RoleSwitcher } from './role-switcher'
import { TenantSwitcher } from './tenant-switcher'

/**
 * App sidebar: tenant + environment header, role switcher (POC mock),
 * accordion module groups, and rarely used admin modules pinned to the
 * bottom. All modules are shown; inaccessible ones render disabled
 * (see nav-group).
 */
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { navGroups, bottomGroup, tenants } = sidebarData
  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className='bg-blue-1200'
    >
      <SidebarHeader>
        <TenantSwitcher tenants={tenants} />
        <RoleSwitcher />
      </SidebarHeader>
      <SidebarContent className='bg-blue-1200 border-t-yellow-1200 border-t'>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
        <div className='mt-auto border-t border-white/10 pt-1'>
          <NavGroup {...bottomGroup} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}
