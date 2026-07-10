export type Config = Record<string, unknown>

/** HRMS action vocabulary — each kind is one registry entry (registry.ts). */
export type LeafKind =
  | 'approvalTask'
  | 'notify'
  | 'updateRecord'
  | 'generateDocument'
  | 'transform'
  | 'delay'
  | 'setVariable'
  | 'ruleCondition'
  | 'ruleOutcome'
  | 'artifactPayload'
export type ContainerKind = 'tryCatch' | 'ifElse' | 'choiceWhen' | 'for' | 'forEach' | 'group'
export type StepKind = LeafKind | ContainerKind

/** Flows start from an HRMS module event (e.g. "Leave request submitted"). */
export type TriggerNode = { id: string; kind: 'moduleEvent'; label: string; config: Config }

export type LeafStep = { id: string; kind: LeafKind; label: string; config: Config }

export type Branch = { id: string; key: string; label: string; config: Config; steps: Step[] }

export type ContainerStep = {
  id: string
  kind: ContainerKind
  label: string
  config: Config
  collapsed: boolean
  branches: Branch[]
}

export type Step = LeafStep | ContainerStep

export type WorkflowDoc = {
  id: string
  name: string
  status: 'draft' | 'active'
  trigger: TriggerNode
  body: Step[]
}

export function isContainer(s: Step): s is ContainerStep {
  return 'branches' in s
}

let counter = 0
export function makeId(prefix = 'n'): string {
  counter += 1
  return `${prefix}-${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
