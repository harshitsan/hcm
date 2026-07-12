import { useState } from 'react'
import {
  ArrowsClockwise,
  PaperPlaneTilt,
  Pause,
  PencilSimple,
  Plus,
  Trash,
} from 'phosphor-react'
import { RoleGate } from '@/context/role-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table/table'
import { type ReportDef } from '../data/report-catalog'
import { type ReportSchedule } from '../data/schedules'
import { type SchedulesStore } from '../hooks/use-schedules'
import { StatusBadge } from './badges'
import { scheduleColumns } from './schedule-columns'
import { ScheduleOverlay } from './schedule-overlay'

interface SchedulesTabProps {
  store: SchedulesStore
  reports: ReportDef[]
  actor: string
  scope: string
}

/**
 * Scheduled report delivery desk (RPT-09) with the Notification/Template
 * engine's delivery log and retry handling for Platform Admins (RPT-24).
 */
export function SchedulesTab({
  store,
  reports,
  actor,
  scope,
}: SchedulesTabProps) {
  const [selectedRows, setSelectedRows] = useState<ReportSchedule[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<ReportSchedule | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const clearSelection = () => {
    setSelectedRows([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const single = selectedRows.length === 1 ? selectedRows[0] : null

  const onConfirmCancel = () => {
    selectedRows
      .filter((s) => s.status !== 'cancelled')
      .forEach((s) => store.cancelSchedule(s.id))
    setConfirmCancel(false)
    clearSelection()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Scheduled Deliveries ({store.schedules.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            Delivered via Notifications &amp; Comms (F7) — the engine renders
            each report and emails it on schedule
          </span>
        </h2>
        <div className='flex items-center gap-3'>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Run now'
            disabled={!single || single.status !== 'active'}
            onClick={() => {
              if (single) store.runNow(single)
              clearSelection()
            }}
          >
            <PaperPlaneTilt size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Pause or resume'
            disabled={!single || single.status === 'cancelled'}
            onClick={() => {
              if (single) store.togglePause(single.id)
              clearSelection()
            }}
          >
            <Pause size={16} weight='bold' />
          </Button>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit'
            disabled={!single}
            onClick={() => {
              setEditing(single)
              setOverlayOpen(true)
            }}
          >
            <PencilSimple size={16} weight='fill' />
          </Button>
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Cancel schedule'
            disabled={selectedRows.length === 0}
            onClick={() => setConfirmCancel(true)}
          >
            <Trash size={16} weight='bold' />
          </Button>
          <Button
            variant='red'
            onClick={() => {
              setEditing(null)
              setOverlayOpen(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Schedule
          </Button>
        </div>
      </div>

      <DataTable
        columns={scheduleColumns}
        data={store.schedules}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      {/* Engine delivery log (RPT-24) */}
      <div className='mt-4 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <p className='text-neutral-1600 text-sm font-semibold'>
            Engine delivery log
          </p>
          <RoleGate roles={['Platform Admin']}>
            <span className='text-neutral-1000 text-xs'>
              retry policy: 3 attempts · 5 min backoff · outcomes recorded
            </span>
          </RoleGate>
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Report</th>
              <th className='px-2 font-medium'>Ran at</th>
              <th className='px-2 font-medium'>Outcome</th>
              <th className='px-2 font-medium'>Attempts</th>
              <th className='px-2 font-medium'>Detail</th>
              <th className='px-2 font-medium' />
            </tr>
          </thead>
          <tbody>
            {store.deliveries.map((d) => (
              <tr key={d.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{d.reportName}</td>
                <td className='px-2'>{d.ranAt}</td>
                <td className='px-2'>
                  <StatusBadge status={d.outcome} />
                </td>
                <td className='px-2'>{d.attempts}</td>
                <td className='text-neutral-1000 max-w-[320px] truncate px-2 text-xs'>
                  {d.detail}
                </td>
                <td className='px-2 text-right'>
                  {d.outcome === 'failed' && (
                    <RoleGate roles={['Platform Admin']}>
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => store.retryDelivery(d.id)}
                      >
                        <ArrowsClockwise size={12} weight='bold' />
                        Retry
                      </Button>
                    </RoleGate>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ScheduleOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        schedule={editing}
        reports={reports}
        createdBy={actor}
        scope={scope}
        onSubmit={(draft) => {
          if (editing) store.updateSchedule(editing.id, draft)
          else store.addSchedule(draft)
          clearSelection()
        }}
      />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel {selectedRows.length === 1 ? 'schedule' : 'schedules'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length === 1
                ? `“${selectedRows[0]?.reportName}” will stop being delivered.`
                : `${selectedRows.length} schedules will stop being delivered.`}{' '}
              Future engine runs will skip{' '}
              {selectedRows.length === 1 ? 'it' : 'them'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmCancel}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Cancel deliveries
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
