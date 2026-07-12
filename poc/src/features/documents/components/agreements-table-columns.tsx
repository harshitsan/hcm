import type { ColumnDef } from '@tanstack/react-table'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SortableHeader } from '@/components/common/data-table/table-helpers'
import { LongText } from '@/components/common/long-text'
import { type Agreement, type AgreementStatus } from '../data/agreements'
import { AgreementStatusBadge } from './agreement-badges'

/** Grid row: an agreement plus its derived expiry-aware status. */
export type AgreementRow = Agreement & { effectiveStatus: AgreementStatus }

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtDate = (iso: string | undefined) =>
  iso ? dateFmt.format(new Date(`${iso}T00:00:00`)) : '—'

export const agreementsTableColumns: ColumnDef<AgreementRow>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => <SortableHeader column={column} label='Agreement' />,
    cell: ({ row, column }) => {
      const a = row.original
      return (
        <HighlightedCell value={a.type} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {a.type}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {a.id.toUpperCase()} · {a.templateName}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortableHeader column={column} label='Employee' />,
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.employeeName} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1900 text-sm'>
            {row.original.employeeName}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.employeeId}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'effectiveStatus',
    header: ({ column }) => <SortableHeader column={column} label='Status' />,
    cell: ({ row }) => (
      <AgreementStatusBadge status={row.original.effectiveStatus} />
    ),
  },
  {
    accessorKey: 'validUntil',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: ({ column }) => (
      <SortableHeader column={column} label='Valid until' />
    ),
    cell: ({ row, column }) => {
      const a = row.original
      return (
        <HighlightedCell
          value={a.validUntil ? fmtDate(a.validUntil) : 'No expiry'}
          columnId={column.id}
        >
          <div className='flex min-w-0 flex-col'>
            <span className='text-sm'>
              {a.validUntil ? fmtDate(a.validUntil) : 'No expiry'}
            </span>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              from {fmtDate(a.validFrom)} · {a.expiryRule}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    id: 'acknowledgment',
    accessorFn: (row) =>
      row.acknowledgment.required
        ? row.acknowledgment.acknowledgedOn
          ? 'Acknowledged'
          : 'Awaiting employee'
        : 'Not required',
    header: ({ column }) => (
      <SortableHeader column={column} label='Acknowledgment' />
    ),
    cell: ({ row }) => {
      const ack = row.original.acknowledgment
      return (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>
            {ack.required
              ? ack.acknowledgedOn
                ? `Acknowledged ${fmtDate(ack.acknowledgedOn)}`
                : 'Awaiting employee'
              : 'Not required'}
          </span>
        </div>
      )
    },
  },
]
