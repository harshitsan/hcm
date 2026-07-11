import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  slaState,
  TASK_VIA_LABELS,
  type ApprovalTask,
  type WorkflowInstance,
} from '../data/instances'
import type { TransactionType } from '../data/shared'
import type { InstancesStore } from '../hooks/use-instances'
import { InstanceStatusBadge, SlaBadge } from './badges'
import { SectionToolbar, SortableHeader } from './table-helpers'
import { SummaryCards } from './summary-cards'

/** Consuming module per transaction type — drives the volume report. */
const TYPE_MODULE: Record<TransactionType, string> = {
  'Leave Request': 'Leave Management',
  Overtime: 'Time & Attendance',
  'Comp Off': 'Time & Attendance',
  'Attendance Change': 'Time & Attendance',
  'Work From Home': 'Time & Attendance',
  'Expense Claim': 'Self Service',
  'Exit Clearance': 'Employee Lifecycle',
  Confirmation: 'Employee Lifecycle',
  'Disciplinary Action': 'Employee Lifecycle',
  Layoff: 'Employee Lifecycle',
}

/** Whole days between two YYYY-MM-DD dates (never negative). */
function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Blob + URL.createObjectURL + anchor download — custom-fields CSV pattern. */
function downloadCsv(header: string[], lines: string[][], filename: string) {
  const csv = [
    header.join(','),
    ...lines.map((cells) =>
      cells.map((c) => c.replaceAll(',', ';')).join(',')
    ),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`Exported ${lines.length} row${lines.length === 1 ? '' : 's'}`)
}

interface CycleRow {
  instance: WorkflowInstance
  cycleDays: number | null
}

interface BreachRow {
  task: ApprovalTask
  instance: WorkflowInstance
}

interface VolumeRow {
  module: string
  total: number
  inProgress: number
  approved: number
  rejected: number
}

const CYCLE_COLUMNS: ColumnDef<CycleRow>[] = [
  {
    id: 'title',
    accessorFn: (row) => row.instance.title,
    header: ({ column }) => <SortableHeader column={column} label='Request' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.instance.title}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.instance.requester} · {row.original.instance.company}
        </span>
      </div>
    ),
  },
  {
    id: 'type',
    accessorFn: (row) => row.instance.transactionType,
    header: ({ column }) => <SortableHeader column={column} label='Type' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.instance.transactionType}
      </span>
    ),
  },
  {
    id: 'started',
    accessorFn: (row) => row.instance.startedAt,
    header: ({ column }) => <SortableHeader column={column} label='Started' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.instance.startedAt}
      </span>
    ),
  },
  {
    id: 'completed',
    accessorFn: (row) => row.instance.completedAt ?? '',
    header: ({ column }) => (
      <SortableHeader column={column} label='Completed' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.instance.completedAt ?? '—'}
      </span>
    ),
  },
  {
    id: 'cycle',
    accessorFn: (row) => row.cycleDays ?? -1,
    header: ({ column }) => (
      <SortableHeader column={column} label='Cycle time' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.cycleDays === null
          ? 'still running'
          : `${row.original.cycleDays} day${row.original.cycleDays === 1 ? '' : 's'}`}
      </span>
    ),
  },
  {
    id: 'status',
    accessorFn: (row) => row.instance.status,
    header: ({ column }) => <SortableHeader column={column} label='Status' />,
    cell: ({ row }) => (
      <div className='p-1.5'>
        <InstanceStatusBadge status={row.original.instance.status} />
      </div>
    ),
  },
]

const BREACH_COLUMNS: ColumnDef<BreachRow>[] = [
  {
    id: 'title',
    accessorFn: (row) => row.instance.title,
    header: ({ column }) => <SortableHeader column={column} label='Request' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.instance.title}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.instance.transactionType} ·{' '}
          {row.original.instance.company}
        </span>
      </div>
    ),
  },
  {
    id: 'stage',
    accessorFn: (row) => row.task.stageName,
    header: ({ column }) => <SortableHeader column={column} label='Stage' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.task.stageName}
      </span>
    ),
  },
  {
    id: 'approver',
    accessorFn: (row) => row.task.approver,
    header: ({ column }) => <SortableHeader column={column} label='Approver' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm'>
          {row.original.task.approver}
        </span>
        {row.original.task.escalatedFrom && (
          <span className='text-paragraph-sm text-neutral-1000'>
            from {row.original.task.escalatedFrom}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'via',
    accessorFn: (row) => TASK_VIA_LABELS[row.task.via],
    header: ({ column }) => (
      <SortableHeader column={column} label='Assigned via' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {TASK_VIA_LABELS[row.original.task.via]}
      </span>
    ),
  },
  {
    id: 'sla',
    accessorFn: (row) => row.task.slaPercent,
    header: ({ column }) => (
      <SortableHeader column={column} label='SLA consumed' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2 p-1'>
        <SlaBadge percent={row.original.task.slaPercent} />
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.task.slaPercent}% of {row.original.task.slaHours}h
        </span>
      </div>
    ),
  },
  {
    id: 'assigned',
    accessorFn: (row) => row.task.assignedAt,
    header: ({ column }) => <SortableHeader column={column} label='Assigned' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.task.assignedAt}
      </span>
    ),
  },
]

const VOLUME_COLUMNS: ColumnDef<VolumeRow>[] = [
  {
    accessorKey: 'module',
    header: ({ column }) => <SortableHeader column={column} label='Module' />,
    cell: ({ row }) => (
      <span className='text-neutral-1600 text-sm font-medium'>
        {row.original.module}
      </span>
    ),
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <SortableHeader column={column} label='Requests' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.total}</span>
    ),
  },
  {
    accessorKey: 'inProgress',
    header: ({ column }) => (
      <SortableHeader column={column} label='In progress' />
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.inProgress}
      </span>
    ),
  },
  {
    accessorKey: 'approved',
    header: ({ column }) => <SortableHeader column={column} label='Approved' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.approved}</span>
    ),
  },
  {
    accessorKey: 'rejected',
    header: ({ column }) => <SortableHeader column={column} label='Rejected' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.rejected}</span>
    ),
  },
]

/**
 * Reports — mock-computed read models over the live engine store
 * (per-module reporting deliverable, 00-CONVENTIONS.md §8): approval cycle
 * times, SLA breaches and request volume by consuming module, each
 * exportable as CSV.
 */
export function ReportsTab({
  store,
  companies,
}: {
  store: InstancesStore
  companies: string[]
}) {
  const { instances, tasks } = store

  const scoped = useMemo(
    () => instances.filter((i) => companies.includes(i.company)),
    [instances, companies]
  )
  const scopedIds = useMemo(() => new Set(scoped.map((i) => i.id)), [scoped])

  const cycleRows = useMemo<CycleRow[]>(
    () =>
      scoped.map((instance) => ({
        instance,
        cycleDays: instance.completedAt
          ? daysBetween(instance.startedAt, instance.completedAt)
          : null,
      })),
    [scoped]
  )

  // A breach = any task that hit 100% SLA, or was escalated away because of it.
  const breachRows = useMemo<BreachRow[]>(
    () =>
      tasks
        .filter(
          (t) =>
            scopedIds.has(t.instanceId) &&
            (slaState(t.slaPercent) === 'breached' || t.status === 'escalated')
        )
        .map((task) => {
          const instance = scoped.find((i) => i.id === task.instanceId)
          return instance ? { task, instance } : null
        })
        .filter((row): row is BreachRow => row !== null),
    [tasks, scoped, scopedIds]
  )

  const volumeRows = useMemo<VolumeRow[]>(() => {
    const byModule = new Map<string, VolumeRow>()
    for (const i of scoped) {
      const module = TYPE_MODULE[i.transactionType] ?? 'Other'
      const row =
        byModule.get(module) ??
        ({ module, total: 0, inProgress: 0, approved: 0, rejected: 0 } as VolumeRow)
      row.total += 1
      if (i.status === 'in-progress') row.inProgress += 1
      if (i.status === 'approved') row.approved += 1
      if (i.status === 'rejected') row.rejected += 1
      byModule.set(module, row)
    }
    return [...byModule.values()].sort((a, b) => b.total - a.total)
  }, [scoped])

  const summary = useMemo(() => {
    const completed = cycleRows.filter((r) => r.cycleDays !== null)
    const avg =
      completed.length === 0
        ? null
        : completed.reduce((sum, r) => sum + (r.cycleDays ?? 0), 0) /
          completed.length
    return [
      { label: 'Requests tracked', value: scoped.length },
      {
        label: 'Avg approval cycle',
        value: avg === null ? '—' : `${avg.toFixed(1)}d`,
      },
      { label: 'SLA breaches', value: breachRows.length },
      { label: 'Modules with volume', value: volumeRows.length },
    ]
  }, [scoped, cycleRows, breachRows, volumeRows])

  const exportCycle = () =>
    downloadCsv(
      ['Request', 'Requester', 'Company', 'Type', 'Started', 'Completed', 'Cycle days', 'Status'],
      cycleRows.map((r) => [
        r.instance.title,
        r.instance.requester,
        r.instance.company,
        r.instance.transactionType,
        r.instance.startedAt,
        r.instance.completedAt ?? '',
        r.cycleDays === null ? '' : String(r.cycleDays),
        r.instance.status,
      ]),
      'workflow-cycle-times.csv'
    )

  const exportBreaches = () =>
    downloadCsv(
      ['Request', 'Company', 'Stage', 'Approver', 'Escalated from', 'Assigned via', 'SLA %', 'SLA hours', 'Assigned'],
      breachRows.map((r) => [
        r.instance.title,
        r.instance.company,
        r.task.stageName,
        r.task.approver,
        r.task.escalatedFrom ?? '',
        TASK_VIA_LABELS[r.task.via],
        String(r.task.slaPercent),
        String(r.task.slaHours),
        r.task.assignedAt,
      ]),
      'workflow-sla-breaches.csv'
    )

  const exportVolume = () =>
    downloadCsv(
      ['Module', 'Requests', 'In progress', 'Approved', 'Rejected'],
      volumeRows.map((r) => [
        r.module,
        String(r.total),
        String(r.inProgress),
        String(r.approved),
        String(r.rejected),
      ]),
      'workflow-volume-by-module.csv'
    )

  const exportButton = (onClick: () => void) => (
    <Button variant='outline' size='sm' className='h-7 gap-1' onClick={onClick}>
      <DownloadSimple size={12} weight='bold' />
      Export CSV
    </Button>
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Engine reporting at a glance' items={summary} />

      <p className='text-paragraph-sm text-neutral-1000 mb-4'>
        Read-only reports computed live from the engine&apos;s requests and
        approval tasks — use &quot;Advance SLA clock&quot; on the Requests tab
        to see breaches accrue.
      </p>

      <div className='flex flex-col gap-6'>
        <section>
          <SectionToolbar title={`Approval cycle times (${cycleRows.length})`}>
            {exportButton(exportCycle)}
          </SectionToolbar>
          <DataTable columns={CYCLE_COLUMNS} data={cycleRows} variant='no-status' />
        </section>

        <section>
          <SectionToolbar title={`SLA breaches (${breachRows.length})`}>
            {exportButton(exportBreaches)}
          </SectionToolbar>
          <DataTable columns={BREACH_COLUMNS} data={breachRows} variant='no-status' />
        </section>

        <section>
          <SectionToolbar title={`Request volume by module (${volumeRows.length})`}>
            {exportButton(exportVolume)}
          </SectionToolbar>
          <DataTable columns={VOLUME_COLUMNS} data={volumeRows} variant='no-status' />
        </section>
      </div>
    </div>
  )
}
