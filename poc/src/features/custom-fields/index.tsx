import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
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
  const [tab, setTab] = useState(isAdmin ? 'definitions' : 'records')

  // Employees have no definition/governance surface; snap to their tabs.
  useEffect(() => {
    if (!isAdmin && (tab === 'definitions' || tab === 'governance'))
      setTab('records')
  }, [isAdmin, tab])

  return (
    <>
      <CommonHeader title='Custom Fields' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <FieldsSummary fields={fieldStore.fields} />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className='mb-2'>
              {isAdmin && (
                <TabsTrigger value='definitions'>Field Definitions</TabsTrigger>
              )}
              <TabsTrigger value='records'>Records & Forms</TabsTrigger>
              <TabsTrigger value='integration'>Data & Automation</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value='governance'>
                  Governance & History
                </TabsTrigger>
              )}
            </TabsList>

            {isAdmin && (
              <TabsContent value='definitions'>
                <DefinitionsTab store={fieldStore} />
              </TabsContent>
            )}

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
              <TabsContent value='governance'>
                <GovernanceTab
                  fields={fieldStore.fields}
                  versions={fieldStore.versions}
                  valueHistory={recordStore.valueHistory}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
