import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
 * Sidebar header block: active tenant name with its environment, plus a
 * dropdown to switch tenants (mock — no backend in the POC).
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
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent !rounded-md'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <activeTenant.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold text-white'>
                  {activeTenant.name}
                </span>
                <span className='flex items-center gap-1.5 truncate text-xs text-white/60'>
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${ENV_DOT[activeTenant.environment]}`}
                  />
                  {activeTenant.environment}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-white/50' />
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
