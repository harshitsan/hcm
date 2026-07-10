/**
 * Flow-to-form link resolution (A7).
 *
 * A flow artifact is linked to a form when:
 *  1. It is attached to the form's target module.
 *  2. Its trigger label matches the form's submitEvent.
 *  3. It is effectively active at the company scope.
 */

import {
  isEffectivelyActive,
  type Artifact,
  type TargetModule,
} from './business-logic'

/**
 * Returns all flow artifacts that are linked to a form identified by its
 * target module + submit event string.
 */
export function linkedFlows(
  artifacts: Artifact[],
  module: TargetModule,
  submitEvent: string
): Artifact[] {
  return artifacts.filter((a) => {
    if (a.type !== 'flow') return false
    // Must be attached to the form's module.
    const attached = a.attachments.some((att) => att.module === module)
    if (!attached) return false
    // Must be effectively active at the company level.
    if (!isEffectivelyActive(a.scopes, 'company')) return false
    // Trigger event must match the form's submitEvent.
    if (a.definition.kind !== 'flow') return false
    return a.definition.doc.trigger.label === submitEvent
  })
}
