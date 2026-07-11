/**
 * record-links.ts — maps the human-readable linked record on a notification
 * or system task ("Leave request LR-2214", "Timesheet TS-4471", …) to the
 * module route + tab that shows it, so the inbox "Open item" and the task
 * "Initiate" actions perform real navigation instead of a toast stub.
 *
 * Destination tabs are role-gated, so the tab is chosen per role and left
 * null when the role's default (task-first) tab is already the right landing
 * spot — navigating to the route alone is then enough. Callers pass the tab
 * to requestModuleTab (workflows/data/module-nav) before router navigation.
 */
import type { Role } from '@/context/role-context'

export interface RecordLink {
  route: string
  /** Tab to request via requestModuleTab; null = the page's role default. */
  tab: string | null
}

const isEmployee = (role: Role) => role === 'Employee (User)'
const isCompanyAdmin = (role: Role) => role === 'Company Admin'

/**
 * Resolve a linked record label to its module route + tab for the given
 * role. Returns null when the record has no dedicated screen (e.g. digests,
 * which are summaries of the inbox itself).
 */
export function resolveRecordLink(item: string, role: Role): RecordLink | null {
  const s = item.toLowerCase()

  if (s.startsWith('leave request'))
    return {
      route: '/leave',
      tab: isEmployee(role)
        ? 'my-leave'
        : isCompanyAdmin(role)
          ? 'requests'
          : null,
    }
  if (s.startsWith('timesheet'))
    return {
      route: '/attendance',
      tab: isEmployee(role)
        ? 'my-timesheet'
        : isCompanyAdmin(role)
          ? 'team'
          : null,
    }
  if (s.startsWith('attendance'))
    return {
      route: '/attendance',
      tab: isEmployee(role)
        ? // Change requests live under My Requests; day records under My Attendance.
          s.includes('cr-')
          ? 'my-requests'
          : 'my'
        : isCompanyAdmin(role)
          ? 'team'
          : null,
    }
  if (s.startsWith('onboarding'))
    return {
      route: '/lifecycle',
      tab: isEmployee(role)
        ? 'my'
        : isCompanyAdmin(role)
          ? 'onboarding'
          : null,
    }
  // Travel and expense claims are generic self-service requests in this POC.
  if (s.startsWith('travel request') || s.startsWith('expense claim'))
    return { route: '/self-service', tab: 'overview' }
  if (s.startsWith('grievance')) return { route: '/feedback', tab: 'my' }
  if (s.startsWith('employee record'))
    return { route: '/employees', tab: 'profile' }
  if (s.startsWith('announcement'))
    return { route: '/announcements', tab: 'feed' }
  if (
    s.startsWith('job vacancy') ||
    s.startsWith('job posting') ||
    s.startsWith('offer')
  )
    return { route: '/recruitment', tab: 'openings' }
  // Task alerts point back at this page's own Tasks tab.
  if (s.startsWith('task ')) return { route: '/notifications', tab: 'tasks' }
  return null
}
