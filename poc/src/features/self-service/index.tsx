import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserCircleMinus } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AdminTab } from './components/admin-tab'
import { AssetsTab } from './components/assets-tab'
import { AttendanceTab } from './components/attendance-tab'
import { LearningTab } from './components/learning-tab'
import { OverviewTab, type PendingTask } from './components/overview-tab'
import { TaxTab } from './components/tax-tab'
import { TimesheetTab } from './components/timesheet-tab'
import { TravelTab } from './components/travel-tab'
import { WorkTab } from './components/work-tab'
import { useAssets } from './hooks/use-assets'
import { useAttendance } from './hooks/use-attendance'
import { useLearning } from './hooks/use-learning'
import { usePortal } from './hooks/use-portal'
import { useProfile } from './hooks/use-profile'
import { useTax } from './hooks/use-tax'
import { useTimesheets } from './hooks/use-timesheets'
import { useTravel } from './hooks/use-travel'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

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
  const learning = useLearning()
  const assets = useAssets()
  const tax = useTax()

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
    (id: string) => isAdmin || (policyFor(id)?.view ?? true),
    [isAdmin, policyFor]
  )

  const availableTabs = useMemo(() => {
    const tabs = ['overview']
    const sections = [
      'attendance',
      'timesheets',
      'travel',
      'learning',
      'assets',
      'tax',
      'work',
    ]
    sections.forEach((s) => {
      if (sectionVisible(s)) tabs.push(s)
    })
    if (isAdmin) tabs.push('admin')
    return tabs
  }, [isAdmin, sectionVisible])

  const [tab, setTab] = useState('overview')

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
    attendance: 'Attendance',
    timesheets: 'Timesheets',
    travel: 'Travel & Expenses',
    learning: 'Learning',
    assets: 'Assets',
    tax: 'Tax & Pay',
    work: 'Allocation & KT',
    admin: 'Administration',
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
            {sectionVisible('attendance') && (
              <TabsContent value='attendance'>
                <AttendanceTab store={attendance} />
              </TabsContent>
            )}
            {sectionVisible('timesheets') && (
              <TabsContent value='timesheets'>
                <TimesheetTab store={timesheets} />
              </TabsContent>
            )}
            {sectionVisible('travel') && (
              <TabsContent value='travel'>
                <TravelTab store={travel} />
              </TabsContent>
            )}
            {sectionVisible('learning') && (
              <TabsContent value='learning'>
                <LearningTab store={learning} />
              </TabsContent>
            )}
            {sectionVisible('assets') && (
              <TabsContent value='assets'>
                <AssetsTab store={assets} />
              </TabsContent>
            )}
            {sectionVisible('tax') && (
              <TabsContent value='tax'>
                <TaxTab store={tax} />
              </TabsContent>
            )}
            {sectionVisible('work') && (
              <TabsContent value='work'>
                <WorkTab />
              </TabsContent>
            )}
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
