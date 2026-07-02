import { Outlet } from '@tanstack/react-router'
import { cn } from '@/utils/helpers'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AccessGuard } from '@/components/layout/access-guard'
import { AppSidebar } from '@/components/layout/app-sidebar'

type AuthenticatedLayoutProps = {
  readonly children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = false
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset
          className={cn(
            // Set content container, so we can use container queries
            '@container/content',

            // If layout is fixed, set the height
            // to 100svh to prevent overflow
            'has-[[data-layout=fixed]]:h-svh',

            // If layout is fixed and sidebar is inset,
            // set the height to 100svh - spacing (total margins) to prevent overflow
            'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          <AccessGuard>{children ?? <Outlet />}</AccessGuard>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
