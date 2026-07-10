import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type GlobalSettingsStore } from '../hooks/use-global-settings'
import { type LeaveConfigStore } from '../hooks/use-leave-config'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { ConfigApprovers } from './config-approvers'
import { ConfigCalendar } from './config-calendar'
import { ConfigGeneral } from './config-general'
import { ConfigGlobal } from './config-global'
import { ConfigHolidays } from './config-holidays'
import { ConfigPolicies } from './config-policies'
import { ConfigShifts } from './config-shifts'
import { ConfigTimeOffAdmins } from './config-timeoff-admins'
import { ConfigTypes } from './config-types'
import { ConfigWorkflows } from './config-workflows'

const STEPS = [
  'global',
  'setup',
  'calendar',
  'shifts',
  'types',
  'policies',
  'workflows',
  'approvers',
  'timeoff-admins',
  'holidays',
] as const

interface ConfigTabProps {
  config: LeaveConfigStore
  settings: LeaveSettingsStore
  globalSettings: GlobalSettingsStore
}

/** Company Admin configuration hub — Kensium “Time Off - Leave” sections. */
export function ConfigTab({ config, settings, globalSettings }: ConfigTabProps) {
  const [step, setStep] = useState<string>('setup')

  const nextStep = () => {
    const i = STEPS.indexOf(step as (typeof STEPS)[number])
    setStep(STEPS[Math.min(i + 1, STEPS.length - 1)])
  }

  return (
    <Tabs value={step} onValueChange={setStep} className='w-full'>
      <TabsList className='mb-2 flex-wrap'>
        <TabsTrigger variant='ghost' value='global'>
          Global Settings
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='setup'>
          Setup & Rules
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='calendar'>
          Calendar
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='shifts'>
          Shifts
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
        <TabsTrigger variant='ghost' value='timeoff-admins'>
          Time Off Admins
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='holidays'>
          Holidays & Closures
        </TabsTrigger>
      </TabsList>

      <TabsContent value='global'>
        <ConfigGlobal store={globalSettings} />
      </TabsContent>
      <TabsContent value='setup'>
        <ConfigGeneral settings={settings} onNextStep={nextStep} />
      </TabsContent>
      <TabsContent value='calendar'>
        <ConfigCalendar settings={settings} onNextStep={nextStep} />
      </TabsContent>
      <TabsContent value='shifts'>
        <ConfigShifts store={settings} />
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
      <TabsContent value='timeoff-admins'>
        <ConfigTimeOffAdmins store={globalSettings} />
      </TabsContent>
      <TabsContent value='holidays'>
        <ConfigHolidays settings={settings} />
      </TabsContent>
    </Tabs>
  )
}
