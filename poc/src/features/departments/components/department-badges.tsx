import { Badge } from '@/components/ui/badge'
import { type DepartmentStatus } from '../data/departments'

export function DepartmentStatusBadge({ status }: { status: DepartmentStatus }) {
  return status === 'active' ? (
    <Badge variant='badge_active'>Active</Badge>
  ) : (
    <Badge variant='badge_inactive'>Inactive</Badge>
  )
}

/** Marks employees without portal access (Employee Non-User, DEPT-12). */
export function NonUserBadge() {
  return <Badge variant='pending'>Non-User</Badge>
}

export function FlaggedBadge() {
  return <Badge variant='overdue'>Flagged for review</Badge>
}

export function VersionBadge({ version }: { version: number }) {
  return <Badge variant='open'>v{version}</Badge>
}

export function DefaultShiftBadge() {
  return <Badge variant='completed'>Default</Badge>
}
