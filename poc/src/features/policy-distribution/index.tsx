import { useEffect, useMemo, useState } from 'react'
import { useRole } from '@/context/role-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { ComplianceTab } from './components/compliance-tab'
import { ConfigTab } from './components/config-tab'
import { DistributionsTab } from './components/distributions-tab'
import { InboxTab } from './components/inbox-tab'
import { usePolicyConfig } from './hooks/use-policy-config'
import { usePolicyDistribution } from './hooks/use-policy-distribution'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'

const ADMIN_ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
] as const

const CONFIG_ROLES = ['Platform Admin', 'Company Admin'] as const

/**
 * Policy Distribution & Acknowledgment module: the admin distribution
 * console (audience targeting, methods, due-date rules, per-recipient
 * grid), the employee policy inbox with review + receipts, the compliance
 * dashboard with rollups and the 7-year audit trail, and the governance
 * configuration (reminders, escalations, templates, decision table,
 * integrations) — all against in-memory stores.
 */
export function PolicyDistribution() {
  const { role } = useRole()
  const store = usePolicyDistribution()
  const config = usePolicyConfig()

  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
  const canConfigure = (CONFIG_ROLES as readonly string[]).includes(role)

  const availableTabs = useMemo(() => {
    const tabs: string[] = ['inbox']
    if (isAdmin) tabs.push('distributions', 'compliance')
    if (canConfigure) tabs.push('config')
    return tabs
  }, [isAdmin, canConfigure])

  const [tab, setTab] = useState(isAdmin ? 'distributions' : 'inbox')

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  return (
    <>
      <CommonHeader title='Policy Distribution' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='mb-3 bg-transparent p-0'>
              <TabsTrigger variant='primary' value='inbox'>
                My Policy Inbox
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger variant='primary' value='distributions'>
                  Distributions
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger variant='primary' value='compliance'>
                  Compliance
                </TabsTrigger>
              )}
              {canConfigure && (
                <TabsTrigger variant='primary' value='config'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='inbox'>
              <InboxTab store={store} config={config} />
            </TabsContent>
            {isAdmin && (
              <TabsContent value='distributions'>
                <DistributionsTab store={store} config={config} />
              </TabsContent>
            )}
            {isAdmin && (
              <TabsContent value='compliance'>
                <ComplianceTab store={store} />
              </TabsContent>
            )}
            {canConfigure && (
              <TabsContent value='config'>
                <EngineArtifactsPanel module='Policy Distribution' />
                <ConfigTab config={config} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
