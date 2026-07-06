import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { ApprovalsTab } from './components/approvals-tab'
import { CaptureTab } from './components/capture-tab'
import { ConfigTab } from './components/config-tab'
import { MyAttendanceTab } from './components/my-attendance-tab'
import { MyRequestsPanel } from './components/my-requests-panel'
import { MyTimesheetTab } from './components/my-timesheet-tab'
import { NonUserTab } from './components/non-user-tab'
import { OversightTab } from './components/oversight-tab'
import { OvertimeTab } from './components/overtime-tab'
import { PlatformTab } from './components/platform-tab'
import { ReviewTab } from './components/review-tab'
import { ShiftsTab } from './components/shifts-tab'
import { TrackingTab } from './components/tracking-tab'
import { useAttendance } from './hooks/use-attendance'
import { useAttendanceConfig } from './hooks/use-attendance-config'
import { useRequests } from './hooks/use-requests'
import { useShifts } from './hooks/use-shifts'

/** Named persona acting for each canonical role (used for attribution). */
const ACTORS: Record<Role, string> = {
  'Platform Admin': 'Platform Ops',
  'Portfolio Admin': 'Devika Rao',
  'Group Company Admin': 'Arjun Mehta',
  'Company Admin': 'Sunita Patil',
  'Employee (User)': 'Ananya Sharma',
  'Employee (Non-User)': 'Ravi Naik',
}

interface TabDef {
  value: string
  label: string
  roles: Role[]
}

/**
 * Which tabs each role sees; the first visible tab is the default and tabs
 * are ordered task-first. Employees get self-service, Company Admins land on
 * the attendance list (review + capture nested) with approvals next, Group
 * and Portfolio Admins get the cross-company overview, and every admin-only
 * surface (company settings, platform integrations & data model) lives under
 * a single Admin tab with the same role gates as before.
 */
const TABS: TabDef[] = [
  { value: 'my', label: 'My Attendance', roles: ['Employee (User)'] },
  { value: 'my-requests', label: 'My Requests', roles: ['Employee (User)'] },
  { value: 'my-timesheet', label: 'My Timesheet', roles: ['Employee (User)'] },
  { value: 'records', label: 'My Records', roles: ['Employee (Non-User)'] },
  {
    value: 'attendance',
    label: 'Attendance',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  { value: 'team', label: 'Approvals', roles: ['Company Admin'] },
  { value: 'shifts', label: 'Shifts & Rosters', roles: ['Company Admin'] },
  { value: 'overtime', label: 'Overtime', roles: ['Company Admin'] },
  { value: 'tracking', label: 'Tracking', roles: ['Company Admin'] },
  {
    value: 'group',
    label: 'Group Overview',
    roles: ['Group Company Admin', 'Portfolio Admin'],
  },
  {
    value: 'admin',
    label: 'Admin',
    roles: ['Company Admin', 'Group Company Admin', 'Platform Admin'],
  },
]

/**
 * Time & Attendance — multi-source capture (manual/biometric/API/import),
 * shifts & rosters with swaps, holiday calendars, overtime calculation and
 * approval, exception corrections with escalation, statutory compliance,
 * administrative overrides with an immutable audit trail, self-service views
 * and platform-level integration/data-model surfaces (TNA-01 … TNA-48).
 */
export function TimeAttendance() {
  const { role } = useRole()
  const actor = ACTORS[role]

  const config = useAttendanceConfig()
  const attendance = useAttendance(actor)
  const shifts = useShifts(actor)

  // Policy limits the request flows enforce come from governed config.
  const correctionWorkflow = config.workflows.find(
    (w) => w.kind === 'attendance-correction' && w.status === 'active'
  )
  const supervisorCapHours =
    config.workflows.find((w) => w.kind === 'overtime' && w.supervisorCapHours !== null)
      ?.supervisorCapHours ?? 4
  const requests = useRequests({
    actor,
    applyCorrection: attendance.applyCorrection,
    supervisorCapHours,
    wfhMonthlyLimit: config.wfhTemplates[0]?.maxPerMonth ?? 4,
    outTimeMaxHoursPerRequest: config.outTimeSettings[0]?.maxHoursPerRequest ?? 3,
  })

  const visibleTabs = TABS.filter((t) => t.roles.includes(role))

  return (
    <>
      <CommonHeader title='Time & Attendance' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs defaultValue={visibleTabs[0]?.value} key={role}>
            <TabsList className='mb-2 flex-wrap'>
              {visibleTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='my'>
              <MyAttendanceTab attendance={attendance} shifts={shifts} config={config} />
            </TabsContent>

            <TabsContent value='my-requests'>
              <MyRequestsPanel
                requests={requests}
                shifts={shifts}
                payrollCutoffDay={correctionWorkflow?.payrollCutoffDay ?? 25}
              />
            </TabsContent>

            <TabsContent value='my-timesheet'>
              <MyTimesheetTab />
            </TabsContent>

            <TabsContent value='records'>
              <NonUserTab attendance={attendance} requests={requests} />
            </TabsContent>

            <TabsContent value='attendance'>
              {role === 'Company Admin' ? (
                <Tabs defaultValue='review'>
                  <TabsList className='mb-2 flex-wrap'>
                    <TabsTrigger value='review'>Review</TabsTrigger>
                    <TabsTrigger value='capture'>Capture</TabsTrigger>
                  </TabsList>
                  <TabsContent value='review'>
                    <ReviewTab attendance={attendance} />
                  </TabsContent>
                  <TabsContent value='capture'>
                    <CaptureTab attendance={attendance} config={config} />
                  </TabsContent>
                </Tabs>
              ) : (
                <ReviewTab attendance={attendance} />
              )}
            </TabsContent>

            <TabsContent value='shifts'>
              <ShiftsTab shifts={shifts} />
            </TabsContent>

            <TabsContent value='overtime'>
              <OvertimeTab attendance={attendance} config={config} />
            </TabsContent>

            <TabsContent value='tracking'>
              <TrackingTab requests={requests} shifts={shifts} />
            </TabsContent>

            <TabsContent value='team'>
              <ApprovalsTab
                attendance={attendance}
                requests={requests}
                shifts={shifts}
                actor={actor}
              />
            </TabsContent>

            <TabsContent value='group'>
              <OversightTab config={config} />
            </TabsContent>

            <TabsContent value='admin'>
              <EngineArtifactsPanel module='Time & Attendance' />
              {role === 'Platform Admin' ? (
                <PlatformTab config={config} attendance={attendance} />
              ) : (
                <ConfigTab config={config} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
