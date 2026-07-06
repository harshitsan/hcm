import type { ColumnDef } from '@tanstack/react-table'
import { WEEK_DAYS, type KtTask } from '../data/knowledge-transfer'
import { fmtDate } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

/** Su–Sa day-wise plan: highlights days with scheduled handover hours. */
export function WeekBreakdown({ week }: { week: KtTask['week'] }) {
  return (
    <div className='flex gap-1'>
      {WEEK_DAYS.map((day, i) => (
        <span
          key={day}
          title={`${day}: ${week[i]} hr`}
          className={`flex h-7 w-7 flex-col items-center justify-center rounded border text-[9px] leading-tight ${
            week[i] > 0
              ? 'border-blue-600/40 bg-blue-50 font-medium text-blue-700'
              : 'text-neutral-1000 border-gray-200 bg-white'
          }`}
        >
          {day}
          <span>{week[i] > 0 ? `${week[i]}h` : '—'}</span>
        </span>
      ))}
    </div>
  )
}

function personCell(name: string, active: boolean) {
  return (
    <div className='flex min-w-0 flex-col'>
      <span className='text-neutral-1600 font-medium'>{name}</span>
      <span className='text-neutral-1000 text-xs'>
        {active ? 'Active employee' : 'Inactive employee'}
      </span>
    </div>
  )
}

const taskCol: ColumnDef<KtTask> = {
  accessorKey: 'task',
  header: ({ column }) => <SortHeader column={column} label='KT Task' />,
  cell: ({ row }) => (
    <div className='flex min-w-0 max-w-[260px] flex-col'>
      <span className='text-neutral-1600 truncate font-medium'>
        {row.original.task}
      </span>
      <span className='text-neutral-1000 text-xs'>{row.original.id}</span>
    </div>
  ),
}

const departmentCol: ColumnDef<KtTask> = {
  accessorKey: 'department',
  header: ({ column }) => <SortHeader column={column} label='Department' />,
  cell: ({ row }) => <span className='text-sm'>{row.original.department}</span>,
}

const periodCol: ColumnDef<KtTask> = {
  accessorKey: 'startDate',
  header: ({ column }) => <SortHeader column={column} label='Period' />,
  cell: ({ row }) => (
    <span className='text-sm'>
      {fmtDate(row.original.startDate)} → {fmtDate(row.original.endDate)}
    </span>
  ),
}

const statusCol: ColumnDef<KtTask> = {
  accessorKey: 'status',
  header: ({ column }) => <SortHeader column={column} label='Status' />,
  cell: ({ row }) => <StatusBadge status={row.original.status} />,
}

const weekCol: ColumnDef<KtTask> = {
  id: 'week',
  header: () => <span className='text-xs font-medium'>Weekly plan (Su–Sa)</span>,
  cell: ({ row }) => <WeekBreakdown week={row.original.week} />,
}

/** Manager grid — shows both sides of the handover. */
export const ktTaskColumns: ColumnDef<KtTask>[] = [
  taskCol,
  {
    accessorKey: 'provider',
    header: ({ column }) => <SortHeader column={column} label='Provided by' />,
    cell: ({ row }) =>
      personCell(row.original.provider, row.original.providerActive),
  },
  {
    accessorKey: 'receiver',
    header: ({ column }) => <SortHeader column={column} label='Received by' />,
    cell: ({ row }) =>
      personCell(row.original.receiver, row.original.receiverActive),
  },
  departmentCol,
  periodCol,
  statusCol,
]

/** Employee "to be provided by me" grid — counterpart + Su–Sa breakdown. */
export const ktProvidedColumns: ColumnDef<KtTask>[] = [
  taskCol,
  {
    accessorKey: 'receiver',
    header: ({ column }) => <SortHeader column={column} label='Handing over to' />,
    cell: ({ row }) =>
      personCell(row.original.receiver, row.original.receiverActive),
  },
  departmentCol,
  periodCol,
  statusCol,
  weekCol,
]

/** Employee "to be received by me" grid — counterpart + Su–Sa breakdown. */
export const ktReceivedColumns: ColumnDef<KtTask>[] = [
  taskCol,
  {
    accessorKey: 'provider',
    header: ({ column }) => <SortHeader column={column} label='Receiving from' />,
    cell: ({ row }) =>
      personCell(row.original.provider, row.original.providerActive),
  },
  departmentCol,
  periodCol,
  statusCol,
  weekCol,
]
