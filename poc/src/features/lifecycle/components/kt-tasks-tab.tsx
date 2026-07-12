import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CaretDown, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import {
  KT_EXIT_CONTEXTS,
  KT_STATUSES,
  type KtExitContext,
  type KtTask,
} from '../data/knowledge-transfer'
import { PERSONAS, fmtDate } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'
import { ktTaskColumns, receiverCell, WeekBreakdown } from './kt-columns'
import { KtEmployeeView } from './kt-employee-view'
import { EMPTY_KT_FILTERS, KtFilterBar, useKtFiltered } from './kt-filter-bar'
import {
  KtDetailSheet,
  KtDueDate,
  KtInitiateDialog,
  KtReassignDialog,
  KtReceiveDialog,
} from './kt-task-dialogs'
import { KtTaskFormDialog } from './kt-task-form'
import { RefreshButton } from './orientation-widgets'

interface KtTasksTabProps {
  store: KnowledgeTransferStore
}

/**
 * KT Tasks — manager oversight of every handover in flight, with the shared
 * active/inactive, period, department and status filters plus refresh.
 */
export function KtTasksTab({ store }: KtTasksTabProps) {
  const [filters, setFilters] = useState(EMPTY_KT_FILTERS)
  const [selected, setSelected] = useState<KtTask | null>(null)
  const tasks = useKtFiltered(store.tasks, filters, 'either')

  return (
    <div className='w-full'>
      {!store.moduleEnabled && (
        <p className='text-neutral-1000 mb-3 rounded-[6px] border border-gray-200 bg-white p-3 text-xs'>
          The Knowledge Transfer module is disabled in Admin → Knowledge
          Transfer setup. Existing tasks stay visible but new handovers cannot
          be raised.
        </p>
      )}
      <KtFilterBar filters={filters} onChange={setFilters} matchCount={tasks.length}>
        <RefreshButton
          onRefresh={() => store.refresh('tasks', 'KT tasks')}
          refreshedAt={store.refreshedAt.tasks}
        />
      </KtFilterBar>
      <DataTable
        columns={ktTaskColumns}
        data={tasks}
        variant='no-status'
        onRowClick={(row: KtTask) => setSelected(row)}
      />

      {/* Task detail + status flow */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>KT task · {selected?.task}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-3 text-sm'>
              <div className='flex flex-wrap items-center gap-2'>
                <StatusBadge status={selected.status} />
                <Badge variant='outline'>{selected.department}</Badge>
                <span className='text-neutral-1000 text-xs'>
                  {fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}
                </span>
              </div>
              <p>
                <span className='text-neutral-1000'>Provided by</span>{' '}
                {selected.provider}{' '}
                <span className='text-neutral-1000'>· received by</span>{' '}
                {selected.receiver}
              </p>
              <div>
                <p className='text-neutral-1000 mb-1 text-xs'>
                  Weekly plan (Su–Sa)
                </p>
                <WeekBreakdown week={selected.week} />
              </div>
            </div>
          )}
          <DialogFooter className='flex-wrap gap-2'>
            {selected &&
              KT_STATUSES.filter((s) => s !== selected.status).map((s) => (
                <Button
                  key={s}
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    store.setTaskStatus(selected, s)
                    setSelected(null)
                  }}
                >
                  Mark {s}
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const INITIABLE = ['Assigned', 'Reassigned', 'Initiated']

/** Statuses where the handover is closed — reassignment no longer applies. */
const CLOSED = ['Received', 'Pre Closed', 'Withdrawn']

interface KnowledgeTransferTabProps {
  store: KnowledgeTransferStore
}

/**
 * Kensium Knowledge Transfer Management — role-aware entry point.
 * Employees see "KT to be provided / received by me"; HR & managers see the
 * full KT task register with assignment and on-behalf status updates.
 */
export function KnowledgeTransferTab({ store }: KnowledgeTransferTabProps) {
  const { role, hasRole } = useRole()
  const self = PERSONAS[role] ?? 'Rohan Verma'

  if (hasRole('Employee (User)', 'Employee (Non-User)')) {
    return <KtEmployeeView store={store} self={self} />
  }
  return <KtManagerView store={store} actor={self} />
}

interface KtManagerViewProps {
  store: KnowledgeTransferStore
  /** Persona acting as the admin / reporting manager / exit coordinator. */
  actor: string
}

/**
 * HR / manager register of every KT task in their departments — Add New KT
 * Task (non-exit and exit variants) plus Initiate / Received updates on
 * behalf of employees (Kensium key feature 5).
 */
function KtManagerView({ store, actor }: KtManagerViewProps) {
  const [filters, setFilters] = useState(EMPTY_KT_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [exitContext, setExitContext] = useState<KtExitContext | null>(null)
  const [viewTask, setViewTask] = useState<KtTask | null>(null)
  const [initiateTask, setInitiateTask] = useState<KtTask | null>(null)
  const [receiveTask, setReceiveTask] = useState<KtTask | null>(null)
  const [reassignTask, setReassignTask] = useState<KtTask | null>(null)
  const tasks = useKtFiltered(store.tasks, filters, 'either')

  const exitChoices = KT_EXIT_CONTEXTS.filter((c) =>
    store.applicableExitTypes.includes(c.exitType)
  )

  const columns: ColumnDef<KtTask>[] = [
    {
      accessorKey: 'task',
      header: ({ column }) => <SortHeader column={column} label='KT Task' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 max-w-[240px] flex-col'>
          <span className='text-neutral-1600 truncate font-medium'>
            {row.original.task}
          </span>
          <span className='text-neutral-1000 text-xs'>
            {row.original.id} ·{' '}
            {row.original.isExit
              ? `Exit KT (${row.original.exitType})`
              : 'Non-exit KT'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'provider',
      header: ({ column }) => <SortHeader column={column} label='KT provider' />,
      cell: ({ row }) => <span className='text-sm'>{row.original.provider}</span>,
    },
    {
      accessorKey: 'receiver',
      header: ({ column }) => <SortHeader column={column} label='KT receiver' />,
      cell: ({ row }) => receiverCell(row.original),
    },
    {
      accessorKey: 'department',
      header: ({ column }) => <SortHeader column={column} label='Department' />,
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.department}</span>
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
      accessorKey: 'endDate',
      header: ({ column }) => <SortHeader column={column} label='Due date' />,
      cell: ({ row }) => <KtDueDate task={row.original} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortHeader column={column} label='Status' />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => <span className='text-xs font-medium'>Action</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='h-7 gap-1'>
              Action
              <CaretDown size={11} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => setViewTask(row.original)}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!INITIABLE.includes(row.original.status)}
              onClick={() => setInitiateTask(row.original)}
            >
              Initiate (on behalf)
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={row.original.status !== 'Pending for Receive'}
              onClick={() => setReceiveTask(row.original)}
            >
              Received (on behalf)
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={CLOSED.includes(row.original.status)}
              onClick={() => setReassignTask(row.original)}
            >
              Reassign receiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className='w-full'>
      {!store.moduleEnabled && (
        <p className='text-neutral-1000 mb-3 rounded-[6px] border border-gray-200 bg-white p-3 text-xs'>
          The Knowledge Transfer module is disabled in Configuration → KT
          Management. Existing tasks stay visible but new KT tasks cannot be
          assigned.
        </p>
      )}

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <p className='text-neutral-1000 text-xs'>
          All KT tasks across your departments. Assign new tasks or update
          Initiate / Received status on behalf of employees.
        </p>
        <div className='flex gap-2'>
          <Button
            size='sm'
            className='gap-1'
            disabled={!store.moduleEnabled || !store.supportNonExitKt}
            onClick={() => {
              setExitContext(null)
              setFormOpen(true)
            }}
          >
            <Plus size={12} weight='bold' />
            Add New KT Task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='gap-1'
                disabled={
                  !store.moduleEnabled ||
                  !store.supportExitKt ||
                  exitChoices.length === 0
                }
              >
                Exit KT Task
                <CaretDown size={11} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Employees under exit</DropdownMenuLabel>
              {exitChoices.map((c) => (
                <DropdownMenuItem
                  key={c.employee}
                  onClick={() => {
                    setExitContext(c)
                    setFormOpen(true)
                  }}
                >
                  {c.employee} · {c.exitType} · LWD {fmtDate(c.tentativeLwd)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <KtFilterBar filters={filters} onChange={setFilters} matchCount={tasks.length}>
        <RefreshButton
          onRefresh={() => store.refresh('tasks', 'KT tasks')}
          refreshedAt={store.refreshedAt.tasks}
        />
      </KtFilterBar>
      <DataTable columns={columns} data={tasks} variant='no-status' />

      <KtTaskFormDialog
        key={exitContext?.employee ?? 'non-exit'}
        open={formOpen}
        onOpenChange={setFormOpen}
        store={store}
        assignedBy={actor}
        exitContext={exitContext}
      />
      <KtDetailSheet
        open={viewTask !== null}
        onOpenChange={(o) => {
          if (!o) setViewTask(null)
        }}
        task={viewTask}
      />
      <KtInitiateDialog
        open={initiateTask !== null}
        onOpenChange={(o) => {
          if (!o) setInitiateTask(null)
        }}
        task={initiateTask}
        store={store}
        actor={actor}
        onBehalfOf
      />
      <KtReceiveDialog
        open={receiveTask !== null}
        onOpenChange={(o) => {
          if (!o) setReceiveTask(null)
        }}
        task={receiveTask}
        store={store}
        actor={actor}
        onBehalfOf
      />
      <KtReassignDialog
        open={reassignTask !== null}
        onOpenChange={(o) => {
          if (!o) setReassignTask(null)
        }}
        task={reassignTask}
        store={store}
        actor={actor}
      />
    </div>
  )
}
