import { Link } from '@tanstack/react-router'
import { ArrowRight, BellRing, CheckCircle2 } from 'lucide-react'
import { canAccess } from '@/config/module-access'
import { useRole, type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
// Read-only imports of other modules' seed data — the counts below reflect
// the same records those modules render.
import { seedRequests } from '@/features/leave/data/requests'
import { CURRENT_EMPLOYEE_ID as LEAVE_SELF_ID } from '@/features/leave/data/shared'
import { seedAssignments } from '@/features/policy-distribution/data/distributions'
import { CURRENT_EMPLOYEE_ID as POLICY_SELF_ID } from '@/features/policy-distribution/data/employees'
import { seedVacancies } from '@/features/recruitment/data/vacancies'
import { seedTasks } from '@/features/workflows/data/instances'
import {
  companiesInScope,
  EXPIRING_DOCUMENTS,
  MY_OPEN_SURVEYS,
  MY_OPEN_TASKS,
  OVERSIGHT_COMPANY_SEEDS,
  PLATFORM_HEALTH,
} from '../data/role-dashboards'

export interface PendingAction {
  id: string
  title: string
  description: string
  count: number
  /** Module route the row links into. */
  to: string
  tone: 'urgent' | 'due' | 'info'
}

/** Role-appropriate pending items (approvals, acknowledgments, tasks). */
export function buildPendingActions(role: Role): PendingAction[] {
  const items: PendingAction[] = []

  if (role === 'Platform Admin') {
    items.push(
      {
        id: 'pa-imports',
        title: 'Data imports need a re-run',
        description: 'Import jobs that failed in the last 7 days',
        count: PLATFORM_HEALTH.importJobs.failed,
        to: '/data-management',
        tone: 'urgent',
      },
      {
        id: 'pa-tenants',
        title: 'Companies awaiting activation',
        description: 'New tenant requests waiting on the platform owner',
        count: PLATFORM_HEALTH.tenantsAwaitingActivation,
        to: '/companies',
        tone: 'due',
      },
      {
        id: 'pa-invoices',
        title: 'Open invoices to follow up',
        description: 'Tenant invoices not yet paid',
        count: 4,
        to: '/platform-admin',
        tone: 'info',
      }
    )
  }

  if (role === 'Portfolio Admin' || role === 'Group Company Admin') {
    const scope = companiesInScope(role)
    const approvals = scope.reduce(
      (n, c) => n + (OVERSIGHT_COMPANY_SEEDS[c.id]?.pendingApprovals ?? 0),
      0
    )
    items.push(
      {
        id: 'ov-approvals',
        title: 'Approvals open across your companies',
        description: 'Waiting on company admins in your scope',
        count: approvals,
        to: '/companies',
        tone: 'due',
      },
      {
        id: 'ov-leave',
        title: 'Leave approvals escalated to you',
        description: 'Requests past their first-approver window',
        count: 3,
        to: '/leave',
        tone: 'urgent',
      },
      {
        id: 'ov-reports',
        title: 'Compliance summaries to review',
        description: 'e.g. quarterly attrition and policy coverage',
        count: 2,
        to: '/reports',
        tone: 'info',
      }
    )
  }

  if (role === 'Company Admin') {
    const leavePending = seedRequests.filter(
      (r) => r.status === 'pending' || r.status === 'needs-clarification'
    ).length
    const workflowPending = seedTasks.filter(
      (t) => t.status === 'pending'
    ).length
    const acksOverdue = seedAssignments.filter(
      (a) => a.status === 'Overdue'
    ).length
    const newVacancies = seedVacancies.filter(
      (v) => v.status === 'new'
    ).length
    items.push(
      {
        id: 'ca-leave',
        title: 'Leave requests awaiting a decision',
        description: 'Pending approvals and open clarifications',
        count: leavePending,
        to: '/leave',
        tone: 'urgent',
      },
      {
        id: 'ca-workflows',
        title: 'Approvals in your inbox',
        description: 'Requests routed to you across all workflows',
        count: workflowPending,
        to: '/workflows',
        tone: 'urgent',
      },
      {
        id: 'ca-acks',
        title: 'Policy acknowledgments overdue',
        description: 'Employees past their acknowledgment due date',
        count: acksOverdue,
        to: '/policy-distribution',
        tone: 'due',
      },
      {
        id: 'ca-docs',
        title: 'Agreements & documents expiring',
        description: 'Lapsing within the next 30 days',
        count: EXPIRING_DOCUMENTS.length,
        to: '/hr-letters',
        tone: 'due',
      },
      {
        id: 'ca-vacancies',
        title: 'Vacancies awaiting a recruiter',
        description: 'New requisitions not yet assigned',
        count: newVacancies,
        to: '/recruitment',
        tone: 'info',
      }
    )
  }

  if (role === 'Employee (User)') {
    const myAcks = seedAssignments.filter(
      (a) =>
        a.employeeId === POLICY_SELF_ID &&
        (a.status === 'Pending' || a.status === 'Overdue')
    ).length
    const myLeave = seedRequests.filter(
      (r) =>
        r.employeeId === LEAVE_SELF_ID &&
        (r.status === 'pending' || r.status === 'needs-clarification')
    ).length
    items.push(
      {
        id: 'me-acks',
        title: 'Policies waiting for your acknowledgment',
        description: 'Read and confirm before the due date',
        count: myAcks,
        to: '/policy-distribution',
        tone: 'urgent',
      },
      {
        id: 'me-leave',
        title: 'Your leave requests in approval',
        description: 'Submitted and waiting on your approvers',
        count: myLeave,
        to: '/leave',
        tone: 'info',
      },
      {
        id: 'me-surveys',
        title: 'Surveys waiting for your response',
        description: 'e.g. quarterly engagement pulse',
        count: MY_OPEN_SURVEYS.length,
        to: '/feedback',
        tone: 'due',
      },
      {
        id: 'me-tasks',
        title: 'Personal to-dos from HR',
        description: 'Documents to upload and checklist items',
        count: MY_OPEN_TASKS.length,
        to: '/documents',
        tone: 'due',
      }
    )
  }

  // A row only appears when the role can actually open the module it links
  // to, and only while there is something to act on.
  return items.filter((i) => i.count > 0 && canAccess(role, i.to))
}

const TONE_BADGE: Record<PendingAction['tone'], string> = {
  urgent: 'bg-red-1300 text-red-1400',
  due: 'bg-vanilla-400 text-vanilla-500',
  info: 'bg-blue-150 text-blue-1400',
}

/**
 * "Needs your attention" — the pending-actions surface (R2): approvals,
 * acknowledgments and tasks appropriate to the active role, each row linking
 * into the module that owns the work.
 */
export function PendingActionsPanel({ className }: { className?: string }) {
  const { role } = useRole()
  const items = buildPendingActions(role)
  const total = items.reduce((n, i) => n + i.count, 0)

  return (
    <Card className={`gap-0 overflow-hidden py-0 ${className ?? ''}`}>
      <div className='border-gray-200 flex items-center justify-between gap-2 border-b px-5 py-4'>
        <div className='flex items-center gap-2'>
          <BellRing className='text-orange-1200 size-4 shrink-0' />
          <h3 className='text-paragraph-md text-neutral-1600 font-semibold'>
            Needs your attention
          </h3>
        </div>
        {total > 0 && <Badge variant='open'>{total} pending</Badge>}
      </div>
      {items.length === 0 ? (
        <div className='flex items-center gap-3 px-5 py-6'>
          <CheckCircle2 className='text-green-1300 size-5 shrink-0' />
          <p className='text-paragraph-sm text-neutral-1000'>
            You are all caught up — nothing is waiting on you right now.
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-200'>
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                className='hover:bg-neutral-150 group flex items-center gap-3 px-5 py-3 transition-colors'
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${TONE_BADGE[item.tone]}`}
                >
                  {item.count}
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='text-paragraph-md text-neutral-1600 block truncate font-medium'>
                    {item.title}
                  </span>
                  <span className='text-paragraph-sm text-neutral-1000 block truncate'>
                    {item.description}
                  </span>
                </span>
                <ArrowRight className='text-neutral-800 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100' />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
