import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { DefinitionsTab } from './components/definitions-tab'
import { FieldsSummary } from './components/fields-summary'
import { GovernanceTab } from './components/governance-tab'
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
  const [tab, setTab] = useState(() => takeRequestedTab('/custom-fields') ?? (isAdmin ? 'admin' : 'records'))

  // Employees have no admin surface; snap to their tabs.
  useEffect(() => {
    if (!isAdmin && tab === 'admin') setTab('records')
  }, [isAdmin, tab])

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
                records={recordStore.records}
                conditionsStore={conditionsStore}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value='admin'>
                <div className='flex flex-col gap-8'>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Engine Features</h3>
                    <EngineArtifactsPanel module='Custom Fields' />
                  </section>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Manage Fields</h3>
                    <DefinitionsTab store={fieldStore} />
                  </section>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>History</h3>
                    <GovernanceTab
                      fields={fieldStore.fields}
                      versions={fieldStore.versions}
                      valueHistory={recordStore.valueHistory}
                    />
                  </section>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
