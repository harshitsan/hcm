import { useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { AuditTab } from './components/audit-tab'
import { ConfigTab } from './components/config-tab'
import { DisciplinaryTab } from './components/disciplinary-tab'
import { ExitsTab } from './components/exits-tab'
import { KtConfig } from './components/kt-config'
import { KtTasksTab } from './components/kt-tasks-tab'
import { MyKnowledgeTransferTab } from './components/kt-my-tab'
import { LifecycleSummary } from './components/lifecycle-summary'
import { MyLifecycleTab } from './components/my-lifecycle-tab'
import { OnboardingTab } from './components/onboarding-tab'
import { PerformanceReviewSetup } from './components/performance-review-setup'
import { PerformanceReviewTab } from './components/performance-review-tab'
import { OrientationTab } from './components/orientation-tab'
import { PlatformTab } from './components/platform-tab'
import { ProbationTab } from './components/probation-tab'
import { TransfersTab } from './components/transfers-tab'
import { PERSONAS } from './data/shared'
import { useDisciplinary } from './hooks/use-disciplinary'
import { useExits } from './hooks/use-exits'
import { useKnowledgeTransfer } from './hooks/use-knowledge-transfer'
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

/**
 * Employee Lifecycle module — onboarding, probation confirmation, transfers,
 * exits and disciplinary actions, driven by governed configuration with an
 * immutable audit trail. Visible tabs vary with the active role.
 */
export function Lifecycle() {
  const { role } = useRole()
  const lifecycleLog = useLifecycleLog()

  // Stamp every audit event with the acting persona + role.
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
    // “Initiate Separation” follow-through opens the exit workflow.
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
        {
          value: 'onboarding',
          label: config.settings.confirmationModuleEnabled
            ? 'Onboarding & Probation'
            : 'Onboarding',
        },
        { value: 'transfers', label: 'Transfers' },
        { value: 'exits', label: 'Exits' },
        { value: 'orientation', label: 'Orientation' },
        { value: 'disciplinary', label: 'Disciplinary' },
        { value: 'admin', label: 'Admin' },
      ]
      return list
    }
    // Portfolio Admin: reporting oversight only.
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

          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue={tabs[0].value} className='w-full'>
            <TabsList className='mb-2'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {isCompanyAdmin && (
              <>
                <TabsContent value='onboarding'>
                  <Tabs defaultValue='onboarding' className='w-full'>
                    <TabsList className='mb-2'>
                      <TabsTrigger variant='ghost' value='onboarding'>
                        Onboarding
                      </TabsTrigger>
                      {config.settings.confirmationModuleEnabled && (
                        <TabsTrigger variant='ghost' value='probation'>
                          Probation & Confirmation
                        </TabsTrigger>
                      )}
                      <TabsTrigger variant='ghost' value='performance'>
                        Performance Review
                      </TabsTrigger>
                    </TabsList>
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
                    <TabsContent value='performance'>
                      <PerformanceReviewTab store={performance} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                <TabsContent value='exits'>
                  <Tabs defaultValue='cases' className='w-full'>
                    <TabsList className='mb-2'>
                      <TabsTrigger variant='ghost' value='cases'>
                        Exit Cases
                      </TabsTrigger>
                      <TabsTrigger variant='ghost' value='kt-tasks'>
                        KT Tasks
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value='cases'>
                      <ExitsTab
                        store={exits}
                        exitTypes={config.exitTypes.items}
                        exitManagementEnabled={
                          config.settings.exitManagementEnabled
                        }
                      />
                    </TabsContent>
                    <TabsContent value='kt-tasks'>
                      <KtTasksTab store={knowledgeTransfer} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                <TabsContent value='orientation'>
                  <OrientationTab store={orientation} />
                </TabsContent>
                <TabsContent value='disciplinary'>
                  <DisciplinaryTab store={disciplinary} />
                </TabsContent>
              </>
            )}

            {(isCompanyAdmin || isGroupAdmin) && (
              <TabsContent value='transfers'>
                <TransfersTab store={transfers} />
              </TabsContent>
            )}

            {isPlatformAdmin && (
              <TabsContent value='platform'>
                <PlatformTab transfers={transfers} />
              </TabsContent>
            )}

            {isPlatformAdmin && (
              <TabsContent value='config'>
                <ConfigTab config={config} />
              </TabsContent>
            )}

            {/* Company / Group admins reach settings and the audit log
                through a single Admin tab; other roles keep audit top-level. */}
            {(isCompanyAdmin || isGroupAdmin) && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Employee Lifecycle' />
                <Tabs defaultValue='settings' className='w-full'>
                  <TabsList className='mb-2'>
                    <TabsTrigger variant='ghost' value='settings'>
                      Settings
                    </TabsTrigger>
                    <TabsTrigger variant='ghost' value='kt-setup'>
                      Knowledge Transfer
                    </TabsTrigger>
                    <TabsTrigger variant='ghost' value='performance-setup'>
                      Performance Review
                    </TabsTrigger>
                    <TabsTrigger variant='ghost' value='audit'>
                      Audit & Reports
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value='settings'>
                    <ConfigTab config={config} />
                  </TabsContent>
                  <TabsContent value='kt-setup'>
                    <KtConfig store={knowledgeTransfer} />
                  </TabsContent>
                  <TabsContent value='performance-setup'>
                    <PerformanceReviewSetup store={performance} />
                  </TabsContent>
                  <TabsContent value='audit'>
                    <AuditTab log={lifecycleLog} />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}

            {!isEmployee && !isCompanyAdmin && !isGroupAdmin && (
              <TabsContent value='audit'>
                <AuditTab log={lifecycleLog} />
              </TabsContent>
            )}

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
                  <MyKnowledgeTransferTab store={knowledgeTransfer} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
