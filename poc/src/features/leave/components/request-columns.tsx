import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LongText } from '@/components/common/long-text'
import { fmtDate } from '../data/shared'
import { pendingStep, type LeaveRequest } from '../data/requests'
import {
  ClarificationBadge,
  FmlaBadge,
  LopBadge,
  PeriodChangedBadge,
  StatusBadge,
  TentativeBadge,
} from './badges'

function sortableHeader(label: string) {
  return function Header({
    column,
  }: {
    column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }
  }) {
    return (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {label}
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    )
  }
}

/**
 * Shared request grid columns. `showEmployee` is used by manager/admin views;
 * the self-service view hides it.
 */
export function requestColumns(showEmployee: boolean): ColumnDef<LeaveRequest>[] {
  const cols: ColumnDef<LeaveRequest>[] = []

  if (showEmployee) {
    cols.push({
      accessorKey: 'employeeName',
      header: sortableHeader('Employee'),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 text-sm font-medium'>
            {row.original.employeeName}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.employeeCode} · {row.original.department}
          </span>
        </div>
      ),
    })
  }

  cols.push(
    {
      accessorKey: 'typeName',
      header: sortableHeader('Leave Type'),
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5'>
          <LongText className='text-neutral-1900 text-sm'>
            {row.original.typeName}
          </LongText>
          {row.original.fmla && <FmlaBadge />}
        </div>
      ),
    },
    {
      accessorKey: 'from',
      header: sortableHeader('Dates'),
      cell: ({ row }) => {
        const r = row.original
        const time =
          r.fromTime && r.toTime ? ` · ${r.fromTime}–${r.toTime}` : ''
        return (
          <span className='text-neutral-1900 text-sm'>
            {r.from === r.to
              ? `${fmtDate(r.from)}${time}`
              : `${fmtDate(r.from)} → ${fmtDate(r.to)}`}
          </span>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: sortableHeader('Amount'),
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className='flex items-center gap-1.5 text-sm'>
            <span>
              {r.amount} {r.unit}
            </span>
            {r.lopAmount > 0 && <LopBadge amount={r.lopAmount} unit={r.unit} />}
          </div>
        )
      },
    },
    {
      id: 'flags',
      header: () => <span className='text-sm font-medium'>Flags</span>,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className='flex flex-wrap items-center gap-1'>
            {r.tentative && <TentativeBadge />}
            <ClarificationBadge
              count={r.clarifications.length}
              open={r.clarifications.some((c) => c.answer === null)}
            />
            {r.periodChangedByApprover && <PeriodChangedBadge />}
            {r.onBehalfOf && (
              <span className='text-neutral-1000 text-xs'>
                via {r.onBehalfOf}
              </span>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'pendingWith',
      header: () => <span className='text-sm font-medium'>Pending With</span>,
      cell: ({ row }) => {
        const r = row.original
        if (r.status === 'needs-clarification')
          return (
            <span className='text-vanilla-500 text-sm'>
              Applicant (clarification)
            </span>
          )
        if (r.status !== 'pending')
          return <span className='text-neutral-1000 text-sm'>—</span>
        const step = pendingStep(r.steps)
        return (
          <span className='text-neutral-1900 text-sm'>
            {step ? `${step.approver} (L${step.level})` : '—'}
            {step?.escalated && (
              <span className='text-red-1400 ml-1 text-xs'>escalated</span>
            )}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: sortableHeader('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    }
  )

  return cols
}
