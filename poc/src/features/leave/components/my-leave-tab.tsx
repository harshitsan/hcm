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
import { toast } from 'sonner'
import { DataTable } from '@/components/common/data-table/table'
import { remaining } from '../data/balances'
import { type LeaveType } from '../data/leave-types'
import { type FmlaReason } from '../data/config'
import { type LeaveRequest } from '../data/requests'
import { fmtDate } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { ApplyLeaveOverlay } from './apply-leave-overlay'
import { LeaveSummaryCards } from './leave-summary-cards'
import { RequestDetailSheet } from './request-detail-sheet'
import { StatusBadge } from './badges'
import { requestColumns } from './request-columns'

interface MyLeaveTabProps {
  employeeId: string
  requests: LeaveRequestsStore
  balances: BalancesStore
  leaveTypes: LeaveType[]
  fmlaReasons: FmlaReason[]
  /** Read-only mode for the Employee (Non-User) view (LVE-29). */
  readOnly?: boolean
}

/**
 * Self-service leave: balances (LVE-14), detailed time-off summary (LVE-34),
 * request list with apply/withdraw/cancel (LVE-03/15), and comp-off credits
 * (LVE-16).
 */
export function MyLeaveTab({
  employeeId,
  requests,
  balances,
  leaveTypes,
  fmlaReasons,
  readOnly = false,
}: MyLeaveTabProps) {
  const [applyOpen, setApplyOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [year, setYear] = useState('2026')

  const myRequests = useMemo(
    () =>
      requests.requests.filter(
        (r) => r.employeeId === employeeId && r.from.startsWith(year)
      ),
    [employeeId, requests.requests, year]
  )
  const myBalances = balances.balances.filter((b) => b.employeeId === employeeId)
  const myCredits = balances.compOffCredits.filter(
    (c) => c.employeeId === employeeId
  )
  const selected = requests.requests.find((r) => r.id === selectedId) ?? null

  const typeName = (id: string) =>
    leaveTypes.find((t) => t.id === id)?.name ?? id
  const typeUnit = (id: string) =>
    leaveTypes.find((t) => t.id === id)?.unit ?? 'days'

  const cards = [
    {
      label: 'Available (all paid types)',
      value: myBalances
        .filter((b) => leaveTypes.find((t) => t.id === b.typeId)?.category === 'paid')
        .reduce((sum, b) => sum + remaining(b), 0),
    },
    {
      label: 'Pending approval',
      value: myRequests.filter((r) => r.status === 'pending').length,
    },
    {
      label: 'Tentative requests',
      value: myRequests.filter((r) => r.tentative && r.status !== 'withdrawn').length,
    },
    {
      label: 'Comp-off credits available',
      value: myCredits.filter((c) => c.status === 'available').length,
    },
  ]

  const columns = useMemo(() => requestColumns(false), [])

  return (
    <div className='w-full'>
      <LeaveSummaryCards title='My Leave Summary' items={cards} />

      {/* LVE-34: detailed time-off summary by type */}
      <div className='mb-4 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My Time Off Summary
          </h2>
          <div className='flex items-center gap-2'>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger variant='secondary' className='h-7 w-[100px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='2026'>2026</SelectItem>
                <SelectItem value='2025'>2025</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              className='h-7'
              onClick={() => toast.success('Summary refreshed — latest figures shown')}
            >
              Refresh
            </Button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Leave type</th>
                <th className='px-2 font-medium'>Credits</th>
                <th className='px-2 font-medium'>Taken</th>
                <th className='px-2 font-medium'>Tentative</th>
                <th className='px-2 font-medium'>Scheduled</th>
                <th className='px-2 font-medium'>Pending approval</th>
                <th className='px-2 font-medium'>LOP pending</th>
                <th className='px-2 font-medium'>LOP approved</th>
                <th className='px-2 font-medium'>Cancelled</th>
                <th className='px-2 font-medium'>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {myBalances.map((b) => (
                <tr key={b.typeId} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>
                    {typeName(b.typeId)}{' '}
                    <span className='text-neutral-1000 text-xs'>({typeUnit(b.typeId)})</span>
                  </td>
                  <td className='px-2'>{b.credited}</td>
                  <td className='px-2'>{b.taken}</td>
                  <td className='px-2 text-orange-600'>{b.tentative}</td>
                  <td className='px-2'>{b.scheduled}</td>
                  <td className='px-2'>{b.pendingApproval}</td>
                  <td className='text-red-1400 px-2'>{b.lopPending}</td>
                  <td className='text-red-1400 px-2'>{b.lopApproved}</td>
                  <td className='text-neutral-1000 px-2'>{b.cancelled}</td>
                  <td className='px-2 font-semibold'>{remaining(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests list */}
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          My Requests ({myRequests.length})
        </h2>
        {!readOnly && (
          <Button
            variant='red'
            onClick={() => setApplyOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Apply Time Off
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={myRequests}
        variant='no-status'
        onRowClick={(row: LeaveRequest) => setSelectedId(row.id)}
      />

      {/* LVE-16: comp-off credits */}
      <div className='mt-4 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Comp-off Credits
          </h2>
          {!readOnly && (
            <Button
              variant='outline'
              className='h-7'
              onClick={() =>
                balances.earnCompOff(employeeId, 'Weekend support shift (self-reported, pending policy check)')
              }
            >
              Log eligible extra work
            </Button>
          )}
        </div>
        <div className='space-y-2'>
          {myCredits.length === 0 && (
            <p className='text-neutral-1000 text-sm'>No comp-off credits yet.</p>
          )}
          {myCredits.map((c) => (
            <div
              key={c.id}
              className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2 text-sm'
            >
              <div>
                <div className='font-medium'>{c.source}</div>
                <div className='text-neutral-1000 text-xs'>
                  Earned {fmtDate(c.earnedOn)} · expires {fmtDate(c.expiresOn)} (lapses if unused)
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>

      <ApplyLeaveOverlay
        open={applyOpen}
        onOpenChange={setApplyOpen}
        employeeId={employeeId}
        leaveTypes={leaveTypes}
        fmlaReasons={fmlaReasons}
        remainingFor={balances.remainingFor}
        hasOverlap={requests.hasOverlap}
        onSubmit={requests.submit}
        onBehalfOf={null}
      />
      <RequestDetailSheet
        open={selected !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null)
        }}
        request={selected}
        store={requests}
        remainingFor={balances.remainingFor}
        fmlaReasons={fmlaReasons}
        canApprove={false}
        asSupervisor={false}
        isOwner={!readOnly}
        isAdmin={false}
      />
    </div>
  )
}
