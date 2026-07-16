import { Link } from '@tanstack/react-router'
import { Bell, ChevronDown, LogOut } from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { SignOutDialog } from '@/components/common/sign-out-dialog'
import { useUserInfo } from '@/features/auth/hooks/use-user-info'

export function NavUser() {
  // const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()
  const { userInfo } = useUserInfo()
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='h-12 !rounded-xl border border-white/[0.07] bg-white/[0.04] px-2 hover:bg-white/[0.07] data-[state=open]:bg-white/[0.07] group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!rounded-full group-data-[collapsible=icon]:!border-0 group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!p-0'
              >
                <Avatar className='size-8 shrink-0 !rounded-full'>
                  <AvatarImage
                    src={userInfo?.avatar}
                    alt={userInfo?.username}
                  />
                  <AvatarFallback className='rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-xs font-semibold text-white'>
                    {userInfo?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start leading-tight group-data-[collapsible=icon]:hidden'>
                  <span className='truncate text-[13.5px] font-semibold text-white'>
                    {userInfo?.username}
                  </span>
                  <span className='truncate text-[11px] text-white/50'>
                    {userInfo?.['email']}
                  </span>
                </div>
                <ChevronDown className='ms-auto size-4 shrink-0 text-white/50 group-data-[collapsible=icon]:hidden' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side='right'
              align='end'
              sideOffset={28}
              alignOffset={-10}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage
                      src={userInfo?.avatar}
                      alt={userInfo?.username}
                    />
                    <AvatarFallback className='bg-vanilla-200 text-vanilla-100 rounded-full'>
                      {userInfo?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span
                      title={userInfo?.username}
                      className='truncate font-semibold'
                    >
                      {userInfo?.username}
                    </span>
                    <span
                      title={userInfo?.['email']}
                      className='truncate text-xs'
                    >
                      {userInfo?.['email']}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to='/'>
                    <Bell />
                    Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
