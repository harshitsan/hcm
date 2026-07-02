import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type LeaveConfigStore } from '../hooks/use-leave-config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { ConfigApprovers } from './config-approvers'
import { ConfigGeneral } from './config-general'
import { ConfigHolidays } from './config-holidays'
import { ConfigPolicies } from './config-policies'
import { ConfigTypes } from './config-types'
import { ConfigWorkflows } from './config-workflows'

const STEPS = ['setup', 'types', 'policies', 'workflows', 'approvers', 'holidays'] as const

interface ConfigTabProps {
  config: LeaveConfigStore
  settings: LeaveSettingsStore
}

/** Company Admin configuration hub — Kensium “Time Off - Leave” sections. */
export function ConfigTab({ config, settings }: ConfigTabProps) {
  const [step, setStep] = useState<string>('setup')

  const nextStep = () => {
    const i = STEPS.indexOf(step as (typeof STEPS)[number])
    setStep(STEPS[Math.min(i + 1, STEPS.length - 1)])
  }

  return (
    <Tabs value={step} onValueChange={setStep} className='w-full'>
      <TabsList className='mb-2 flex-wrap'>
        <TabsTrigger variant='ghost' value='setup'>
          Setup & Rules
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='types'>
          Time Off Types
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='policies'>
          Policies
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='workflows'>
          Workflows & Delegation
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='approvers'>
          Approvers & FMLA
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='holidays'>
          Holidays & Closures
        </TabsTrigger>
      </TabsList>

      <TabsContent value='setup'>
        <ConfigGeneral settings={settings} onNextStep={nextStep} />
      </TabsContent>
      <TabsContent value='types'>
        <ConfigTypes config={config} />
      </TabsContent>
      <TabsContent value='policies'>
        <ConfigPolicies config={config} isGroupAdmin={false} />
      </TabsContent>
      <TabsContent value='workflows'>
        <ConfigWorkflows config={config} />
      </TabsContent>
      <TabsContent value='approvers'>
        <ConfigApprovers settings={settings} />
      </TabsContent>
      <TabsContent value='holidays'>
        <ConfigHolidays settings={settings} />
      </TabsContent>
    </Tabs>
  )
}
