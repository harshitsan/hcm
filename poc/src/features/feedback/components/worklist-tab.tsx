import { useMemo, useState } from 'react'
import { Eye, Plus, RotateCcw, Search, TimerReset, UserCog } from 'lucide-react'
import { useRole } from '@/context/role-context'
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

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<FeedbackEntry[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [detailEntry, setDetailEntry] = useState<FeedbackEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)

  const isCompanyAdmin = role === 'Company Admin'
  /** The signed-in reviewer persona holds the Feedback Coordinator role. */
  const isCoordinator =
    config.coordinatorRole.applicableEmployee === CURRENT_ADMIN

  /** FBG-03/09/10 — entries outside the role's scope are never rendered. */
  const scoped = useMemo(
    () => store.entries.filter((e) => (scope as string[]).includes(e.company)),
    [store.entries, scope]
  )

  /** EFG-02 — free-text keyword search across ref, subject, category, people. */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scoped.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (q === '') return true
      const haystack = [
        e.id,
        e.subject,
        e.category,
        e.company,
        e.assignedTo,
        e.submittedBy ?? '',
        e.onBehalfOf ?? '',
        e.anonymousRef ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [scoped, search, statusFilter, typeFilter])

  const hasCriteria =
    search.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all'

  /** EFG-03 — one Reset clears every search criterion and the selection. */
  const resetCriteria = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

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

      {/* Feedback Coordinator: acts on behalf of any employee and views/
          manages anonymous items (configured under Admin > Coordinator Role). */}
      {config.coordinatorRole.applicableEmployee && (
        <div className='bg-blue-150 text-blue-1400 mb-3 flex items-start gap-2 rounded-[6px] px-3 py-2 text-sm'>
          <UserCog className='mt-0.5 size-4 shrink-0' />
          <span>
            <span className='font-semibold'>
              Feedback Coordinator: {config.coordinatorRole.applicableEmployee}
            </span>{' '}
            ({config.coordinatorRole.roleName}) — can mark any entry as
            received or closed on behalf of any employee, and views and
            manages anonymous feedback/grievances in this queue.
          </span>
        </div>
      )}

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Worklist ({filtered.length})
          </h2>
          {/* EFG-02 — keyword search over the review queue. */}
          <div className='relative'>
            <Search className='text-neutral-1000 absolute top-1/2 left-2 size-3.5 -translate-y-1/2' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search ref, subject, person…'
              className='h-7 w-[220px] pl-7 text-xs'
              aria-label='Search worklist'
            />
          </div>
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
          {/* EFG-03 — single Reset clearing all criteria at once. */}
          <Button
            variant='outline'
            onClick={resetCriteria}
            disabled={!hasCriteria}
            className='h-7 gap-1 rounded-[6px] px-2'
          >
            <RotateCcw className='size-3.5' />
            Reset
          </Button>
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
          {(isCompanyAdmin || isCoordinator) && (
            <Button
              variant='red'
              onClick={() => setComposeOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              title={
                isCompanyAdmin
                  ? 'Company Admin: file for an Employee (Non-User)'
                  : 'Feedback Coordinator: act on behalf of any employee'
              }
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
        onRespond={(draft) => {
          if (!detailEntry) return
          store.respondToEntry(detailEntry.id, draft, `${CURRENT_ADMIN} (${role})`)
          setDetailOpen(false)
          setDetailEntry(null)
          clearSelection()
        }}
      />
    </div>
  )
}
