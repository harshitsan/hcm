import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  retentionUntilFrom,
  seedDocuments,
  todayIso,
  type Channel,
  type DeliveryOutcome,
  type Employee,
  type GenerationTrigger,
  type HrDocument,
  type LetterTemplate,
  type QuestionnaireAnswer,
  type Signatory,
} from '../data/hr-letters'
import { resolveMergeFields } from '../data/merge-engine'

export type HrDocumentsStore = ReturnType<typeof useHrDocuments>

const AUDIT_MODULE = 'HR Letters & Certificates'

/**
 * In-memory generated-documents store. Stands in for the document service —
 * covers gap-checked generation (manual/auto/batch, HLC-03/04/05), the
 * Draft → Pending approval → Approved → Issued lifecycle with signatory
 * tracking (HLC-06/14), distribution + delivery tracking (HLC-08/09/21),
 * reissue as a new linked record (HLC-10/17), 7-year retention (HLC-11), and
 * acknowledgment (HLC-29). Every action appends to the document's immutable
 * audit trail and publishes to the platform audit log.
 */
export function useHrDocuments() {
  const [documents, setDocuments] = useState<HrDocument[]>(seedDocuments)

  const appendAudit = useCallback(
    (id: string, actor: string, action: string, detail: string) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, audit: [...d.audit, { on: todayIso(), actor, action, detail }] }
            : d
        )
      )
    },
    []
  )

  /**
   * Create one letter per employee (HLC-03/05). Every employee is gap-checked
   * against the merge engine first — anyone with missing information is
   * skipped, the rest are created as drafts (manual/batch) or routed straight
   * into the approval workflow (auto).
   */
  const generate = useCallback(
    (
      template: LetterTemplate,
      employees: Employee[],
      trigger: GenerationTrigger,
      event: string,
      generatedBy: string
    ) => {
      const skipped = employees.filter(
        (e) => resolveMergeFields(template.body, e.id).gaps.length > 0
      )
      const ready = employees.filter(
        (e) => resolveMergeFields(template.body, e.id).gaps.length === 0
      )
      const today = todayIso()

      const created: HrDocument[] = ready.map((emp) => ({
        id: `hrl-${crypto.randomUUID().slice(0, 8)}`,
        docType: template.docType,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeHasAppAccess: emp.hasAppAccess,
        status:
          trigger === 'auto'
            ? template.requiresApproval
              ? 'pending-approval'
              : 'approved'
            : 'draft',
        trigger,
        event,
        generatedOn: today,
        generatedBy,
        templateId: template.id,
        templateVersion: template.currentVersion,
        signingAuthority: template.signingAuthority,
        approvedBy: null,
        approvedOn: null,
        signedBy: null,
        reissueOf: null,
        reissuedAs: null,
        requiresAcknowledgment: template.requiresAcknowledgment,
        acknowledgedOn: null,
        retentionUntil: retentionUntilFrom(today),
        rejectReason: null,
        versions: [
          {
            version: 1,
            generatedOn: today,
            event,
            templateVersion: template.currentVersion,
            current: true,
          },
        ],
        distributions: [],
        audit: [
          {
            on: today,
            actor: generatedBy,
            action: 'Generated',
            detail: `${trigger === 'auto' ? 'Automatic' : trigger === 'batch' ? 'Batch' : 'Manual'} generation, template v${template.currentVersion}${
              trigger === 'auto'
                ? template.requiresApproval
                  ? ' — entered approval workflow'
                  : ' — no approval required'
                : ' — saved as draft'
            }`,
          },
        ],
        questionnaireAnswers: [],
        company: emp.company,
      }))

      setDocuments((prev) => [...created, ...prev])

      created.forEach((doc) => {
        publishAuditEvent({
          module: AUDIT_MODULE,
          action: `${doc.docType} generated for ${doc.employeeName}`,
          actor: generatedBy,
          entityType: 'Employee',
          actionType: 'create',
          recordId: doc.id,
          recordName: `${doc.docType} — ${doc.employeeName}`,
        })
      })

      if (skipped.length > 0 && created.length > 0) {
        toast.warning(
          `${created.length} generated, ${skipped.length} skipped for missing data (${skipped
            .map((s) => s.name)
            .join(', ')})`
        )
      } else if (skipped.length > 0) {
        toast.error(
          `Nothing generated — missing information for ${skipped
            .map((s) => s.name)
            .join(', ')}`
        )
      } else if (created.length > 0) {
        toast.success(
          created.length === 1
            ? `${template.docType} generated for ${created[0].employeeName}`
            : `${created.length} letters generated from ${template.name}`
        )
      }
      return { created, skipped }
    },
    []
  )

  /** Move a draft into the approval queue (or straight to approved-equivalent). */
  const sendForApproval = useCallback(
    (id: string, actor: string) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id && d.status === 'draft'
            ? { ...d, status: 'pending-approval' }
            : d
        )
      )
      appendAudit(id, actor, 'Sent for approval', 'Draft submitted to the approval queue')
      publishAuditEvent({
        module: AUDIT_MODULE,
        action: 'Letter sent for approval',
        actor,
        entityType: 'Employee',
        actionType: 'status-change',
        recordId: id,
      })
      toast.success('Sent for approval')
    },
    [appendAudit]
  )

  /**
   * Approve a pending letter (Company Admin) recording the chosen signatory —
   * the signature block on the letter reads "Signed by: NAME, TITLE".
   */
  const approve = useCallback(
    (id: string, approver: string, signatory: Signatory) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'approved',
                approvedBy: approver,
                approvedOn: todayIso(),
                signedBy: signatory,
              }
            : d
        )
      )
      appendAudit(
        id,
        approver,
        'Approved',
        `Approved — signed by ${signatory.name}, ${signatory.title}`
      )
      publishAuditEvent({
        module: AUDIT_MODULE,
        action: `Letter approved — signed by ${signatory.name}, ${signatory.title}`,
        actor: approver,
        entityType: 'Employee',
        actionType: 'status-change',
        recordId: id,
      })
      toast.success(
        `Approved — will carry the signature of ${signatory.name}, ${signatory.title}`
      )
    },
    [appendAudit]
  )

  const reject = useCallback(
    (id: string, approver: string, reason: string) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'rejected', rejectReason: reason } : d
        )
      )
      appendAudit(id, approver, 'Rejected', `Originator notified to correct and regenerate — ${reason}`)
      publishAuditEvent({
        module: AUDIT_MODULE,
        action: 'Letter rejected',
        actor: approver,
        entityType: 'Employee',
        actionType: 'status-change',
        recordId: id,
      })
      toast.error('Document rejected — originator notified, not issued')
    },
    [appendAudit]
  )

  /**
   * Dispatch through the notification engine (HLC-08/09/21) — the letter
   * becomes Issued. Outcome is deterministic: in-app needs portal access, a
   * bouncing mailbox fails email, print always yields a print-ready copy, and
   * handover records who handed the physical document over and when.
   */
  const distribute = useCallback(
    (
      id: string,
      channel: Channel,
      employee: Employee | undefined,
      options?: {
        ccRecipients?: string[]
        handedOverBy?: string
        handoverDate?: string
      }
    ) => {
      const doc = documents.find((d) => d.id === id)
      if (!doc) return
      if (doc.status !== 'approved' && doc.status !== 'issued') {
        toast.error('Only approved letters can be issued')
        return
      }
      const ccRecipients = options?.ccRecipients?.length
        ? options.ccRecipients
        : undefined
      let outcome: DeliveryOutcome
      let detail: string
      if (channel === 'in-app') {
        outcome = 'delivered'
        detail = 'Available in employee portal'
      } else if (channel === 'email') {
        if (employee?.emailBounces) {
          outcome = 'failed'
          detail = 'Mailbox unavailable — retry or use another channel'
        } else {
          outcome = 'delivered'
          detail = employee?.email ?? 'Employee email'
        }
      } else if (channel === 'handover') {
        outcome = 'delivered'
        detail = `Physical copy handed over by ${options?.handedOverBy ?? 'HR desk'}`
      } else {
        outcome = 'sent'
        detail = 'Print-ready copy generated'
      }
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'issued',
                distributions: [
                  ...d.distributions,
                  {
                    id: `dst-${crypto.randomUUID().slice(0, 6)}`,
                    channel,
                    sentOn: todayIso(),
                    outcome,
                    detail,
                    ccRecipients,
                    handedOverBy:
                      channel === 'handover' ? options?.handedOverBy : undefined,
                    handoverDate:
                      channel === 'handover'
                        ? (options?.handoverDate ?? todayIso())
                        : undefined,
                  },
                ],
              }
            : d
        )
      )
      appendAudit(
        id,
        channel === 'handover'
          ? (options?.handedOverBy ?? 'HR desk')
          : 'Notification engine',
        outcome === 'failed'
          ? 'Delivery failed'
          : channel === 'handover'
            ? 'Handed over'
            : 'Issued',
        `${channel} dispatch — ${detail}${
          ccRecipients ? ` · CC: ${ccRecipients.join(', ')}` : ''
        }`
      )
      publishAuditEvent({
        module: AUDIT_MODULE,
        action:
          outcome === 'failed'
            ? `Letter delivery failed (${channel})`
            : `Letter issued via ${channel}`,
        actor: options?.handedOverBy ?? 'Notification engine',
        entityType: 'Employee',
        actionType: 'status-change',
        recordId: id,
        recordName: `${doc.docType} — ${doc.employeeName}`,
      })
      if (outcome === 'failed') {
        toast.error(`Email delivery failed — re-send via another channel`)
      } else if (channel === 'handover') {
        toast.success(
          `Handover recorded — ${options?.handedOverBy ?? 'HR desk'} handed the document to ${doc.employeeName}`
        )
      } else {
        toast.success(
          `Letter issued via ${channel} (${outcome})${
            ccRecipients ? ` — CC'd ${ccRecipients.length} employee(s)` : ''
          }`
        )
      }
    },
    [documents, appendAudit]
  )

  /**
   * Reissue creates a brand-new letter record linked to the original
   * ("Reissue of hrl-1004") with a fresh approval cycle; the original stays
   * retained and gains a link to its reissue (HLC-10/17).
   */
  const reissue = useCallback(
    (id: string, reason: string, actor: string) => {
      const original = documents.find((d) => d.id === id)
      if (!original) return
      const today = todayIso()
      const newId = `hrl-${crypto.randomUUID().slice(0, 8)}`
      const replacement: HrDocument = {
        ...original,
        id: newId,
        status: 'pending-approval',
        trigger: 'manual',
        event: `Reissue of ${original.id}`,
        generatedOn: today,
        generatedBy: actor,
        approvedBy: null,
        approvedOn: null,
        signedBy: null,
        reissueOf: original.id,
        reissuedAs: null,
        acknowledgedOn: null,
        retentionUntil: retentionUntilFrom(today),
        rejectReason: null,
        versions: [
          {
            version: 1,
            generatedOn: today,
            event: `Reissue of ${original.id}`,
            templateVersion: original.templateVersion,
            current: true,
          },
        ],
        distributions: [],
        audit: [
          {
            on: today,
            actor,
            action: 'Generated',
            detail: `Reissue of ${original.id} (${reason}) — fresh approval cycle`,
          },
        ],
        questionnaireAnswers: [],
      }
      setDocuments((prev) => [
        replacement,
        ...prev.map((d) =>
          d.id === id
            ? {
                ...d,
                reissuedAs: newId,
                audit: [
                  ...d.audit,
                  {
                    on: today,
                    actor,
                    action: 'Reissued',
                    detail: `Reissued as ${newId} (${reason}) — new letter enters a fresh approval cycle`,
                  },
                ],
              }
            : d
        ),
      ])
      publishAuditEvent({
        module: AUDIT_MODULE,
        action: `Letter reissued — ${original.id} replaced by ${newId}`,
        actor,
        entityType: 'Employee',
        actionType: 'create',
        recordId: newId,
        recordName: `${original.docType} — ${original.employeeName} (reissue)`,
      })
      toast.success(
        `Reissue created as a new letter linked to ${original.id} — it now awaits approval`
      )
    },
    [documents]
  )

  /** Employee acknowledgment/signature on agreement letters (HLC-29/30). */
  const acknowledge = useCallback(
    (id: string, employeeName: string, answers: QuestionnaireAnswer[]) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, acknowledgedOn: todayIso(), questionnaireAnswers: answers }
            : d
        )
      )
      appendAudit(id, employeeName, 'Acknowledged', 'Employee acknowledged/signed the agreement in-app')
      publishAuditEvent({
        module: AUDIT_MODULE,
        action: 'Agreement acknowledged',
        actor: employeeName,
        entityType: 'Employee',
        actionType: 'update',
        recordId: id,
      })
      toast.success('Agreement acknowledged — timestamp recorded')
    },
    [appendAudit]
  )

  return {
    documents,
    generate,
    sendForApproval,
    approve,
    reject,
    distribute,
    reissue,
    acknowledge,
  }
}
