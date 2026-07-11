import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { RoleGate } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { REACK_TRIGGERS, type ReAckTrigger } from '../data/config'
import { type Assignment, type Distribution } from '../data/distributions'
import { type PolicyDistributionStore } from '../hooks/use-policy-distribution'
import { describeDueRule } from '../utils/audience'
import { ProxyAckDialog } from './proxy-ack-dialog'
import {
  AckTypeBadge,
  AssignmentStatusBadge,
  CriticalityBadge,
  DistributionStatusBadge,
} from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmt = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')

interface DistributionDetailOverlayProps {
  distribution: Distribution | null
  onOpenChange: (open: boolean) => void
  store: PolicyDistributionStore
  actorLabel: string
}

/**
 * Drill-down console for one distribution: per-recipient status grid with
 * search/filter, retry of failed recipients, scheduled-send controls and
 * the re-acknowledgment trigger.
 */
export function DistributionDetailOverlay({
  distribution,
  onOpenChange,
  store,
  actorLabel,
}: DistributionDetailOverlayProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [proxyTarget, setProxyTarget] = useState<Assignment | null>(null)
  const [reAckTrigger, setReAckTrigger] = useState<ReAckTrigger>('Content change')

  const rows = useMemo(() => {
    if (!distribution) return []
    return store.assignments
      .filter((a) => a.distributionId === distribution.id)
      .filter((a) =>
        statusFilter === 'all' ? true : a.status === statusFilter
      )
      .filter((a) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          a.employeeName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q)
        )
      })
  }, [distribution, store.assignments, search, statusFilter])

  if (!distribution) return null
  const d = distribution
  const all = store.assignments.filter((a) => a.distributionId === d.id)
  const failed = all.filter((a) => a.status === 'Failed').length
  const delivered = all.length - failed
  const unsent = d.sentAt === null && d.status !== 'Cancelled'

  /** Real CSV export of the (filtered) recipient grid. */
  const exportGrid = () => {
    const header = [
      'Employee',
      'Company',
      'Department',
      'Status',
      'Due date',
      'Acknowledged at',
      'Acknowledged by',
      'Reminders sent',
      'Escalated',
    ]
    const clean = (v: string) => v.replaceAll(',', ';')
    const lines = rows.map((a) =>
      [
        clean(a.employeeName),
        clean(a.company),
        clean(a.department),
        a.status,
        a.dueDate ?? '',
        a.acknowledgedAt ?? '',
        clean(a.acknowledgedBy ?? ''),
        String(a.remindersSent.length),
        a.escalated ? 'Yes' : 'No',
      ].join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${d.policyTitle.toLowerCase().replaceAll(/\s+/g, '-')}-${d.policyVersion}-recipients.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} recipient row(s)`)
  }

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[760px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {d.policyTitle} · {d.policyVersion}
            <CriticalityBadge level={d.criticality} />
            <DistributionStatusBadge status={d.status} />
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          {/* Distribution metadata */}
          <div className='text-paragraph-sm grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3'>
            <div>
              <p className='text-neutral-1000'>Method</p>
              <p className='text-neutral-1600 font-medium'>
                {d.method}
                {d.scheduledFor ? ` — ${fmt(d.scheduledFor)}` : ''}
                {d.eventTrigger ? ` — on ${d.eventTrigger}` : ''}
              </p>
            </div>
            <div>
              <p className='text-neutral-1000'>Acknowledgment</p>
              <AckTypeBadge type={d.ackType} />
            </div>
            <div>
              <p className='text-neutral-1000'>Due date rule</p>
              <p className='text-neutral-1600 font-medium'>
                {describeDueRule(d.dueDateRule)}
              </p>
            </div>
            <div className='col-span-2'>
              <p className='text-neutral-1000'>Audience (AND/OR scope)</p>
              <p className='text-neutral-1600 font-medium'>{d.audienceSummary}</p>
            </div>
            <div>
              <p className='text-neutral-1000'>Created by</p>
              <p className='text-neutral-1600 font-medium'>{d.createdBy}</p>
            </div>
          </div>

          {d.isBulk && d.sentAt && (
            <div className='border-gray-200 text-paragraph-sm rounded-[6px] border bg-white px-3 py-2'>
              <span className='text-neutral-1600 font-medium'>
                Bulk run summary:
              </span>{' '}
              <span className='text-green-1300'>{delivered} delivered</span>
              {' · '}
              <span className={failed > 0 ? 'text-red-1400' : 'text-neutral-1000'}>
                {failed} failed
              </span>
              {failed > 0 && ' — retry re-sends only the failed recipients.'}
            </div>
          )}

          {/* Admin actions */}
          <RoleGate
            roles={[
              'Company Admin',
              'Group Company Admin',
              'Portfolio Admin',
              'Platform Admin',
            ]}
          >
            <div className='flex flex-wrap items-center gap-2'>
              {d.status === 'Scheduled' && (
                <Button size='sm' onClick={() => store.sendScheduledNow(d.id)}>
                  Send now
                </Button>
              )}
              {unsent && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    store.cancelDistribution(d.id)
                    toast.success('Distribution cancelled before send')
                    onOpenChange(false)
                  }}
                >
                  Cancel distribution
                </Button>
              )}
              {failed > 0 && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => store.retryFailed(d.id)}
                >
                  Retry {failed} failed
                </Button>
              )}
              <Button size='sm' variant='outline' onClick={exportGrid}>
                Export grid (CSV)
              </Button>
              {d.sentAt && d.ackType !== 'Read-Only' && (
                <div className='ml-auto flex items-center gap-2'>
                  <Select
                    value={reAckTrigger}
                    onValueChange={(v) => setReAckTrigger(v as ReAckTrigger)}
                  >
                    <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REACK_TRIGGERS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      store.triggerReAck(d.policyId, reAckTrigger, actorLabel)
                    }
                  >
                    Trigger re-acknowledgment
                  </Button>
                </div>
              )}
            </div>
          </RoleGate>

          {/* Per-recipient status grid */}
          <div className='flex items-center gap-2'>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search employee, department or company'
              className='h-8 max-w-[300px]'
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger variant='secondary' className='h-8 w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='Pending'>Pending</SelectItem>
                <SelectItem value='Acknowledged'>Acknowledged</SelectItem>
                <SelectItem value='Overdue'>Overdue</SelectItem>
                <SelectItem value='Delivered'>Delivered</SelectItem>
                <SelectItem value='Failed'>Failed</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
              {rows.length} of {all.length} recipients
            </span>
          </div>

          <div className='border-gray-200 rounded-[6px] border bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Company / Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Acknowledged</TableHead>
                  <TableHead className='text-right'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='text-neutral-1000 text-center'>
                      {unsent
                        ? 'No assignments yet — recipients are created when the distribution is sent.'
                        : 'No recipients match the current filters.'}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-neutral-1600 font-medium'>
                          {a.employeeName}
                        </span>
                        <span className='flex gap-1'>
                          {a.isNonUser && (
                            <Badge variant='overdue'>Non-user</Badge>
                          )}
                          {a.escalated && (
                            <Badge variant='overlay_overdue'>Escalated</Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-paragraph-sm'>
                      {a.company}
                      <br />
                      <span className='text-neutral-1000'>{a.department}</span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <AssignmentStatusBadge
                          status={a.status}
                          superseded={a.superseded}
                        />
                        {a.remindersSent.length > 0 && (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            Reminders: {a.remindersSent.join('%, ')}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-paragraph-sm'>
                      {fmt(a.dueDate)}
                    </TableCell>
                    <TableCell className='text-paragraph-sm'>
                      {a.acknowledgedAt ? (
                        <>
                          {fmt(a.acknowledgedAt)}
                          <br />
                          <span className='text-neutral-1000'>
                            {a.acknowledgedBy}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      {a.isNonUser &&
                        (a.status === 'Pending' || a.status === 'Overdue') && (
                          <RoleGate roles={['Company Admin']}>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => setProxyTarget(a)}
                            >
                              Proxy ack
                            </Button>
                          </RoleGate>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <ProxyAckDialog
          assignment={proxyTarget}
          onOpenChange={(open) => {
            if (!open) setProxyTarget(null)
          }}
          onConfirm={(id, evidence) =>
            store.recordProxyAck(id, actorLabel, evidence)
          }
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
