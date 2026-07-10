import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  auditEvent,
  seedEntries,
  type CompanyName,
  type EntryResponse,
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
  /** "Send to" recipients (employees, or roles suffixed "(role)"). */
  sendTo: string[]
  /** "Copy to" recipients — can view responses but cannot respond. */
  copyTo: string[]
  /** Anonymous only: emails (comma-separated input) receiving responses. */
  responseEmails: string[]
  /** Optional submitter comments. */
  comments: string
}

/** Receiver response draft (Kensium respond form; Type is read-only). */
export interface ResponseDraft {
  sendTo: string[]
  copyTo: string[]
  comments: string
  showToSubmitter: boolean
  status: EntryStatus
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

let entrySeq = 15
let anonSeq = 0
let respondSeq = 100

/**
 * In-memory Feedback & Grievance entry store. Submission enters the
 * role-based review workflow, status changes append to the audit trail, and
 * the SLA engine issues reminders/escalations — all client-side for the POC.
 */
export function useFeedbackEntries() {
  const [entries, setEntries] = useState<FeedbackEntry[]>(seedEntries)

  const submitEntry = useCallback((draft: EntryDraft, ctx: RoutingContext) => {
    entrySeq += 1
    /** Explicit "Send to" picks win; otherwise fall back to configured receiver roles. */
    const explicitTargets = draft.sendTo.filter(Boolean)
    const receivers =
      explicitTargets.length > 0
        ? explicitTargets
        : draft.anonymous
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
      sendTo: receivers,
      copyTo: draft.copyTo,
      responseEmails: draft.anonymous ? draft.responseEmails : [],
      comments: draft.comments,
      responses: [],
      audit: [
        draft.onBehalfOf
          ? auditEvent(now, ctx.actor, 'Submitted on behalf', `Filed on behalf of ${draft.onBehalfOf} (Employee — Non-User).`)
          : auditEvent(now, submitterLabel, 'Submitted', `Entry created via submission form (schema v${ctx.schemaVersion}).${draft.anonymous ? ' Submitter identity never stored.' : ''}`),
        routed
          ? auditEvent(
              now,
              'Workflow engine',
              'Routed',
              explicitTargets.length > 0
                ? `Sent to: ${explicitTargets.join(', ')}${draft.copyTo.length > 0 ? `; copy to: ${draft.copyTo.join(', ')} (copy-to recipients can view responses but cannot respond)` : ''}.`
                : `Assigned to ${draft.anonymous ? 'Anonymous' : 'Non-Anonymous'} receiver role: ${receivers[0]}.`
            )
          : auditEvent(now, 'Workflow engine', 'Held', 'No matching receiver configured — entry held and flagged instead of being routed to an unauthorized party.'),
        auditEvent(
          now,
          'Notification engine',
          'Notification sent',
          draft.anonymous
            ? `Acknowledgement issued; identifying details omitted.${draft.responseEmails.length > 0 ? ` Responses will be sent to: ${draft.responseEmails.join(', ')}.` : ''}`
            : 'Acknowledgement issued (template: Submission acknowledgement).'
        ),
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

  /**
   * Receiver response flow (Kensium "Employee Feedback/Grievance"): records
   * the response, sets the status ('Feedback received' / 'Closed'), appends
   * to the history trail, and notifies the submitter — for anonymous entries
   * the response is "sent" to the submitter-provided emails.
   */
  const respondToEntry = useCallback(
    (id: string, draft: ResponseDraft, actor: string) => {
      const target = entries.find((e) => e.id === id)
      if (!target) return
      const now = today()
      respondSeq += 1
      const response: EntryResponse = {
        id: `resp-live-${respondSeq}`,
        at: now,
        by: actor,
        sendTo: draft.sendTo,
        copyTo: draft.copyTo,
        comments: draft.comments,
        showToSubmitter: draft.showToSubmitter,
        status: draft.status,
      }
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: draft.status,
                lastActionOn: now,
                responses: [...e.responses, response],
                audit: [
                  ...e.audit,
                  auditEvent(
                    now,
                    actor,
                    `Responded — status set to ${draft.status}`,
                    `Response recorded${draft.showToSubmitter ? ' and shown to the submitter' : ' (internal — not shown to the submitter)'}.${draft.sendTo.length > 0 ? ` Sent to: ${draft.sendTo.join(', ')}.` : ''}${draft.copyTo.length > 0 ? ` Copy to: ${draft.copyTo.join(', ')} (copy-to recipients can view responses but cannot respond).` : ''}`
                  ),
                  auditEvent(
                    now,
                    'Notification engine',
                    'Notification sent',
                    e.anonymous
                      ? `Response sent to the submitter-provided email(s): ${e.responseEmails.length > 0 ? e.responseEmails.join(', ') : 'none provided — visible via anonymous reference only'} — submitter identity remains unknown.`
                      : 'Submitter notified that their feedback/grievance was addressed (template: Status change).'
                  ),
                ],
              }
            : e
        )
      )
      toast.success(`Response submitted for ${id} — status: ${draft.status}`, {
        description: target.anonymous
          ? target.responseEmails.length > 0
            ? `Response sent to ${target.responseEmails.join(', ')} (simulated email); identity remains anonymous.`
            : 'Anonymous submitter can view the response via their tracking reference.'
          : 'The submitter was notified that their submission has been addressed.',
      })
    },
    [entries]
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

  return { entries, submitEntry, updateStatus, respondToEntry, escalate, runSlaEngine }
}

export type FeedbackEntriesStore = ReturnType<typeof useFeedbackEntries>
