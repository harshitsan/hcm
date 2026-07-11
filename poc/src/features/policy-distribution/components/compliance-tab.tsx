import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type PolicyDistributionStore } from '../hooks/use-policy-distribution'
import { AuditTrail } from './audit-trail'
import { ComplianceRollups } from './compliance-rollups'
import { AssignmentStatusBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

type ReportFilter = 'all' | 'pending' | 'overdue'

/**
 * Compliance dashboard: overall acknowledgment posture, per-policy status
 * report, dedicated pending/overdue reports per employee, tenant rollups
 * and the 7-year bitemporal audit trail.
 */
export function ComplianceTab({ store }: { store: PolicyDistributionStore }) {
  const [filter, setFilter] = useState<ReportFilter>('all')

  const active = useMemo(
    () =>
      store.assignments.filter((a) => !a.superseded && a.ackType !== 'Read-Only'),
    [store.assignments]
  )

  const totals = useMemo(() => {
    const acknowledged = active.filter((a) => a.status === 'Acknowledged').length
    const pending = active.filter((a) => a.status === 'Pending').length
    const overdue = active.filter((a) => a.status === 'Overdue').length
    const tracked = acknowledged + pending + overdue
    return {
      acknowledged,
      pending,
      overdue,
      compliance: tracked === 0 ? 100 : Math.round((acknowledged / tracked) * 100),
    }
  }, [active])

  const perPolicy = useMemo(() => {
    const byPolicy = new Map<string, typeof active>()
    for (const a of active) {
      const key = `${a.policyTitle} · ${a.policyVersion}`
      byPolicy.set(key, [...(byPolicy.get(key) ?? []), a])
    }
    return [...byPolicy.entries()].map(([policy, list]) => ({
      policy,
      acknowledged: list.filter((a) => a.status === 'Acknowledged').length,
      pending: list.filter((a) => a.status === 'Pending').length,
      overdue: list.filter((a) => a.status === 'Overdue').length,
    }))
  }, [active])

  const reportRows = useMemo(
    () =>
      active.filter((a) =>
        filter === 'all'
          ? true
          : filter === 'pending'
            ? a.status === 'Pending'
            : a.status === 'Overdue'
      ),
    [active, filter]
  )

  /** Real CSV export of the per-employee report (Blob download pattern). */
  const handleExport = () => {
    const header = [
      'Employee',
      'Company',
      'Department',
      'Policy',
      'Version',
      'Status',
      'Due date',
      'Acknowledged at',
      'Acknowledged by',
      'Reminders sent',
    ]
    const clean = (v: string) => v.replaceAll(',', ';')
    const lines = reportRows.map((a) =>
      [
        clean(a.employeeName),
        clean(a.company),
        clean(a.department),
        clean(a.policyTitle),
        a.policyVersion,
        a.status,
        a.dueDate ?? '',
        a.acknowledgedAt ?? '',
        clean(a.acknowledgedBy ?? ''),
        String(a.remindersSent.length),
      ].join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `policy-compliance-${filter}-report.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(
      `Exported ${reportRows.length} row(s) — ${filter === 'all' ? 'all statuses' : `${filter} report`}`
    )
  }

  const cards = [
    { label: 'Overall compliance', value: `${totals.compliance}%` },
    { label: 'Acknowledged', value: String(totals.acknowledged) },
    { label: 'Pending', value: String(totals.pending) },
    { label: 'Overdue', value: String(totals.overdue) },
  ]

  return (
    <div className='space-y-5'>
      <Card className='bg-blue-150 w-full gap-2 border-none py-2'>
        <CardContent className='p-0'>
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {cards.map((c) => (
              <div
                key={c.label}
                className='flex flex-col gap-4 rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
              >
                <span className='text-paragraph-sm font-medium text-black'>
                  {c.label}
                </span>
                <span className='text-3xl font-medium text-black'>{c.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-policy status report */}
      <div className='space-y-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Acknowledgment status per policy
        </h3>
        <div className='border-gray-200 rounded-[6px] border bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy · version</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perPolicy.map((p) => {
                const total = p.acknowledged + p.pending + p.overdue
                return (
                  <TableRow key={p.policy}>
                    <TableCell className='text-sm font-medium'>
                      {p.policy}
                    </TableCell>
                    <TableCell className='text-green-1300 text-sm'>
                      {p.acknowledged}
                    </TableCell>
                    <TableCell className='text-sm'>{p.pending}</TableCell>
                    <TableCell
                      className={`text-sm ${p.overdue > 0 ? 'text-red-1400' : ''}`}
                    >
                      {p.overdue}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {total === 0 ? 100 : Math.round((p.acknowledged / total) * 100)}
                      %
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ComplianceRollups assignments={store.assignments} />

      {/* Per-employee pending/overdue report */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Per-employee report
          </h3>
          <div className='flex items-center gap-2'>
            <Select value={filter} onValueChange={(v) => setFilter(v as ReportFilter)}>
              <SelectTrigger variant='secondary' className='h-8 w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='pending'>Pending report</SelectItem>
                <SelectItem value='overdue'>Overdue report</SelectItem>
              </SelectContent>
            </Select>
            <Button size='sm' variant='outline' onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>
        <div className='border-gray-200 max-h-[360px] overflow-y-auto rounded-[6px] border bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Policy · version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due / acknowledged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className='text-neutral-1000 text-center'>
                    No records for this report.
                  </TableCell>
                </TableRow>
              )}
              {reportRows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className='text-sm font-medium'>
                    {a.employeeName}
                    {a.isNonUser && (
                      <span className='text-paragraph-sm text-neutral-1000'>
                        {' '}
                        (non-user)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>{a.company}</TableCell>
                  <TableCell className='text-sm'>
                    {a.policyTitle} · {a.policyVersion}
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className='text-paragraph-sm'>
                    {a.acknowledgedAt
                      ? `Ack ${dateFmt.format(new Date(a.acknowledgedAt))} by ${a.acknowledgedBy}`
                      : a.dueDate
                        ? `Due ${dateFmt.format(new Date(a.dueDate))}`
                        : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AuditTrail events={store.auditEvents} />
    </div>
  )
}
