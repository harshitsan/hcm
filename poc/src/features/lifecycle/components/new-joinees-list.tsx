import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type OnboardingCase } from '../data/onboarding'
import { DEPARTMENTS, fmtDate } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

/**
 * Joining-formalities status derived from the onboarding case — the New
 * Joinees report vocabulary (Pending initiation / In Progress / Completed).
 */
export function joineeStatus(c: OnboardingCase) {
  if (c.status === 'completed') return 'completed'
  if (!c.offerAccepted) return 'pending-initiation'
  return 'in-progress'
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-initiation', label: 'Pending Initiation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const newJoineeColumns: ColumnDef<OnboardingCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => (
      <SortHeader column={column} label='Candidate name' />
    ),
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <SortHeader column={column} label='Department' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.department}
      </span>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <SortHeader column={column} label='Location' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.location}</span>
    ),
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => (
      <SortHeader column={column} label='Date of joining' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.startDate)}</span>
    ),
  },
  {
    accessorKey: 'currentStage',
    header: ({ column }) => <SortHeader column={column} label='Stage' />,
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.currentStage}</Badge>
    ),
  },
  {
    id: 'joineeStatus',
    header: () => <span className='text-paragraph-sm font-medium'>Status</span>,
    cell: ({ row }) => <StatusBadge status={joineeStatus(row.original)} />,
  },
]

interface NewJoineesListProps {
  cases: OnboardingCase[]
  onSelect: (id: string) => void
}

/**
 * New Joinees report — a filtered view over the onboarding grid with the
 * joining period, status and department filters of the New Joinees screen.
 */
export function NewJoineesList({ cases, onSelect }: NewJoineesListProps) {
  const [status, setStatus] = useState('all')
  const [department, setDepartment] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const data = useMemo(
    () =>
      cases.filter(
        (c) =>
          (status === 'all' || joineeStatus(c) === status) &&
          (department === 'all' || c.department === department) &&
          (from === '' || c.startDate >= from) &&
          (to === '' || c.startDate <= to)
      ),
    [cases, department, from, status, to]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Input
          type='date'
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className='h-7 w-[150px]'
          aria-label='Joining from'
        />
        <Input
          type='date'
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className='h-7 w-[150px]'
          aria-label='Joining to'
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            setStatus('all')
            setDepartment('all')
            setFrom('')
            setTo('')
            toast.info('New joinee filters cleared')
          }}
        >
          Reset
        </Button>
      </div>

      <DataTable
        columns={newJoineeColumns}
        data={data}
        variant='no-status'
        onRowClick={(row: OnboardingCase) => onSelect(row.id)}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Joinees within the selected joining period — click a row to open the
        onboarding case workspace.
      </p>
    </div>
  )
}
