import { useMemo, useState } from 'react'
import { ArrowsClockwise, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { type FieldDefinition } from '../data/custom-fields'
import {
  type FieldDefinitionsStore,
  type FieldDraft,
} from '../hooks/use-custom-fields'
import { FieldWizard } from './field-wizard'
import { FieldsOrderDialog } from './fields-order-dialog'
import { getFieldsTableColumns } from './fields-table-columns'

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
    deleteField,
    toggleDefault,
    reorderFields,
    refresh,
  } = store

  const [selectedRows, setSelectedRows] = useState<FieldDefinition[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    setEditingField(field)
    setWizardOpen(true)
  }

  const handleSubmit = (draft: FieldDraft) => {
    if (editingField) {
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

      <DataTable
        columns={columns}
        data={fields}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <FieldWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open)
          if (!open) setEditingField(null)
        }}
        field={editingField}
        onSubmit={handleSubmit}
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
