import { Link } from '@tanstack/react-router'
import { Bell, LogOut } from 'lucide-react'
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
        <SidebarMenuItem className='flex items-center justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mb-2 flex !h-auto !w-auto justify-center p-0 group-data-[collapsible=icon]:p-0! hover:!rounded-full hover:bg-transparent data-[state=open]:!rounded-full'
              >
                <Avatar className='!bg-vanilla-200 h-8 w-8 !rounded-full p-2 hover:!rounded-full'>
                  <AvatarImage
                    src={userInfo?.avatar}
                    alt={userInfo?.username}
                  />
                  <AvatarFallback className='bg-vanilla-200 text-vanilla-100 rounded-full'>
                    {userInfo?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' /> */}
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
