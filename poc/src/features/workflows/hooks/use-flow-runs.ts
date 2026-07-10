/**
 * Flow-run store (A7) — an external store (mirrors the pattern in
 * use-business-logic.ts) that holds FlowRun records created when a form is
 * submitted and a linked flow artifact matches.
 *
 * This store is module-level so that a Leave-route submit (or any other
 * route's submit) can push a run, and the Workflow Engine → Instances tab can
 * read it — without needing React context or prop-drilling.
 */

import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { isContainer, type Step } from '../designer/core/model'
import { linkedFlows } from '../data/flow-links'
import { getArtifacts } from './use-business-logic'
import type { TargetModule } from '../data/business-logic'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FlowRun {
  id: string
  artifactId: string
  artifactName: string
  module: TargetModule
  event: string
  /** Human-readable one-liner, e.g. 'Casual leave · 3 days'. */
  summary: string
  requester: string
  startedAt: string
  /** POC: runs always complete instantly. */
  status: 'completed'
  /** Flattened doc.body nodes, including branches from containers. */
  steps: Array<{ label: string; kind: string }>
}

// ─── Flat-step helper ─────────────────────────────────────────────────────────

/**
 * Flatten a WorkflowDoc body (Step[]) recursively into a simple
 * `{ label, kind }` list.  Container branches are unrolled in order so the
 * full step trail is always a flat sequence.
 */
function flattenSteps(steps: Step[]): Array<{ label: string; kind: string }> {
  const result: Array<{ label: string; kind: string }> = []
  for (const step of steps) {
    result.push({ label: step.label, kind: step.kind })
    if (isContainer(step)) {
      for (const branch of step.branches) {
        result.push(...flattenSteps(branch.steps))
      }
    }
  }
  return result
}

// ─── Store ───────────────────────────────────────────────────────────────────

let flowRunState: FlowRun[] = []
const flowRunListeners = new Set<() => void>()

function emitFlowRuns() {
  flowRunListeners.forEach((l) => l())
}

function subscribeFlowRuns(listener: () => void) {
  flowRunListeners.add(listener)
  return () => {
    flowRunListeners.delete(listener)
  }
}

function getFlowRunSnapshot() {
  return flowRunState
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * React hook — returns the current list of engine-linked flow runs.
 * Components on the Instances tab consume this.
 */
export function useFlowRuns(): { runs: FlowRun[] } {
  const runs = useSyncExternalStore(subscribeFlowRuns, getFlowRunSnapshot)
  return { runs }
}

/**
 * Plain function, callable from any form submit handler.
 *
 * 1. Reads the current artifact snapshot via `getArtifacts()`.
 * 2. Calls `linkedFlows` to find matching flow artifacts.
 * 3. Creates one FlowRun per match and pushes it into the store.
 * 4. Shows a sonner toast per run started.
 *
 * Returns the number of flows triggered (0 = silent).
 */
export function triggerFormFlows(input: {
  module: TargetModule
  event: string
  summary: string
  requester: string
}): number {
  const artifacts = getArtifacts()
  const matched = linkedFlows(artifacts, input.module, input.event)

  if (matched.length === 0) return 0

  const startedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const newRuns: FlowRun[] = matched.map((a) => {
    const doc = (a.definition as Extract<typeof a.definition, { kind: 'flow' }>).doc
    return {
      id: `fr-${crypto.randomUUID().slice(0, 8)}`,
      artifactId: a.id,
      artifactName: a.name,
      module: input.module,
      event: input.event,
      summary: input.summary,
      requester: input.requester,
      startedAt,
      status: 'completed',
      steps: flattenSteps(doc.body),
    }
  })

  flowRunState = [...newRuns, ...flowRunState]
  emitFlowRuns()

  for (const run of newRuns) {
    toast.success(
      `Flow "${run.artifactName}" started — see Workflow Engine → Requests`
    )
  }

  return newRuns.length
}
