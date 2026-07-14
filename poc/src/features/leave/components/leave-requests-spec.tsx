import type { TableSpec } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { fmtDate } from '../data/shared'
import { pendingStep, type LeaveRequest } from '../data/requests'
import { LopBadge, StatusBadge } from './badges'

/** Inline row decisions on the manager/admin Requests desk. */
interface LeaveRequestsSpecOpts {
  onApprove: (request: LeaveRequest) => void
  onReject: (request: LeaveRequest) => void
}

/** Manager/admin Requests desk — filtering stays external (bespoke virtual
 * statuses + class/department/date filters in requests-tab.tsx); this spec
 * only drives the grid columns, custom-columns menu and row expansion. The
 * Actions column runs the inline Approve/Reject decisions (with SLA badge). */
export function leaveRequestsSpec(
  opts: LeaveRequestsSpecOpts
): TableSpec<LeaveRequest> {
  return {
    id: 'leave-requests',
    defaultSort: { id: 'employeeName', dir: 'asc' },
    columns: [
      {
        id: 'employeeName',
        header: 'Employee',
        type: 'string',
        required: true,
        accessor: (r) => r.employeeName,
        cell: (r) => (
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1600 text-sm font-medium'>
              {r.employeeName}
            </span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {r.employeeCode} · {r.department}
            </span>
          </div>
        ),
      },
      {
        id: 'typeName',
        header: 'Leave Type',
        type: 'string',
        accessor: (r) => r.typeName,
      },
      {
        id: 'dates',
        header: 'Dates',
        type: 'date',
        accessor: (r) => r.from,
        cell: (r) => {
          const time =
            r.fromTime && r.toTime ? ` · ${r.fromTime}–${r.toTime}` : ''
          return r.from === r.to
            ? `${fmtDate(r.from)}${time}`
            : `${fmtDate(r.from)} → ${fmtDate(r.to)}`
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        type: 'number',
        accessor: (r) => r.amount,
        cell: (r) => (
          <div className='flex items-center gap-1.5 text-sm'>
            <span>
              {r.amount} {r.unit}
            </span>
            {r.lopAmount > 0 && <LopBadge amount={r.lopAmount} unit={r.unit} />}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        type: 'badge',
        accessor: (r) => r.status,
        cell: (r) => <StatusBadge status={r.status} />,
      },
      {
        id: 'pendingWith',
        header: 'Pending With',
        type: 'string',
        detail: true,
        accessor: (r) => {
          if (r.status === 'needs-clarification')
            return 'Applicant (clarification)'
          if (r.status !== 'pending') return '—'
          const step = pendingStep(r.steps)
          if (!step) return '—'
          return `${step.approver} (L${step.level})${step.escalated ? ' — escalated' : ''}`
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        type: 'string',
        accessor: () => '',
        cell: (r) => {
          if (r.status !== 'pending') {
            return <span className='text-neutral-1000 text-xs'>—</span>
          }
          const step = pendingStep(r.steps)
          return (
            <div className='flex items-center gap-1.5'>
              <Button
                variant='outline'
                className='h-6 px-2 text-xs'
                onClick={(e) => {
                  e.stopPropagation()
                  opts.onApprove(r)
                }}
              >
                Approve
              </Button>
              <Button
                variant='outline'
                className='text-red-1400 h-6 px-2 text-xs'
                onClick={(e) => {
                  e.stopPropagation()
                  opts.onReject(r)
                }}
              >
                Reject
              </Button>
              {step && (
                <span
                  className={`text-xs whitespace-nowrap ${step.escalated ? 'text-red-1400' : 'text-neutral-1000'}`}
                >
                  {step.escalated ? 'SLA breached' : `SLA ${step.slaHours}h`}
                </span>
              )}
            </div>
          )
        },
      },
    ],
  }
}
