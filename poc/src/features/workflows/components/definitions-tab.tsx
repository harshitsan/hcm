import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilSimple, Play, Plus, Trash } from 'phosphor-react'
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
import type { WorkflowDefinition } from '../data/definitions'
import { PATTERN_LABELS } from '../data/shared'
import type { BusinessCalendar } from '../data/sla'
import type { DefinitionsStore } from '../hooks/use-definitions'
import { DefinitionStatusBadge } from './badges'
import { DefinitionDesigner } from './definition-designer'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, selectColumn, SortableHeader } from './table-helpers'

const columns: ColumnDef<WorkflowDefinition>[] = [
  selectColumn<WorkflowDefinition>(),
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label='Workflow' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.name}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.workflowKey} · v{row.original.version}
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
    accessorKey: 'company',
    header: ({ column }) => <SortableHeader column={column} label='Company' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
    ),
  },
  {
    id: 'stages',
    header: () => <span className='text-paragraph-sm font-medium'>Stages</span>,
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.stages
          .map((s) => `${s.name} (${PATTERN_LABELS[s.pattern]})`)
          .join(' → ') || '—'}
      </LongText>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortableHeader column={column} label='Status' />,
    cell: ({ row }) => (
      <div className='p-1.5'>
        <DefinitionStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'effectiveFrom',
    header: ({ column }) => <SortableHeader column={column} label='Effective' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.effectiveFrom}
        {row.original.effectiveTo ? ` → ${row.original.effectiveTo}` : ''}
      </span>
    ),
  },
  {
    accessorKey: 'updatedBy',
    header: ({ column }) => <SortableHeader column={column} label='Updated by' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm'>
          {row.original.updatedBy}
        </span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.updatedAt}
        </span>
      </div>
    ),
  },
]

/**
 * Versioned, effective-dated workflow definitions (WFE-01, WFE-20, WFE-22)
 * with the metadata-driven designer (WFE-25) and validation-gated activation.
 */
export function DefinitionsTab({
  store,
  companies,
  calendars,
  canConfigure,
}: {
  store: DefinitionsStore
  companies: string[]
  calendars: BusinessCalendar[]
  canConfigure: boolean
}) {
  const { definitions, saveDefinition, activateDefinition, deleteDefinition } =
    store

  const scoped = useMemo(
    () => definitions.filter((d) => companies.includes(d.company)),
    [definitions, companies]
  )

  const [selectedRows, setSelectedRows] = useState<WorkflowDefinition[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [editing, setEditing] = useState<WorkflowDefinition | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const summary = useMemo(
    () => [
      {
        label: 'Active',
        value: scoped.filter((d) => d.status === 'active').length,
      },
      {
        label: 'Drafts',
        value: scoped.filter((d) => d.status === 'draft').length,
      },
      {
        label: 'Scheduled',
        value: scoped.filter((d) => d.status === 'scheduled').length,
      },
      {
        label: 'Superseded (history)',
        value: scoped.filter((d) => d.status === 'superseded').length,
      },
    ],
    [scoped]
  )

  const selected = selectedRows[0] ?? null

  return (
    <div className='w-full'>
      <SummaryCards title='Workflow definitions by status' items={summary} />

      <SectionToolbar title={`Definitions (${scoped.length})`}>
        {canConfigure && (
          <>
            <Button
              variant='outline'
              size='sm'
              className='h-7'
              disabled={
                selectedRows.length !== 1 ||
                (selected?.status !== 'draft' && selected?.status !== 'scheduled')
              }
              onClick={() => {
                if (selected) activateDefinition(selected.id)
                clearSelection()
              }}
            >
              <Play size={12} weight='bold' />
              Activate
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1}
              onClick={() => {
                setEditing(selected)
                setDesignerOpen(true)
              }}
              aria-label='Edit'
            >
              <PencilSimple size={16} weight='fill' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              disabled={selectedRows.length !== 1 || selected?.status !== 'draft'}
              onClick={() => setConfirmDelete(true)}
              aria-label='Delete draft'
            >
              <Trash size={16} weight='bold' />
            </Button>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setDesignerOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Workflow
            </Button>
          </>
        )}
      </SectionToolbar>

      <DataTable
        columns={columns}
        data={scoped}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <DefinitionDesigner
        open={designerOpen}
        onOpenChange={(open) => {
          setDesignerOpen(open)
          if (!open) setEditing(null)
        }}
        definition={editing}
        companies={companies}
        calendars={calendars}
        onSubmit={(draft, publish) => {
          const errors = saveDefinition(draft, { publish, existing: editing })
          if (errors.length === 0) clearSelection()
          return errors
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? `The draft "${selected.name}" will be removed. Published versions are retained as history and can't be deleted.`
                : 'The selected draft will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selected) deleteDefinition(selected.id)
                setConfirmDelete(false)
                clearSelection()
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
