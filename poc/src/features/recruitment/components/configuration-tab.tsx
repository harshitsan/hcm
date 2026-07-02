import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigHiring } from './config-hiring'
import { ConfigOnboarding } from './config-onboarding'
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
  return (
    <Tabs defaultValue='approvals' className='w-full'>
      <TabsList className='mb-2'>
        <TabsTrigger value='approvals' variant='ghost'>
          Approvals &amp; Letters
        </TabsTrigger>
        <TabsTrigger value='interviews' variant='ghost'>
          Interviews &amp; Scorecards
        </TabsTrigger>
        <TabsTrigger value='sourcing' variant='ghost'>
          Sourcing &amp; Channels
        </TabsTrigger>
        <TabsTrigger value='prejoining' variant='ghost'>
          Pre-joining &amp; Fields
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
      <TabsContent value='prejoining'>
        <ConfigOnboarding config={config} />
      </TabsContent>
    </Tabs>
  )
}
