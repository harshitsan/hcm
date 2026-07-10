import { useMemo, useState } from 'react'
import { PencilSimple, Plus, Rows } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { RoleGate, useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { DelegationsTab } from './components/delegations-tab'
import { EmployeeDetailSheet } from './components/employee-detail-sheet'
import { EmployeeOverlay } from './components/employee-overlay'
import { EmployeesSummary } from './components/employees-summary'
import { employeesTableColumns } from './components/employees-table-columns'
import { MassUpdateDialog } from './components/mass-update-dialog'
import { MyProfileTab } from './components/my-profile-tab'
import { ProjectsTab } from './components/projects/projects-tab'
import { FilterSelect } from './components/shared'
import {
  COMPANIES,
  DEPARTMENTS,
  JURISDICTIONS,
  LIFECYCLE_STAGES,
  LOCATIONS,
  companyGroup,
  companyName,
  type Employee,
} from './data/employees'
import { useEmployees, type EmployeeDraft } from './hooks/use-employees'

/** The Company Admin persona administers this company in the POC. */
const ADMIN_COMPANY_ID = 'c-aur-ret'
const ADMIN_GROUP = 'Aurora Group'

/**
 * Employees — metadata-driven directory (company / group / portfolio scoped
 * by role), employee record capture with dedup + statutory data, self-service
 * profile and acting-manager delegations.
 */
export function Employees() {
  const store = useEmployees()
  const { role, hasRole } = useRole()

  const [selectedRows, setSelectedRows] = useState<Employee[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null)
  const [massUpdateOpen, setMassUpdateOpen] = useState(false)

  const [companyFilter, setCompanyFilter] = useState('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  /** Authorization scope per role (EMP-01 / EMP-16 / EMP-29). */
  const scoped = useMemo(() => {
    if (hasRole('Group Company Admin')) {
      return store.employees.filter(
        (e) => companyGroup(e.companyId) === ADMIN_GROUP
      )
    }
    if (hasRole('Portfolio Admin', 'Platform Admin')) {
      return store.employees
    }
    return store.employees.filter((e) => e.companyId === ADMIN_COMPANY_ID)
  }, [store.employees, hasRole])

  const scopeLabel = hasRole('Portfolio Admin', 'Platform Admin')
    ? 'Entire portfolio (records stay company-specific)'
    : hasRole('Group Company Admin')
      ? ADMIN_GROUP
      : companyName(ADMIN_COMPANY_ID)

  const scopedCompanyNames = useMemo(
    () =>
      COMPANIES.filter((c) => scoped.some((e) => e.companyId === c.id)).map(
        (c) => c.name
      ),
    [scoped]
  )

  const filtered = useMemo(
    () =>
      scoped.filter(
        (e) =>
          (companyFilter === 'all' ||
            companyName(e.companyId) === companyFilter) &&
          (jurisdictionFilter === 'all' ||
            e.jurisdiction === jurisdictionFilter) &&
          (departmentFilter === 'all' ||
            e.departments.includes(departmentFilter)) &&
          (locationFilter === 'all' || e.locations.includes(locationFilter)) &&
          (stageFilter === 'all' || e.lifecycleStage === stageFilter)
      ),
    [
      scoped,
      companyFilter,
      jurisdictionFilter,
      departmentFilter,
      locationFilter,
      stageFilter,
    ]
  )

  const managerOptions = useMemo(
    () =>
      [
        ...new Set([
          ...store.employees
            .filter((e) => e.lifecycleStage !== 'Exited')
            .map((e) => e.name),
          'Board — Managing Director',
          'Board — CFO',
        ]),
      ].sort(),
    [store.employees]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: EmployeeDraft) => {
    if (editingEmployee) {
      if (
        draft.primaryManager !== editingEmployee.primaryManager ||
        draft.managerEffectiveDate !== editingEmployee.managerEffectiveDate
      ) {
        store.recordManagerChange({
          employeeName: draft.name,
          changeType: 'Primary',
          from: editingEmployee.primaryManager,
          to: draft.primaryManager,
          effectiveDate: draft.managerEffectiveDate,
          endDate: null,
          changedBy: `You (${role})`,
        })
      }
      store.updateEmployee(editingEmployee.id, draft)
    } else {
      store.addEmployee(draft)
    }
    clearSelection()
  }

  const defaultTab = hasRole('Employee (User)', 'Employee (Non-User)')
    ? 'profile'
    : 'directory'

  return (
    <>
      <CommonHeader title='Employees' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <EmployeesSummary employees={scoped} scopeLabel={scopeLabel} />

          <Tabs defaultValue={defaultTab} key={role}>
            <TabsList className='mb-2'>
              <TabsTrigger value='profile'>My Profile</TabsTrigger>
              <TabsTrigger value='directory'>Directory</TabsTrigger>
              <TabsTrigger value='delegations'>
                Managers & Delegation
              </TabsTrigger>
              <TabsTrigger value='projects'>Projects</TabsTrigger>
            </TabsList>

            <TabsContent value='directory'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  {(hasRole('Group Company Admin') ||
                    hasRole('Portfolio Admin', 'Platform Admin')) && (
                    <FilterSelect
                      label='Company'
                      value={companyFilter}
                      onChange={setCompanyFilter}
                      options={scopedCompanyNames}
                    />
                  )}
                  <FilterSelect
                    label='Jurisdiction'
                    value={jurisdictionFilter}
                    onChange={setJurisdictionFilter}
                    options={JURISDICTIONS}
                  />
                  <FilterSelect
                    label='Department'
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={DEPARTMENTS}
                  />
                  <FilterSelect
                    label='Location'
                    value={locationFilter}
                    onChange={setLocationFilter}
                    options={LOCATIONS}
                  />
                  <FilterSelect
                    label='Stage'
                    value={stageFilter}
                    onChange={setStageFilter}
                    options={LIFECYCLE_STAGES}
                  />
                </div>
                <div className='flex items-center gap-3'>
                  <RoleGate roles={['Company Admin']}>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label='Mass update'
                      onClick={() => setMassUpdateOpen(true)}
                    >
                      <Rows size={16} weight='bold' />
                    </Button>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      disabled={selectedRows.length !== 1}
                      aria-label='Edit'
                      onClick={() => {
                        if (selectedRows.length !== 1) return
                        setEditingEmployee(selectedRows[0])
                        setOverlayOpen(true)
                      }}
                    >
                      <PencilSimple size={16} weight='fill' />
                    </Button>
                    <Button
                      variant='red'
                      className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
                      onClick={() => {
                        setEditingEmployee(null)
                        setOverlayOpen(true)
                      }}
                    >
                      <Plus size={10} weight='bold' />
                      New Employee
                    </Button>
                  </RoleGate>
                  <RoleGate roles={['Portfolio Admin']}>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      Read-only oversight — organizational assignments cannot
                      be edited at portfolio level
                    </span>
                  </RoleGate>
                </div>
              </div>

              <DataTable
                columns={employeesTableColumns}
                data={filtered}
                variant='no-status'
                resetSelectionKey={resetSelectionKey}
                onSelectionChange={(rows) => setSelectedRows(rows)}
                onRowClick={(row) => setDetailEmployee(row)}
              />
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                Grid columns and filters are metadata-driven (see Employee
                Configuration → Types & Directory). One person employed by two
                companies appears as two independent company-scoped records.
              </p>
            </TabsContent>

            <TabsContent value='profile'>
              <RoleGate
                roles={['Employee (User)']}
                fallback={
                  <div className='rounded-md border border-gray-200 bg-white px-4 py-6'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {hasRole('Employee (Non-User)')
                        ? 'No self-service login for this employee.'
                        : 'Self-service profile is shown for the Employee (User) role.'}
                    </p>
                    <p className='text-paragraph-sm text-neutral-1000 pt-1'>
                      Non-user employees have no system access, yet their
                      employment, organizational, statutory and reporting data
                      is fully maintained by HR — including onboarding,
                      probation, transfer and exit events. Linking a user
                      account later preserves the record without duplication.
                    </p>
                  </div>
                }
              >
                <MyProfileTab store={store} />
              </RoleGate>
            </TabsContent>

            <TabsContent value='delegations'>
              <DelegationsTab store={store} />
            </TabsContent>

            <TabsContent value='projects'>
              <ProjectsTab />
            </TabsContent>
          </Tabs>

          <RoleGate
            roles={[
              'Platform Admin',
              'Portfolio Admin',
              'Group Company Admin',
              'Company Admin',
            ]}
          >
            <div className='mt-4'>
              <EngineArtifactsPanel module='Employees' />
            </div>
          </RoleGate>
        </div>
      </Main>

      <EmployeeOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingEmployee(null)
        }}
        employee={editingEmployee}
        managerOptions={managerOptions}
        classify={store.classifyGovernmentIds}
        onSubmit={handleSubmit}
      />

      <EmployeeDetailSheet
        employee={
          detailEmployee
            ? (store.employees.find((e) => e.id === detailEmployee.id) ?? null)
            : null
        }
        open={detailEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setDetailEmployee(null)
        }}
        managerChanges={store.managerChanges}
        employees={scoped}
        onRecordLifecycleEvent={store.recordLifecycleEvent}
        onRunEngines={store.runEngines}
        onLinkUserAccount={store.linkUserAccount}
        onReassignRoles={store.reassignRoles}
        onInitiateSuspension={store.suspendEmployee}
      />

      <MassUpdateDialog
        open={massUpdateOpen}
        onOpenChange={setMassUpdateOpen}
        employees={scoped}
        onApply={store.massUpdate}
      />
    </>
  )
}
