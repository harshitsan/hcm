import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { SatelliteMark, SatelliteWordmark } from '@/components/brand/logo'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { RoleSwitcher } from './role-switcher'
import { TenantSwitcher } from './tenant-switcher'

/**
 * App sidebar — SatelliteHR mission rail: brand lockup, tenant + environment,
 * role switcher (POC mock), accordion module groups, and rarely used admin
 * modules pinned to the bottom. All modules are shown; inaccessible ones
 * render disabled (see nav-group).
 */
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { navGroups, bottomGroup, tenants } = sidebarData
  return (
    <Sidebar collapsible={collapsible} variant={variant} className='space-bg'>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-1.5 pt-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
          <SatelliteMark size={26} />
          <SatelliteWordmark className='text-[15px] text-white group-data-[collapsible=icon]:hidden' />
          <span className='ms-auto rounded-full border border-white/15 px-1.5 py-px text-[9px] font-semibold tracking-widest text-white/50 uppercase group-data-[collapsible=icon]:hidden'>
            POC
          </span>
        </div>
        <TenantSwitcher tenants={tenants} />
        <RoleSwitcher />
      </SidebarHeader>
      <SidebarContent className='border-t border-white/10 bg-transparent'>
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
