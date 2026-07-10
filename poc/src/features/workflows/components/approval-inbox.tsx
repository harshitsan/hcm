import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowBendUpRight, BellRinging, Check, X } from 'phosphor-react'
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
import { LongText } from '@/components/common/long-text'
import type { Role } from '@/context/role-context'
import type { AuditEvent } from '../data/audit'
import {
  slaRemainingLabel,
  TASK_VIA_LABELS,
  type ApprovalTask,
  type WorkflowInstance,
} from '../data/instances'
import { CURRENT_APPROVER } from '../data/shared'
import type { InstancesStore } from '../hooks/use-instances'
import { PatternBadge, SlaBadge } from './badges'
import { InstanceDetailSheet } from './instance-detail-sheet'
import { SectionToolbar, SortableHeader } from './table-helpers'

export interface InboxRow {
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

/**
 * Pending approval tasks scoped to the viewer: employees see only tasks
 * assigned to them, admins see every task inside their companies.
 */
export function useInboxRows(
  store: InstancesStore,
  role: Role,
  companies: string[]
): InboxRow[] {
  const { instances, pendingTasks } = store
  const isEmployee = role === 'Employee (User)'

  return useMemo<InboxRow[]>(() => {
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
}

/**
 * The actionable approval inbox — approve / reject / delegate / remind
 * (WFE-13, WFE-26) with instance drill-down. Lives in Tasks & Notifications;
 * decisions write to the shared engine store, so the Workflow Engine's
 * monitoring surfaces update in lockstep.
 */
export function ApprovalInbox({
  store,
  role,
  events,
  companies,
}: {
  store: InstancesStore
  role: Role
  events: AuditEvent[]
  companies: string[]
}) {
  const { instances, decide, escalateTask, sendReminder } = store

  const canAdmin = role === 'Company Admin'
  const isEmployee = role === 'Employee (User)'
  const inboxRows = useInboxRows(store, role, companies)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [detail, setDetail] = useState<WorkflowInstance | null>(null)

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

  // The detail sheet must reflect live engine state, not a stale snapshot.
  const liveDetail = detail
    ? (instances.find((i) => i.id === detail.id) ?? null)
    : null

  return (
    <div className='w-full'>
      <SectionToolbar
        title={
          isEmployee
            ? `My approval inbox (${inboxRows.length})`
            : `Approval inbox (${inboxRows.length})`
        }
      />

      <DataTable
        columns={inboxCols}
        data={inboxRows}
        variant='no-status'
        onRowClick={(row) => setDetail(row.instance)}
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
