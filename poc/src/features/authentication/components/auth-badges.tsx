import { Badge } from '@/components/ui/badge'
import {
  AUTH_EVENT_LABELS,
  type AuditOutcome,
  type AuthEventType,
} from '../data/auth-audit'
import {
  AUTH_METHOD_LABELS,
  type AuthMethod,
  type AuthUserStatus,
} from '../data/auth-users'

const statusVariant: Record<
  AuthUserStatus,
  'badge_active' | 'open' | 'badge_inactive'
> = {
  active: 'badge_active',
  invited: 'open',
  suspended: 'badge_inactive',
}

const statusLabel: Record<AuthUserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
}

export function UserStatusBadge({
  status,
  locked = false,
}: {
  status: AuthUserStatus
  /** Lockout overrides the stored status until an admin/reset clears it. */
  locked?: boolean
}) {
  if (locked) return <Badge variant='dropped'>Locked</Badge>
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
}

export function MethodBadge({ method }: { method: AuthMethod }) {
  return (
    <Badge variant={method === 'password' ? 'pending' : 'open'}>
      {AUTH_METHOD_LABELS[method]}
    </Badge>
  )
}

const outcomeVariant: Record<
  AuditOutcome,
  'completed' | 'dropped' | 'pending'
> = {
  success: 'completed',
  failure: 'dropped',
  info: 'pending',
}

export function OutcomeBadge({ outcome }: { outcome: AuditOutcome }) {
  const label =
    outcome === 'success' ? 'Success' : outcome === 'failure' ? 'Failure' : 'Info'
  return <Badge variant={outcomeVariant[outcome]}>{label}</Badge>
}

export function EventTypeBadge({ eventType }: { eventType: AuthEventType }) {
  const failure =
    eventType === 'login-failure' ||
    eventType === 'sso-rejected' ||
    eventType === 'account-locked'
  return (
    <Badge variant={failure ? 'dropped' : 'open'}>
      {AUTH_EVENT_LABELS[eventType]}
    </Badge>
  )
}

export function LinkageBadge({ linked }: { linked: boolean }) {
  return (
    <Badge variant={linked ? 'badge_active' : 'pending'}>
      {linked ? 'Employee linked' : 'No workforce record'}
    </Badge>
  )
}
