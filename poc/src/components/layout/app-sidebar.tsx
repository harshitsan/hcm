import { filterNavGroups } from '@/config/module-access'
import { useLayout } from '@/context/layout-provider'
import { useRole } from '@/context/role-context'
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

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { role } = useRole()
  // Only show modules the active role may open (RBAC — see module-access.ts).
  const navGroups = filterNavGroups(role, sidebarData.navGroups)
  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className='bg-blue-1200'
    >
      <SidebarHeader>
        <RoleSwitcher />
      </SidebarHeader>
      <SidebarContent className='bg-blue-1200 border-t-yellow-1200 border-t'>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}
