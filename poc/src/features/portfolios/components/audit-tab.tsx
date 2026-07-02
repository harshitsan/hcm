import { useState } from 'react'
import { RoleGate } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PORTFOLIO_EVENT_TYPES, type PortfolioEventType } from '../data/audit'
import { type PortfolioAuditStore } from '../hooks/use-portfolio-audit'
import { EventTypeBadge, OutcomeBadge, eventLabel } from './portfolio-badges'

interface AuditTabProps {
  audit: PortfolioAuditStore
}

/**
 * Portfolio audit trail (PORT-25/26): every portfolio-level operation with
 * actor, companies affected, action parameters, timestamp and
 * success/failure — including denied AUTH_002 context switches. Retained 7
 * years (§8.2).
 */
export function AuditTab({ audit }: AuditTabProps) {
  const [eventType, setEventType] = useState<'all' | PortfolioEventType>('all')
  const [outcome, setOutcome] = useState<'all' | 'success' | 'failure'>('all')

  const entries = audit.entries.filter(
    (e) =>
      (eventType === 'all' || e.eventType === eventType) &&
      (outcome === 'all' || e.status === outcome)
  )

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-paragraph-sm text-neutral-1000'>Event type</span>
        <Select
          value={eventType}
          onValueChange={(v) => setEventType(v as 'all' | PortfolioEventType)}
        >
          <SelectTrigger variant='secondary' className='h-8 w-52'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All events</SelectItem>
            {PORTFOLIO_EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {eventLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-paragraph-sm text-neutral-1000'>Outcome</span>
        <Select
          value={outcome}
          onValueChange={(v) => setOutcome(v as 'all' | 'success' | 'failure')}
        >
          <SelectTrigger variant='secondary' className='h-8 w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All outcomes</SelectItem>
            <SelectItem value='success'>Success</SelectItem>
            <SelectItem value='failure'>Failure</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant='open'>
          {entries.length} of {audit.entries.length} entries
        </Badge>
        <Badge variant='pending'>Retention: 7 years (§8.2)</Badge>
      </div>

      <RoleGate roles={['Platform Admin']}>
        <Card className='gap-2 border-gray-200 py-3'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
              Compliance coverage (PORT-25/26)
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            <p className='text-paragraph-sm text-neutral-1000'>
              PORTFOLIO_CREATED captures the portfolio configuration and
              companies; PORTFOLIO_MODIFIED captures the changes and user;
              CONTEXT_SWITCHED captures from-company and to-company. Failed
              switch attempts (AUTH_002) are also logged — all cross-company
              access attempts are audited whether successful or failed (§7.2).
            </p>
          </CardContent>
        </Card>
      </RoleGate>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Companies affected</TableHead>
            <TableHead>Action parameters</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className='text-sm whitespace-nowrap'>
                {e.timestamp}
              </TableCell>
              <TableCell>
                <div className='flex flex-col'>
                  <span className='text-sm'>{e.actor}</span>
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {e.actorRole}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <EventTypeBadge type={e.eventType} />
              </TableCell>
              <TableCell className='max-w-[220px] text-sm'>
                {e.companiesAffected.join(', ') || '—'}
              </TableCell>
              <TableCell className='text-paragraph-sm text-neutral-1000 max-w-md'>
                {e.parameters}
              </TableCell>
              <TableCell>
                <OutcomeBadge status={e.status} />
              </TableCell>
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className='text-neutral-1000 text-center'>
                No audit entries match the selected filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
