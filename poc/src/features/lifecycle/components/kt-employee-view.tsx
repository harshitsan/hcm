import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CaretDown } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import { type KtTask } from '../data/knowledge-transfer'
import { fmtDate } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'
import {
  KtDetailSheet,
  KtDueDate,
  KtInitiateDialog,
  KtReceiveDialog,
} from './kt-task-dialogs'

const INITIABLE = ['Assigned', 'Reassigned', 'Initiated']

interface KtEmployeeViewProps {
  store: KnowledgeTransferStore
  /** The signed-in employee persona (provider/receiver matching). */
  self: string
}

/**
 * Employee Knowledge Transfer workspace — "KT to be provided by me" (View /
 * Initiate) and "KT to be received by me" (View / Received) per the Kensium
 * transaction flow, with overdue highlighting against today = 2026-07-09.
 */
export function KtEmployeeView({ store, self }: KtEmployeeViewProps) {
  const [viewTask, setViewTask] = useState<KtTask | null>(null)
  const [initiateTask, setInitiateTask] = useState<KtTask | null>(null)
  const [receiveTask, setReceiveTask] = useState<KtTask | null>(null)

  const providedByMe = useMemo(
    () => store.tasks.filter((t) => t.provider === self),
    [self, store.tasks]
  )
  const receivedByMe = useMemo(
    () => store.tasks.filter((t) => t.receiver === self),
    [self, store.tasks]
  )

  const baseColumns = (counterpart: 'provider' | 'receiver'): ColumnDef<KtTask>[] => [
    {
      accessorKey: 'task',
      header: ({ column }) => <SortHeader column={column} label='KT Task' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 max-w-[260px] flex-col'>
          <span className='text-neutral-1600 truncate font-medium'>
            {row.original.task}
          </span>
          <span className='text-neutral-1000 text-xs'>
            {row.original.id} · {row.original.isExit ? `Exit KT (${row.original.exitType})` : 'Non-exit KT'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: counterpart,
      header: ({ column }) => (
        <SortHeader
          column={column}
          label={counterpart === 'receiver' ? 'Handing over to' : 'Receiving from'}
        />
      ),
      cell: ({ row }) => <span className='text-sm'>{row.original[counterpart]}</span>,
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
  ]

  const providedColumns: ColumnDef<KtTask>[] = [
    ...baseColumns('receiver'),
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
              Initiate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const receivedColumns: ColumnDef<KtTask>[] = [
    ...baseColumns('provider'),
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
              disabled={row.original.status !== 'Pending for Receive'}
              onClick={() => setReceiveTask(row.original)}
            >
              Received
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className='w-full'>
      <Tabs defaultValue='provided' className='w-full'>
        <TabsList className='mb-2'>
          <TabsTrigger variant='ghost' value='provided'>
            KT to be provided by me
          </TabsTrigger>
          <TabsTrigger variant='ghost' value='received'>
            KT to be received by me
          </TabsTrigger>
        </TabsList>

        <TabsContent value='provided'>
          <p className='text-neutral-1000 mb-2 text-xs'>
            Handover tasks assigned to you as the KT provider. Use Initiate to
            start the KT and upload the KT material.
          </p>
          <DataTable
            columns={providedColumns}
            data={providedByMe}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='received'>
          <p className='text-neutral-1000 mb-2 text-xs'>
            Handover tasks where you are the KT receiver. Once the provider has
            initiated, acknowledge with Received.
          </p>
          <DataTable
            columns={receivedColumns}
            data={receivedByMe}
            variant='no-status'
          />
        </TabsContent>
      </Tabs>

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
        actor={self}
      />
      <KtReceiveDialog
        open={receiveTask !== null}
        onOpenChange={(o) => {
          if (!o) setReceiveTask(null)
        }}
        task={receiveTask}
        store={store}
        actor={self}
      />
    </div>
  )
}
