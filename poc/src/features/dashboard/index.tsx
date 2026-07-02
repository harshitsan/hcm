import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'lucide-react'
import { canAccess, rolesForPath } from '@/config/module-access'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { sidebarData } from '@/components/layout/data/sidebar-data'

const TOTAL_MODULES = 31

/**
 * SatelliteHR POC dashboard — entry point over every implemented module.
 * All modules are listed; the ones the active role cannot open render in a
 * disabled state. The active mock role also drives what each module page
 * lets you do once opened.
 */
export function Dashboard() {
  const { role } = useRole()
  // Show every module; disable the ones this role cannot open (module-access.ts).
  const groups = sidebarData.navGroups.filter((g) => g.title !== '')
  const moduleCount = groups.reduce(
    (n, g) =>
      n + g.items.filter((i) => canAccess(role, String(i.url))).length,
    0
  )

  const stats = [
    { label: 'Modules you can access', value: `${moduleCount} / ${TOTAL_MODULES}` },
    { label: 'User stories implemented', value: '1,174' },
    { label: 'Canonical roles', value: '6' },
    { label: 'Backend', value: 'Mocked in-memory' },
  ]

  return (
    <>
      <CommonHeader title='SatelliteHR — Proof of Concept' />
      <Main>
        <div className='flex flex-col gap-6 pb-10'>
          <Card className='flex flex-col gap-2 p-6'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-h4 text-neutral-1600 font-medium'>
                Welcome to the SatelliteHR POC
              </h2>
              <Badge variant='outline'>{role}</Badge>
            </div>
            <p className='text-paragraph-md text-neutral-1200'>
              Every SatelliteHR user story (BRD + Company Management functional
              spec, enriched with Kensium HRMS depth) is implemented as a
              frontend capability with mock data. Switch the active role from
              the sidebar header to see role-specific actions change across
              modules.
            </p>
          </Card>

          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            {stats.map((s) => (
              <Card key={s.label} className='flex flex-col gap-1 p-4'>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {s.label}
                </span>
                <span className='text-h4 text-neutral-1600 font-semibold'>
                  {s.value}
                </span>
              </Card>
            ))}
          </div>

          {moduleCount === 0 && (
            <Card className='border-red-300 bg-red-50 flex flex-row items-center gap-3 p-4'>
              <Lock className='text-red-1200 size-5 shrink-0' />
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
                  const allowed = canAccess(role, String(item.url))

                  if (!allowed) {
                    const roles = rolesForPath(String(item.url))
                    return (
                      <Card
                        key={item.title}
                        className='border-neutral-200 bg-neutral-50 flex h-full cursor-not-allowed flex-row items-center gap-3 p-4'
                        title={
                          roles.length
                            ? `Requires role: ${roles.join(', ')}`
                            : 'No access for your role'
                        }
                      >
                        {Icon && (
                          <div className='bg-neutral-200 text-neutral-800 flex size-9 shrink-0 items-center justify-center rounded-lg'>
                            <Icon className='size-4' />
                          </div>
                        )}
                        <span className='text-paragraph-md text-neutral-1000 flex-1 font-medium'>
                          {item.title}
                        </span>
                        <Lock className='text-neutral-800 size-4' />
                      </Card>
                    )
                  }

                  return (
                    <Link key={item.title} to={item.url as string}>
                      <Card className='group hover:border-neutral-600 flex h-full flex-row items-center gap-3 p-4 transition-colors'>
                        {Icon && (
                          <div className='bg-blue-100 text-blue-1200 flex size-9 shrink-0 items-center justify-center rounded-lg'>
                            <Icon className='size-4' />
                          </div>
                        )}
                        <span className='text-paragraph-md text-neutral-1600 flex-1 font-medium'>
                          {item.title}
                        </span>
                        <ArrowRight className='text-neutral-800 size-4 opacity-0 transition-opacity group-hover:opacity-100' />
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
