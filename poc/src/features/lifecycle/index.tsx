import { useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { AuditTab } from './components/audit-tab'
import { ConfigTab } from './components/config-tab'
import { DisciplinaryTab } from './components/disciplinary-tab'
import { ExitsTab } from './components/exits-tab'
import { KnowledgeTransferTab } from './components/kt-tasks-tab'
import { LayoffsTab } from './components/layoffs-tab'
import { LifecycleSummary } from './components/lifecycle-summary'
import { MyLifecycleTab } from './components/my-lifecycle-tab'
import { OnboardingTab } from './components/onboarding-tab'
import { OrientationTab } from './components/orientation-tab'
import { PerformanceReviewSetup } from './components/performance-review-setup'
import { PerformanceReviewTab } from './components/performance-review-tab'
import { PlatformTab } from './components/platform-tab'
import { ProbationTab } from './components/probation-tab'
import { ReassignmentTab } from './components/reassignment-tab'
import { TransfersTab } from './components/transfers-tab'
import { PERSONAS } from './data/shared'
import { useDisciplinary } from './hooks/use-disciplinary'
import { useExits } from './hooks/use-exits'
import { useKnowledgeTransfer } from './hooks/use-knowledge-transfer'
import { useLayoffs } from './hooks/use-layoffs'
import { useLifecycleConfig } from './hooks/use-lifecycle-config'
import { useLifecycleLog, type LogInput } from './hooks/use-lifecycle-log'
import { useOnboarding } from './hooks/use-onboarding'
import { useOrientation } from './hooks/use-orientation'
import { usePerformanceReview } from './hooks/use-performance-review'
import { useProbation } from './hooks/use-probation'
import { useTransfers } from './hooks/use-transfers'

interface TabDef {
  value: string
  label: string
}

export function Lifecycle() {
  const { role } = useRole()
  const lifecycleLog = useLifecycleLog()

  const log = useCallback(
    (input: Omit<LogInput, 'actor' | 'actorRole'>) =>
      lifecycleLog.logEvent({
        ...input,
        actor: PERSONAS[role] ?? role,
        actorRole: role,
      }),
    [lifecycleLog, role]
  )
  const notify = lifecycleLog.notify

  const config = useLifecycleConfig(log)
  const onboarding = useOnboarding({
    log,
    notify,
    templateVersion: config.publishedTemplate.version,
  })
  const transfers = useTransfers({ log })
  const exits = useExits({
    log,
    notify,
    noticeRules: config.noticeRules.items,
    clearanceChains: config.clearanceChains.items,
    exitQuestions: config.exitQuestions.items,
    exitTaskDefs: config.exitTaskDefs.items,
    questionnaireEnabled: config.settings.exitQuestionnaireEnabled,
  })
  const probation = useProbation({
    log,
    notify,
    onSeparation: (c) =>
      exits.addExit({
        employeeName: c.employeeName,
        employeeCode: c.employeeCode,
        department: c.department,
        location: 'Bengaluru',
        positionLevel: c.positionLevel,
        exitType: 'Probation Separation',
        reason: 'Probation outcome: Initiate Separation.',
        raisedBy: 'Admin (proxy)',
      }),
  })
  const disciplinary = useDisciplinary({
    log,
    notify,
    approverGroups: config.disciplinaryApprovers.items,
    // Exit Coordinator handoff: approved Suspension/Termination cases (and
    // counselling closed with a Termination outcome) open an exit case.
    onExitReferral: (c, process) =>
      exits.addExit({
        employeeName: c.employeeName,
        employeeCode: c.employeeCode,
        department: c.department,
        location: c.location,
        positionLevel: 'L2 - Senior',
        exitType: process,
        reason: `Disciplinary referral (${c.id}): ${c.reason}`,
        raisedBy: 'Admin (proxy)',
      }),
  })
  const layoffs = useLayoffs({
    log,
    notify,
    layoffConfig: config.exitTypes.items.find((t) => t.name === 'Layoff'),
    // Recording exits on an approved batch opens a Layoff exit case per
    // employee — clearance/finalization continue on the Exits tab.
    onExit: (emp, batch) =>
      exits.addExit({
        employeeName: emp.name,
        employeeCode: emp.code,
        department: emp.department,
        location: emp.location,
        positionLevel: emp.positionLevel,
        exitType: 'Layoff',
        reason: `Layoff batch ${batch.name} (${batch.id}): ${batch.reason}`,
        raisedBy: 'Admin (proxy)',
      }),
  })
  const orientation = useOrientation({ log, notify })
  const knowledgeTransfer = useKnowledgeTransfer({ log })
  const performance = usePerformanceReview({ log })

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isCompanyAdmin = role === 'Company Admin'
  const isGroupAdmin = role === 'Group Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee)
      return [
        { value: 'my', label: 'My Lifecycle' },
        { value: 'kt', label: 'Knowledge Transfer' },
      ]
    if (isPlatformAdmin)
      return [
        { value: 'config', label: 'Settings' },
        { value: 'platform', label: 'Data & History' },
        { value: 'audit', label: 'Audit & Reports' },
      ]
    if (isGroupAdmin)
      return [
        { value: 'transfers', label: 'Transfers' },
        { value: 'admin', label: 'Admin' },
      ]
    if (isCompanyAdmin) {
      const list: TabDef[] = [
        { value: 'onboarding', label: 'Onboarding' },
      ]
      if (config.settings.confirmationModuleEnabled)
        list.push({ value: 'probation', label: 'Probation' })
      list.push(
        { value: 'transfers', label: 'Transfers' },
        { value: 'exits', label: 'Exits' },
        { value: 'layoffs', label: 'Layoffs' },
        { value: 'kt', label: 'Knowledge Transfer' },
        { value: 'reassignment', label: 'Reassignment' },
        { value: 'disciplinary', label: 'Disciplinary' },
        { value: 'admin', label: 'Admin' },
      )
      return list
    }
    return [{ value: 'audit', label: 'Audit & Reports' }]
  }, [
    config.settings.confirmationModuleEnabled,
    isCompanyAdmin,
    isEmployee,
    isGroupAdmin,
    isPlatformAdmin,
  ])

  const summaryItems = useMemo(
    () => [
      {
        label: 'Still onboarding',
        value: onboarding.cases.filter((c) => c.status === 'in-progress').length,
      },
      {
        label: 'Probation reviews open',
        value: probation.cases.filter(
          (c) =>
            c.status === 'pending' ||
            c.status === 'in-review' ||
            c.status === 'pending-approval'
        ).length,
      },
      {
        label: 'Transfers in flight',
        value: transfers.transfers.filter(
          (t) => t.status === 'pending-approval' || t.status === 'scheduled'
        ).length,
      },
      {
        label: 'Exits in progress',
        value: exits.exits.filter(
          (e) =>
            e.status === 'pending-approval' ||
            e.status === 'approved' ||
            e.status === 'clearance-in-progress'
        ).length,
      },
    ],
    [exits.exits, onboarding.cases, probation.cases, transfers.transfers]
  )

  return (
    <>
      <CommonHeader title='Employee Lifecycle' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {!isEmployee && <LifecycleSummary items={summaryItems} />}

          <Tabs key={role} defaultValue={takeRequestedTab('/lifecycle') ?? tabs[0].value} className='w-full'>
            <TabsList className='mb-2 flex-wrap bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Company Admin flat tabs ─────────────────────────────── */}
            {isCompanyAdmin && (
              <>
                <TabsContent value='onboarding'>
                  <OnboardingTab
                    store={onboarding}
                    templateVersion={config.publishedTemplate.version}
                  />
                </TabsContent>

                {config.settings.confirmationModuleEnabled && (
                  <TabsContent value='probation'>
                    <ProbationTab
                      store={probation}
                      decisionTable={config.decisionTable}
                    />
                  </TabsContent>
                )}

                {/* Exits shows only exit cases — KT tasks live on their own tab */}
                <TabsContent value='exits'>
                  <ExitsTab
                    store={exits}
                    exitTypes={config.exitTypes.items}
                    exitManagementEnabled={config.settings.exitManagementEnabled}
                  />
                </TabsContent>

                <TabsContent value='layoffs'>
                  <LayoffsTab store={layoffs} />
                </TabsContent>

                <TabsContent value='kt'>
                  <KnowledgeTransferTab store={knowledgeTransfer} />
                </TabsContent>

                <TabsContent value='reassignment'>
                  <ReassignmentTab />
                </TabsContent>

                <TabsContent value='disciplinary'>
                  <DisciplinaryTab store={disciplinary} />
                </TabsContent>

                {/* Admin tab: all config/setup surfaces as vertical sections */}
                <TabsContent value='admin'>
                  <div className='flex flex-col gap-8'>
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Orientation
                      </h3>
                      <OrientationTab store={orientation} />
                    </section>

                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Performance Reviews
                      </h3>
                      <PerformanceReviewTab store={performance} />
                    </section>

                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Performance Review Setup
                      </h3>
                      <PerformanceReviewSetup store={performance} />
                    </section>

                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Lifecycle Settings
                      </h3>
                      <ConfigTab config={config} kt={knowledgeTransfer} />
                    </section>

                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Audit & Reports
                      </h3>
                      <AuditTab log={lifecycleLog} />
                    </section>
                  </div>
                </TabsContent>
              </>
            )}

            {/* ── Shared Transfers tab ───────────────────────────────── */}
            {(isCompanyAdmin || isGroupAdmin) && (
              <TabsContent value='transfers'>
                <TransfersTab store={transfers} />
              </TabsContent>
            )}

            {/* ── Group Admin: oversight admin tab ──────────────────── */}
            {isGroupAdmin && (
              <TabsContent value='admin'>
                <div className='flex flex-col gap-8'>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                      Engine Features
                    </h3>
                    <EngineArtifactsPanel module='Employee Lifecycle' />
                  </section>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                      Audit & Reports
                    </h3>
                    <AuditTab log={lifecycleLog} />
                  </section>
                </div>
              </TabsContent>
            )}

            {/* ── Platform Admin tabs ────────────────────────────────── */}
            {isPlatformAdmin && (
              <>
                <TabsContent value='platform'>
                  <PlatformTab transfers={transfers} />
                </TabsContent>
                <TabsContent value='config'>
                  <ConfigTab config={config} kt={knowledgeTransfer} />
                </TabsContent>
              </>
            )}

            {!isEmployee && !isCompanyAdmin && !isGroupAdmin && (
              <TabsContent value='audit'>
                <AuditTab log={lifecycleLog} />
              </TabsContent>
            )}

            {/* ── Employee tabs ──────────────────────────────────────── */}
            {isEmployee && (
              <>
                <TabsContent value='my'>
                  <MyLifecycleTab
                    onboarding={onboarding}
                    exits={exits}
                    probation={probation}
                    log={lifecycleLog}
                    exitTypes={config.exitTypes.items}
                  />
                </TabsContent>
                <TabsContent value='kt'>
                  <KnowledgeTransferTab store={knowledgeTransfer} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
