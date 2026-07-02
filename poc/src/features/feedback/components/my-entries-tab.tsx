import { useMemo, useState } from 'react'
import { Eye, Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { CURRENT_EMPLOYEE, type FeedbackEntry } from '../data/entries'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'
import { type FeedbackEntriesStore } from '../hooks/use-feedback-entries'
import { EntryDetailSheet } from './entry-detail-sheet'
import { myEntriesColumns } from './entries-table-columns'
import { FeedbackSummary } from './feedback-summary'
import { NewEntryOverlay } from './new-entry-overlay'

interface MyEntriesTabProps {
  store: FeedbackEntriesStore
  configStore: FeedbackConfigStore
  /** Company Admins may also file entries on behalf of non-user employees. */
  allowOnBehalf: boolean
}

/**
 * Employee self-service (FBG-01/04/11/17/18/20/30): submit entries via the
 * config-driven form (optionally anonymously), then track each entry's
 * status. Only the signed-in employee's own entries are visible here.
 */
export function MyEntriesTab({ store, configStore, allowOnBehalf }: MyEntriesTabProps) {
  const { config } = configStore
  const [selectedRows, setSelectedRows] = useState<FeedbackEntry[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)
  const [detailEntry, setDetailEntry] = useState<FeedbackEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const myEntries = useMemo(
    () => store.entries.filter((e) => e.isMine),
    [store.entries]
  )

  const summary = useMemo(() => {
    const by = (statuses: FeedbackEntry['status'][]) =>
      myEntries.filter((e) => statuses.includes(e.status)).length
    return [
      { label: 'My entries', value: myEntries.length },
      { label: 'Awaiting review', value: by(['Submitted', 'On Hold']) },
      { label: 'In review', value: by(['Under Review', 'Escalated']) },
      { label: 'Resolved / Closed', value: by(['Resolved', 'Closed']) },
      { label: 'Anonymous', value: myEntries.filter((e) => e.anonymous).length },
    ]
  }, [myEntries])

  const openDetail = () => {
    if (selectedRows.length !== 1) return
    const fresh = store.entries.find((e) => e.id === selectedRows[0].id)
    setDetailEntry(fresh ?? selectedRows[0])
    setDetailOpen(true)
  }

  return (
    <div className='w-full'>
      <FeedbackSummary title='My Entries Summary' items={summary} />

      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My entries ({myEntries.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000 flex items-center gap-1'>
            <Lock className='size-3.5' />
            Grievance details are shared only with the receiver roles your
            company has authorized. You are notified on every status change.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            onClick={openDetail}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='View entry'
          >
            <Eye className='size-4' />
          </Button>
          <Button
            variant='red'
            onClick={() => setComposeOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus className='size-3' />
            New Entry
          </Button>
        </div>
      </div>

      <DataTable
        columns={myEntriesColumns}
        data={myEntries}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <NewEntryOverlay
        open={composeOpen}
        onOpenChange={setComposeOpen}
        categories={config.categories}
        formFields={config.formFields}
        anonymousEnabled={config.anonymousEnabled}
        allowOnBehalf={allowOnBehalf}
        onSubmit={(draft) => {
          store.submitEntry(draft, {
            anonymousReceivers: config.anonymousReceivers,
            nonAnonymousReceivers: config.nonAnonymousReceivers,
            schemaVersion: config.schemaVersion,
            company: 'Aster Retail',
            actor: CURRENT_EMPLOYEE,
          })
          setSelectedRows([])
          setResetSelectionKey((k) => k + 1)
        }}
      />

      <EntryDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailEntry(null)
        }}
        formFields={config.formFields}
        canReview={false}
        canViewAudit={false}
        coordinator={null}
        onUpdateStatus={() => undefined}
        onEscalate={() => undefined}
      />
    </div>
  )
}
