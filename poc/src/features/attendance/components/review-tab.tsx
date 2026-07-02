import { useMemo, useState } from 'react'
import { ArrowsClockwise, DownloadSimple, Plus, ShieldWarning, UserSwitch } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { CAPTURE_SOURCES, type AttendanceRecord } from '../data/attendance'
import { EMPLOYEES } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { attendanceColumns } from './attendance-columns'
import { ManualEntryOverlay } from './manual-entry-overlay'
import { OverrideDialog } from './override-dialog'
import { RecordDetailSheet } from './record-detail-sheet'
import { SummaryCards } from './summary-cards'

/**
 * Company Admin review dashboard (TNA-01/13/18/19/23/25): consolidated
 * register from all capture sources with manual entry, overrides + audit,
 * unmatched resolution, duplicate reconciliation and export.
 */
export function ReviewTab({ attendance }: { attendance: AttendanceStore }) {
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<AttendanceRecord[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<AttendanceRecord | null>(null)
  const [detailTarget, setDetailTarget] = useState<AttendanceRecord | null>(null)
  const [matchTo, setMatchTo] = useState('')

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const data = useMemo(
    () =>
      attendance.records.filter(
        (r) =>
          (sourceFilter === 'all' || r.source === sourceFilter) &&
          (statusFilter === 'all' || r.status === statusFilter)
      ),
    [attendance.records, sourceFilter, statusFilter]
  )

  const s = attendance.summary
  const single = selectedRows.length === 1 ? selectedRows[0] : null
  const unmatchedSelected = single?.status === 'unmatched'

  return (
    <div className='w-full'>
      <SummaryCards
        title='Attendance Review — all capture sources'
        items={[
          { label: 'Consolidated records', value: s.total },
          { label: 'Pending exceptions', value: s.exceptions },
          { label: 'Unmatched / duplicates', value: `${s.unmatched} / ${s.duplicates}` },
          { label: 'Statutory violations', value: s.violations },
        ]}
      />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Attendance Register ({data.length})
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All sources</SelectItem>
              {CAPTURE_SOURCES.map((src) => (
                <SelectItem key={src} value={src} className='capitalize'>
                  {src}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='pending-approval'>Pending approval</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='flagged'>Flagged</SelectItem>
              <SelectItem value='unmatched'>Unmatched</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Export'
            onClick={() =>
              toast.success('Attendance & compliance data exported for audit (attendance-export.xlsx)')
            }
          >
            <DownloadSimple size={16} weight='bold' />
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={attendance.reconcileDuplicates}
          >
            <ArrowsClockwise size={14} weight='bold' />
            Reconcile Duplicates
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1'
            disabled={!single}
            onClick={() => setDetailTarget(single)}
          >
            Audit Trail
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1'
            disabled={!single || single.status === 'unmatched'}
            onClick={() => setOverrideTarget(single)}
          >
            <ShieldWarning size={14} weight='bold' />
            Override…
          </Button>
          <Button
            variant='red'
            onClick={() => setManualOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Manual Entry
          </Button>
        </div>
      </div>

      {unmatchedSelected && (
        <div className='mb-3 flex items-center gap-2 rounded-[6px] border border-gray-200 bg-white px-3 py-2'>
          <UserSwitch size={16} weight='bold' className='text-orange-1200' />
          <span className='text-sm'>
            Unmatched punch from {single?.origin} — resolve to an employee:
          </span>
          <Select value={matchTo} onValueChange={setMatchTo}>
            <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
              <SelectValue placeholder='Select employee' />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEES.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7'
            disabled={!matchTo}
            onClick={() => {
              if (single) attendance.resolveUnmatched(single.id, matchTo)
              setMatchTo('')
              clearSelection()
            }}
          >
            Match
          </Button>
        </div>
      )}

      <DataTable
        columns={attendanceColumns}
        data={data}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <ManualEntryOverlay
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSubmit={(draft) => {
          attendance.addManual(draft)
          clearSelection()
        }}
      />
      <OverrideDialog
        record={overrideTarget}
        onOpenChange={(open) => !open && setOverrideTarget(null)}
        onSubmit={(id, punchIn, punchOut, reason) => {
          attendance.overrideRecord(id, punchIn, punchOut, reason)
          clearSelection()
        }}
      />
      <RecordDetailSheet
        record={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />
    </div>
  )
}
