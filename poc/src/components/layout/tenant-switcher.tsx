import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
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
import { type Tenant } from './types'

const ENV_DOT: Record<Tenant['environment'], string> = {
  Production: 'bg-emerald-400',
  Sandbox: 'bg-amber-400',
  Staging: 'bg-sky-400',
}

/**
 * Sidebar header — compact tenant row: gradient initial, tenant name, caret.
 * Collapsed rail: just the initial. Switching is a POC mock (no backend).
 */
export function TenantSwitcher({ tenants }: { tenants: Tenant[] }) {
  const [activeTenant, setActiveTenant] = useState<Tenant | undefined>(
    tenants[0]
  )

  if (!activeTenant) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className='h-10 !rounded-lg px-1.5 hover:bg-white/[0.06] data-[state=open]:bg-white/[0.06] group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0'>
              <span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white'>
                {activeTenant.name.charAt(0).toUpperCase()}
              </span>
              <span className='truncate text-[13.5px] font-semibold text-white group-data-[collapsible=icon]:hidden'>
                {activeTenant.name}
              </span>
              <ChevronDown className='ms-auto size-4 shrink-0 text-white/50 group-data-[collapsible=icon]:hidden' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-64 rounded-lg'
            align='start'
            side='bottom'
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Tenants
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.name}
                onClick={() => setActiveTenant(tenant)}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border'>
                  <tenant.logo className='size-4 shrink-0' />
                </div>
                <div className='grid flex-1 text-left leading-tight'>
                  <span className='truncate text-sm'>{tenant.name}</span>
                  <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${ENV_DOT[tenant.environment]}`}
                    />
                    {tenant.environment}
                  </span>
                </div>
                {tenant.name === activeTenant.name && (
                  <Check className='ml-auto size-4' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
