import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'phosphor-react'
import { canAccess, rolesForPath } from '@/config/module-access'
import { MODULE_REGISTRY, type SidebarGroup } from '@/config/module-registry'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SatelliteMark } from '@/components/brand/logo'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { SummaryCards } from '@/components/module-page'
import { HomeAnnouncements } from './components/home-announcements'
import { PlatformAdminDashboard } from './components/platform-admin-dashboard'

/** Module-grid section order — mirrors the sidebar groups. */
const GROUP_ORDER: SidebarGroup[] = [
  'Organization',
  'Workforce',
  'Policies & Comms',
  'Platform',
  'Administration',
]

/**
 * SatelliteHR home — entry point over every module. All modules are listed;
 * the ones the active role cannot open render in a disabled state. The
 * active role also drives what each module page lets you do once opened.
 *
 * The Platform Admin (platform owner, above every tenant) instead lands on a
 * dedicated platform dashboard: billing charts, tenant hierarchy, adoption.
 */
export function Dashboard() {
  const { role } = useRole()

  if (role === 'Platform Admin') {
    return <PlatformAdminDashboard />
  }

  // Everything below derives from the module registry — the same source of
  // truth the sidebar is built from.
  const groups = GROUP_ORDER.map((title) => ({
    title,
    items: MODULE_REGISTRY.filter((m) => m.group === title),
  }))
  const modules = groups.flatMap((g) => g.items)
  const accessible = modules.filter((m) => canAccess(role, m.route))
  const formCount = accessible.reduce((n, m) => n + m.forms.length, 0)
  const eventCount = accessible.reduce((n, m) => n + m.events.length, 0)
  const recordTypeCount = new Set(accessible.flatMap((m) => m.entities)).size

  return (
    <>
      <CommonHeader title='Home' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='flex w-full flex-col gap-6 pb-10'>
          {/* Landing hero — clean light card with a faint brand tint */}
          <div className='from-orbit-100 border-border relative overflow-hidden rounded-xl border bg-gradient-to-br to-white p-6 md:p-8'>
            <div className='border-orbit-200/50 pointer-events-none absolute -top-28 -right-20 size-[360px] rounded-full border' />
            <div className='border-orbit-200/50 pointer-events-none absolute -top-14 -right-6 size-[220px] rounded-full border' />
            <div className='pointer-events-none absolute top-10 right-10 hidden opacity-90 md:block'>
              <SatelliteMark size={84} />
            </div>
            <p className='font-mono text-signal-500 text-[10px] tracking-[0.32em] uppercase'>
              SatelliteHR
            </p>
            <h2 className='font-display text-neutral-1600 mt-2 text-3xl font-bold tracking-tight md:text-4xl'>
              Every HR module, one orbit.
            </h2>
            <p className='text-neutral-1100 mt-3 max-w-2xl text-sm leading-relaxed'>
              Manage your organization, people, policies and platform settings
              from one place. Open a module below to get started — what you
              can see and do in each module follows your role.
            </p>
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              <Badge variant='outline'>{role}</Badge>
              <span className='text-neutral-1000 text-xs'>
                You are signed in as {role} — switch roles from the sidebar
                header to see a different view.
              </span>
            </div>
          </div>

          <SummaryCards
            title='Your workspace at a glance'
            items={[
              {
                label: 'Modules you can open',
                value: `${accessible.length} of ${modules.length}`,
              },
              { label: 'Forms & requests', value: formCount },
              { label: 'Tracked events', value: eventCount },
              { label: 'Record types', value: recordTypeCount },
            ]}
          />

          {/* Company announcements on the landing page (HOME-01). */}
          <HomeAnnouncements />

          {accessible.length === 0 && (
            <Card className='border-red-300 bg-red-50 flex flex-row items-center gap-3 p-4'>
              <Lock size={20} className='text-red-1200 shrink-0' />
              <p className='text-paragraph-md text-neutral-1200'>
                The role <span className='font-medium'>{role}</span> has no
                interactive system access — these employees exist as records
                managed by administrators. Every module below is locked. Switch
                roles from the sidebar header to explore.
              </p>
            </Card>
          )}

          {groups.map((group) => (
            <section key={group.title} className='flex flex-col gap-3'>
              <h3 className='text-paragraph-md text-neutral-1200 font-medium'>
                {group.title}
              </h3>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const allowed = canAccess(role, item.route)

                  if (!allowed) {
                    const roles = rolesForPath(item.route)
                    return (
                      <Card
                        key={item.name}
                        className='border-neutral-200 bg-neutral-50 flex h-full cursor-not-allowed flex-row items-center gap-3 p-4'
                        title={
                          roles.length
                            ? `Requires role: ${roles.join(', ')}`
                            : 'No access for your role'
                        }
                      >
                        <div className='bg-neutral-200 text-neutral-800 flex size-9 shrink-0 items-center justify-center rounded-lg'>
                          <Icon className='size-4' />
                        </div>
                        <span className='text-paragraph-md text-neutral-1000 flex-1 font-medium'>
                          {item.name}
                        </span>
                        <Lock size={16} className='text-neutral-800' />
                      </Card>
                    )
                  }

                  return (
                    <Link key={item.name} to={item.route}>
                      <Card className='group hover:border-neutral-600 flex h-full flex-row items-center gap-3 p-4 transition-colors'>
                        <div className='bg-blue-100 text-blue-1200 flex size-9 shrink-0 items-center justify-center rounded-lg'>
                          <Icon className='size-4' />
                        </div>
                        <span className='text-paragraph-md text-neutral-1600 flex-1 font-medium'>
                          {item.name}
                        </span>
                        <ArrowRight
                          size={16}
                          className='text-neutral-800 opacity-0 transition-opacity group-hover:opacity-100'
                        />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </Main>
    </>
  )
}
