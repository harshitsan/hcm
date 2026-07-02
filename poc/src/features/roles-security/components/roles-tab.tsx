import { useState } from 'react'
import { ClockCounterClockwise, PencilSimple, Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import { type RoleDef } from '../data/roles'
import { type RolesStore } from '../hooks/use-roles'
import { ProjectRolesPanel } from './project-roles-panel'
import { roleColumns } from './role-columns'
import { RoleHistorySheet } from './role-history-sheet'
import { RoleOverlay } from './role-overlay'

/**
 * Role catalog (RSEC-01, RSEC-11, RSEC-18, RSEC-35) with search + reset,
 * admin flag, versioned edits and — for Company Admins — the project-role
 * catalog (RSEC-36).
 */
export function RolesTab({ store }: { store: RolesStore }) {
  const [search, setSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<RoleDef[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null)
  const [historyRole, setHistoryRole] = useState<RoleDef | null>(null)

  const filtered = store.roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const handleSubmit = (draft: Parameters<RolesStore['addRole']>[0]) => {
    const ok = editingRole
      ? store.updateRole(editingRole.id, draft)
      : store.addRole(draft)
    if (ok) clearSelection()
    return ok
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Role Catalog ({filtered.length})
          </h2>
          <Input
            placeholder='Search by role name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-7 w-56'
          />
          {search && (
            <Button
              variant='outline'
              className='h-7'
              onClick={() => setSearch('')}
            >
              Reset
            </Button>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            onClick={() => setHistoryRole(selectedRows[0] ?? null)}
            aria-label='Version history'
          >
            <ClockCounterClockwise size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            onClick={() => {
              setEditingRole(selectedRows[0] ?? null)
              setOverlayOpen(true)
            }}
            aria-label='Edit role'
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditingRole(null)
              setOverlayOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Role
          </Button>
        </div>
      </div>

      <DataTable
        columns={roleColumns}
        data={filtered}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <p className='text-neutral-1000 text-xs'>
        Roles are governed configuration: each is scoped to exactly one
        hierarchy level, permissions cascade only to entities beneath that
        level, and users without a granting role are denied. Edits save a new
        version — inspect history via the clock action.
      </p>

      <RoleGate roles={['Company Admin']}>
        <ProjectRolesPanel store={store} />
      </RoleGate>

      <RoleOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditingRole(null)
        }}
        role={editingRole}
        onSubmit={handleSubmit}
      />
      <RoleHistorySheet
        open={historyRole !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryRole(null)
        }}
        role={historyRole}
      />
    </div>
  )
}
