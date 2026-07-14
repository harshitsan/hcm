import type { TableSpec } from '@/components/common/data-table'
import { companyById, type Employee } from '../data/directory'
import { EmploymentStatusBadge } from './directory-badges'

interface DirectoryTableSpecOpts {
  /** Show the company identifier column on cross-company scopes (DIR-09). */
  showCompany: boolean
}

/** List-view TableSpec — filtering stays external (applyFilters via `results`). */
export function directoryTableSpec({
  showCompany,
}: DirectoryTableSpecOpts): TableSpec<Employee> {
  return {
    id: 'directory',
    defaultSort: { id: 'name', dir: 'asc' },
    columns: [
      {
        id: 'name',
        header: 'Name',
        type: 'string',
        required: true,
        accessor: (e) => e.name,
      },
      {
        id: 'position',
        header: 'Position',
        type: 'string',
        accessor: (e) => e.position,
      },
      {
        id: 'department',
        header: 'Department',
        type: 'string',
        accessor: (e) => e.department,
      },
      {
        id: 'location',
        header: 'Location',
        type: 'string',
        accessor: (e) => e.location,
      },
      {
        id: 'employmentStatus',
        header: 'Status',
        type: 'badge',
        accessor: (e) => e.employmentStatus,
        cell: (e) => <EmploymentStatusBadge status={e.employmentStatus} />,
      },
      ...(showCompany
        ? [
            {
              id: 'company',
              header: 'Company',
              type: 'string' as const,
              accessor: (e: Employee) => e.companyId,
              cell: (e: Employee) => companyById(e.companyId)?.name ?? e.companyId,
            },
          ]
        : []),
      {
        id: 'employeeCode',
        header: 'Employee ID',
        type: 'string',
        detail: true,
        accessor: (e) => e.employeeCode,
      },
      {
        id: 'workGroup',
        header: 'Work group',
        type: 'string',
        detail: true,
        accessor: (e) => e.workGroup,
      },
    ],
  }
}
