import { Badge } from '@/components/ui/badge'
import {
  type GroupCategory,
  type GroupScope,
  type GroupStatus,
  type GroupType,
  type MemberKind,
  type MembershipSource,
  type RequestStatus,
} from '../data/groups'

export function ScopeBadge({ scope }: { scope: GroupScope }) {
  const map: Record<GroupScope, { label: string; variant: 'open' | 'pending' | 'completed' }> = {
    global: { label: 'Global', variant: 'open' },
    'group-company': { label: 'Group company', variant: 'pending' },
    company: { label: 'Company', variant: 'completed' },
  }
  const cfg = map[scope]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StatusBadge({ status }: { status: GroupStatus }) {
  return status === 'active' ? (
    <Badge variant='badge_active'>Active</Badge>
  ) : (
    <Badge variant='badge_inactive'>Inactive</Badge>
  )
}

export function TypeBadge({ type }: { type: GroupType }) {
  return type === 'dynamic' ? (
    <Badge variant='booked'>Dynamic (rule)</Badge>
  ) : (
    <Badge variant='pending'>Static (manual)</Badge>
  )
}

const CATEGORY_LABELS: Record<GroupCategory, string> = {
  organizational: 'Organizational',
  'benefit-cohort': 'Benefit cohort',
  'payroll-cohort': 'Payroll cohort',
  security: 'Security',
}

export function CategoryBadge({ category }: { category: GroupCategory }) {
  const variant =
    category === 'benefit-cohort'
      ? 'qualified'
      : category === 'payroll-cohort'
        ? 'overdue'
        : category === 'security'
          ? 'disqualified'
          : 'pending'
  return <Badge variant={variant}>{CATEGORY_LABELS[category]}</Badge>
}

export function SourceBadge({ source }: { source: MembershipSource }) {
  return source === 'rule' ? (
    <Badge variant='booked'>Rule-derived</Badge>
  ) : (
    <Badge variant='pending'>Manual</Badge>
  )
}

const KIND_LABELS: Record<MemberKind, string> = {
  'employee-user': 'Employee (User)',
  'employee-non-user': 'Employee (Non-User)',
  user: 'User',
}

export function KindBadge({ kind }: { kind: MemberKind }) {
  const variant =
    kind === 'employee-user' ? 'completed' : kind === 'user' ? 'open' : 'pending'
  return <Badge variant={variant}>{KIND_LABELS[kind]}</Badge>
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; variant: 'open' | 'completed' | 'dropped' }> = {
    pending: { label: 'Pending', variant: 'open' },
    approved: { label: 'Approved', variant: 'completed' },
    rejected: { label: 'Rejected', variant: 'dropped' },
  }
  const cfg = map[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
