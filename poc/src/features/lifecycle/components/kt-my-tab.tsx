import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import { SELF_EMPLOYEE } from '../data/shared'
import { type KnowledgeTransferStore } from '../hooks/use-knowledge-transfer'
import { ktProvidedColumns, ktReceivedColumns } from './kt-columns'
import { EMPTY_KT_FILTERS, KtFilterBar, useKtFiltered } from './kt-filter-bar'
import { RefreshButton } from './orientation-widgets'

interface MyKnowledgeTransferTabProps {
  store: KnowledgeTransferStore
}

/**
 * Employee Knowledge Transfer — "to be provided by me" and "to be received by
 * me" grids with searchable filters and a Su–Sa day-wise schedule per task.
 */
export function MyKnowledgeTransferTab({ store }: MyKnowledgeTransferTabProps) {
  const [providedFilters, setProvidedFilters] = useState(EMPTY_KT_FILTERS)
  const [receivedFilters, setReceivedFilters] = useState(EMPTY_KT_FILTERS)

  const providedByMe = useMemo(
    () => store.tasks.filter((t) => t.provider === SELF_EMPLOYEE),
    [store.tasks]
  )
  const receivedByMe = useMemo(
    () => store.tasks.filter((t) => t.receiver === SELF_EMPLOYEE),
    [store.tasks]
  )

  // Active/inactive filter inspects the counterpart on each side.
  const provided = useKtFiltered(providedByMe, providedFilters, 'receiver')
  const received = useKtFiltered(receivedByMe, receivedFilters, 'provider')

  return (
    <Tabs defaultValue='provided' className='w-full'>
      <TabsList className='mb-2'>
        <TabsTrigger variant='ghost' value='provided'>
          To be provided by me
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='received'>
          To be received by me
        </TabsTrigger>
      </TabsList>

      <TabsContent value='provided'>
        <p className='text-neutral-1000 mb-2 text-xs'>
          Knowledge you are handing over to colleagues, with the day-wise
          weekly schedule for each task.
        </p>
        <KtFilterBar
          filters={providedFilters}
          onChange={setProvidedFilters}
          matchCount={provided.length}
        >
          <RefreshButton
            onRefresh={() => store.refresh('provided', 'Knowledge transfer (provided)')}
            refreshedAt={store.refreshedAt.provided}
          />
        </KtFilterBar>
        <DataTable columns={ktProvidedColumns} data={provided} variant='no-status' />
      </TabsContent>

      <TabsContent value='received'>
        <p className='text-neutral-1000 mb-2 text-xs'>
          Knowledge transfer sessions scheduled for you to receive, with the
          Su–Sa breakdown of each week.
        </p>
        <KtFilterBar
          filters={receivedFilters}
          onChange={setReceivedFilters}
          matchCount={received.length}
        >
          <RefreshButton
            onRefresh={() => store.refresh('received', 'Knowledge transfer (received)')}
            refreshedAt={store.refreshedAt.received}
          />
        </KtFilterBar>
        <DataTable columns={ktReceivedColumns} data={received} variant='no-status' />
      </TabsContent>
    </Tabs>
  )
}
