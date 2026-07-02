import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type CorrectionRequest } from '../data/requests'
import { DEPARTMENTS, EMPLOYEES, employeeById, employeeName, fmtDate } from '../data/shared'
import { type RequestsStore } from '../hooks/use-requests'
import { StatusBadge } from './badges'
import { CorrectionDialog } from './correction-dialog'

const KIND_LABEL: Record<CorrectionRequest['kind'], string> = {
  'missed-punch': 'Missed punch',
  'late-arrival': 'Late arrival',
  'early-exit': 'Early exit',
}

/**
 * Pending change-request desk + escalations queue (TNA-15/44) with the
 * original vs requested comparison, payroll-cutoff second level (TNA-43) and
 * raise-on-behalf for non-user employees (TNA-18).
 */
export function ApprovalsCorrections({
  requests,
  actor,
}: {
  requests: RequestsStore
  actor: string
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [onBehalfFor, setOnBehalfFor] = useState('')
  const [onBehalfOpen, setOnBehalfOpen] = useState(false)

  const data = useMemo(
    () =>
      requests.corrections.filter((c) => {
        const emp = employeeById(c.employeeId)
        return (
          (statusFilter === 'all' || c.status === statusFilter) &&
          (deptFilter === 'all' || emp?.department === deptFilter)
        )
      }),
    [deptFilter, requests.corrections, statusFilter]
  )

  const escalated = requests.corrections.filter((c) => c.status === 'escalated')
  const nonUsers = EMPLOYEES.filter((e) => !e.selfService)

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Pending Change Requests ({data.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            escalations queue: {escalated.length} request(s) breached the SLA
          </span>
        </h3>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='escalated'>Escalated</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
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
          <Select value={onBehalfFor} onValueChange={setOnBehalfFor}>
            <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
              <SelectValue placeholder='Raise on behalf of…' />
            </SelectTrigger>
            <SelectContent>
              {nonUsers.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} (non-user · {e.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 gap-1'
            disabled={!onBehalfFor}
            onClick={() => setOnBehalfOpen(true)}
          >
            <Plus size={12} weight='bold' />
            Raise Correction
          </Button>
        </div>
      </div>

      <div className='space-y-3'>
        {data.map((c) => (
          <div key={c.id} className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-medium'>
                  {employeeName(c.employeeId)} · {fmtDate(c.date)} —{' '}
                  {KIND_LABEL[c.kind]}
                </p>
                <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                  Requested by {c.requestedBy} on {fmtDate(c.submittedOn)} ·
                  Level {c.approvalLevel}
                  {c.escalatedTo && ` · escalated to ${c.escalatedTo}`}
                </p>
                <div className='mt-2 grid grid-cols-2 gap-4 text-sm'>
                  <div className='rounded-[6px] border border-gray-200 p-2'>
                    <p className='text-neutral-1000 text-xs'>Original record</p>
                    <p className='font-medium'>
                      {c.originalIn} → {c.originalOut ?? 'missing'}
                    </p>
                  </div>
                  <div className='rounded-[6px] border border-gray-200 p-2'>
                    <p className='text-neutral-1000 text-xs'>Requested change</p>
                    <p className='font-medium'>
                      {c.requestedIn} → {c.requestedOut}
                    </p>
                  </div>
                </div>
                <p className='text-paragraph-sm pt-2'>“{c.justification}”</p>
              </div>
              <div className='flex flex-col items-end gap-2'>
                <div className='flex items-center gap-1.5'>
                  {c.afterPayrollCutoff && (
                    <Badge variant='overdue'>Post-payroll · 2nd level</Badge>
                  )}
                  <StatusBadge status={c.status} />
                </div>
                {(c.status === 'pending' || c.status === 'escalated') && (
                  <div className='flex items-center gap-2'>
                    {c.status === 'pending' && c.slaHoursLeft <= 24 && (
                      <Button
                        variant='outline'
                        className='h-7 text-xs'
                        onClick={() => requests.escalateCorrection(c.id)}
                      >
                        Escalate (SLA {c.slaHoursLeft}h left)
                      </Button>
                    )}
                    <Button
                      variant='outline'
                      className='h-7 text-xs'
                      onClick={() => requests.decideCorrection(c.id, false, 'Insufficient evidence')}
                    >
                      Reject
                    </Button>
                    <Button
                      className='h-7 text-xs'
                      onClick={() => requests.decideCorrection(c.id, true, '')}
                    >
                      {c.afterPayrollCutoff && c.approvalLevel === 1
                        ? 'Approve L1 → L2'
                        : 'Approve & Apply'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
            No change requests match the current filters.
          </p>
        )}
      </div>

      <CorrectionDialog
        open={onBehalfOpen}
        onOpenChange={setOnBehalfOpen}
        employeeId={onBehalfFor || 'emp-09'}
        requestedBy={`${actor} (on behalf)`}
        afterPayrollCutoff={false}
        onSubmit={requests.submitCorrection}
      />
    </div>
  )
}
