import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  auditEvent,
  seedEntries,
  type CompanyName,
  type EntryStatus,
  type EntryType,
  type FeedbackEntry,
} from '../data/entries'

export interface EntryDraft {
  type: EntryType
  category: string
  details: Record<string, string>
  anonymous: boolean
  onBehalfOf: string | null
}

/** Routing inputs the workflow engine reads from governed config (FBG-16). */
export interface RoutingContext {
  anonymousReceivers: string[]
  nonAnonymousReceivers: string[]
  schemaVersion: number
  company: CompanyName
  actor: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.floor(ms / 86_400_000)
}

let entrySeq = 14
let anonSeq = 0

/**
 * In-memory Feedback & Grievance entry store. Submission enters the
 * role-based review workflow, status changes append to the audit trail, and
 * the SLA engine issues reminders/escalations — all client-side for the POC.
 */
export function useFeedbackEntries() {
  const [entries, setEntries] = useState<FeedbackEntry[]>(seedEntries)

  const submitEntry = useCallback((draft: EntryDraft, ctx: RoutingContext) => {
    entrySeq += 1
    const receivers = draft.anonymous
      ? ctx.anonymousReceivers
      : ctx.nonAnonymousReceivers
    const routed = receivers.length > 0
    anonSeq += 1
    const anonymousRef = draft.anonymous
      ? `ANON-${(9130 + anonSeq * 7).toString(36).toUpperCase()}`
      : null
    const submitterLabel = draft.anonymous
      ? `Anonymous (${anonymousRef})`
      : ctx.actor
    const now = today()

    const entry: FeedbackEntry = {
      id: `FG-2026-${String(entrySeq).padStart(3, '0')}`,
      type: draft.type,
      category: draft.category,
      subject: draft.details.subject ?? '(no subject)',
      details: draft.details,
      status: routed ? 'Submitted' : 'On Hold',
      anonymous: draft.anonymous,
      anonymousRef,
      submittedBy: draft.anonymous ? null : ctx.actor,
      onBehalfOf: draft.onBehalfOf,
      isMine: !draft.onBehalfOf,
      company: ctx.company,
      assignedTo: routed ? receivers[0] : 'Unrouted — held',
      submittedOn: now,
      lastActionOn: now,
      schemaVersion: ctx.schemaVersion,
      audit: [
        draft.onBehalfOf
          ? auditEvent(now, ctx.actor, 'Submitted on behalf', `Filed on behalf of ${draft.onBehalfOf} (Employee — Non-User).`)
          : auditEvent(now, submitterLabel, 'Submitted', `Entry created via submission form (schema v${ctx.schemaVersion}).${draft.anonymous ? ' Submitter identity withheld.' : ''}`),
        routed
          ? auditEvent(now, 'Workflow engine', 'Routed', `Assigned to ${draft.anonymous ? 'Anonymous' : 'Non-Anonymous'} receiver role: ${receivers[0]}.`)
          : auditEvent(now, 'Workflow engine', 'Held', 'No matching receiver role configured — entry held and flagged instead of being routed to an unauthorized party.'),
        auditEvent(now, 'Notification engine', 'Notification sent', `Acknowledgement issued (template: Submission acknowledgement)${draft.anonymous ? '; identifying details omitted.' : '.'}`),
      ],
    }

    setEntries((prev) => [entry, ...prev])
    if (routed) {
      toast.success(`${entry.id} submitted and routed to ${entry.assignedTo}`, {
        description: draft.anonymous
          ? `Track it anonymously with reference ${anonymousRef}.`
          : 'A templated acknowledgement was sent to the submitter.',
      })
    } else {
      toast.warning(`${entry.id} submitted but held`, {
        description: 'No receiver role is configured for this submission type — flagged for the Company Admin.',
      })
    }
    return entry
  }, [])

  const updateStatus = useCallback(
    (id: string, status: EntryStatus, note: string, actor: string) => {
      const now = today()
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                lastActionOn: now,
                audit: [
                  ...e.audit,
                  auditEvent(now, actor, `Status changed to ${status}`, note || 'No reviewer note provided.'),
                  auditEvent(now, 'Notification engine', 'Notification sent', `Status-change notification issued to the submitter (template: Status change)${e.anonymous ? '; identity withheld.' : '.'}`),
                ],
              }
            : e
        )
      )
      toast.success(`${id} moved to ${status}`, {
        description: 'The change is recorded in the audit trail and the submitter was notified.',
      })
    },
    []
  )

  const escalate = useCallback((id: string, coordinator: string, actor: string) => {
    const now = today()
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'Escalated',
              assignedTo: coordinator,
              lastActionOn: now,
              audit: [
                ...e.audit,
                auditEvent(now, actor, 'Escalated to coordinator', `Reassigned to the designated Feedback / Grievance Coordinator (${coordinator}).`),
              ],
            }
          : e
      )
    )
    toast.success(`${id} escalated to ${coordinator}`)
  }, [])

  /** SLA engine (FBG-24/25/27): approver reminders + coordinator escalations. */
  const runSlaEngine = useCallback(
    (approverDays: number, coordinatorDays: number, coordinator: string | null) => {
      const now = today()
      let reminders = 0
      let escalations = 0
      const next = entries.map((e) => {
        if (e.status !== 'Submitted' && e.status !== 'Under Review') return e
        const idle = daysBetween(e.lastActionOn, now)
        if (coordinator && idle >= coordinatorDays) {
          escalations += 1
          return {
            ...e,
            status: 'Escalated' as EntryStatus,
            assignedTo: coordinator,
            lastActionOn: now,
            audit: [
              ...e.audit,
              auditEvent(now, 'SLA engine', 'Escalated to coordinator', `No approver action for ${idle} days (threshold ${coordinatorDays}) — escalated to ${coordinator} (template: Coordinator escalation).`),
            ],
          }
        }
        if (idle >= approverDays) {
          reminders += 1
          return {
            ...e,
            audit: [
              ...e.audit,
              auditEvent(now, 'SLA engine', 'Approver reminder issued', `Pending with ${e.assignedTo} for ${idle} days (threshold ${approverDays}); reminder sent (template: Approver reminder)${e.anonymous ? '; submitter identity withheld.' : '.'}`),
            ],
          }
        }
        return e
      })
      setEntries(next)
      if (reminders === 0 && escalations === 0) {
        toast.info('SLA engine ran — every open entry is within its thresholds')
      } else {
        toast.success(`SLA engine: ${reminders} approver reminder${reminders === 1 ? '' : 's'}, ${escalations} coordinator escalation${escalations === 1 ? '' : 's'}`)
      }
    },
    [entries]
  )

  return { entries, submitEntry, updateStatus, escalate, runSlaEngine }
}

export type FeedbackEntriesStore = ReturnType<typeof useFeedbackEntries>
