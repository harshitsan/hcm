import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type FmlaReason } from '../data/config'
import { type LeaveType } from '../data/leave-types'
import { CURRENT_EMPLOYEE_ID, EMPLOYEES } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { AdjustmentsPanel } from './adjustments-panel'
import { ApprovalsPanel } from './approvals-panel'
import { LeaveCalendar } from './leave-calendar'
import { OptionalRequestsPanel } from './optional-requests-panel'

interface TeamTabProps {
  requests: LeaveRequestsStore
  balances: BalancesStore
  settings: LeaveSettingsStore
  leaveTypes: LeaveType[]
  fmlaReasons: FmlaReason[]
}

/**
 * Team Functions for an Employee (User) acting as a manager: approvals
 * (LVE-12), team calendar with conflict visibility (LVE-13), balance
 * adjustments (LVE-43) and optional-holiday reviews (LVE-46).
 */
export function TeamTab({
  requests,
  balances,
  settings,
  leaveTypes,
  fmlaReasons,
}: TeamTabProps) {
  const teamIds = useMemo(
    () =>
      EMPLOYEES.filter((e) => e.managerId === CURRENT_EMPLOYEE_ID).map(
        (e) => e.id
      ),
    []
  )
  const teamRequests = requests.requests.filter((r) =>
    teamIds.includes(r.employeeId)
  )
  const holidays = settings.calendars
    .filter((c) => c.status === 'published')
    .flatMap((c) => c.holidays.map((h) => ({ date: h.date, name: h.name })))

  return (
    <Tabs defaultValue='approvals' className='w-full'>
      <TabsList className='mb-2'>
        <TabsTrigger variant='ghost' value='approvals'>
          Approvals
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='calendar'>
          Team Calendar
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='adjustments'>
          Time Off Adjustments
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='optional'>
          Optional Holiday Requests
        </TabsTrigger>
      </TabsList>

      <TabsContent value='approvals'>
        <ApprovalsPanel
          requests={requests}
          balances={balances}
          fmlaReasons={fmlaReasons}
          teamIds={teamIds}
          asSupervisor
        />
      </TabsContent>

      <TabsContent value='calendar'>
        <div className='mb-3'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Team Leave Calendar
            <span className='text-neutral-1000 ml-2 text-xs'>
              overlapping entries on the same day signal coverage conflicts —
              check before approving
            </span>
          </h2>
        </div>
        <LeaveCalendar
          requests={teamRequests}
          holidays={holidays}
          closures={settings.closures}
          showNames
          headcount={teamIds.length}
        />
      </TabsContent>

      <TabsContent value='adjustments'>
        <AdjustmentsPanel balances={balances} leaveTypes={leaveTypes} canDecide />
      </TabsContent>

      <TabsContent value='optional'>
        <OptionalRequestsPanel settings={settings} />
      </TabsContent>
    </Tabs>
  )
}
