import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGate, useRole } from '@/context/role-context'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigExit } from './config-exit'
import { ConfigExitFlow } from './config-exit-flow'
import { ConfigOnboarding } from './config-onboarding'
import { ConfigProbation } from './config-probation'
import { ConfigTemplates } from './config-templates'
import { SectionCard } from './config-widgets'

interface ConfigTabProps {
  config: LifecycleConfigStore
}

/**
 * Governed lifecycle configuration — versioned templates, decision tables,
 * approver graphs, exit rule-packs and communication templates. Platform
 * Admins additionally control tenant-level module enablement.
 */
export function ConfigTab({ config }: ConfigTabProps) {
  const { role } = useRole()

  return (
    <div className='w-full'>
      <RoleGate roles={['Platform Admin']}>
        <SectionCard
          title='Confirmation Management Module (platform)'
          description='When disabled, confirmation, peer review and periodic review screens are not accessible to this tenant.'
        >
          <div className='flex items-center justify-between'>
            <Label>Do you want to enable the Confirmation Management Module?</Label>
            <Switch
              checked={config.settings.confirmationModuleEnabled}
              onCheckedChange={(v) =>
                config.updateSettings(
                  { confirmationModuleEnabled: v },
                  'Confirmation Management Module'
                )
              }
            />
          </div>
        </SectionCard>
      </RoleGate>

      <RoleGate roles={['Group Company Admin']}>
        <SectionCard
          title='Group configuration standards'
          description='Settings governed here apply consistently across the companies in your group; company admins inherit these standards.'
        >
          <p className='text-neutral-1000 text-xs'>
            Viewing as {role}: Aurora Software India, Aurora Software US and
            Helix Manufacturing follow the shared lifecycle configuration
            below.
          </p>
        </SectionCard>
      </RoleGate>

      <Tabs defaultValue='onboarding' className='w-full'>
        <TabsList className='mb-2'>
          <TabsTrigger variant='primary' value='onboarding'>
            Onboarding
          </TabsTrigger>
          <TabsTrigger variant='primary' value='probation'>
            Probation & Confirmation
          </TabsTrigger>
          <TabsTrigger variant='primary' value='exit'>
            Exit
          </TabsTrigger>
          <TabsTrigger variant='primary' value='exit-flow'>
            Exit Routing & Tasks
          </TabsTrigger>
          <TabsTrigger variant='primary' value='approvals'>
            Approver Graphs
          </TabsTrigger>
          <TabsTrigger variant='primary' value='templates'>
            Letter Templates
          </TabsTrigger>
        </TabsList>
        <TabsContent value='onboarding'>
          <ConfigOnboarding config={config} />
        </TabsContent>
        <TabsContent value='probation'>
          <ConfigProbation config={config} />
        </TabsContent>
        <TabsContent value='exit'>
          <ConfigExit config={config} />
        </TabsContent>
        <TabsContent value='exit-flow'>
          <ConfigExitFlow config={config} />
        </TabsContent>
        <TabsContent value='approvals'>
          <ConfigApprovals config={config} />
        </TabsContent>
        <TabsContent value='templates'>
          <ConfigTemplates config={config} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
