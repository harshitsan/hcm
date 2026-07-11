import { Badge } from '@/components/ui/badge'

type BadgeVariant =
  | 'pending'
  | 'badge_active'
  | 'dropped'
  | 'badge_inactive'
  | 'open'
  | 'completed'
  | 'overdue'

const POSITIVE = [
  'Approved',
  'Settled and Closed',
  'Issued/Acknowledged',
  'Acknowledged/Issued',
  'Received',
  'Present',
  'Applied',
  'Enrolled',
]
const NEGATIVE = ['Rejected', 'Withdrawn', 'Expired', 'Absent']
const NEUTRAL_DONE = [
  'Completed',
  'Taken',
  'Returned',
  'Submitted',
  'Travel Coordinator Confirmed',
  'WFH',
]
const INACTIVE = ['Cancelled', 'Pre closed']
const WARNING = [
  'Settlement Pending from Employee',
  'Pending Return Confirmation',
  'Pending for Receipt Acknowledgement',
  'Half day',
]

function statusVariant(status: string): BadgeVariant {
  if (POSITIVE.includes(status)) return 'badge_active'
  if (NEGATIVE.includes(status)) return 'dropped'
  if (NEUTRAL_DONE.includes(status)) return 'completed'
  if (INACTIVE.includes(status)) return 'badge_inactive'
  if (WARNING.includes(status)) return 'overdue'
  if (status.toLowerCase().includes('pending')) return 'pending'
  // Initiated / Assigned / Requested / In Progress / Open …
  return 'open'
}

/** Computed lifecycle badge shared by every self-service list. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>
}
