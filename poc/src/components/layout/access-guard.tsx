import { Link, useLocation } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { canAccess, moduleKey, rolesForPath } from '@/config/module-access'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { sidebarData } from './data/sidebar-data'

/** Human title for a module path, from the sidebar nav. */
function moduleTitle(pathname: string): string {
  const key = moduleKey(pathname)
  for (const group of [...sidebarData.navGroups, sidebarData.bottomGroup]) {
    for (const item of group.items) {
      if ('url' in item && String(item.url) === key) return item.title
    }
  }
  return 'this module'
}

/**
 * Gates the authenticated content by the active role. When the current route
 * is a module the role may not open, it renders a role-aware "access
 * restricted" panel instead of the page — so switching roles visibly changes
 * what is reachable, not just which buttons show.
 */
export function AccessGuard({ children }: { children: React.ReactNode }) {
  const { role } = useRole()
  const pathname = useLocation({ select: (l) => l.pathname })

  if (canAccess(role, pathname)) return <>{children}</>

  const allowed = rolesForPath(pathname)
  return (
    <div className='flex min-h-[70svh] items-center justify-center p-6'>
      <Card className='flex max-w-lg flex-col items-center gap-4 p-8 text-center'>
        <div className='bg-red-100 text-red-1200 flex size-12 items-center justify-center rounded-full'>
          <ShieldAlert className='size-6' />
        </div>
        <div className='flex flex-col gap-1'>
          <h2 className='text-h4 text-neutral-1600 font-medium'>
            Access restricted
          </h2>
          <p className='text-paragraph-md text-neutral-1200'>
            Your active role{' '}
            <Badge variant='outline' className='mx-1 align-middle'>
              {role}
            </Badge>{' '}
            does not have access to{' '}
            <span className='font-medium'>{moduleTitle(pathname)}</span>.
          </p>
        </div>
        {allowed.length > 0 && (
          <div className='flex flex-col items-center gap-2'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Available to:
            </span>
            <div className='flex flex-wrap justify-center gap-1'>
              {allowed.map((r) => (
                <Badge key={r} variant='secondary'>
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button asChild className='mt-2'>
          <Link to='/'>Back to Dashboard</Link>
        </Button>
      </Card>
    </div>
  )
}
