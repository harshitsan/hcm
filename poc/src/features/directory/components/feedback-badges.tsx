import { Badge } from '@/components/ui/badge'
import {
  type WorklistCategory,
  type WorklistStatus,
} from '../data/feedback-worklist'

const categoryVariant: Record<
  WorklistCategory,
  'dropped' | 'open' | 'secondary'
> = {
  Grievance: 'dropped',
  Feedback: 'open',
  Suggestion: 'secondary',
}

const statusVariant: Record<
  WorklistStatus,
  'pending' | 'overdue' | 'badge_active' | 'badge_inactive'
> = {
  Submitted: 'pending',
  'Under Review': 'overdue',
  Resolved: 'badge_active',
  Closed: 'badge_inactive',
}

/** Category pill shared by the admin worklist and My Feedback list. */
export function WorklistCategoryBadge({
  category,
}: {
  category: WorklistCategory
}) {
  return <Badge variant={categoryVariant[category]}>{category}</Badge>
}

/** Triage-status pill shared by the admin worklist and My Feedback list. */
export function WorklistStatusBadge({ status }: { status: WorklistStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>
}

/** Marks entries whose submitter identity is withheld from reviewers. */
export function AnonymousBadge() {
  return <Badge variant='pending'>Anonymous</Badge>
}
