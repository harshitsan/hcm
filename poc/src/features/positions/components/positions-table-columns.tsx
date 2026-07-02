import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { PayGrade } from '../data/org-config'
import type { Department, Position } from '../data/positions'
import { LevelBadge, StatusBadge } from './badges'

export interface PositionColumnOptions {
  departments: Department[]
  payGrades: PayGrade[]
  payGradeEnabled: boolean
  assignedCount: (positionId: string) => number
  /** Task actions render only for roles allowed to manage (POS-22). */
  canManage: boolean
  onEdit: (position: Position) => void
  onToggleStatus: (position: Position) => void
  onDelete: (position: Position) => void
  onHistory: (position: Position) => void
}

/** Column factory for the metadata-driven position grid (POS-14/19/21/22). */
export function buildPositionColumns(
  opts: PositionColumnOptions
): ColumnDef<Position>[] {
  const departmentName = (id: string) =>
    opts.departments.find((d) => d.id === id)?.name ?? '—'

  const columns: ColumnDef<Position>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label='Select all'
          variant='blue'
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          variant='blue'
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Position ID'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Position ID
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.id} columnId={column.id}>
          <span className='text-neutral-1900 font-mono text-xs'>
            {row.original.id}
          </span>
        </HighlightedCell>
      ),
    },
    {
      accessorKey: 'name',
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
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.name} columnId={column.id}>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
        </HighlightedCell>
      ),
    },
    {
      id: 'department',
      accessorFn: (p) => departmentName(p.departmentId),
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Department'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Department
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell
          value={departmentName(row.original.departmentId)}
          columnId={column.id}
        >
          <LongText className='text-neutral-1900 text-sm'>
            {departmentName(row.original.departmentId)}
          </LongText>
        </HighlightedCell>
      ),
    },
    {
      id: 'level',
      accessorFn: (p) => p.level ?? -1,
      header: () => <span className='text-paragraph-sm font-medium'>Level</span>,
      cell: ({ row }) => <LevelBadge level={row.original.level} />,
      size: 70,
    },
  ]

  if (opts.payGradeEnabled) {
    columns.push({
      id: 'payGrade',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Pay Grade Band</span>
      ),
      cell: ({ row }) => {
        const grade = opts.payGrades.find(
          (g) =>
            g.companyId === row.original.companyId &&
            row.original.level !== null &&
            g.level === row.original.level
        )
        return grade ? (
          <span className='text-neutral-1900 text-sm'>
            {grade.name} · ${grade.minimum.toLocaleString()}–$
            {grade.maximum.toLocaleString()}
          </span>
        ) : (
          <span className='text-neutral-1000 text-sm'>Not mapped</span>
        )
      },
    })
  }

  columns.push(
    {
      id: 'assigned',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Assigned</span>
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {opts.assignedCount(row.original.id)} employee(s)
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: 'status',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Status</span>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 80,
    },
    {
      id: 'task',
      header: () => <span className='text-paragraph-sm font-medium'>Task</span>,
      size: 60,
      cell: ({ row }) => {
        // Per-row task actions are hidden for read-only roles (POS-22).
        if (!opts.canManage) {
          return <span className='text-neutral-1000 text-sm'>—</span>
        }
        const position = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Task actions for ${position.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[190px]'>
              <DropdownMenuItem onClick={() => opts.onEdit(position)}>
                Edit position
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => opts.onToggleStatus(position)}>
                {position.status === 'active' ? 'Deactivate' : 'Reactivate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => opts.onHistory(position)}>
                View history
              </DropdownMenuItem>
              <DropdownMenuSeparator className='my-0' />
              <DropdownMenuItem
                className='text-destructive'
                onClick={() => opts.onDelete(position)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
  )

  return columns
}
