import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, UserRound } from 'lucide-react'
import { ClockCounterClockwise } from 'phosphor-react'
import { type Role } from '@/context/role-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/common/long-text'
import { companyById, type Employee } from '../data/directory'
import { type CustomFieldDef } from '../data/directory-config'
import { evaluateField, type PrivacyConfig } from '../utils/privacy'
import {
  CompanyBadge,
  EmploymentStatusBadge,
  NonUserBadge,
} from './directory-badges'

export function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function sortableHeader(label: string) {
  const Header: ColumnDef<Employee>['header'] = ({ column }) => (
    <Button
      variant='header'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className='text-neutral-2100 size-3.5' />
    </Button>
  )
  return Header
}

interface BuildColumnsOptions {
  role: Role
  config: PrivacyConfig
  customFields: CustomFieldDef[]
  /** Show the company identifier column on cross-company scopes (DIR-09). */
  showCompany: boolean
  /** Row action opening the employee's timeline feed. */
  onViewTimeline?: (employee: Employee) => void
}

/**
 * List-view columns are derived from the privacy rules engine: hidden or
 * sensitive fields never become columns, and contact cells re-evaluate per
 * record so per-company restrictions hold in group results (DIR-15/21).
 */
export function buildDirectoryColumns({
  role,
  config,
  customFields,
  showCompany,
  onViewTimeline,
}: BuildColumnsOptions): ColumnDef<Employee>[] {
  const canSee = (key: Parameters<typeof evaluateField>[0], e?: Employee) =>
    evaluateField(key, role, config, e?.companyId).visible

  const columns: ColumnDef<Employee>[] = [
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
      accessorKey: 'name',
      header: sortableHeader('Name'),
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-1200 text-xs font-semibold text-white'>
                {canSee('photo', e) ? (
                  initials(e.name)
                ) : (
                  <UserRound className='size-4' />
                )}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              <span className='flex items-center gap-1.5'>
                <LongText className='text-neutral-1600 font-medium'>
                  {e.name}
                </LongText>
                {!e.isUser && <NonUserBadge />}
              </span>
              <span className='text-paragraph-sm text-neutral-1000 truncate'>
                {e.employeeCode}
              </span>
            </div>
          </div>
        )
      },
    },
  ]

  if (showCompany) {
    columns.push({
      accessorKey: 'companyId',
      header: sortableHeader('Company'),
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5 text-sm'>
          <CompanyBadge companyId={row.original.companyId} />
          <span className='text-neutral-1900 truncate'>
            {companyById(row.original.companyId)?.name}
          </span>
        </div>
      ),
    })
  }

  if (canSee('position')) {
    columns.push({
      accessorKey: 'position',
      header: sortableHeader('Position'),
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.position}
        </LongText>
      ),
    })
  }

  if (canSee('department')) {
    columns.push({
      accessorKey: 'department',
      header: sortableHeader('Department'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.department}
        </span>
      ),
    })
  }

  if (canSee('location')) {
    columns.push({
      accessorKey: 'location',
      header: sortableHeader('Location'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.location}
        </span>
      ),
    })
  }

  if (canSee('workEmail') || canSee('workPhone')) {
    columns.push({
      id: 'contact',
      header: () => <span className='text-sm font-medium'>Contact</span>,
      cell: ({ row }) => {
        const e = row.original
        const showEmail = canSee('workEmail', e)
        const showPhone = canSee('workPhone', e)
        return (
          <div className='flex min-w-0 flex-col text-sm'>
            {showEmail && (
              <span className='text-neutral-1900 truncate'>{e.workEmail}</span>
            )}
            {showPhone && (
              <span className='text-neutral-1000 truncate'>{e.workPhone}</span>
            )}
          </div>
        )
      },
    })
  }

  for (const field of customFields.filter(
    (f) => f.showInDirectory && !f.sensitive
  )) {
    columns.push({
      id: field.id,
      accessorFn: (e) => e.customFields[field.id] ?? '',
      header: sortableHeader(field.label),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.customFields[field.id] ?? '—'}
        </span>
      ),
    })
  }

  columns.push({
    accessorKey: 'employmentStatus',
    header: sortableHeader('Status'),
    size: 60,
    cell: ({ row }) => (
      <div className='p-1.5'>
        <EmploymentStatusBadge status={row.original.employmentStatus} />
      </div>
    ),
  })

  if (onViewTimeline) {
    columns.push({
      id: 'actions',
      header: () => <span className='text-sm font-medium'>Actions</span>,
      enableSorting: false,
      size: 110,
      cell: ({ row }) => (
        <Button
          variant='ghost'
          className='text-blue-1400 h-7 gap-1 px-2 text-xs'
          onClick={(e) => {
            e.stopPropagation()
            onViewTimeline(row.original)
          }}
        >
          <ClockCounterClockwise size={13} weight='bold' />
          View timeline
        </Button>
      ),
    })
  }

  return columns
}
