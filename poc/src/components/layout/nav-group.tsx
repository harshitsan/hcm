import { type ReactNode, useRef, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, Lock } from 'lucide-react'
import { canAccess, rolesForPath } from '@/config/module-access'
import { useRole } from '@/context/role-context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SidebarGroup,
  SidebarGroupLabel,
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
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'

/**
 * Tree connector for nested rows: a continuous vertical trunk down the left,
 * terminating in an elbow (└) at the last child. Applied to category-group
 * children and module sub-items alike.
 */
const TREE_ITEM =
  "relative pl-4 before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-white/20 before:content-[''] [&:last-child]:before:h-1/2 [&:last-child]:after:absolute [&:last-child]:after:top-1/2 [&:last-child]:after:left-0 [&:last-child]:after:h-px [&:last-child]:after:w-3 [&:last-child]:after:bg-white/20 [&:last-child]:after:content-['']"

/**
 * Sidebar module group. Expanded sidebar: an accordion section (collapsible
 * label + row links, the group holding the active route opens by default).
 * Collapsed icon rail: the original icon-tile rendering.
 */
export function NavGroup({ title, items }: NavGroupProps) {
  const { state } = useSidebar()
  const href = useLocation({ select: (location) => location.href })

  // Collapsed icon rail keeps the compact tile style.
  if (state === 'collapsed') {
    return (
      <SidebarGroup>
        <SidebarMenu>
          {items.map((item) => {
            const key = `${item.title}-${item.url}`
            if (!item.items)
              return <SidebarMenuLink key={key} item={item} href={href} />
            return (
              <SidebarMenuCollapsedFlyout key={key} item={item} href={href} />
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  const renderRows = (rowClassName?: string) => (
    <SidebarMenu>
      {items.map((item) => {
        const key = `${item.title}-${item.url}`
        if (!item.items)
          return (
            <SidebarMenuRow
              key={key}
              item={item}
              href={href}
              className={rowClassName}
            />
          )
        return (
          <SidebarMenuCollapsible
            key={key}
            item={item}
            href={href}
            className={rowClassName}
          />
        )
      })}
    </SidebarMenu>
  )

  // Ungrouped items (e.g. Dashboard) render as plain rows without a label.
  if (!title) return <SidebarGroup className='pb-0'>{renderRows()}</SidebarGroup>

  // Collapsed by default; only the group holding the active route opens.
  const groupHasActive = items.some((it) =>
    'items' in it && it.items
      ? checkIsActive(href, it, true)
      : checkIsActive(href, it)
  )

  return (
    <Collapsible
      defaultOpen={groupHasActive}
      className='group/nav-group'
      asChild
    >
      <SidebarGroup className='py-1'>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className='group/glabel w-full cursor-pointer select-none py-1'>
            <span className='text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/45 group-hover/glabel:text-white/70'>
              {title}
            </span>
            <ChevronRight className='ms-auto size-3 text-[#6487c0] transition-transform duration-200 group-data-[state=open]/nav-group:rotate-90' />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className='CollapsibleContent'>
          {renderRows(TREE_ITEM)}
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

/** Expanded-sidebar row: icon + title link, with the lock state for roles without access. */
function SidebarMenuRow({
  item,
  href,
  className,
}: {
  item: NavLink
  href: string
  className?: string
}) {
  const { setOpenMobile } = useSidebar()
  const { role } = useRole()
  const isActive = checkIsActive(href, item)
  const accessible = item.url ? canAccess(role, String(item.url)) : true

  if (!accessible) {
    const allowed = rolesForPath(String(item.url))
    return (
      <SidebarMenuItem className={className}>
        <div
          className='flex h-9 cursor-not-allowed items-center gap-2 rounded-lg px-2 opacity-50'
          title={
            allowed.length
              ? `Requires role: ${allowed.join(', ')}`
              : 'No access for your role'
          }
        >
          {item.icon && (
            <item.icon className='text-white/40 !h-[18px] !w-[18px] shrink-0' />
          )}
          <span className='truncate text-[13.5px] text-white/40'>
            {item.title}
          </span>
          <Lock className='ms-auto !h-3 !w-3 shrink-0 text-white/30' />
        </div>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem className={className}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={[
          '!h-9 !rounded-lg',
          isActive
            ? '!bg-white/[0.08] !text-white !font-medium ring-1 ring-white/[0.06] hover:!bg-white/[0.08]'
            : 'text-white/70 hover:!bg-white/[0.05] hover:text-white',
        ].join(' ')}
      >
        <Link
          to={item.url}
          onClick={() => setOpenMobile(false)}
          className={isActive ? 'text-white' : 'text-white/70 hover:text-white'}
        >
          {item.icon && (
            <item.icon
              className={`!h-[18px] !w-[18px] shrink-0 ${isActive ? 'text-white' : 'text-white/55'}`}
            />
          )}
          <span className='truncate text-[13.5px]'>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return (
    <Badge className='ms-auto min-w-5 justify-center rounded-full border-0 bg-indigo-600 px-1.5 py-0 text-[11px] font-semibold tabular-nums text-white'>
      {children}
    </Badge>
  )
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const { role } = useRole()
  const isActive = checkIsActive(href, item)
  const accessible = item.url ? canAccess(role, String(item.url)) : true

  if (!accessible) {
    const allowed = rolesForPath(String(item.url))
    return (
      <SidebarMenuItem className='flex justify-center'>
        <div
          className='relative flex h-10 w-10 items-center justify-center rounded-lg opacity-40'
          title={
            allowed.length
              ? `Requires role: ${allowed.join(', ')}`
              : 'No access for your role'
          }
        >
          {item.icon && <item.icon className='!h-[19px] !w-[19px] text-white/55' />}
          <Lock className='absolute right-1 bottom-1 !h-3 !w-3 text-white/75' />
        </div>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem className='flex justify-center'>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={`!h-10 !w-10 !justify-center !rounded-lg !p-0 ${
          isActive
            ? '!bg-white/[0.08] ring-1 ring-white/[0.06] hover:!bg-white/[0.08]'
            : 'hover:!bg-white/[0.06]'
        }`}
      >
        <Link
          to={item.url}
          onClick={() => setOpenMobile(false)}
          className='flex h-10 w-10 items-center justify-center'
        >
          {item.icon && (
            <item.icon
              className={`!h-[19px] !w-[19px] ${isActive ? 'text-white' : 'text-white/55'}`}
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
  className,
}: {
  item: NavCollapsible
  href: string
  className?: string
}) {
  // const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item, true)

  return (
    <Collapsible asChild defaultOpen={isActive} className='group/collapsible'>
      <SidebarMenuItem className={className}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={`!h-9 !rounded-lg hover:!bg-white/[0.05] hover:text-white ${isActive ? 'font-medium text-white' : 'text-white/70'}`}
          >
            {item.icon && (
              <item.icon
                className={`!h-[18px] !w-[18px] shrink-0 ${isActive ? 'text-white' : 'text-white/55'}`}
              />
            )}
            <span className='truncate text-[13.5px]'>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto size-4 text-white/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className='mx-0 ms-[19px] gap-0 border-0 p-0'>
            {item.items.map((subItem) => {
              const isSubActive = checkIsActive(href, subItem)
              return (
                <SidebarMenuSubItem key={subItem.title} className={TREE_ITEM}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    className={`!h-8 !rounded-lg ${
                      isSubActive
                        ? '!bg-white/[0.08] !text-white !font-medium ring-1 ring-white/[0.06] hover:!bg-white/[0.08]'
                        : 'text-white/60 hover:!bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <Link
                      to={subItem.url}
                      className={
                        isSubActive
                          ? 'text-white'
                          : 'text-white/60 hover:text-white'
                      }
                    >
                      {subItem.icon && (
                        <subItem.icon
                          className={`!h-[16px] !w-[16px] shrink-0 ${isSubActive ? 'text-white' : 'text-white/50'}`}
                        />
                      )}
                      <span className='truncate text-[13px]'>
                        {subItem.title}
                      </span>
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

/**
 * Collapsed rail — hovering a module opens a light flyout listing its
 * sub-items (a popover driven by hover, with a small close delay so the
 * pointer can travel from the tile into the card).
 */
function SidebarMenuCollapsedFlyout({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const openNow = () => {
    cancel()
    setOpen(true)
  }
  const closeSoon = () => {
    cancel()
    timer.current = setTimeout(() => setOpen(false), 140)
  }

  return (
    <SidebarMenuItem className='flex justify-center'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
            className={`!h-10 !w-10 !justify-center !rounded-lg !p-0 ${
              isActive
                ? '!bg-white/[0.08] ring-1 ring-white/[0.06] hover:!bg-white/[0.08]'
                : 'hover:!bg-white/[0.06]'
            }`}
          >
            {item.icon && (
              <item.icon
                className={`!h-[19px] !w-[19px] ${isActive ? 'text-white' : 'text-white/55'}`}
              />
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          side='right'
          align='start'
          sideOffset={12}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          className='w-60 rounded-xl border border-black/[0.06] bg-white p-0 text-slate-800 shadow-xl'
        >
          <div className='px-4 pt-3 pb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase'>
            {item.title}
          </div>
          <div className='flex flex-col divide-y divide-slate-100 border-t border-slate-100'>
            {item.items.map((sub) => {
              const active = checkIsActive(href, sub)
              return (
                <Link
                  key={sub.title}
                  to={sub.url}
                  onClick={() => {
                    setOpen(false)
                    setOpenMobile(false)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-[14px] transition-colors ${
                    active
                      ? 'bg-slate-50 font-medium text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {sub.icon && (
                    <sub.icon className='size-[18px] shrink-0 text-slate-400' />
                  )}
                  <span className='truncate'>{sub.title}</span>
                  {sub.badge && (
                    <span className='ms-auto text-xs text-slate-400'>
                      {sub.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
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
