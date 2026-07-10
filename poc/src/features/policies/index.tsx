import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { ApplicabilityTab } from './components/applicability-tab'
import { CatalogTab } from './components/catalog-tab'
import { GovernanceTab } from './components/governance-tab'
import { LibraryTab } from './components/library-tab'
import { PoliciesSummary } from './components/policies-summary'
import { usePolicies } from './hooks/use-policies'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/**
 * Policy Management (FR 6.10.1–6.10.4): the governed catalog of HR and
 * business policy documents with versioning, effective dating, scoped
 * applicability and exclusions; the rules-engine applicability resolver; the
 * employee self-service policy library; and platform governance (role
 * permissions, module integration, notifications, audit).
 */
export function Policies() {
  const { role } = useRole()
  const store = usePolicies()

  const isAdmin = ADMIN_ROLES.includes(role)
  const [tab, setTab] = useState(isAdmin ? 'documents' : 'library')

  // Employee roles only have the self-service library; snap them to it.
  useEffect(() => {
    if (!isAdmin && tab !== 'library') setTab('library')
  }, [isAdmin, tab])

  return (
    <>
      <CommonHeader title='Policy Management' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isAdmin && <PoliciesSummary policies={store.policies} />}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className='mb-2'>
              <TabsTrigger value='library'>Policy Library</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value='documents'>All Policies</TabsTrigger>
              )}
              {isAdmin && <TabsTrigger value='admin'>Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value='library'>
              <LibraryTab store={store} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value='documents'>
                <CatalogTab store={store} />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Policy Management' />
                <div className='flex flex-col gap-6'>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Who policies apply to</h3>
                    <ApplicabilityTab store={store} />
                  </section>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Permissions & audit</h3>
                    <GovernanceTab store={store} />
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
