import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import type { Employee } from '../data/employees'
import type { EmployeeClass, Project, ProjectRole } from '../data/org-config'
import type { Department, Position } from '../data/positions'
import { EmployeeTypeBadge, LevelBadge, WageTypeBadge } from './badges'

export interface EmployeeColumnOptions {
  positions: Position[]
  departments: Department[]
  classes: EmployeeClass[]
  projects: Project[]
  roles: ProjectRole[]
  onAssignPosition: (employee: Employee) => void
  onAssignClass: (employee: Employee) => void
  onAssignProjectRole: (employee: Employee) => void
  onProvisionLogin: (employee: Employee) => void
  onAppraise: (employee: Employee) => void
  onHistory: (employee: Employee) => void
}

/**
 * Employee assignment grid columns (POS-03/11/17/28/32/41): each row shows
 * the single position, classification and project role held, for portal
 * users and non-user employees alike.
 */
export function buildEmployeeColumns(
  opts: EmployeeColumnOptions
): ColumnDef<Employee>[] {
  const positionLabel = (id: string | null) => {
    if (!id) return null
    const position = opts.positions.find((p) => p.id === id)
    if (!position) return null
    const dept =
      opts.departments.find((d) => d.id === position.departmentId)?.name ?? '—'
    return { position, dept }
  }

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Employee'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Employee
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.name} columnId={column.id}>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <div className='flex items-center gap-2'>
              <LongText className='text-neutral-1600 font-medium'>
                {row.original.name}
              </LongText>
              <EmployeeTypeBadge type={row.original.type} />
            </div>
            <span className='text-paragraph-sm text-neutral-1000 font-mono'>
              {row.original.code}
            </span>
          </div>
        </HighlightedCell>
      ),
    },
    {
      id: 'position',
      accessorFn: (e) => positionLabel(e.positionId)?.position.name ?? '',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Position'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Position
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => {
        const label = positionLabel(row.original.positionId)
        if (!label) {
          return (
            <span className='text-neutral-1000 text-sm'>Unassigned</span>
          )
        }
        return (
          <HighlightedCell value={label.position.name} columnId={column.id}>
            <div className='flex items-center gap-2'>
              <div className='flex min-w-0 flex-col'>
                <span className='text-neutral-1900 text-sm font-medium'>
                  {label.position.name}
                </span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {label.dept}
                </span>
              </div>
              <LevelBadge level={label.position.level} />
            </div>
          </HighlightedCell>
        )
      },
    },
    {
      id: 'classification',
      accessorFn: (e) =>
        opts.classes.find((c) => c.id === e.classId)?.name ?? '',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Classification</span>
      ),
      cell: ({ row }) => {
        const cls = opts.classes.find((c) => c.id === row.original.classId)
        if (!cls) {
          return <span className='text-neutral-1000 text-sm'>Unassigned</span>
        }
        return (
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='text-neutral-1900 text-sm'>
              {cls.name} · {cls.payrollFrequency}
            </span>
            <WageTypeBadge wageType={cls.wageType} />
          </div>
        )
      },
    },
    {
      id: 'projectRole',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Project Role</span>
      ),
      cell: ({ row }) => {
        const assignment = row.original.projectAssignment
        if (!assignment) {
          return <span className='text-neutral-1000 text-sm'>—</span>
        }
        const project = opts.projects.find((p) => p.id === assignment.projectId)
        const role = opts.roles.find((r) => r.id === assignment.roleId)
        return (
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1900 text-sm'>{role?.name ?? '—'}</span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {project ? `${project.code} · ${project.name}` : '—'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'rating',
      accessorFn: (e) => e.lastRating ?? -1,
      header: () => (
        <span className='text-paragraph-sm font-medium'>Rating</span>
      ),
      size: 70,
      cell: ({ row }) =>
        row.original.lastRating == null ? (
          <span className='text-neutral-1000 text-sm'>—</span>
        ) : (
          <span className='text-neutral-1900 text-sm font-medium'>
            {row.original.lastRating.toFixed(1)}/5
          </span>
        ),
    },
    {
      id: 'task',
      header: () => <span className='text-paragraph-sm font-medium'>Task</span>,
      size: 60,
      cell: ({ row }) => {
        const employee = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Actions for ${employee.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[220px]'>
              <DropdownMenuItem onClick={() => opts.onAssignPosition(employee)}>
                Assign position
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => opts.onAssignClass(employee)}>
                Assign classification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => opts.onAssignProjectRole(employee)}>
                Assign project role
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={employee.projectAssignment === null}
                onClick={() => opts.onAppraise(employee)}
              >
                Appraise in project role
              </DropdownMenuItem>
              <DropdownMenuSeparator className='my-0' />
              <DropdownMenuItem onClick={() => opts.onHistory(employee)}>
                Position history
              </DropdownMenuItem>
              {employee.type === 'non-user' && (
                <DropdownMenuItem onClick={() => opts.onProvisionLogin(employee)}>
                  Provision login
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
