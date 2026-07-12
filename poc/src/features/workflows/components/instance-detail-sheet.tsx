import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AuditEvent } from '../data/audit'
import type {
  ApprovalDecision,
  ApprovalTask,
  WorkflowInstance,
} from '../data/instances'
import { ESCALATION_LABELS } from '../data/shared'
import { InstanceStatusBadge, PatternBadge, StageStatusBadge } from './badges'

const DECISION_BADGE: Record<
  ApprovalDecision,
  { label: string; variant: 'badge_active' | 'badge_inactive' | 'pending' | 'dropped' }
> = {
  pending: { label: 'Pending', variant: 'pending' },
  waiting: { label: 'Waiting', variant: 'badge_inactive' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  closed: { label: 'Closed', variant: 'badge_inactive' },
}

/**
 * Full instance drill-down (WFE-13, WFE-20, WFE-21): stage-by-stage statuses
 * and per-approver decisions, the bound definition version, and the complete
 * chronological audit history for the request (WFE-12).
 */
interface TimelineEntry {
  key: string
  at: string
  label: string
  tone: 'neutral' | 'reminder' | 'escalation'
}

/**
 * SLA timeline for a request (F6): assignment, the 50% / 75% reminders that
 * have fired, escalations at 100% and final decisions — derived from the live
 * engine tasks so it advances with the SLA clock.
 */
function buildTimeline(
  instance: WorkflowInstance,
  tasks: ApprovalTask[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const mine = tasks
    .filter((t) => t.instanceId === instance.id)
    .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt))
  for (const t of mine) {
    const stage = instance.stages.find((s) => s.id === t.stageId)
    const strategy = stage ? ESCALATION_LABELS[stage.escalation] : 'escalation'
    entries.push({
      key: `${t.id}-assigned`,
      at: t.assignedAt,
      label: `Assigned to ${t.approver} — ${t.stageName}${
        t.escalatedFrom ? ` (taken over from ${t.escalatedFrom})` : ''
      }`,
      tone: 'neutral',
    })
    for (const th of [50, 75]) {
      if (t.slaPercent >= th) {
        entries.push({
          key: `${t.id}-remind-${th}`,
          at: t.assignedAt,
          label: `Reminder sent to ${t.approver} at ${th}% of the ${t.slaHours}-hour SLA`,
          tone: 'reminder',
        })
      }
    }
    if (t.status === 'escalated' || t.slaPercent >= 100) {
      entries.push({
        key: `${t.id}-escalated`,
        at: t.decidedAt ?? t.assignedAt,
        label: `SLA reached 100% — escalated away from ${t.approver} (${strategy})`,
        tone: 'escalation',
      })
    }
    if ((t.status === 'approved' || t.status === 'rejected') && t.decidedAt) {
      entries.push({
        key: `${t.id}-decided`,
        at: t.decidedAt,
        label: `${t.status === 'approved' ? 'Approved' : 'Rejected'} by ${t.approver}`,
        tone: 'neutral',
      })
    }
  }
  return entries
}

const TIMELINE_DOT: Record<TimelineEntry['tone'], string> = {
  neutral: 'bg-gray-400',
  reminder: 'bg-amber-500',
  escalation: 'bg-red-500',
}

export function InstanceDetailSheet({
  instance,
  events,
  tasks = [],
  open,
  onOpenChange,
}: {
  instance: WorkflowInstance | null
  events: AuditEvent[]
  tasks?: ApprovalTask[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const history = instance
    ? events.filter((e) => e.refId === instance.id)
    : []
  const timeline = instance ? buildTimeline(instance, tasks) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {instance?.title ?? 'Request detail'}
          </SheetTitle>
        </SheetHeader>

        {instance && (
          <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
            <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1000'>Status</span>
                <InstanceStatusBadge status={instance.status} />
              </div>
              <div>
                <span className='text-neutral-1000'>Requester: </span>
                <span className='text-neutral-1900'>{instance.requester}</span>
              </div>
              <div>
                <span className='text-neutral-1000'>Type: </span>
                <span className='text-neutral-1900'>
                  {instance.transactionType}
                </span>
              </div>
              <div>
                <span className='text-neutral-1000'>Context: </span>
                <span className='text-neutral-1900'>
                  {instance.company} · {instance.location} ·{' '}
                  {instance.department}
                </span>
              </div>
              <div>
                <span className='text-neutral-1000'>Started: </span>
                <span className='text-neutral-1900'>{instance.startedAt}</span>
              </div>
              <div>
                <span className='text-neutral-1000'>Completed: </span>
                <span className='text-neutral-1900'>
                  {instance.completedAt ?? '—'}
                </span>
              </div>
              <div className='col-span-2'>
                <span className='text-neutral-1000'>Bound definition: </span>
                <span className='text-neutral-1900 font-medium'>
                  {instance.definitionName} v{instance.definitionVersion}
                </span>
                <span className='text-neutral-1000'>
                  {' '}
                  — stays on this version through completion
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                Stages ({instance.currentStageIndex + 1}/{instance.stages.length}
                )
              </h3>
              <div className='space-y-3'>
                {instance.stages.map((stage, i) => (
                  <div
                    key={stage.id}
                    className='rounded-md border border-gray-200 bg-white p-3'
                  >
                    <div className='mb-2 flex flex-wrap items-center gap-2'>
                      <span className='text-neutral-1600 text-sm font-medium'>
                        {i + 1}. {stage.name}
                      </span>
                      <PatternBadge pattern={stage.pattern} />
                      <StageStatusBadge status={stage.status} />
                    </div>
                    <div className='space-y-1'>
                      {stage.approvals.map((a, j) => (
                        <div
                          key={`${a.approver}-${j}`}
                          className='flex items-center justify-between text-sm'
                        >
                          <span className='text-neutral-1900'>{a.approver}</span>
                          <Badge variant={DECISION_BADGE[a.decision].variant}>
                            {DECISION_BADGE[a.decision].label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className='text-neutral-1000 mt-2 text-xs'>
                      SLA {stage.slaHours} business hrs ·{' '}
                      {ESCALATION_LABELS[stage.escalation]} →{' '}
                      {stage.escalationTarget}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                Timeline
              </h3>
              {timeline.length === 0 ? (
                <p className='text-neutral-1000 text-sm'>
                  No reminders or escalations yet for this request.
                </p>
              ) : (
                <div className='space-y-1.5'>
                  {timeline.map((entry) => (
                    <div
                      key={entry.key}
                      className='flex items-start gap-2 text-sm'
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TIMELINE_DOT[entry.tone]}`}
                        aria-hidden
                      />
                      <div className='flex min-w-0 flex-1 items-baseline justify-between gap-2'>
                        <span className='text-neutral-1900'>{entry.label}</span>
                        <span className='text-neutral-1000 shrink-0 text-xs'>
                          {entry.at}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className='text-neutral-1600 mb-2 text-sm font-semibold'>
                Audit history ({history.length})
              </h3>
              {history.length === 0 ? (
                <p className='text-neutral-1000 text-sm'>
                  No audit events recorded for this request yet.
                </p>
              ) : (
                <div className='space-y-2'>
                  {history.map((e) => (
                    <div
                      key={e.id}
                      className='rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          {e.summary}
                        </span>
                        <span className='text-neutral-1000 text-xs'>
                          {e.timestamp}
                        </span>
                      </div>
                      <p className='text-neutral-1000 mt-1 text-xs'>
                        {e.actor} ({e.actorRole}) — {e.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
