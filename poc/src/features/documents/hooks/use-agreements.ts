import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  EMPLOYEES,
  seedTemplates,
  todayIso,
} from '@/features/hr-letters/data/hr-letters'
import {
  addDaysIso,
  effectiveStatusOf,
  renderAgreementBody,
  seedAgreements,
  type Agreement,
  type AgreementHistoryEntry,
  type ContractAgreementType,
  type ExpiryRule,
} from '../data/agreements'

/**
 * App-wide agreements store (O10). Agreement records are shared across the
 * admin grid and the employee "My agreements" view, so state lives in a tiny
 * module-level external store (same idiom as the Workflow Engine catalog)
 * instead of per-page useState.
 */
let agreementState: Agreement[] = seedAgreements
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function mutate(updater: (prev: Agreement[]) => Agreement[]) {
  agreementState = updater(agreementState)
  emit()
}

export function subscribeAgreements(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAgreementsSnapshot() {
  return agreementState
}

const entry = (
  actor: string,
  action: string,
  detail: string
): AgreementHistoryEntry => ({ on: todayIso(), actor, action, detail })

export interface AgreementDraft {
  type: ContractAgreementType
  templateId: string
  employeeId: string
  executedOn: string
  validFrom: string
  validUntil?: string
  expiryRule: ExpiryRule
  acknowledgmentRequired: boolean
}

const fileNameFor = (id: string, type: ContractAgreementType) =>
  `${id.toUpperCase()}-${type.replace(/\s+/g, '-')}.pdf`

/**
 * Agreements store hook: create (generate via the F8 template + merge
 * engine), acknowledge (W11), renew (successor record linked to the
 * original) and terminate. Every mutation is audited.
 */
export function useAgreements({ actor }: { actor: string }) {
  const agreements = useSyncExternalStore(
    subscribeAgreements,
    getAgreementsSnapshot
  )

  /**
   * Generate an agreement from its Template Engine template. Callers must
   * gap-check first (renderAgreementBody) — this assumes the merge is clean.
   * Returns the created record so the caller can file it in Documents.
   */
  const createAgreement = useCallback(
    (draft: AgreementDraft): Agreement | null => {
      const template = seedTemplates.find((t) => t.id === draft.templateId)
      const employee = EMPLOYEES.find((e) => e.id === draft.employeeId)
      if (!template || !employee) {
        toast.error('Pick a template and an employee before generating')
        return null
      }
      const { rendered } = renderAgreementBody(template.body, employee.id, {
        executedOn: draft.executedOn,
        validFrom: draft.validFrom,
        validUntil: draft.validUntil,
      })
      const id = `agr-${crypto.randomUUID().slice(0, 6)}`
      const history: AgreementHistoryEntry[] = [
        entry(
          actor,
          'Generated',
          `Generated from ${template.name} (F8) — merge fields resolved with no gaps`
        ),
      ]
      if (draft.acknowledgmentRequired) {
        history.push(
          entry(
            actor,
            'Sent for acknowledgment',
            'Delivered to the employee portal for acknowledgment'
          )
        )
      } else {
        history.push(
          entry(
            'System',
            'Activated',
            'No acknowledgment required — agreement active on execution'
          )
        )
      }
      const record: Agreement = {
        id,
        employeeId: employee.id,
        employeeName: employee.name,
        type: draft.type,
        templateId: template.id,
        templateName: template.name,
        signingAuthority: template.signingAuthority,
        status: draft.acknowledgmentRequired
          ? 'Sent for acknowledgment'
          : 'Active',
        executedOn: draft.executedOn,
        validFrom: draft.validFrom,
        validUntil: draft.validUntil,
        expiryRule: draft.expiryRule,
        acknowledgment: { required: draft.acknowledgmentRequired },
        documentRef: {
          fileName: fileNameFor(id, draft.type),
          storedIn: 'Documents — Contract category, employee record',
        },
        renderedBody: rendered,
        createdBy: actor,
        createdOn: todayIso(),
        history,
      }
      mutate((prev) => [record, ...prev])
      publishAuditEvent({
        module: 'Documents — Agreements',
        action: 'Agreement generated',
        actor,
        actionType: 'create',
        recordId: id,
        recordName: `${draft.type} — ${employee.name}`,
        changes: [
          { field: 'Template', previousValue: null, newValue: `${template.name} (${template.id})` },
          { field: 'Validity', previousValue: null, newValue: draft.validUntil ? `${draft.validFrom} → ${draft.validUntil}` : `${draft.validFrom} → no expiry` },
          { field: 'Expiry rule', previousValue: null, newValue: draft.expiryRule },
          { field: 'Acknowledgment', previousValue: null, newValue: draft.acknowledgmentRequired ? 'Required — sent to employee' : 'Not required' },
        ],
      })
      toast.success(
        `${draft.type} generated for ${employee.name} — stored in Documents${draft.acknowledgmentRequired ? ' and sent for acknowledgment' : ''}`
      )
      return record
    },
    [actor]
  )

  /** Employee acknowledgment (W11) — records who accepted and when. */
  const acknowledgeAgreement = useCallback(
    (id: string, note?: string) => {
      const target = agreementState.find((a) => a.id === id)
      if (!target) return
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'Acknowledged',
                acknowledgment: {
                  ...a.acknowledgment,
                  acknowledgedOn: todayIso(),
                  note: note || 'Acknowledged in the portal.',
                },
                history: [
                  ...a.history,
                  entry(actor, 'Acknowledged', 'Employee acknowledged in the portal'),
                ],
              }
            : a
        )
      )
      publishAuditEvent({
        module: 'Documents — Agreements',
        action: 'Agreement acknowledged',
        actor,
        actionType: 'update',
        recordId: id,
        recordName: `${target.type} — ${target.employeeName}`,
        changes: [
          {
            field: 'Status',
            previousValue: target.status,
            newValue: 'Acknowledged',
          },
        ],
      })
      toast.success(`${target.type} acknowledged — HR has been notified`)
    },
    [actor]
  )

  /**
   * Renewal: creates a successor record linked to the original with fresh
   * validity and a fresh acknowledgment cycle; the original keeps its
   * terminal state and points at the renewal.
   */
  const renewAgreement = useCallback(
    (id: string): Agreement | null => {
      const original = agreementState.find((a) => a.id === id)
      if (!original) return null
      if (original.renewedAs) {
        toast.error('This agreement has already been renewed')
        return null
      }
      const template = seedTemplates.find((t) => t.id === original.templateId)
      const today = todayIso()
      const validUntil = original.validUntil
        ? addDaysIso(today, 365)
        : undefined
      const { rendered } = renderAgreementBody(
        template?.body ?? original.renderedBody,
        original.employeeId,
        { executedOn: today, validFrom: today, validUntil }
      )
      const newId = `agr-${crypto.randomUUID().slice(0, 6)}`
      const required = original.acknowledgment.required
      const successor: Agreement = {
        ...original,
        id: newId,
        status: required ? 'Sent for acknowledgment' : 'Active',
        executedOn: today,
        validFrom: today,
        validUntil,
        acknowledgment: { required },
        documentRef: {
          fileName: fileNameFor(newId, original.type),
          storedIn: 'Documents — Contract category, employee record',
        },
        renderedBody: rendered,
        renewalOf: original.id,
        renewedAs: undefined,
        createdBy: actor,
        createdOn: today,
        history: [
          entry(
            actor,
            'Generated',
            `Renewal of ${original.id} — regenerated from ${original.templateName} (F8) with fresh validity`
          ),
          ...(required
            ? [
                entry(
                  actor,
                  'Sent for acknowledgment',
                  'Delivered to the employee portal for a fresh acknowledgment cycle'
                ),
              ]
            : [
                entry(
                  'System',
                  'Activated',
                  'No acknowledgment required — renewal active on execution'
                ),
              ]),
        ],
      }
      mutate((prev) => [
        successor,
        ...prev.map((a) =>
          a.id === id
            ? {
                ...a,
                renewedAs: newId,
                history: [
                  ...a.history,
                  entry(
                    actor,
                    'Renewed',
                    `Renewal ${newId} created with fresh validity and acknowledgment cycle`
                  ),
                ],
              }
            : a
        ),
      ])
      publishAuditEvent({
        module: 'Documents — Agreements',
        action: 'Agreement renewed',
        actor,
        actionType: 'create',
        recordId: newId,
        recordName: `${original.type} — ${original.employeeName}`,
        changes: [
          { field: 'Renewal of', previousValue: null, newValue: original.id },
          {
            field: 'Validity',
            previousValue: original.validUntil ? `${original.validFrom} → ${original.validUntil}` : `${original.validFrom} → no expiry`,
            newValue: validUntil ? `${today} → ${validUntil}` : `${today} → no expiry`,
          },
        ],
      })
      toast.success(
        `${original.type} renewed for ${original.employeeName} — successor record ${newId.toUpperCase()} created`
      )
      return successor
    },
    [actor]
  )

  /** Early termination — the record stays for the retention trail. */
  const terminateAgreement = useCallback(
    (id: string, reason: string) => {
      const target = agreementState.find((a) => a.id === id)
      if (!target) return
      mutate((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'Terminated',
                history: [
                  ...a.history,
                  entry(actor, 'Terminated', reason || 'Terminated by the company'),
                ],
              }
            : a
        )
      )
      publishAuditEvent({
        module: 'Documents — Agreements',
        action: 'Agreement terminated',
        actor,
        actionType: 'update',
        recordId: id,
        recordName: `${target.type} — ${target.employeeName}`,
        changes: [
          {
            field: 'Status',
            previousValue: effectiveStatusOf(target),
            newValue: 'Terminated',
          },
        ],
      })
      toast.success(`${target.type} for ${target.employeeName} terminated`)
    },
    [actor]
  )

  return {
    agreements,
    createAgreement,
    acknowledgeAgreement,
    renewAgreement,
    terminateAgreement,
  }
}

export type AgreementsStore = ReturnType<typeof useAgreements>
