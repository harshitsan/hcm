import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { useRole } from '@/context/role-context'
import { ApprovalsTab } from './components/approvals-tab'
import { GovernanceTab } from './components/governance-tab'
import { GroupsListTab } from './components/groups-list-tab'
import { GroupsSummary } from './components/groups-summary'
import { HierarchyTab } from './components/hierarchy-tab'
import { MyGroupsTab } from './components/my-groups-tab'
import { PoliciesTab } from './components/policies-tab'
import { useOrgGroups } from './hooks/use-org-groups'

interface TabDef {
  value: string
  label: string
}

/**
 * Groups module (FR 6.6.x + Kensium Organization > Group): scoped group
 * register, n-level hierarchy, effective-dated membership, approval-controlled
 * changes, policy applicability with a rules-engine preview, and portfolio
 * governance. Task-first tab order; admin-only surfaces (policy rules,
 * portfolio governance) live under a single Admin tab. Visible tabs vary
 * with the active role.
 */
export function OrgGroups() {
  const { role } = useRole()
  const store = useOrgGroups()

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isApproverAdmin =
    role === 'Group Company Admin' || role === 'Platform Admin'
  const isGovernance = role === 'Portfolio Admin' || role === 'Platform Admin'
  const isApprover = role === 'Company Admin' || isApproverAdmin

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Groups' }]
    const list: TabDef[] = [{ value: 'groups', label: 'Groups' }]
    if (isApprover) {
      list.push({ value: 'approvals', label: 'Approvals' })
    }
    list.push({ value: 'hierarchy', label: 'Hierarchy' })
    list.push({ value: 'admin', label: 'Admin' })
    return list
  }, [isEmployee, isApprover])

  // Land each role on its most relevant tab: employees on self-service,
  // portfolio admins on the Admin surface, everyone else on the main list.
  const defaultTab = isEmployee
    ? 'my'
    : role === 'Portfolio Admin'
      ? 'admin'
      : 'groups'

  return (
    <>
      <CommonHeader title='Groups' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          {!isEmployee && (
            <GroupsSummary
              groups={store.groups}
              memberships={store.memberships}
              requests={store.requests}
            />
          )}

          {/* Remount when the role changes so the default tab stays valid. */}
          <Tabs key={role} defaultValue={defaultTab} className='w-full'>
            <TabsList className='mb-2'>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} variant='primary' value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {!isEmployee && (
              <>
                <TabsContent value='groups'>
                  <GroupsListTab store={store} />
                </TabsContent>
                <TabsContent value='hierarchy'>
                  <HierarchyTab store={store} />
                </TabsContent>
                <TabsContent value='admin'>
                  {isGovernance ? (
                    <Tabs
                      defaultValue={
                        role === 'Portfolio Admin' ? 'governance' : 'policies'
                      }
                      className='w-full'
                    >
                      <TabsList className='mb-2'>
                        <TabsTrigger value='policies'>Policies</TabsTrigger>
                        <TabsTrigger value='governance'>Governance</TabsTrigger>
                      </TabsList>
                      <TabsContent value='policies'>
                        <PoliciesTab store={store} />
                      </TabsContent>
                      <TabsContent value='governance'>
                        <GovernanceTab store={store} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <PoliciesTab store={store} />
                  )}
                </TabsContent>
              </>
            )}
            {isApprover && (
              <TabsContent value='approvals'>
                <ApprovalsTab store={store} />
              </TabsContent>
            )}
            {isEmployee && (
              <TabsContent value='my'>
                <MyGroupsTab store={store} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
