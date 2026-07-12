import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Timer } from 'phosphor-react'
import { Link } from '@tanstack/react-router'
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
import { SimpleTable } from '@/components/common/data-table/simple-table'
import { useFlowRuns, type FlowRun } from '../hooks/use-flow-runs'
import { LongText } from '@/components/common/long-text'
import type { Role } from '@/context/role-context'
import type { AuditEvent } from '../data/audit'
import type { WorkflowDefinition } from '../data/definitions'
import type { WorkflowInstance } from '../data/instances'
import type { ApprovalTask } from '../data/instances'
import { requestModuleTab } from '../data/module-nav'
import type { RoutingRule } from '../data/routing'
import {
  CURRENT_APPROVER,
  ESCALATION_LABELS,
  TRANSACTION_TYPES,
} from '../data/shared'
import type { InstancesStore } from '../hooks/use-instances'
import { useInboxRows } from './approval-inbox'
import { InstanceStatusBadge } from './badges'
import { InstanceDetailSheet } from './instance-detail-sheet'
import { StartRequestDialog } from './start-request-dialog'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'
import { WorkflowChip } from './workflow-chip'

/**
 * Real-time SLA tracking bar (F6): elapsed vs the stage SLA with tick markers
 * at the 50% / 75% reminder thresholds and the 100% escalation threshold.
 * Colour shifts neutral → amber (50) → orange (75) → red (100); past 100% the
 * request shows an "Escalated" chip with the configured strategy.
 */
function SlaProgress({
  percent,
  escalated,
  strategy,
}: {
  percent: number | null
  escalated: boolean
  strategy: string
}) {
  if (percent === null)
    return <span className='text-neutral-1000 text-xs'>—</span>
  const fill =
    percent >= 100
      ? 'bg-red-500'
      : percent >= 75
        ? 'bg-orange-500'
        : percent >= 50
          ? 'bg-amber-500'
          : 'bg-emerald-500'
  return (
    <div className='flex min-w-[130px] flex-col gap-1'>
      <div className='relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200'>
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        {[50, 75, 100].map((tick) => (
          <span
            key={tick}
            className='absolute top-0 h-full w-px bg-white/90'
            style={{ left: `${tick}%` }}
            aria-hidden
          />
        ))}
      </div>
      <div className='flex items-center gap-1.5'>
        <span className='text-neutral-1000 text-xs'>
          {percent}% of SLA used
        </span>
        {(escalated || percent >= 100) && (
          <span className='inline-flex items-center rounded-full bg-red-100 px-1.5 py-px text-[11px] font-medium whitespace-nowrap text-red-700'>
            Escalated — {strategy}
          </span>
        )}
      </div>
    </div>
  )
}

function instanceColumns(
  slaForInstance: (id: string) => number | null,
  tasks: ApprovalTask[]
): ColumnDef<WorkflowInstance>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <SortableHeader column={column} label='Request' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.title}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.requester} · {row.original.company}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: ({ column }) => <SortableHeader column={column} label='Type' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.transactionType}
        </span>
      ),
    },
    {
      accessorKey: 'definitionName',
      header: ({ column }) => (
        <SortableHeader column={column} label='Linked workflow' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.definitionName} v{row.original.definitionVersion}
        </span>
      ),
    },
    {
      id: 'stage',
      header: () => <span className='text-paragraph-sm font-medium'>Stage</span>,
      cell: ({ row }) => {
        const inst = row.original
        const stage = inst.stages[inst.currentStageIndex]
        return (
          <span className='text-neutral-1900 text-sm'>
            {inst.currentStageIndex + 1}/{inst.stages.length} — {stage?.name}
          </span>
        )
      },
    },
    {
      id: 'sla',
      header: () => (
        <span className='text-paragraph-sm font-medium'>SLA health</span>
      ),
      cell: ({ row }) => {
        const inst = row.original
        const percent = slaForInstance(inst.id)
        const escalated = tasks.some(
          (t) =>
            t.instanceId === inst.id &&
            (t.status === 'escalated' ||
              (t.status === 'pending' &&
                t.via !== 'normal' &&
                t.via !== 'delegated'))
        )
        const stage = inst.stages[inst.currentStageIndex]
        return (
          <SlaProgress
            percent={percent}
            escalated={escalated}
            strategy={
              stage ? ESCALATION_LABELS[stage.escalation] : 'Manager escalation'
            }
          />
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label='Status' />,
      cell: ({ row }) => (
        <div className='p-1.5'>
          <InstanceStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: 'startedAt',
      header: ({ column }) => <SortableHeader column={column} label='Started' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.startedAt}
        </span>
      ),
    },
  ]
}

/**
 * Running approvals monitoring: request summary, real-time SLA tracking
 * (WFE-11) with a simulated business-hours clock (WFE-09, WFE-10, WFE-14),
 * routed initiation (WFE-02) and full instance drill-down (WFE-20, WFE-21).
 * Approve / reject / delegate actions live in the approval inbox on the
 * Tasks & Notifications page — same shared engine store.
 */
export function InstancesTab({
  store,
  rules,
  definitions,
  events,
  companies,
  role,
}: {
  store: InstancesStore
  rules: RoutingRule[]
  definitions: WorkflowDefinition[]
  events: AuditEvent[]
  companies: string[]
  role: Role
}) {
  const { instances, tasks, slaForInstance, tickSla, startInstance } = store

  const canAdmin = role === 'Company Admin'

  const scopedInstances = useMemo(
    () => instances.filter((i) => companies.includes(i.company)),
    [instances, companies]
  )

  const inboxRows = useInboxRows(store, role, companies)

  const [startOpen, setStartOpen] = useState(false)
  const [detail, setDetail] = useState<WorkflowInstance | null>(null)

  // Baseline toolbar filters: status / type / company + free-text search.
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  const filteredInstances = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedInstances
      .filter((i) => statusFilter === 'all' || i.status === statusFilter)
      .filter((i) => typeFilter === 'all' || i.transactionType === typeFilter)
      .filter((i) => companyFilter === 'all' || i.company === companyFilter)
      .filter(
        (i) =>
          q === '' ||
          i.title.toLowerCase().includes(q) ||
          i.requester.toLowerCase().includes(q) ||
          i.definitionName.toLowerCase().includes(q)
      )
  }, [scopedInstances, statusFilter, typeFilter, companyFilter, search])

  const summary = useMemo(() => {
    const atRisk = inboxRows.filter((r) => r.task.slaPercent >= 75).length
    return [
      {
        label: 'In progress',
        value: scopedInstances.filter((i) => i.status === 'in-progress').length,
      },
      { label: 'Pending approval tasks', value: inboxRows.length },
      { label: 'At risk / breached SLA', value: atRisk },
      {
        label: 'Completed',
        value: scopedInstances.filter((i) => i.status !== 'in-progress').length,
      },
    ]
  }, [scopedInstances, inboxRows])

  const instanceCols = useMemo(
    () => instanceColumns(slaForInstance, tasks),
    [slaForInstance, tasks]
  )

  // The detail sheet must reflect live engine state, not a stale snapshot.
  const liveDetail = detail
    ? (instances.find((i) => i.id === detail.id) ?? null)
    : null

  // A7: engine-linked flow runs from the external store.
  const { runs: flowRuns } = useFlowRuns()

  const flowRunCols = useMemo<ColumnDef<FlowRun>[]>(
    () => [
      {
        accessorKey: 'artifactName',
        header: () => <span className='text-paragraph-sm font-medium'>Flow</span>,
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5'>
            <span className='text-neutral-1600 text-sm font-medium'>
              {row.original.artifactName}
            </span>
            {row.original.artifactId && (
              <WorkflowChip artifactId={row.original.artifactId} />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'event',
        header: () => <span className='text-paragraph-sm font-medium'>Event</span>,
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm'>{row.original.event}</span>
        ),
      },
      {
        accessorKey: 'summary',
        header: () => <span className='text-paragraph-sm font-medium'>Summary</span>,
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm'>{row.original.summary}</span>
        ),
      },
      {
        accessorKey: 'requester',
        header: () => <span className='text-paragraph-sm font-medium'>Requester</span>,
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm'>{row.original.requester}</span>
        ),
      },
      {
        accessorKey: 'startedAt',
        header: () => <span className='text-paragraph-sm font-medium'>Started</span>,
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm'>{row.original.startedAt}</span>
        ),
      },
      {
        id: 'steps',
        header: () => <span className='text-paragraph-sm font-medium'>Steps</span>,
        cell: ({ row }) => (
          <span className='text-neutral-1900 text-sm'>{row.original.steps.length}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <span className='text-paragraph-sm font-medium'>Status</span>,
        cell: () => (
          <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>
            Completed
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Approvals at a glance' items={summary} />

      <p className='text-paragraph-sm text-neutral-1000 mb-4'>
        Pending approvals are actioned from{' '}
        <Link
          to='/notifications'
          onClick={() => requestModuleTab('/notifications', 'tasks')}
          className='text-blue-700 underline underline-offset-2 hover:text-blue-800'
        >
          Tasks &amp; Notifications
        </Link>
        {' '}— this page tracks how each request moves through its workflow.
      </p>

      <SectionToolbar
        title={`Workflow instances (${filteredInstances.length}${
          filteredInstances.length !== scopedInstances.length
            ? ` of ${scopedInstances.length}`
            : ''
        })`}
      />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search requests'
            className='h-7 w-[180px]'
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='in-progress'>In progress</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companies.length > 1 && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {canAdmin && (
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='h-7'
              onClick={tickSla}
            >
              <Timer size={12} weight='bold' />
              Advance SLA clock +25%
            </Button>
            <Button
              variant='red'
              onClick={() => setStartOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Request
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={instanceCols}
        data={filteredInstances}
        variant='no-status'
        onRowClick={(row) => setDetail(row)}
      />

      {/* A7: engine-linked flow runs (new external store — does not touch
           the shared useInstances engine above). */}
      {flowRuns.length > 0 && (
        <div className='mt-6'>
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <p className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
              Engine-linked flow runs ({flowRuns.length})
            </p>
            <SimpleTable
              columns={flowRunCols}
              data={flowRuns}
              getRowId={(row) => row.id}
              emptyMessage='No flow runs yet'
            />
          </div>
        </div>
      )}

      <StartRequestDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        companies={companies}
        rules={rules}
        defaultRequester={CURRENT_APPROVER}
        onStart={(input) => startInstance(input, rules, definitions)}
      />

      <InstanceDetailSheet
        instance={liveDetail}
        events={events}
        tasks={tasks}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      />
    </div>
  )
}
