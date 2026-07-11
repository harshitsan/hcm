import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { RoleGate } from '@/context/role-context'
import { type LayoffBatch } from '../data/layoffs'
import { type LayoffsStore } from '../hooks/use-layoffs'
import { InitiateLayoffOverlay } from './initiate-layoff-overlay'
import { LayoffDetailSheet } from './layoff-detail-sheet'
import { layoffColumns } from './layoff-columns'

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'exited', label: 'Exited' },
]

interface LayoffsTabProps {
  store: LayoffsStore
}

/**
 * Layoff List — every layoff batch with period/status filters, bulk
 * initiation and the location-approver workflow (Layoff List screen).
 */
export function LayoffsTab({ store }: LayoffsTabProps) {
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [initiateOpen, setInitiateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const data = useMemo(
    () =>
      store.batches.filter(
        (b) =>
          (status === 'all' || b.status === status) &&
          (from === '' || b.initiatedOn >= from) &&
          (to === '' || b.initiatedOn <= to)
      ),
    [from, status, store.batches, to]
  )

  const selected = store.batches.find((b) => b.id === selectedId) ?? null

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Layoff List ({data.length})
        </h2>
        <div className='flex flex-wrap items-center gap-3'>
          <Input
            type='date'
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className='h-7 w-[150px]'
            aria-label='Initiated from'
          />
          <Input
            type='date'
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className='h-7 w-[150px]'
            aria-label='Initiated to'
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
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
              onClick={() => setInitiateOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Initiate Layoff
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={layoffColumns}
        data={data}
        variant='no-status'
        onRowClick={(row: LayoffBatch) => setSelectedId(row.id)}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Initiation is blocked when the remaining headcount at the location
        would fall below the configured minimum of {store.minEmployees}{' '}
        employees (Configuration → Exit → Layoff).
      </p>

      <InitiateLayoffOverlay
        open={initiateOpen}
        onOpenChange={setInitiateOpen}
        store={store}
      />
      <LayoffDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        batch={selected}
        store={store}
      />
    </div>
  )
}
