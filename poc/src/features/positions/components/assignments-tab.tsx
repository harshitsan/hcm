import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import type { Employee } from '../data/employees'
import type { Department } from '../data/positions'
import type { EmployeesStore } from '../hooks/use-employees'
import type { OrgConfigStore } from '../hooks/use-org-config'
import type { PositionsStore } from '../hooks/use-positions'
import {
  AssignClassDialog,
  AssignPositionDialog,
  EmployeeHistoryDialog,
} from './assignment-dialogs'
import { buildEmployeeColumns } from './employee-columns'
import { AppraisalDialog, AssignProjectRoleDialog } from './project-role-dialogs'

type TypeFilter = 'all' | 'user' | 'non-user'

interface AssignmentsTabProps {
  companyId: string
  departments: Department[]
  store: PositionsStore
  employees: EmployeesStore
  orgConfig: OrgConfigStore
}

/**
 * Employee assignment grid (POS-03/10/11/17/28/32/41): every employee —
 * portal user or non-user — holds exactly one position, one classification
 * and at most one project role, each assignable from per-row task actions.
 */
export function AssignmentsTab({
  companyId,
  departments,
  store,
  employees,
  orgConfig,
}: AssignmentsTabProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [assignTarget, setAssignTarget] = useState<Employee | null>(null)
  const [classTarget, setClassTarget] = useState<Employee | null>(null)
  const [roleTarget, setRoleTarget] = useState<Employee | null>(null)
  const [appraiseTarget, setAppraiseTarget] = useState<Employee | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Employee | null>(null)

  // Only the admin's own company is ever visible (POS-06).
  const scoped = useMemo(
    () =>
      employees.employees.filter(
        (e) =>
          e.companyId === companyId &&
          (typeFilter === 'all' || e.type === typeFilter)
      ),
    [employees.employees, companyId, typeFilter]
  )

  const companyPositions = useMemo(
    () => store.positions.filter((p) => p.companyId === companyId),
    [store.positions, companyId]
  )
  const companyDepartments = useMemo(
    () => departments.filter((d) => d.companyId === companyId),
    [departments, companyId]
  )
  const companyClasses = useMemo(
    () => orgConfig.employeeClasses.filter((c) => c.companyId === companyId),
    [orgConfig.employeeClasses, companyId]
  )

  const columns = useMemo(
    () =>
      buildEmployeeColumns({
        positions: companyPositions,
        departments: companyDepartments,
        classes: companyClasses,
        projects: orgConfig.projects,
        roles: orgConfig.projectRoles,
        onAssignPosition: setAssignTarget,
        onAssignClass: setClassTarget,
        onAssignProjectRole: setRoleTarget,
        onProvisionLogin: (e) => employees.provisionLogin(e.id),
        onAppraise: setAppraiseTarget,
        onHistory: setHistoryTarget,
      }),
    [
      companyPositions,
      companyDepartments,
      companyClasses,
      orgConfig.projects,
      orgConfig.projectRoles,
      employees,
    ]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Employee Assignments ({scoped.length})
        </h2>
        {/* Non-user employees appear alongside portal users (POS-11/17). */}
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TypeFilter)}
        >
          <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All employees</SelectItem>
            <SelectItem value='user'>Portal users only</SelectItem>
            <SelectItem value='non-user'>Non-user employees only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={scoped}
        variant='no-status'
        resetSelectionKey={`${companyId}-${typeFilter}`}
      />

      <AssignPositionDialog
        employee={assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }}
        positions={companyPositions}
        departments={companyDepartments}
        onAssign={(positionId, label) => {
          if (assignTarget) {
            employees.assignPosition(assignTarget.id, positionId, label)
          }
        }}
      />

      <AssignClassDialog
        employee={classTarget}
        onOpenChange={(open) => {
          if (!open) setClassTarget(null)
        }}
        classes={companyClasses}
        onAssign={(classId) => {
          if (classTarget) employees.assignClass(classTarget.id, classId)
        }}
      />

      <AssignProjectRoleDialog
        employee={roleTarget}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null)
        }}
        projects={orgConfig.projects}
        roles={orgConfig.projectRoles}
        projectTypes={orgConfig.projectTypes}
        onAssign={(projectId, roleId) => {
          if (roleTarget) {
            employees.assignProjectRole(roleTarget.id, projectId, roleId)
          }
        }}
      />

      <AppraisalDialog
        employee={appraiseTarget}
        onOpenChange={(open) => {
          if (!open) setAppraiseTarget(null)
        }}
        roles={orgConfig.projectRoles}
        onSubmit={(rating) => {
          if (!appraiseTarget) return
          if (rating === null) {
            // Roles without questions complete without criteria (POS-41).
            toast.info('Appraisal completed — role has no scored criteria')
          } else {
            employees.recordAppraisal(appraiseTarget.id, rating)
          }
        }}
      />

      <EmployeeHistoryDialog
        employee={historyTarget}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null)
        }}
        assignmentHistory={employees.assignmentHistory}
      />
    </div>
  )
}
