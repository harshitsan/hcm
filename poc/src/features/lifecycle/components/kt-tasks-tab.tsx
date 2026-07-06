import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/common/data-table/table'
import { KT_STATUSES, type KtTask } from '../data/knowledge-transfer'
import { fmtDate } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { StatusBadge } from './badges'
import { ktTaskColumns, WeekBreakdown } from './kt-columns'
import { EMPTY_KT_FILTERS, KtFilterBar, useKtFiltered } from './kt-filter-bar'
import { RefreshButton } from './orientation-widgets'

interface KtTasksTabProps {
  store: KnowledgeTransferStore
}

/**
 * KT Tasks — manager oversight of every handover in flight, with the shared
 * active/inactive, period, department and status filters plus refresh.
 */
export function KtTasksTab({ store }: KtTasksTabProps) {
  const [filters, setFilters] = useState(EMPTY_KT_FILTERS)
  const [selected, setSelected] = useState<KtTask | null>(null)
  const tasks = useKtFiltered(store.tasks, filters, 'either')

  return (
    <div className='w-full'>
      {!store.moduleEnabled && (
        <p className='text-neutral-1000 mb-3 rounded-[6px] border border-gray-200 bg-white p-3 text-xs'>
          The Knowledge Transfer module is disabled in Admin → Knowledge
          Transfer setup. Existing tasks stay visible but new handovers cannot
          be raised.
        </p>
      )}
      <KtFilterBar filters={filters} onChange={setFilters} matchCount={tasks.length}>
        <RefreshButton
          onRefresh={() => store.refresh('tasks', 'KT tasks')}
          refreshedAt={store.refreshedAt.tasks}
        />
      </KtFilterBar>
      <DataTable
        columns={ktTaskColumns}
        data={tasks}
        variant='no-status'
        onRowClick={(row: KtTask) => setSelected(row)}
      />

      {/* Task detail + status flow */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>KT task · {selected?.task}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-3 text-sm'>
              <div className='flex flex-wrap items-center gap-2'>
                <StatusBadge status={selected.status} />
                <Badge variant='outline'>{selected.department}</Badge>
                <span className='text-neutral-1000 text-xs'>
                  {fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}
                </span>
              </div>
              <p>
                <span className='text-neutral-1000'>Provided by</span>{' '}
                {selected.provider}{' '}
                <span className='text-neutral-1000'>· received by</span>{' '}
                {selected.receiver}
              </p>
              <div>
                <p className='text-neutral-1000 mb-1 text-xs'>
                  Weekly plan (Su–Sa)
                </p>
                <WeekBreakdown week={selected.week} />
              </div>
            </div>
          )}
          <DialogFooter className='flex-wrap gap-2'>
            {selected &&
              KT_STATUSES.filter((s) => s !== selected.status).map((s) => (
                <Button
                  key={s}
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    store.setTaskStatus(selected, s)
                    setSelected(null)
                  }}
                >
                  Mark {s}
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
