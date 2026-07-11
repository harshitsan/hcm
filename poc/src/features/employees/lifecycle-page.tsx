import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import {
  JoiningChecklistTab,
  NewJoineesTab,
} from './components/lifecycle/onboarding-tabs'
import {
  ExitClearanceTab,
  ExitHrChecklistTab,
} from './components/lifecycle/exit-support-tabs'
import { ExitsTab } from './components/lifecycle/exits-tab'
import { LayoffsTab } from './components/lifecycle/layoffs-tab'
import { useLifecycle } from './hooks/use-lifecycle'

/**
 * Employees — Onboarding & Exit: new joinees, joining checklist config,
 * exit + FFS workflow, department clearances, exit HR checklist and layoffs.
 */
export function EmployeesLifecycle() {
  const store = useLifecycle()

  return (
    <>
      <CommonHeader
        title='Employees — Onboarding & Exit'
        className='bg-blue-150'
        backButton
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue='joinees'>
            <TabsList className='mb-3'>
              <TabsTrigger value='joinees'>
                New Joinees ({store.joinees.length})
              </TabsTrigger>
              <TabsTrigger value='checklist'>Joining Checklist</TabsTrigger>
              <TabsTrigger value='exits'>
                Exits ({store.exits.length})
              </TabsTrigger>
              <TabsTrigger value='clearance'>Exit Clearance</TabsTrigger>
              <TabsTrigger value='hr-checklist'>Exit HR Checklist</TabsTrigger>
              <TabsTrigger value='layoffs'>Layoffs</TabsTrigger>
            </TabsList>

            <TabsContent value='joinees'>
              <NewJoineesTab store={store} />
            </TabsContent>
            <TabsContent value='checklist'>
              <JoiningChecklistTab store={store} />
            </TabsContent>
            <TabsContent value='exits'>
              <ExitsTab store={store} />
            </TabsContent>
            <TabsContent value='clearance'>
              <ExitClearanceTab store={store} />
            </TabsContent>
            <TabsContent value='hr-checklist'>
              <ExitHrChecklistTab store={store} />
            </TabsContent>
            <TabsContent value='layoffs'>
              <LayoffsTab store={store} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
