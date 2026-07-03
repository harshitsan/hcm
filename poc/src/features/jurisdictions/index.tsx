import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { ApplicabilityTab } from './components/applicability-tab'
import { AssignmentsTab } from './components/assignments-tab'
import { CatalogTab } from './components/catalog-tab'
import { JurisdictionsSummary } from './components/jurisdictions-summary'
import { PoliciesTab } from './components/policies-tab'
import { RulePacksTab } from './components/rule-packs-tab'
import { useAssignments } from './hooks/use-assignments'
import { useJurisdictions } from './hooks/use-jurisdictions'
import { useRulePacks } from './hooks/use-rule-packs'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/**
 * Jurisdictions (FR 6.4.1–6.4.3): the governed catalog of operational
 * regions, company assignments, policy applicability criteria, versioned
 * rule-packs for the engines, and per-employee applicability resolution.
 */
export function Jurisdictions() {
  const { role } = useRole()
  const jurisdictionsStore = useJurisdictions()
  const assignmentsStore = useAssignments()
  const rulePacksStore = useRulePacks()

  const isAdmin = ADMIN_ROLES.includes(role)
  const [tab, setTab] = useState(isAdmin ? 'catalog' : 'applicability')

  // Employees only have the "What applies to me" surface; snap them to it.
  useEffect(() => {
    if (!isAdmin && tab !== 'applicability') setTab('applicability')
  }, [isAdmin, tab])

  return (
    <>
      <CommonHeader title='Jurisdictions' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isAdmin && (
            <JurisdictionsSummary
              jurisdictions={jurisdictionsStore.jurisdictions}
              companies={assignmentsStore.companies}
            />
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className='mb-2'>
              <TabsTrigger value='applicability'>
                What applies to me
              </TabsTrigger>
              {isAdmin && <TabsTrigger value='catalog'>Regions</TabsTrigger>}
              {isAdmin && (
                <TabsTrigger value='assignments'>
                  Company Assignments
                </TabsTrigger>
              )}
              {isAdmin && <TabsTrigger value='admin'>Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value='applicability'>
              <ApplicabilityTab
                store={assignmentsStore}
                catalog={jurisdictionsStore.jurisdictions}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value='catalog'>
                <CatalogTab
                  store={jurisdictionsStore}
                  companies={assignmentsStore.companies}
                  policies={assignmentsStore.policies}
                />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value='assignments'>
                <AssignmentsTab
                  store={assignmentsStore}
                  catalog={jurisdictionsStore.jurisdictions}
                />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value='admin'>
                <Tabs defaultValue='policies'>
                  <TabsList className='mb-2'>
                    <TabsTrigger value='policies'>Policies</TabsTrigger>
                    <TabsTrigger value='rules'>Rules</TabsTrigger>
                  </TabsList>

                  <TabsContent value='policies'>
                    <PoliciesTab
                      store={assignmentsStore}
                      catalog={jurisdictionsStore.jurisdictions}
                    />
                  </TabsContent>

                  <TabsContent value='rules'>
                    <RulePacksTab
                      store={rulePacksStore}
                      assignments={assignmentsStore}
                      catalog={jurisdictionsStore.jurisdictions}
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
