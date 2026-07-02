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
 * governance. Visible tabs vary with the active role.
 */
export function OrgGroups() {
  const { role } = useRole()
  const store = useOrgGroups()

  const isEmployee =
    role === 'Employee (User)' || role === 'Employee (Non-User)'
  const isApproverAdmin =
    role === 'Group Company Admin' || role === 'Platform Admin'
  const isGovernance = role === 'Portfolio Admin' || role === 'Platform Admin'

  const tabs = useMemo<TabDef[]>(() => {
    if (isEmployee) return [{ value: 'my', label: 'My Groups' }]
    const list: TabDef[] = [
      { value: 'groups', label: 'Groups' },
      { value: 'hierarchy', label: 'Hierarchy' },
      { value: 'policies', label: 'Policies & Engine' },
    ]
    if (role === 'Company Admin' || isApproverAdmin) {
      list.push({ value: 'approvals', label: 'Approvals' })
    }
    if (isGovernance) {
      list.push({ value: 'governance', label: 'Governance' })
    }
    return list
  }, [isEmployee, isApproverAdmin, isGovernance, role])

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
          <Tabs key={role} defaultValue={tabs[0].value} className='w-full'>
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
                <TabsContent value='policies'>
                  <PoliciesTab store={store} />
                </TabsContent>
              </>
            )}
            {(role === 'Company Admin' || isApproverAdmin) && (
              <TabsContent value='approvals'>
                <ApprovalsTab store={store} />
              </TabsContent>
            )}
            {isGovernance && (
              <TabsContent value='governance'>
                <GovernanceTab store={store} />
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
