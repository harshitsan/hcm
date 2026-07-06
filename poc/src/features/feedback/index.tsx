import { useEffect, useMemo, useState } from 'react'
import { ChatCircleText } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { ConfigTab } from './components/config-tab'
import { GovernanceTab } from './components/governance-tab'
import { MyEntriesTab } from './components/my-entries-tab'
import { WorklistTab } from './components/worklist-tab'
import { useFeedbackConfig } from './hooks/use-feedback-config'
import { useFeedbackEntries } from './hooks/use-feedback-entries'

const REVIEWER_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

/**
 * Feedback & Grievance module (FR 6.19): employee submission and status
 * tracking, the role-based reviewer worklist, guided per-tenant
 * configuration (Setup → Receivers → Email Templates), and platform/portfolio
 * governance — all over in-memory stores for the POC.
 */
export function Feedback() {
  const { role } = useRole()
  const entriesStore = useFeedbackEntries()
  const configStore = useFeedbackConfig()

  const isReviewer = (REVIEWER_ROLES as readonly string[]).includes(role)
  const isCompanyAdmin = role === 'Company Admin'
  const isGovernance = role === 'Platform Admin' || role === 'Portfolio Admin'
  const isNonUser = role === 'Employee (Non-User)'

  const hasAdmin = isCompanyAdmin || isGovernance

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isReviewer) tabs.push('worklist')
    if (!isNonUser) tabs.push('my')
    if (hasAdmin) tabs.push('admin')
    return tabs
  }, [isReviewer, hasAdmin, isNonUser])

  const [tab, setTab] = useState(isReviewer ? 'worklist' : 'my')

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0] ?? 'my')
  }, [availableTabs, tab])

  const moduleDisabled = !configStore.config.moduleEnabled

  return (
    <>
      <CommonHeader title='Feedback & Grievance' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isNonUser ? (
            <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
              <ChatCircleText size={32} className='text-neutral-1000' />
              <p className='text-neutral-1600 text-paragraph-md font-medium'>
                Employees without system access don't use this screen
              </p>
              <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
                As an Employee (Non-User) you can raise a concern with your
                Company Admin, who submits a feedback or grievance entry on
                your behalf. It then enters the same role-based review
                workflow, and the audit trail records that it was filed for
                you.
              </p>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className='w-full'>
              <TabsList className='mb-3 bg-transparent p-0'>
                {isReviewer && (
                  <TabsTrigger variant='primary' value='worklist'>
                    Review Queue
                  </TabsTrigger>
                )}
                <TabsTrigger variant='primary' value='my'>
                  My Feedback
                </TabsTrigger>
                {hasAdmin && (
                  <TabsTrigger variant='primary' value='admin'>
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>

              {moduleDisabled && (tab === 'my' || tab === 'worklist') ? (
                <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
                  <ChatCircleText size={32} className='text-neutral-1000' />
                  <p className='text-neutral-1600 text-paragraph-md font-medium'>
                    Feedback & Grievance is disabled for this company
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
                    The per-tenant module toggle is off, so submission and
                    tracking are not available.
                    {isCompanyAdmin
                      ? ' Re-enable it from the Admin tab (Setup step).'
                      : ' Contact your Company Admin to enable it.'}
                  </p>
                </div>
              ) : (
                <>
                  {isReviewer && (
                    <TabsContent value='worklist'>
                      <WorklistTab store={entriesStore} configStore={configStore} />
                    </TabsContent>
                  )}
                  <TabsContent value='my'>
                    <MyEntriesTab
                      store={entriesStore}
                      configStore={configStore}
                      allowOnBehalf={isCompanyAdmin}
                    />
                  </TabsContent>
                  {hasAdmin && (
                    <TabsContent value='admin'>
                      <div className='flex flex-col gap-6'>
                        <EngineArtifactsPanel module='Feedback & Grievance' />
                        {isCompanyAdmin && <ConfigTab store={configStore} />}
                        {isGovernance && <GovernanceTab store={configStore} />}
                      </div>
                    </TabsContent>
                  )}
                </>
              )}
            </Tabs>
          )}
        </div>
      </Main>
    </>
  )
}
