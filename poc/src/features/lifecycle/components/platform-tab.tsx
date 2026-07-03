import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { fmtDate, todayISO } from '../data/shared'
import { type TransfersStore } from '../hooks/use-transfers'
import { SectionCard } from './config-widgets'

const LIFECYCLE_STATUSES = [
  'onboarding',
  'probation',
  'confirmed',
  'transferring',
  'exiting',
  'exited',
] as const

/** Valid transitions per the integrity-constraint story (ELM-20). */
const VALID_TRANSITIONS: Record<string, string[]> = {
  onboarding: ['probation'],
  probation: ['confirmed', 'exiting'],
  confirmed: ['transferring', 'exiting'],
  transferring: ['confirmed'],
  exiting: ['exited'],
  exited: [],
}

interface PlatformTabProps {
  transfers: TransfersStore
}

/**
 * Platform data-model panels: bitemporal assignment history with as-of
 * queries and correction-as-new-version, status transition constraints and
 * the append-only tenant-scoped audit store guarantees.
 */
export function PlatformTab({ transfers }: PlatformTabProps) {
  const employees = useMemo(
    () => [...new Set(transfers.assignments.map((a) => a.employeeName))],
    [transfers.assignments]
  )
  const [employee, setEmployee] = useState(employees[0] ?? '')
  const [asOf, setAsOf] = useState(todayISO())
  const [fromStatus, setFromStatus] = useState('probation')
  const [toStatus, setToStatus] = useState('confirmed')

  const history = transfers.assignments
    .filter((a) => a.employeeName === employee)
    .sort((a, b) => a.validFrom.localeCompare(b.validFrom))

  const asOfRecord = history.find(
    (a) => a.validFrom <= asOf && (a.validTo === null || a.validTo >= asOf)
  )

  const transitionValid = VALID_TRANSITIONS[fromStatus]?.includes(toStatus)

  return (
    <div className='w-full'>
      <SectionCard
        title='Assignment history (as of a date)'
        description='Every transfer appends a new assignment record with valid-from/valid-to (effective time) and recorded-at (system time); prior records are never overwritten.'
      >
        <div className='mb-3 flex flex-wrap items-end gap-2'>
          <div className='space-y-1'>
            <Label>Employee</Label>
            <Select value={employee} onValueChange={setEmployee}>
              <SelectTrigger variant='secondary' className='w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>As-of date query</Label>
            <Input
              type='date'
              className='w-[170px]'
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
          <div className='pb-1'>
            {asOfRecord ? (
              <Badge variant='completed'>
                As of {fmtDate(asOf)}: {asOfRecord.department} · {asOfRecord.location} ·{' '}
                {asOfRecord.company}
              </Badge>
            ) : (
              <Badge variant='pending'>No assignment effective on {fmtDate(asOf)}</Badge>
            )}
          </div>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              const current = history.find((h) => h.validTo === null)
              if (!current) {
                toast.error('No open assignment to correct')
                return
              }
              transfers.recordCorrection(
                employee,
                current.department,
                current.location,
                current.company
              )
            }}
          >
            Record correction (new version)
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Valid from</TableHead>
              <TableHead>Valid to</TableHead>
              <TableHead>Recorded at (system time)</TableHead>
              <TableHead>Kind</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-mono text-xs'>{a.id}</TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell>{a.location}</TableCell>
                <TableCell>{a.company}</TableCell>
                <TableCell>{fmtDate(a.validFrom)}</TableCell>
                <TableCell>{a.validTo ? fmtDate(a.validTo) : 'open'}</TableCell>
                <TableCell className='text-neutral-1000 text-xs'>
                  {a.recordedAt.slice(0, 16).replace('T', ' ')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      a.kind === 'correction'
                        ? 'overdue'
                        : a.kind === 'transfer'
                          ? 'open'
                          : 'outline'
                    }
                  >
                    {a.kind}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title='Status change rules'
        description='Exactly one active assignment and one current lifecycle status per employee at any effective time; only valid transitions are accepted.'
      >
        <div className='flex flex-wrap items-end gap-2'>
          <div className='space-y-1'>
            <Label>From status</Label>
            <Select value={fromStatus} onValueChange={setFromStatus}>
              <SelectTrigger variant='secondary' className='w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIFECYCLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>To status</Label>
            <Select value={toStatus} onValueChange={setToStatus}>
              <SelectTrigger variant='secondary' className='w-[170px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIFECYCLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size='sm'
            onClick={() =>
              transitionValid
                ? toast.success(`Transition ${fromStatus} → ${toStatus} accepted`)
                : toast.error(
                    `Transition ${fromStatus} → ${toStatus} rejected by integrity constraints`
                  )
            }
          >
            Test transition
          </Button>
          <Badge variant={transitionValid ? 'completed' : 'dropped'}>
            {transitionValid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>
        <div className='text-neutral-1000 mt-3 grid grid-cols-2 gap-1 text-xs lg:grid-cols-3'>
          {Object.entries(VALID_TRANSITIONS).map(([from, tos]) => (
            <p key={from}>
              <span className='font-medium'>{from}</span> →{' '}
              {tos.length > 0 ? tos.join(', ') : '(terminal)'}
            </p>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title='Audit log (append-only)'
        description='Append-only records with actor, timestamp, action, before/after state and outcome. Row-level security scopes every query to the requesting tenant; lifecycle reports read from this canonical trail.'
      >
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.error('UPDATE rejected — audit records are append-only')
            }
          >
            Attempt UPDATE
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.error('DELETE rejected — audit records are append-only')
            }
          >
            Attempt DELETE
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.error(
                'Cross-tenant query returned 0 rows — RLS blocks other tenants'
              )
            }
          >
            Attempt cross-tenant read
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
