/**
 * createAuditedStore (scaffold kit §3) — enforces the shared
 * { append, notify, actor, actorRole } contract for module stores and
 * mirrors every append into the central /audit-logs live trail so demo
 * mutations show up there immediately (worklist #26).
 */
import {
  publishAuditEvent,
  type PublishAuditInput,
} from '@/features/audit-logs/data/live-trail'

export interface AuditedAppendInput {
  action: string
  /** The record acted on, e.g. 'lr-2007 · Ananya Sharma'. */
  target: string
  before?: string
  after?: string
  reason?: string
}

export interface AuditedStore {
  actor: string
  actorRole: string
  /** Append to the module trail (if any) AND the central /audit-logs trail. */
  append: (input: AuditedAppendInput) => void
  /** Optional notification side-channel — forwarded to the module sink. */
  notify: (event: string, recipients: string, message: string) => void
}

export function createAuditedStore(options: {
  module: string
  actor: string
  actorRole: string
  /** Module-local append sink (e.g. the module's own audit tab store). */
  appendLocal?: (input: AuditedAppendInput) => void
  /** Module-local notification sink. */
  notifyLocal?: (event: string, recipients: string, message: string) => void
  entityType?: PublishAuditInput['entityType']
}): AuditedStore {
  const { module, actor, actorRole, appendLocal, notifyLocal, entityType } =
    options
  return {
    actor,
    actorRole,
    append(input) {
      appendLocal?.(input)
      publishAuditEvent({
        module,
        action: input.action,
        actor,
        actorRole,
        entityType,
        recordName: input.target,
        changes:
          input.before !== undefined || input.after !== undefined
            ? [
                {
                  field: input.action,
                  previousValue: input.before ?? null,
                  newValue: input.after ?? null,
                },
              ]
            : undefined,
      })
    },
    notify(event, recipients, message) {
      notifyLocal?.(event, recipients, message)
    },
  }
}
