import { useEffect, useMemo, useState } from 'react'
import { MegaphoneSimple } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { ConfigTab } from './components/config-tab'
import { CoordinatorsCard } from './components/coordinators-card'
import { FeedTab } from './components/feed-tab'
import { ImagesTab } from './components/images-tab'
import { ManageTab } from './components/manage-tab'
import { ReviewTab } from './components/review-tab'
import {
  ThoughtOfTheDayAdmin,
  ThoughtOfTheDayCard,
} from './components/thought-of-the-day'
import { useAnnouncementSettings } from './hooks/use-announcement-settings'
import { useAnnouncements } from './hooks/use-announcements'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

/**
 * Announcements module: admin management list with the approval lifecycle,
 * the employee self-service feed, the milestone image library, and the
 * Platform Admin governance surface — all against in-memory stores.
 */
export function Announcements() {
  const { role } = useRole()
  const store = useAnnouncements()
  const settings = useAnnouncementSettings()

  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
  const isPlatformAdmin = role === 'Platform Admin'

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isAdmin) tabs.push('manage', 'review')
    tabs.push('feed')
    if (isAdmin) tabs.push('admin')
    return tabs
  }, [isAdmin])

  const [tab, setTab] = useState(() => takeRequestedTab('/announcements') ?? (isAdmin ? 'manage' : 'feed'))

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  const moduleDisabled = !settings.moduleEnabled

  return (
    <>
      <CommonHeader title='Announcements' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 bg-transparent p-0'>
              {isAdmin && (
                <TabsTrigger variant='primary' value='manage'>
                  Manage
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger variant='primary' value='review'>
                  Review
                </TabsTrigger>
              )}
              <TabsTrigger variant='primary' value='feed'>
                My Feed
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger variant='primary' value='admin'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {moduleDisabled && !(tab === 'admin' && isPlatformAdmin) ? (
              <div className='border-gray-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
                <MegaphoneSimple size={32} className='text-neutral-1000' />
                <p className='text-neutral-1600 text-paragraph-md font-medium'>
                  Announcements are disabled for this tenant
                </p>
                <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
                  The module toggle in the tenant configuration is off, so no
                  compose or view surfaces are available.
                  {isPlatformAdmin
                    ? ' Re-enable it from the Admin tab.'
                    : ' Contact your Platform Admin to enable it.'}
                </p>
              </div>
            ) : (
              <>
                {isAdmin && (
                  <TabsContent value='manage'>
                    <ManageTab store={store} orgConfig={settings.orgConfig} />
                  </TabsContent>
                )}
                {isAdmin && (
                  <TabsContent value='review'>
                    <ReviewTab store={store} orgConfig={settings.orgConfig} />
                  </TabsContent>
                )}
                <TabsContent value='feed'>
                  {/* kx-084 surface: thought of the day on the employee feed */}
                  <ThoughtOfTheDayCard settings={settings} />
                  <FeedTab store={store} images={settings.images} />
                </TabsContent>
                {isAdmin && (
                  <TabsContent value='admin'>
                    <div className='mb-3'>
                      <EngineArtifactsPanel module='Announcements' />
                    </div>
                    {isPlatformAdmin ? (
                      <div className='flex flex-col gap-6'>
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Thought of the day</h3>
                          <ThoughtOfTheDayAdmin settings={settings} />
                        </section>
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Coordinators</h3>
                          <CoordinatorsCard
                            settings={settings}
                            orgConfig={settings.orgConfig}
                          />
                        </section>
                        {!moduleDisabled && (
                          <section>
                            <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Images</h3>
                            <ImagesTab settings={settings} />
                          </section>
                        )}
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Settings</h3>
                          <ConfigTab
                            settings={settings}
                            onRunSchedulingEngine={store.runSchedulingEngine}
                          />
                        </section>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-6'>
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Thought of the day</h3>
                          <ThoughtOfTheDayAdmin settings={settings} />
                        </section>
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Coordinators</h3>
                          <CoordinatorsCard
                            settings={settings}
                            orgConfig={settings.orgConfig}
                          />
                        </section>
                        <section>
                          <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Images</h3>
                          <ImagesTab settings={settings} />
                        </section>
                      </div>
                    )}
                  </TabsContent>
                )}
              </>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
