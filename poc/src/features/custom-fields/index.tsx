import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { DefinitionsTab } from './components/definitions-tab'
import { FieldsSummary } from './components/fields-summary'
import { GovernanceTab, HistoryTab } from './components/governance-tab'
import { IntegrationTab } from './components/integration-tab'
import { RecordsTab } from './components/records-tab'
import { useFieldDefinitions } from './hooks/use-custom-fields'
import { useEntityRecords } from './hooks/use-entity-records'
import { useWorkflowConditions } from './hooks/use-workflow-conditions'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/** Roles that see the oversight/tenant-isolation Governance sub-tab. */
const GOVERNANCE_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
]

/**
 * Custom Fields (Data Model Extensibility): manage user-defined fields on the
 * six supported entities, see them rendered generically on records, use them
 * in search/export/workflows/APIs, and govern versions + tenant isolation.
 */
export function CustomFields() {
  const { role } = useRole()
  const fieldStore = useFieldDefinitions()
  const recordStore = useEntityRecords()
  const conditionsStore = useWorkflowConditions()

  const isAdmin = ADMIN_ROLES.includes(role)
  const canGovern = GOVERNANCE_ROLES.includes(role)

  // One-shot cross-module deep-link: 'admin' targets the engine catalog.
  const [requested] = useState(() => takeRequestedTab('/custom-fields'))
  const [tab, setTab] = useState(requested ?? (isAdmin ? 'admin' : 'records'))
  const [adminTab, setAdminTab] = useState(
    requested === 'admin' ? 'engine' : 'fields'
  )

  // Employees have no admin surface; snap to their tabs.
  useEffect(() => {
    if (!isAdmin && tab === 'admin') setTab('records')
  }, [isAdmin, tab])

  // Governance sub-tab is oversight-only; snap Company Admins off it.
  useEffect(() => {
    if (!canGovern && adminTab === 'governance') setAdminTab('fields')
  }, [canGovern, adminTab])

  return (
    <>
      <CommonHeader title='Custom Fields' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <FieldsSummary fields={fieldStore.fields} />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className='mb-2'>
              <TabsTrigger value='records'>Records & Forms</TabsTrigger>
              <TabsTrigger value='integration'>Data & Automation</TabsTrigger>
              {isAdmin && <TabsTrigger value='admin'>Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value='records'>
              <RecordsTab fields={fieldStore.fields} store={recordStore} />
            </TabsContent>

            <TabsContent value='integration'>
              <IntegrationTab
                fields={fieldStore.fields}
                recordsStore={recordStore}
                conditionsStore={conditionsStore}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value='admin'>
                {/* Progressive disclosure: the former single-scroll admin
                    stack is split into sub-tabs (UX #16 / worklist #43). */}
                <Tabs value={adminTab} onValueChange={setAdminTab}>
                  <TabsList className='mb-2 flex-wrap'>
                    <TabsTrigger value='fields'>Manage Fields</TabsTrigger>
                    <TabsTrigger value='history'>History</TabsTrigger>
                    {canGovern && (
                      <TabsTrigger value='governance'>Governance</TabsTrigger>
                    )}
                    <TabsTrigger value='engine'>Engine Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value='fields'>
                    <DefinitionsTab store={fieldStore} />
                  </TabsContent>

                  <TabsContent value='history'>
                    <HistoryTab
                      fields={fieldStore.fields}
                      versions={fieldStore.versions}
                      valueHistory={recordStore.valueHistory}
                    />
                  </TabsContent>

                  {canGovern && (
                    <TabsContent value='governance'>
                      <GovernanceTab fields={fieldStore.fields} />
                    </TabsContent>
                  )}

                  <TabsContent value='engine'>
                    <EngineArtifactsPanel module='Custom Fields' />
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
