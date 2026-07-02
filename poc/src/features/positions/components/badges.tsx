import { Badge } from '@/components/ui/badge'
import type { WageType } from '../data/org-config'
import type { EmployeeType } from '../data/employees'
import type { PositionStatus } from '../data/positions'
import type { RequisitionStatus } from '../data/recruitment'

/** Active/Inactive badge shared by positions and classifications (POS-21/30). */
export function StatusBadge({ status }: { status: PositionStatus }) {
  return status === 'active' ? (
    <Badge variant='badge_active'>Active</Badge>
  ) : (
    <Badge variant='badge_inactive'>Inactive</Badge>
  )
}

/** Hourly ⇒ overtime-eligible, Salaried ⇒ exempt (POS-38). */
export function WageTypeBadge({ wageType }: { wageType: WageType }) {
  return wageType === 'Hourly' ? (
    <Badge variant='open'>Hourly · OT eligible</Badge>
  ) : (
    <Badge variant='pending'>Salaried · Exempt</Badge>
  )
}

/** Portal user vs non-user employee marker (POS-11/17). */
export function EmployeeTypeBadge({ type }: { type: EmployeeType }) {
  return type === 'user' ? (
    <Badge variant='booked'>User</Badge>
  ) : (
    <Badge variant='overdue'>Non-User</Badge>
  )
}

const requisitionBadge: Record<
  RequisitionStatus,
  { label: string; variant: 'open' | 'overdue' | 'pending' | 'completed' }
> = {
  open: { label: 'Open', variant: 'open' },
  'offer-extended': { label: 'Offer Extended', variant: 'overdue' },
  onboarding: { label: 'Onboarding', variant: 'pending' },
  hired: { label: 'Hired', variant: 'completed' },
}

export function RequisitionBadge({ status }: { status: RequisitionStatus }) {
  const badge = requisitionBadge[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

/** Compact level chip; blank levels are allowed (POS-19). */
export function LevelBadge({ level }: { level: number | null }) {
  if (level == null) {
    return <span className='text-neutral-1000 text-sm'>—</span>
  }
  return <Badge variant='pending'>L{level}</Badge>
}
