import { useMemo, useState } from 'react'
import { Eye, Plus, TimerReset } from 'lucide-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import {
  companiesForRole,
  CURRENT_ADMIN,
  ENTRY_STATUSES,
  type FeedbackEntry,
} from '../data/entries'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'
import { type FeedbackEntriesStore } from '../hooks/use-feedback-entries'
import { createWorklistColumns } from './entries-table-columns'
import { EntryDetailSheet } from './entry-detail-sheet'
import { FeedbackSummary } from './feedback-summary'
import { NewEntryOverlay } from './new-entry-overlay'

interface WorklistTabProps {
  store: FeedbackEntriesStore
  configStore: FeedbackConfigStore
}

/**
 * Reviewer worklist (FBG-02/03/05/09/10/16/19/27): a scope-filtered grid —
 * each admin role sees only the companies within its authorization — with
 * quick filters, role-gated review actions and the SLA engine trigger.
 */
export function WorklistTab({ store, configStore }: WorklistTabProps) {
  const { role } = useRole()
  const { config } = configStore
  const scope = useMemo(() => companiesForRole(role), [role])

  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<FeedbackEntry[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [detailEntry, setDetailEntry] = useState<FeedbackEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)

  const isCompanyAdmin = role === 'Company Admin'

  /** FBG-03/09/10 — entries outside the role's scope are never rendered. */
  const scoped = useMemo(
    () => store.entries.filter((e) => (scope as string[]).includes(e.company)),
    [store.entries, scope]
  )

  const filtered = useMemo(
    () =>
      scoped.filter(
        (e) =>
          (statusFilter === 'all' || e.status === statusFilter) &&
          (typeFilter === 'all' || e.type === typeFilter)
      ),
    [scoped, statusFilter, typeFilter]
  )

  const summary = useMemo(() => {
    const by = (statuses: FeedbackEntry['status'][]) =>
      scoped.filter((e) => statuses.includes(e.status)).length
    const breaching = scoped.filter(
      (e) =>
        (e.status === 'Submitted' || e.status === 'Under Review') &&
        Math.floor((Date.now() - new Date(e.lastActionOn).getTime()) / 86_400_000) >=
          config.approverReminderDays
    ).length
    return [
      { label: 'In scope', value: scoped.length },
      { label: 'Awaiting review', value: by(['Submitted']) },
      { label: 'Under review', value: by(['Under Review']) },
      { label: 'Escalated / Held', value: by(['Escalated', 'On Hold']) },
      { label: 'Breaching SLA', value: breaching },
    ]
  }, [scoped, config.approverReminderDays])

  const columns = useMemo(
    () => createWorklistColumns(config.approverReminderDays),
    [config.approverReminderDays]
  )

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  const openDetail = () => {
    if (selectedRows.length !== 1) return
    const fresh = store.entries.find((e) => e.id === selectedRows[0].id)
    setDetailEntry(fresh ?? selectedRows[0])
    setDetailOpen(true)
  }

  return (
    <div className='w-full'>
      <FeedbackSummary title={`Review Queue — scope: ${scope.join(', ')} (${role})`} items={summary} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Worklist ({filtered.length})
          </h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {ENTRY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='Feedback'>Feedback</SelectItem>
              <SelectItem value='Grievance'>Grievance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() =>
              store.runSlaEngine(
                config.approverReminderDays,
                config.coordinatorReminderDays,
                config.coordinator
              )
            }
            className='h-7 gap-1 rounded-[6px] px-2'
          >
            <TimerReset className='size-3.5' />
            Run SLA engine
          </Button>
          <Button
            variant='icon2'
            onClick={openDetail}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length !== 1}
            aria-label='Review entry'
          >
            <Eye className='size-4' />
          </Button>
          {isCompanyAdmin && (
            <Button
              variant='red'
              onClick={() => setComposeOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus className='size-3' />
              Submit on behalf
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
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
        allowOnBehalf
        onSubmit={(draft) => {
          store.submitEntry(draft, {
            anonymousReceivers: config.anonymousReceivers,
            nonAnonymousReceivers: config.nonAnonymousReceivers,
            schemaVersion: config.schemaVersion,
            company: scope[0],
            actor: CURRENT_ADMIN,
          })
          clearSelection()
        }}
      />

      <EntryDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setDetailEntry(null)
            clearSelection()
          }
        }}
        formFields={config.formFields}
        canReview
        canViewAudit
        coordinator={config.coordinator}
        onUpdateStatus={(status, note) => {
          if (!detailEntry) return
          store.updateStatus(detailEntry.id, status, note, `${CURRENT_ADMIN} (${role})`)
          setDetailOpen(false)
          setDetailEntry(null)
          clearSelection()
        }}
        onEscalate={() => {
          if (!detailEntry || !config.coordinator) return
          store.escalate(detailEntry.id, config.coordinator, `${CURRENT_ADMIN} (${role})`)
          setDetailOpen(false)
          setDetailEntry(null)
          clearSelection()
        }}
      />
    </div>
  )
}
