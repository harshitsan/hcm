import { useEffect, useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { CertificatesTab } from './components/certificates-tab'
import { ConfigTab } from './components/config-tab'
import { CustodiansTab } from './components/custodians-tab'
import { DocumentsTab } from './components/documents-tab'
import { MyDocumentsTab } from './components/my-documents-tab'
import { PoliciesTab } from './components/policies-tab'
import { TypesTab } from './components/types-tab'
import { useDocumentSettings } from './hooks/use-document-settings'
import { useDocuments } from './hooks/use-documents'
import { useMasters } from './hooks/use-masters'

/**
 * Documents & Attachments module. One page, role-aware tabs (task-first):
 * - Documents: tenant/group/portfolio-scoped grid with upload, expiry
 *   tracking, category filters, and role-gated actions
 * - My Documents: employee self-service view/upload on own record
 * - Policies: policy documents with effective windows and applicability
 * - Admin: single admin surface with nested tabs for document types,
 *   required certificates, custodians, and settings (governed taxonomy,
 *   access matrix, upload policy, notifications, security posture)
 */
export function Documents() {
  const { role } = useRole()
  const store = useDocuments()
  const settings = useDocumentSettings()
  const masters = useMasters()

  const isAdmin =
    role === 'Platform Admin' ||
    role === 'Portfolio Admin' ||
    role === 'Group Company Admin' ||
    role === 'Company Admin'
  const isCompanyAdmin = role === 'Company Admin'
  const isEmployeeUser = role === 'Employee (User)'
  const showCustodians = isCompanyAdmin || role === 'Group Company Admin'
  const showConfig = isCompanyAdmin || role === 'Platform Admin'
  const showAdminTab = isCompanyAdmin || showCustodians || showConfig

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isEmployeeUser) tabs.push('mine')
    if (isAdmin) tabs.push('grid')
    tabs.push('policies')
    if (showAdminTab) tabs.push('admin')
    return tabs
  }, [isAdmin, isEmployeeUser, showAdminTab])

  const [tab, setTab] = useState(availableTabs[0])

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  return (
    <>
      <CommonHeader title='Documents' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 bg-transparent p-0'>
              {isEmployeeUser && (
                <TabsTrigger variant='primary' value='mine'>
                  My Documents
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger variant='primary' value='grid'>
                  Documents
                </TabsTrigger>
              )}
              <TabsTrigger variant='primary' value='policies'>
                Policies
              </TabsTrigger>
              {showAdminTab && (
                <TabsTrigger variant='primary' value='admin'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {isEmployeeUser && (
              <TabsContent value='mine'>
                <MyDocumentsTab
                  store={store}
                  settings={settings}
                  documentTypes={masters.documentTypes}
                />
              </TabsContent>
            )}
            {isAdmin && (
              <TabsContent value='grid'>
                <DocumentsTab
                  store={store}
                  settings={settings}
                  documentTypes={masters.documentTypes}
                />
              </TabsContent>
            )}
            <TabsContent value='policies'>
              <PoliciesTab masters={masters} />
            </TabsContent>
            {showAdminTab && (
              <TabsContent value='admin'>
                <EngineArtifactsPanel module='Documents' />
                <div className='flex flex-col gap-6'>
                  {isCompanyAdmin && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Document types
                      </h3>
                      <TypesTab masters={masters} />
                    </section>
                  )}
                  {isCompanyAdmin && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Required certificates
                      </h3>
                      <CertificatesTab masters={masters} />
                    </section>
                  )}
                  {showCustodians && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Custodians
                      </h3>
                      <CustodiansTab masters={masters} />
                    </section>
                  )}
                  {showConfig && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Settings
                      </h3>
                      <ConfigTab store={store} settings={settings} />
                    </section>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
