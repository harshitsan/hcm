import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { RoleGate } from '@/context/role-context'
import { type ExitTypeDef } from '../data/config'
import { type ExitCase } from '../data/exits'
import { type ExitsStore } from '../hooks/use-exits'
import { ExitDetailSheet } from './exit-detail-sheet'
import { NewExitOverlay } from './new-exit-overlay'
import { exitColumns } from './exit-columns'

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'clearance-in-progress', label: 'Clearance In Progress' },
  { value: 'finalized', label: 'Finalized' },
  { value: 'rejected', label: 'Rejected' },
]

interface ExitsTabProps {
  store: ExitsStore
  exitTypes: ExitTypeDef[]
  exitManagementEnabled: boolean
}

/** Admin exits grid — approvals, clearance and completion tracking. */
export function ExitsTab({ store, exitTypes, exitManagementEnabled }: ExitsTabProps) {
  const [status, setStatus] = useState('all')
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const data = useMemo(
    () =>
      status === 'all'
        ? store.exits
        : store.exits.filter((e) => e.status === status),
    [status, store.exits]
  )

  const selected = store.exits.find((e) => e.id === selectedId) ?? null

  if (!exitManagementEnabled) {
    return (
      <div className='rounded-[6px] border border-gray-200 bg-white p-6 text-center'>
        <p className='text-neutral-1600 text-sm font-medium'>
          Exit management is disabled
        </p>
        <p className='text-neutral-1000 mt-1 text-xs'>
          Enable “Does your organization support exit management?” in
          Configuration → Exit to use this module.
        </p>
      </div>
    )
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Exits ({data.length})
        </h2>
        <div className='flex items-center gap-3'>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RoleGate roles={['Company Admin']}>
            <Button
              variant='red'
              onClick={() => setNewOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Record Exit
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={exitColumns}
        data={data}
        variant='no-status'
        onRowClick={(row: ExitCase) => setSelectedId(row.id)}
      />

      <NewExitOverlay
        open={newOpen}
        onOpenChange={setNewOpen}
        exitTypes={exitTypes}
        raisedBy='Admin (proxy)'
        onSubmit={store.addExit}
      />
      <ExitDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        exitCase={selected}
        store={store}
      />
    </div>
  )
}
