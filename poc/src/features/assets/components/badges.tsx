import { Badge } from '@/components/ui/badge'
import { type AssetState, type AssignmentOrigin } from '../data/assets'
import { type MovementStatus } from '../data/movements'
import { type RequisitionStatus } from '../data/requisitions'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'overdue'
  | 'pending'
  | 'completed'
  | 'dropped'
  | 'live'

const STATE_VARIANTS: Record<AssetState, BadgeVariant> = {
  Available: 'badge_active',
  Allocated: 'open',
  Issued: 'live',
  Loan: 'overdue',
  'In Repair': 'pending',
  Returned: 'open',
  Lost: 'dropped',
  Retired: 'badge_inactive',
  Disposed: 'dropped',
}

export function AssetStateBadge({ state }: { state: AssetState }) {
  return <Badge variant={STATE_VARIANTS[state]}>{state}</Badge>
}

const REQ_VARIANTS: Record<RequisitionStatus, BadgeVariant> = {
  'Pending Approval': 'pending',
  'Pending for Issuance': 'open',
  'Pending for Partial Issuance': 'overdue',
  'Issued/Acknowledged': 'completed',
  Rejected: 'dropped',
  Withdrawn: 'badge_inactive',
  Returned: 'open',
}

export function RequisitionStatusBadge({ status }: { status: RequisitionStatus }) {
  return <Badge variant={REQ_VARIANTS[status]}>{status}</Badge>
}

const MOVEMENT_VARIANTS: Record<MovementStatus, BadgeVariant> = {
  'Pending Approval': 'pending',
  Approved: 'completed',
  Rejected: 'dropped',
}

export function MovementStatusBadge({ status }: { status: MovementStatus }) {
  return <Badge variant={MOVEMENT_VARIANTS[status]}>{status}</Badge>
}

export function AckStatusBadge({ status }: { status: 'Pending' | 'Completed' }) {
  return (
    <Badge variant={status === 'Pending' ? 'pending' : 'completed'}>{status}</Badge>
  )
}

/** Workflow-origin tag shown on movements and asset records (W2/W5/W8). */
export function OriginBadge({ origin }: { origin?: AssignmentOrigin | null }) {
  if (!origin) return null
  return <Badge variant='live'>{origin}</Badge>
}

export function OverdueBadge({ daysOverdue }: { daysOverdue: number }) {
  if (daysOverdue <= 0) return null
  return <Badge variant='dropped'>Overdue {daysOverdue}d</Badge>
}
