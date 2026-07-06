import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { TrackingRequestsTab } from './tracking-requests-tab'
import { TrackingSummaryTab } from './tracking-summary-tab'
import { UtilizationTab } from './utilization-tab'

/**
 * Manager-facing Attendance Tracking & Time Management surface: the Employee
 * Attendance Summary (EAS-01…07), the tracking request screens
 * (ECO/EOT/EOV/ESA/WFH/PCR) and the Timesheet Utilization Summary
 * (TUS-06/07).
 */
export function TrackingTab({
  requests,
  shifts,
}: {
  requests: RequestsStore
  shifts: ShiftsStore
}) {
  return (
    <Tabs defaultValue='summary'>
      <TabsList className='mb-2 flex-wrap'>
        <TabsTrigger value='summary'>Attendance Summary</TabsTrigger>
        <TabsTrigger value='requests'>Team Requests</TabsTrigger>
        <TabsTrigger value='utilization'>Utilization</TabsTrigger>
      </TabsList>
      <TabsContent value='summary'>
        <TrackingSummaryTab />
      </TabsContent>
      <TabsContent value='requests'>
        <TrackingRequestsTab requests={requests} shifts={shifts} />
      </TabsContent>
      <TabsContent value='utilization'>
        <UtilizationTab />
      </TabsContent>
    </Tabs>
  )
}
