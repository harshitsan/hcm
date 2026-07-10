import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { ConfigAudit } from './config-audit'
import { ConfigHolidays } from './config-holidays'
import { ConfigLimits } from './config-limits'
import { ConfigPolicies } from './config-policies'
import { ConfigTemplates } from './config-templates'
import { ConfigWorkflows } from './config-workflows'

/**
 * Versioned, effective-dated Time & Attendance configuration (TNA-24):
 * holidays & statutory hours, break/comp-off/flexi policies, out-time & WFH
 * limits, approval workflows with escalation rules, attendance audit setup
 * and email/notification templates — all per-tenant, applied without a code
 * release. Each step offers Save & Next so admins can walk the setup flow.
 */
export function ConfigTab({ config }: { config: AttendanceConfigStore }) {
  const [step, setStep] = useState('holidays')

  return (
    <div className='w-full'>
      <Tabs value={step} onValueChange={setStep}>
        <TabsList className='mb-2 flex-wrap'>
          <TabsTrigger value='holidays'>Holidays & Statutory</TabsTrigger>
          <TabsTrigger value='policies'>Breaks · Comp Off · Flexi</TabsTrigger>
          <TabsTrigger value='limits'>Out Time & WFH Limits</TabsTrigger>
          <TabsTrigger value='workflows'>Workflows & Approvers</TabsTrigger>
          <TabsTrigger value='audit'>Audit & Auditors</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
        </TabsList>
        <TabsContent value='holidays'>
          <ConfigHolidays config={config} />
        </TabsContent>
        <TabsContent value='policies'>
          <ConfigPolicies config={config} onNext={() => setStep('limits')} />
        </TabsContent>
        <TabsContent value='limits'>
          <ConfigLimits config={config} onNext={() => setStep('workflows')} />
        </TabsContent>
        <TabsContent value='workflows'>
          <ConfigWorkflows config={config} onNext={() => setStep('audit')} />
        </TabsContent>
        <TabsContent value='audit'>
          <ConfigAudit config={config} onNext={() => setStep('templates')} />
        </TabsContent>
        <TabsContent value='templates'>
          <ConfigTemplates config={config} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
