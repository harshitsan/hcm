import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CURRENT_COMPANY_ID } from '../data/departments'
import { type DepartmentConfigStore } from '../hooks/use-department-config'
import { type DepartmentsStore } from '../hooks/use-departments'
import { CustomFieldsPanel } from './config/custom-fields-panel'
import { QuestionsNotificationsPanel } from './config/questions-notifications-panel'
import { RulesPanel } from './config/rules-panel'
import { SetupStepper } from './config/setup-stepper'

interface ConfigTabProps {
  store: DepartmentsStore
  config: DepartmentConfigStore
}

/**
 * Governed configuration surface (L2): guided setup, UDF schema, approver
 * graphs / decision tables, interview-question scoping and notification
 * templates — all tenant-scoped and versioned.
 */
export function ConfigTab({ store, config }: ConfigTabProps) {
  const companyDepts = useMemo(
    () => store.departments.filter((d) => d.companyId === CURRENT_COMPANY_ID),
    [store.departments]
  )

  return (
    <Tabs defaultValue='setup' className='w-full'>
      <TabsList className='bg-transparent p-0'>
        <TabsTrigger variant='ghost' value='setup'>
          Guided setup
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='fields'>
          Custom fields
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='rules'>
          Routing & policy rules
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='questions'>
          Questions & notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value='setup'>
        <SetupStepper config={config} />
      </TabsContent>
      <TabsContent value='fields'>
        <CustomFieldsPanel config={config} />
      </TabsContent>
      <TabsContent value='rules'>
        <RulesPanel config={config} departments={companyDepts} />
      </TabsContent>
      <TabsContent value='questions'>
        <QuestionsNotificationsPanel config={config} departments={companyDepts} />
      </TabsContent>
    </Tabs>
  )
}
