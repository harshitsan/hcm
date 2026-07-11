import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type AuditEvent } from '../data/distributions'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Bitemporal audit trail: every acknowledgment event with actor, policy
 * version, valid time vs record time, and the 7-year retention horizon.
 */
export function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <div className='space-y-2'>
      <div className='flex items-baseline justify-between'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Audit trail ({events.length} events)
        </h3>
        <span className='text-paragraph-sm text-neutral-1000'>
          Tenant-scoped · bitemporal (valid + record time) · retained 7 years
        </span>
      </div>
      <div className='border-gray-200 max-h-[420px] overflow-y-auto rounded-[6px] border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Policy · version</TableHead>
              <TableHead>Effective (valid time)</TableHead>
              <TableHead>Recorded (txn time)</TableHead>
              <TableHead>Retained until</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {e.action}
                    </span>
                    <span className='text-paragraph-sm text-neutral-1000 max-w-[280px]'>
                      {e.detail}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-sm'>{e.actor}</TableCell>
                <TableCell className='text-sm'>{e.employeeName}</TableCell>
                <TableCell className='text-sm'>
                  {e.policyTitle}
                  {e.policyVersion ? ` · ${e.policyVersion}` : ''}
                </TableCell>
                <TableCell className='text-paragraph-sm'>
                  {dateTimeFmt.format(new Date(e.effectiveAt))}
                </TableCell>
                <TableCell className='text-paragraph-sm'>
                  {dateTimeFmt.format(new Date(e.recordedAt))}
                </TableCell>
                <TableCell className='text-paragraph-sm'>
                  {dateFmt.format(new Date(e.retainUntil))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
