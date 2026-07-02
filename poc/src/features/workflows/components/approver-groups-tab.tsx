import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowsClockwise, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import {
  APPROVER_CATEGORIES,
  CATEGORY_LABELS,
  type ApproverGroup,
} from '../data/approver-groups'
import type { ApproverGroupsStore } from '../hooks/use-approver-groups'
import { ApproverGroupSheet } from './approver-group-sheet'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, selectColumn, SortableHeader } from './table-helpers'

interface GroupRow extends ApproverGroup {
  categoryLabel: string
}

function ruleSummary(g: ApproverGroup): string[] {
  const rules: string[] = []
  if (g.supervisorCapHours !== null)
    rules.push(`Supervisor cap ${g.supervisorCapHours} h`)
  if (g.payrollCutoffDay !== null)
    rules.push(`Payroll cutoff day ${g.payrollCutoffDay}`)
  if (g.secondLevelAfterCutoff) rules.push('2nd level after cutoff')
  if (g.exitType) rules.push(`Exit type: ${g.exitType}`)
  if (g.minEmployeesThreshold !== null)
    rules.push(`Min ${g.minEmployeesThreshold} employees`)
  if (g.positionLevel) rules.push(`Positions: ${g.positionLevel}`)
  return rules
}

const columns: ColumnDef<GroupRow>[] = [
  selectColumn<GroupRow>(),
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label='Group' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.name}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          {row.original.id}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'categoryLabel',
    header: ({ column }) => <SortableHeader column={column} label='Category' />,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.categoryLabel}
      </span>
    ),
  },
  {
    id: 'locations',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Locations</span>
    ),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.locations.join(', ') || 'All'}
      </LongText>
    ),
  },
  {
    id: 'departments',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Departments</span>
    ),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.departments.join(', ') || 'All'}
      </LongText>
    ),
  },
  {
    id: 'chain',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Approver hierarchy</span>
    ),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.approvers.join(' → ')}
      </LongText>
    ),
  },
  {
    id: 'rules',
    header: () => <span className='text-paragraph-sm font-medium'>Rules</span>,
    cell: ({ row }) => {
      const rules = ruleSummary(row.original)
      return rules.length === 0 ? (
        <span className='text-neutral-1000 text-sm'>—</span>
      ) : (
        <div className='flex flex-wrap gap-1 p-1'>
          {rules.map((r) => (
            <Badge key={r} variant='badge_inactive'>
              {r}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <SortableHeader column={column} label='Updated' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm'>
          {row.original.updatedAt}
        </span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.updatedBy}
        </span>
      </div>
    ),
  },
]

/**
 * Per-process approver chain configuration (WFE-27 … WFE-39): overtime,
 * comp-off, change-request, WFH, exit, exit-clearance, layoff, confirmation
 * and disciplinary approvers with their category-specific decision rules,
 * plus the guided Save & Next setup flow (WFE-42).
 */
export function ApproverGroupsTab({ store }: { store: ApproverGroupsStore }) {
  const { groups, addGroup, updateGroup, deleteGroup, refresh } = store

  const [category, setCategory] = useState<string>('all')
  const [selectedRows, setSelectedRows] = useState<GroupRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ApproverGroup | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const rows = useMemo<GroupRow[]>(
    () =>
      groups
        .filter((g) => category === 'all' || g.category === category)
        .map((g) => ({ ...g, categoryLabel: CATEGORY_LABELS[g.category] })),
    [groups, category]
  )

  const summary = useMemo(
    () => [
      { label: 'Configurations', value: groups.length },
      {
        label: 'Categories covered',
        value: new Set(groups.map((g) => g.category)).size,
      },
      {
        label: 'With supervisor caps',
        value: groups.filter((g) => g.supervisorCapHours !== null).length,
      },
      {
        label: 'Multi-level chains',
        value: groups.filter((g) => g.approvers.length > 1).length,
      },
    ],
    [groups]
  )

  const selected = selectedRows[0] ?? null

  return (
    <div className='w-full'>
      <SummaryCards title='Approver chain coverage' items={summary} />

      <SectionToolbar title={`Approver configurations (${rows.length})`}>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            {APPROVER_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          onClick={refresh}
          aria-label='Refresh'
        >
          <ArrowsClockwise size={16} weight='bold' />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          disabled={selectedRows.length !== 1}
          onClick={() => {
            setEditing(selected)
            setSheetOpen(true)
          }}
          aria-label='Edit'
        >
          <PencilSimple size={16} weight='fill' />
        </Button>
        <Button
          variant='icon2'
          className='text-neutral-1900 h-7 w-7'
          disabled={selectedRows.length === 0}
          onClick={() => setConfirmDelete(true)}
          aria-label='Delete'
        >
          <Trash size={16} weight='bold' />
        </Button>
        <Button
          variant='red'
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          New Configuration
        </Button>
      </SectionToolbar>

      <DataTable
        columns={columns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(selection) => setSelectedRows(selection)}
      />

      <ApproverGroupSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditing(null)
        }}
        group={editing}
        onSave={(draft) => {
          if (editing) updateGroup(editing.id, draft)
          else addGroup(draft)
          clearSelection()
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove{' '}
              {selectedRows.length === 1
                ? 'this configuration'
                : `${selectedRows.length} configurations`}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `"${selected?.name}" will stop routing new requests. In-flight requests keep their original approvers.`
                : 'The selected configurations will stop routing new requests. In-flight requests keep their original approvers.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                selectedRows.forEach((g) => deleteGroup(g.id))
                setConfirmDelete(false)
                clearSelection()
              }}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
