import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'

export function NavGroup({ items }: NavGroupProps) {
  const { state } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed')
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item)

  return (
    <SidebarMenuItem>
      <div className='flex flex-col items-center py-1 pb-0'>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          // tooltip={item.title}
          size='lg'
          className={`hover:!bg-blue-1300 group !rounded-sm text-white ${isActive ? '!bg-blue-1300' : ''}`}
        >
          <Link
            to={item.url}
            onClick={() => setOpenMobile(false)}
            className='flex h-[44px] !w-[44px] items-center justify-center text-white hover:text-white'
          >
            {item.icon && (
              <item.icon
                weight={isActive ? 'fill' : 'regular'}
                className={`!h-5 !w-5 ${isActive ? 'text-neutral-100' : 'text-alpha-white-100'}`}
              />
            )}
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </Link>
        </SidebarMenuButton>
        <Link
          className='mt-0 leading-none'
          to={item.url}
          // onClick={() => setOpenMobile(false)}
        >
          <span className='text-caption-sm text-alpha-white-100 text-center leading-none'>
            {item.title}
          </span>
        </Link>
      </div>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  // const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item, true)

  return (
    <Collapsible asChild defaultOpen={isActive} className='group/collapsible'>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={`text-white hover:text-white ${isActive ? 'bg-blue-1300' : ''}`}
          >
            {item.icon && (
              <item.icon
                className={`h-7 w-7 ${isActive ? 'text-neutral-100' : 'text-white/70'}`}
              />
            )}
            <span className='text-white'>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto text-white transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const isSubActive = checkIsActive(href, subItem)
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    className={`text-white hover:text-white ${isSubActive ? 'bg-blue-1300' : ''}`}
                  >
                    <Link
                      to={subItem.url}
                      // onClick={() => setOpenMobile(false)}
                      className='text-white hover:text-white'
                    >
                      {subItem.icon && (
                        <subItem.icon
                          className={`size-7 h-7 w-7 ${isSubActive ? 'text-neutral-100' : 'text-white/70'}`}
                        />
                      )}
                      <span className='text-white'>{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const isActive = checkIsActive(href, item)

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isActive}
            className={`text-white hover:text-white ${isActive ? 'bg-blue-1300' : ''}`}
          >
            {item.icon && (
              <item.icon
                className={`size-7 h-7 w-7 ${isActive ? 'text-neutral-100' : 'text-white/70'}`}
              />
            )}
            <span className='text-white'>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto text-white transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  // Valid home route paths (new format)
  const validHomeRoutes = [
    '/new-vehicle/imported-leads',
    '/new-vehicle/transfer-leads',
    '/new-vehicle/substitutes',
    '/new-vehicle/price-lists',
    '/new-vehicle/bookings',
    '/new-vehicle/retails',
    '/new-vehicle/offers',
    '/new-vehicle/inventory',
    '/new-vehicle/funnel-setup',
    '/new-vehicle/customers',
    '/generic/auto-exclusions',
    '/generic/branch',
    '/generic/models',
    '/generic/users',
    '/generic/business-agents',
    '/generic/integrations',
    '/generic/configuration',
  ]

  const hrefPath = href.split('?')[0]
  if ('items' in item && item.items) {
    return !!item.items.filter((i) => i.url === href).length
  }
  if ('url' in item) {
    const itemUrl = item.url
    if (!itemUrl) return false

    const itemPath = itemUrl.split('?')[0]
    const isHomeRoute = itemPath === '/' || itemPath === ''
    if (isHomeRoute) {
      return (
        hrefPath === '/' ||
        hrefPath === '' ||
        validHomeRoutes.includes(hrefPath)
      )
    }

    return (
      href === itemUrl ||
      hrefPath === itemPath ||
      (mainNav &&
        href.split('/')[1] !== '' &&
        href.split('/')[1] === itemPath.split('/')[1])
    )
  }

  return false
}
