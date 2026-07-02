import { useMemo, useState } from 'react'
import { ArrowsClockwise, CaretLeft, CaretRight, PencilSimple, Plus, Trash } from 'phosphor-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { CURRENT_COMPANY_ID, type Department } from '../data/departments'
import { LOCATIONS } from '../data/org-config'
import { type DepartmentConfigStore } from '../hooks/use-department-config'
import { type DepartmentDraft, type DepartmentsStore } from '../hooks/use-departments'
import { DepartmentOverlay } from './department-overlay'
import { departmentsTableColumns, type DepartmentRow } from './departments-table-columns'

const PAGE_SIZE = 8
type StatusFilter = 'all' | 'active' | 'inactive'

interface DirectoryTabProps {
  store: DepartmentsStore
  config: DepartmentConfigStore
}

/**
 * Tabular department list: key-attribute columns (DEPT-24), status filter
 * (DEPT-26), pagination + refresh (DEPT-25) and full lifecycle actions
 * (create / edit / guarded delete — DEPT-01/09), gated to Company Admin.
 */
export function DirectoryTab({ store, config }: DirectoryTabProps) {
  const { hasRole } = useRole()
  const canManage = hasRole('Company Admin')

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(0)
  const [selectedRows, setSelectedRows] = useState<DepartmentRow[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Departments are tenant-scoped: only the admin's own company is listed.
  const companyDepartments = useMemo(
    () => store.departments.filter((d) => d.companyId === CURRENT_COMPANY_ID),
    [store.departments]
  )
  const companyEmployees = useMemo(
    () => store.employees.filter((e) => e.companyId === CURRENT_COMPANY_ID),
    [store.employees]
  )

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? companyDepartments
        : companyDepartments.filter((d) => d.status === statusFilter),
    [companyDepartments, statusFilter]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)

  const rows = useMemo<DepartmentRow[]>(
    () =>
      filtered
        .slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
        .map((d) => ({
          id: d.id,
          name: d.name,
          acronym: d.acronym,
          parentName: d.parentId ? (store.deptById.get(d.parentId)?.name ?? '') : '',
          headName: d.headId ? (store.employeeById.get(d.headId)?.name ?? '') : '',
          memberCount: store.directMembersOf(d.id).length,
          locationNames: d.locationIds
            .map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id)
            .join(', '),
          status: d.status,
          description: d.description,
          original: d,
        })),
    [filtered, safePage, store]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: DepartmentDraft): boolean => {
    if (editingDept) {
      const ok = store.updateDepartment(editingDept.id, draft)
      if (ok) clearSelection()
      return ok
    }
    store.addDepartment(draft)
    clearSelection()
    return true
  }

  const selected = selectedRows.map((r) => r.original)
  const blockers = selected.flatMap((d) =>
    store.deleteBlockersFor(d.id).map((b) => `${d.name}: ${b}`)
  )
  const configRefs = selected.flatMap((d) =>
    config.configRefsFor(d.id).map((r) => `${d.name} → ${r}`)
  )

  const onConfirmDelete = () => {
    selected.forEach((d) => {
      store.deleteDepartment(d.id)
      config.flagDepartmentRefs(d.id, d.name)
    })
    toast.success(
      selected.length === 1 ? `${selected[0].name} deleted` : `${selected.length} departments deleted`
    )
    setConfirmDelete(false)
    clearSelection()
  }

  const toggleStatus = () => {
    if (selected.length !== 1) return
    const d = selected[0]
    store.setDepartmentStatus(d.id, d.status === 'active' ? 'inactive' : 'active')
    clearSelection()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Departments ({filtered.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter)
              setPage(0)
              clearSelection()
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='icon2'
            onClick={() => store.refresh()}
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          {canManage && (
            <>
              <Button
                variant='outline'
                onClick={toggleStatus}
                className='h-7 px-2 text-xs'
                disabled={selected.length !== 1}
              >
                {selected.length === 1 && selected[0].status === 'inactive'
                  ? 'Reactivate'
                  : 'Deactivate'}
              </Button>
              <Button
                variant='icon2'
                onClick={() => {
                  if (selected.length !== 1) return
                  setEditingDept(selected[0])
                  setOverlayOpen(true)
                }}
                className='text-neutral-1900 h-7 w-7'
                disabled={selected.length !== 1}
                aria-label='Edit'
              >
                <PencilSimple size={16} weight='fill' />
              </Button>
              <Button
                variant='icon2'
                onClick={() => setConfirmDelete(true)}
                className='text-neutral-1900 h-7 w-7'
                disabled={selected.length === 0}
                aria-label='Delete'
              >
                <Trash size={16} weight='bold' />
              </Button>
              <Button
                variant='red'
                onClick={() => {
                  setEditingDept(null)
                  setOverlayOpen(true)
                }}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                New Department
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={departmentsTableColumns}
        data={rows}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(r) => setSelectedRows(r)}
      />

      {/* Pagination (DEPT-25) */}
      <div className='mt-3 flex items-center justify-end gap-2'>
        <span className='text-neutral-1000 text-xs'>
          Page {safePage + 1} of {pageCount}
        </span>
        <Button
          variant='icon2'
          className='h-7 w-7'
          disabled={safePage === 0}
          onClick={() => {
            setPage(safePage - 1)
            clearSelection()
          }}
          aria-label='Previous page'
        >
          <CaretLeft size={14} weight='bold' />
        </Button>
        <Button
          variant='icon2'
          className='h-7 w-7'
          disabled={safePage >= pageCount - 1}
          onClick={() => {
            setPage(safePage + 1)
            clearSelection()
          }}
          aria-label='Next page'
        >
          <CaretRight size={14} weight='bold' />
        </Button>
      </div>

      <DepartmentOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingDept(null)
        }}
        department={editingDept}
        departments={companyDepartments}
        employees={companyEmployees}
        customFields={config.customFields}
        descendantsOf={store.descendantsOf}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.length === 1 ? selected[0]?.name : `${selected.length} departments`}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-2'>
                {blockers.length > 0 ? (
                  <>
                    <p className='text-red-1400 font-medium'>Deletion is blocked:</p>
                    <ul className='list-disc space-y-1 pl-5'>
                      {blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>History is retained for audit, but the department is removed from active use.</p>
                )}
                {configRefs.length > 0 && (
                  <>
                    <p className='font-medium'>Dependent configuration will be flagged for review:</p>
                    <ul className='list-disc space-y-1 pl-5'>
                      {configRefs.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={blockers.length > 0}
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
