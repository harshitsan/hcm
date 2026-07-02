import { useEffect, useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
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
 * Documents & Attachments module. One page, role-aware tabs:
 * - Documents: tenant/group/portfolio-scoped grid with upload, expiry
 *   tracking, category filters, and role-gated actions
 * - My Documents: employee self-service view/upload on own record
 * - Policies: policy documents with effective windows and applicability
 * - Document Types / Certificates / Custodians: Kensium masters
 * - Configuration: governed taxonomy, access matrix, upload policy,
 *   lead time, notification engine, and security posture
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

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isAdmin) tabs.push('grid')
    if (isEmployeeUser) tabs.push('mine')
    tabs.push('policies')
    if (isCompanyAdmin) tabs.push('types', 'certificates')
    if (showCustodians) tabs.push('custodians')
    if (showConfig) tabs.push('config')
    return tabs
  }, [isAdmin, isEmployeeUser, isCompanyAdmin, showCustodians, showConfig])

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
              {isAdmin && (
                <TabsTrigger variant='primary' value='grid'>
                  Documents
                </TabsTrigger>
              )}
              {isEmployeeUser && (
                <TabsTrigger variant='primary' value='mine'>
                  My Documents
                </TabsTrigger>
              )}
              <TabsTrigger variant='primary' value='policies'>
                Policies
              </TabsTrigger>
              {isCompanyAdmin && (
                <TabsTrigger variant='primary' value='types'>
                  Document Types
                </TabsTrigger>
              )}
              {isCompanyAdmin && (
                <TabsTrigger variant='primary' value='certificates'>
                  Required Certificates
                </TabsTrigger>
              )}
              {showCustodians && (
                <TabsTrigger variant='primary' value='custodians'>
                  Custodians
                </TabsTrigger>
              )}
              {showConfig && (
                <TabsTrigger variant='primary' value='config'>
                  Configuration
                </TabsTrigger>
              )}
            </TabsList>

            {isAdmin && (
              <TabsContent value='grid'>
                <DocumentsTab
                  store={store}
                  settings={settings}
                  documentTypes={masters.documentTypes}
                />
              </TabsContent>
            )}
            {isEmployeeUser && (
              <TabsContent value='mine'>
                <MyDocumentsTab
                  store={store}
                  settings={settings}
                  documentTypes={masters.documentTypes}
                />
              </TabsContent>
            )}
            <TabsContent value='policies'>
              <PoliciesTab masters={masters} />
            </TabsContent>
            {isCompanyAdmin && (
              <TabsContent value='types'>
                <TypesTab masters={masters} />
              </TabsContent>
            )}
            {isCompanyAdmin && (
              <TabsContent value='certificates'>
                <CertificatesTab masters={masters} />
              </TabsContent>
            )}
            {showCustodians && (
              <TabsContent value='custodians'>
                <CustodiansTab masters={masters} />
              </TabsContent>
            )}
            {showConfig && (
              <TabsContent value='config'>
                <ConfigTab store={store} settings={settings} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
