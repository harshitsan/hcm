import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowBendUpRight, BellRinging, Check, Plus, Timer, X } from 'phosphor-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { SimpleTable } from '@/components/common/data-table/simple-table'
import { useFlowRuns, type FlowRun } from '../hooks/use-flow-runs'
import { LongText } from '@/components/common/long-text'
import type { Role } from '@/context/role-context'
import type { AuditEvent } from '../data/audit'
import type { WorkflowDefinition } from '../data/definitions'
import {
  slaRemainingLabel,
  TASK_VIA_LABELS,
  type ApprovalTask,
  type WorkflowInstance,
} from '../data/instances'
import type { RoutingRule } from '../data/routing'
import { CURRENT_APPROVER } from '../data/shared'
import type { InstancesStore } from '../hooks/use-instances'
import { InstanceStatusBadge, PatternBadge, SlaBadge } from './badges'
import { InstanceDetailSheet } from './instance-detail-sheet'
import { StartRequestDialog } from './start-request-dialog'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'
import { WorkflowChip } from './workflow-chip'

interface InboxRow {
  id: string
  title: string
  requester: string
  stageName: string
  approver: string
  via: string
  assignedAt: string
  task: ApprovalTask
  instance: WorkflowInstance
}

type ConfirmAction = { kind: 'reject' | 'delegate'; row: InboxRow } | null

function inboxColumns(
  canDecide: (row: InboxRow) => boolean,
  canAdmin: boolean,
  onApprove: (row: InboxRow) => void,
  onConfirm: (action: NonNullable<ConfirmAction>) => void,
  onRemind: (row: InboxRow) => void
): ColumnDef<InboxRow>[] {
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
            {row.original.instance.transactionType} ·{' '}
            {row.original.requester}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'stageName',
      header: ({ column }) => <SortableHeader column={column} label='Stage' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-neutral-1900 text-sm'>
            {row.original.stageName}
          </span>
          <PatternBadge pattern={row.original.task.pattern} />
        </div>
      ),
    },
    {
      accessorKey: 'approver',
      header: ({ column }) => <SortableHeader column={column} label='Approver' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.approver}
        </span>
      ),
    },
    {
      accessorKey: 'via',
      header: ({ column }) => <SortableHeader column={column} label='Assigned via' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>{row.original.via}</span>
          {row.original.task.escalatedFrom && (
            <span className='text-paragraph-sm text-neutral-1000'>
              from {row.original.task.escalatedFrom}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'sla',
      header: () => <span className='text-paragraph-sm font-medium'>SLA</span>,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col gap-1'>
          <SlaBadge percent={row.original.task.slaPercent} />
          <span className='text-paragraph-sm text-neutral-1000'>
            {slaRemainingLabel(
              row.original.task.slaPercent,
              row.original.task.slaHours
            )}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'assignedAt',
      header: ({ column }) => <SortableHeader column={column} label='Assigned' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.assignedAt}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className='text-paragraph-sm font-medium'>Actions</span>,
      cell: ({ row }) => {
        const decidable = canDecide(row.original)
        if (!decidable && !canAdmin)
          return <span className='text-neutral-1000 text-sm'>View only</span>
        return (
          <div className='flex items-center gap-1.5'>
            {decidable && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 px-2'
                  onClick={(e) => {
                    e.stopPropagation()
                    onApprove(row.original)
                  }}
                >
                  <Check size={12} weight='bold' />
                  Approve
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-destructive h-7 px-2'
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfirm({ kind: 'reject', row: row.original })
                  }}
                >
                  <X size={12} weight='bold' />
                  Reject
                </Button>
              </>
            )}
            {canAdmin && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 px-2'
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfirm({ kind: 'delegate', row: row.original })
                  }}
                >
                  <ArrowBendUpRight size={12} weight='bold' />
                  Delegate
                </Button>
                <Button
                  variant='icon2'
                  className='text-neutral-1900 h-7 w-7'
                  aria-label='Send reminder'
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemind(row.original)
                  }}
                >
                  <BellRinging size={14} weight='bold' />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]
}

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
 * Running approvals: the approver inbox with approve / reject / delegate /
 * remind actions (WFE-13, WFE-26), real-time SLA tracking (WFE-11) with a
 * simulated business-hours clock (WFE-09, WFE-10, WFE-14), routed initiation
 * (WFE-02) and full instance drill-down (WFE-20, WFE-21).
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
  const {
    instances,
    pendingTasks,
    slaForInstance,
    decide,
    escalateTask,
    tickSla,
    sendReminder,
    startInstance,
  } = store

  const canAdmin = role === 'Company Admin'
  const isEmployee = role === 'Employee (User)'

  const scopedInstances = useMemo(
    () => instances.filter((i) => companies.includes(i.company)),
    [instances, companies]
  )

  const inboxRows = useMemo<InboxRow[]>(() => {
    return pendingTasks
      .map((task) => {
        const instance = instances.find((i) => i.id === task.instanceId)
        if (!instance) return null
        if (isEmployee && task.approver !== CURRENT_APPROVER) return null
        if (!isEmployee && !companies.includes(instance.company)) return null
        return {
          id: task.id,
          title: instance.title,
          requester: instance.requester,
          stageName: task.stageName,
          approver: task.approver,
          via: TASK_VIA_LABELS[task.via],
          assignedAt: task.assignedAt,
          task,
          instance,
        }
      })
      .filter((row): row is InboxRow => row !== null)
  }, [pendingTasks, instances, companies, isEmployee])

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
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

  const canDecide = useCallback(
    (row: InboxRow) =>
      canAdmin || (isEmployee && row.task.approver === CURRENT_APPROVER),
    [canAdmin, isEmployee]
  )

  const inboxCols = useMemo(
    () =>
      inboxColumns(
        canDecide,
        canAdmin,
        (row) => decide(row.task.id, 'approved'),
        (action) => setConfirmAction(action),
        (row) => sendReminder(row.task.id)
      ),
    [canDecide, canAdmin, decide, sendReminder]
  )

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

      <SectionToolbar
        title={
          isEmployee
            ? `My approval inbox (${inboxRows.length})`
            : `Approval inbox (${inboxRows.length})`
        }
      >
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
        columns={inboxCols}
        data={inboxRows}
        variant='no-status'
        onRowClick={(row) => setDetail(row.instance)}
      />

      <div className='mt-6'>
        <SectionToolbar title={`Workflow instances (${scopedInstances.length})`} />
        <DataTable
          columns={instanceCols}
          data={scopedInstances}
          variant='no-status'
          onRowClick={(row) => setDetail(row)}
        />
      </div>

      {/* A7: engine-linked flow runs (new external store — does not touch
           the per-component useInstances engine above). */}
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

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === 'reject'
                ? 'Reject this request?'
                : 'Delegate this task?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === 'reject'
                ? `"${confirmAction.row.title}" will halt at ${confirmAction.row.stageName}. Sibling pending tasks are closed and downstream approvers are never engaged.`
                : confirmAction
                  ? `The task at "${confirmAction.row.stageName}" moves away from ${confirmAction.row.approver} per the stage's configured escalation strategy, and the new approver is notified.`
                  : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.kind === 'reject')
                  decide(confirmAction.row.task.id, 'rejected')
                if (confirmAction?.kind === 'delegate')
                  escalateTask(
                    confirmAction.row.task.id,
                    'Delegated by Company Admin'
                  )
                setConfirmAction(null)
              }}
              className={
                confirmAction?.kind === 'reject'
                  ? 'bg-destructive hover:bg-destructive/90 text-white'
                  : undefined
              }
            >
              {confirmAction?.kind === 'reject' ? 'Reject' : 'Delegate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
