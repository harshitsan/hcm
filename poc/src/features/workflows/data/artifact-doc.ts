/**
 * artifact-doc.ts — Task 3: Doc↔definition converters (WF-Unify)
 *
 * Two pure functions bridge the catalog artifact store and the Designer canvas:
 *
 *   artifactToDoc(artifact)            → WorkflowDoc  (open in canvas)
 *   docFromCanvas(doc, type)           → FromDocResult (save back to catalog)
 *
 * Per-kind mapping:
 *   flow           → structuredClone(def.doc) / structuredClone(doc)
 *   approver-chain → approvalTask leaves    / ChainStep[]
 *   decision-rule  → ruleCondition+ruleOutcome leaves / conditions+outcome
 *   7 payload kinds→ one artifactPayload step / ArtifactDefinition
 *
 * Lossy round-trip policy: refuse to save — docFromCanvas returns ok:false with
 * a human-readable message rather than silently dropping nodes.
 */

import type { WorkflowDoc, LeafStep } from '../designer/core/model'
import { makeId } from '../designer/core/model'
import { createStep, eventsForModule, getDef, sampleFor } from '../designer/core/registry'
import {
  ARTIFACT_TYPE_LABELS,
  RULE_OUTCOMES,
  type Artifact,
  type ArtifactDefinition,
  type ArtifactType,
  type ChainGroupPattern,
  type ChainStep,
  type RuleCondition,
  type RuleOutcome,
} from './business-logic'

/** Designer approvalMode option strings ↔ chain group patterns. */
const APPROVAL_MODE_BY_PATTERN: Record<ChainGroupPattern, string> = {
  'any-one': 'Parallel — any one may approve',
  'all-must': 'Parallel — all must approve',
}

function patternFromApprovalMode(mode: string): ChainGroupPattern | null {
  if (mode === APPROVAL_MODE_BY_PATTERN['any-one']) return 'any-one'
  if (mode === APPROVAL_MODE_BY_PATTERN['all-must']) return 'all-must'
  return null // 'Sequential' or unset
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type FromDocResult =
  | { ok: true; definition: ArtifactDefinition }
  | { ok: false; error: string }

// ─── Local helpers ────────────────────────────────────────────────────────────

/**
 * Yields every LeafStep in the top-level body array (does NOT recurse into
 * container branches — callers that need only the root-level flat steps use
 * this to validate a canonical structured doc).
 */
function walkTopLevelLeaves(doc: WorkflowDoc): LeafStep[] {
  const leaves: LeafStep[] = []
  for (const step of doc.body) {
    if (!('branches' in step)) {
      leaves.push(step as LeafStep)
    }
  }
  return leaves
}

/** Build a moduleEvent trigger literal mirroring seed.ts blankDoc(). */
function buildTrigger(module: string) {
  // Always use the REAL artifact module — never substitute a different module name.
  // The event falls back to the first entry in the module's event list, or a
  // generic sentinel if the list is somehow empty.
  const events = eventsForModule(module)
  const event = events[0] ?? 'Workflow triggered'
  const config = structuredClone(getDef('moduleEvent').defaultConfig)
  // defaultConfig hard-codes Leave Management — override with the artifact's
  // real module/event so the trigger pill and validateConfig stay truthful.
  config.module = module
  config.event = event
  config.samplePayload = sampleFor(event)
  return {
    id: makeId('t'),
    kind: 'moduleEvent' as const,
    label: event,
    config,
  }
}

// ─── PAYLOAD ARTIFACT TYPES (7 kinds) ────────────────────────────────────────

const PAYLOAD_KINDS = new Set<ArtifactType>([
  'custom-form',
  'checklist',
  'template',
  'alert',
  'setting',
  'category-list',
  'calendar',
])

// ─── artifactToDoc ────────────────────────────────────────────────────────────

/**
 * Convert any catalog Artifact into a WorkflowDoc suitable for opening on the
 * Designer canvas.
 *
 * Mutates nothing — always returns a fresh document.
 */
export function artifactToDoc(artifact: Artifact): WorkflowDoc {
  const { name, type, definition, targetModule } = artifact

  // ── flow ──────────────────────────────────────────────────────────────────
  if (type === 'flow') {
    const def = definition as Extract<ArtifactDefinition, { kind: 'flow' }>
    const doc = structuredClone(def.doc)
    doc.id = makeId('wf')   // fresh id so it never collides with Build-tab library ids
    doc.name = name
    // Preserve the stored doc.status so a live/published flow is not silently
    // reset to 'draft' on round-trip. Non-flow kinds keep forced 'draft' below
    // (their docs are ephemeral adapters and doc.status is inert for them).
    return doc
  }

  // ── approver-chain ────────────────────────────────────────────────────────
  if (type === 'approver-chain') {
    const def = definition as Extract<ArtifactDefinition, { kind: 'approver-chain' }>
    const trigger = buildTrigger(targetModule)
    const steps = [...def.steps].sort((a, b) => a.order - b.order).map((s) => {
      const step = createStep('approvalTask') as LeafStep
      step.label = `Step ${s.order} · ${s.approverRole}`
      const pattern =
        s.group !== undefined ? (def.patterns?.[s.group] ?? 'all-must') : null
      step.config = {
        approverRole: s.approverRole,
        slaHours: s.slaHours,
        approvalMode: pattern
          ? APPROVAL_MODE_BY_PATTERN[pattern]
          : 'Sequential',
        mockDecision: 'approved',
      }
      return step
    })
    return {
      id: makeId('wf'),
      name,
      status: 'draft',
      trigger,
      body: steps,
    }
  }

  // ── decision-rule ─────────────────────────────────────────────────────────
  if (type === 'decision-rule') {
    const def = definition as Extract<ArtifactDefinition, { kind: 'decision-rule' }>
    const trigger = buildTrigger(targetModule)
    const conditionSteps = def.conditions.map((c: RuleCondition) => {
      const step = createStep('ruleCondition') as LeafStep
      step.label = `${c.attribute} ${c.operator} ${c.value}`
      step.config = {
        attribute: c.attribute,
        operator: c.operator,
        value: c.value,
      }
      return step
    })
    const outcomeStep = createStep('ruleOutcome') as LeafStep
    outcomeStep.label = def.outcome
    outcomeStep.config = { outcome: def.outcome }
    return {
      id: makeId('wf'),
      name,
      status: 'draft',
      trigger,
      body: [...conditionSteps, outcomeStep],
    }
  }

  // ── 7 payload kinds ───────────────────────────────────────────────────────
  if (PAYLOAD_KINDS.has(type)) {
    const trigger = buildTrigger(targetModule)
    const step = createStep('artifactPayload') as LeafStep
    step.label = ARTIFACT_TYPE_LABELS[type]
    step.config = { definition: structuredClone(definition) }
    return {
      id: makeId('wf'),
      name,
      status: 'draft',
      trigger,
      body: [step],
    }
  }

  // Exhaustiveness guard — should never reach here with known ArtifactType
  throw new Error(`artifactToDoc: unhandled artifact type "${type}"`)
}

// ─── docFromCanvas ────────────────────────────────────────────────────────────

/**
 * Convert the current canvas WorkflowDoc back into an ArtifactDefinition for
 * saving to the catalog.
 *
 * Returns ok:false with a human-readable error whenever the canvas contents
 * don't match the expected structure for `type` — callers MUST NOT save in
 * that case. Version is NOT bumped (caller's concern).
 */
export function docFromCanvas(doc: WorkflowDoc, type: ArtifactType): FromDocResult {

  // ── flow ──────────────────────────────────────────────────────────────────
  if (type === 'flow') {
    return { ok: true, definition: { kind: 'flow', doc: structuredClone(doc) } }
  }

  // ── approver-chain ────────────────────────────────────────────────────────
  if (type === 'approver-chain') {
    const leaves = walkTopLevelLeaves(doc)
    const badStep = leaves.find((s) => s.kind !== 'approvalTask')
    if (badStep) {
      return {
        ok: false,
        error:
          `An approver-chain workflow can only contain Approval task steps — remove '${badStep.label}' or recreate this as a Process flow.`,
      }
    }
    // Also reject if there are container steps at the top level
    const hasContainers = doc.body.some((s) => 'branches' in s)
    if (hasContainers) {
      return {
        ok: false,
        error:
          'An approver-chain workflow can only contain Approval task steps — remove container blocks or recreate this as a Process flow.',
      }
    }
    if (leaves.length === 0) {
      return {
        ok: false,
        error:
          'An approver-chain workflow must contain at least one Approval task step.',
      }
    }
    // Rebuild parallel groups from each step's approvalMode: consecutive
    // steps sharing the same parallel mode collapse into one group.
    const steps: ChainStep[] = []
    const patterns: Record<number, ChainGroupPattern> = {}
    let nextGroup = 1
    leaves.forEach((s, i) => {
      const step: ChainStep = {
        order: i + 1,
        approverRole: String(s.config.approverRole ?? ''),
        slaHours: Number(s.config.slaHours ?? 0),
      }
      const pattern = patternFromApprovalMode(String(s.config.approvalMode ?? ''))
      if (pattern) {
        const prev = steps[i - 1]
        if (prev?.group !== undefined && patterns[prev.group] === pattern) {
          step.group = prev.group
        } else {
          step.group = nextGroup
          patterns[nextGroup] = pattern
          nextGroup += 1
        }
      }
      steps.push(step)
    })
    const hasGroups = Object.keys(patterns).length > 0
    return {
      ok: true,
      definition: {
        kind: 'approver-chain',
        steps,
        ...(hasGroups ? { patterns } : {}),
      },
    }
  }

  // ── decision-rule ─────────────────────────────────────────────────────────
  if (type === 'decision-rule') {
    const leaves = walkTopLevelLeaves(doc)
    // Check for containers
    const hasContainers = doc.body.some((s) => 'branches' in s)
    if (hasContainers) {
      return {
        ok: false,
        error:
          'A decision-rule workflow can only contain Rule condition and Rule outcome steps — remove container blocks or recreate this as a Process flow.',
      }
    }

    // Validate all steps are ruleCondition or ruleOutcome
    const invalidStep = leaves.find(
      (s) => s.kind !== 'ruleCondition' && s.kind !== 'ruleOutcome'
    )
    if (invalidStep) {
      return {
        ok: false,
        error:
          `A decision-rule workflow can only contain Rule condition and Rule outcome steps — remove '${invalidStep.label}' or recreate this as a Process flow.`,
      }
    }

    // Exactly one ruleOutcome (position is not enforced)
    const outcomeSteps = leaves.filter((s) => s.kind === 'ruleOutcome')
    if (outcomeSteps.length !== 1) {
      return {
        ok: false,
        error:
          `A decision-rule workflow must have exactly one Rule outcome step — found ${outcomeSteps.length}.`,
      }
    }
    const outcomeStep = outcomeSteps[0]
    const outcomeValue = String(outcomeStep.config.outcome ?? '')
    if (!(RULE_OUTCOMES as readonly string[]).includes(outcomeValue)) {
      return {
        ok: false,
        error: `Rule outcome '${outcomeValue}' is not a valid outcome — expected one of: ${RULE_OUTCOMES.join(', ')}.`,
      }
    }

    const conditionSteps = leaves.filter((s) => s.kind === 'ruleCondition')
    const conditions: RuleCondition[] = conditionSteps.map((s) => ({
      attribute: String(s.config.attribute ?? ''),
      operator: (s.config.operator ?? '=') as RuleCondition['operator'],
      value: String(s.config.value ?? ''),
    }))

    return {
      ok: true,
      definition: {
        kind: 'decision-rule',
        conditions,
        outcome: outcomeValue as RuleOutcome,
      },
    }
  }

  // ── 7 payload kinds ───────────────────────────────────────────────────────
  if (PAYLOAD_KINDS.has(type)) {
    const leaves = walkTopLevelLeaves(doc)
    const hasContainers = doc.body.some((s) => 'branches' in s)
    if (hasContainers || leaves.length !== 1) {
      return {
        ok: false,
        error:
          `A ${ARTIFACT_TYPE_LABELS[type]} workflow must contain exactly one Configuration step — found ${doc.body.length} step(s).`,
      }
    }
    const step = leaves[0]
    if (step.kind !== 'artifactPayload') {
      return {
        ok: false,
        error:
          `A ${ARTIFACT_TYPE_LABELS[type]} workflow must contain a Configuration step — found '${step.label}' instead.`,
      }
    }
    const definition = step.config.definition as ArtifactDefinition | null | undefined
    if (!definition || typeof definition !== 'object' || !('kind' in definition)) {
      return { ok: false, error: 'Configuration step is missing a valid definition payload.' }
    }
    if (definition.kind !== type) {
      return {
        ok: false,
        error: `Configuration payload kind '${definition.kind}' does not match artifact type '${type}'.`,
      }
    }
    return { ok: true, definition: structuredClone(definition) }
  }

  // Exhaustiveness guard
  return { ok: false, error: `docFromCanvas: unhandled artifact type "${type}"` }
}
