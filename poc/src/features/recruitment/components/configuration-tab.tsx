import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAssessment } from '../hooks/use-assessment'
import { useCompensation } from '../hooks/use-compensation'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigAssessment } from './config-assessment'
import { ConfigCompensation } from './config-compensation'
import { ConfigHiring } from './config-hiring'
import { ConfigOnboarding } from './config-onboarding'
import { ConfigSetup } from './config-setup'
import { ConfigSourcing } from './config-sourcing'

/**
 * Recruitment configuration workspace — governed metadata read by the shared
 * workflow / rules / notification / forms engines (TA-15, TA-16, TA-25,
 * TA-26, TA-35, TA-37, TA-38, TA-40, TA-41, TA-43, TA-46, TA-48, TA-51…TA-56).
 */
export function ConfigurationTab({
  config,
}: {
  config: RecruitmentConfigStore
}) {
  const compensation = useCompensation()
  const assessment = useAssessment()

  return (
    <Tabs defaultValue='approvals' className='w-full'>
      <TabsList className='mb-2 flex-wrap'>
        <TabsTrigger value='approvals' variant='ghost'>
          Approvals &amp; Letters
        </TabsTrigger>
        <TabsTrigger value='interviews' variant='ghost'>
          Interviews &amp; Scorecards
        </TabsTrigger>
        <TabsTrigger value='sourcing' variant='ghost'>
          Sourcing &amp; Channels
        </TabsTrigger>
        <TabsTrigger value='compensation' variant='ghost'>
          Compensation
        </TabsTrigger>
        <TabsTrigger value='assessments' variant='ghost'>
          Assessments
        </TabsTrigger>
        <TabsTrigger value='prejoining' variant='ghost'>
          Pre-joining &amp; Fields
        </TabsTrigger>
        <TabsTrigger value='setup' variant='ghost'>
          Setup &amp; Templates
        </TabsTrigger>
      </TabsList>

      <TabsContent value='approvals'>
        <ConfigApprovals config={config} />
      </TabsContent>
      <TabsContent value='interviews'>
        <ConfigHiring config={config} />
      </TabsContent>
      <TabsContent value='sourcing'>
        <ConfigSourcing config={config} />
      </TabsContent>
      <TabsContent value='compensation'>
        <ConfigCompensation store={compensation} />
      </TabsContent>
      <TabsContent value='assessments'>
        <ConfigAssessment store={assessment} />
      </TabsContent>
      <TabsContent value='prejoining'>
        <ConfigOnboarding config={config} />
      </TabsContent>
      <TabsContent value='setup'>
        <ConfigSetup config={config} />
      </TabsContent>
    </Tabs>
  )
}
