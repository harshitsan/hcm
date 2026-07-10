import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Timer } from 'phosphor-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { SimpleTable } from '@/components/common/data-table/simple-table'
import { useFlowRuns, type FlowRun } from '../hooks/use-flow-runs'
import { LongText } from '@/components/common/long-text'
import type { Role } from '@/context/role-context'
import type { AuditEvent } from '../data/audit'
import type { WorkflowDefinition } from '../data/definitions'
import type { WorkflowInstance } from '../data/instances'
import { requestModuleTab } from '../data/module-nav'
import type { RoutingRule } from '../data/routing'
import { CURRENT_APPROVER } from '../data/shared'
import type { InstancesStore } from '../hooks/use-instances'
import { useInboxRows } from './approval-inbox'
import { InstanceStatusBadge, SlaBadge } from './badges'
import { InstanceDetailSheet } from './instance-detail-sheet'
import { StartRequestDialog } from './start-request-dialog'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'
import { WorkflowChip } from './workflow-chip'

function instanceColumns(
  slaForInstance: (id: string) => number | null
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
        <SortableHeader column={column} label='Definition (bound)' />
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
      cell: ({ row }) => (
        <SlaBadge percent={slaForInstance(row.original.id)} />
      ),
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
  const { instances, slaForInstance, tickSla, startInstance } = store

  const canAdmin = role === 'Company Admin'

  const scopedInstances = useMemo(
    () => instances.filter((i) => companies.includes(i.company)),
    [instances, companies]
  )

  const inboxRows = useInboxRows(store, role, companies)

  const [startOpen, setStartOpen] = useState(false)
  const [detail, setDetail] = useState<WorkflowInstance | null>(null)

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
    () => instanceColumns(slaForInstance),
    [slaForInstance]
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

      <SectionToolbar title={`Workflow instances (${scopedInstances.length})`}>
        {canAdmin && (
          <>
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
          </>
        )}
      </SectionToolbar>

      <DataTable
        columns={instanceCols}
        data={scopedInstances}
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
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      />
    </div>
  )
}
