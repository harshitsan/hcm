import { Badge } from '@/components/ui/badge'
import { type AckType, type Criticality } from '../data/policies'
import {
  type AssignmentStatus,
  type AssignmentTrigger,
  type DistributionStatus,
} from '../data/distributions'

type BadgeVariant = React.ComponentProps<typeof Badge>['variant']

const ackTypeVariant: Record<AckType, BadgeVariant> = {
  Required: 'dropped',
  Optional: 'open',
  'Read-Only': 'pending',
}

export function AckTypeBadge({ type }: { type: AckType }) {
  return <Badge variant={ackTypeVariant[type]}>{type}</Badge>
}

const criticalityVariant: Record<Criticality, BadgeVariant> = {
  Critical: 'overlay_overdue',
  High: 'overdue',
  Standard: 'pending',
}

export function CriticalityBadge({ level }: { level: Criticality }) {
  return <Badge variant={criticalityVariant[level]}>{level}</Badge>
}

const distStatusVariant: Record<DistributionStatus, BadgeVariant> = {
  Sent: 'completed',
  Scheduled: 'open',
  Armed: 'open',
  Cancelled: 'badge_inactive',
}

export function DistributionStatusBadge({
  status,
}: {
  status: DistributionStatus
}) {
  return (
    <Badge variant={distStatusVariant[status]}>
      {status === 'Armed' ? 'Event-armed' : status}
    </Badge>
  )
}

const triggerVariant: Record<AssignmentTrigger, BadgeVariant> = {
  Initial: 'pending',
  'Content change': 'open',
  'Periodic renewal': 'open',
  Transfer: 'open',
  'Role change': 'open',
  'Regulatory update': 'overdue',
}

/** Why the ask went out; regulatory updates carry a priority chip. */
export function TriggerBadge({
  trigger,
  priority,
}: {
  trigger: AssignmentTrigger
  priority?: boolean
}) {
  return (
    <span className='inline-flex items-center gap-1'>
      <Badge variant={triggerVariant[trigger]}>{trigger}</Badge>
      {priority && <Badge variant='overlay_overdue'>Priority</Badge>}
    </span>
  )
}

const assignmentVariant: Record<AssignmentStatus, BadgeVariant> = {
  Acknowledged: 'completed',
  Pending: 'open',
  Overdue: 'overlay_overdue',
  Delivered: 'pending',
  Failed: 'dropped',
}

export function AssignmentStatusBadge({
  status,
  superseded,
}: {
  status: AssignmentStatus
  superseded?: boolean
}) {
  return (
    <span className='inline-flex items-center gap-1'>
      <Badge variant={assignmentVariant[status]}>{status}</Badge>
      {superseded && <Badge variant='badge_inactive'>Superseded</Badge>}
    </span>
  )
}
