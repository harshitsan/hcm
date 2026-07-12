import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  CopySimple,
  Eye,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import {
  FIELD_SCOPES,
  FIELD_TARGETS,
  type FieldDefinition,
  type FieldType,
} from '../data/custom-fields'
import { hasStoredData } from '../data/field-engine'
import {
  type FieldDefinitionsStore,
  type FieldDraft,
} from '../hooks/use-custom-fields'
import { FieldDetailSheet } from './field-detail-sheet'
import { FieldWizard } from './field-wizard'
import { FieldsOrderDialog } from './fields-order-dialog'
import { getFieldsTableColumns } from './fields-table-columns'
import { GuidedMigrationDialog } from './guided-migration-dialog'

interface DefinitionsTabProps {
  store: FieldDefinitionsStore
}

/**
 * Custom fields list screen: add (guided wizard), edit in place, refresh,
 * Fields Order, delete — with platform-scope definitions locked for
 * company-level admins.
 */
export function DefinitionsTab({ store }: DefinitionsTabProps) {
  const { role } = useRole()
  const {
    fields,
    addField,
    updateField,
    migrateFieldType,
    deleteField,
    toggleDefault,
    reorderFields,
    refresh,
  } = store

  const [selectedRows, setSelectedRows] = useState<FieldDefinition[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null)
  const [duplicateSource, setDuplicateSource] = useState<FieldDefinition | null>(null)
  const [detailField, setDetailField] = useState<FieldDefinition | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  /** Type change on a field with data, held until the migration completes. */
  const [pendingMigration, setPendingMigration] = useState<{
    field: FieldDefinition
    draft: FieldDraft
  } | null>(null)

  // First-class surfacing: name search + entity/scope filters.
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')

  const visibleFields = useMemo(() => {
    const query = search.trim().toLowerCase()
    return fields.filter(
      (f) =>
        (!query || f.name.toLowerCase().includes(query)) &&
        (entityFilter === 'all' || f.entity === entityFilter) &&
        (scopeFilter === 'all' || f.scope === scopeFilter)
    )
  }, [fields, search, entityFilter, scopeFilter])

  const canManage = useMemo(
    () => (field: FieldDefinition) => {
      if (role === 'Platform Admin') return true
      if (role === 'Group Company Admin') return field.scope !== 'Platform'
      if (role === 'Company Admin') return field.scope === 'Company'
      return false
    },
    [role]
  )

  const columns = useMemo(
    () =>
      getFieldsTableColumns({
        canManage,
        onToggleDefault: (field) => {
          if (!canManage(field)) return
          toggleDefault(field.id)
        },
      }),
    [canManage, toggleDefault]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleEdit = () => {
    if (selectedRows.length !== 1) return
    const field = selectedRows[0]
    if (!canManage(field)) {
      toast.error(
        `"${field.name}" is governed at ${field.scope} scope and cannot be edited at your level`
      )
      return
    }
    setDuplicateSource(null)
    setEditingField(field)
    setWizardOpen(true)
  }

  const handleDuplicate = () => {
    if (selectedRows.length !== 1) return
    setEditingField(null)
    setDuplicateSource(selectedRows[0])
    setWizardOpen(true)
  }

  const handleViewDetails = () => {
    if (selectedRows.length !== 1) return
    setDetailField(selectedRows[0])
    setDetailOpen(true)
  }

  const handleSubmit = (draft: FieldDraft) => {
    if (editingField) {
      // A type change on a field with stored values never applies silently —
      // it routes through the guided migration flow instead.
      if (draft.type !== editingField.type && hasStoredData(editingField)) {
        setPendingMigration({ field: editingField, draft })
        clearSelection()
        return
      }
      updateField(editingField.id, draft, role)
    } else {
      addField(draft, role)
    }
    clearSelection()
  }

  const deletableSelection = selectedRows.filter(canManage)

  const onConfirmDelete = () => {
    deletableSelection.forEach((f) => deleteField(f.id))
    toast.success(
      deletableSelection.length === 1
        ? 'Custom field removed'
        : `${deletableSelection.length} custom fields removed`
    )
    setConfirmDelete(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          User Defined Fields ({fields.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={refresh}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
            title='Refresh list'
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='outline'
            onClick={() => setOrderOpen(true)}
            className='h-7 gap-1 rounded-[6px] px-2'
          >
            <ArrowUpDown className='size-3.5' />
            Fields Order
          </Button>
          <Button
            variant='icon2'
            onClick={handleViewDetails}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='View details'
            title='View details of the selected field'
          >
            <Eye size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={handleEdit}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Edit'
            title='Edit the selected field'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='icon2'
            onClick={handleDuplicate}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Duplicate'
            title='Duplicate the selected field'
          >
            <CopySimple size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            onClick={() => setConfirmDelete(true)}
            className='text-neutral-1900 h-7 w-7'
            disabled={deletableSelection.length === 0}
            aria-label='Delete'
            title='Delete the selected field'
          >
            <Trash size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditingField(null)
              setWizardOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Add New User Defined Field
          </Button>
        </div>
      </div>

      <div className='mb-3 flex flex-wrap items-center gap-3'>
        <div className='relative w-full max-w-[260px]'>
          <MagnifyingGlass
            size={14}
            className='text-neutral-1000 absolute top-1/2 left-2.5 -translate-y-1/2'
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='e.g. Badge ID'
            aria-label='Search fields by name'
            className='h-8 pl-8'
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger
            variant='secondary'
            className='h-8 w-[180px]'
            aria-label='Filter by entity'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All entities</SelectItem>
            {FIELD_TARGETS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger
            variant='secondary'
            className='h-8 w-[150px]'
            aria-label='Filter by scope'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All scopes</SelectItem>
            {FIELD_SCOPES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || entityFilter !== 'all' || scopeFilter !== 'all') && (
          <span className='text-paragraph-sm text-neutral-1000'>
            {visibleFields.length} of {fields.length} fields
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={visibleFields}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <FieldWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open)
          if (!open) {
            setEditingField(null)
            setDuplicateSource(null)
          }
        }}
        field={editingField}
        duplicateSource={duplicateSource}
        existingFields={fields}
        onSubmit={handleSubmit}
      />

      <GuidedMigrationDialog
        open={pendingMigration !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMigration(null)
        }}
        field={pendingMigration?.field ?? null}
        nextType={(pendingMigration?.draft.type as FieldType) ?? null}
        onApply={(_rule, outcome) => {
          if (!pendingMigration) return
          migrateFieldType(
            pendingMigration.field.id,
            pendingMigration.draft,
            outcome,
            role
          )
          setPendingMigration(null)
        }}
      />

      <FieldDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailField(null)
        }}
        field={detailField}
      />

      <FieldsOrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        fields={fields}
        onSave={reorderFields}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete{' '}
              {deletableSelection.length === 1
                ? 'custom field'
                : 'custom fields'}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletableSelection.length === 1
                ? `"${deletableSelection[0]?.name}" and its stored values will be removed from all ${deletableSelection[0]?.entity} records.`
                : `${deletableSelection.length} fields and their stored values will be removed.`}{' '}
              Definitions governed at a higher scope stay untouched. This can't
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
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
