import { makeStatusBadge } from '@/components/module-page'

/** Effective agreement lifecycle states (O10) on the canonical badge set. */
export const AgreementStatusBadge = makeStatusBadge({
  Draft: 'open',
  'Sent for acknowledgment': 'pending',
  Acknowledged: 'completed',
  Active: 'badge_active',
  'Expiring soon': 'overdue',
  Expired: 'dropped',
  Terminated: 'badge_inactive',
})
