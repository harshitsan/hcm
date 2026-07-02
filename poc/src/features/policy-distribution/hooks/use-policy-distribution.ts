import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { seedEmployees, type Employee } from '../data/employees'
import { bumpVersion, seedPolicies, type AckType } from '../data/policies'
import {
  seedAssignments,
  seedAuditEvents,
  seedDistributions,
  type Assignment,
  type Audience,
  type AuditEvent,
  type Distribution,
  type DistributionMethod,
  type DueDateRule,
  type LifecycleEvent,
} from '../data/distributions'
import { type ReAckTrigger, type ReminderRule } from '../data/config'
import {
  computeDueDate,
  resolveAudience,
  slaElapsedPct,
  summarizeAudience,
} from '../utils/audience'

export interface DistributionDraft {
  policyId: string
  ackType: AckType
  audience: Audience
  method: DistributionMethod
  scheduledFor: string | null
  eventTrigger: LifecycleEvent | null
  dueDateRule: DueDateRule
}

function shortId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function retainUntil(fromIso: string): string {
  const d = new Date(fromIso)
  d.setFullYear(d.getFullYear() + 7)
  return d.toISOString().slice(0, 10)
}

function newReceiptId() {
  return `rcpt-${Math.floor(10000 + Math.random() * 89999)}`
}

/** One active assignment per employee + policy + version (uniqueness rule). */
function buildAssignments(
  dist: Distribution,
  recipients: Employee[],
  existing: Assignment[],
  sentAt: string
): Assignment[] {
  return recipients
    .filter(
      (e) =>
        !existing.some(
          (a) =>
            !a.superseded &&
            a.employeeId === e.id &&
            a.policyId === dist.policyId &&
            a.policyVersion === dist.policyVersion
        )
    )
    .map((e) => ({
      id: shortId('as'),
      distributionId: dist.id,
      employeeId: e.id,
      employeeName: e.name,
      company: e.company,
      department: e.department,
      policyId: dist.policyId,
      policyTitle: dist.policyTitle,
      policyVersion: dist.policyVersion,
      ackType: dist.ackType,
      criticality: dist.criticality,
      status: dist.ackType === 'Read-Only' ? 'Delivered' : 'Pending',
      dueDate:
        dist.ackType === 'Read-Only'
          ? null
          : computeDueDate(dist.dueDateRule, e, sentAt),
      assignedAt: sentAt,
      acknowledgedAt: null,
      acknowledgedBy: null,
      proxy: false,
      proxyEvidence: null,
      receiptId: null,
      remindersSent: [],
      escalated: false,
      isNonUser: !e.isPortalUser,
      superseded: false,
      taskStatus: dist.ackType === 'Read-Only' ? 'None' : 'Open',
    }))
}

/**
 * In-memory policy distribution store — distributions, per-recipient
 * acknowledgment assignments and the bitemporal audit trail. Stands in for
 * the rules/workflow engines and the acknowledgment data model.
 */
export function usePolicyDistribution() {
  const [distributions, setDistributions] =
    useState<Distribution[]>(seedDistributions)
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(seedAuditEvents)

  const addAudit = useCallback(
    (event: Omit<AuditEvent, 'id' | 'recordedAt' | 'retainUntil'>) => {
      const recordedAt = new Date().toISOString()
      setAuditEvents((prev) => [
        {
          ...event,
          id: shortId('aud'),
          recordedAt,
          retainUntil: retainUntil(recordedAt),
        },
        ...prev,
      ])
    },
    []
  )

  const createDistribution = useCallback(
    (draft: DistributionDraft, createdBy: string) => {
      const policy = seedPolicies.find((p) => p.id === draft.policyId)
      if (!policy) return null
      const now = new Date().toISOString()
      const isManual = draft.method === 'Manual'
      const recipients = resolveAudience(draft.audience)
      const dist: Distribution = {
        id: shortId('dist'),
        policyId: policy.id,
        policyTitle: policy.title,
        policyVersion: policy.version,
        ackType: draft.ackType,
        criticality: policy.criticality,
        audience: draft.audience,
        audienceSummary: summarizeAudience(draft.audience),
        method: draft.method,
        scheduledFor: draft.method === 'Scheduled' ? draft.scheduledFor : null,
        eventTrigger:
          draft.method === 'Event-triggered' ? draft.eventTrigger : null,
        dueDateRule: draft.dueDateRule,
        status: isManual
          ? 'Sent'
          : draft.method === 'Scheduled'
            ? 'Scheduled'
            : 'Armed',
        isBulk: isManual && recipients.length >= 8,
        createdBy,
        createdAt: now,
        sentAt: isManual ? now : null,
      }
      setDistributions((prev) => [dist, ...prev])
      if (isManual) {
        setAssignments((prev) => [
          ...buildAssignments(dist, recipients, prev, now),
          ...prev,
        ])
        addAudit({
          effectiveAt: now,
          actor: createdBy,
          action: dist.isBulk
            ? 'Bulk distribution completed'
            : 'Distribution sent',
          employeeName: `— (${recipients.length} recipients)`,
          policyTitle: dist.policyTitle,
          policyVersion: dist.policyVersion,
          company: 'Per scope',
          detail: `Audience: ${dist.audienceSummary}. Each assignment timestamped.`,
        })
      } else {
        addAudit({
          effectiveAt: draft.scheduledFor ?? now,
          actor: createdBy,
          action:
            draft.method === 'Scheduled'
              ? 'Distribution scheduled'
              : 'Event trigger armed',
          employeeName: '—',
          policyTitle: dist.policyTitle,
          policyVersion: dist.policyVersion,
          company: 'Per scope',
          detail:
            draft.method === 'Scheduled'
              ? `Queued for ${draft.scheduledFor ?? 'TBD'} — editable until send.`
              : `Fires automatically on ${draft.eventTrigger ?? 'lifecycle'} events.`,
        })
      }
      return dist
    },
    [addAudit]
  )

  const updateDistribution = useCallback((id: string, draft: DistributionDraft) => {
    setDistributions((prev) =>
      prev.map((d) =>
        d.id === id && (d.status === 'Scheduled' || d.status === 'Armed')
          ? {
              ...d,
              ackType: draft.ackType,
              audience: draft.audience,
              audienceSummary: summarizeAudience(draft.audience),
              method: draft.method,
              scheduledFor:
                draft.method === 'Scheduled' ? draft.scheduledFor : null,
              eventTrigger:
                draft.method === 'Event-triggered' ? draft.eventTrigger : null,
              dueDateRule: draft.dueDateRule,
            }
          : d
      )
    )
  }, [])

  const cancelDistribution = useCallback((id: string) => {
    setDistributions((prev) =>
      prev.map((d) =>
        d.id === id && d.sentAt === null ? { ...d, status: 'Cancelled' } : d
      )
    )
  }, [])

  const sendScheduledNow = useCallback(
    (id: string) => {
      const dist = distributions.find((d) => d.id === id)
      if (!dist || dist.status !== 'Scheduled') return
      const now = new Date().toISOString()
      const sent: Distribution = { ...dist, status: 'Sent', sentAt: now }
      const recipients = resolveAudience(sent.audience)
      setDistributions((prev) => prev.map((d) => (d.id === id ? sent : d)))
      setAssignments((prev) => [
        ...buildAssignments(sent, recipients, prev, now),
        ...prev,
      ])
      toast.success(`Sent to ${recipients.length} recipient(s)`)
    },
    [distributions]
  )

  const retryFailed = useCallback(
    (distributionId: string) => {
      const failed = assignments.filter(
        (a) => a.distributionId === distributionId && a.status === 'Failed'
      )
      if (failed.length === 0) return
      const now = new Date().toISOString()
      setAssignments((prev) =>
        prev.map((a) =>
          a.distributionId === distributionId && a.status === 'Failed'
            ? { ...a, status: 'Pending', assignedAt: now }
            : a
        )
      )
      const dist = distributions.find((d) => d.id === distributionId)
      addAudit({
        effectiveAt: now,
        actor: 'Company Admin',
        action: 'Failed recipients retried',
        employeeName: `— (${failed.length} recipients)`,
        policyTitle: dist?.policyTitle ?? '',
        policyVersion: dist?.policyVersion ?? '',
        company: 'Per scope',
        detail: 'Only failed recipients re-sent; delivered recipients untouched.',
      })
      toast.success(
        `Retried ${failed.length} failed recipient(s) — delivered ones skipped`
      )
    },
    [addAudit, assignments, distributions]
  )

  const acknowledge = useCallback(
    (assignmentId: string) => {
      const target = assignments.find((x) => x.id === assignmentId)
      if (!target) return null
      const now = new Date().toISOString()
      const receiptId = newReceiptId()
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                status: 'Acknowledged',
                acknowledgedAt: now,
                acknowledgedBy: a.employeeName,
                receiptId,
                escalated: false,
                taskStatus: 'Completed',
              }
            : a
        )
      )
      addAudit({
        effectiveAt: now,
        actor: target.employeeName,
        action: 'Acknowledged',
        employeeName: target.employeeName,
        policyTitle: target.policyTitle,
        policyVersion: target.policyVersion,
        company: target.company,
        detail: `Self-service acknowledgment. Receipt ${receiptId} issued; linked checklist task completed; any open escalation closed.`,
      })
      toast.success('Acknowledgment recorded — receipt generated')
      return receiptId
    },
    [addAudit, assignments]
  )

  const recordProxyAck = useCallback(
    (assignmentId: string, actor: string, evidence: string) => {
      const target = assignments.find((x) => x.id === assignmentId)
      if (!target) return
      const now = new Date().toISOString()
      const receiptId = newReceiptId()
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                status: 'Acknowledged',
                acknowledgedAt: now,
                acknowledgedBy: `${actor} — proxy`,
                proxy: true,
                proxyEvidence: evidence,
                receiptId,
                escalated: false,
                taskStatus: 'Completed',
              }
            : a
        )
      )
      addAudit({
        effectiveAt: now,
        actor,
        action: 'Proxy acknowledgment',
        employeeName: target.employeeName,
        policyTitle: target.policyTitle,
        policyVersion: target.policyVersion,
        company: target.company,
        detail: `Recorded on behalf of non-user employee. Evidence: ${evidence}`,
      })
      toast.success('Proxy acknowledgment recorded with evidence')
    },
    [addAudit, assignments]
  )

  /** Content-change / renewal / regulatory re-acknowledgment cycle. */
  const triggerReAck = useCallback(
    (policyId: string, trigger: ReAckTrigger, actor: string) => {
      const bumpsVersion =
        trigger === 'Content change' || trigger === 'Regulatory update'
      const now = new Date().toISOString()
      const targets = assignments.filter(
        (a) =>
          a.policyId === policyId && a.status === 'Acknowledged' && !a.superseded
      )
      if (targets.length > 0) {
        const newVersion = bumpsVersion
          ? bumpVersion(targets[0].policyVersion)
          : targets[0].policyVersion
        const reissued: Assignment[] = targets.map((a) => ({
          ...a,
          id: shortId('as'),
          policyVersion: newVersion,
          status: 'Pending',
          dueDate: computeDueDate(
            { type: 'Relative', relativeDays: 14 },
            seedEmployees.find((e) => e.id === a.employeeId) ?? seedEmployees[0],
            now
          ),
          assignedAt: now,
          acknowledgedAt: null,
          acknowledgedBy: null,
          proxy: false,
          proxyEvidence: null,
          receiptId: null,
          remindersSent: [],
          escalated: false,
          superseded: false,
          taskStatus: 'Open',
        }))
        // Prior acknowledgments stay queryable as history — never deleted.
        setAssignments((prev) => [
          ...reissued,
          ...prev.map((a) =>
            targets.some((t) => t.id === a.id) ? { ...a, superseded: true } : a
          ),
        ])
      }
      const policy = seedPolicies.find((p) => p.id === policyId)
      addAudit({
        effectiveAt: now,
        actor,
        action: `Re-acknowledgment triggered (${trigger})`,
        employeeName: `— (${targets.length} active acknowledger(s))`,
        policyTitle: policy?.title ?? policyId,
        policyVersion: policy?.version ?? '',
        company: 'Per scope',
        detail:
          'Prior acknowledgments preserved as bitemporal history; new pending assignments created per the decision table.',
      })
      toast.success(
        targets.length > 0
          ? `Re-acknowledgment required for ${targets.length} employee(s)`
          : 'No active acknowledgments to re-issue for this policy'
      )
    },
    [addAudit, assignments]
  )

  /** Lifecycle integration: onboarding/transfer/role-change automation. */
  const simulateLifecycleEvent = useCallback(
    (
      event: LifecycleEvent,
      employeeId: string,
      enabledTriggers: ReAckTrigger[]
    ) => {
      const employee = seedEmployees.find((e) => e.id === employeeId)
      if (!employee) return
      const now = new Date().toISOString()
      const armed = distributions.filter(
        (d) => d.status === 'Armed' && d.eventTrigger === event
      )
      const additions = armed.flatMap((d) =>
        buildAssignments(d, [employee], assignments, now)
      )
      const reAckTrigger: ReAckTrigger | null =
        event === 'Transfer'
          ? 'Transfer'
          : event === 'Role change'
            ? 'Role change'
            : null
      const reAckTargets =
        reAckTrigger && enabledTriggers.includes(reAckTrigger)
          ? assignments.filter(
              (a) =>
                a.employeeId === employeeId &&
                a.status === 'Acknowledged' &&
                !a.superseded
            )
          : []
      const reissued: Assignment[] = reAckTargets.map((a) => ({
        ...a,
        id: shortId('as'),
        status: 'Pending',
        dueDate: computeDueDate(
          { type: 'Relative', relativeDays: 14 },
          employee,
          now
        ),
        assignedAt: now,
        acknowledgedAt: null,
        acknowledgedBy: null,
        proxy: false,
        proxyEvidence: null,
        receiptId: null,
        remindersSent: [],
        escalated: false,
        superseded: false,
        taskStatus: 'Open',
      }))
      setAssignments((prev) => [
        ...additions,
        ...reissued,
        ...prev.map((a) =>
          reAckTargets.some((t) => t.id === a.id)
            ? { ...a, superseded: true }
            : a
        ),
      ])
      addAudit({
        effectiveAt: now,
        actor: 'System (lifecycle integration)',
        action: `${event} event processed`,
        employeeName: employee.name,
        policyTitle: '— (engine evaluation)',
        policyVersion: '',
        company: employee.company,
        detail: `Workflow engine matched armed triggers and decision-table rules for ${employee.name}.`,
      })
      toast.success(
        `${event} for ${employee.name}: ${additions.length} auto-distribution(s), ${reissued.length} re-acknowledgment(s)`
      )
    },
    [addAudit, assignments, distributions]
  )

  /** SLA engine pass: milestone reminders, overdue marking, escalations. */
  const runSlaSweep = useCallback(
    (reminderRules: ReminderRule[]) => {
      let reminders = 0
      let overdue = 0
      let escalations = 0
      const next = assignments.map((a) => {
        if (a.status !== 'Pending' || a.ackType !== 'Required' || !a.dueDate)
          return a
        const pct = slaElapsedPct(a.assignedAt, a.dueDate)
        if (pct === null) return a
        const rule = reminderRules.find(
          (r) => r.criticality === a.criticality && r.enabled
        )
        const due = (rule?.milestones ?? []).filter(
          (m) => pct >= m && !a.remindersSent.includes(m)
        )
        reminders += due.length
        const isOverdue = pct >= 100
        if (isOverdue) {
          overdue += 1
          if (!a.escalated) escalations += 1
        }
        if (due.length === 0 && !isOverdue) return a
        return {
          ...a,
          remindersSent: [...a.remindersSent, ...due],
          status: isOverdue ? ('Overdue' as const) : a.status,
          escalated: a.escalated || isOverdue,
        }
      })
      setAssignments(next)
      addAudit({
        effectiveAt: new Date().toISOString(),
        actor: 'System (SLA engine)',
        action: 'SLA sweep executed',
        employeeName: '—',
        policyTitle: '— (all pending required)',
        policyVersion: '',
        company: 'All tenants (row-level isolated)',
        detail: `Sent ${reminders} milestone reminder(s); ${overdue} overdue; ${escalations} escalation(s) routed via workflow engine.`,
      })
      toast.success(
        `SLA sweep: ${reminders} reminder(s) sent, ${overdue} overdue, ${escalations} new escalation(s)`
      )
    },
    [addAudit, assignments]
  )

  return {
    distributions,
    assignments,
    auditEvents,
    createDistribution,
    updateDistribution,
    cancelDistribution,
    sendScheduledNow,
    retryFailed,
    acknowledge,
    recordProxyAck,
    triggerReAck,
    simulateLifecycleEvent,
    runSlaSweep,
  }
}

export type PolicyDistributionStore = ReturnType<typeof usePolicyDistribution>
