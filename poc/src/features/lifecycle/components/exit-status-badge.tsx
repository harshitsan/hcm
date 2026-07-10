import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './badges'

/** Exit-only statuses not covered by the shared lifecycle status map. */
const EXIT_ONLY: Record<string, { label: string; variant: 'open' | 'dropped' | 'pending' }> = {
  'exit-enabled': { label: 'Exit Enabled', variant: 'open' },
  disabled: { label: 'Disabled', variant: 'dropped' },
  withdrawn: { label: 'Withdrawn', variant: 'dropped' },
}

/** Status pill for exit cases — extends the shared map with exit-only states. */
export function ExitStatusBadge({ status }: { status: string }) {
  const entry = EXIT_ONLY[status]
  if (entry) return <Badge variant={entry.variant}>{entry.label}</Badge>
  return <StatusBadge status={status} />
}
