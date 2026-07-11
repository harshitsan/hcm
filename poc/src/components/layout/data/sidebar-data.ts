import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { MODULE_REGISTRY, type SidebarGroup } from '@/config/module-registry'
import { type SidebarData, type NavGroup, type NavItem } from '../types'

/** Sidebar groups that appear in navGroups (in display order). */
const NAV_GROUP_ORDER: SidebarGroup[] = [
  'Home',
  'Organization',
  'Workforce',
  'Policies & Comms',
  'Platform',
]

/** The Administration group is pinned to the bottom separately. */
const BOTTOM_GROUP: SidebarGroup = 'Administration'

/** Title shown in the sidebar for each group (Home uses an empty string). */
const GROUP_TITLE: Record<SidebarGroup, string> = {
  Home: '',
  Organization: 'Organization',
  Workforce: 'Workforce',
  'Policies & Comms': 'Policies & Comms',
  Platform: 'Platform',
  Administration: 'Administration',
}

function buildNavGroup(group: SidebarGroup): NavGroup {
  const items: NavItem[] = MODULE_REGISTRY
    .filter((m) => m.group === group)
    .map((m) => {
      // Submodules with a standalone route (e.g. /employees/configuration)
      // render as sidebar sub-links so the pages are reachable from nav.
      const routed = m.submodules.filter((s) => s.route)
      if (routed.length > 0) {
        return {
          title: m.name,
          icon: m.icon,
          items: [
            { title: m.name, url: m.route },
            ...routed.map((s) => ({ title: s.label, url: s.route! })),
          ],
        }
      }
      return { title: m.name, url: m.route, icon: m.icon }
    })
  return { title: GROUP_TITLE[group], items }
}

export const sidebarData: SidebarData = {
  user: {
    name: 'SatelliteHR POC',
    email: 'dev@satellitehr.example',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'SatelliteHR',
      logo: Command,
      plan: 'POC',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise tenant',
    },
    {
      name: 'Aurora Group',
      logo: AudioWaveform,
      plan: 'Group tenant',
    },
  ],
  /** Tenants selectable in the sidebar header, each with its environment. */
  tenants: [
    {
      name: 'Aurora Group',
      logo: AudioWaveform,
      environment: 'Production',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      environment: 'Production',
    },
    {
      name: 'SatelliteHR POC',
      logo: Command,
      environment: 'Sandbox',
    },
  ],
  navGroups: NAV_GROUP_ORDER.map(buildNavGroup),
  /** Rarely used security/ops modules — pinned to the sidebar bottom. */
  bottomGroup: buildNavGroup(BOTTOM_GROUP),
}
