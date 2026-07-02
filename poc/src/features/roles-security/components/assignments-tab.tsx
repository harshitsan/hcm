import { useMemo, useState } from 'react'
import { Plus, Prohibit } from 'phosphor-react'
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
import { DataTable } from '@/components/common/data-table/table'
import { useRole } from '@/context/role-context'
import { authorizedCompanyIds } from '../data/authority'
import { type RoleAssignment } from '../data/assignments'
import { personName } from '../data/directory'
import { type RoleDef } from '../data/roles'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { assignmentColumns } from './assignment-columns'
import { AssignmentOverlay } from './assignment-overlay'

/**
 * Effective-dated role assignments with as-of reconstruction (RSEC-15),
 * per-company roles for multi-company users (RSEC-02) and authority-scoped
 * visibility (RSEC-11): rows outside the persona's companies are filtered
 * out — the same predicate row-level security applies at persistence.
 */
export function AssignmentsTab({
  store,
  roles,
}: {
  store: AssignmentsStore
  roles: RoleDef[]
}) {
  const { role: actorRole } = useRole()
  const today = new Date().toISOString().slice(0, 10)
  const [asOf, setAsOf] = useState(today)
  const [selectedRows, setSelectedRows] = useState<RoleAssignment[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const authorized = authorizedCompanyIds(actorRole)
  const visible = useMemo(
    () => store.assignments.filter((a) => authorized.includes(a.companyId)),
    [store.assignments, authorized]
  )
  const columns = useMemo(() => assignmentColumns(roles, asOf), [roles, asOf])

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const onConfirmEnd = () => {
    selectedRows.forEach((a) => store.endAssignment(a.id))
    setConfirmEnd(false)
    clearSelection()
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Role Assignments ({visible.length})
          </h2>
          <label className='text-neutral-1000 flex items-center gap-2 text-xs'>
            View as-of
            <Input
              type='date'
              value={asOf}
              onChange={(e) => setAsOf(e.target.value || today)}
              className='h-7 w-38'
            />
          </label>
          {asOf !== today && (
            <Button
              variant='outline'
              className='h-7'
              onClick={() => setAsOf(today)}
            >
              Back to today
            </Button>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length === 0}
            onClick={() => setConfirmEnd(true)}
            aria-label='End assignment'
          >
            <Prohibit size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => setOverlayOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Assignment
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visible}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <p className='text-neutral-1000 text-xs'>
        Assignments are effective-dated, bitemporal records: ending one closes
        it with an effective-to date and the row remains as history. Change
        the as-of date above to reconstruct exactly who held which role at
        that moment; scheduled assignments activate automatically on their
        effective date. Only companies within your authority are listed.
      </p>

      <AssignmentOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        roles={roles}
        onSubmit={store.assign}
      />

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              End {selectedRows.length === 1 ? 'assignment' : 'assignments'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `${personName(selectedRows[0]?.personId)}'s assignment will be closed with today's date.`
                : `${selectedRows.length} assignments will be closed with today's date.`}{' '}
              The records are retained as history and remain queryable as-of
              any past date — nothing is deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmEnd}>
              End assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
