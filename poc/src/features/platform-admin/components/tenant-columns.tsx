import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Tenant, type TenantStatus } from '../data/tenants'
import { ToneBadge, type BadgeTone } from './shared'

const statusTone: Record<TenantStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'green' },
  suspended: { label: 'Suspended', tone: 'red' },
  onboarding: { label: 'Onboarding', tone: 'blue' },
}

export interface TenantLookups {
  jurisdictionCode: (id: string) => string
  portfolioName: (id: string | null) => string | null
  groupName: (id: string | null) => string | null
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<Tenant, unknown> }) {
    return (
      <SearchableHeader column={column} columnName={label}>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {label}
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    )
  }
}

/** Tenant table columns (SYS-01, 09, 48) — arrangement is exactly one of
 * standalone / portfolio / group. */
export function buildTenantColumns(
  lookups: TenantLookups
): ColumnDef<Tenant>[] {
  return [
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
      header: sortableHeader('Company'),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.name} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {row.original.name}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {row.original.code}
            </span>
          </div>
        </HighlightedCell>
      ),
    },
    {
      id: 'jurisdictions',
      accessorFn: (t) =>
        t.jurisdictionIds.map(lookups.jurisdictionCode).join(', '),
      header: sortableHeader('Jurisdictions'),
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1'>
          {row.original.jurisdictionIds.map((id) => (
            <Badge key={id} variant='pending'>
              {lookups.jurisdictionCode(id)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'arrangement',
      accessorFn: (t) =>
        lookups.portfolioName(t.portfolioId) ??
        lookups.groupName(t.groupId) ??
        'Standalone',
      header: sortableHeader('Arrangement'),
      cell: ({ row, column }) => {
        const t = row.original
        const portfolio = lookups.portfolioName(t.portfolioId)
        const group = lookups.groupName(t.groupId)
        const label = portfolio
          ? `Portfolio · ${portfolio}`
          : group
            ? `Group · ${group}`
            : 'Standalone'
        return (
          <HighlightedCell value={label} columnId={column.id}>
            <LongText className='text-neutral-1900 text-sm'>{label}</LongText>
          </HighlightedCell>
        )
      },
    },
    {
      accessorKey: 'employees',
      header: sortableHeader('Employees'),
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.employees.toLocaleString('en-US')}
        </span>
      ),
      size: 90,
    },
    {
      id: 'plan',
      accessorFn: (t) => t.subscription.tier,
      header: sortableHeader('Plan'),
      cell: ({ row, column }) => {
        const { subscription, employees } = row.original
        const label =
          subscription.tier[0].toUpperCase() + subscription.tier.slice(1)
        return (
          <HighlightedCell value={label} columnId={column.id}>
            <div className='flex min-w-0 flex-col'>
              <span className='text-neutral-1900 text-sm'>{label}</span>
              <span
                className={`text-paragraph-sm ${
                  employees >= subscription.employeeLimit
                    ? 'text-red-600'
                    : 'text-neutral-1000'
                }`}
              >
                {employees.toLocaleString('en-US')} /{' '}
                {subscription.employeeLimit.toLocaleString('en-US')} seats
              </span>
            </div>
          </HighlightedCell>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      meta: { requiresWholeWordMatch: true },
      header: sortableHeader('Status'),
      cell: ({ row, column }) => {
        const badge = statusTone[row.original.status]
        return (
          <div className='p-1.5'>
            <HighlightedCell value={badge.label} columnId={column.id}>
              <ToneBadge tone={badge.tone}>{badge.label}</ToneBadge>
            </HighlightedCell>
          </div>
        )
      },
      size: 90,
    },
    {
      accessorKey: 'createdAt',
      meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
      header: sortableHeader('Provisioned'),
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.createdAt}</span>
      ),
      size: 110,
    },
  ]
}
