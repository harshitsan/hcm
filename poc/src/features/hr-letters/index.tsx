import { useEffect, useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AgreementsTab } from './components/agreements-tab'
import { ApprovalsTab } from './components/approvals-tab'
import { CatalogsTab } from './components/catalogs-tab'
import { ConfigTab } from './components/config-tab'
import { DocumentsTab } from './components/documents-tab'
import { MyDocumentsTab } from './components/my-documents-tab'
import { TemplatesTab } from './components/templates-tab'
import { useCatalogs } from './hooks/use-catalogs'
import { useHrDocuments } from './hooks/use-hr-documents'
import { useLetterConfig } from './hooks/use-letter-config'
import { useLetterTemplates } from './hooks/use-letter-templates'

/**
 * HR Letters & Certificates module. One page, role-aware tabs (task-first):
 * - My Documents: employee self-service view/download + agreement
 *   acknowledgment; Employee (Non-User) sees their email/print delivery record
 * - Documents: search/filter grid over generated letters with manual, batch,
 *   and event-driven generation, approval, distribution, versioning, reissue
 * - Approvals: Company Admin approval queue (approve / reject with reason)
 * - Admin: everything setup-related, grouped as nested tabs:
 *   - Letter Templates: the eight versioned HR letter templates with merge fields
 *   - Email & Notifications: domain-scoped email/notification template catalogs
 *     with Template Type IDs, paging, and co-located approver/receiver routing
 *   - Agreements: agreement letter templates, certification questionnaire, and
 *     acknowledgment tracking
 *   - Settings: auto triggers, decision tables, notification engine,
 *     retention; group governance; platform data-model posture
 */
export function HrLetters() {
  const { role } = useRole()
  const documentsStore = useHrDocuments()
  const templatesStore = useLetterTemplates()
  const catalogs = useCatalogs()
  const config = useLetterConfig()

  const isCompanyAdmin = role === 'Company Admin'
  const isGroupAdmin = role === 'Group Company Admin'
  const isPlatformAdmin = role === 'Platform Admin'
  const isAdmin =
    isCompanyAdmin || isGroupAdmin || isPlatformAdmin || role === 'Portfolio Admin'
  const isEmployee = role === 'Employee (User)' || role === 'Employee (Non-User)'
  const showTemplates = isCompanyAdmin || isGroupAdmin
  const showConfig = isCompanyAdmin || isGroupAdmin || isPlatformAdmin
  const showAdminTab = showTemplates || isCompanyAdmin || showConfig

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isEmployee) tabs.push('mine')
    if (isAdmin) tabs.push('documents')
    if (isCompanyAdmin) tabs.push('approvals')
    if (showAdminTab) tabs.push('admin')
    return tabs
  }, [isEmployee, isAdmin, isCompanyAdmin, showAdminTab])

  const [tab, setTab] = useState(availableTabs[0])

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  const adminDefaultTab = showTemplates ? 'templates' : 'config'

  return (
    <>
      <CommonHeader title='HR Letters & Certificates' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 bg-transparent p-0'>
              {isEmployee && (
                <TabsTrigger variant='primary' value='mine'>
                  My Documents
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger variant='primary' value='documents'>
                  Documents
                </TabsTrigger>
              )}
              {isCompanyAdmin && (
                <TabsTrigger variant='primary' value='approvals'>
                  Approvals
                </TabsTrigger>
              )}
              {showAdminTab && (
                <TabsTrigger variant='primary' value='admin'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {isEmployee && (
              <TabsContent value='mine'>
                <MyDocumentsTab
                  store={documentsStore}
                  templates={templatesStore.templates}
                  questions={catalogs.questions}
                />
              </TabsContent>
            )}
            {isAdmin && (
              <TabsContent value='documents'>
                <DocumentsTab
                  store={documentsStore}
                  templates={templatesStore.templates}
                  config={config}
                />
              </TabsContent>
            )}
            {isCompanyAdmin && (
              <TabsContent value='approvals'>
                <ApprovalsTab
                  store={documentsStore}
                  templates={templatesStore.templates}
                />
              </TabsContent>
            )}
            {showAdminTab && (
              <TabsContent value='admin'>
                <Tabs defaultValue={adminDefaultTab} className='w-full'>
                  <TabsList className='mb-3 bg-transparent p-0'>
                    {showTemplates && (
                      <TabsTrigger variant='primary' value='templates'>
                        Letter Templates
                      </TabsTrigger>
                    )}
                    {showTemplates && (
                      <TabsTrigger variant='primary' value='catalogs'>
                        Email & Notifications
                      </TabsTrigger>
                    )}
                    {isCompanyAdmin && (
                      <TabsTrigger variant='primary' value='agreements'>
                        Agreements
                      </TabsTrigger>
                    )}
                    {showConfig && (
                      <TabsTrigger variant='primary' value='config'>
                        Settings
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {showTemplates && (
                    <TabsContent value='templates'>
                      <TemplatesTab store={templatesStore} />
                    </TabsContent>
                  )}
                  {showTemplates && (
                    <TabsContent value='catalogs'>
                      <CatalogsTab store={catalogs} />
                    </TabsContent>
                  )}
                  {isCompanyAdmin && (
                    <TabsContent value='agreements'>
                      <AgreementsTab
                        templatesStore={templatesStore}
                        documentsStore={documentsStore}
                        catalogs={catalogs}
                      />
                    </TabsContent>
                  )}
                  {showConfig && (
                    <TabsContent value='config'>
                      <ConfigTab config={config} />
                    </TabsContent>
                  )}
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
