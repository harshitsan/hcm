import { branchCond } from './expr'
import { isContainer, makeId } from './model'
import type { Branch, Config, ContainerStep, Step, WorkflowDoc } from './model'
import { createBranch, getDef } from './registry'

export type InsertTarget = { branchId: string | 'root'; index: number }
export type ValidationIssue = { nodeId: string; message: string }

type StepLoc = { step: Step; siblings: Step[]; index: number }

function* walk(steps: Step[]): Generator<StepLoc> {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    yield { step, siblings: steps, index: i }
    if (isContainer(step)) for (const b of step.branches) yield* walk(b.steps)
  }
}

function* walkBranches(steps: Step[]): Generator<{ branch: Branch; container: ContainerStep; index: number }> {
  for (const { step } of walk(steps)) {
    if (isContainer(step)) {
      for (let i = 0; i < step.branches.length; i++) {
        yield { branch: step.branches[i], container: step, index: i }
      }
    }
  }
}

export function findStep(doc: WorkflowDoc, id: string): Step | null {
  for (const { step } of walk(doc.body)) if (step.id === id) return step
  return null
}

export function findBranch(doc: WorkflowDoc, branchId: string): Branch | null {
  for (const { branch } of walkBranches(doc.body)) if (branch.id === branchId) return branch
  return null
}

export function findParentContainer(doc: WorkflowDoc, branchId: string): ContainerStep | null {
  for (const { branch, container } of walkBranches(doc.body)) if (branch.id === branchId) return container
  return null
}

function locate(doc: WorkflowDoc, id: string): StepLoc | null {
  for (const loc of walk(doc.body)) if (loc.step.id === id) return loc
  return null
}

function stepsArray(doc: WorkflowDoc, branchId: string | 'root'): Step[] | null {
  if (branchId === 'root') return doc.body
  return findBranch(doc, branchId)?.steps ?? null
}

export function insertStep(doc: WorkflowDoc, target: InsertTarget, step: Step): WorkflowDoc {
  const next = structuredClone(doc)
  const arr = stepsArray(next, target.branchId)
  if (!arr) return doc
  const i = Math.max(0, Math.min(target.index, arr.length))
  arr.splice(i, 0, step)
  return next
}

export function removeStep(doc: WorkflowDoc, id: string): WorkflowDoc {
  const next = structuredClone(doc)
  const loc = locate(next, id)
  if (!loc) return doc
  loc.siblings.splice(loc.index, 1)
  return next
}

function refreshIds(step: Step): void {
  step.id = makeId('n')
  if (isContainer(step)) {
    for (const b of step.branches) {
      b.id = makeId('b')
      b.steps.forEach(refreshIds)
    }
  }
}

export function duplicateStep(doc: WorkflowDoc, id: string): WorkflowDoc {
  const next = structuredClone(doc)
  const loc = locate(next, id)
  if (!loc) return doc
  const copy = structuredClone(loc.step)
  refreshIds(copy)
  loc.siblings.splice(loc.index + 1, 0, copy)
  return next
}

export function moveStep(doc: WorkflowDoc, id: string, dir: 'up' | 'down'): WorkflowDoc {
  const next = structuredClone(doc)
  const loc = locate(next, id)
  if (!loc) return doc
  const j = loc.index + (dir === 'up' ? -1 : 1)
  if (j < 0 || j >= loc.siblings.length) return doc
  const [s] = loc.siblings.splice(loc.index, 1)
  loc.siblings.splice(j, 0, s)
  return next
}

export function updateStepConfig(doc: WorkflowDoc, id: string, patch: Config): WorkflowDoc {
  const next = structuredClone(doc)
  const target = next.trigger.id === id ? next.trigger : findStep(next, id)
  if (!target) return doc
  Object.assign(target.config, patch)
  return next
}

export function updateBranchConfig(doc: WorkflowDoc, branchId: string, patch: Config): WorkflowDoc {
  const next = structuredClone(doc)
  const branch = findBranch(next, branchId)
  if (!branch) return doc
  Object.assign(branch.config, patch)
  return next
}

export function toggleCollapse(doc: WorkflowDoc, id: string): WorkflowDoc {
  const next = structuredClone(doc)
  const step = findStep(next, id)
  if (!step || !isContainer(step)) return doc
  step.collapsed = !step.collapsed
  return next
}

export function setAllCollapsed(doc: WorkflowDoc, collapsed: boolean): WorkflowDoc {
  const next = structuredClone(doc)
  for (const { step } of walk(next.body)) if (isContainer(step)) step.collapsed = collapsed
  return next
}

export function addBranch(doc: WorkflowDoc, containerId: string): WorkflowDoc {
  const next = structuredClone(doc)
  const step = findStep(next, containerId)
  if (!step || !isContainer(step)) return doc
  const addable = getDef(step.kind).branchSpec?.addable
  if (!addable) return doc
  const branch = createBranch(addable.def)
  const at = addable.insertBeforeLast ? step.branches.length - 1 : step.branches.length
  step.branches.splice(at, 0, branch)
  return next
}

export function removeBranch(doc: WorkflowDoc, branchId: string): WorkflowDoc {
  const next = structuredClone(doc)
  for (const { branch, container, index } of walkBranches(next.body)) {
    if (branch.id !== branchId) continue
    const addable = getDef(container.kind).branchSpec?.addable
    if (!addable || branch.key !== addable.def.key) return doc
    container.branches.splice(index, 1)
    return next
  }
  return doc
}

/** Previous sibling of a step in its sequence, or null if it is first. */
export function findPrevSibling(doc: WorkflowDoc, id: string): Step | null {
  const loc = locate(doc, id)
  if (!loc || loc.index === 0) return null
  return loc.siblings[loc.index - 1]
}

/** True if the node (step or branch) sits inside a For / For Each body. */
export function isInsideLoopBody(doc: WorkflowDoc, id: string): boolean {
  function search(steps: Step[], inLoop: boolean): boolean | null {
    for (const s of steps) {
      if (s.id === id) return inLoop
      if (!isContainer(s)) continue
      const isLoop = s.kind === 'for' || s.kind === 'forEach'
      for (const b of s.branches) {
        if (b.id === id) return inLoop || isLoop
        const r = search(b.steps, inLoop || isLoop)
        if (r !== null) return r
      }
    }
    return null
  }
  return search(doc.body, false) ?? false
}

/** Names defined by Set Variable steps anywhere in the workflow. */
export function collectVarNames(doc: WorkflowDoc): string[] {
  const names = new Set<string>()
  for (const { step } of walk(doc.body)) {
    if (step.kind === 'setVariable' && typeof step.config.name === 'string' && step.config.name) {
      names.add(step.config.name)
    }
  }
  return [...names]
}

export function countChildren(step: Step): number {
  if (!isContainer(step)) return 0
  let n = 0
  for (const b of step.branches) for (const s of b.steps) n += 1 + countChildren(s)
  return n
}

export function validate(doc: WorkflowDoc): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const checkNode = (nodeId: string, kind: string, config: Config) => {
    const def = getDef(kind)
    for (const f of def.configFields) {
      if (!f.required) continue
      const v = config[f.key]
      if (v === undefined || v === null || v === '') {
        issues.push({ nodeId, message: `${f.label} is required` })
      }
    }
    for (const message of def.validateConfig?.(config) ?? []) {
      issues.push({ nodeId, message })
    }
  }
  checkNode(doc.trigger.id, doc.trigger.kind, doc.trigger.config)
  for (const { step } of walk(doc.body)) {
    checkNode(step.id, step.kind, step.config)
    if (isContainer(step)) {
      const spec = getDef(step.kind).branchSpec
      for (const b of step.branches) {
        const def = spec?.fixed.find(d => d.key === b.key) ?? spec?.addable?.def
        if (def?.conditional && !branchCond(b.config)) {
          issues.push({ nodeId: b.id, message: `${b.label}: condition is required` })
        }
      }
    }
  }
  return issues
}
