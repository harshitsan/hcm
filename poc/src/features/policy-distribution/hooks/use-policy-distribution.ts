import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { type UploadResult } from '@/components/common/upload-modal'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { seedEmployees, type Employee } from '../data/employees'
import {
  bumpVersion,
  renewalCadenceMonths,
  seedPolicies,
  type AckType,
  type Policy,
} from '../data/policies'
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
  consumeReAckWave,
  getPendingReAckWaves,
  subscribeReAckWaves,
  type ReAckWaveAnnouncement,
} from '../data/reack-waves'
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

const waveDateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

/** Plain-language fallback shown to employees when no specific context exists. */
export function reAckReason(trigger: ReAckTrigger): string {
  switch (trigger) {
    case 'Content change':
      return 'the policy content changed'
    case 'Periodic renewal':
      return 'your previous acknowledgment has expired'
    case 'Transfer':
      return 'your transfer requires a fresh acknowledgment'
    case 'Role change':
      return 'your role change requires a fresh acknowledgment'
    case 'Regulatory update':
      return 'a regulatory update applies to this policy'
  }
}

/** A policy whose acknowledgments have aged past its renewal cadence. */
export interface RenewalDueItem {
  policy: Policy
  /** Most recent active acknowledgment for the policy. */
  lastAcknowledgedAt: string
  /** When the renewal cycle lapsed. */
  dueSince: string
  /** How many active acknowledgments would be re-issued. */
  employeeCount: number
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
      trigger: dist.trigger,
      triggerContext: null,
      priority: dist.priority,
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
        trigger: 'Initial',
        priority: false,
        // Bulk runs come exclusively through the sanctioned Import
        // framework — see importBulkDistribution below.
        isBulk: false,
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
          action: 'Distribution sent',
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

  /**
   * Bulk distribution through the sanctioned Import framework
   * (UploadModal): the uploaded recipient file is staged, every staged row
   * is validated against the employee directory, the dry-run reports
   * row-level errors, and only clean rows commit as a bulk distribution
   * with timestamped per-recipient assignments.
   */
  const importBulkDistribution = useCallback(
    async (file: File, actor: string): Promise<UploadResult> => {
      const policy = seedPolicies.find((p) => p.id === 'pol-06')
      if (!policy) return { state: 'failed', failedCount: 0 }
      // Staging: recipient rows parsed out of the uploaded file (mock batch
      // — the POC has no backend, so the staged content is deterministic).
      const staged: {
        row: number
        employeeId: string
        error?: { fieldName: string; reason: string }
      }[] = [
        { row: 2, employeeId: 'emp-102' },
        { row: 3, employeeId: 'emp-103' },
        {
          row: 4,
          employeeId: 'EMP-9999',
          error: {
            fieldName: 'Employee ID',
            reason:
              'Unknown employee ID "EMP-9999" — no matching directory record',
          },
        },
        { row: 5, employeeId: 'emp-104' },
        { row: 6, employeeId: 'emp-107' },
        {
          row: 7,
          employeeId: 'emp-102',
          error: {
            fieldName: 'Employee ID',
            reason:
              'Duplicate of row 2 — one active assignment per employee + policy version',
          },
        },
        { row: 8, employeeId: 'emp-113' },
      ]

      // Validate + dry-run: simulate the round-trip before committing.
      await new Promise((resolve) => setTimeout(resolve, 900))
      const failed = staged.filter((r) => r.error)
      const valid = staged.filter((r) => !r.error)
      const recipients = valid
        .map((r) => seedEmployees.find((e) => e.id === r.employeeId))
        .filter((e): e is Employee => Boolean(e))

      // Commit: only rows that passed the dry-run land as assignments.
      const now = new Date().toISOString()
      const dist: Distribution = {
        id: shortId('dist'),
        policyId: policy.id,
        policyTitle: policy.title,
        policyVersion: policy.version,
        ackType: 'Required',
        criticality: policy.criticality,
        audience: {
          logic: 'OR',
          criteria: [
            { field: 'employee', values: recipients.map((e) => e.id) },
          ],
        },
        audienceSummary: `Bulk import — ${file.name} (${recipients.length} recipients)`,
        method: 'Manual',
        scheduledFor: null,
        eventTrigger: null,
        dueDateRule: { type: 'Relative', relativeDays: 14 },
        status: 'Sent',
        trigger: 'Initial',
        priority: false,
        isBulk: true,
        createdBy: actor,
        createdAt: now,
        sentAt: now,
      }
      setDistributions((prev) => [dist, ...prev])
      setAssignments((prev) => [
        ...buildAssignments(dist, recipients, prev, now),
        ...prev,
      ])
      addAudit({
        effectiveAt: now,
        actor,
        action: 'Bulk distribution completed',
        employeeName: `— (${recipients.length} recipients)`,
        policyTitle: dist.policyTitle,
        policyVersion: dist.policyVersion,
        company: 'Per scope',
        detail: `${file.name}: ${staged.length} rows staged — dry-run passed ${valid.length}, rejected ${failed.length}; each committed assignment timestamped.`,
      })
      toast.success(
        `${file.name}: ${staged.length} rows staged — ${valid.length} committed, ${failed.length} rejected in dry-run`
      )
      return {
        state: failed.length > 0 ? 'partial' : 'success',
        successCount: valid.length,
        failedCount: failed.length,
        errors: failed.map((r) => ({
          row: r.row,
          fieldName: r.error!.fieldName,
          reason: r.error!.reason,
        })),
      }
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

  /**
   * Re-acknowledgment wave: supersedes the active acknowledgments of a
   * policy (kept as history — never deleted) and re-issues them as Pending,
   * recording the wave as its own distribution row so the console shows why
   * each ask went out.
   *
   * When `applicability` is provided (version-bump waves announced by the
   * policy library), the wave is scoped to the policy's CURRENT applicable
   * population: only covered employees are re-asked, employees the policy no
   * longer covers are marked "No longer applicable", and covered employees
   * who never had an assignment receive a first request.
   */
  const runReAckWave = useCallback(
    (input: {
      policyId: string
      policyTitle: string
      currentVersion: string
      criticality: Assignment['criticality']
      trigger: ReAckTrigger
      actor: string
      /** One-line plain-language reason shown to employees, or null. */
      context: string | null
      priority: boolean
      /** Current applicable population; null = re-ask every active acknowledger. */
      applicability?: Audience | null
    }): number => {
      const { trigger } = input
      const bumpsVersion =
        trigger === 'Content change' || trigger === 'Regulatory update'
      const now = new Date().toISOString()
      const targets = assignments.filter(
        (a) =>
          a.policyId === input.policyId &&
          a.status === 'Acknowledged' &&
          !a.superseded
      )
      const baseVersion = targets[0]?.policyVersion ?? input.currentVersion
      const newVersion = bumpsVersion ? bumpVersion(baseVersion) : baseVersion
      // Priority (regulatory) waves get a tighter window.
      const dueRule: DueDateRule = {
        type: 'Relative',
        relativeDays: input.priority ? 7 : 14,
      }

      // Version-bump waves: scope everything to the CURRENT applicable
      // population instead of everyone who ever acknowledged.
      if (input.applicability) {
        const population = resolveAudience(input.applicability)
        const popIds = new Set(population.map((e) => e.id))
        const populationSummary = summarizeAudience(input.applicability)
        const activeForPolicy = assignments.filter(
          (a) => a.policyId === input.policyId && !a.superseded
        )
        // (a) Active acknowledgers still covered by the policy → re-ask.
        const reAckTargets = targets.filter((a) => popIds.has(a.employeeId))
        // (b) Open records for employees the policy no longer covers →
        // closed as "No longer applicable"; evidence stays on the row.
        const dropped = activeForPolicy.filter(
          (a) =>
            !popIds.has(a.employeeId) &&
            (a.status === 'Acknowledged' ||
              a.status === 'Pending' ||
              a.status === 'Overdue' ||
              a.status === 'Failed')
        )
        const droppedIds = new Set(dropped.map((a) => a.id))
        // (c) Covered employees who never had this policy → first request.
        const everAssigned = new Set(
          assignments
            .filter((a) => a.policyId === input.policyId)
            .map((a) => a.employeeId)
        )
        const newlyCovered = population.filter((e) => !everAssigned.has(e.id))

        const waveId = shortId('dist')
        const reissued: Assignment[] = reAckTargets.map((a) => ({
          ...a,
          id: shortId('as'),
          distributionId: waveId,
          policyVersion: newVersion,
          status: 'Pending',
          dueDate: computeDueDate(
            dueRule,
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
          trigger,
          triggerContext: input.context,
          priority: input.priority,
          superseded: false,
          taskStatus: 'Open',
        }))
        const firstRequests: Assignment[] = newlyCovered.map((e) => ({
          id: shortId('as'),
          distributionId: waveId,
          employeeId: e.id,
          employeeName: e.name,
          company: e.company,
          department: e.department,
          policyId: input.policyId,
          policyTitle: input.policyTitle,
          policyVersion: newVersion,
          ackType: 'Required',
          criticality: input.criticality,
          status: 'Pending',
          dueDate: computeDueDate(dueRule, e, now),
          assignedAt: now,
          acknowledgedAt: null,
          acknowledgedBy: null,
          proxy: false,
          proxyEvidence: null,
          receiptId: null,
          remindersSent: [],
          escalated: false,
          isNonUser: !e.isPortalUser,
          trigger: 'Initial',
          triggerContext: 'This policy now applies to you — first request',
          priority: input.priority,
          superseded: false,
          taskStatus: 'Open',
        }))

        if (reissued.length + firstRequests.length > 0) {
          const wave: Distribution = {
            id: waveId,
            policyId: input.policyId,
            policyTitle: input.policyTitle,
            policyVersion: newVersion,
            ackType: 'Required',
            criticality: input.criticality,
            audience: {
              logic: 'OR',
              criteria: [
                {
                  field: 'employee',
                  values: [
                    ...reAckTargets.map((t) => t.employeeId),
                    ...newlyCovered.map((e) => e.id),
                  ],
                },
              ],
            },
            audienceSummary: `Applicable population — ${population.length} employee(s) (${populationSummary})`,
            method: 'Manual',
            scheduledFor: null,
            eventTrigger: null,
            dueDateRule: dueRule,
            status: 'Sent',
            trigger,
            priority: input.priority,
            isBulk: false,
            createdBy: input.actor,
            createdAt: now,
            sentAt: now,
          }
          setDistributions((prev) => [wave, ...prev])
        }
        setAssignments((prev) => [
          ...reissued,
          ...firstRequests,
          ...prev.map((a) => {
            if (reAckTargets.some((t) => t.id === a.id))
              return { ...a, superseded: true }
            if (droppedIds.has(a.id))
              return {
                ...a,
                status: 'No longer applicable' as const,
                escalated: false,
                taskStatus:
                  a.taskStatus === 'Open' ? ('None' as const) : a.taskStatus,
              }
            return a
          }),
        ])
        addAudit({
          effectiveAt: now,
          actor: input.actor,
          action: `Re-acknowledgment triggered (${trigger})`,
          employeeName: `— (${reissued.length} of ${population.length} in the applicable population)`,
          policyTitle: input.policyTitle,
          policyVersion: newVersion,
          company: 'Per scope',
          detail: `Applicable population: ${population.length} employee(s) — ${populationSummary}. ${reissued.length} re-acknowledgment(s) issued, ${firstRequests.length} first request(s) to newly covered employees, ${dropped.length} record(s) closed as "No longer applicable".${input.context ? ` ${input.context}.` : ''} Prior acknowledgments preserved as bitemporal history.`,
        })
        publishAuditEvent({
          module: 'Policy Distribution',
          action: `Re-acknowledgment wave started (${trigger}) — applicable population only`,
          actor: input.actor,
          actionType: 'update',
          recordId: input.policyId,
          recordName: `${input.policyTitle} · ${newVersion} — ${reissued.length} of ${population.length} employees`,
        })
        const descriptionParts = [
          firstRequests.length > 0
            ? `${firstRequests.length} newly covered employee(s) received a first request`
            : null,
          dropped.length > 0
            ? `${dropped.length} record(s) closed as “No longer applicable” — those employees are outside the policy's current applicability`
            : null,
        ].filter((p): p is string => p !== null)
        toast.success(
          `Re-acknowledgment issued to ${reissued.length} of ${population.length} employees — the policy's applicable population`,
          descriptionParts.length > 0
            ? { description: `${descriptionParts.join('. ')}.` }
            : undefined
        )
        return reissued.length
      }

      if (targets.length > 0) {
        const wave: Distribution = {
          id: shortId('dist'),
          policyId: input.policyId,
          policyTitle: input.policyTitle,
          policyVersion: newVersion,
          ackType: 'Required',
          criticality: input.criticality,
          audience: {
            logic: 'OR',
            criteria: [
              { field: 'employee', values: targets.map((t) => t.employeeId) },
            ],
          },
          audienceSummary: `Re-acknowledgment — ${targets.length} employee(s) with an active acknowledgment`,
          method: 'Manual',
          scheduledFor: null,
          eventTrigger: null,
          dueDateRule: dueRule,
          status: 'Sent',
          trigger,
          priority: input.priority,
          isBulk: false,
          createdBy: input.actor,
          createdAt: now,
          sentAt: now,
        }
        const reissued: Assignment[] = targets.map((a) => ({
          ...a,
          id: shortId('as'),
          distributionId: wave.id,
          policyVersion: newVersion,
          status: 'Pending',
          dueDate: computeDueDate(
            dueRule,
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
          trigger,
          triggerContext: input.context,
          priority: input.priority,
          superseded: false,
          taskStatus: 'Open',
        }))
        setDistributions((prev) => [wave, ...prev])
        // Prior acknowledgments stay queryable as history — never deleted.
        setAssignments((prev) => [
          ...reissued,
          ...prev.map((a) =>
            targets.some((t) => t.id === a.id) ? { ...a, superseded: true } : a
          ),
        ])
      }
      addAudit({
        effectiveAt: now,
        actor: input.actor,
        action: `Re-acknowledgment triggered (${trigger})`,
        employeeName: `— (${targets.length} active acknowledger(s))`,
        policyTitle: input.policyTitle,
        policyVersion: newVersion,
        company: 'Per scope',
        detail: input.context
          ? `${input.context}. Prior acknowledgments preserved as bitemporal history.`
          : 'Prior acknowledgments preserved as bitemporal history; new pending assignments created per the decision table.',
      })
      publishAuditEvent({
        module: 'Policy Distribution',
        action: `Re-acknowledgment wave started (${trigger})`,
        actor: input.actor,
        actionType: 'update',
        recordId: input.policyId,
        recordName: `${input.policyTitle} · ${newVersion}`,
      })
      toast.success(
        targets.length > 0
          ? `Re-acknowledgment required for ${targets.length} employee(s) — ${input.policyTitle}`
          : `No active acknowledgments to re-issue for “${input.policyTitle}”`
      )
      return targets.length
    },
    [addAudit, assignments]
  )

  /** Content-change / renewal / regulatory re-acknowledgment cycle. */
  const triggerReAck = useCallback(
    (policyId: string, trigger: ReAckTrigger, actor: string) => {
      const policy = seedPolicies.find((p) => p.id === policyId)
      if (!policy) return
      runReAckWave({
        policyId,
        policyTitle: policy.title,
        currentVersion: policy.version,
        criticality: policy.criticality,
        trigger,
        actor,
        context: null,
        priority: trigger === 'Regulatory update',
      })
    },
    [runReAckWave]
  )

  /**
   * Policies whose active acknowledgments are older than their renewal
   * cadence and have no renewal wave already in flight ("Renewal due").
   */
  const renewalDue = useMemo<RenewalDueItem[]>(() => {
    const nowIso = new Date().toISOString()
    return seedPolicies.flatMap((policy) => {
      const months = renewalCadenceMonths(policy.renewalCadence)
      if (!months) return []
      const active = assignments.filter(
        (a) => a.policyId === policy.id && !a.superseded
      )
      const acked = active.filter(
        (a) => a.status === 'Acknowledged' && a.acknowledgedAt
      )
      if (acked.length === 0) return []
      const hasOpenRenewal = active.some(
        (a) =>
          a.trigger === 'Periodic renewal' &&
          (a.status === 'Pending' || a.status === 'Overdue')
      )
      if (hasOpenRenewal) return []
      const dates = acked.map((a) => a.acknowledgedAt as string).sort()
      const lastAcknowledgedAt = dates[dates.length - 1]
      const dueSince = addMonthsIso(lastAcknowledgedAt, months)
      if (dueSince > nowIso) return []
      return [{ policy, lastAcknowledgedAt, dueSince, employeeCount: acked.length }]
    })
  }, [assignments])

  /** Starts the periodic-renewal wave for a policy past its cadence. */
  const startRenewalWave = useCallback(
    (policyId: string, actor: string) => {
      const policy = seedPolicies.find((p) => p.id === policyId)
      if (!policy) return
      const months = renewalCadenceMonths(policy.renewalCadence)
      runReAckWave({
        policyId,
        policyTitle: policy.title,
        currentVersion: policy.version,
        criticality: policy.criticality,
        trigger: 'Periodic renewal',
        actor,
        context: months
          ? `Renewal cycle (${policy.renewalCadence.toLowerCase()}) — previous acknowledgment is more than ${months} months old`
          : 'Renewal cycle — previous acknowledgment has expired',
        priority: false,
      })
    },
    [runReAckWave]
  )

  /**
   * Waves announced by the Policy Management library on publish (content
   * change / regulatory update) are consumed here exactly once and turned
   * into pending re-acknowledgments — scoped to the policy's current
   * applicable population, not everyone who ever acknowledged.
   */
  const applyAnnouncedWave = useCallback(
    (wave: ReAckWaveAnnouncement) => {
      const publishedOn = waveDateFmt.format(new Date(wave.announcedAt))
      const policy = seedPolicies.find(
        (p) => p.title.trim().toLowerCase() === wave.policyName.trim().toLowerCase()
      )
      if (!policy) {
        addAudit({
          effectiveAt: wave.announcedAt,
          actor: wave.announcedBy,
          action: `Re-acknowledgment wave received (${wave.trigger})`,
          employeeName: '—',
          policyTitle: wave.policyName,
          policyVersion: wave.editionName,
          company: 'Per scope',
          detail:
            'Published from the policy library. No employees currently hold an acknowledgment of this policy, so there is nothing to re-issue yet.',
        })
        return
      }
      runReAckWave({
        policyId: policy.id,
        policyTitle: policy.title,
        currentVersion: policy.version,
        criticality: policy.criticality,
        trigger: wave.trigger,
        actor: wave.announcedBy,
        context:
          wave.trigger === 'Regulatory update'
            ? `Regulatory update published on ${publishedOn} — ${wave.editionName}`
            : `Policy content changed on ${publishedOn} — ${wave.editionName}`,
        priority: wave.priority,
        // Version bumps re-ask the current applicable population only.
        applicability: policy.applicability,
      })
    },
    [addAudit, runReAckWave]
  )

  const pendingWaves = useSyncExternalStore(
    subscribeReAckWaves,
    getPendingReAckWaves
  )
  useEffect(() => {
    pendingWaves.forEach((wave) => {
      // consumeReAckWave dequeues atomically so each wave applies once.
      if (consumeReAckWave(wave.id)) applyAnnouncedWave(wave)
    })
  }, [pendingWaves, applyAnnouncedWave])

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
        trigger: reAckTrigger ?? a.trigger,
        triggerContext:
          event === 'Transfer'
            ? `Transferred on ${waveDateFmt.format(new Date(now))}`
            : event === 'Role change'
              ? `Role changed on ${waveDateFmt.format(new Date(now))}`
              : a.triggerContext,
        priority: false,
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
    importBulkDistribution,
    updateDistribution,
    cancelDistribution,
    sendScheduledNow,
    retryFailed,
    acknowledge,
    recordProxyAck,
    triggerReAck,
    renewalDue,
    startRenewalWave,
    simulateLifecycleEvent,
    runSlaSweep,
  }
}

export type PolicyDistributionStore = ReturnType<typeof usePolicyDistribution>
