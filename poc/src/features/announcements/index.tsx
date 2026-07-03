import { useEffect, useMemo, useState } from 'react'
import { MegaphoneSimple } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { ConfigTab } from './components/config-tab'
import { FeedTab } from './components/feed-tab'
import { ImagesTab } from './components/images-tab'
import { ManageTab } from './components/manage-tab'
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
    if (isAdmin) tabs.push('manage')
    tabs.push('feed')
    if (isAdmin) tabs.push('admin')
    return tabs
  }, [isAdmin])

  const [tab, setTab] = useState(isAdmin ? 'manage' : 'feed')

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
              <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
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
                <TabsContent value='feed'>
                  <FeedTab store={store} images={settings.images} />
                </TabsContent>
                {isAdmin && (
                  <TabsContent value='admin'>
                    {isPlatformAdmin ? (
                      <Tabs
                        key={moduleDisabled ? 'disabled' : 'enabled'}
                        defaultValue={moduleDisabled ? 'settings' : 'images'}
                        className='w-full'
                      >
                        <TabsList className='mb-3 bg-transparent p-0'>
                          {!moduleDisabled && (
                            <TabsTrigger variant='primary' value='images'>
                              Images
                            </TabsTrigger>
                          )}
                          <TabsTrigger variant='primary' value='settings'>
                            Settings
                          </TabsTrigger>
                        </TabsList>
                        {!moduleDisabled && (
                          <TabsContent value='images'>
                            <ImagesTab settings={settings} />
                          </TabsContent>
                        )}
                        <TabsContent value='settings'>
                          <ConfigTab
                            settings={settings}
                            onRunSchedulingEngine={store.runSchedulingEngine}
                          />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <ImagesTab settings={settings} />
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
