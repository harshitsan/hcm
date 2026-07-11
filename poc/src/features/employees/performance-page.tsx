import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AppreciationsTab } from './components/performance/appreciations-tab'
import {
  AcknowledgementsTab,
  DisciplinaryTab,
} from './components/performance/compliance-tabs'
import { QuadrantTab } from './components/performance/quadrant-tab'
import {
  ClassChangesTab,
  SalaryRevisionsTab,
} from './components/performance/requests-tabs'
import { usePerformance } from './hooks/use-performance'

/**
 * Employees — Performance & Requests: appreciations with points, monthly
 * quadrant ratings, salary revision approvals, class changes with approver
 * routing, disciplinary actions and document acknowledgements.
 */
export function EmployeesPerformance() {
  const store = usePerformance()

  return (
    <>
      <CommonHeader
        title='Employees — Performance & Requests'
        className='bg-blue-150'
        backButton
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue='appreciations'>
            <TabsList className='mb-3'>
              <TabsTrigger value='appreciations'>Appreciations</TabsTrigger>
              <TabsTrigger value='quadrant'>Quadrant Ratings</TabsTrigger>
              <TabsTrigger value='salary'>Salary Revisions</TabsTrigger>
              <TabsTrigger value='class-changes'>Class Changes</TabsTrigger>
              <TabsTrigger value='disciplinary'>Disciplinary</TabsTrigger>
              <TabsTrigger value='acknowledgements'>
                Acknowledgements
              </TabsTrigger>
            </TabsList>

            <TabsContent value='appreciations'>
              <AppreciationsTab store={store} />
            </TabsContent>
            <TabsContent value='quadrant'>
              <QuadrantTab store={store} />
            </TabsContent>
            <TabsContent value='salary'>
              <SalaryRevisionsTab store={store} />
            </TabsContent>
            <TabsContent value='class-changes'>
              <ClassChangesTab store={store} />
            </TabsContent>
            <TabsContent value='disciplinary'>
              <DisciplinaryTab store={store} />
            </TabsContent>
            <TabsContent value='acknowledgements'>
              <AcknowledgementsTab store={store} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
