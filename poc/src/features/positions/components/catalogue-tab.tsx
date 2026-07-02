import { useCallback, useMemo, useState } from 'react'
import { ArrowsClockwise, CaretLeft, CaretRight, Plus } from 'phosphor-react'
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
import type { Company, Department, Position } from '../data/positions'
import type { EmployeesStore } from '../hooks/use-employees'
import type { OrgConfigStore } from '../hooks/use-org-config'
import type { PositionsStore } from '../hooks/use-positions'
import { PositionHistorySheet } from './position-history-sheet'
import { PositionOverlay } from './position-overlay'
import { buildPositionColumns } from './positions-table-columns'

const PAGE_SIZE = 10

interface CatalogueTabProps {
  /** Companies the active role may work in (tenant scope, POS-06/09). */
  companies: Company[]
  companyId: string
  onCompanyChange: (id: string) => void
  departments: Department[]
  store: PositionsStore
  employees: EmployeesStore
  orgConfig: OrgConfigStore
  /** Task actions and New/Edit/Delete only for managing roles (POS-22). */
  canManage: boolean
}

/**
 * Metadata-driven position catalogue (POS-01/02/07/08/14/19/21/22/23/43):
 * searchable, filterable, paged grid with per-row task actions, the
 * create/edit overlay and delete-integrity guards.
 */
export function CatalogueTab({
  companies,
  companyId,
  onCompanyChange,
  departments,
  store,
  employees,
  orgConfig,
  canManage,
}: CatalogueTabProps) {
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Position | null>(null)

  const companyDepartments = useMemo(
    () => departments.filter((d) => d.companyId === companyId),
    [departments, companyId]
  )

  // Only the selected tenant's positions are ever shown (POS-06/14).
  const scoped = useMemo(
    () =>
      store.positions.filter(
        (p) =>
          p.companyId === companyId &&
          (departmentFilter === 'all' || p.departmentId === departmentFilter)
      ),
    [store.positions, companyId, departmentFilter]
  )

  const pageCount = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = scoped.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const assignedCount = useCallback(
    (positionId: string) =>
      employees.employees.filter((e) => e.positionId === positionId).length,
    [employees.employees]
  )

  const { setPositionStatus } = store
  const columns = useMemo(
    () =>
      buildPositionColumns({
        departments: companyDepartments,
        payGrades: orgConfig.payGrades,
        payGradeEnabled: orgConfig.payGradeEnabled,
        assignedCount,
        canManage,
        onEdit: (p) => {
          setEditing(p)
          setOverlayOpen(true)
        },
        onToggleStatus: (p) =>
          setPositionStatus(p.id, p.status === 'active' ? 'inactive' : 'active'),
        onDelete: (p) => setDeleteTarget(p),
        onHistory: (p) => setHistoryTarget(p),
      }),
    [
      companyDepartments,
      orgConfig.payGrades,
      orgConfig.payGradeEnabled,
      canManage,
      assignedCount,
      setPositionStatus,
    ]
  )

  const deleteBlocked = deleteTarget ? assignedCount(deleteTarget.id) > 0 : false

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Position Catalogue ({scoped.length})
          </h2>
          {companies.length > 1 && (
            <Select value={companyId} onValueChange={onCompanyChange}>
              <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Select
            value={departmentFilter}
            onValueChange={(v) => {
              setDepartmentFilter(v)
              setPage(0)
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue placeholder='All departments' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {companyDepartments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Refresh'
            onClick={() => {
              setPage(0)
              toast.success('Position list refreshed')
            }}
          >
            <ArrowsClockwise size={16} weight='bold' />
          </Button>
          {canManage && (
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Position
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paged}
        variant='no-status'
        resetSelectionKey={`${companyId}-${departmentFilter}-${safePage}`}
      />

      {/* Paged browsing for large catalogues (POS-23). */}
      <div className='mt-2 flex items-center justify-between'>
        <span className='text-paragraph-sm text-neutral-1000'>
          Showing {scoped.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
          {Math.min((safePage + 1) * PAGE_SIZE, scoped.length)} of {scoped.length}{' '}
          positions
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Previous page'
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <CaretLeft size={14} weight='bold' />
          </Button>
          {Array.from({ length: pageCount }, (_, i) => (
            <Button
              key={i}
              variant={i === safePage ? 'default' : 'icon2'}
              className='h-7 w-7 px-0'
              onClick={() => setPage(i)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant='icon2'
            className='h-7 w-7'
            aria-label='Next page'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            <CaretRight size={14} weight='bold' />
          </Button>
        </div>
      </div>

      <PositionOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        position={editing}
        companyId={companyId}
        departments={companyDepartments}
        customFieldDefs={store.customFieldDefs.filter((d) => d.companyId === companyId)}
        existingPositions={store.positions}
        onSubmit={(draft) => {
          if (editing) {
            store.updatePosition(editing.id, draft)
          } else {
            // Position ID comes from the configured numbering series (POS-21/35).
            store.addPosition(draft, orgConfig.generateId(companyId, 'Position ID'))
          }
        }}
      />

      <PositionHistorySheet
        open={historyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null)
        }}
        position={historyTarget}
        definitionHistory={store.history}
        assignmentHistory={employees.assignmentHistory}
        employees={employees.employees}
      />

      {/* Delete guard — occupied positions cannot be removed (POS-08). */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteBlocked
                ? 'Position has assigned employees'
                : `Delete ${deleteTarget?.id}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBlocked
                ? `${assignedCount(deleteTarget?.id ?? '')} employee(s) currently hold "${deleteTarget?.name}". Reassign them first, or deactivate the position instead — historical assignments stay intact.`
                : `"${deleteTarget?.name}" has no assigned employees and will be removed from the company's position list. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteBlocked ? (
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget) store.setPositionStatus(deleteTarget.id, 'inactive')
                  setDeleteTarget(null)
                }}
              >
                Deactivate instead
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className='bg-destructive hover:bg-destructive/90 text-white'
                onClick={() => {
                  if (deleteTarget) store.deletePosition(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
