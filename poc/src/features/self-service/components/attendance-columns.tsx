import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type AttendanceDay,
  type AttendanceRequest,
  type ShiftAssignment,
} from '../data/attendance'
import { StatusBadge } from './status-badge'
import { formatDate, formatDateTime } from './utils'

function selectColumn<T>(): ColumnDef<T> {
  return {
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
  }
}

/** Out-time / comp-off / overtime / WFH request list (ESS-18..21, ESS-39). */
export const attendanceRequestColumns: ColumnDef<AttendanceRequest>[] = [
  selectColumn<AttendanceRequest>(),
  { accessorKey: 'kind', header: 'Request type' },
  {
    accessorKey: 'fromDateTime',
    header: 'From',
    cell: ({ row }) => formatDateTime(row.original.fromDateTime),
  },
  {
    accessorKey: 'toDateTime',
    header: 'To',
    cell: ({ row }) => formatDateTime(row.original.toDateTime),
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => (
      <span className='block max-w-[260px] truncate'>{row.original.reason}</span>
    ),
  },
  { accessorKey: 'days', header: 'Days' },
  { accessorKey: 'hours', header: 'Hours' },
  {
    accessorKey: 'expiresOn',
    header: 'Valid till',
    cell: ({ row }) => formatDate(row.original.expiresOn),
  },
  {
    accessorKey: 'raisedOn',
    header: 'Raised on',
    cell: ({ row }) => formatDate(row.original.raisedOn),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

/** My shift assignments (ESS-22). */
export const shiftColumns: ColumnDef<ShiftAssignment>[] = [
  { accessorKey: 'shiftName', header: 'Shift name' },
  {
    accessorKey: 'fromDate',
    header: 'From date',
    cell: ({ row }) => formatDate(row.original.fromDate),
  },
  {
    accessorKey: 'endDate',
    header: 'End date',
    cell: ({ row }) => formatDate(row.original.endDate),
  },
  { accessorKey: 'startTime', header: 'Start time' },
  { accessorKey: 'endTime', header: 'End time' },
  { accessorKey: 'assignedBy', header: 'Assigned by' },
  {
    accessorKey: 'assignedDate',
    header: 'Assigned date',
    cell: ({ row }) => formatDate(row.original.assignedDate),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

/** Daily attendance detail with the work-category breakdown (ESS-23). */
export const attendanceDayColumns: ColumnDef<AttendanceDay>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.date),
  },
  { accessorKey: 'plannedWork', header: 'Planned work' },
  { accessorKey: 'actualStart', header: 'Actual start' },
  { accessorKey: 'actualEnd', header: 'Actual end' },
  { accessorKey: 'atWork', header: 'At work' },
  { accessorKey: 'breaks', header: 'Breaks' },
  { accessorKey: 'breakDuration', header: 'Break duration' },
  { accessorKey: 'effective', header: 'Effective' },
  { accessorKey: 'officialVisit', header: 'Official visit' },
  { accessorKey: 'clientLocation', header: 'Client location' },
  { accessorKey: 'personalOff', header: 'Personal off' },
  { accessorKey: 'workFromHome', header: 'WFH' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]
