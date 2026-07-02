import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole, type Role } from '@/context/role-context'
import { ApprovalsTab } from './components/approvals-tab'
import { CaptureTab } from './components/capture-tab'
import { ConfigTab } from './components/config-tab'
import { MyAttendanceTab } from './components/my-attendance-tab'
import { MyRequestsPanel } from './components/my-requests-panel'
import { NonUserTab } from './components/non-user-tab'
import { OversightTab } from './components/oversight-tab'
import { OvertimeTab } from './components/overtime-tab'
import { PlatformTab } from './components/platform-tab'
import { ReviewTab } from './components/review-tab'
import { ShiftsTab } from './components/shifts-tab'
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
 * Which tabs each role sees; the first visible tab is the default. Employees
 * get self-service, Company Admins the full capture/review/approval desk,
 * Group and Portfolio Admins cross-company oversight, Platform Admins the
 * integration and data-model surfaces.
 */
const TABS: TabDef[] = [
  { value: 'my', label: 'My Attendance', roles: ['Employee (User)'] },
  { value: 'my-requests', label: 'My Requests', roles: ['Employee (User)'] },
  { value: 'records', label: 'My Records', roles: ['Employee (Non-User)'] },
  {
    value: 'review',
    label: 'Review & Compliance',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  { value: 'capture', label: 'Capture Desk', roles: ['Company Admin'] },
  { value: 'shifts', label: 'Shifts & Rosters', roles: ['Company Admin'] },
  { value: 'overtime', label: 'Overtime', roles: ['Company Admin'] },
  { value: 'team', label: 'Team Functions', roles: ['Company Admin'] },
  {
    value: 'config',
    label: 'Configuration',
    roles: ['Company Admin', 'Group Company Admin'],
  },
  {
    value: 'group',
    label: 'Group Oversight',
    roles: ['Group Company Admin', 'Portfolio Admin'],
  },
  { value: 'platform', label: 'Platform', roles: ['Platform Admin'] },
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

            <TabsContent value='records'>
              <NonUserTab attendance={attendance} requests={requests} />
            </TabsContent>

            <TabsContent value='review'>
              <ReviewTab attendance={attendance} />
            </TabsContent>

            <TabsContent value='capture'>
              <CaptureTab attendance={attendance} config={config} />
            </TabsContent>

            <TabsContent value='shifts'>
              <ShiftsTab shifts={shifts} />
            </TabsContent>

            <TabsContent value='overtime'>
              <OvertimeTab attendance={attendance} config={config} />
            </TabsContent>

            <TabsContent value='team'>
              <ApprovalsTab
                attendance={attendance}
                requests={requests}
                shifts={shifts}
                actor={actor}
              />
            </TabsContent>

            <TabsContent value='config'>
              <ConfigTab config={config} />
            </TabsContent>

            <TabsContent value='group'>
              <OversightTab config={config} />
            </TabsContent>

            <TabsContent value='platform'>
              <PlatformTab config={config} attendance={attendance} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
