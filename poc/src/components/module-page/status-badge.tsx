import { Badge } from '@/components/ui/badge'

/**
 * The fixed status-badge vocabulary (scaffold kit §3). Every module status
 * maps onto one of these design-system variants — no semantic reuse of
 * variants outside this list.
 */
export type CanonicalBadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'dropped'
  | 'live'

/**
 * Factory for a module StatusBadge constrained to the canonical vocabulary.
 * Usage: `const StatusBadge = makeStatusBadge({ Active: 'badge_active', … })`
 */
export function makeStatusBadge(
  map: Record<string, CanonicalBadgeVariant>,
  fallback: CanonicalBadgeVariant = 'pending'
) {
  return function StatusBadge({ status }: { status: string }) {
    return <Badge variant={map[status] ?? fallback}>{status}</Badge>
  }
}
