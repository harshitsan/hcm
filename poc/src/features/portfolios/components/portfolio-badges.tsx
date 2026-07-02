import { Badge } from '@/components/ui/badge'
import { type PortfolioEventType } from '../data/audit'
import { type PortfolioStatus } from '../data/portfolios'

/** Portfolio status enum badge — Active | Inactive (PORT-27). */
export function PortfolioStatusBadge({ status }: { status: PortfolioStatus }) {
  return (
    <Badge variant={status === 'Active' ? 'badge_active' : 'badge_inactive'}>
      {status}
    </Badge>
  )
}

const EVENT_LABELS: Record<PortfolioEventType, string> = {
  PORTFOLIO_CREATED: 'Portfolio created',
  PORTFOLIO_MODIFIED: 'Portfolio modified',
  CONTEXT_SWITCHED: 'Context switched',
  BULK_IMPORT: 'Bulk import',
  POLICY_DEPLOYED: 'Policy deployed',
  ANNOUNCEMENT_PUBLISHED: 'Announcement',
  REPORT_EXPORTED: 'Report exported',
  EMPLOYEE_SEARCH: 'Employee search',
}

// eslint-disable-next-line react-refresh/only-export-components
export function eventLabel(type: PortfolioEventType) {
  return EVENT_LABELS[type]
}

/** Audit event-type badge (PORT-25). */
export function EventTypeBadge({ type }: { type: PortfolioEventType }) {
  return <Badge variant='pending'>{EVENT_LABELS[type]}</Badge>
}

/** Success / failure badge for audit rows and per-company results. */
export function OutcomeBadge({ status }: { status: 'success' | 'failure' }) {
  return (
    <Badge variant={status === 'success' ? 'completed' : 'dropped'}>
      {status === 'success' ? 'Success' : 'Failure'}
    </Badge>
  )
}
