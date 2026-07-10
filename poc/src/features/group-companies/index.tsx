import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { AuditTab } from './components/audit-tab'
import { ConstructsTab } from './components/constructs-tab'
import { GroupSummary } from './components/group-summary'
import { LocationsTab } from './components/locations-tab'
import { PoliciesTab } from './components/policies-tab'
import { ReportingTab } from './components/reporting-tab'
import { SharingTab } from './components/sharing-tab'
import { PERSONAS } from './data/group-companies'
import { useAudit } from './hooks/use-audit'
import { useGroupCompanies } from './hooks/use-group-companies'
import { usePolicyTemplates } from './hooks/use-policy-templates'
import { useSharedLocations } from './hooks/use-shared-locations'

/**
 * SatelliteHR POC — Group Companies module (FR 6.3 / GROUP-FR-001…006,
 * GRP-01…GRP-26). Constructs with effective-dated memberships, explicitly
 * authorized shared scenarios governed as versioned configuration, shared
 * locations & policy templates, rules-engine-gated consolidated reporting and
 * cross-company directory search — all on a tamper-evident audit trail.
 */
export function GroupCompanies() {
  const { role } = useRole()
  const persona = PERSONAS[role]

  const audit = useAudit(persona.email, role)
  const store = useGroupCompanies(audit.record, persona.email)
  const locations = useSharedLocations(audit.record)
  const policies = usePolicyTemplates(audit.record)

  // Employees land on the directory/reporting view; admins land on the group list.
  const isEmployee = role === 'Employee (User)' || role === 'Employee (Non-User)'
  const defaultTab = isEmployee ? 'reporting' : 'groups'

  return (
    <>
      <CommonHeader
        title='Group Companies'
        className='bg-blue-150'
        endComponent={<Badge variant='open'>Acting as {role}</Badge>}
      />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <GroupSummary groups={store.groups} auditCount={audit.entries.length} />

          <Tabs defaultValue={defaultTab}>
            <TabsList className='mb-3 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='groups' variant='primary'>
                Groups & Members
              </TabsTrigger>
              <TabsTrigger value='reporting' variant='primary'>
                Reports & Directory
              </TabsTrigger>
              <TabsTrigger value='admin' variant='primary'>
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value='groups'>
              <ConstructsTab store={store} />
            </TabsContent>
            <TabsContent value='reporting'>
              <ReportingTab store={store} record={audit.record} />
            </TabsContent>
            <TabsContent value='admin'>
              <div className='flex flex-col gap-6'>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Sharing & Roles</h3>
                  <SharingTab store={store} auditEntries={audit.entries} />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Shared Locations</h3>
                  <LocationsTab store={store} locations={locations} />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Policy Templates</h3>
                  <PoliciesTab store={store} policies={policies} />
                </section>
                <section>
                  <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>Activity Log</h3>
                  <AuditTab audit={audit} />
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
