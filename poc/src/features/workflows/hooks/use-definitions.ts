import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDefinitions,
  type WorkflowDefinition,
  type WorkflowStage,
} from '../data/definitions'
import type { TransactionType } from '../data/shared'
import { type AppendAudit } from './use-audit-trail'

export interface DefinitionDraft {
  name: string
  transactionType: TransactionType
  company: string
  effectiveFrom: string
  calendarId: string
  stages: WorkflowStage[]
}

/**
 * Activation gate (WFE-01, WFE-22, WFE-25): a definition cannot go live
 * until every required element is present.
 */
export function validateDefinition(draft: DefinitionDraft): string[] {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push('Workflow name is required')
  if (draft.stages.length === 0) errors.push('At least one stage is required')
  draft.stages.forEach((s, i) => {
    if (!s.name.trim()) errors.push(`Stage ${i + 1}: name is required`)
    if (s.approvers.length === 0)
      errors.push(`Stage ${i + 1} (${s.name || 'unnamed'}): assign at least one approver`)
    if (s.slaHours <= 0)
      errors.push(`Stage ${i + 1} (${s.name || 'unnamed'}): SLA must be greater than 0 hours`)
  })
  if (!draft.effectiveFrom) errors.push('Effective-from date is required')
  return errors
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Versioned, effective-dated workflow definitions store (WFE-01, WFE-20,
 * WFE-22). Publishing supersedes the prior active version and retains it;
 * in-flight instances stay on the version they started with.
 */
export function useDefinitions({
  append,
  actor,
  actorRole,
}: {
  append: AppendAudit
  actor: string
  actorRole: string
}) {
  const [definitions, setDefinitions] =
    useState<WorkflowDefinition[]>(seedDefinitions)

  /**
   * Saves a draft or publishes a new version. Publishing an existing
   * workflow bumps the version and supersedes the previously active one.
   * Returns validation errors (empty array = success).
   */
  const saveDefinition = useCallback(
    (
      draft: DefinitionDraft,
      opts: { publish: boolean; existing?: WorkflowDefinition | null }
    ): string[] => {
      if (opts.publish) {
        const errors = validateDefinition(draft)
        if (errors.length > 0) return errors
      }
      const existing = opts.existing ?? null
      const workflowKey = existing?.workflowKey ?? `wf-${crypto.randomUUID().slice(0, 6)}`
      const version = existing
        ? Math.max(
            ...seedVersions(definitions, workflowKey).map((d) => d.version),
            existing.version
          ) + (opts.publish ? 1 : 0)
        : 1
      const scheduled = draft.effectiveFrom > today()
      const record: WorkflowDefinition = {
        id: `${workflowKey}-v${version || 1}-${crypto.randomUUID().slice(0, 4)}`,
        workflowKey,
        name: draft.name,
        transactionType: draft.transactionType,
        company: draft.company,
        version: version || 1,
        status: opts.publish ? (scheduled ? 'scheduled' : 'active') : 'draft',
        effectiveFrom: draft.effectiveFrom,
        effectiveTo: null,
        calendarId: draft.calendarId,
        stages: draft.stages,
        updatedBy: actor,
        updatedAt: today(),
      }

      setDefinitions((prev) => {
        let next = prev
        if (existing && !opts.publish) {
          // Draft edit in place.
          next = prev.map((d) =>
            d.id === existing.id ? { ...record, id: existing.id, version: existing.version } : d
          )
          return next
        }
        if (existing && opts.publish) {
          // Supersede the currently active version; retain full history.
          next = prev.map((d) =>
            d.workflowKey === workflowKey && d.status === 'active' && !scheduled
              ? { ...d, status: 'superseded' as const, effectiveTo: today() }
              : d
          )
          // Drop the draft row being published.
          next = next.filter(
            (d) => !(d.id === existing.id && existing.status === 'draft')
          )
        }
        return [record, ...next]
      })

      append({
        actor,
        actorRole,
        company: draft.company,
        category: 'config',
        summary: opts.publish
          ? `Published ${draft.name} v${record.version}${scheduled ? ` (scheduled ${draft.effectiveFrom})` : ''}`
          : `Saved draft of ${draft.name}`,
        detail: opts.publish
          ? `${draft.stages.length} stage(s), effective ${draft.effectiveFrom}. Prior version retained; in-flight requests continue on their original definition.`
          : 'Draft saved — not executable until validated and activated.',
        refId: record.id,
      })
      toast.success(
        opts.publish
          ? scheduled
            ? `${draft.name} v${record.version} scheduled for ${draft.effectiveFrom}`
            : `${draft.name} v${record.version} published`
          : 'Draft saved'
      )
      return []
    },
    [definitions, append, actor, actorRole]
  )

  /** Activate an existing draft/scheduled definition — validation gated. */
  const activateDefinition = useCallback(
    (id: string) => {
      const def = definitions.find((d) => d.id === id)
      if (!def) return
      const errors = validateDefinition(def)
      if (errors.length > 0) {
        toast.error(`Activation blocked: ${errors[0]}`, {
          description:
            errors.length > 1 ? `${errors.length - 1} more validation issue(s) — open the designer to resolve.` : undefined,
        })
        return
      }
      setDefinitions((prev) =>
        prev.map((d) => {
          if (d.id === id) return { ...d, status: 'active' as const }
          if (d.workflowKey === def.workflowKey && d.status === 'active')
            return { ...d, status: 'superseded' as const, effectiveTo: today() }
          return d
        })
      )
      append({
        actor,
        actorRole,
        company: def.company,
        category: 'config',
        summary: `Activated ${def.name} v${def.version}`,
        detail: 'Validation passed — definition is now live for new transactions.',
        refId: def.id,
      })
      toast.success(`${def.name} v${def.version} activated`)
    },
    [definitions, append, actor, actorRole]
  )

  const deleteDefinition = useCallback(
    (id: string) => {
      const def = definitions.find((d) => d.id === id)
      if (!def) return
      if (def.status !== 'draft') {
        toast.error('Only drafts can be deleted — published versions are retained as history')
        return
      }
      setDefinitions((prev) => prev.filter((d) => d.id !== id))
      toast.success('Draft deleted')
    },
    [definitions]
  )

  return { definitions, saveDefinition, activateDefinition, deleteDefinition }
}

function seedVersions(defs: WorkflowDefinition[], key: string) {
  return defs.filter((d) => d.workflowKey === key)
}

export type DefinitionsStore = ReturnType<typeof useDefinitions>
