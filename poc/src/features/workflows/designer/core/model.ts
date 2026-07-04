export type Config = Record<string, unknown>

export type LeafKind = 'transform' | 'http' | 'log' | 'delay' | 'setVariable'
export type ContainerKind = 'tryCatch' | 'ifElse' | 'choiceWhen' | 'for' | 'forEach' | 'group'
export type StepKind = LeafKind | ContainerKind

export type TriggerNode = { id: string; kind: 'scheduler'; label: string; config: Config }

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
