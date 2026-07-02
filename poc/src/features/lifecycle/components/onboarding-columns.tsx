import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  ONBOARDING_STAGES,
  type OnboardingCase,
} from '../data/onboarding'
import { fmtDate } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

export const onboardingColumns: ColumnDef<OnboardingCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode}
          {!row.original.portalUser && ' · Non-User (admin proxy)'}
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
    accessorKey: 'company',
    header: ({ column }) => <SortHeader column={column} label='Company' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
    ),
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => <SortHeader column={column} label='Start date' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.startDate)}</span>
    ),
  },
  {
    accessorKey: 'templateVersion',
    header: ({ column }) => <SortHeader column={column} label='Template' />,
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.templateVersion}</Badge>
    ),
  },
  {
    accessorKey: 'currentStage',
    header: ({ column }) => <SortHeader column={column} label='Stage' />,
    cell: ({ row }) => {
      const idx = ONBOARDING_STAGES.indexOf(row.original.currentStage)
      const done = row.original.status === 'completed'
      return (
        <div className='flex items-center gap-2'>
          <Badge variant={done ? 'completed' : 'open'}>
            {row.original.currentStage}
          </Badge>
          <span className='text-neutral-1000 text-xs'>
            {done ? '5/5' : `${idx}/5`}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]
