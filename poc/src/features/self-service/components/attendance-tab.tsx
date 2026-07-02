import { useMemo, useState } from 'react'
import { Plus, XCircle } from 'phosphor-react'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import {
  ATTENDANCE_REQUEST_STATUSES,
  SHIFT_STATUSES,
  type AttendanceRequest,
} from '../data/attendance'
import { type AttendanceStore } from '../hooks/use-attendance'
import {
  attendanceDayColumns,
  attendanceRequestColumns,
  shiftColumns,
} from './attendance-columns'
import { AttendanceRequestOverlay } from './attendance-request-overlay'
import { FilterBar, SummaryCards } from './shared'
import {
  applyFilter,
  EMPTY_FILTER,
  type PeriodStatusFilter,
} from './utils'

interface AttendanceTabProps {
  store: AttendanceStore
}

/**
 * Attendance surface (ESS-09): request lifecycle for out-time, comp-off,
 * overtime and WFH (ESS-18..21), shift assignments (ESS-22) and the per-day
 * time breakdown (ESS-23).
 */
export function AttendanceTab({ store }: AttendanceTabProps) {
  const { hasRole } = useRole()
  const isEmployee = hasRole('Employee (User)')

  const [requestFilter, setRequestFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [kindFilter, setKindFilter] = useState('All')
  const [shiftFilter, setShiftFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [dayFilter, setDayFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [showToday, setShowToday] = useState(false)

  const [selectedRequests, setSelectedRequests] = useState<AttendanceRequest[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const filteredRequests = useMemo(() => {
    const base = applyFilter(
      store.requests,
      requestFilter,
      (r) => r.fromDateTime,
      (r) => r.status
    )
    return kindFilter === 'All' ? base : base.filter((r) => r.kind === kindFilter)
  }, [store.requests, requestFilter, kindFilter])

  const filteredShifts = useMemo(
    () =>
      applyFilter(store.shifts, shiftFilter, (s) => s.fromDate, (s) => s.status),
    [store.shifts, shiftFilter]
  )

  const filteredDays = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const base = showToday
      ? store.days.filter((d) => d.date === today)
      : store.days
    return applyFilter(base, dayFilter, (d) => d.date, (d) => d.status)
  }, [store.days, dayFilter, showToday])

  const summary = useMemo(() => {
    const by = (status: AttendanceRequest['status']) =>
      store.requests.filter((r) => r.status === status).length
    return [
      { label: 'Total requests', value: store.requests.length },
      { label: 'Pending approval', value: by('Pending approval') },
      { label: 'Approved', value: by('Approved') },
      { label: 'Rejected / cancelled', value: by('Rejected') + by('Cancelled') },
    ]
  }, [store.requests])

  const cancellable = selectedRequests.filter(
    (r) => r.status === 'Pending approval'
  )

  const clearSelection = () => {
    setSelectedRequests([])
    setResetSelectionKey((prev) => prev + 1)
  }

  return (
    <Tabs defaultValue='requests' className='w-full'>
      <TabsList className='mb-3 bg-transparent p-0'>
        <TabsTrigger variant='primary' value='requests'>
          My Requests
        </TabsTrigger>
        <TabsTrigger variant='primary' value='shifts'>
          My Shift Assignments
        </TabsTrigger>
        <TabsTrigger variant='primary' value='daily'>
          My Attendance Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value='requests'>
        <SummaryCards title='Attendance Requests Summary' items={summary} />
        <FilterBar
          statuses={ATTENDANCE_REQUEST_STATUSES}
          value={requestFilter}
          onChange={setRequestFilter}
        >
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className='h-8 w-[180px] bg-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All request types</SelectItem>
              <SelectItem value='Out Time'>Out Time</SelectItem>
              <SelectItem value='Comp Off'>Comp Off</SelectItem>
              <SelectItem value='Overtime'>Overtime</SelectItem>
              <SelectItem value='Work From Home'>Work From Home</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Requests ({filteredRequests.length})
          </h2>
          {isEmployee && (
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                className='h-7 gap-1 rounded-[6px] px-2'
                disabled={cancellable.length === 0}
                onClick={() => {
                  cancellable.forEach((r) => store.cancelRequest(r.id))
                  clearSelection()
                }}
              >
                <XCircle size={13} weight='bold' />
                Cancel selected
              </Button>
              <Button
                variant='red'
                onClick={() => setOverlayOpen(true)}
                className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
              >
                <Plus size={10} weight='bold' />
                Add New Request
              </Button>
            </div>
          )}
        </div>

        <DataTable
          columns={attendanceRequestColumns}
          data={filteredRequests}
          variant='no-status'
          resetSelectionKey={resetSelectionKey}
          onSelectionChange={(rows) => setSelectedRequests(rows)}
        />
      </TabsContent>

      <TabsContent value='shifts'>
        <FilterBar
          statuses={SHIFT_STATUSES}
          value={shiftFilter}
          onChange={setShiftFilter}
        />
        <DataTable
          columns={shiftColumns}
          data={filteredShifts}
          variant='no-status'
        />
      </TabsContent>

      <TabsContent value='daily'>
        <FilterBar
          statuses={['Present', 'WFH', 'Half day', 'Absent']}
          value={dayFilter}
          onChange={setDayFilter}
        >
          <Button
            variant={showToday ? 'default' : 'outline'}
            className='h-8 rounded-[6px] px-3'
            onClick={() => setShowToday((v) => !v)}
          >
            Show today
          </Button>
        </FilterBar>
        <DataTable
          columns={attendanceDayColumns}
          data={filteredDays}
          variant='no-status'
        />
      </TabsContent>

      <AttendanceRequestOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        onSubmit={(draft) => {
          store.addRequest(draft)
          clearSelection()
        }}
      />
    </Tabs>
  )
}
