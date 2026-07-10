import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { UserCircleMinus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AdminTab } from './components/admin-tab'
import { AssetsTab } from './components/assets-tab'
import { AttendanceTab } from './components/attendance-tab'
import { LearningTab } from './components/learning-tab'
import { LearningTeamTab } from './components/learning-team-tab'
import { MyTimelineTab } from './components/my-timeline-tab'
import { OverviewTab, type PendingTask } from './components/overview-tab'
import { TaxTab } from './components/tax-tab'
import { TimesheetTab } from './components/timesheet-tab'
import { TravelTab } from './components/travel-tab'
import { TravelTeamTab } from './components/travel-team-tab'
import { WorkTab } from './components/work-tab'
import { useAssets } from './hooks/use-assets'
import { useAttendance } from './hooks/use-attendance'
import { useLearning } from './hooks/use-learning'
import { useLearningTeam } from './hooks/use-learning-team'
import { usePortal } from './hooks/use-portal'
import { useProfile } from './hooks/use-profile'
import { useTax } from './hooks/use-tax'
import { useTimesheets } from './hooks/use-timesheets'
import { useTravel } from './hooks/use-travel'
import { useTravelTeam } from './hooks/use-travel-team'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

type SectionId =
  | 'attendance'
  | 'timesheets'
  | 'travel'
  | 'travel-team'
  | 'learning'
  | 'learning-team'
  | 'assets'
  | 'tax'
  | 'work'

const SECTION_LABEL: Record<SectionId, string> = {
  attendance: 'Attendance',
  timesheets: 'Timesheets',
  travel: 'Travel & Expenses',
  'travel-team': 'Team Travel & Trips',
  learning: 'Learning',
  'learning-team': 'Team Learning',
  assets: 'Assets',
  tax: 'Tax & Pay',
  work: 'Work & Handover',
}

/** Manager/coordinator-only review surfaces, hidden from employee roles. */
const MANAGER_SECTIONS: readonly SectionId[] = ['travel-team', 'learning-team']

/** Task-first grouping: everyday sections folded under a few plain-language tabs. */
const GROUPS: ReadonlyArray<{
  id: string
  label: string
  sections: readonly SectionId[]
}> = [
  { id: 'time', label: 'Time', sections: ['attendance', 'timesheets'] },
  { id: 'requests', label: 'Requests', sections: ['travel', 'travel-team', 'learning', 'learning-team', 'assets'] },
  { id: 'pay-work', label: 'Pay & Work', sections: ['tax', 'work'] },
]

/**
 * Employee Self-Service (ESS-01..39): responsive portal with role/policy
 * controlled sections — profile, attendance, timesheets, travel, learning,
 * assets, tax & pay, allocation/KT — plus the admin configuration surface.
 */
export function SelfService() {
  const { role } = useRole()
  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
  const isNonUser = role === 'Employee (Non-User)'

  const profile = useProfile()
  const portal = usePortal()
  const attendance = useAttendance()
  const timesheets = useTimesheets()
  const travel = useTravel()
  const travelTeam = useTravelTeam()
  const learning = useLearning()
  const learningTeam = useLearningTeam()
  const assets = useAssets()
  const tax = useTax()

  /** Segmented selector state for the Time group (attendance vs timesheets). */
  const [timeView, setTimeView] = useState<SectionId>('attendance')

  /** Cross-module pending-task rollup (ESS-39). */
  const pendingTasks = useMemo<PendingTask[]>(() => {
    const tasks: PendingTask[] = []
    travel.expenses.forEach((e) => {
      if (e.task)
        tasks.push({ id: e.id, module: 'Travel · Expenses', item: e.title, action: e.task })
    })
    learning.requests.forEach((r) => {
      if (r.task)
        tasks.push({ id: r.id, module: 'Learning', item: r.program, action: r.task })
    })
    assets.requisitions.forEach((r) => {
      if (r.task)
        tasks.push({ id: r.id, module: 'Assets · Requisitions', item: `${r.number} — ${r.asset}`, action: r.task })
    })
    assets.assignedAssets.forEach((a) => {
      if (a.task)
        tasks.push({ id: a.id, module: 'Assets · My Assets', item: a.assetName, action: a.task })
    })
    timesheets.timesheets.forEach((ts) => {
      if (ts.status === 'Pending for submission')
        tasks.push({
          id: ts.id,
          module: 'Timesheets',
          item: `Week ${ts.periodStart}`,
          action: 'Submit for approval',
        })
    })
    return tasks
  }, [travel.expenses, learning.requests, assets.requisitions, assets.assignedAssets, timesheets.timesheets])

  /** Section visibility follows the configured policy for employees (ESS-08). */
  const { policyFor } = portal
  const sectionVisible = useCallback(
    (id: string) => {
      // Manager/coordinator review surfaces are admin-only in the POC
      // (admin roles stand in for Manager and Travel Coordinator).
      if ((MANAGER_SECTIONS as readonly string[]).includes(id)) return isAdmin
      return isAdmin || (policyFor(id)?.view ?? true)
    },
    [isAdmin, policyFor]
  )

  const availableTabs = useMemo(() => {
    const tabs = ['overview', 'timeline']
    GROUPS.forEach((g) => {
      if (g.sections.some((s) => sectionVisible(s))) tabs.push(g.id)
    })
    if (isAdmin) tabs.push('admin')
    return tabs
  }, [isAdmin, sectionVisible])

  /** Employees land on their everyday overview; admins land on the admin surface. */
  const [tab, setTab] = useState(() => takeRequestedTab('/self-service') ?? (isAdmin ? 'admin' : 'overview'))

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab('overview')
  }, [availableTabs, tab])

  if (isNonUser) {
    return (
      <>
        <CommonHeader title='Self Service' className='bg-blue-150' />
        <Main fluid className='bg-neutral-200'>
          <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
            <UserCircleMinus size={32} className='text-neutral-1000' />
            <p className='text-neutral-1600 text-paragraph-md font-medium'>
              No self-service login for non-user employees
            </p>
            <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
              Your HR records are maintained on your behalf: transactions are
              performed by HR or an authorized admin. If you are converted to a
              user, you will gain role- and policy-controlled self-service
              access like other users.
            </p>
          </div>
        </Main>
      </>
    )
  }

  const tabLabel: Record<string, string> = {
    overview: 'Overview',
    timeline: 'My Timeline',
    admin: 'Admin',
    ...Object.fromEntries(GROUPS.map((g) => [g.id, g.label])),
  }

  const sectionContent: Record<SectionId, ReactNode> = {
    attendance: <AttendanceTab store={attendance} />,
    timesheets: <TimesheetTab store={timesheets} />,
    travel: <TravelTab store={travel} />,
    'travel-team': <TravelTeamTab store={travelTeam} />,
    learning: <LearningTab store={learning} />,
    'learning-team': <LearningTeamTab store={learningTeam} />,
    assets: <AssetsTab store={assets} />,
    tax: <TaxTab store={tax} />,
    work: <WorkTab />,
  }

  return (
    <>
      <CommonHeader title='Self Service' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
              {availableTabs.map((t) => (
                <TabsTrigger key={t} variant='primary' value={t}>
                  {tabLabel[t]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='overview'>
              <OverviewTab
                profile={profile}
                portal={portal}
                pendingTasks={pendingTasks}
              />
            </TabsContent>

            <TabsContent value='timeline'>
              <MyTimelineTab />
            </TabsContent>

            {GROUPS.map((group) => {
              const visibleSections = group.sections.filter((s) =>
                sectionVisible(s)
              )
              if (visibleSections.length === 0) return null
              if (visibleSections.length === 1) {
                return (
                  <TabsContent key={group.id} value={group.id}>
                    {sectionContent[visibleSections[0]]}
                  </TabsContent>
                )
              }

              // Time group: attendance and timesheets filter the same time-tracking
              // data type — use a segmented selector (Option B).
              if (group.id === 'time') {
                const effectiveView = visibleSections.includes(timeView)
                  ? timeView
                  : visibleSections[0]
                return (
                  <TabsContent key={group.id} value={group.id}>
                    <div className='mb-4 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 w-fit'>
                      {visibleSections.map((s) => (
                        <button
                          key={s}
                          onClick={() => setTimeView(s)}
                          className={
                            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' +
                            (effectiveView === s
                              ? 'bg-white text-blue-1200 shadow-sm'
                              : 'text-neutral-1000 hover:text-neutral-1400')
                          }
                        >
                          {SECTION_LABEL[s]}
                        </button>
                      ))}
                    </div>
                    {sectionContent[effectiveView]}
                  </TabsContent>
                )
              }

              // Requests and Pay & Work groups hold genuinely different section
              // types — render each as a labelled section (Option A).
              return (
                <TabsContent key={group.id} value={group.id}>
                  <div className='flex flex-col gap-6'>
                    {visibleSections.map((s) => (
                      <section key={s}>
                        <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                          {SECTION_LABEL[s]}
                        </h3>
                        {sectionContent[s]}
                      </section>
                    ))}
                  </div>
                </TabsContent>
              )
            })}

            {isAdmin && (
              <TabsContent value='admin'>
                <AdminTab profile={profile} portal={portal} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
