import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AuditTab } from './components/audit-tab'
import { CompanyContextSwitcher } from './components/context-switcher'
import { ContextTab } from './components/context-tab'
import { OperationsTab } from './components/operations-tab'
import { PortfoliosSummary } from './components/portfolios-summary'
import { PortfoliosTab } from './components/portfolios-tab'
import { ReportingTab } from './components/reporting-tab'
import { PERSONAS } from './data/portfolios'
import { useCompanyContext } from './hooks/use-company-context'
import { usePortfolioAudit } from './hooks/use-portfolio-audit'
import { usePortfolioOps } from './hooks/use-portfolio-ops'
import { usePortfolios } from './hooks/use-portfolios'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

const OPS_ROLES = ['Platform Admin', 'Portfolio Admin'] as const

/**
 * Portfolio Management module (PORT-01…PORT-27): portfolio administration
 * with RBAC-gated create/edit/manage-companies, the header company-context
 * switcher with AUTH_002 enforcement, consolidated portfolio reporting under
 * row-level security, bulk cross-company operations and the 7-year audit
 * trail — all against in-memory stores.
 */
export function Portfolios() {
  const { role } = useRole()
  const persona = PERSONAS[role]

  const audit = usePortfolioAudit(persona.email, role)
  const store = usePortfolios(audit.record, persona.email)
  const baseContext = useCompanyContext(audit.record, persona, role)
  const ops = usePortfolioOps(audit.record)

  const search = useSearch({ from: '/_authenticated/portfolios/' })
  const navigate = useNavigate()
  const currentCompanyId = baseContext.currentCompany?.id
  const { switchCompany } = baseContext

  // ?company= is the source of truth (PORT-FR-006 / PORT-17): a bookmarked
  // URL switches context on load; a denied/unknown target keeps the active
  // context and the URL falls back to it so the address stays bookmarkable.
  useEffect(() => {
    if (!currentCompanyId) return
    if (search.company === currentCompanyId) return
    if (search.company && switchCompany(search.company, 'url')) return
    navigate({
      to: '/portfolios',
      search: { company: currentCompanyId },
      replace: true,
    })
  }, [search.company, currentCompanyId, switchCompany, navigate])

  // In-app switches (header selector, retry flows) also update the URL so
  // the current context is always shareable as a bookmark.
  const switchCompanyAndSyncUrl = useCallback(
    (targetCompanyId: string, via: 'selector' | 'url') => {
      const switched = switchCompany(targetCompanyId, via)
      if (switched) {
        navigate({
          to: '/portfolios',
          search: { company: targetCompanyId },
          replace: true,
        })
      }
      return switched
    },
    [switchCompany, navigate]
  )

  const context = useMemo(
    () => ({ ...baseContext, switchCompany: switchCompanyAndSyncUrl }),
    [baseContext, switchCompanyAndSyncUrl]
  )

  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
  const canOperate = (OPS_ROLES as readonly string[]).includes(role)

  const availableTabs = useMemo(() => {
    const tabs: string[] = []
    if (isAdmin) tabs.push('portfolios')
    tabs.push('context')
    if (canOperate) tabs.push('reporting', 'admin')
    return tabs
  }, [isAdmin, canOperate])

  const [tab, setTab] = useState(isAdmin ? 'portfolios' : 'context')

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  return (
    <>
      <CommonHeader
        title='Portfolios'
        className='bg-blue-150'
        endComponent={<CompanyContextSwitcher context={context} />}
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {isAdmin && <PortfoliosSummary portfolios={store.portfolios} />}

          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 bg-transparent p-0'>
              {isAdmin && (
                <TabsTrigger variant='primary' value='portfolios'>
                  Portfolios
                </TabsTrigger>
              )}
              <TabsTrigger variant='primary' value='context'>
                Company access
              </TabsTrigger>
              {canOperate && (
                <>
                  <TabsTrigger variant='primary' value='reporting'>
                    Reporting
                  </TabsTrigger>
                  <TabsTrigger variant='primary' value='admin'>
                    Admin
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {isAdmin && (
              <TabsContent value='portfolios'>
                <PortfoliosTab store={store} />
              </TabsContent>
            )}
            <TabsContent value='context'>
              <ContextTab context={context} />
            </TabsContent>
            {canOperate && (
              <>
                <TabsContent value='reporting'>
                  <ReportingTab store={store} ops={ops} />
                </TabsContent>
                <TabsContent value='admin'>
                  <div className='flex flex-col gap-6'>
                    <EngineArtifactsPanel module='Portfolios' />
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Bulk changes</h3>
                      <OperationsTab store={store} ops={ops} />
                    </section>
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Activity log</h3>
                      <AuditTab audit={audit} />
                    </section>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
