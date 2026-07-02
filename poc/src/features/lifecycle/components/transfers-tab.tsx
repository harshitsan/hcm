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
import { RoleGate, useRole } from '@/context/role-context'
import { TRANSFER_TYPES, type TransferRequest } from '../data/transfers'
import { type TransfersStore } from '../hooks/use-transfers'
import { NewTransferOverlay } from './new-transfer-overlay'
import { TransferDetailSheet } from './transfer-detail-sheet'
import { transferColumns } from './transfer-columns'

interface TransfersTabProps {
  store: TransfersStore
}

/**
 * Transfer requests grid. Group Company Admins see the inter-company queue
 * awaiting their group-level authorization first.
 */
export function TransfersTab({ store }: TransfersTabProps) {
  const { hasRole } = useRole()
  const [typeFilter, setTypeFilter] = useState('all')
  const [newOpen, setNewOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isGroupAdmin = hasRole('Group Company Admin')

  const data = useMemo(() => {
    let rows = store.transfers
    if (typeFilter !== 'all') rows = rows.filter((t) => t.type === typeFilter)
    if (isGroupAdmin) {
      // Surface transfers waiting on the group-level step first.
      rows = [...rows].sort((a, b) => {
        const waiting = (t: TransferRequest) =>
          t.approvals.some(
            (s) => s.role === 'Group Admin' && s.status === 'pending'
          ) &&
          t.approvals
            .filter((s) => s.role !== 'Group Admin')
            .every((s) => s.status === 'approved')
            ? 0
            : 1
        return waiting(a) - waiting(b)
      })
    }
    return rows
  }, [isGroupAdmin, store.transfers, typeFilter])

  const selected = store.transfers.find((t) => t.id === selectedId) ?? null

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Transfers ({data.length})
          {isGroupAdmin && (
            <span className='text-neutral-1000 ml-2 text-xs'>
              inter-company moves need your group-level authorization
            </span>
          )}
        </h2>
        <div className='flex items-center gap-3'>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {TRANSFER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
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
              New Transfer
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={transferColumns}
        data={data}
        variant='no-status'
        onRowClick={(row: TransferRequest) => setSelectedId(row.id)}
      />

      <NewTransferOverlay
        open={newOpen}
        onOpenChange={setNewOpen}
        onSubmit={store.addTransfer}
      />
      <TransferDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        transfer={selected}
        store={store}
      />
    </div>
  )
}
