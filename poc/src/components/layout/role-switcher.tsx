import { Check, ChevronDown, ShieldUser } from 'lucide-react'
import { ROLES, useRole } from '@/context/role-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

/**
 * SatelliteHR POC — active (mock) role, shown as the prominent header card
 * (the "environment" slot in the reference). Stories are role-specific, so
 * this drives which actions/screens are visible across every feature.
 * Collapsed rail: the gradient tile alone.
 */
export function RoleSwitcher() {
  const { role, setRole } = useRole()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='h-12 !rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 hover:bg-white/[0.07] data-[state=open]:bg-white/[0.07] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!rounded-lg group-data-[collapsible=icon]:!border-0 group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!p-0'
            >
              <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm group-data-[collapsible=icon]:size-9'>
                <ShieldUser className='size-[18px]' />
              </div>
              <div className='grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='text-[10px] font-medium tracking-wide text-white/45 uppercase'>
                  Active role
                </span>
                <span className='truncate text-sm font-semibold text-white'>
                  {role}
                </span>
              </div>
              <span className='ms-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 group-data-[collapsible=icon]:hidden'>
                <ChevronDown className='size-3.5' />
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-64 rounded-lg'
            align='start'
            side='bottom'
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Active role (mock)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLES.map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => setRole(r)}
                className='gap-2 p-2'
              >
                {r}
                {r === role && <Check className='ml-auto size-4' />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
