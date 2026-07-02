import { type Role } from '@/context/role-context'
import { type Announcement, type AnnouncementStatus } from '../data/announcements'
import { CURRENT_ADMIN } from '../data/org'

export const WORKFLOW_ACTIONS = [
  'submit',
  'approve',
  'reject',
  'withdraw',
  'hold',
  'resume',
  'publish',
  'unpublish',
  'cancelSchedule',
] as const

export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number]

export const ACTION_LABELS: Record<WorkflowAction, string> = {
  submit: 'Submit for approval',
  approve: 'Approve',
  reject: 'Reject',
  withdraw: 'Withdraw',
  hold: 'Place On Hold',
  resume: 'Resume',
  publish: 'Publish',
  unpublish: 'Unpublish',
  cancelSchedule: 'Cancel schedule',
}

const ADMIN_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

/**
 * Lifecycle transitions available for an announcement in its current status
 * (ANN-24..29). Approve/Reject appear only when the item is pending with the
 * signed-in approver (ANN-25) — approving someone else's queue is blocked.
 */
export function availableActions(a: Announcement, role: Role): WorkflowAction[] {
  if (!ADMIN_ROLES.includes(role)) return []
  switch (a.status) {
    case 'Draft':
      return ['submit']
    case 'Pending approval': {
      const actions: WorkflowAction[] = []
      if (a.pendingWith === CURRENT_ADMIN) actions.push('approve', 'reject')
      actions.push('withdraw', 'hold')
      return actions
    }
    case 'Approved':
      return ['publish', 'hold']
    case 'Scheduled':
      return ['cancelSchedule', 'hold']
    case 'Published':
      return ['unpublish']
    case 'Unpublished':
      return ['publish']
    case 'Rejected':
    case 'Withdrawn':
      return ['submit']
    case 'On Hold':
      return ['resume']
    default:
      return []
  }
}

/** Statuses under which an announcement is resolvable to any audience. */
export function isAudienceVisibleStatus(status: AnnouncementStatus): boolean {
  return status === 'Published'
}
