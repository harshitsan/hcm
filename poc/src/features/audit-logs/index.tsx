import { useMemo } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AuditSummary } from './components/audit-summary'
import { AuditTrailTab } from './components/audit-trail-tab'
import { GovernanceTab } from './components/governance-tab'
import { RecordHistoryTab } from './components/record-history-tab'
import { RetentionTab } from './components/retention-tab'
import { scopeEntries } from './data/audit-entries'
import { useAuditConfig } from './hooks/use-audit-config'
import { useAuditLog } from './hooks/use-audit-log'

/**
 * Audit & Logging (FR 6.29): tamper-resistant audit trail over the mandatory
 * Company/Employee entities, the record-level change-history utility,
 * retention/archival governance and role-based audit access — all scoped by
 * the active role's tenant boundary.
 */
export function AuditLogs() {
  const { role, hasRole } = useRole()
  const {
    entries,
    securityEvents,
    simulateCommittedChange,
    simulateRolledBackChange,
    recordSecurityEvent,
    runArchivalSweep,
    disposeExpired,
  } = useAuditLog()
  const {
    policyVersions,
    currentPolicy,
    savePolicy,
    scopeEntities,
    toggleEntityEnabled,
    toggleScopeField,
    accessConfig,
    toggleAccess,
    canView,
  } = useAuditConfig()

  /** RBAC + tenant boundary applied before anything renders (FR 6.29.5). */
  const scoped = useMemo(() => scopeEntries(entries, role), [entries, role])

  /**
   * Retention and governance are Platform Admin surfaces (both self-gate to
   * that role) — folded into a single Admin tab, hidden for everyone else.
   */
  const isPlatformAdmin = hasRole('Platform Admin')

  return (
    <>
      <CommonHeader title='Audit & Logging' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <AuditSummary
            entries={scoped}
            securityEvents={securityEvents}
            policy={currentPolicy}
          />

          <Tabs key={role} defaultValue='trail' className='w-full'>
            <TabsList className='mb-2'>
              <TabsTrigger value='trail' variant='primary'>
                Audit Trail
              </TabsTrigger>
              <TabsTrigger value='history' variant='primary'>
                Record History
              </TabsTrigger>
              {isPlatformAdmin && (
                <TabsTrigger value='admin' variant='primary'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='trail'>
              <AuditTrailTab
                entries={scoped}
                securityEvents={securityEvents}
                allowed={canView(role, 'canViewAuditTrail')}
                onSimulateCommitted={simulateCommittedChange}
                onSimulateRolledBack={simulateRolledBackChange}
                onSecurityEvent={recordSecurityEvent}
              />
            </TabsContent>

            <TabsContent value='history'>
              <RecordHistoryTab
                entries={scoped}
                allowed={canView(role, 'canViewRecordHistory')}
              />
            </TabsContent>

            {isPlatformAdmin && (
              <TabsContent value='admin'>
                <Tabs defaultValue='retention' className='w-full'>
                  <TabsList className='mb-2'>
                    <TabsTrigger value='retention' variant='primary'>
                      Data Retention
                    </TabsTrigger>
                    <TabsTrigger value='access' variant='primary'>
                      Scope &amp; Access
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='retention'>
                    <RetentionTab
                      entries={entries}
                      policyVersions={policyVersions}
                      currentPolicy={currentPolicy}
                      onSavePolicy={savePolicy}
                      onRunArchival={() =>
                        runArchivalSweep(currentPolicy.activeMonths)
                      }
                      onDisposeExpired={() =>
                        disposeExpired(currentPolicy.totalYears)
                      }
                    />
                  </TabsContent>

                  <TabsContent value='access'>
                    <GovernanceTab
                      scopeEntities={scopeEntities}
                      onToggleEntity={toggleEntityEnabled}
                      onToggleField={toggleScopeField}
                      accessConfig={accessConfig}
                      onToggleAccess={toggleAccess}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
