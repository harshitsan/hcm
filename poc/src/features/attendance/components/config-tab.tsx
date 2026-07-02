import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { ConfigHolidays } from './config-holidays'
import { ConfigLimits } from './config-limits'
import { ConfigPolicies } from './config-policies'
import { ConfigWorkflows } from './config-workflows'

/**
 * Versioned, effective-dated Time & Attendance configuration (TNA-24):
 * holidays & statutory hours, break/comp-off/flexi policies, out-time & WFH
 * limits, and approval workflows with escalation rules — all per-tenant and
 * applied without a code release.
 */
export function ConfigTab({ config }: { config: AttendanceConfigStore }) {
  return (
    <div className='w-full'>
      <Tabs defaultValue='holidays'>
        <TabsList className='mb-2 flex-wrap'>
          <TabsTrigger value='holidays'>Holidays & Statutory</TabsTrigger>
          <TabsTrigger value='policies'>Breaks · Comp Off · Flexi</TabsTrigger>
          <TabsTrigger value='limits'>Out Time & WFH Limits</TabsTrigger>
          <TabsTrigger value='workflows'>Workflows & Audits</TabsTrigger>
        </TabsList>
        <TabsContent value='holidays'>
          <ConfigHolidays config={config} />
        </TabsContent>
        <TabsContent value='policies'>
          <ConfigPolicies config={config} />
        </TabsContent>
        <TabsContent value='limits'>
          <ConfigLimits config={config} />
        </TabsContent>
        <TabsContent value='workflows'>
          <ConfigWorkflows config={config} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
