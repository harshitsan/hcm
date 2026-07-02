import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Policy } from '../data/policies'
import {
  currentVersion,
  formatDate,
  policyStatus,
  scopeSummary,
  type PolicyStatus,
} from '../data/policy-utils'
import { PolicyStatusBadge, PolicyTypeBadge } from './policy-badges'

/** Flattened view-model over Policy + its version currently in force. */
export interface PolicyRow {
  policy: Policy
  name: string
  type: Policy['type']
  edition: string
  status: PolicyStatus
  applicability: string
  excludedLevels: string[]
  effectiveFrom: string | null
  effectiveTill: string | null
  versionLabel: string
  owner: string
}

export function buildPolicyRow(policy: Policy): PolicyRow {
  const inForce = currentVersion(policy)
  const latest = policy.versions[policy.versions.length - 1]
  const shown = inForce ?? latest
  return {
    policy,
    name: policy.name,
    type: policy.type,
    edition: shown?.editionName ?? '—',
    status: policyStatus(policy),
    applicability: scopeSummary(policy.scope),
    excludedLevels: policy.scope.excludedPositionLevels,
    effectiveFrom: shown?.effectiveFrom ?? null,
    effectiveTill: shown?.effectiveTill ?? null,
    versionLabel: shown ? `v${shown.version} of ${policy.versions.length}` : '—',
    owner: `${policy.ownerLevel} · ${policy.ownerName}`,
  }
}

export const policiesTableColumns: ColumnDef<PolicyRow>[] = [
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
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Policy'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Policy
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.name} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.edition} · {row.original.policy.category}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'type',
    size: 60,
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Type'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row }) => (
      <div className='p-1.5'>
        <PolicyTypeBadge type={row.original.type} />
      </div>
    ),
  },
  {
    accessorKey: 'applicability',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Applicability'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Applicability
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.applicability} columnId={column.id}>
        <LongText className='text-neutral-1900 max-w-[260px] text-sm'>
          {row.original.applicability}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    id: 'excludedLevels',
    header: () => (
      <span className='text-neutral-2100 text-sm font-medium'>
        Excluded position level(s)
      </span>
    ),
    cell: ({ row }) => {
      const levels = row.original.excludedLevels
      if (levels.length === 0)
        return <span className='text-neutral-1000 text-sm'>—</span>
      return (
        <div className='flex flex-wrap gap-1'>
          {levels.map((level) => (
            <Badge key={level} variant='disqualified'>
              {level.split(' — ')[0]}
            </Badge>
          ))}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'effectiveFrom',
    size: 90,
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Effective from
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {formatDate(row.original.effectiveFrom)}
      </span>
    ),
  },
  {
    accessorKey: 'effectiveTill',
    size: 90,
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Effective till
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.effectiveTill
          ? formatDate(row.original.effectiveTill)
          : 'Open-ended'}
      </span>
    ),
  },
  {
    accessorKey: 'versionLabel',
    size: 70,
    header: () => (
      <span className='text-neutral-2100 text-sm font-medium'>Version</span>
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.versionLabel}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    id: 'status',
    size: 60,
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='p-1.5'>
        <PolicyStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'owner',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Owner'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Owner
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.owner} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.owner}
        </LongText>
      </HighlightedCell>
    ),
  },
]
