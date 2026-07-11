import { useMemo, useState } from 'react'
import { DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { remaining } from '../data/balances'
import { seedLeaveTypes, type LeaveType } from '../data/leave-types'
import { DEPARTMENTS, EMPLOYEES, fmtDate, todayISO } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { exportCsv } from '../utils/export-csv'
import { StatusBadge } from './badges'

export interface EmployeeSummaryTabProps {
  requestsStore: LeaveRequestsStore
  balancesStore: BalancesStore
  /** Live leave-type catalog; falls back to the seed catalog. */
  leaveTypes?: LeaveType[]
}

/**
 * Employee Time Off Summary (PDF: ETOS): per employee × time-off-type grid
 * with Taken / Scheduled / Balance / Pending Approvals / Pending & Approved
 * LOP, filterable by active/inactive, year, department and employee. The
 * Taken figure drills into the underlying taken requests.
 */
export function EmployeeSummaryTab({
  requestsStore,
  balancesStore,
  leaveTypes = seedLeaveTypes,
}: EmployeeSummaryTabProps) {
  // ETOS-05: active employees shown by default.
  const [empStatus, setEmpStatus] = useState('active')
  const [year, setYear] = useState('2026')
  const [department, setDepartment] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  /** employeeId::typeId of the row whose Taken detail is open. */
  const [takenKey, setTakenKey] = useState<string | null>(null)

  const typeById = useMemo(
    () => new Map(leaveTypes.map((t) => [t.id, t])),
    [leaveTypes]
  )

  const deptEmployees = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) => department === 'all' || e.department === department
      ),
    [department]
  )

  const rows = useMemo(
    () =>
      balancesStore.balances
        .map((b) => ({
          balance: b,
          employee: EMPLOYEES.find((e) => e.id === b.employeeId),
          type: typeById.get(b.typeId),
        }))
        .filter(
          (row) =>
            row.employee &&
            (empStatus === 'all' ||
              row.employee.active === (empStatus === 'active')) &&
            (department === 'all' || row.employee.department === department) &&
            (employeeFilter === 'all' || row.employee.id === employeeFilter)
        )
        .sort((a, b) =>
          a.employee!.name === b.employee!.name
            ? (a.type?.order ?? 99) - (b.type?.order ?? 99)
            : a.employee!.name.localeCompare(b.employee!.name)
        ),
    [balancesStore.balances, department, empStatus, employeeFilter, typeById]
  )

  const filtersDirty =
    empStatus !== 'active' ||
    year !== '2026' ||
    department !== 'all' ||
    employeeFilter !== 'all'

  const resetFilters = () => {
    setEmpStatus('active')
    setYear('2026')
    setDepartment('all')
    setEmployeeFilter('all')
  }

  /** ETOS export: real CSV download of the visible summary rows. */
  const handleExport = () => {
    exportCsv(
      `employee-timeoff-summary-${year}.csv`,
      [
        'Employee Code',
        'Employee Name',
        'Department',
        'Time Off Type',
        'Unit',
        'Taken',
        'Scheduled',
        'Balance',
        'Pending Approvals',
        'Pending Loss of Pay',
        'Approved Loss of Pay',
      ],
      rows.map(({ balance: b, employee: e, type: t }) => [
        e!.code,
        e!.name,
        e!.department,
        t?.name ?? b.typeId,
        t?.unit ?? 'days',
        b.taken,
        b.scheduled,
        remaining(b),
        b.pendingApproval,
        b.lopPending,
        b.lopApproved,
      ])
    )
    toast.success(
      `Exported ${rows.length} summary rows to employee-timeoff-summary-${year}.csv`
    )
  }

  const today = todayISO()
  const [takenEmployeeId, takenTypeId] = takenKey?.split('::') ?? [null, null]
  const takenEmployee = EMPLOYEES.find((e) => e.id === takenEmployeeId)
  const takenRequests = takenKey
    ? requestsStore.requests.filter(
        (r) =>
          r.employeeId === takenEmployeeId &&
          r.typeId === takenTypeId &&
          r.status === 'approved' &&
          r.from <= today &&
          r.from.startsWith(year)
      )
    : []

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Employee Time Off Summary ({rows.length})
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={empStatus} onValueChange={setEmpStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active employees</SelectItem>
              <SelectItem value='inactive'>Inactive employees</SelectItem>
              <SelectItem value='all'>All employees</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger variant='secondary' className='h-7 w-[90px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='2026'>2026</SelectItem>
              <SelectItem value='2025'>2025</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={department}
            onValueChange={(v) => {
              setDepartment(v)
              setEmployeeFilter('all')
            }}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All employees</SelectItem>
              {deptEmployees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtersDirty && (
            <Button variant='outline' className='h-7' onClick={resetFilters}>
              Reset filters
            </Button>
          )}
          <Button variant='outline' className='h-7 gap-1' onClick={handleExport}>
            <DownloadSimple size={14} weight='bold' />
            Export
          </Button>
          <Button
            variant='outline'
            className='h-7'
            onClick={() =>
              toast.info(
                'Time Off Adjustments are raised from the Adjustments panel — the request routes to the configured adjustment approver'
              )
            }
          >
            Time Off Adjustment
          </Button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-[8px] border border-gray-200 bg-white p-4'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee Code</th>
              <th className='px-2 font-medium'>Employee Name</th>
              <th className='px-2 font-medium'>Department</th>
              <th className='px-2 font-medium'>Time Off Type</th>
              <th className='px-2 font-medium'>Taken</th>
              <th className='px-2 font-medium'>Scheduled</th>
              <th className='px-2 font-medium'>Balance</th>
              <th className='px-2 font-medium'>Pending Approvals</th>
              <th className='px-2 font-medium'>Pending Loss of Pay</th>
              <th className='px-2 font-medium'>Approved Loss of Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className='text-neutral-1000 py-4 text-center text-xs'>
                  No balances match the selected filters.
                </td>
              </tr>
            )}
            {rows.map(({ balance: b, employee: e, type: t }) => (
              <tr key={`${b.employeeId}-${b.typeId}`} className='border-b last:border-0'>
                <td className='py-2 pr-3'>{e!.code}</td>
                <td className='px-2 font-medium'>
                  {e!.name}
                  {!e!.active && (
                    <span className='text-neutral-1000 ml-1 text-xs'>(inactive)</span>
                  )}
                </td>
                <td className='px-2'>{e!.department}</td>
                <td className='px-2'>
                  {t?.name ?? b.typeId}{' '}
                  <span className='text-neutral-1000 text-xs'>
                    ({t?.unit ?? 'days'})
                  </span>
                </td>
                <td className='px-2'>
                  {b.taken > 0 ? (
                    <button
                      type='button'
                      className='text-blue-1400 cursor-pointer underline'
                      onClick={() => setTakenKey(`${b.employeeId}::${b.typeId}`)}
                    >
                      {b.taken}
                    </button>
                  ) : (
                    b.taken
                  )}
                </td>
                <td className='px-2'>{b.scheduled}</td>
                <td className='px-2 font-semibold'>{remaining(b)}</td>
                <td className='px-2'>{b.pendingApproval}</td>
                <td className='text-red-1400 px-2'>{b.lopPending}</td>
                <td className='text-red-1400 px-2'>{b.lopApproved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Taken drill-down (PDF screen #3) */}
      <Dialog open={takenKey !== null} onOpenChange={(o) => !o && setTakenKey(null)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              Time offs taken — {takenEmployee?.name ?? ''}
            </DialogTitle>
            <DialogDescription>
              {typeById.get(takenTypeId ?? '')?.name ?? takenTypeId} · {year}
            </DialogDescription>
          </DialogHeader>
          {takenRequests.length === 0 ? (
            <p className='text-neutral-1000 text-sm'>
              The taken figure includes entries migrated from payroll — no
              individual requests are on record for this period.
            </p>
          ) : (
            <div className='space-y-1.5'>
              {takenRequests.map((r) => (
                <div
                  key={r.id}
                  className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-xs'
                >
                  <span>
                    {fmtDate(r.from)} → {fmtDate(r.to)} · {r.amount} {r.unit} —{' '}
                    {r.reason}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
