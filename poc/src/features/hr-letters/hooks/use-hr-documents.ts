import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
} from '../data/hr-letters'

export type HrDocumentsStore = ReturnType<typeof useHrDocuments>

/**
 * In-memory generated-documents store. Stands in for the document service —
 * covers generation (manual/auto/batch, HLC-03/04/05), the approval workflow
 * (HLC-06/14), distribution + delivery tracking (HLC-08/09/21), versioning and
 * reissue (HLC-10/17), retention (HLC-11), and acknowledgment (HLC-29).
 * Every action appends to the document's immutable audit trail.
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
   * Render + persist one PDF per employee (HLC-03/05). Employees with
   * incomplete source records are reported as failures without blocking the
   * rest of the batch.
   */
  const generate = useCallback(
    (
      template: LetterTemplate,
      employees: Employee[],
      trigger: GenerationTrigger,
      event: string,
      generatedBy: string
    ) => {
      const failed = employees.filter((e) => e.recordIncomplete)
      const succeeded = employees.filter((e) => !e.recordIncomplete)
      const today = todayIso()

      const created: HrDocument[] = succeeded.map((emp) => ({
        id: `hrl-${crypto.randomUUID().slice(0, 8)}`,
        docType: template.docType,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeHasAppAccess: emp.hasAppAccess,
        status: template.requiresApproval ? 'pending-approval' : 'approved',
        trigger,
        event,
        generatedOn: today,
        generatedBy,
        templateId: template.id,
        templateVersion: template.currentVersion,
        signingAuthority: template.signingAuthority,
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
            detail: `${trigger} generation, template v${template.currentVersion}${
              template.requiresApproval
                ? ' — entered approval workflow'
                : ' — no approval required, finalized directly'
            }`,
          },
        ],
        questionnaireAnswers: [],
        company: emp.company,
      }))

      setDocuments((prev) => [...created, ...prev])

      if (failed.length > 0) {
        toast.warning(
          `${failed.length} document(s) failed — incomplete source record: ${failed
            .map((f) => f.name)
            .join(', ')}. ${created.length} succeeded.`
        )
      } else if (created.length > 0) {
        toast.success(
          created.length === 1
            ? `${template.docType} generated as PDF for ${created[0].employeeName}`
            : `${created.length} PDFs generated for ${template.docType}`
        )
      }
      return { created, failed }
    },
    []
  )

  const approve = useCallback(
    (id: string, approver: string) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d))
      )
      appendAudit(id, approver, 'Approved', 'Approval step completed — document finalized')
      toast.success('Document approved and finalized')
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
      toast.error('Document rejected — originator notified, not distributed')
    },
    [appendAudit]
  )

  /**
   * Dispatch through the notification engine (HLC-08/09/21). Outcome is
   * deterministic: in-app needs portal access, a bouncing mailbox fails email,
   * print always yields a print-ready copy, and handover records who handed
   * the physical document over and when. Other employees can be CC'd on the
   * communication; CC names are stored on the distribution record.
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
      if (doc.status !== 'approved' && doc.status !== 'distributed') {
        toast.error('Only finalized documents can be dispatched')
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
                status: 'distributed',
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
            : 'Distributed',
        `${channel} dispatch — ${detail}${
          ccRecipients ? ` · CC: ${ccRecipients.join(', ')}` : ''
        }`
      )
      if (outcome === 'failed') {
        toast.error(`Email delivery failed — re-send via another channel`)
      } else if (channel === 'handover') {
        toast.success(
          `Handover recorded — ${options?.handedOverBy ?? 'HR desk'} handed the document to ${doc.employeeName}`
        )
      } else {
        toast.success(
          `Document dispatched via ${channel} (${outcome})${
            ccRecipients ? ` — CC'd ${ccRecipients.length} employee(s)` : ''
          }`
        )
      }
    },
    [documents, appendAudit]
  )

  /**
   * Reissue creates a new current version; prior versions stay retained
   * (HLC-10). A rejected document re-enters the approval workflow.
   */
  const reissue = useCallback(
    (id: string, reason: string, actor: string) => {
      const today = todayIso()
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d
          const nextVersion = d.versions.length + 1
          return {
            ...d,
            status: d.status === 'rejected' ? 'pending-approval' : d.status,
            rejectReason: null,
            versions: [
              ...d.versions.map((ver) => ({ ...ver, current: false })),
              {
                version: nextVersion,
                generatedOn: today,
                event: `Reissue — ${reason}`,
                templateVersion: d.templateVersion,
                current: true,
              },
            ],
          }
        })
      )
      appendAudit(id, actor, 'Reissued', `New version issued (${reason}); prior versions retained`)
      toast.success('Document reissued — new current version created, history retained')
    },
    [appendAudit]
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
      toast.success('Agreement acknowledged — timestamp recorded')
    },
    [appendAudit]
  )

  return { documents, generate, approve, reject, distribute, reissue, acknowledge }
}
