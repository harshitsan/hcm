import { Badge } from '@/components/ui/badge'
import {
  slaState,
  type SlaState,
  type TaskStatus,
  type InstanceStatus,
  type StageStatus,
} from '../data/instances'
import type { DefinitionStatus } from '../data/definitions'
import { PATTERN_LABELS, type ApprovalPattern } from '../data/shared'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'dropped'
  | 'live'

/** SLA health pill (WFE-11): on-track / reminded / at-risk / breached. */
export function SlaBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <Badge variant='badge_inactive'>—</Badge>
  const state = slaState(percent)
  const map: Record<SlaState, { label: string; variant: BadgeVariant }> = {
    'on-track': { label: `On track · ${percent}%`, variant: 'badge_active' },
    reminded: { label: `Reminded · ${percent}%`, variant: 'open' },
    'at-risk': { label: `At risk · ${percent}%`, variant: 'overdue' },
    breached: { label: `Breached · ${percent}%`, variant: 'dropped' },
  }
  return <Badge variant={map[state].variant}>{map[state].label}</Badge>
}

const INSTANCE_MAP: Record<InstanceStatus, { label: string; variant: BadgeVariant }> = {
  'in-progress': { label: 'In Progress', variant: 'open' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
}

export function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  const e = INSTANCE_MAP[status]
  return <Badge variant={e.variant}>{e.label}</Badge>
}

const TASK_MAP: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'pending' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  closed: { label: 'Closed', variant: 'badge_inactive' },
  escalated: { label: 'Escalated', variant: 'overdue' },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const e = TASK_MAP[status]
  return <Badge variant={e.variant}>{e.label}</Badge>
}

const STAGE_MAP: Record<StageStatus, { label: string; variant: BadgeVariant }> = {
  waiting: { label: 'Waiting', variant: 'badge_inactive' },
  'in-progress': { label: 'In Progress', variant: 'open' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  skipped: { label: 'Skipped', variant: 'badge_inactive' },
}

export function StageStatusBadge({ status }: { status: StageStatus }) {
  const e = STAGE_MAP[status]
  return <Badge variant={e.variant}>{e.label}</Badge>
}

const DEFINITION_MAP: Record<DefinitionStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'pending' },
  active: { label: 'Active', variant: 'badge_active' },
  scheduled: { label: 'Scheduled', variant: 'open' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
}

export function DefinitionStatusBadge({ status }: { status: DefinitionStatus }) {
  const e = DEFINITION_MAP[status]
  return <Badge variant={e.variant}>{e.label}</Badge>
}

export function PatternBadge({ pattern }: { pattern: ApprovalPattern }) {
  const variant: BadgeVariant = pattern === 'sequential' ? 'open' : 'completed'
  return <Badge variant={variant}>{PATTERN_LABELS[pattern]}</Badge>
}
